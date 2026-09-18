import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/avatar';

export function IncomingCallDialog({ incomingCall, onAccept, onReject }) {
  if (!incomingCall) return null;

  const { fromUsername } = incomingCall;
  const avatarColor = getAvatarColor(fromUsername);
  const initials = getInitials(fromUsername);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 shadow-2xl shadow-indigo-500/20 text-center animate-slide-up">
        {/* Animated Avatar / Ringing pulses */}
        <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-indigo-600/30 animate-pulse" />
          <div
            className={`relative w-20 h-20 rounded-full bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-white text-2xl font-bold shadow-xl`}
          >
            {initials}
          </div>
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">{fromUsername}</h3>
        <p className="text-sm text-indigo-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
          <Video className="w-4 h-4 animate-bounce" />
          <span>Incoming Video Call...</span>
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {/* Decline */}
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 group-hover:scale-110 transition-all">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-rose-400 font-medium">Decline</span>
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 group-hover:scale-110 transition-all animate-bounce">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-emerald-400 font-medium">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
