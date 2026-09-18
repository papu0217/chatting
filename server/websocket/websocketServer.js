import { WebSocketServer } from 'ws';
import { roomManager } from './roomManager.js';
import { handleSignaling } from './signaling.js';
import { sanitizeText } from '../utils/idGenerator.js';
import { customAlphabet } from 'nanoid';

const messageIdGen = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

export function setupWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer });

  // Heartbeat interval to detect stale/dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('Terminating dead connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      try {
        ws.ping();
      } catch {
        ws.terminate();
      }
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (ws) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      try {
        const text = raw.toString();
        const data = JSON.parse(text);
        handleClientMessage(ws, data);
      } catch (err) {
        console.error('Invalid WS message received:', err.message);
        try {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON payload' }));
        } catch {
          // ignore
        }
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('WS client socket error:', err.message);
      handleDisconnect(ws);
    });
  });

  function handleClientMessage(ws, data) {
    const { type } = data;

    switch (type) {
      case 'ping': {
        ws.isAlive = true;
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      }

      case 'join-room': {
        const { roomId, username, userId, avatarSeed } = data;
        if (!roomId || !username || !userId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'roomId, username, and userId are required to join.',
          }));
          return;
        }

        const normalizedRoomId = roomId.trim().toUpperCase();
        const { room, user } = roomManager.joinUser(normalizedRoomId, {
          userId,
          username,
          avatarSeed,
          ws,
        });

        // Store user reference on ws for fast lookup
        ws.userInfo = { roomId: normalizedRoomId, userId, username: user.username };

        // 1. Send confirmation & full state to joining user
        ws.send(JSON.stringify({
          type: 'room-joined',
          roomId: normalizedRoomId,
          user: {
            userId: user.userId,
            username: user.username,
            avatarSeed: user.avatarSeed,
            joinedAt: user.joinedAt,
            isOnline: true,
          },
          participants: roomManager.getParticipants(normalizedRoomId),
          messages: roomManager.getMessages(normalizedRoomId),
        }));

        // 2. Broadcast user-joined notification to all other room members
        roomManager.broadcast(
          normalizedRoomId,
          {
            type: 'user-joined',
            user: {
              userId: user.userId,
              username: user.username,
              avatarSeed: user.avatarSeed,
              joinedAt: user.joinedAt,
              isOnline: true,
            },
            participants: roomManager.getParticipants(normalizedRoomId),
            timestamp: user.joinedAt,
          },
          userId // exclude joining user
        );

        console.log(`[WS] ${user.username} (${userId}) joined room ${normalizedRoomId}`);
        break;
      }

      case 'leave-room': {
        const { roomId, userId } = data;
        const targetRoomId = roomId || (ws.userInfo && ws.userInfo.roomId);
        const targetUserId = userId || (ws.userInfo && ws.userInfo.userId);

        if (targetRoomId && targetUserId) {
          executeLeave(targetRoomId, targetUserId);
        }
        break;
      }

      case 'chat-message': {
        const { roomId, userId, username, avatarSeed, text } = data;
        const cleanedText = sanitizeText(text);

        if (!cleanedText) return;

        const messageObj = {
          id: `msg_${messageIdGen()}`,
          roomId: roomId.trim().toUpperCase(),
          userId,
          username,
          avatarSeed: avatarSeed || username,
          text: cleanedText,
          timestamp: new Date().toISOString(),
          type: 'user',
        };

        roomManager.addMessage(messageObj.roomId, messageObj);

        // Broadcast to everyone in the room (including sender for acknowledgment)
        roomManager.broadcast(messageObj.roomId, {
          type: 'chat-message',
          message: messageObj,
        });
        break;
      }

      case 'typing-start': {
        const { roomId, userId, username } = data;
        if (roomId && userId) {
          roomManager.broadcast(
            roomId.trim().toUpperCase(),
            {
              type: 'typing-start',
              userId,
              username,
            },
            userId
          );
        }
        break;
      }

      case 'typing-stop': {
        const { roomId, userId } = data;
        if (roomId && userId) {
          roomManager.broadcast(
            roomId.trim().toUpperCase(),
            {
              type: 'typing-stop',
              userId,
            },
            userId
          );
        }
        break;
      }

      // WebRTC Signaling messages
      case 'call-request':
      case 'call-accepted':
      case 'call-rejected':
      case 'call-offer':
      case 'call-answer':
      case 'ice-candidate':
      case 'call-ended': {
        const sender = ws.userInfo || {
          userId: data.fromUserId,
          username: data.fromUsername,
        };
        handleSignaling(ws, data, sender);
        break;
      }

      default:
        console.warn('Unknown message type:', type);
        break;
    }
  }

  function handleDisconnect(ws) {
    if (!ws.userInfo) {
      // Find by socket in room manager
      const found = roomManager.findUserBySocket(ws);
      if (found) {
        executeLeave(found.roomId, found.user.userId);
      }
      return;
    }

    const { roomId, userId } = ws.userInfo;
    executeLeave(roomId, userId);
  }

  function executeLeave(roomId, userId) {
    const leaveResult = roomManager.leaveUser(roomId, userId);
    if (!leaveResult) return;

    const { user, leftAt, durationSec } = leaveResult;
    console.log(`[WS] ${user.username} (${userId}) left ${roomId} after ${durationSec}s`);

    // Broadcast user-left to remaining participants in the room
    roomManager.broadcast(roomId, {
      type: 'user-left',
      userId: user.userId,
      username: user.username,
      joinedAt: user.joinedAt,
      leftAt,
      sessionDurationSec: durationSec,
      participants: roomManager.getParticipants(roomId),
      timestamp: leftAt,
    });

    // Also end any pending or active WebRTC calls involving this user
    roomManager.broadcast(roomId, {
      type: 'call-ended',
      fromUserId: userId,
      reason: 'User disconnected',
    });
  }

  return wss;
}
