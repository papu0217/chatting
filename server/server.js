import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateRoomId } from './utils/idGenerator.js';
import { roomManager } from './websocket/roomManager.js';
import { setupWebSocketServer } from './websocket/websocketServer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend client
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// List all active and available rooms
app.get('/api/rooms', (req, res) => {
  const rooms = roomManager.getAllRooms();
  res.json({
    success: true,
    rooms,
  });
});

// Create a new room
app.post('/api/rooms/create', (req, res) => {
  const { name } = req.body || {};
  const roomId = generateRoomId();
  const room = roomManager.createRoom(roomId, name || roomId);

  res.status(201).json({
    success: true,
    roomId: room.id,
    name: room.name,
    createdAt: room.createdAt,
  });
});

// Check if a room exists and return basic participant count
app.get('/api/rooms/:roomId/check', (req, res) => {
  const { roomId } = req.params;
  const normalizedId = (roomId || '').trim().toUpperCase();
  const room = roomManager.getRoom(normalizedId);

  if (!room) {
    return res.status(404).json({
      exists: false,
      message: `Room ${normalizedId} does not exist.`,
    });
  }

  const activeCount = room.users.size;
  res.json({
    exists: true,
    roomId: room.id,
    name: room.name,
    activeCount,
    createdAt: room.createdAt,
  });
});

// Create HTTP Server & attach WebSocket
const server = http.createServer(app);
setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Chat & WebRTC Server listening on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`========================================`);
});

// Process signal handling
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  server.close(() => process.exit(0));
});
