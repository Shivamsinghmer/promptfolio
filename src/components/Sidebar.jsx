import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart, Users, Settings, LogOut, Wallet, Zap } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

// Small badge showing wallet type
function WalletBadge({ walletType }) {
  if (walletType === 'phantom') {
    return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary uppercase tracking-wider">Phantom</span>;
  }
  if (walletType === 'solflare') {
    return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent uppercase tracking-wider">Solflare</span>;
  }
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--border)] border border-border text-white/40 uppercase tracking-wider">Demo</span>;
}

export default function Sidebar() {
  const { user, logout } = usePortfolio();

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tracking', path: '/tracking', icon: LineChart },
    { name: 'Contacts', path: '/contacts', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* MOBILE TOP HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-md border-b border-border px-4 flex items-center justify-between z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-black shadow-lg shadow-primary/20">
            PF
          </div>
          <span className="font-bold text-white text-lg tracking-wider">PromptFolio</span>
        </div>
        <div className="flex items-center space-x-2">
          <WalletBadge walletType={user.walletType} />
          <div className="flex items-center space-x-1.5 px-2 py-1.5 bg-background border border-border rounded-lg">
            {user.isWeb3 ? (
              <Zap className="w-3 h-3 text-primary" />
            ) : (
              <Wallet className="w-3 h-3 text-primary" />
            )}
            <span className="text-xs font-mono text-white/80">{user.walletAddress}</span>
          </div>
          <button 
            onClick={logout} 
            className="p-1.5 text-white/60 hover:text-red-400 hover:bg-[var(--border)]/50 rounded-lg transition"
            title="Disconnect Wallet"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border z-30 justify-between shrink-0 h-full">
        {/* Top Logo */}
        <div>
          <div className="p-6 flex items-center space-x-3 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-extrabold text-black text-xl shadow-lg shadow-primary/30">
              PF
            </div>
            <div>
              <h1 className="font-extrabold text-white tracking-widest text-lg m-0 leading-tight">PromptFolio</h1>
              <span className="text-[10px] text-primary font-mono uppercase tracking-wider">Solana AI Web3</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 font-medium text-sm group ${
                      isActive
                        ? 'bg-primary/10 text-primary border-l-2 border-primary'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Disconnect */}
        <div className="p-4 border-t border-border/50 space-y-3">
          <div className="flex items-center space-x-3 bg-background/80 p-3 rounded-xl border border-border/50">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-9 h-9 rounded-full bg-[var(--border)]" 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 mb-0.5">
                <p className="text-sm font-semibold text-white truncate m-0">{user.name}</p>
                <WalletBadge walletType={user.walletType} />
              </div>
              <div className="flex items-center space-x-1 text-xs text-white/50 font-mono">
                {user.isWeb3 && <Zap className="w-2.5 h-2.5 text-accent shrink-0" />}
                <span className="truncate">{user.walletAddress}</span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition duration-200 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect Wallet</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2 z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-3 rounded-lg transition duration-200 ${
                  isActive ? 'text-primary' : 'text-white/50 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
