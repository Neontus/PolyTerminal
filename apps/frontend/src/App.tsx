import { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TrendingUp, Activity, DollarSign, Users } from 'lucide-react';
import MarketList from './components/MarketList';
import SignalList from './components/SignalList';
import AnalystLeaderboard from './components/AnalystLeaderboard';

function App() {
  const [activeTab, setActiveTab] = useState<'markets' | 'signals' | 'analysts'>('markets');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Prediction Copilot</h1>
                <p className="text-sm text-blue-300">Solana Prediction Market Intelligence</p>
              </div>
            </div>
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !rounded-xl !transition-all !duration-200" />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 bg-black/10 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <TabButton
              active={activeTab === 'markets'}
              onClick={() => setActiveTab('markets')}
              icon={<Activity className="w-4 h-4" />}
              label="Markets"
            />
            <TabButton
              active={activeTab === 'signals'}
              onClick={() => setActiveTab('signals')}
              icon={<DollarSign className="w-4 h-4" />}
              label="Signals"
            />
            <TabButton
              active={activeTab === 'analysts'}
              onClick={() => setActiveTab('analysts')}
              icon={<Users className="w-4 h-4" />}
              label="Analysts"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'markets' && <MarketList />}
        {activeTab === 'signals' && <SignalList />}
        {activeTab === 'analysts' && <AnalystLeaderboard />}
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

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 border-b-2 ${active
          ? 'text-blue-400 border-blue-400 bg-blue-500/10'
          : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
