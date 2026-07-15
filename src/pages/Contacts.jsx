import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { Users, UserPlus, Send, Copy, Check, Search, X } from 'lucide-react';

export default function Contacts() {
  const { contacts, addContact } = usePortfolio();
  const navigate = useNavigate();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickSend = (contactName) => {
    navigate('/dashboard', { state: { prefill: `Send 20 USDC to ${contactName}` } });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !address) return;
    addContact(name, address);
    setName('');
    setAddress('');
    setShowAddModal(false);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white m-0">Contacts</h2>
          <p className="text-white/60 text-sm mt-1">Manage wallet addresses for quick payments and resolved transactions.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center space-x-2 py-3 px-5 bg-solana-purple hover:bg-solana-purple-hover text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition shadow-lg shadow-solana-purple/20 active:scale-98 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Search and Table */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
        {/* Search Input */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border focus:border-solana-purple/70 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
          />
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-white/50 uppercase tracking-wider">
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4">Solana Wallet Address</th>
                <th className="py-4 px-4">Added Date</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-white/40 text-xs">
                    No contacts found matching your search.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    className="border-b border-border/45 text-sm text-white/80 hover:bg-[#1C2335]/30 transition"
                  >
                    <td className="py-4 px-4 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-solana-purple/10 flex items-center justify-center font-bold text-solana-purple border border-solana-purple/20">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-white">{contact.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 font-mono text-xs text-white/70">
                        <span className="hidden sm:inline">{contact.address}</span>
                        <span className="sm:hidden">{`${contact.address.slice(0, 8)}...${contact.address.slice(-8)}`}</span>
                        <button
                          onClick={() => handleCopy(contact.id, contact.address)}
                          className="p-1 hover:bg-[var(--border)] text-white/40 hover:text-white rounded transition"
                          title="Copy Wallet Address"
                        >
                          {copiedId === contact.id ? (
                            <Check className="w-3.5 h-3.5 text-solana-green" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-white/50">{contact.addedDate}</td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleQuickSend(contact.name)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-solana-purple/10 hover:bg-solana-purple text-solana-purple hover:text-white border border-solana-purple/20 rounded-lg text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Quick Send</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CONTACT OVERLAY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-solana-purple" />
                <h3 className="text-lg font-bold text-white m-0">Add New Contact</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-[var(--border)]"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border focus:border-solana-purple rounded-xl px-4 py-3 text-sm text-white focus:outline-none placeholder-white/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Solana Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7xKXtg2CW87d97TX..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-background border border-border focus:border-solana-purple rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none placeholder-white/20"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-transparent text-white/60 hover:text-white text-xs font-semibold tracking-wider hover:bg-white/5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-solana-purple hover:bg-solana-purple-hover text-white text-xs font-semibold tracking-wider rounded-xl transition shadow-lg shadow-solana-purple/20 cursor-pointer"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
