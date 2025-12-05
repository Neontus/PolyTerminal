import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BarChart2, Activity } from 'lucide-react';
import { usePolymarket } from '../hooks/usePolymarket';
import { usePythSignals } from '../hooks/usePythSignals';
import { useWhaleMovements } from '../hooks/useWhaleMovements';
import { useWhaleNotifications } from '../hooks/useWhaleNotifications';
import WhaleInput from './WhaleInput';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MarketList() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('All Categories');
    const mappedFilter = filter === 'All Categories' ? undefined : filter;
    const { markets, loading: marketsLoading } = usePolymarket(mappedFilter);
    const { signals } = usePythSignals();
    const { movements } = useWhaleMovements();

    // Enable Notifications
    useWhaleNotifications();

    // Whale Config State

    // Combine data
    const filteredMarkets = useMemo(() => {
        return markets.map(market => {
            const marketSignals = signals.filter(s => {
                const keyword = s.marketId.split('/')[0];
                const mappings: Record<string, string[]> = {
                    'BTC': ['Bitcoin', 'BTC'],
                    'ETH': ['Ethereum', 'ETH'],
                    'SOL': ['Solana', 'SOL']
                };
                const keywords = mappings[keyword] || [keyword];

                // Category check via market.category is unreliable if heuristic fails, 
                // but Pyth signals are mostly Crypto anyway.
                if (['BTC', 'ETH', 'SOL'].includes(keyword) && market.category !== 'Crypto') {
                    // Loose check: If we are in 'Crypto' tab, we expect crypto.
                    // If we are in 'Sports', we likely won't get BTC signals unless it's a cross-market?
                    return false;
                }

                return keywords.some(k => {
                    const regex = new RegExp(`\\b${k}\\b`, 'i');
                    return regex.test(market.question);
                });
            });

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

    if (marketsLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-gray-400">Loading Markets...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BarChart2 className="w-6 h-6 text-blue-400" />
                        Market Dashboard
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Real-time prices and anomaly detection</p>
                </div>

                <div className="flex gap-4 items-center">
                    {/* Whale Config Input */}
                    <div className="hidden md:block">
                        <WhaleInput />
                    </div>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option>All Categories</option>
                        <option>Crypto</option>
                        <option>Politics</option>
                        <option>Sports</option>
                    </select>
                </div>
            </div>

            {/* Markets Table */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[40%]">Market</th>
                            <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Price</th>
                            <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Volume</th>
                            <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Signals</th>
                            <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Activity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredMarkets.map((market) => (
                            <tr
                                key={market.id}
                                onClick={() => navigate(`/market/${market.id}`)}
                                className="group hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <td className="py-4 px-6">
                                    <div className="flex flex-col">
                                        <div className="font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                                            {market.question}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 text-gray-400">
                                                {market.category}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="font-mono font-bold text-white">
                                        {(market.currentPrice * 100).toFixed(0)}¢
                                    </div>
                                    <div className="text-xs text-blue-400">Yes</div>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <span className="text-sm text-gray-300 font-mono">
                                        ${(market.volume / 1000).toFixed(1)}k
                                    </span>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex justify-center">
                                        {market.signals.length > 0 ? (
                                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-2 text-gray-400 group-hover:text-white transition-colors">
                                        {market.movements.length > 0 && (
                                            <div className="flex items-center text-xs text-purple-400 mr-2">
                                                <Activity className="w-3 h-3 mr-1" />
                                                {market.movements.length}
                                            </div>
                                        )}
                                        <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredMarkets.length === 0 && (
                    <div className="py-12 text-center text-gray-500 bg-white/5">
                        No markets found in this category
                    </div>
                )}
            </div>
        </div>
    );
}
