import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Activity, DollarSign, BarChart2, Wallet } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { usePythSignals } from '../hooks/usePythSignals';
import { useWhaleMovements } from '../hooks/useWhaleMovements';
import { useMarketHistory } from '../hooks/useMarketHistory';
import { useTechnicalIndicators } from '../hooks/useTechnicalIndicators';
import { usePolymarketComments } from '../hooks/usePolymarketComments';
import ConfidenceMeter from '../components/ConfidenceMeter';
import ConfidenceChart from '../components/ConfidenceChart';
import PriceChart from '../components/PriceChart';
import TradePanel from '../components/TradePanel';
import TechnicalSignalsDisplay from '../components/TechnicalSignalsDisplay';
import CommentsFeed from '../components/CommentsFeed';

export default function MarketDetailPage() {
    const { id } = useParams();
    const { market, loading, error } = useMarket(id);
    const { signals } = usePythSignals();
    const { movements } = useWhaleMovements();
    const [timeRange, setTimeRange] = useState<'1H' | '1D' | '1W' | '1M'>('1H');
    const [now] = useState(Date.now());

    // const market = useMemo(() => markets.find(m => m.id === id), [markets, id]);

    // Fetch Real History
    // Note: We need the tokenId of the Outcome to fetch history. Usually the "YES" outcome or the main token.
    // For binary markets, it's usually the YES token.
    const activeTokenId = useMemo(() => {
        if (!market) return undefined;
        // Prioritize YES token
        const yesToken = market.tokens.find(t => t.outcome === 'YES');
        return yesToken ? yesToken.tokenId : market.tokens[0]?.tokenId;
    }, [market]);

    // Map timeRange used in UI to valid interval for history hook
    // '1H' -> Use 1m candles for granular look
    const historyInterval = useMemo(() => {
        switch (timeRange) {
            case '1H': return '1m';
            case '1D': return '1m';
            case '1W': return '1h';
            case '1M': return '1d';
            default: return '1h';
        }
    }, [timeRange]);

    const { history: priceHistory, loading: historyLoading } = useMarketHistory(activeTokenId, historyInterval);

    // Compute Signals based on REAL history
    const technicalSignals = useTechnicalIndicators(priceHistory);

    // Live Comments
    const { comments, status: commentsStatus } = usePolymarketComments(market?.eventId);

    const marketData = useMemo(() => {
        if (!market) return null;

        const marketSignals = signals.filter(s => {
            const keyword = s.marketId.split('/')[0]; // e.g., 'BTC', 'ETH'
            const mappings: Record<string, string[]> = {
                'BTC': ['Bitcoin', 'BTC'],
                'ETH': ['Ethereum', 'ETH'],
                'SOL': ['Solana', 'SOL']
            };
            const keywords = mappings[keyword] || [keyword];
            if (['BTC', 'ETH', 'SOL'].includes(keyword)) {
                if (market.category !== 'Crypto') return false;
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
    }, [market, signals, movements]);

    if (loading) return <div className="text-white text-center py-20">Loading Market Data...</div>;
    if (!market || !marketData) return <div className="text-white text-center py-20">Market not found</div>;

    // Filter history to match the selected time range visually
    // Use state to hold 'now' to avoid purity error during render
    const rangeMs = {
        '1H': 3600 * 1000,
        '1D': 24 * 3600 * 1000,
        '1W': 7 * 24 * 3600 * 1000,
        '1M': 30 * 24 * 3600 * 1000
    }[timeRange];

    const filteredHistory = priceHistory.filter(p => p.time > (now - rangeMs));

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Top Bar */}
            <div className="flex items-center gap-4 shrink-0">
                <Link to="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1 overflow-hidden">
                    <h1 className="text-xl font-bold text-white truncate">{market.question}</h1>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{market.category}</span>
                        <span className="text-gray-600">•</span>
                        <span>End: {new Date(market.endDate || now).toLocaleDateString()}</span>
                        <span className="text-gray-600">•</span>
                        <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> ${(market.volume / 1000).toFixed(1)}k Vol</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-white leading-none">
                        {(market.currentPrice * 100).toFixed(1)}¢
                    </div>
                    <span className={`text-xs font-bold ${market.currentPrice > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                        {market.currentPrice > 0.5 ? 'Likely' : 'Unlikely'}
                    </span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">

                {/* Left Area: Chart, Signals, Comments (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-4 min-h-0 overflow-y-auto pr-2 pb-2">

                    {/* Price Chart */}
                    <div className="h-[400px] shrink-0 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                                <BarChart2 className="w-4 h-4 text-gray-400" />
                                Price History
                            </h3>
                            <div className="flex gap-1 bg-black/20 p-1 rounded-lg">
                                {(['1H', '1D', '1W', '1M'] as const).map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeRange(tf)}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${timeRange === tf ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 w-full relative">
                            {historyLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">Loading History...</div>
                            ) : (
                                <div className="absolute inset-0">
                                    <PriceChart
                                        currentPrice={market.currentPrice}
                                        timeRange={timeRange}
                                        historyOverride={filteredHistory.length > 0 ? filteredHistory : undefined}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Technical Signals */}
                    <div className="h-auto shrink-0">
                        <TechnicalSignalsDisplay signals={technicalSignals} />
                    </div>

                    {/* Bottom Split: Market Signals / Whale / Comments */}
                    <div className="h-64 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                        {/* Signals */}
                        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 overflow-y-auto">
                            <h3 className="font-semibold text-white mb-2 flex items-center gap-2 text-sm sticky top-0 bg-[#0B0E14]/90 z-10">
                                <Activity className="w-4 h-4 text-purple-400" />
                                Pyth Signals
                            </h3>
                            {marketData.signals.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 text-xs">No active signals</div>
                            ) : (
                                <div className="space-y-2">
                                    {marketData.signals.map(signal => (
                                        <div key={signal.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-gray-400">Conf.</span>
                                                <ConfidenceMeter confidence={signal.confidence} size="sm" />
                                            </div>
                                            <div className="h-10">
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
                        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 overflow-y-auto">
                            <h3 className="font-semibold text-white mb-2 flex items-center gap-2 text-sm sticky top-0 bg-[#0B0E14]/90 z-10">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                Whale Flow
                            </h3>
                            <div className="space-y-2">
                                {marketData.movements.length === 0 ? (
                                    <div className="text-xs text-gray-500 text-center py-4">No recent large orders.</div>
                                ) : (
                                    marketData.movements.map((move, i) => (
                                        <div key={i} className="flex flex-col gap-1 p-2 rounded bg-white/5 border border-white/5 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{move.trader.substring(0, 6)}</span>
                                                <span className={move.type === 'BUY' ? 'text-green-400' : 'text-red-400'}>{move.type}</span>
                                            </div>
                                            <div className="flex justify-between text-white font-mono">
                                                ${move.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="h-full">
                            <CommentsFeed comments={comments} status={commentsStatus} />
                        </div>
                    </div>
                </div>

                {/* Right Area: Trade Panel */}
                <div className="lg:col-span-4 flex flex-col min-h-0">
                    <TradePanel
                        yesPrice={market.currentPrice}
                        noPrice={1 - market.currentPrice}
                    />
                    <a
                        href={`https://polymarket.com/event/${market.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-white/10 text-gray-500 hover:text-white hover:bg-white/5 transition-all text-xs"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Open on Polymarket
                    </a>
                </div>
            </div>
        </div>
    );
}
