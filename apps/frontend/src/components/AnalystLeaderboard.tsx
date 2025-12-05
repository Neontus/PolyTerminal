import { Trophy, TrendingUp, DollarSign, Target } from 'lucide-react';

const mockAnalysts = [
    {
        pubkey: '7xKXp9qZ...mN4vRt2k',
        totalSignals: 45,
        resolvedSignals: 38,
        correctSignals: 32,
        accuracy: 84.2,
        totalEarnings: 1250.5,
        rank: 1,
    },
    {
        pubkey: '9bRt5xWq...Lp3hKm8j',
        totalSignals: 38,
        resolvedSignals: 35,
        correctSignals: 28,
        accuracy: 80.0,
        totalEarnings: 980.25,
        rank: 2,
    },
    {
        pubkey: '4mNv2kLp...Qz7xRw9b',
        totalSignals: 52,
        resolvedSignals: 42,
        correctSignals: 31,
        accuracy: 73.8,
        totalEarnings: 1450.75,
        rank: 3,
    },
    {
        pubkey: '2hKm8jQz...Rt5xWq9b',
        totalSignals: 28,
        resolvedSignals: 24,
        correctSignals: 19,
        accuracy: 79.2,
        totalEarnings: 650.0,
        rank: 4,
    },
];

export default function AnalystLeaderboard() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Analyst Leaderboard</h2>
                    <p className="text-gray-400 mt-1">Top performing prediction analysts on-chain</p>
                </div>
                <div className="flex gap-2">
                    <select className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>All Time</option>
                        <option>Last 30 Days</option>
                        <option>Last 7 Days</option>
                    </select>
                </div>
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {mockAnalysts.slice(0, 3).map((analyst, index) => (
                    <div
                        key={analyst.pubkey}
                        className={`relative bg-gradient-to-br ${index === 0
                                ? 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50'
                                : index === 1
                                    ? 'from-gray-400/20 to-gray-500/20 border-gray-400/50'
                                    : 'from-orange-500/20 to-orange-600/20 border-orange-500/50'
                            } border rounded-2xl p-6 backdrop-blur-sm`}
                    >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${index === 0
                                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                                    : index === 1
                                        ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                                        : 'bg-gradient-to-br from-orange-400 to-orange-600'
                                }`}>
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="text-center mt-4">
                            <div className="text-2xl font-bold text-white mb-1">#{analyst.rank}</div>
                            <div className="text-sm font-mono text-gray-300 mb-4">{analyst.pubkey}</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/30 rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Accuracy</div>
                                    <div className="text-lg font-bold text-green-400">{analyst.accuracy.toFixed(1)}%</div>
                                </div>
                                <div className="bg-black/30 rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Earnings</div>
                                    <div className="text-lg font-bold text-blue-400">${analyst.totalEarnings.toFixed(0)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Full Leaderboard Table */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-black/30 border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Analyst</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        <Target className="w-4 h-4" />
                                        Accuracy
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4" />
                                        Signals
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" />
                                        Earnings
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {mockAnalysts.map((analyst) => (
                                <tr key={analyst.pubkey} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-lg font-bold text-white">#{analyst.rank}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-mono text-white">{analyst.pubkey}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="text-lg font-bold text-green-400">{analyst.accuracy.toFixed(1)}%</div>
                                            <div className="text-xs text-gray-500">({analyst.correctSignals}/{analyst.resolvedSignals})</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-white font-medium">{analyst.totalSignals}</div>
                                        <div className="text-xs text-gray-500">{analyst.resolvedSignals} resolved</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-lg font-bold text-blue-400">${analyst.totalEarnings.toFixed(2)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all">
                                            View Profile
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
