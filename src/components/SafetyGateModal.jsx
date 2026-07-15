import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ShieldCheck, AlertTriangle, HelpCircle, Loader2, ArrowRight, Wallet, CheckCircle2 } from 'lucide-react';

const COLORS = ['var(--primary)', 'var(--accent)', '#FF9F43', '#FF5252', '#00CFE8'];

export default function SafetyGateModal({ parsedIntent, onClose, onExecute }) {
  const { holdings, contacts } = usePortfolio();
  const [step, setStep] = useState('review'); // 'review' | 'executing' | 'done'
  const [executingMsg, setExecutingMsg] = useState('');

  const {
    intent,
    confidence = 1.0,
    parsed_summary = '',
    allocations = {},
    recipient = '',
    amount = 0,
    currency = '',
    estimated_fees = '$0.02',
    estimated_slippage = '0.3%',
    warnings = [],
    explanation = ''
  } = parsedIntent;

  // Resolve contact wallet address
  const resolvedContact = contacts.find(c => c.name.toLowerCase() === recipient.toLowerCase());
  const resolvedAddress = resolvedContact 
    ? resolvedContact.address 
    : (recipient.length > 20 ? recipient : "Unknown — new address");

  // Format data for Recharts donut charts
  const currentChartData = holdings.map(h => ({
    name: h.token,
    value: h.allocation
  }));

  const proposedChartData = holdings.map(h => {
    const target = allocations[h.token] !== undefined ? allocations[h.token] : 0;
    return {
      name: h.token,
      value: target
    };
  }).filter(d => d.value > 0);

  // If a token is proposed that is not in current holdings, add it
  Object.entries(allocations).forEach(([token, pct]) => {
    if (!holdings.some(h => h.token === token) && pct > 0) {
      proposedChartData.push({ name: token, value: pct });
    }
  });

  const handleApprove = () => {
    setStep('executing');
    
    // Simulate transaction stages
    setExecutingMsg("Analyzing route liquidity on Orca & Raydium...");
    setTimeout(() => {
      setExecutingMsg("Splitting trade weights via Jupiter Aggregator...");
      setTimeout(() => {
        setExecutingMsg("Executing swaps & broadcasting signature...");
        setTimeout(() => {
          onExecute(parsedIntent);
          setStep('done');
        }, 800);
      }, 700);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-background/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Step 1: Review Panel */}
        {step === 'review' && (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-6 h-6 text-solana-purple" />
                <div>
                  <h3 className="text-lg font-bold text-white m-0">Review Before Executing</h3>
                  <p className="text-xs text-white/50 m-0">Intent Engine Parsing Confidence: <span className="font-mono font-bold text-white">{(confidence * 100).toFixed(0)}%</span></p>
                </div>
              </div>

              {/* Confidence Badge */}
              {confidence < 0.75 && (
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/25 rounded-lg text-yellow-400 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Low Confidence Warning</span>
                </div>
              )}
            </div>

            {/* Explanation card */}
            <div className="bg-background/80 border border-border p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">AI Translation</span>
              <p className="text-sm text-white/95 leading-relaxed m-0">{explanation}</p>
            </div>

            {/* Warnings Container */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((warn, wIdx) => (
                  <div key={wIdx} className="flex items-start space-x-2 px-3.5 py-2.5 bg-yellow-500/5 border border-yellow-500/20 text-yellow-300 text-xs rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Core Rebalance Display */}
            {intent === 'rebalance' && (
              <div className="space-y-4">
                {/* Donut Charts side-by-side */}
                <div className="grid grid-cols-2 gap-4 bg-background/30 border border-border/50 p-4 rounded-xl">
                  {/* Current */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-white/50 uppercase font-semibold tracking-wider mb-2">Current Allocation</span>
                    <div className="h-28 w-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={currentChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={45}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {currentChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* legend */}
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {currentChartData.map((d, i) => (
                        <div key={i} className="flex items-center space-x-1 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                          <span className="text-white/60 font-semibold">{d.name} ({d.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Proposed */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-solana-purple uppercase font-semibold tracking-wider mb-2">Proposed Allocation</span>
                    <div className="h-28 w-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={proposedChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={45}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {proposedChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* legend */}
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {proposedChartData.map((d, i) => (
                        <div key={i} className="flex items-center space-x-1 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                          <span className="text-white/60 font-semibold">{d.name} ({d.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Change table */}
                <div className="bg-background/50 border border-border/55 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-3 px-4 py-2 bg-[var(--border)]/40 text-[10px] font-semibold text-white/50 uppercase">
                    <span>Token</span>
                    <span className="text-center">Shift Target</span>
                    <span className="text-right">Allocation Drift</span>
                  </div>
                  <div className="divide-y divide-[var(--border)]/45">
                    {holdings.map((h) => {
                      const prevAlloc = h.allocation;
                      const nextAlloc = allocations[h.token] !== undefined ? allocations[h.token] : 0;
                      const diff = nextAlloc - prevAlloc;

                      return (
                        <div key={h.token} className="grid grid-cols-3 px-4 py-2.5 text-xs font-semibold text-white/80">
                          <span className="font-mono">{h.token}</span>
                          <span className="text-center font-mono">{prevAlloc}% <ArrowRight className="w-3 h-3 inline mx-1 text-white/40" /> {nextAlloc}%</span>
                          <span className={`text-right font-mono ${diff > 0 ? 'text-solana-green' : diff < 0 ? 'text-red-400' : 'text-white/40'}`}>
                            {diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '0%'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Core Send Display */}
            {intent === 'send' && (
              <div className="space-y-4">
                <div className="bg-background/50 border border-border/70 p-5 rounded-xl space-y-4">
                  {/* Recipient box */}
                  <div className="flex items-start justify-between border-b border-border/40 pb-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider block">Recipient Contact</span>
                      <span className="text-sm font-bold text-white flex items-center space-x-1.5">
                        <Wallet className="w-4 h-4 text-solana-purple shrink-0" />
                        <span>{resolvedContact ? resolvedContact.name : "Unknown Contact"}</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--border)] border border-border/80 text-white/60">
                      {resolvedContact ? "RESOLVED" : "NEW WALLET"}
                    </span>
                  </div>

                  {/* Wallet address */}
                  <div>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Destination Address</span>
                    <span className="text-xs font-mono text-white/80 select-all">{resolvedAddress}</span>
                  </div>

                  {/* Transfer Details */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                    <div>
                      <span className="text-[10px] text-white/40 uppercase tracking-wider block">Transfer Amount</span>
                      <span className="text-lg font-bold text-solana-purple font-mono">{amount} {currency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 uppercase tracking-wider block">Value (USD)</span>
                      <span className="text-lg font-bold text-white/90 font-mono">
                        ${(amount * (currency.toUpperCase() === 'SOL' ? 138 : 1)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-3.5 py-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs font-bold leading-relaxed">
                  Transfers are irreversible. Verify the address before approving.
                </div>
              </div>
            )}

            {/* Core Unknown Display */}
            {intent === 'unknown' && (
              <div className="p-6 text-center space-y-4">
                <HelpCircle className="w-12 h-12 text-yellow-500 mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base">Unable to Execute Action</h4>
                  <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
                    This instruction is unrecognized or holds low parsing confidence. Please click cancel and rephrase your command.
                  </p>
                </div>
              </div>
            )}

            {/* Fee rows */}
            {intent !== 'unknown' && (
              <div className="border-t border-border pt-4 space-y-2 text-xs text-white/60">
                <div className="flex items-center justify-between font-mono">
                  <span>Estimated DEX Network Fee:</span>
                  <span className="text-white/90 font-semibold">{estimated_fees}</span>
                </div>
                {intent === 'rebalance' && (
                  <div className="flex items-center justify-between font-mono">
                    <span>Estimated Slippage Limit:</span>
                    <span className="text-white/90 font-semibold">{estimated_slippage}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={onClose}
                className="px-5 py-3 bg-transparent hover:bg-white/5 border border-transparent hover:border-border text-white/60 hover:text-white text-xs font-bold tracking-wider uppercase rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              {intent !== 'unknown' && (
                <button
                  onClick={handleApprove}
                  className="px-6 py-3 bg-solana-green hover:bg-solana-green-hover text-background text-xs font-bold tracking-wider uppercase rounded-xl transition shadow-lg shadow-solana-green/20 cursor-pointer"
                >
                  Approve & Execute
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Executing Swap Panel */}
        {step === 'executing' && (
          <div className="p-12 flex flex-col items-center justify-center space-y-6 text-center">
            <Loader2 className="w-12 h-12 text-solana-purple animate-spin" />
            <div className="space-y-2 animate-pulse">
              <h4 className="text-lg font-bold text-white">Simulating Solana Blockchain Execution</h4>
              <p className="text-sm text-white/50 font-medium max-w-sm mx-auto">{executingMsg}</p>
            </div>
            <div className="w-48 h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full bg-solana-purple w-2/3 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Step 3: Done Panel */}
        {step === 'done' && (
          <div className="p-12 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-solana-green/15 flex items-center justify-center border border-solana-green/40 shadow-lg shadow-solana-green/10">
              <CheckCircle2 className="w-9 h-9 text-solana-green" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-white">Transaction Success</h4>
              <p className="text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
                Signature successfully registered and verified. State metrics updated.
              </p>
            </div>
            <div className="text-[10px] font-mono px-3 py-1.5 bg-background border border-border rounded-lg text-white/50 select-all cursor-pointer">
              5K19Xp4A...vRe9Lp29
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
