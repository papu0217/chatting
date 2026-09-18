/**
 * WebRTC Signaling Handler
 * Relays WebRTC negotiation messages between peers in the same room.
 */
import { roomManager } from './roomManager.js';

export function handleSignaling(ws, data, sender) {
  const { type, roomId, toUserId } = data;
  if (!roomId || !toUserId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Signaling requires roomId and toUserId target.',
    }));
    return;
  }

  const room = roomManager.getRoom(roomId);
  if (!room) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `Room ${roomId} not found for signaling.`,
    }));
    return;
  }

  // Ensure target user is in the room
  const targetUser = room.users.get(toUserId);
  if (!targetUser) {
    ws.send(JSON.stringify({
      type: 'call-failed',
      toUserId,
      reason: 'User is no longer online in this room.',
    }));
    return;
  }

  // Forward the signaling payload to target peer
  const forwardData = {
    ...data,
    fromUserId: sender.userId,
    fromUsername: sender.username,
  };

  roomManager.sendToUser(roomId, toUserId, forwardData);
}
