import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { generateMonthlyReportInsight } from '../services/aiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Activity, RotateCcw, Calendar, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';

// Mock 30-day history data (dates relative to July 2026)
const MOCK_30D_HISTORY = [
  { date: 'Jun 15', portfolioValue: 3810, solPrice: 122 },
  { date: 'Jun 18', portfolioValue: 3920, solPrice: 125 },
  { date: 'Jun 21', portfolioValue: 3880, solPrice: 123 },
  { date: 'Jun 24', portfolioValue: 4010, solPrice: 128 },
  { date: 'Jun 27', portfolioValue: 4150, solPrice: 132 },
  { date: 'Jun 30', portfolioValue: 4090, solPrice: 130 },
  { date: 'Jul 03', portfolioValue: 4210, solPrice: 134 },
  { date: 'Jul 06', portfolioValue: 4180, solPrice: 133 },
  { date: 'Jul 09', portfolioValue: 4320, solPrice: 139 },
  { date: 'Jul 12', portfolioValue: 4250, solPrice: 136 },
  { date: 'Jul 15', portfolioValue: 4280.50, solPrice: 138.06 }
];

// Mock monthly data details
const MOCK_MONTHLY_REPORTS = [
  {
    month: "June 2026",
    tradesCount: 8,
    performance: "+4.2%",
    fees: "$0.18",
    drift: "2.1%",
    chartData: [
      { name: 'SOL', Start: 35, End: 40 },
      { name: 'USDC', Start: 35, End: 30 },
      { name: 'JUP', Start: 20, End: 20 },
      { name: 'RENDER', Start: 10, End: 10 }
    ],
    trades: [
      { date: "June 28", desc: "Swap USDC -> SOL", amount: "1.2 SOL ($165)", status: "Success" },
      { date: "June 18", desc: "Send USDC to Alex", amount: "20 USDC ($20)", status: "Success" },
      { date: "June 10", desc: "Swap RENDER -> JUP", amount: "120 JUP ($122)", status: "Success" }
    ]
  },
  {
    month: "May 2026",
    tradesCount: 12,
    performance: "-1.8%",
    fees: "$0.26",
    drift: "4.8%",
    chartData: [
      { name: 'SOL', Start: 30, End: 35 },
      { name: 'USDC', Start: 40, End: 35 },
      { name: 'JUP', Start: 20, End: 20 },
      { name: 'RENDER', Start: 10, End: 10 }
    ],
    trades: [
      { date: "May 25", desc: "Send SOL to Sarah", amount: "1.5 SOL ($202)", status: "Success" },
      { date: "May 18", desc: "Swap USDC -> JUP", amount: "300 JUP ($305)", status: "Success" },
      { date: "May 02", desc: "Swap JUP -> USDC", amount: "200 USDC ($200)", status: "Success" }
    ]
  },
  {
    month: "April 2026",
    tradesCount: 6,
    performance: "+8.7%",
    fees: "$0.14",
    drift: "1.5%",
    chartData: [
      { name: 'SOL', Start: 25, End: 30 },
      { name: 'USDC', Start: 45, End: 40 },
      { name: 'JUP', Start: 20, End: 20 },
      { name: 'RENDER', Start: 10, End: 10 }
    ],
    trades: [
      { date: "April 28", desc: "Swap USDC -> RENDER", amount: "15 RENDER ($114)", status: "Success" },
      { date: "April 15", desc: "Buy SOL via USDC", amount: "2.1 SOL ($280)", status: "Success" },
      { date: "April 05", desc: "Initial portfolio setup", amount: "All tokens", status: "Success" }
    ]
  }
];

export default function Tracking() {
  const { totalValue, trades, rebalanceHistory, settings } = usePortfolio();
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [aiInsights, setAiInsights] = useState({});
  const [loadingInsights, setLoadingInsights] = useState({});

  // Get total trades dynamically
  const displayTradesCount = trades.length + 19; // baseline 24 offset

  // Days since last rebalance logic
  const getDaysSinceLastRebalance = () => {
    if (rebalanceHistory.length === 0) return 'N/A';
    const lastRebDate = new Date(rebalanceHistory[0].date);
    const currentDate = new Date('2026-07-15'); // Locked current time in mockup
    const diffTime = Math.abs(currentDate - lastRebDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  };

  const handleToggleAccordion = async (index, monthName, tradesData) => {
    if (expandedMonth === index) {
      setExpandedMonth(null);
      return;
    }

    setExpandedMonth(index);

    // Call Groq API and cache the result if not already present
    if (!aiInsights[monthName]) {
      setLoadingInsights(prev => ({ ...prev, [monthName]: true }));
      try {
        const insight = await generateMonthlyReportInsight(monthName, tradesData, settings);
        setAiInsights(prev => ({ ...prev, [monthName]: insight }));
      } catch (err) {
        console.error("Failed to load monthly insight:", err);
        setAiInsights(prev => ({ ...prev, [monthName]: "Unable to generate AI analysis. Check your settings API key." }));
      } finally {
        setLoadingInsights(prev => ({ ...prev, [monthName]: false }));
      }
    }
  };

  // Custom styling for chart tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/90 border border-border p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold text-white/50 mb-2">{label}</p>
          {payload.map((p, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
              <span className="text-white/70">{p.name}:</span>
              <span className="font-mono font-bold text-white">
                {p.name === 'Portfolio Value' ? `$${p.value.toLocaleString()}` : `$${p.value}`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl text-white m-0">Performance & Analytics</h2>
        <p className="text-white/60 text-sm mt-1">Detailed telemetry tracking portfolio asset allocations, growth performance, and trade histories.</p>
      </div>

      {/* Stats Bar — single panel, not identical cards */}
      <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="px-6 py-5 space-y-1.5">
            <span className="text-xs text-white/50 font-medium block">Portfolio Value</span>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl font-bold text-white font-mono">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-xs font-bold text-accent flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +12.4% <span className="text-white/40 font-normal ml-0.5">30d</span>
              </span>
            </div>
          </div>
          <div className="px-6 py-5 space-y-1.5">
            <span className="text-xs text-white/50 font-medium block">Trades Executed</span>
            <span className="text-2xl font-bold text-white font-mono">{displayTradesCount}</span>
          </div>
          <div className="px-6 py-5 space-y-1.5">
            <span className="text-xs text-white/50 font-medium block">Last Rebalance</span>
            <span className="text-2xl font-bold text-white/90 font-mono">{getDaysSinceLastRebalance()}</span>
          </div>
        </div>
      </div>

      {/* Main Performance Chart */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
        <h3 className="text-base font-semibold text-white mb-6">Portfolio Growth vs. SOL Performance</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_30D_HISTORY} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line yAxisId="left" type="monotone" dataKey="portfolioValue" name="Portfolio Value" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 6 }} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="solPrice" name="SOL Price" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Reports Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-white mb-2 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Monthly Portfolio Reports</span>
          </h3>

          <div className="space-y-3">
            {MOCK_MONTHLY_REPORTS.map((report, idx) => {
              const isOpen = expandedMonth === idx;
              return (
                <div key={idx} className="rounded-xl bg-card border border-border overflow-hidden transition-all duration-300 shadow-md">
                  {/* Accordion Trigger */}
                  <button
                    onClick={() => handleToggleAccordion(idx, report.month, report.trades)}
                    className="w-full p-4 flex items-center justify-between bg-card hover:bg-background/60 transition text-left cursor-pointer"
                  >
                    <div className="grid grid-cols-4 gap-3 flex-1 mr-4">
                      <div>
                        <span className="text-[10px] text-white/50 block">Month</span>
                        <span className="text-sm font-bold text-white">{report.month}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/50 block">Performance</span>
                        <span className={`text-sm font-bold ${report.performance.startsWith('+') ? 'text-accent' : 'text-red-400'}`}>{report.performance}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/50 block">Trades</span>
                        <span className="text-sm font-bold text-white">{report.tradesCount} executed</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/50 block">Fees Paid</span>
                        <span className="text-sm font-bold text-white/80 font-mono">{report.fees}</span>
                      </div>
                    </div>
                    <div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="p-4 border-t border-border/50 bg-card/40 space-y-4">
                      {/* AI Monthly Insight Card */}
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                        <div className="flex items-center space-x-2 text-primary font-semibold text-xs uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                          <span>PromptFolio AI Monthly Review</span>
                        </div>
                        {loadingInsights[report.month] ? (
                          <div className="flex items-center space-x-2 py-1 text-white/50 text-xs">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            <span>Querying Groq for insights...</span>
                          </div>
                        ) : (
                          <p className="text-xs text-white/80 italic m-0 leading-relaxed">
                            "{aiInsights[report.month]}"
                          </p>
                        )}
                      </div>

                      {/* Trade list and bar chart grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Start vs End bar chart */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-white/55 font-semibold block">Allocation Drift (Start vs. End)</span>
                          <div className="h-40 w-full bg-background/70 border border-border/40 rounded-xl p-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={report.chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '10px' }} />
                                <Bar dataKey="Start" fill="var(--border)" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="End" fill="var(--primary)" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Trade log table */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-white/55 font-semibold block">Monthly Activity Log</span>
                          <div className="overflow-x-auto bg-background/50 border border-border/40 rounded-xl">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-border/50 text-white/30 uppercase font-semibold">
                                  <th className="py-2 px-3">Date</th>
                                  <th className="py-2 px-3">Action</th>
                                  <th className="py-2 px-3 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.trades.map((t, tIdx) => (
                                  <tr key={tIdx} className="border-b border-border/20 text-white/70 hover:text-white">
                                    <td className="py-2 px-3 font-mono text-[10px]">{t.date}</td>
                                    <td className="py-2 px-3">{t.desc}</td>
                                    <td className="py-2 px-3 text-right font-mono">{t.amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Summary Stats */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-card border border-border text-center space-y-1">
              <span className="text-[10px] text-white/50 block font-medium">Total Fees</span>
              <span className="text-lg font-bold text-white font-mono">$0.58</span>
              <span className="text-[10px] text-white/35 block">All time</span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center space-y-1">
              <span className="text-[10px] text-white/50 block font-medium">Avg Return</span>
              <span className="text-lg font-bold text-accent font-mono">+3.7%</span>
              <span className="text-[10px] text-white/35 block">Per month</span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center space-y-1">
              <span className="text-[10px] text-white/50 block font-medium">Win Rate</span>
              <span className="text-lg font-bold text-primary font-mono">67%</span>
              <span className="text-[10px] text-white/35 block">Months</span>
            </div>
          </div>
        </div>

        {/* Rebalance History Timeline */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-white mb-2 flex items-center space-x-2">
            <RotateCcw className="w-4 h-4 text-accent" />
            <span>Rebalance Timeline</span>
            <span className="ml-auto text-[10px] text-white/30 font-normal font-mono">{rebalanceHistory.length} events</span>
          </h3>

          <div className="rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
            {/* Compact header */}
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Recent Rebalances</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent/10 border border-accent/20 text-accent uppercase">Live</span>
            </div>

            {/* Scrollable timeline list */}
            <div className="overflow-y-auto max-h-[460px]">
              <div className="p-4 space-y-3">
                {rebalanceHistory.map((history, idx) => (
                  <div key={history.id || idx} className="flex items-start space-x-3">
                    {/* Timeline dot */}
                    <div className={`w-6 h-6 rounded-full shrink-0 border-2 flex items-center justify-center mt-0.5 ${
                      idx === 0 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border bg-card'
                    }`}>
                      <RotateCcw className={`w-3 h-3 ${idx === 0 ? 'text-primary animate-spin-slow' : 'text-white/30'}`} />
                    </div>
                    {/* Content card */}
                    <div className="flex-1 bg-background/50 border border-border/50 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/40 font-mono">{history.date}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-accent/10 border border-accent/20 text-accent">
                          {history.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/85 italic m-0 leading-snug">
                        "{history.prompt}"
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {history.tokens.map((token, tIdx) => (
                          <span key={tIdx} className="px-1.5 py-0.5 rounded bg-card border border-border/60 text-[9px] text-white/50 font-semibold font-mono uppercase">
                            {token}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
