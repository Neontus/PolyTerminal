import { useEffect, useRef } from 'react';
import { useWhaleMovements } from './useWhaleMovements';

export function useWhaleNotifications() {
    const { movements } = useWhaleMovements();
    const lastMovementTime = useRef<number>(Date.now());
    const hasRequestedPermission = useRef(false);

    useEffect(() => {
        if (!hasRequestedPermission.current && 'Notification' in window) {
            Notification.requestPermission();
            hasRequestedPermission.current = true;
        }
    }, []);

    useEffect(() => {
        if (movements.length === 0) return;

        // Find new movements since last check
        const newMovements = movements.filter(m => m.timestamp > lastMovementTime.current);

        if (newMovements.length > 0) {
            // Update last timestamp
            lastMovementTime.current = newMovements[0].timestamp; // Assuming first is newest

            // Trigger notification for the newest one (to avoid spam)
            const newest = newMovements[0];
            
            if (Notification.permission === 'granted') {
                new Notification(`Whale Alert: ${newest.type} ${newest.outcome}`, {
                    body: `${newest.trader.substring(0,6)}... just traded $${newest.amount} on ${newest.marketQuestion.substring(0, 30)}...`,
                    icon: '/vite.svg' // optional
                });
            }
        }
    }, [movements]);

    // No return needed, just side effect
}
