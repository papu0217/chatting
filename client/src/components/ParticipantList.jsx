import React from 'react';
import { Video, Clock } from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/avatar';
import { formatTime, formatDurationHuman } from '../utils/formatters';
import { useChatTimer } from '../hooks/useChatTimer';

function ParticipantItem({ participant, isCurrentUser, onStartCall, canCall }) {
  const { isOnline, username, joinedAt, leftAt, totalDurationSec, avatarSeed } = participant;
  const avatarGradient = getAvatarColor(avatarSeed || username);
  const initials = getInitials(username);

  // Active duration ticker
  const { formattedHuman: liveDuration, joinedTimeFormatted } = useChatTimer(isOnline ? joinedAt : null);

  const formattedLeftTime = leftAt ? formatTime(leftAt) : '';
  const recordedDuration = totalDurationSec ? formatDurationHuman(totalDurationSec, true) : '';

  return (
    <div
      className={`group relative p-3 rounded-2xl border transition-all duration-200 ${
        isOnline
          ? 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'
          : 'bg-slate-950/40 border-slate-900/80 opacity-60 hover:opacity-85'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with Status indicator */}
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-md`}
          >
            {initials}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
              isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500'
            }`}
          />
        </div>

        {/* User Info & Connection duration */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
              <span>{username}</span>
              {isCurrentUser && (
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  You
                </span>
              )}
            </h3>
          </div>

          <div className="text-[11px] text-slate-400 mt-0.5 space-y-0.5">
            {isOnline ? (
              <>
                <p className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Online</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Joined {joinedTimeFormatted}</span>
                </p>
                <p className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>Chatting for {liveDuration}</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-rose-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Offline</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Last seen {formattedLeftTime}</span>
                </p>
                {recordedDuration && (
                  <p className="text-slate-500 text-[10px]">Session: {recordedDuration}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Start Video Call Action button */}
        {!isCurrentUser && isOnline && (
          <button
            onClick={() => onStartCall(participant.userId, participant.username)}
            disabled={!canCall}
            title={`Video call ${username}`}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Call</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function ParticipantList({
  participants = [],
  currentUserId,
  onStartCall,
  canCall,
  className = '',
}) {
  const onlineParticipants = participants.filter((p) => p.isOnline);
  const offlineParticipants = participants.filter((p) => !p.isOnline);

  return (
    <aside
      className={`flex flex-col h-full bg-slate-950/80 border-r border-slate-800 backdrop-blur-md overflow-hidden ${className}`}
    >
      {/* Sidebar title */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Participants ({onlineParticipants.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click &quot;Call&quot; next to any user for instant video call
          </p>
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {onlineParticipants.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            Waiting for participants to join...
          </div>
        )}

        {/* Online Section */}
        {onlineParticipants.map((p) => (
          <ParticipantItem
            key={p.userId}
            participant={p}
            isCurrentUser={p.userId === currentUserId}
            onStartCall={onStartCall}
            canCall={canCall}
          />
        ))}

        {/* Offline Section */}
        {offlineParticipants.length > 0 && (
          <div className="pt-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1 mb-2">
              Recently Left
            </h3>
            <div className="space-y-2">
              {offlineParticipants.map((p) => (
                <ParticipantItem
                  key={`offline-${p.userId}`}
                  participant={p}
                  isCurrentUser={p.userId === currentUserId}
                  onStartCall={onStartCall}
                  canCall={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
