/**
 * In-memory Room Manager for real-time chatting and video calling
 * Designed to easily support MongoDB / Redis adapters in future phases.
 */

class RoomManager {
  constructor() {
    // Map<roomId, Room>
    this.rooms = new Map();
  }

  /**
   * Create or ensure a room exists
   */
  createRoom(roomId, roomName = null) {
    const id = (roomId || '').trim().toUpperCase();
    if (!this.rooms.has(id)) {
      this.rooms.set(id, {
        id,
        name: roomName || id,
        createdAt: new Date().toISOString(),
        // Active connected users: Map<userId, { userId, username, avatarSeed, joinedAt, lastSeen, isOnline, ws }>
        users: new Map(),
        // Disconnected users history: Map<userId, { userId, username, avatarSeed, joinedAt, leftAt, totalDurationSec }>
        disconnectedUsers: new Map(),
        // Chat messages history
        messages: [],
      });
    }
    return this.rooms.get(id);
  }

  getRoom(roomId) {
    if (!roomId) return null;
    return this.rooms.get(roomId.trim().toUpperCase()) || null;
  }

  hasRoom(roomId) {
    if (!roomId) return false;
    return this.rooms.has(roomId.trim().toUpperCase());
  }

  /**
   * Get all active/available rooms for lobby & joining
   */
  getAllRooms() {
    const list = [];
    for (const [id, room] of this.rooms.entries()) {
      const activeUsers = Array.from(room.users.values()).map((u) => ({
        userId: u.userId,
        username: u.username,
        avatarSeed: u.avatarSeed,
      }));
      list.push({
        id: room.id,
        name: room.name || room.id,
        createdAt: room.createdAt,
        activeCount: room.users.size,
        activeUsers,
      });
    }
    return list.sort(
      (a, b) => b.activeCount - a.activeCount || new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  /**
   * Add a user to a room
   */
  joinUser(roomId, { userId, username, avatarSeed, ws }) {
    const room = this.createRoom(roomId);
    const now = new Date();
    const joinedAt = now.toISOString();

    const userSession = {
      userId,
      username: (username || 'Anonymous').trim().slice(0, 50),
      avatarSeed: avatarSeed || username || userId,
      joinedAt,
      lastSeen: joinedAt,
      isOnline: true,
      ws,
    };

    // If user previously disconnected, remove from disconnected list
    room.disconnectedUsers.delete(userId);

    // Save to active users
    room.users.set(userId, userSession);

    return { room, user: userSession };
  }

  /**
   * Remove or mark user as offline
   */
  leaveUser(roomId, userId) {
    const room = this.getRoom(roomId);
    if (!room || !room.users.has(userId)) return null;

    const user = room.users.get(userId);
    const now = new Date();
    const leftAt = now.toISOString();

    const joinedTime = new Date(user.joinedAt).getTime();
    const durationSec = Math.max(0, Math.floor((now.getTime() - joinedTime) / 1000));

    // Save to disconnected users history so other participants can see "Offline - Last seen..."
    room.disconnectedUsers.set(userId, {
      userId: user.userId,
      username: user.username,
      avatarSeed: user.avatarSeed,
      joinedAt: user.joinedAt,
      leftAt,
      totalDurationSec: durationSec,
    });

    room.users.delete(userId);

    return {
      user,
      leftAt,
      durationSec,
      remainingCount: room.users.size,
    };
  }

  /**
   * Find user's current room by their WebSocket connection
   */
  findUserBySocket(ws) {
    for (const [roomId, room] of this.rooms.entries()) {
      for (const [userId, user] of room.users.entries()) {
        if (user.ws === ws) {
          return { roomId, user };
        }
      }
    }
    return null;
  }

  /**
   * Get all active and recently disconnected participants formatted for clients
   */
  getParticipants(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return [];

    const activeList = Array.from(room.users.values()).map((u) => ({
      userId: u.userId,
      username: u.username,
      avatarSeed: u.avatarSeed,
      joinedAt: u.joinedAt,
      lastSeen: u.lastSeen,
      isOnline: true,
    }));

    // Include last 10 disconnected users for offline display
    const offlineList = Array.from(room.disconnectedUsers.values())
      .slice(-10)
      .map((u) => ({
        userId: u.userId,
        username: u.username,
        avatarSeed: u.avatarSeed,
        joinedAt: u.joinedAt,
        leftAt: u.leftAt,
        totalDurationSec: u.totalDurationSec,
        isOnline: false,
      }));

    return [...activeList, ...offlineList];
  }

  /**
   * Add a message to room history (keep up to 150)
   */
  addMessage(roomId, message) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    room.messages.push(message);
    if (room.messages.length > 150) {
      room.messages.shift();
    }
    return message;
  }

  /**
   * Get recent messages
   */
  getMessages(roomId) {
    const room = this.getRoom(roomId);
    return room ? room.messages : [];
  }

  /**
   * Broadcast message to all active users in a room, optionally excluding sender
   */
  broadcast(roomId, data, excludeUserId = null) {
    const room = this.getRoom(roomId);
    if (!room) return;

    const payload = JSON.stringify(data);
    for (const [userId, user] of room.users.entries()) {
      if (excludeUserId && userId === excludeUserId) continue;
      if (user.ws && user.ws.readyState === 1 /* OPEN */) {
        try {
          user.ws.send(payload);
        } catch (err) {
          console.error(`Failed to send to user ${userId}:`, err.message);
        }
      }
    }
  }

  /**
   * Send direct message to a specific user in a room
   */
  sendToUser(roomId, targetUserId, data) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    const user = room.users.get(targetUserId);
    if (user && user.ws && user.ws.readyState === 1) {
      try {
        user.ws.send(JSON.stringify(data));
        return true;
      } catch (err) {
        console.error(`Failed to send direct message to ${targetUserId}:`, err.message);
      }
    }
    return false;
  }

  /**
   * Clean up empty rooms after 30 minutes of inactivity if needed
   */
  cleanupEmptyRooms() {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.size === 0) {
        // Keep room history around for a bit or delete
        // For testing we retain rooms unless explicitly cleared
      }
    }
  }
}

export const roomManager = new RoomManager();
