import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketMessage<T = any> {
    type: string;
    payload: T;
}

export function useWebSocket<T = any>(url: string) {
    const [data, setData] = useState<T | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);

    const connect = useCallback(() => {
        // Ensure WebSocket URL is absolute
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const fullUrl = url.startsWith('/') ? `${protocol}//${host}${url}` : url;
        
        const ws = new WebSocket(fullUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };

        ws.onmessage = (event) => {
            try {
                const message: WebSocketMessage<T> = JSON.parse(event.data);
                setData(message.payload);
            } catch (err) {
                console.error("Failed to parse WebSocket message", err);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            // Auto reconnect after 3 seconds
            reconnectTimeoutRef.current = window.setTimeout(() => {
                connect();
            }, 3000);
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            ws.close();
        };
    }, [url]);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [connect]);

    const sendMessage = useCallback((type: string, payload: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }));
        } else {
            console.warn("WebSocket not connected, message not sent.");
        }
    }, []);

    return { data, isConnected, sendMessage };
}
