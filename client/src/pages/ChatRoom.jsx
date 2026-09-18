import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useChatTimer } from '../hooks/useChatTimer';
import { useToast } from '../context/ToastContext';
import { ChatHeader } from '../components/ChatHeader';
import { ParticipantList } from '../components/ParticipantList';
import { ChatMessage } from '../components/ChatMessage';
import { MessageInput } from '../components/MessageInput';
import { TypingIndicator } from '../components/TypingIndicator';
import { VideoCallModal } from '../components/VideoCallModal';
import { IncomingCallDialog } from '../components/IncomingCallDialog';
import { formatDurationHuman } from '../utils/formatters';
import { MessageSquare, Video, X } from 'lucide-react';

export function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const normalizedRoomId = (roomId || '').trim().toUpperCase();

  // Persistent or temporary userId
  const [userId] = useState(() => {
    let saved = sessionStorage.getItem('pulse_userId');
    if (!saved) {
      saved = `user_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('pulse_userId', saved);
    }
    return saved;
  });

  // User display name
  const [username, setUsername] = useState(() => localStorage.getItem('pulse_username') || '');
  const [showNameModal, setShowNameModal] = useState(!username);
  const [nameInput, setNameInput] = useState('');

  // Room state
  const [joinedAt, setJoinedAt] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat to latest message
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // WebRTC hook placeholder for sendMessage
  const sendMessageRef = useRef(null);

  // WebRTC Hook
  const webrtc = useWebRTC({
    roomId: normalizedRoomId,
    currentUserId: userId,
    currentUsername: username,
    sendMessage: (msg) => {
      if (sendMessageRef.current) {
        return sendMessageRef.current(msg);
      }
      return false;
    },
    addToast,
  });

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback(
    (payload) => {
      const { type } = payload;

      switch (type) {
        case 'room-joined': {
          setJoinedAt(payload.user.joinedAt);
          setParticipants(payload.participants || []);
          if (payload.messages && payload.messages.length > 0) {
            setMessages(payload.messages);
          }
          addToast({
            title: 'Connected to Room',
            message: `You are in ${normalizedRoomId}`,
            type: 'success',
          });
          setTimeout(() => scrollToBottom(false), 100);
          break;
        }

        case 'user-joined': {
          setParticipants(payload.participants || []);
          const joinedUser = payload.user;

          // Add system message
          setMessages((prev) => [
            ...prev,
            {
              id: `sys_join_${Date.now()}`,
              type: 'system',
              text: `${joinedUser.username} joined the room`,
              timestamp: payload.timestamp || new Date().toISOString(),
            },
          ]);

          addToast({
            title: 'User Joined',
            message: `${joinedUser.username} joined the chat. Click 'Video Call' to connect!`,
            type: 'info',
          });
          scrollToBottom();
          break;
        }

        case 'user-left': {
          setParticipants(payload.participants || []);
          const durationStr = payload.sessionDurationSec
            ? ` (Session: ${formatDurationHuman(payload.sessionDurationSec)})`
            : '';

          // Add system message
          setMessages((prev) => [
            ...prev,
            {
              id: `sys_leave_${Date.now()}`,
              type: 'system',
              text: `${payload.username} left the room${durationStr}`,
              timestamp: payload.timestamp || new Date().toISOString(),
            },
          ]);

          addToast({
            title: 'User Left',
            message: `${payload.username} left the room.${durationStr}`,
            type: 'warning',
          });
          scrollToBottom();
          break;
        }

        case 'chat-message': {
          if (payload.message) {
            setMessages((prev) => [...prev, payload.message]);
            scrollToBottom();
          }
          break;
        }

        case 'typing-start': {
          if (payload.userId !== userId) {
            setTypingUsers((prev) => {
              if (prev.some((u) => u.userId === payload.userId)) return prev;
              return [...prev, { userId: payload.userId, username: payload.username }];
            });
          }
          break;
        }

        case 'typing-stop': {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
          break;
        }

        // WebRTC Signaling messages
        case 'call-request':
        case 'call-accepted':
        case 'call-rejected':
        case 'call-offer':
        case 'call-answer':
        case 'ice-candidate':
        case 'call-ended': {
          webrtc.handleSignalingMessage(payload);
          break;
        }

        default:
          break;
      }
    },
    [normalizedRoomId, userId, addToast, scrollToBottom, webrtc]
  );

  // Setup WebSocket connection
  const { connectionStatus, sendMessage } = useWebSocket({
    roomId: normalizedRoomId,
    userId,
    username,
    avatarSeed: username,
    onMessage: handleWebSocketMessage,
    enabled: Boolean(username && !showNameModal),
  });

  sendMessageRef.current = sendMessage;

  // Session duration timer for current user
  const { formattedHMS: sessionDurationHMS } = useChatTimer(joinedAt);

  // Other online participants in this room
  const otherOnlineParticipants = participants.filter((p) => p.isOnline && p.userId !== userId);

  // Global "Start Video Call" handler from Header or Banner
  const handleGlobalStartVideoCall = () => {
    if (webrtc.callState !== 'idle') return;

    if (otherOnlineParticipants.length === 0) {
      addToast({
        title: 'No Other Participants',
        message: 'Open a second browser tab or invite a friend into this room to make a video call!',
        type: 'warning',
      });
      return;
    }

    // Call first available peer
    const targetPeer = otherOnlineParticipants[0];
    webrtc.startCall(targetPeer.userId, targetPeer.username);
  };

  // Send message action
  const handleSendMessage = (text) => {
    sendMessage({
      type: 'chat-message',
      roomId: normalizedRoomId,
      userId,
      username,
      avatarSeed: username,
      text,
    });
  };

  // Typing indicators
  const handleTypingStart = () => {
    sendMessage({
      type: 'typing-start',
      roomId: normalizedRoomId,
      userId,
      username,
    });
  };

  const handleTypingStop = () => {
    sendMessage({
      type: 'typing-stop',
      roomId: normalizedRoomId,
      userId,
    });
  };

  // Leave room action
  const handleLeaveRoom = () => {
    sendMessage({
      type: 'leave-room',
      roomId: normalizedRoomId,
      userId,
    });
    addToast({
      title: 'Left Room',
      message: `You disconnected from ${normalizedRoomId}`,
      type: 'info',
    });
    navigate('/');
  };

  // Name submission if user arrived directly at URL without name
  const handleNameSubmit = (e) => {
    e.preventDefault();
    const clean = nameInput.trim();
    if (!clean) return;
    localStorage.setItem('pulse_username', clean);
    setUsername(clean);
    setShowNameModal(false);
  };

  // Count active online participants
  const onlineCount = participants.filter((p) => p.isOnline).length;

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Name Input Modal if not set */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center animate-slide-up">
            <h3 className="text-xl font-bold text-white">Choose Your Display Name</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Enter your name to join room <span className="font-mono text-indigo-400">{normalizedRoomId}</span>
            </p>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <input
                type="text"
                required
                maxLength={30}
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Arun"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm text-white shadow-lg shadow-indigo-600/30 transition-all"
              >
                Join Room
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top Header with prominent Video Call button */}
      <ChatHeader
        roomId={normalizedRoomId}
        onlineCount={onlineCount}
        connectionStatus={connectionStatus}
        sessionDurationHMS={sessionDurationHMS}
        onLeaveRoom={handleLeaveRoom}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        onStartVideoCall={handleGlobalStartVideoCall}
        canStartCall={webrtc.callState === 'idle'}
      />

      {/* Main Content Area: Sidebar + Chat Room */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 shrink-0 h-full">
          <ParticipantList
            participants={participants}
            currentUserId={userId}
            onStartCall={webrtc.startCall}
            canCall={webrtc.callState === 'idle'}
          />
        </div>

        {/* Mobile Slide-over Drawer for Participants */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="relative w-80 max-w-[85vw] h-full z-50 shadow-2xl animate-slide-up flex flex-col bg-slate-950 border-r border-slate-800">
              <div className="absolute top-3.5 right-3.5 z-50">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white active:scale-95 transition-all"
                  aria-label="Close participants drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ParticipantList
                participants={participants}
                currentUserId={userId}
                onStartCall={(tId, tName) => {
                  setIsSidebarOpen(false);
                  webrtc.startCall(tId, tName);
                }}
                canCall={webrtc.callState === 'idle'}
              />
            </div>
          </div>
        )}

        {/* Center Main Chat Panel */}
        <main className="flex-1 flex flex-col h-full bg-slate-950 min-w-0">
          {/* Quick Call Banner if another user is in the room */}
          {otherOnlineParticipants.length > 0 && webrtc.callState === 'idle' && (
            <div className="mx-2.5 sm:mx-6 mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/30 flex items-center justify-between gap-2 sm:gap-3 shadow-lg animate-slide-up">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
                </div>
                <p className="text-[11px] sm:text-xs text-slate-200 truncate">
                  <span className="font-semibold text-white">{otherOnlineParticipants[0].username}</span> is online!
                </p>
              </div>
              <button
                onClick={() => webrtc.startCall(otherOnlineParticipants[0].userId, otherOnlineParticipants[0].username)}
                className="shrink-0 inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Call</span>
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 space-y-1">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 mb-3 shadow-md">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-300">Welcome to #{normalizedRoomId}!</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Send a message or click the <span className="text-indigo-400 font-semibold">Video Call</span> button above to start a live audio/video call.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id || `${msg.userId}_${msg.timestamp}`}
                    message={msg}
                    isOwnMessage={msg.userId === userId}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Typing Indicator */}
          <TypingIndicator typingUsers={typingUsers} />

          {/* Bottom Message Input Bar */}
          <MessageInput
            onSendMessage={handleSendMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            disabled={connectionStatus !== 'connected'}
          />
        </main>
      </div>

      {/* Incoming Call Ringing Dialog */}
      <IncomingCallDialog
        incomingCall={webrtc.incomingCall}
        onAccept={webrtc.acceptCall}
        onReject={webrtc.rejectCall}
      />

      {/* WebRTC Video Call Modal */}
      <VideoCallModal
        callState={webrtc.callState}
        remoteUser={webrtc.remoteUser}
        currentUsername={username}
        localStream={webrtc.localStream}
        remoteStream={webrtc.remoteStream}
        isAudioMuted={webrtc.isAudioMuted}
        isVideoOff={webrtc.isVideoOff}
        isScreenSharing={webrtc.isScreenSharing}
        onToggleAudio={webrtc.toggleAudio}
        onToggleVideo={webrtc.toggleVideo}
        onToggleScreenShare={webrtc.toggleScreenShare}
        onEndCall={webrtc.endCall}
      />
    </div>
  );
}
