import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Lock, Unlock, Activity, ExternalLink, Plus } from 'lucide-react';
import { usePolymarket } from '../hooks/usePolymarket';
import { usePythSignals } from '../hooks/usePythSignals';
import { useWhaleMovements } from '../hooks/useWhaleMovements';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MarketList() {
    const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
    const { markets, loading: marketsLoading } = usePolymarket();
    const { signals } = usePythSignals();
    const { movements } = useWhaleMovements();
    const [filter, setFilter] = useState('All Categories');

    // Whale Config State
    const [whaleInput, setWhaleInput] = useState('');
    const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleAddWhale = async () => {
        if (!whaleInput) return;
        try {
            await axios.post(`${API_URL}/api/config/whales`, {
                addresses: [whaleInput] // In a real app we'd merge, here we just push single for demo
            });
            setWhaleInput('');
            setConfigStatus('success');
            setTimeout(() => setConfigStatus('idle'), 3000);
        } catch (err) {
            console.error(err);
            setConfigStatus('error');
        }
    };

    // Combine data
    const enrichedMarkets = useMemo(() => {
        return markets.map(market => {
            // Find related Pyth signals
            // Simple keyword matching for hackathon
            const marketSignals = signals.filter(s => {
                const keyword = s.marketId.split('/')[0]; // e.g. BTC from BTC/USD
                // Map common symbols to words found in questions
                const mappings: Record<string, string[]> = {
                    'BTC': ['Bitcoin', 'BTC'],
                    'ETH': ['Ethereum', 'Ether', 'ETH'],
                    'SOL': ['Solana', 'SOL']
                };
                const keywords = mappings[keyword] || [keyword];
                return keywords.some(k => market.question.includes(k));
            });

            // Find related movements (mock movements have 'marketId' that currently won't match real Gamma IDs easily)
            // But for demo our movements are generated with random market names.
            // Let's just blindly attach "recent movements" to the top markets to simulate activity for the demo.
            // Or better: filter movements that match the question string if we updated the generator.
            // Generator makes questions like "Will Bitcoin..." so string match works.
            const marketMovements = movements.filter(m =>
                market.question.includes(m.marketQuestion.substring(0, 10))
            );

            return {
                ...market,
                signals: marketSignals,
                movements: marketMovements
            };
        });
    }, [markets, signals, movements]);

    const filteredMarkets = filter === 'All Categories'
        ? enrichedMarkets
        : enrichedMarkets.filter(m => m.category === filter);

    if (marketsLoading) {
        return <div className="text-white text-center py-20">Loading Markets...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Live Markets</h2>
                    <p className="text-gray-400 mt-1">Browse prediction markets with AI-powered signals</p>
                </div>
                <div className="flex gap-4 items-center">
                    {/* Whale Config Input */}
                    <div className="hidden md:flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                        <input
                            type="text"
                            placeholder="Track Address..."
                            value={whaleInput}
                            onChange={(e) => setWhaleInput(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-sm text-white w-32 placeholder-gray-500"
                        />
                        <button
                            onClick={handleAddWhale}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-blue-400"
                            title="Add to Tracker"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        {configStatus === 'success' && <span className="text-xs text-green-400">Added!</span>}
                    </div>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option>All Categories</option>
                        <option>Crypto</option>
                        <option>Politics</option>
                        <option>Sports</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredMarkets.map((market) => (
                    <div
                        key={market.id}
                        className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        {market.category}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                        ${(market.volume / 1000).toFixed(0)}k volume
                                    </span>
                                    {market.signals.length > 0 && (
                                        <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
                                            Signal Detected
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{market.question}</h3>

                                {/* Whale Movements Preview */}
                                {market.movements.slice(0, 1).map((move, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-purple-300 mb-2">
                                        <Activity className="w-3 h-3" />
                                        <span>
                                            Whale {move.trader.substring(0, 6)}...
                                            {move.type === 'BUY' ? ' bought ' : ' sold '}
                                            {move.outcome} ({move.amount})
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-white">{(market.currentPrice * 100).toFixed(0)}¢</div>
                                <div className="text-sm text-gray-400">Current Price</div>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-2 border-t border-white/5 pt-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-300">
                                    Insights ({market.signals.length + market.movements.length})
                                </h4>

                                <div className="flex gap-3">
                                    <a
                                        href={`https://polymarket.com/event/${market.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        View on Polymarket
                                    </a>
                                    <button
                                        onClick={() => setSelectedMarket(selectedMarket === market.id ? null : market.id)}
                                        className="text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        {selectedMarket === market.id ? 'Hide' : 'Show'} Details
                                    </button>
                                </div>
                            </div>

                            {selectedMarket === market.id && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    {/* Empty State */}
                                    {market.signals.length === 0 && market.movements.length === 0 && (
                                        <div className="text-center py-6 bg-black/20 rounded-xl border border-dashed border-white/10">
                                            <div className="text-gray-500 text-sm">No signals detected yet</div>
                                            <div className="text-gray-600 text-xs mt-1">Waiting for Pyth confidence anomalies or whale activity...</div>
                                        </div>
                                    )}

                                    {/* Signals in Details */}
                                    {market.signals.length > 0 && (
                                        <div className="space-y-2">
                                            <h5 className="text-xs text-gray-500 uppercase tracking-wider">Pyth Signals</h5>
                                            {market.signals.map((signal) => (
                                                <SignalCard key={signal.id} signal={signal} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Movements in Details */}
                                    {market.movements.length > 0 && (
                                        <div className="space-y-2">
                                            <h5 className="text-xs text-gray-500 uppercase tracking-wider">Top Trader Activity</h5>
                                            {market.movements.map((move, i) => (
                                                <div key={i} className="bg-black/20 p-3 rounded-lg flex justify-between items-center text-sm">
                                                    <div className="flex gap-2 items-center">
                                                        <div className={`w-2 h-2 rounded-full ${move.type === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        <span className="text-gray-300 font-mono">{move.trader.substring(0, 8)}...</span>
                                                    </div>
                                                    <div className="text-white">
                                                        {move.type} {move.outcome}
                                                    </div>
                                                    <div className="text-gray-400">
                                                        {new Date(move.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SignalCard({ signal }: { signal: any }) {
    // Determine direction from confidence or if we had a previous value.
    // Pyth signal just gives "Confidence Low/High". 
    // Let's assume High Severity = BAD/Low Confidence? Or High Severity = High Volatility?
    // Based on backend: isAnomaly means confidence spike.
    // Let's display it generically.

    return (
        <div className="bg-black/30 border border-white/5 rounded-xl p-4 hover:bg-black/40 transition-all">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-yellow-500/10 border-yellow-500/30 text-yellow-500`}>
                        <Activity className="w-4 h-4" />
                        <span className="font-medium">CONFIDENCE ANOMALY</span>
                    </div>
                    <div>
                        <div className="text-sm text-gray-400">Source: <span className="text-white font-mono">Pyth Network</span></div>
                        <div className="flex gap-4 mt-1">
                            <span className="text-xs text-gray-500">Confidence: <span className="text-blue-400 font-medium">{signal.confidence.toFixed(4)}</span></span>
                            <span className="text-xs text-gray-500">Price: <span className="text-purple-400 font-medium">${signal.price}</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
