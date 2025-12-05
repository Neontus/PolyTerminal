import { useState, useEffect } from 'react';
import { DollarSign, ArrowRight, Wallet, TrendingUp, TrendingDown, Clock, Percent } from 'lucide-react';

interface TradePanelProps {
    yesPrice: number;
    noPrice: number;
}

export default function TradePanel({ yesPrice, noPrice }: TradePanelProps) {
    const [amount, setAmount] = useState<string>('100');
    const [outcome, setOutcome] = useState<'Yes' | 'No'>('Yes');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
    const [limitPrice, setLimitPrice] = useState<string>('');

    // Derived values
    const currentPrice = outcome === 'Yes' ? yesPrice : noPrice;

    // Initialize limit price when outcome changes
    useEffect(() => {
        setLimitPrice((currentPrice * 100).toFixed(1));
    }, [currentPrice]);

    const usdcAmount = parseFloat(amount) || 0;
    const limitPriceVal = parseFloat(limitPrice) / 100 || currentPrice;

    // Use limit price if limit order, else current price
    const executionPrice = orderType === 'limit' ? limitPriceVal : currentPrice;

    const shares = usdcAmount / executionPrice;
    const potentialReturn = shares * 1.0;
    const roi = ((potentialReturn - usdcAmount) / usdcAmount) * 100;

    const activeTabStyle = outcome === 'Yes'
        ? 'bg-green-500/20 text-green-400 border-b-2 border-green-500'
        : 'bg-red-500/20 text-red-400 border-b-2 border-red-500';

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full">
            {/* Outcome Toggle Header */}
            <div className="flex border-b border-white/5">
                <button
                    onClick={() => setOutcome('Yes')}
                    className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${outcome === 'Yes' ? activeTabStyle : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <TrendingUp className="w-4 h-4" />
                    YES <span className="font-mono text-xs opacity-80">{(yesPrice * 100).toFixed(1)}¢</span>
                </button>
                <div className="w-[1px] bg-white/5"></div>
                <button
                    onClick={() => setOutcome('No')}
                    className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${outcome === 'No' ? activeTabStyle : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <TrendingDown className="w-4 h-4" />
                    NO <span className="font-mono text-xs opacity-80">{(noPrice * 100).toFixed(1)}¢</span>
                </button>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">

                {/* Order Type & Side Row */}
                <div className="flex gap-2">
                    <div className="bg-white/5 p-1 rounded-xl flex gap-1 flex-1">
                        {['buy', 'sell'].map(s => (
                            <button
                                key={s}
                                onClick={() => setSide(s as any)}
                                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${side === s ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="bg-white/5 p-1 rounded-xl flex gap-1 flex-1">
                        {['market', 'limit'].map(t => (
                            <button
                                key={t}
                                onClick={() => setOrderType(t as any)}
                                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${orderType === t ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Limit Price Input (Only for Limit Order) */}
                {orderType === 'limit' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Limit Price</span>
                            <span className="flex items-center gap-1">Current: {(currentPrice * 100).toFixed(1)}¢</span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-10 text-white font-mono text-lg focus:outline-none focus:border-white/20 transition-colors"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">¢</div>
                        </div>
                    </div>
                )}

                {/* Amount Input */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Amount ({side === 'buy' ? 'USDC' : 'Shares'})</span>
                        <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Bal: $5,230.50</span>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white font-mono text-lg focus:outline-none focus:border-white/20 transition-colors"
                        />
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            {['100', '500', 'Max'].map(v => (
                                <button key={v} onClick={() => v === 'Max' ? setAmount('5230') : setAmount(v)} className="px-2 py-1 text-[10px] bg-white/10 hover:bg-white/20 rounded text-gray-300 transition-colors">
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/5">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Avg. Price</span>
                        <span className="text-white font-mono">{(executionPrice * 100).toFixed(1)}¢</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Est. Shares</span>
                        <span className="text-white font-mono">{shares.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <button
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all 
                        ${outcome === 'Yes'
                                ? (side === 'buy' ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500/20 text-green-400 border border-green-500/50')
                                : (side === 'buy' ? 'bg-red-600 hover:bg-red-500' : 'bg-red-500/20 text-red-400 border border-red-500/50')
                            } text-white`}
                    >
                        {side === 'buy' ? `Buy ${outcome}` : `Sell ${outcome}`}
                        {orderType === 'limit' && <Clock className="w-4 h-4" />}
                        {orderType === 'market' && <ArrowRight className="w-4 h-4" />}
                    </button>
                    <p className="text-[10px] text-center text-gray-500 mt-2">
                        {orderType === 'limit' ? 'Limit orders match at target price or better.' : 'Market orders may slip. By trading you agree to Terms.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
