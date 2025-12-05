import { MessageCircle, User } from "lucide-react";
import type { Comment } from "../hooks/usePolymarketComments";

interface CommentsFeedProps {
    comments: Comment[];
    status: string;
}

export default function CommentsFeed({ comments, status }: CommentsFeedProps) {
    return (
        <div className="flex flex-col h-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    Live Activity
                </h3>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] text-gray-500 font-mono">{status}</span>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                {comments.length === 0 ? (
                    <div className="text-center text-gray-500 text-xs py-10 italic">
                        No recent comments...
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Avatar */}
                            <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10">
                                {comment.profile?.image ? (
                                    <img src={comment.profile.image} alt={comment.profile.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-4 h-4 text-gray-500" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex gap-2 items-baseline mb-0.5">
                                    <span className="text-xs font-bold text-gray-300 truncate">
                                        {comment.profile?.name || comment.userAddress.substring(0, 6)}
                                    </span>
                                    <span className="text-[10px] text-gray-600">
                                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed break-words">
                                    {comment.body}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
