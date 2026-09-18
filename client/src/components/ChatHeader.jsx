import React, { useState } from 'react';
import { Copy, Check, LogOut, Users, Clock, Video } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';

export function ChatHeader({
  roomId,
  onlineCount,
  connectionStatus,
  sessionDurationHMS,
  onLeaveRoom,
  onToggleSidebar,
  onStartVideoCall,
  canStartCall,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-14 sm:h-16 px-2.5 sm:px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left section: Mobile menu toggle with count badge, Room info */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden relative p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700/60 active:scale-95 transition-all"
          aria-label="Toggle participants sidebar"
          title="View Participants"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          {onlineCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 flex items-center justify-center border-2 border-slate-900">
              {onlineCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 min-w-0 truncate">
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 items-center justify-center text-indigo-400 font-bold text-xs">
            #
          </div>
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-base font-semibold text-white tracking-tight truncate">
                <span className="hidden sm:inline">Room: </span>
                <span className="font-mono text-indigo-400 font-bold">{roomId}</span>
              </h1>
              <button
                onClick={handleCopyRoomId}
                title="Copy Room ID"
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-400">
              <span className="hidden sm:flex items-center gap-1 font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {onlineCount} Online
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <ConnectionStatus status={connectionStatus} />
            </div>
          </div>
        </div>
      </div>

      {/* Right section: Video Call CTA, User session duration, Leave button */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* PROMINENT VIDEO CALL BUTTON */}
        <button
          onClick={onStartVideoCall}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-md shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 animate-pulse-subtle"
          title="Start Video Call with participants in this room"
        >
          <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span><span className="hidden sm:inline">Video </span>Call</span>
        </button>

        {/* Session timer (tablet/desktop) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            <span className="font-mono font-medium text-white">{sessionDurationHMS}</span>
          </span>
        </div>

        {/* Leave Room button */}
        <button
          onClick={onLeaveRoom}
          className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 transition-all shadow-sm"
          title="Leave Room"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </header>
  );
}
