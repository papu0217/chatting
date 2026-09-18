import React from 'react';

export function ConnectionStatus({ status }) {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Connected</span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400 text-xs font-medium backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-400 text-xs font-medium backdrop-blur-sm">
      <span className="w-2 h-2 rounded-full bg-rose-500" />
      <span>Disconnected</span>
    </div>
  );
}
