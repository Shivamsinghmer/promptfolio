import React, { createContext, useContext, useState, useEffect } from 'react';

const PortfolioContext = createContext();

const MOCK_TOKEN_PRICES = {
  SOL: 138.06,
  USDC: 1.00,
  JUP: 1.016,
  RENDER: 7.615,
};

const INITIAL_HOLDINGS = [
  { token: "SOL",    amount: 12.4,  valueUSD: 1712,  change24h: 3.1, allocation: 40 },
  { token: "USDC",   amount: 1284,  valueUSD: 1284,  change24h: 0.0,  allocation: 30 },
  { token: "JUP",    amount: 842,   valueUSD: 856,   change24h: -1.2, allocation: 20 },
  { token: "RENDER", amount: 56.2,  valueUSD: 428,   change24h: 5.6,  allocation: 10 }
];

const INITIAL_REBALANCES = [
  {
    id: "reb-1",
    date: "2026-07-03",
    prompt: "Rebalance: 40% SOL, 30% USDC, 20% JUP, 10% RENDER",
    tokens: ["SOL", "USDC", "JUP", "RENDER"],
    status: "Success"
  },
  {
    id: "reb-2",
    date: "2026-06-20",
    prompt: "Keep 50% in USDC and split the rest between SOL and JUP",
    tokens: ["USDC", "SOL", "JUP"],
    status: "Success"
  },
  {
    id: "reb-3",
    date: "2026-06-05",
    prompt: "Rebalance to 60% SOL and 40% USDC",
    tokens: ["SOL", "USDC"],
    status: "Success"
  },
  {
    id: "reb-4",
    date: "2026-05-18",
    prompt: "Swap half of RENDER for USDC",
    tokens: ["RENDER", "USDC"],
    status: "Success"
  },
  {
    id: "reb-5",
    date: "2026-04-30",
    prompt: "Initial portfolio setup: 30% SOL, 40% USDC, 30% JUP",
    tokens: ["SOL", "USDC", "JUP"],
    status: "Success"
  }
];

const INITIAL_TRADES = [
  { id: "tr-1", type: "Swap", desc: "USDC -> SOL", amount: "150 USDC", date: "2026-07-03", fee: "$0.02" },
  { id: "tr-2", type: "Swap", desc: "RENDER -> SOL", amount: "80 RENDER", date: "2026-06-20", fee: "$0.03" },
  { id: "tr-3", type: "Send", desc: "USDC to Alex", amount: "20 USDC", date: "2026-06-18", fee: "$0.01" },
  { id: "tr-4", type: "Swap", desc: "JUP -> USDC", amount: "300 JUP", date: "2026-06-05", fee: "$0.02" },
  { id: "tr-5", type: "Send", desc: "SOL to Sarah", amount: "1.5 SOL", date: "2026-05-25", fee: "$0.01" }
];

const INITIAL_CONTACTS = [
  { id: "c-1", name: "Alex", address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", addedDate: "2026-07-01" },
  { id: "c-2", name: "Sarah", address: "4vMsoUT2BWatFweudnQM1xedRLfJgJ7hsWhcDtZkY2hf", addedDate: "2026-06-15" },
  { id: "c-3", name: "Mike", address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWh", addedDate: "2026-05-20" }
];

export const PortfolioProvider = ({ children }) => {
  // Load initial states from localStorage if available
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pf_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [holdings, setHoldings] = useState(() => {
    const saved = localStorage.getItem('pf_holdings');
    return saved ? JSON.parse(saved) : INITIAL_HOLDINGS;
  });

  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('pf_trades');
    return saved ? JSON.parse(saved) : INITIAL_TRADES;
  });

  const [rebalanceHistory, setRebalanceHistory] = useState(() => {
    const saved = localStorage.getItem('pf_rebalance_history');
    return saved ? JSON.parse(saved) : INITIAL_REBALANCES;
  });

  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('pf_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  const [settings, setSettings] = useState(() => {
    // Always use VITE_GROQ_API_KEY from environment as the primary key source.
    // localStorage may hold a mock-mode toggle override, but the key itself
    // is never stored or read from localStorage.
    const envKey = import.meta.env.VITE_GROQ_API_KEY || '';
    const saved = localStorage.getItem('pf_settings');
    const savedParsed = saved ? JSON.parse(saved) : {};
    return {
      groqApiKey: envKey,
      // If env key exists, default to live mode (isMockMode = false).
      // Allow the user to override with the toggle, but only when a key exists.
      isMockMode: envKey ? (savedParsed.isMockMode ?? false) : true,
    };
  });

  const [chatHistory, setChatHistory] = useState([
    {
      id: "welcome",
      sender: "assistant",
      text: "Welcome to PromptFolio! I am your natural language Web3 portfolio assistant. Try asking me to rebalance your holdings, send funds, or analyze your allocations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('pf_user', user ? JSON.stringify(user) : '');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pf_holdings', JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    localStorage.setItem('pf_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('pf_rebalance_history', JSON.stringify(rebalanceHistory));
  }, [rebalanceHistory]);

  useEffect(() => {
    localStorage.setItem('pf_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    // Only persist the mock-mode toggle. The API key lives exclusively in .env.local.
    localStorage.setItem('pf_settings', JSON.stringify({ isMockMode: settings.isMockMode }));
  }, [settings]);

  // Calculated values
  const totalValue = holdings.reduce((sum, h) => sum + h.valueUSD, 0);

  const login = (provider, walletAddress = null) => {
    const isWeb3 = provider === 'phantom' || provider === 'solflare';
    const displayAddress = walletAddress
      ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
      : '0xPF...8Sol';
    const seed = walletAddress ? walletAddress.slice(0, 8) : 'explorer';
    const mockUser = {
      name: isWeb3
        ? (provider === 'phantom' ? 'Phantom Wallet' : 'Solflare Wallet')
        : 'Demo Explorer',
      handle: isWeb3 ? displayAddress : 'explorer@gmail.com',
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`,
      walletAddress: walletAddress ? displayAddress : '0xPF...8Sol',
      fullAddress: walletAddress || null,
      walletType: provider,   // 'phantom' | 'solflare' | 'google'
      isWeb3: isWeb3,
    };
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  // Rebalance Execution
  const executeRebalance = (allocations, rawPrompt) => {
    const newHoldings = holdings.map(h => {
      const allocation = allocations[h.token] !== undefined ? allocations[h.token] : 0;
      const valueUSD = Math.round((totalValue * allocation) / 100);
      const amount = Number((valueUSD / (MOCK_TOKEN_PRICES[h.token] || 1)).toFixed(4));
      return {
        ...h,
        allocation,
        valueUSD,
        amount
      };
    });

    // filter tokens with non-zero allocation or change
    const tokensAffected = Object.keys(allocations).filter(t => allocations[t] > 0);

    const rebalanceId = `reb-${Date.now()}`;
    const newRebalance = {
      id: rebalanceId,
      date: new Date().toISOString().split('T')[0],
      prompt: rawPrompt,
      tokens: tokensAffected,
      status: "Success"
    };

    const newTradeId = `tr-${Date.now()}`;
    const newTrade = {
      id: newTradeId,
      type: "Rebalance",
      desc: "Portfolio Reallocation",
      amount: tokensAffected.join(', '),
      date: new Date().toISOString().split('T')[0],
      fee: "$0.04"
    };

    setHoldings(newHoldings);
    setRebalanceHistory(prev => [newRebalance, ...prev]);
    setTrades(prev => [newTrade, ...prev]);
  };

  // Send Execution
  const executeSend = (amount, token, recipient) => {
    // Deduct from holdings
    const targetToken = token.toUpperCase();
    const newHoldings = holdings.map(h => {
      if (h.token === targetToken) {
        const newAmount = Math.max(0, h.amount - amount);
        const newValueUSD = Math.round(newAmount * (MOCK_TOKEN_PRICES[targetToken] || 1));
        return {
          ...h,
          amount: Number(newAmount.toFixed(4)),
          valueUSD: newValueUSD
        };
      }
      return h;
    });

    // Recalculate allocation percentages
    const newTotalValue = newHoldings.reduce((sum, h) => sum + h.valueUSD, 0);
    const finalHoldings = newHoldings.map(h => ({
      ...h,
      allocation: newTotalValue > 0 ? Math.round((h.valueUSD / newTotalValue) * 100) : 0
    }));

    const tradeId = `tr-${Date.now()}`;
    const newTrade = {
      id: tradeId,
      type: "Send",
      desc: `${targetToken} to ${recipient}`,
      amount: `${amount} ${targetToken}`,
      date: new Date().toISOString().split('T')[0],
      fee: "$0.01"
    };

    setHoldings(finalHoldings);
    setTrades(prev => [newTrade, ...prev]);
  };

  // Add Contact
  const addContact = (name, address) => {
    const newContact = {
      id: `c-${Date.now()}`,
      name,
      address,
      addedDate: new Date().toISOString().split('T')[0]
    };
    setContacts(prev => [...prev, newContact]);
  };

  // Clear or Reset State to Defaults
  const resetState = () => {
    setHoldings(INITIAL_HOLDINGS);
    setTrades(INITIAL_TRADES);
    setRebalanceHistory(INITIAL_REBALANCES);
    setContacts(INITIAL_CONTACTS);
    setChatHistory([
      {
        id: "welcome",
        sender: "assistant",
        text: "Welcome to PromptFolio! Portfolio state has been reset. Try asking me to rebalance or send.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <PortfolioContext.Provider value={{
      user,
      login,
      logout,
      holdings,
      totalValue,
      change24h: 2.4, // Keep mock 24h change stable
      trades,
      rebalanceHistory,
      contacts,
      settings,
      setSettings,
      chatHistory,
      setChatHistory,
      executeRebalance,
      executeSend,
      addContact,
      resetState
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => useContext(PortfolioContext);
