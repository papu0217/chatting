import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Robust WebSocket Hook with auto-reconnection, heartbeat, and message dispatching
 */
export function useWebSocket({ roomId, userId, username, avatarSeed, onMessage, enabled = true }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'reconnecting' | 'disconnected' | 'connecting'
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isManuallyClosedRef = useRef(false);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const getWsUrl = useCallback(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://chatting-emou.onrender.com';
    return serverUrl.replace(/^http/, 'ws');
  }, []);

  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !roomId || !userId) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Join room immediately after socket connects
        ws.send(
          JSON.stringify({
            type: 'join-room',
            roomId,
            userId,
            username,
            avatarSeed,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'pong') return;
          if (onMessageRef.current) {
            onMessageRef.current(payload);
          }
        } catch (err) {
          console.error('Failed to parse WS incoming message:', err);
        }
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        if (isManuallyClosedRef.current) {
          setConnectionStatus('disconnected');
          return;
        }

        // Trigger reconnect
        setConnectionStatus('reconnecting');
        const attempts = reconnectAttemptsRef.current;
        const delay = Math.min(1000 * Math.pow(1.5, attempts), 10000);
        reconnectAttemptsRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
        // onclose will handle reconnect
      };
    } catch (err) {
      console.error('Error establishing WebSocket:', err);
      setConnectionStatus('disconnected');
    }
  }, [enabled, roomId, userId, username, avatarSeed, getWsUrl]);

  useEffect(() => {
    isManuallyClosedRef.current = false;
    connect();

    // Heartbeat ping interval
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 20000);

    return () => {
      isManuallyClosedRef.current = true;
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(
              JSON.stringify({
                type: 'leave-room',
                roomId,
                userId,
              })
            );
          } catch {
            // ignore
          }
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, roomId, userId]);

  return {
    connectionStatus,
    sendMessage,
    reconnect: connect,
  };
}
