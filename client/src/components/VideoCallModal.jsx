import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Maximize2,
  Minimize2,
  Users,
} from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/avatar';

export function VideoCallModal({
  callState,
  remoteUser,
  currentUsername,
  localStream,
  remoteStream,
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === 'idle' || callState === 'incoming') {
    return null;
  }

  const remoteName = remoteUser?.username || 'Peer';
  const remoteInitials = getInitials(remoteName);
  const remoteAvatarColor = getAvatarColor(remoteName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/95 sm:bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full h-[100dvh] sm:h-[85vh] sm:max-h-[750px] sm:max-w-5xl rounded-none sm:rounded-3xl bg-slate-950 sm:bg-slate-900 border-0 sm:border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="absolute top-0 inset-x-0 h-14 sm:h-16 bg-gradient-to-b from-slate-950/90 to-transparent p-3 sm:p-4 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 border border-slate-700/60 px-3 py-1.5 rounded-full backdrop-blur-md">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                callState === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="text-xs font-semibold text-white truncate max-w-[140px] sm:max-w-none">
              {callState === 'connected' ? remoteName : `Calling ${remoteName}...`}
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <span className="text-[11px] sm:text-xs text-slate-300 bg-slate-900/90 border border-slate-700/60 px-2.5 sm:px-3 py-1 rounded-full backdrop-blur-md font-mono">
              Live
            </span>
          </div>
        </div>

        {/* Main Stage: Remote User Video (or Calling Placeholder) */}
        <div className="relative flex-1 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 sm:p-6">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                <div
                  className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr ${remoteAvatarColor} flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-2xl`}
                >
                  {remoteInitials}
                </div>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white">{remoteName}</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {callState === 'connected' ? 'Connecting media...' : 'Ringing...'}
              </p>
            </div>
          )}

          {/* Picture-in-Picture: Local Self-Video Preview */}
          <div className="absolute bottom-20 sm:bottom-24 right-3 sm:right-6 w-24 h-32 sm:w-52 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900 z-20 group transition-transform hover:scale-105">
            {localStream && !isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover local-video"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs p-1 text-center">
                <VideoOff className="w-4 h-4 sm:w-6 sm:h-6 mb-1 text-slate-500" />
                <span className="text-[10px]">Off</span>
              </div>
            )}
            <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium text-slate-300 pointer-events-none">
              You {isAudioMuted && '(Muted)'}
            </div>
          </div>
        </div>

        {/* Bottom Call Controls Bar */}
        <div className="h-16 sm:h-20 bg-slate-950/95 border-t border-slate-800/80 px-3 sm:px-6 flex items-center justify-center gap-2 sm:gap-4 z-20 pb-safe">
          {/* Mute / Unmute Audio */}
          <button
            onClick={onToggleAudio}
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all ${
              isAudioMuted
                ? 'bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white'
                : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white active:bg-slate-700'
            }`}
            title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isAudioMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Turn On / Off Video Camera */}
          <button
            onClick={onToggleVideo}
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all ${
              isVideoOff
                ? 'bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white'
                : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white active:bg-slate-700'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all ${
              isScreenSharing
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white active:bg-slate-700'
            }`}
            title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
          >
            <MonitorUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* End Call Button */}
          <button
            onClick={() => onEndCall(true)}
            className="p-2.5 sm:p-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm transition-all hover:scale-105 active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>End<span className="hidden sm:inline"> Call</span></span>
          </button>
        </div>
      </div>
    </div>
  );
}
