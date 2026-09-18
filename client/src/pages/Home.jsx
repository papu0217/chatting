import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video,
  MessageSquare,
  Zap,
  PlusCircle,
  LogIn,
  Users,
  Radio,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/avatar';

export function Home() {
  const navigate = useNavigate();
  const [activeRooms, setActiveRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Fetch active rooms every 4 seconds
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
    const interval = setInterval(fetchActiveRooms, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleQuickJoin = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative pt-10 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow ambient background */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Live Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-Time Chat & Instant WebRTC Video Calling</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-['Outfit',sans-serif] font-extrabold tracking-tight text-white max-w-4xl leading-[1.15] sm:leading-[1.1]">
          Connect instantly. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            Chat & Video Call
          </span>{' '}
          in real time.
        </h1>

        {/* Subtitle */}
        <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-slate-400 max-w-2xl font-normal leading-relaxed px-2">
          No complicated codes or sign-ups. Create a room or click to join any active room below to chat and start a video call right away.
        </p>

        {/* Primary Call to Actions */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md px-2">
          <Link
            to="/create"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Create Room</span>
          </Link>

          <Link
            to="/join"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            <span>Browse All Rooms</span>
          </Link>
        </div>

        {/* Active Live Rooms List (No room ID needed!) */}
        <div className="mt-12 w-full max-w-3xl">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Live Active Rooms
              </h2>
            </div>
            <button
              onClick={fetchActiveRooms}
              className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {activeRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeRooms.map((room) => {
                const firstUser = room.activeUsers?.[0];
                const avatarColor = getAvatarColor(firstUser?.username || room.name);
                const initials = getInitials(firstUser?.username || room.name);

                return (
                  <div
                    key={room.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all flex items-center justify-between gap-3 shadow-lg group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md`}
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
                      onClick={() => handleQuickJoin(room.id)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all group-hover:scale-105"
                    >
                      <span>Join</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
              <p className="text-sm text-slate-400">
                No rooms active at this moment. Create one now and invite someone to join!
              </p>
              <div className="mt-3">
                <Link
                  to="/create"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create the first room</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Instant Chat</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Native WebSocket communication with typing indicators, timestamps, and emoji picker.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/15 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">WebRTC Video Calling</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Peer-to-peer video calls with camera toggle, mic mute, screen share, and picture-in-picture.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Live Presence & Timers</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Real-time online status and exact session duration clocks tracked per user.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        Pulse &bull; Real-Time Chatting & Video Calling
      </footer>
    </div>
  );
}
