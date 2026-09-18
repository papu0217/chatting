import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  LogIn,
  User,
  Hash,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Radio,
  Users,
  Video,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getAvatarColor, getInitials } from '../utils/avatar';

export function JoinRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [username, setUsername] = useState(() => localStorage.getItem('pulse_username') || '');
  const [activeRooms, setActiveRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [manualRoomId, setManualRoomId] = useState(() => searchParams.get('id') || '');
  const [showManualInput, setShowManualInput] = useState(Boolean(searchParams.get('id')));
  const [joiningId, setJoiningId] = useState(null);

  // Fetch active rooms from server
  const fetchActiveRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success && Array.isArray(data.rooms)) {
        setActiveRooms(data.rooms);
      }
    } catch (err) {
      console.warn('Could not fetch active rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinSelectedRoom = (roomId) => {
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      addToast({
        title: 'Display Name Required',
        message: 'Please enter your display name before joining.',
        type: 'warning',
      });
      return;
    }

    localStorage.setItem('pulse_username', cleanUsername);
    setJoiningId(roomId);
    navigate(`/room/${roomId}`);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanRoomId = manualRoomId.trim().toUpperCase();

    if (!cleanUsername) {
      addToast({
        title: 'Display Name Required',
        message: 'Please enter your display name.',
        type: 'warning',
      });
      return;
    }

    if (!cleanRoomId) {
      addToast({
        title: 'Room ID Required',
        message: 'Please enter a valid Room ID.',
        type: 'warning',
      });
      return;
    }

    localStorage.setItem('pulse_username', cleanUsername);
    navigate(`/room/${cleanRoomId}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-['Outfit'] text-white">Join a Room</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pick your name and click <span className="text-indigo-400 font-semibold">Join</span> on any open room.
          </p>
        </div>

        {/* Step 1: Your Display Name */}
        <div className="mb-6">
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
              placeholder="e.g. Arun or Priya"
              className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Step 2: Available Active Rooms */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select an Open Room
              </label>
            </div>
            <button
              onClick={fetchActiveRooms}
              className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {activeRooms.length > 0 ? (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {activeRooms.map((room) => {
                const firstUser = room.activeUsers?.[0];
                const avatarColor = getAvatarColor(firstUser?.username || room.name);
                const initials = getInitials(firstUser?.username || room.name);

                return (
                  <div
                    key={room.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all flex items-center justify-between gap-3 shadow-md group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 text-left">
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {room.name || room.id}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {room.activeCount} online
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500 font-mono text-[11px]">{room.id}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={joiningId === room.id || !username.trim()}
                      onClick={() => handleJoinSelectedRoom(room.id)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <span>Join Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-3">
              <p className="text-xs text-slate-400">
                No active rooms right now. You can create a new room or join the General Lobby.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleJoinSelectedRoom('GENERAL-ROOM')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 hover:bg-indigo-900/60 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Join General Room</span>
                </button>
                <Link
                  to="/create"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Room</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Secondary: Have a specific Room ID? */}
        <div className="pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowManualInput((prev) => !prev)}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-between w-full"
          >
            <span>Have a specific Room ID to enter?</span>
            <span className="text-indigo-400 font-semibold">{showManualInput ? 'Hide' : 'Enter ID'}</span>
          </button>

          {showManualInput && (
            <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={manualRoomId}
                onChange={(e) => setManualRoomId(e.target.value.toUpperCase())}
                placeholder="e.g. ROOM-7F82K"
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!username.trim() || !manualRoomId.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
