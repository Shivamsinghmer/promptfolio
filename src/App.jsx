import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Tracking from './pages/Tracking';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';

// Route Guard component
function ProtectedRoute({ children }) {
  const { user } = usePortfolio();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <LayoutWrapper>{children}</LayoutWrapper>;
}

// Layout Wrapper for pages that require sidebar
function LayoutWrapper({ children }) {
  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar (Desktop left / Mobile bottom & header) */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto px-4 md:px-8 py-6 pt-20 md:pt-6 pb-24 md:pb-6 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}

function AppContent() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Protected Dashboard Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracking"
        element={
          <ProtectedRoute>
            <Tracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <Contacts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <PortfolioProvider>
      <Router>
        <AppContent />
      </Router>
    </PortfolioProvider>
  );
}
