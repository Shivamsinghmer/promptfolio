import React, { useState, useEffect, useRef } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { parseIntent, generatePostExecutionMessage, askAdvisor } from '../services/aiService';
import SafetyGateModal from '../components/SafetyGateModal';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Send, Sparkles, MessageSquare, TrendingUp, HelpCircle, X, ChevronRight, CornerDownLeft, Info, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const COLORS = ['var(--primary)', 'var(--accent)', '#FF9F43', '#FF5252', '#00CFE8'];

export default function Dashboard() {
  const {
    holdings,
    totalValue,
    change24h,
    chatHistory,
    setChatHistory,
    executeRebalance,
    executeSend,
    settings
  } = usePortfolio();

  const location = useLocation();
  const [inputVal, setInputVal] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState(null); // For retry functionality
  const [activeParsedIntent, setActiveParsedIntent] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Advisor Mini-chat States
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [advisorInput, setAdvisorInput] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorChat, setAdvisorChat] = useState([
    { role: 'assistant', text: 'Hi! I am your AI Portfolio Advisor. Ask me anything about your current allocations, risk parameters, or yield opportunities.' }
  ]);

  const chatEndRef = useRef(null);
  const advisorEndRef = useRef(null);

  // Handle Quick Send Prefill redirection state
  useEffect(() => {
    if (location.state?.prefill) {
      setInputVal(location.state.prefill);
      // Clean location state to avoid prefilling again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Scroll chats to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isParsing]);

  useEffect(() => {
    advisorEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [advisorChat, advisorLoading]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handlePromptSubmit = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    
    const promptToParse = customPrompt || inputVal;
    if (!promptToParse.trim()) return;

    setInputVal('');
    setErrorPrompt(null);
    setIsParsing(true);

    // Add user prompt to chat
    const userMsgId = `user-${Date.now()}`;
    setChatHistory(prev => [...prev, {
      id: userMsgId,
      sender: 'user',
      text: promptToParse,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      const result = await parseIntent(promptToParse, settings);
      setIsParsing(false);

      // Append parsed chip to chat history
      setChatHistory(prev => [...prev, {
        id: `chip-${Date.now()}`,
        sender: 'assistant_chip',
        intent: result.intent,
        summary: result.parsed_summary,
        confidence: result.confidence,
        rawResult: result, // store for retry or executing
        originalPrompt: promptToParse
      }]);

      // Automatically pop safety gate modal if actionable
      setActiveParsedIntent({ ...result, originalPrompt: promptToParse });

    } catch (err) {
      console.error("Failed to parse intent:", err);
      setIsParsing(false);
      setErrorPrompt(promptToParse);
      
      setChatHistory(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'assistant_error',
        text: "Couldn't parse your intent. Please try rephrasing.",
        originalPrompt: promptToParse
      }]);
    }
  };

  const handleRetry = () => {
    if (errorPrompt) {
      handlePromptSubmit(null, errorPrompt);
    }
  };

  const handleExecute = async (parsedIntent) => {
    // 1. Trigger actual state updates
    if (parsedIntent.intent === 'rebalance') {
      executeRebalance(parsedIntent.allocations, parsedIntent.originalPrompt);
    } else if (parsedIntent.intent === 'send') {
      executeSend(parsedIntent.amount, parsedIntent.currency, parsedIntent.recipient);
    }

    // 2. Fetch post-execution AI confirmation message
    try {
      const aiResponse = await generatePostExecutionMessage(parsedIntent, settings);
      
      setChatHistory(prev => [...prev, {
        id: `assistant-msg-${Date.now()}`,
        sender: 'assistant',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.error("Failed to generate AI confirmation message:", err);
      setChatHistory(prev => [...prev, {
        id: `assistant-msg-err-${Date.now()}`,
        sender: 'assistant',
        text: `Transaction completed successfully! Holdings updated. (${parsedIntent.parsed_summary})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    // 3. Show Success Toast
    setToastMessage(`✓ ${parsedIntent.parsed_summary}`);
    setActiveParsedIntent(null);
  };

  // Advisor submit
  const handleAdvisorSubmit = async (e) => {
    e.preventDefault();
    if (!advisorInput.trim()) return;

    const userQuestion = advisorInput;
    setAdvisorInput('');
    setAdvisorChat(prev => [...prev, { role: 'user', text: userQuestion }]);
    setAdvisorLoading(true);

    try {
      const response = await askAdvisor(userQuestion, holdings, settings);
      setAdvisorChat(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (err) {
      console.error("Failed to query advisor:", err);
      setAdvisorChat(prev => [...prev, { role: 'assistant', text: "I'm having trouble analyzing your portfolio right now. Please verify your Groq API key in Settings." }]);
    } finally {
      setAdvisorLoading(false);
    }
  };

  const currentChartData = holdings.map(h => ({
    name: h.token,
    value: h.allocation
  })).filter(h => h.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 pb-16 md:pb-0 h-full">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-fade-in bg-solana-green/10 border border-solana-green/45 text-solana-green px-5 py-3.5 rounded-xl shadow-xl flex items-center space-x-2 backdrop-blur-md">
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Left Column (60% equivalent to 6 cols) */}
      <div className="lg:col-span-6 flex flex-col min-h-[500px] md:h-full gap-4">
        
        {/* Chat History Panel */}
        <div className="flex-1 bg-card/75 border border-border rounded-2xl p-4 overflow-y-auto space-y-4 shadow-xl">
          {chatHistory.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex justify-end animate-fade-in">
                  <div className="max-w-[85%] bg-solana-purple text-white px-4 py-3 rounded-2xl rounded-tr-none text-sm font-medium shadow-md shadow-solana-purple/10">
                    <p className="m-0 leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] text-white/50 block text-right mt-1.5 font-mono">{msg.timestamp}</span>
                  </div>
                </div>
              );
            }

            if (msg.sender === 'assistant_chip') {
              // Parse color depending on intent
              const isSend = msg.intent === 'send';
              const isRebalance = msg.intent === 'rebalance';
              const isUnknown = msg.intent === 'unknown';
              const isQuery = msg.intent === 'query';

              return (
                <div key={msg.id} className="flex flex-col items-start space-y-2 max-w-[85%] animate-fade-in">
                  <div className="p-4 bg-background border border-border rounded-2xl space-y-3 w-full shadow-inner">
                    <div className="flex items-center justify-between">
                      {/* Intent badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isRebalance ? 'bg-solana-purple/15 text-solana-purple border border-solana-purple/35' :
                        isSend ? 'bg-solana-green/15 text-solana-green border border-solana-green/35' :
                        isQuery ? 'bg-blue-500/15 text-blue-400 border border-blue-500/35' :
                        'bg-yellow-500/15 text-yellow-400 border border-yellow-500/35'
                      }`}>
                        {msg.intent}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">Confidence: {(msg.confidence * 100).toFixed(0)}%</span>
                    </div>

                    <p className="text-xs font-semibold text-white/90 m-0">{msg.summary}</p>
                    
                    {/* Action buttons embedded in chat */}
                    {!isQuery && !isUnknown && (
                      <button
                        onClick={() => setActiveParsedIntent({ ...msg.rawResult, originalPrompt: msg.originalPrompt })}
                        className="flex items-center space-x-1.5 py-1.5 px-3 bg-solana-purple hover:bg-solana-purple-hover text-white text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer"
                      >
                        <span>Open Safety Gate</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            if (msg.sender === 'assistant_error') {
              return (
                <div key={msg.id} className="flex items-start space-x-2 max-w-[85%] animate-fade-in">
                  <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-400 rounded-2xl space-y-3 w-full">
                    <div className="flex items-center space-x-2 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>PARSING ERROR</span>
                    </div>
                    <p className="text-xs m-0 leading-relaxed">{msg.text}</p>
                    <button
                      onClick={handleRetry}
                      className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                      Retry Parse
                    </button>
                  </div>
                </div>
              );
            }

            // Normal assistant message
            return (
              <div key={msg.id} className="flex justify-start items-start space-x-2.5 animate-fade-in">
                {/* PF Avatar */}
                <div className="w-8 h-8 rounded-full bg-solana-purple text-white flex items-center justify-center font-bold text-xs shadow-md shadow-solana-purple/20 shrink-0 border border-solana-purple/10">
                  PF
                </div>
                <div className="max-w-[80%] bg-[var(--border)]/55 border border-border/40 text-white/90 px-4 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                  <p className="m-0">{msg.text}</p>
                  <span className="text-[10px] text-white/40 block mt-1.5 font-mono">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}

          {/* AI Parsing Loading bubble */}
          {isParsing && (
            <div className="flex justify-start items-center space-x-2.5 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-solana-purple text-white flex items-center justify-center font-bold text-xs shrink-0">
                PF
              </div>
              <div className="bg-[var(--border)]/30 border border-border/30 text-white/50 px-4 py-3.5 rounded-2xl rounded-tl-none text-xs flex items-center space-x-2">
                <Loader2 className="w-3.5 h-3.5 text-solana-purple animate-spin" />
                <span>Parsing your intent with Groq...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Example Prompt Chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Rebalance: 50% SOL, 30% USDC, 20% JUP', value: 'Rebalance: 50% SOL, 30% USDC, 20% JUP' },
            { label: 'Send 20 USDC to Alex', value: 'Send 20 USDC to Alex' },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setInputVal(value)}
              className="px-3 py-1.5 bg-card hover:bg-primary/5 border border-border hover:border-primary/30 text-xs text-white/60 hover:text-white/90 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer font-mono"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Large Input Bar */}
        <form onSubmit={handlePromptSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isParsing}
            placeholder="What would you like to do? e.g. Keep 40% in USDC and split the rest across AI tokens"
            className="w-full bg-card border border-border focus:border-solana-purple rounded-xl pl-4 pr-14 py-4 text-sm text-white placeholder-white/30 focus:outline-none shadow-xl disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isParsing}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-solana-purple disabled:bg-[var(--border)] hover:bg-solana-purple-hover text-white rounded-xl transition disabled:text-white/20 cursor-pointer"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

      {/* Right Column — single full-height flex panel, no scroll */}
      <div className="lg:col-span-4 flex flex-col min-h-[500px] md:h-full">

        {/* Unified panel */}
        <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-card border border-border shadow-xl overflow-hidden">

          {/* Balance + Donut (fixed height) */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="space-y-0.5">
              <span className="text-xs text-white/55 font-medium block">Holdings</span>
              <span className="text-2xl font-extrabold text-white font-mono tracking-tight">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-center space-x-1 text-xs font-bold text-solana-green">
                <TrendingUp className="w-3 h-3" />
                <span>+{change24h}% <span className="text-white/45 font-normal text-[10px]">24h</span></span>
              </div>
            </div>
            <div className="h-16 w-16 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={currentChartData} cx="50%" cy="50%" innerRadius={16} outerRadius={28} paddingAngle={1} dataKey="value">
                    {currentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table section header (fixed) */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
            <h3 className="text-xs font-semibold text-white/80 m-0">Allocations</h3>
            <span className="text-[10px] text-white/45 font-mono">{holdings.length} assets</span>
          </div>

          {/* Table column headers (fixed) */}
          <div className="px-5 shrink-0 border-b border-border/50">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="text-[10px] font-semibold text-white/55 uppercase tracking-wider">
                  <th className="py-2.5 w-[35%]">Token</th>
                  <th className="py-2.5 w-[25%] text-right">Holdings</th>
                  <th className="py-2.5 w-[25%] text-right">Value</th>
                  <th className="py-2.5 w-[15%] text-right">Target</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Scrollable rows — grows to fill available space */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5">
            <table className="w-full text-left border-collapse table-fixed">
              <tbody>
                {holdings.map((h, index) => (
                  <tr key={h.token} className="text-xs text-white/80 border-b border-border/20 hover:bg-white/[0.02] transition">
                    <td className="py-3 w-[35%] overflow-hidden truncate">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="font-bold text-white">{h.token}</span>
                        <span className={`text-[9px] font-bold font-mono px-1 rounded-sm ${h.change24h >= 0 ? 'bg-solana-green/10 text-solana-green' : 'bg-red-500/10 text-red-400'}`}>
                          {h.change24h >= 0 ? `+${h.change24h}%` : `${h.change24h}%`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 w-[25%] text-right font-mono text-white/50 text-[11px] overflow-hidden truncate">{h.amount.toLocaleString()}</td>
                    <td className="py-3 w-[25%] text-right font-mono text-white font-semibold overflow-hidden truncate">${h.valueUSD.toLocaleString()}</td>
                    <td className="py-3 w-[15%] text-right font-mono text-solana-purple font-bold overflow-hidden truncate">{h.allocation}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Advisor — pinned to bottom */}
          <div className="shrink-0 border-t border-border p-4">
            {!showAdvisor ? (
              <button
                onClick={() => setShowAdvisor(true)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-solana-purple/10 hover:bg-solana-purple text-solana-purple hover:text-white border border-solana-purple/20 rounded-xl transition duration-200 text-xs font-bold tracking-wider uppercase cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask PromptFolio Advisor</span>
              </button>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-solana-purple animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">PromptFolio Advisor</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowAdvisor(false);
                      setAdvisorChat([{ role: 'assistant', text: 'Hi! I am your AI Portfolio Advisor. Ask me anything about your current allocations, risk parameters, or yield opportunities.' }]);
                    }}
                    className="p-1 hover:bg-[var(--border)] rounded-md text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-2 bg-background/60 border border-border/60 p-2.5 rounded-xl">
                  {advisorChat.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[92%] p-2 rounded-xl text-[11px] leading-relaxed font-medium ${
                        msg.role === 'user'
                          ? 'bg-solana-purple text-white rounded-tr-none'
                          : 'bg-card border border-border text-white/90 rounded-tl-none'
                      }`}>
                        <p className="m-0">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {advisorLoading && (
                    <div className="flex items-center space-x-1.5 text-white/40 text-[10px]">
                      <Loader2 className="w-3 h-3 text-solana-purple animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  )}
                  <div ref={advisorEndRef} />
                </div>
                <form onSubmit={handleAdvisorSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    value={advisorInput}
                    onChange={(e) => setAdvisorInput(e.target.value)}
                    disabled={advisorLoading}
                    placeholder="Is my portfolio too risky?"
                    className="w-full bg-background border border-border focus:border-solana-purple/70 rounded-xl pl-3 pr-9 py-2 text-xs text-white focus:outline-none placeholder-white/20"
                  />
                  <button
                    type="submit"
                    disabled={!advisorInput.trim() || advisorLoading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-solana-purple hover:bg-solana-purple-hover text-white rounded-lg transition disabled:bg-white/5 disabled:text-white/20 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Safety Gate Overlay */}
      {activeParsedIntent && (
        <SafetyGateModal
          parsedIntent={activeParsedIntent}
          onClose={() => setActiveParsedIntent(null)}
          onExecute={handleExecute}
        />
      )}

    </div>
  );
}
