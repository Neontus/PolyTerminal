import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Database, Zap, Wallet, Bell } from 'lucide-react';
import axios from 'axios';
import { usePredictionCopilot } from '../hooks/usePredictionCopilot';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDepositTracker } from '../hooks/useDepositTracker';

const BACKEND_URL = 'http://localhost:3001';

export default function WhaleInput() {
    const [address, setAddress] = useState('');
    const [solanaAddress, setSolanaAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [mode, setMode] = useState<'chain' | 'db'>('chain');

    const [trackedList, setTrackedList] = useState<string[]>([]);

    // Smart Contract Hook
    const { addTrader, initialize, isReady } = usePredictionCopilot();
    const { connected } = useWallet();

    // Tracker Hook (for demo purposes, we track the LAST added whale's Solana wallet)
    // Ideally this would track ALL, but for UI demo we just track the Input field if valid
    const { alerts } = useDepositTracker(solanaAddress.length > 30 ? solanaAddress : null);

    const fetchTracked = async () => {
        try {
            const res = await axios.get<string[]>(`${BACKEND_URL}/api/config/whales`);
            setTrackedList(res.data);
        } catch (e) {
            console.error("Failed to fetch tracked list");
        }
    };

    useEffect(() => {
        fetchTracked();
    }, []);

    const updatedFetch = () => {
        setTimeout(fetchTracked, 2000); // Wait for backend to potentially sync
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) return;

        setLoading(true);
        setStatus('idle');
        setErrorMsg('');

        try {
            if (mode === 'chain') {
                if (!connected || !isReady) {
                    throw new Error("Wallet not connected. Connect wallet to write to Solana.");
                }

                // 1. Add to Solana Smart Contract
                console.log("Submitting transaction to Solana...");
                const tx = await addTrader(address, solanaAddress || null);
                console.log("Transaction confirmed:", tx);

                // 2. Notify backend to sync
                await axios.post(`${BACKEND_URL}/api/config/whales`, {
                    addresses: [address]
                });

                // 3. [NEW] Tell Backend Keeper to watch this Solana address for deposits
                if (solanaAddress) {
                    try {
                        await axios.post(`${BACKEND_URL}/api/config/watch`, {
                            solanaAddress,
                            polygonAddress: address
                        });
                        console.log("Backend watcher started successfully");
                    } catch (e) {
                        console.error("Failed to start backend watcher", e);
                    }
                }
            } else {
                // Legacy DB-only mode
                await axios.post(`${BACKEND_URL}/api/config/whales`, {
                    addresses: [address]
                });
            }

            setStatus('success');
            // Don't clear inputs immediately so user can see what they added
            // setAddress(''); 
            updatedFetch();
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error: any) {
            console.error('Failed to add whale', error);
            setStatus('error');
            setErrorMsg(error.message || "Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    const handleAutoDiscover = async () => {
        setLoading(true);
        setStatus('idle');
        try {
            await axios.post(`${BACKEND_URL}/api/config/whales/auto-discover`);
            setStatus('success');
            updatedFetch();
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error('Failed to auto-discover', error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" /> Track Trader
                </div>
                <div className="flex bg-black/40 rounded-lg p-1 gap-1">
                    <button
                        onClick={() => setMode('chain')}
                        className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-all ${mode === 'chain' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Write to Solana Smart Contract (Immutable Registry)"
                    >
                        <Zap className="w-3 h-3" /> On-Chain
                    </button>
                    <button
                        onClick={() => setMode('db')}
                        className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-all ${mode === 'db' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Local Database Only"
                    >
                        <Database className="w-3 h-3" /> DB
                    </button>
                </div>
            </h3>

            {/* Admin Init Button (Hidden unless specifically needed, but good for first-time setup) */}
            <div className="absolute top-4 right-20">
                <button
                    onClick={async () => {
                        try {
                            setLoading(true);
                            await initialize();
                            setStatus('success');
                            alert("Initialized!");
                        } catch (e) {
                            console.error(e);
                            setStatus('error');
                            setErrorMsg("Init Failed");
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="text-[8px] text-gray-700 hover:text-white uppercase font-mono"
                    title="Initialize Program Config"
                >
                    [INIT]
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="0x... (Polygon Address)"
                        disabled={loading}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600 font-mono disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !address || (mode === 'chain' && !connected)}
                        className={`
                            ${mode === 'chain' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'bg-gray-700 hover:bg-gray-600'}
                            disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                        `}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {mode === 'chain' ? 'Add' : 'Track'}
                    </button>
                </div>

                {/* Optional Solana Address Input */}
                {mode === 'chain' && (
                    <div className="flex gap-2 animate-in slide-in-from-top-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={solanaAddress}
                                onChange={(e) => setSolanaAddress(e.target.value)}
                                placeholder="(Optional) Solana Wallet for Deposit Tracking"
                                disabled={loading}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 pl-9 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600 font-mono disabled:opacity-50"
                            />
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>
                    </div>
                )}
            </form>

            <div className="flex justify-end mt-2">
                <button
                    onClick={handleAutoDiscover}
                    disabled={loading}
                    className="text-[10px] text-gray-500 hover:text-purple-400 flex items-center gap-1 transition-colors"
                    title="Find top traders from active markets"
                >
                    <Search className="w-3 h-3" /> Auto-Discover Top Traders
                </button>
            </div>

            {/* Live Deposit Alerts */}
            {alerts.length > 0 && (
                <div className="mt-4 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 animate-in slide-in-from-bottom">
                    <h4 className="text-xs font-bold text-purple-300 mb-2 flex items-center gap-2">
                        <Bell className="w-3 h-3 animate-bounce" /> Live Activity Detected
                    </h4>
                    {alerts.map((alert, idx) => (
                        <div key={idx} className="text-[10px] text-purple-200 font-mono mb-1 last:mb-0">
                            Create Tx detected: {alert.signature.substring(0, 8)}...
                        </div>
                    ))}
                </div>
            )}

            {/* Tracked List */}
            {trackedList.length > 0 && (
                <div className="mt-4 border-t border-white/5 pt-3">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Registry ({trackedList.length})</h4>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {trackedList.map(addr => (
                            <span key={addr} className="text-[10px] font-mono bg-white/5 text-gray-300 px-2 py-1 rounded border border-white/5">
                                {addr.substring(0, 8)}...{addr.substring(addr.length - 4)}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {status === 'success' && (
                <p className="text-green-400 text-xs mt-2 animate-in fade-in">
                    {mode === 'chain' ? 'Success! Trader added to Solana Registry.' : 'Updated tracking list.'}
                </p>
            )}
            {status === 'error' && (
                <p className="text-red-400 text-xs mt-2 animate-in fade-in">
                    {errorMsg || 'Failed to update tracking list.'}
                </p>
            )}
        </div>
    );
}
