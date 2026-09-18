import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Video, PlusCircle, LogIn, Sparkles } from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const isChatRoom = location.pathname.startsWith('/room/');

  return (
    <nav className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Video className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Outfit',sans-serif] font-bold text-xl tracking-tight text-white">
                Pulse
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-1 hidden sm:block">Chat & WebRTC Calls</p>
          </div>
        </Link>

        {/* Action Links */}
        {!isChatRoom && (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/join"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60 transition-all"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              <span>Join<span className="hidden sm:inline"> Room</span></span>
            </Link>
            <Link
              to="/create"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all hover:shadow-indigo-500/40"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Create<span className="hidden sm:inline"> Room</span></span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
