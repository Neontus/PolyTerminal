import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Activity, TrendingUp, TrendingDown, DollarSign, BarChart2, AlertTriangle, Wallet } from 'lucide-react';
import { usePolymarket } from '../hooks/usePolymarket';
import { usePythSignals } from '../hooks/usePythSignals';
import { useWhaleMovements } from '../hooks/useWhaleMovements';
import ConfidenceMeter from '../components/ConfidenceMeter';
import ConfidenceChart from '../components/ConfidenceChart';

export default function MarketDetailPage() {
    const { id } = useParams();
    const { markets, loading } = usePolymarket();
    const { signals } = usePythSignals();
    const { movements } = useWhaleMovements();

    const market = useMemo(() => markets.find(m => m.id === id), [markets, id]);

    const marketData = useMemo(() => {
        if (!market) return null;

        const marketSignals = signals.filter(s => {
            const keyword = s.marketId.split('/')[0];
            const mappings: Record<string, string[]> = {
                'BTC': ['Bitcoin', 'BTC'],
                'ETH': ['Ethereum', 'Ether', 'ETH'],
                'SOL': ['Solana', 'SOL']
            };
            const keywords = mappings[keyword] || [keyword];
            return keywords.some(k => market.question.includes(k));
        });

        const marketMovements = movements.filter(m =>
            market.question.includes(m.marketQuestion.substring(0, 10))
        );

        return {
            ...market,
            signals: marketSignals,
            movements: marketMovements
        };
    }, [market, signals, movements]);

    if (loading) return <div className="text-white text-center py-20">Loading Market Data...</div>;
    if (!market || !marketData) return <div className="text-white text-center py-20">Market not found</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4">
                <Link to="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Markets</span>
                        <span>/</span>
                        <span className="text-white">{market.category}</span>
                    </div>
                    {/* Title & Price */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column: Info & Chart */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Market Header Card */}
                    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white mb-2">{market.question}</h1>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-full">
                                        End Date: {new Date(market.endDate || Date.now()).toLocaleDateString()}
                                    </span>
                                    <span className="text-gray-400 text-sm flex items-center gap-1">
                                        <Wallet className="w-3 h-3" />
                                        ${(market.volume / 1000).toFixed(1)}k Vol
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-400 mb-1">Current Price (Yes)</div>
                                <div className="text-4xl font-mono font-bold text-white tracking-tight">
                                    {(market.currentPrice * 100).toFixed(1)}¢
                                </div>
                                <div className={`text-sm mt-1 font-medium ${market.currentPrice > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                                    {market.currentPrice > 0.5 ? 'Likely' : 'Unlikely'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="h-[400px] bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-gray-400" />
                                Price History
                            </h3>
                            <div className="flex gap-2">
                                {['1H', '1D', '1W', '1M'].map(tf => (
                                    <button key={tf} className="px-3 py-1 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mock Chart Visualization */}
                        <div className="flex-1 flex items-end justify-between gap-1 px-4 pb-4 border-b border-white/5 relative">
                            {/* Simple bars for visual effect */}
                            {Array.from({ length: 40 }).map((_, i) => {
                                const height = 20 + Math.random() * 60;
                                return (
                                    <div
                                        key={i}
                                        className="w-full bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-t-sm relative group"
                                        style={{ height: `${height}%` }}
                                    >
                                        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {i}:00
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-white/10 text-[10px] text-gray-500">50¢</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="py-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 font-bold text-lg transition-all flex items-center justify-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Buy Yes
                        </button>
                        <button className="py-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-lg transition-all flex items-center justify-center gap-2">
                            <TrendingDown className="w-5 h-5" />
                            Buy No
                        </button>
                    </div>
                </div>

                {/* Sidebar: Insights */}
                <div className="space-y-6">
                    {/* Signals Card */}
                    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-400" />
                            Active Signals
                        </h3>

                        {marketData.signals.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-xl">
                                <div className="text-gray-500 text-sm">No active signals</div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {marketData.signals.map(signal => (
                                    <div key={signal.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-400">Pyth Confidence</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${signal.confidence < 50 ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                                                {signal.severity}
                                            </span>
                                        </div>
                                        <div className="flex items-end justify-between mb-2">
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">Confidence Score</div>
                                                <ConfidenceMeter confidence={signal.confidence} size="sm" />
                                            </div>
                                            {signal.severity === 'High' && (
                                                <div className="text-xs text-red-400 font-bold animate-pulse">High Volatility Alert</div>
                                            )}
                                        </div>
                                        {/* Chart using ANY type force cast for now as backend data shape is new */}
                                        <div className="h-24 mt-2 border-t border-white/5 pt-2">
                                            <ConfidenceChart
                                                data={(signal as any).history || []}
                                                isAnomaly={(signal as any).isAnomaly}
                                                color={signal.confidence > 50 ? '#60A5FA' : '#F87171'}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Whale Activity */}
                    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            Recent Whale Activity
                        </h3>

                        <div className="space-y-4">
                            {marketData.movements.length === 0 ? (
                                <div className="text-sm text-gray-500 text-center py-4">
                                    No significant whale movements detected recently.
                                </div>
                            ) : (
                                marketData.movements.map((move, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-blue-300 font-mono">
                                                {move.trader.substring(0, 6)}...{move.trader.substring(move.trader.length - 4)}
                                            </span>
                                            <span className={`text-xs font-bold ${move.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                                                {move.type} {move.outcome}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-white">${move.amount}</div>
                                            <div className="text-[10px] text-gray-500">
                                                {new Date(move.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* External Link */}
                    <a
                        href={`https://polymarket.com/event/${market.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View on Polymarket
                    </a>
                </div>
            </div>
        </div>
    );
}
