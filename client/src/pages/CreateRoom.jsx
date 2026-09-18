import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, User, Loader2, Video, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../context/ToastContext';

export function CreateRoom() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [username, setUsername] = useState(() => localStorage.getItem('pulse_username') || '');
  const [roomTitle, setRoomTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      addToast({
        title: 'Display Name Required',
        message: 'Please enter your display name to create a room.',
        type: 'warning',
      });
      return;
    }

    localStorage.setItem('pulse_username', cleanUsername);
    setLoading(true);

    try {
      const chosenName = roomTitle.trim() || `${cleanUsername}'s Room`;
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://chatting-emou.onrender.com';
      const response = await fetch(`${serverUrl}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: chosenName }),
      });

      const data = await response.json();
      if (data.success && data.roomId) {
        // Confetti celebration
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });

        addToast({
          title: 'Room Created',
          message: `Entering ${data.name}...`,
          type: 'success',
        });

        // Direct instant navigation into the room! No waiting or copying needed!
        navigate(`/room/${data.roomId}`);
      } else {
        throw new Error(data.message || 'Failed to generate room');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      // Client-side fallback
      const fallbackId = `ROOM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      navigate(`/room/${fallbackId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient circle */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-['Outfit'] text-white">Create a Room</h2>
          <p className="text-xs text-slate-400 mt-1">
            Create your room and start chatting and video calling instantly.
          </p>
        </div>

        <form onSubmit={handleCreateRoom} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Your Display Name
            </label>
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                maxLength={30}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Tamil"
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Room Name <span className="text-slate-500 lowercase">(optional)</span>
            </label>
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Video className="w-4 h-4" />
              </div>
              <input
                type="text"
                maxLength={40}
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                placeholder={username ? `${username}'s Room` : "e.g. Team Discussion"}
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Room...</span>
              </>
            ) : (
              <>
                <span>Create & Enter Room</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
