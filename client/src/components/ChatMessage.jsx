import React from 'react';
import { getAvatarColor, getInitials } from '../utils/avatar';
import { formatTime } from '../utils/formatters';
import { UserCheck, UserX, Info } from 'lucide-react';

export function ChatMessage({ message, isOwnMessage }) {
  const { type, username, text, timestamp, avatarSeed } = message;

  // System message (e.g. "Arun joined the room", "Priya left the room")
  if (type === 'system') {
    const isJoin = text.includes('joined');
    const isLeave = text.includes('left');

    return (
      <div className="flex justify-center my-3 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-sm backdrop-blur-sm">
          {isJoin && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
          {isLeave && <UserX className="w-3.5 h-3.5 text-rose-400" />}
          {!isJoin && !isLeave && <Info className="w-3.5 h-3.5 text-indigo-400" />}
          <span>{text}</span>
          {timestamp && (
            <span className="text-[10px] text-slate-500 font-mono ml-1">{formatTime(timestamp)}</span>
          )}
        </div>
      </div>
    );
  }

  const avatarColor = getAvatarColor(avatarSeed || username);
  const initials = getInitials(username);
  const formattedTime = formatTime(timestamp);

  // Own message (Aligned right, gradient / sleek indigo bubble)
  if (isOwnMessage) {
    return (
      <div className="flex justify-end my-2.5 animate-fade-in group">
        <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-end">
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-[11px] font-medium text-indigo-300">You</span>
            <span className="text-[10px] text-slate-500 font-mono">{formattedTime}</span>
          </div>
          <div className="relative p-3.5 rounded-2xl rounded-tr-sm bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/10 break-words leading-relaxed text-sm">
            <p className="whitespace-pre-wrap select-text">{text}</p>
          </div>
        </div>
      </div>
    );
  }

  // Other user's message (Aligned left, avatar, sender name, sleek dark card)
  return (
    <div className="flex items-start gap-3 my-2.5 animate-fade-in group">
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0 mt-1`}
      >
        {initials}
      </div>

      <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-start">
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-xs font-semibold text-slate-200">{username}</span>
          <span className="text-[10px] text-slate-500 font-mono">{formattedTime}</span>
        </div>

        <div className="relative p-3.5 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800/80 text-slate-200 shadow-md break-words leading-relaxed text-sm">
          <p className="whitespace-pre-wrap select-text">{text}</p>
        </div>
      </div>
    </div>
  );
}
