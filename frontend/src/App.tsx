import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TrendingUp, Activity, DollarSign, Users } from 'lucide-react';
import MarketList from './components/MarketList';
import SignalList from './components/SignalList';
import AnalystLeaderboard from './components/AnalystLeaderboard';
import MarketDetailPage from './pages/MarketDetailPage';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    // Special case: Keep 'Markets' active for details page
    if (path === '/' && currentPath.startsWith('/market/')) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Prediction Copilot</h1>
                <p className="text-sm text-blue-300">Solana Prediction Market Intelligence</p>
              </div>
            </Link>
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !rounded-xl !transition-all !duration-200" />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 bg-black/10 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <TabLink
              to="/"
              active={isActive('/')}
              icon={<Activity className="w-4 h-4" />}
              label="Markets"
            />
            <TabLink
              to="/signals"
              active={isActive('/signals')}
              icon={<DollarSign className="w-4 h-4" />}
              label="Signals"
            />
            <TabLink
              to="/analysts"
              active={isActive('/analysts')}
              icon={<Users className="w-4 h-4" />}
              label="Analysts"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<MarketList />} />
          <Route path="/market/:id" element={<MarketDetailPage />} />
          <Route path="/signals" element={<SignalList />} />
          <Route path="/analysts" element={<AnalystLeaderboard />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <p>Built on Solana • Powered by Polymarket & Pyth</p>
            <p>Devnet • MBC Hackathon</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TabLink({ active, to, icon, label }: { active: boolean; to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 border-b-2 ${active
        ? 'text-blue-400 border-blue-400 bg-blue-500/10'
        : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5'
        }`}
    >
      {icon}
      {label}
    </Link>
  );
}

export default App;
