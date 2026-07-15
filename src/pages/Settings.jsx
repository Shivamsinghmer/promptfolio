import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Zap, ZapOff, ToggleLeft, ToggleRight, RotateCcw, ShieldAlert, CheckCircle, Server } from 'lucide-react';

const ENV_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const MASKED_KEY = ENV_KEY
  ? `${ENV_KEY.slice(0, 8)}${'·'.repeat(20)}${ENV_KEY.slice(-4)}`
  : null;

export default function Settings() {
  const { settings, setSettings, resetState } = usePortfolio();
  const [resetDone, setResetDone] = useState(false);

  const handleToggleMock = () => {
    // Can only go live if an env key exists
    if (!ENV_KEY && settings.isMockMode) return;
    setSettings(prev => ({ ...prev, isMockMode: !prev.isMockMode }));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all allocations, history, and settings to defaults? This will erase your trade logs and custom contacts.")) {
      resetState();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  const isLive = !settings.isMockMode && !!ENV_KEY;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl text-white m-0">Settings</h2>
        <p className="text-white/60 text-sm mt-1">Configure your PromptFolio AI engine and manage portfolio data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Groq Connection Status Card */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xl space-y-5">
            <div className="flex items-center space-x-3 border-b border-border pb-4">
              <Server className="w-5 h-5 text-solana-purple" />
              <h3 className="text-lg font-semibold text-white m-0">Groq API Connection</h3>
            </div>

            {ENV_KEY ? (
              /* Key is set in .env.local */
              <div className="space-y-4">
                <div className="flex items-center space-x-3 px-4 py-3.5 bg-accent/5 border border-accent/20 rounded-xl">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] shrink-0 animate-pulse"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-accent m-0">API Key Detected</p>
                    <p className="text-[11px] text-white/50 font-mono mt-0.5 truncate">{MASKED_KEY}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent uppercase tracking-wider shrink-0">
                    Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="px-3 py-2.5 rounded-xl bg-background border border-border">
                    <p className="text-white/55 mb-0.5 text-[10px] font-medium">Model</p>
                    <p className="text-white font-mono font-semibold m-0">llama-3.3-70b-versatile</p>
                  </div>
                  <div className="px-3 py-2.5 rounded-xl bg-background border border-border">
                    <p className="text-white/55 mb-0.5 text-[10px] font-medium">Source</p>
                    <p className="text-white font-mono font-semibold m-0">.env.local</p>
                  </div>
                </div>

                <p className="text-[11px] text-white/35 m-0">
                  Your key is loaded from <code className="text-solana-purple bg-background px-1 py-0.5 rounded text-[10px]">VITE_GROQ_API_KEY</code> in <code className="text-solana-purple bg-background px-1 py-0.5 rounded text-[10px]">.env.local</code>.
                  It is never stored in localStorage or sent anywhere other than Groq's API.
                </p>
              </div>
            ) : (
              /* No key set */
              <div className="flex items-start space-x-3 px-4 py-3.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0 mt-1"></div>
                <div>
                  <p className="text-xs font-bold text-yellow-400 m-0">No API Key Found</p>
                  <p className="text-[11px] text-white/50 mt-1 m-0 leading-relaxed">
                    Add <code className="text-yellow-400 bg-background px-1 py-0.5 rounded">VITE_GROQ_API_KEY=gsk_...</code> to your <code className="text-yellow-400 bg-background px-1 py-0.5 rounded">.env.local</code> file and restart the dev server. The app is running in Mock AI Mode.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Mock AI Mode Toggle */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white m-0">Mock AI Mode</h3>
                <p className="text-xs text-white/50 m-0 max-w-sm">
                  Run the natural language parser offline using regex heuristics.
                  {ENV_KEY ? ' Toggle off to use the live Groq API.' : ' Add an API key to enable live mode.'}
                </p>
              </div>
              <button
                onClick={handleToggleMock}
                disabled={!ENV_KEY}
                className="focus:outline-none transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={!ENV_KEY ? 'Add a Groq API key to enable live mode' : undefined}
              >
                {settings.isMockMode ? (
                  <ToggleRight className="w-12 h-12 text-solana-purple" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-white/30" />
                )}
              </button>
            </div>

            <div className="bg-background border border-border rounded-xl p-4 flex items-start space-x-3 text-xs text-white/70">
              <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block mb-0.5">Mode Indicator</span>
                {isLive ? (
                  <span>
                    Currently in <strong className="text-accent">Live API Mode</strong>. Prompts route to <strong>llama-3.3-70b-versatile</strong> on Groq. Ensure your key has active credits.
                  </span>
                ) : (
                  <span>
                    Currently in <strong className="text-solana-purple">Mock Mode</strong>. Inputs like <em>"Send 20 USDC to Sarah"</em> or <em>"Rebalance: 50% SOL, 50% USDC"</em> execute simulated responses with zero network lag.
                  </span>
                )}
              </div>
            </div>

            {/* Live / Mock status pill */}
            <div className="flex items-center space-x-2">
              {isLive ? (
                <Zap className="w-4 h-4 text-accent" />
              ) : (
                <ZapOff className="w-4 h-4 text-white/30" />
              )}
              <span className={`text-xs font-semibold ${isLive ? 'text-accent' : 'text-white/40'}`}>
                {isLive ? 'Groq live requests active' : 'Using offline regex engine'}
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-red-500/20 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-red-500/20 pb-4">
              <RotateCcw className="w-5 h-5 text-red-400" />
              <h3 className="text-base font-semibold text-white m-0">Danger Zone</h3>
            </div>
            <p className="text-xs text-white/50 m-0">
              Reset the application state to clean default values. This will delete all simulated rebalances, send transactions, and restore holdings back to initial values.
            </p>
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 text-red-400 rounded-xl transition duration-200 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Portfolio State</span>
            </button>

            {resetDone && (
              <div className="flex items-center justify-center space-x-2 text-solana-green bg-solana-green/5 border border-solana-green/20 p-2.5 rounded-xl text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>State Reset Complete!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
