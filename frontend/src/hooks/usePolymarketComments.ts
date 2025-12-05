import { useEffect, useState, useRef } from 'react';

const RTDS_URL = 'wss://ws-live-data.polymarket.com';

export interface Comment {
    id: string;
    body: string;
    createdAt: string;
    userAddress: string;
    profile: {
        name: string;
        pseudonym: string;
        image?: string;
    };
    replyCount?: number;
    reactionCount?: number;
}

export function usePolymarketComments(eventId?: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!eventId) return;

        // Clear previous comments when event changes
        setComments([]);
        setStatus('CONNECTING');

        try {
            const socket = new WebSocket(RTDS_URL);
            ws.current = socket;

            socket.onopen = () => {
                console.log('Connected to RTDS Comments');
                setStatus('CONNECTED');
                
                // Subscribe to comments
                // Note: We subscribe to all and filter client side for now as verified docs on filtering are sparse.
                // Optimizations can include passing filters in subscription if supported.
                const msg = {
                    action: "subscribe",
                    subscriptions: [
                        { topic: "comments", type: "comment_created" }
                    ]
                };
                socket.send(JSON.stringify(msg));
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // Filter for "comment_created"
                    if (data.type === 'comment_created' && data.payload) {
                        const payload = data.payload;
                        
                        // Client-side filter: Check if comment belongs to this event
                        // Note: parentEntityID is a number in example, assuming it matches eventId (or needs mapping).
                        // We check both string and number formats.
                        
                        let shouldAdd = true;
                        
                        if (eventId) {
                            const pId = payload.parentEntityID;
                            // Check exact match (string vs string) or number vs string
                            const matches = pId === eventId || pId?.toString() === eventId;
                            if (!matches) {
                                shouldAdd = false;
                            }
                        }

                        if (shouldAdd) {
                            const newComment: Comment = {
                                id: payload.id,
                                body: payload.body,
                                createdAt: payload.createdAt,
                                userAddress: payload.userAddress,
                                profile: payload.profile,
                                reactionCount: payload.reactionCount
                            };

                            setComments(prev => [newComment, ...prev].slice(0, 50)); // Keep last 50
                        }
                    }
                } catch (e) {
                    console.error('Error parsing RTDS message', e);
                }
            };

            socket.onclose = () => {
                setStatus('DISCONNECTED');
            };

            socket.onerror = (err) => {
                console.error('RTDS Websocket Error', err);
                setStatus('DISCONNECTED');
            };

            return () => {
                socket.close();
            };
        } catch (e) {
            console.error('Failed to init RTDS WS', e);
            setStatus('DISCONNECTED');
        }

    }, [eventId]);

    return { comments, status };
}
