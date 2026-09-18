// Helper to generate unique human-readable Room IDs and User IDs
import { customAlphabet } from 'nanoid';

// Generates e.g. "ROOM-7F82K"
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const generateSuffix = customAlphabet(alphabet, 5);

export function generateRoomId() {
  return `ROOM-${generateSuffix()}`;
}

export function generateUserId() {
  const gen = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);
  return `user_${gen()}`;
}

export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, 2000);
}
