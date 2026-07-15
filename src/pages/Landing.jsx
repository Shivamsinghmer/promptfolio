import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { ShieldCheck, Cpu, Wallet, AlertTriangle, ExternalLink, ChevronRight } from 'lucide-react';

import DottedBackground from '../components/DottedBackground';

// Phantom SVG logo
const PhantomLogo = () => (
  <svg width="20" height="20" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="128" height="128" rx="28" fill="#AB9FF2"/>
    <path d="M110.584 64.925H104.037C104.037 44.443 87.166 27.75 66.461 27.75C45.961 27.75 29.215 44.174 28.888 64.424C28.554 85.399 46.181 103 67.391 103C73.765 103 79.775 101.307 84.946 98.359C86.518 97.475 87.18 95.537 86.487 93.866C85.736 92.065 83.691 91.271 81.89 91.951C77.54 93.59 72.813 94.5 67.875 94.5C50.545 94.5 36.352 80.473 36.352 63.125C36.352 45.923 50.545 31.897 67.875 31.897C85.197 31.897 99.389 45.923 99.389 63.125V66.876C99.389 70.136 96.749 72.776 93.489 72.776C90.229 72.776 87.589 70.136 87.589 66.876V63.125C87.589 52.529 78.995 43.906 68.369 43.906C57.743 43.906 49.149 52.529 49.149 63.125C49.149 73.721 57.743 82.344 68.369 82.344C73.541 82.344 78.222 80.174 81.58 76.682C83.515 79.992 87.257 82.251 91.551 82.251C100.17 82.251 107.064 75.37 107.064 66.769V64.925H110.584Z" fill="white"/>
    <ellipse cx="68.375" cy="63.125" rx="12.044" ry="12.028" fill="white"/>
  </svg>
);

// Solflare SVG logo  
const SolflareLogo = () => (
  <svg width="20" height="20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="14" fill="#FC7227"/>
    <path d="M32 10L44 28H20L32 10Z" fill="white" fillOpacity="0.9"/>
    <path d="M20 28L32 46L44 28H20Z" fill="white" fillOpacity="0.6"/>
    <path d="M32 46L44 54H20L32 46Z" fill="white" fillOpacity="0.9"/>
  </svg>
);

// Google SVG logo
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function Landing() {
  const { user, login } = usePortfolio();
  const navigate = useNavigate();

  const [connecting, setConnecting] = useState(null); // 'phantom' | 'solflare' | null
  const [walletError, setWalletError] = useState(null);

  // Detect installed wallets
  const hasPhantom = typeof window !== 'undefined' && (window.phantom?.solana?.isPhantom || window.solana?.isPhantom);
  const hasSolflare = typeof window !== 'undefined' && window.solflare?.isSolflare;

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  // Connect Phantom
  const connectPhantom = async () => {
    setWalletError(null);
    setConnecting('phantom');
    try {
      const provider = window.phantom?.solana || window.solana;
      if (!provider) throw new Error('no_wallet');
      const resp = await provider.connect();
      const publicKey = resp.publicKey.toString();
      login('phantom', publicKey);
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'no_wallet') {
        setWalletError('phantom_not_installed');
      } else if (err.code === 4001) {
        setWalletError('user_rejected');
      } else {
        setWalletError('connect_failed');
      }
    } finally {
      setConnecting(null);
    }
  };

  // Connect Solflare
  const connectSolflare = async () => {
    setWalletError(null);
    setConnecting('solflare');
    try {
      if (!window.solflare?.isSolflare) throw new Error('no_wallet');
      await window.solflare.connect();
      if (!window.solflare.isConnected) throw new Error('connect_failed');
      const publicKey = window.solflare.publicKey.toString();
      login('solflare', publicKey);
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'no_wallet') {
        setWalletError('solflare_not_installed');
      } else if (err.code === 4001) {
        setWalletError('user_rejected');
      } else {
        setWalletError('connect_failed');
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleGoogleDemo = () => {
    login('google');
    navigate('/dashboard');
  };

  const walletErrorMessage = {
    phantom_not_installed: { text: 'Phantom is not installed.', link: 'https://phantom.app/', linkText: 'Get Phantom →' },
    solflare_not_installed: { text: 'Solflare is not installed.', link: 'https://solflare.com/', linkText: 'Get Solflare →' },
    user_rejected: { text: 'Connection rejected. Please approve the wallet request.', link: null },
    connect_failed: { text: 'Failed to connect. Please try again.', link: null },
  };

  return (
    <div className="relative w-full min-h-screen bg-background flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Dotted Background matrix (Originkit WebGL) */}
      <div className="absolute inset-0 z-0">
        <DottedBackground 
          frequency={1}
          speed={6}
          bgColor="#000000"
          colors={["#FFFFFF", "#E07000", "#000000"]}
          cellSize={1}
          gamma={4}
          paletteBias={10}
          useGlyphAtlas={true}
          characters="●○•·"
        />
        {/* Subtle dark gradient overlay to ensure card readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-[var(--background)] opacity-60"></div>
      </div>

      {/* Main Container */}
      <div className="relative max-w-md w-full text-center space-y-8 z-10">

        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold tracking-wider uppercase mx-auto shadow-sm">
          <Cpu className="w-3.5 h-3.5" />
          <span>Next-Gen Web3 Intent Parser</span>
        </div>

        {/* Branding */}
        <div className="space-y-3">
          <h1 className="font-serif italic text-6xl tracking-tight m-0 leading-none">
            <span className="text-white">Prompt</span><span className="text-primary">Folio</span>
          </h1>
          <p className="text-base text-white/75 font-medium leading-relaxed max-w-sm mx-auto">
            Talk to your portfolio. Invest, rebalance, and pay — in plain English.
          </p>
        </div>

        {/* Connect Card */}
        <div className="p-6 rounded-xl bg-card/90 border border-border shadow-2xl space-y-3 backdrop-blur-md">

          {/* Section: Web3 Wallets */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/55 font-semibold text-left pb-1 tracking-wide">
              Connect Solana Wallet
            </p>

            {/* Phantom */}
            <button
              onClick={connectPhantom}
              disabled={!!connecting}
              className="w-full flex items-center justify-between py-3.5 px-4 bg-[#AB9FF2]/10 hover:bg-[#AB9FF2]/15 border border-[#AB9FF2]/25 hover:border-[#AB9FF2]/50 text-white rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <PhantomLogo />
                <span>
                  {connecting === 'phantom' ? 'Connecting…' : 'Phantom Wallet'}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                {hasPhantom ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent">
                    Detected
                  </span>
                ) : (
                  <span className="text-[10px] text-white/30 font-medium">Not installed</span>
                )}
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition" />
              </div>
            </button>

            {/* Solflare */}
            <button
              onClick={connectSolflare}
              disabled={!!connecting}
              className="w-full flex items-center justify-between py-3.5 px-4 bg-[#FC7227]/10 hover:bg-[#FC7227]/15 border border-[#FC7227]/25 hover:border-[#FC7227]/50 text-white rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <SolflareLogo />
                <span>
                  {connecting === 'solflare' ? 'Connecting…' : 'Solflare Wallet'}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                {hasSolflare ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent">
                    Detected
                  </span>
                ) : (
                  <span className="text-[10px] text-white/30 font-medium">Not installed</span>
                )}
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition" />
              </div>
            </button>
          </div>

          {/* Error Banner */}
          {walletError && walletErrorMessage[walletError] && (
            <div className="flex items-start space-x-2 px-3 py-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-yellow-400 text-xs text-left animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span>{walletErrorMessage[walletError].text}</span>
                {walletErrorMessage[walletError].link && (
                  <a
                    href={walletErrorMessage[walletError].link}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 underline underline-offset-2 hover:text-yellow-300 inline-flex items-center space-x-0.5"
                  >
                    <span>{walletErrorMessage[walletError].linkText}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center space-x-3 py-1">
            <div className="flex-1 h-px bg-[var(--border)]"></div>
            <span className="text-[10px] text-white/25 font-semibold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-[var(--border)]"></div>
          </div>

          {/* Google Demo */}
          <button
            onClick={handleGoogleDemo}
            disabled={!!connecting}
            className="w-full flex items-center justify-center space-x-2.5 py-3 px-4 bg-background hover:bg-card border border-border hover:border-white/10 text-white/70 hover:text-white rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <GoogleLogo />
            <span>Continue with Google</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--border)] text-white/40 ml-1">Demo</span>
          </button>
        </div>

        {/* Footnotes */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center space-x-2 text-xs text-white/40">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Non-custodial. Your keys stay in your wallet.</span>
          </div>
          <p className="text-[11px] text-white/25">Powered by Groq AI · Simulated Solana Transactions</p>
        </div>
      </div>
    </div>
  );
}
