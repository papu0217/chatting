import { useState, useRef, useCallback, useEffect } from 'react';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

/**
 * WebRTC hook for 1-on-1 audio/video calling
 */
export function useWebRTC({ roomId, currentUserId, currentUsername, sendMessage, addToast }) {
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [remoteUser, setRemoteUser] = useState(null); // { userId, username }
  const [incomingCall, setIncomingCall] = useState(null); // { fromUserId, fromUsername }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callError, setCallError] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  // Create or get simulated stream fallback if camera hardware is missing
  const getMediaStream = useCallback(async (withVideo = true, withAudio = true) => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: withVideo,
          audio: withAudio,
        });
        return stream;
      }
    } catch (err) {
      console.warn('getUserMedia failed, trying audio-only or fallback:', err.message);
      // If video failed, try audio only
      if (withVideo) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          return audioStream;
        } catch (audioErr) {
          console.warn('Audio-only also failed:', audioErr.message);
        }
      }
    }

    // Fallback simulated canvas stream for environments without webcams (e.g. CI/Headless)
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#818cf8';
    ctx.font = '24px sans-serif';
    ctx.fillText('Camera preview unavailable', 150, 240);

    const stream = canvas.captureStream ? canvas.captureStream(15) : new MediaStream();
    return stream;
  }, []);

  // Initialize RTCPeerConnection
  const createPeerConnection = useCallback((targetUserId) => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    pendingCandidatesRef.current = [];

    // Remote track arrived
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
      }
    };

    // ICE Candidate discovered
    pc.onicecandidate = (event) => {
      if (event.candidate && targetUserId) {
        sendMessage({
          type: 'ice-candidate',
          roomId,
          toUserId: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected');
      } else if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        if (callState === 'connected') {
          endCall(false);
        }
      }
    };

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  }, [roomId, sendMessage, callState]);

  // Clean up media streams
  const cleanupStreams = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    setIsAudioMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
  }, []);

  // End active call
  const endCall = useCallback((notifyPeer = true) => {
    const targetUserId = remoteUser?.userId || incomingCall?.fromUserId;
    if (notifyPeer && targetUserId) {
      sendMessage({
        type: 'call-ended',
        roomId,
        toUserId: targetUserId,
      });
    }

    cleanupStreams();
    setCallState('idle');
    setRemoteUser(null);
    setIncomingCall(null);
  }, [remoteUser, incomingCall, roomId, sendMessage, cleanupStreams]);

  // Initiate call to a user
  const startCall = useCallback(async (targetUserId, targetUsername) => {
    if (callState !== 'idle') return;

    setCallState('calling');
    setRemoteUser({ userId: targetUserId, username: targetUsername });
    setCallError(null);

    try {
      const stream = await getMediaStream(true, true);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Send call request to peer
      sendMessage({
        type: 'call-request',
        roomId,
        toUserId: targetUserId,
        callerName: currentUsername,
      });
    } catch (err) {
      console.error('Failed to get media devices for call:', err);
      setCallError('Could not access microphone/camera.');
      endCall(false);
    }
  }, [callState, getMediaStream, sendMessage, roomId, currentUsername, endCall]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    const caller = {
      userId: incomingCall.fromUserId,
      username: incomingCall.fromUsername,
    };
    setRemoteUser(caller);
    setCallState('connected');

    try {
      const stream = await getMediaStream(true, true);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Create peer connection
      createPeerConnection(caller.userId);

      // Notify caller we accepted
      sendMessage({
        type: 'call-accepted',
        roomId,
        toUserId: caller.userId,
      });

      setIncomingCall(null);
    } catch (err) {
      console.error('Failed to accept call:', err);
      rejectCall();
    }
  }, [incomingCall, getMediaStream, createPeerConnection, sendMessage, roomId]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    sendMessage({
      type: 'call-rejected',
      roomId,
      toUserId: incomingCall.fromUserId,
      reason: 'Call declined',
    });

    setIncomingCall(null);
    setCallState('idle');
  }, [incomingCall, sendMessage, roomId]);

  // Handle incoming signaling messages from useWebSocket
  const handleSignalingMessage = useCallback(async (data) => {
    const { type, fromUserId, fromUsername, sdp, candidate } = data;

    switch (type) {
      case 'call-request': {
        // Someone is calling us
        if (callState !== 'idle') {
          // Send busy message
          sendMessage({
            type: 'call-rejected',
            roomId,
            toUserId: fromUserId,
            reason: 'User is busy in another call',
          });
          return;
        }
        setIncomingCall({ fromUserId, fromUsername: data.callerName || fromUsername });
        setCallState('incoming');
        break;
      }

      case 'call-accepted': {
        // Callee accepted our call; create and send SDP offer
        if (callState === 'calling') {
          const pc = createPeerConnection(fromUserId);
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);

            sendMessage({
              type: 'call-offer',
              roomId,
              toUserId: fromUserId,
              sdp: offer,
            });
          } catch (err) {
            console.error('Failed to create WebRTC offer:', err);
            endCall(true);
          }
        }
        break;
      }

      case 'call-rejected': {
        if (addToast) {
          addToast({
            title: 'Call Declined',
            message: data.reason || 'The user declined the call.',
            type: 'warning',
          });
        }
        endCall(false);
        break;
      }

      case 'call-offer': {
        // Received offer from caller
        let pc = pcRef.current;
        if (!pc) {
          pc = createPeerConnection(fromUserId);
        }

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));

          // Process queued ice candidates
          for (const cand of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          pendingCandidatesRef.current = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          sendMessage({
            type: 'call-answer',
            roomId,
            toUserId: fromUserId,
            sdp: answer,
          });
        } catch (err) {
          console.error('Failed to handle WebRTC offer:', err);
          endCall(true);
        }
        break;
      }

      case 'call-answer': {
        // Received answer from callee
        const pc = pcRef.current;
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));

            // Process any pending candidates
            for (const cand of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            pendingCandidatesRef.current = [];
          } catch (err) {
            console.error('Failed to set remote description answer:', err);
          }
        }
        break;
      }

      case 'ice-candidate': {
        if (!candidate) return;
        const pc = pcRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding received ice candidate:', err);
          }
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
        break;
      }

      case 'call-ended': {
        if (addToast && callState !== 'idle') {
          addToast({
            title: 'Call Ended',
            message: 'The other participant ended the call.',
            type: 'info',
          });
        }
        cleanupStreams();
        setCallState('idle');
        setRemoteUser(null);
        setIncomingCall(null);
        break;
      }

      default:
        break;
    }
  }, [callState, roomId, sendMessage, createPeerConnection, endCall, addToast, cleanupStreams]);

  // Controls: Toggle Audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks.forEach((t) => (t.enabled = nextState));
        setIsAudioMuted(!nextState);
      }
    }
  }, []);

  // Controls: Toggle Video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks.forEach((t) => (t.enabled = nextState));
        setIsVideoOff(!nextState);
      }
    }
  }, []);

  // Controls: Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Revert to camera
      try {
        const camStream = await getMediaStream(true, false);
        const camTrack = camStream.getVideoTracks()[0];
        if (camTrack && pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(camTrack);
        }
        setIsScreenSharing(false);
      } catch (err) {
        console.error('Error switching back to camera:', err);
      }
    } else {
      // Start screen share
      try {
        if (!navigator.mediaDevices.getDisplayMedia) {
          if (addToast) addToast({ title: 'Unsupported', message: 'Screen sharing is not supported by your browser.', type: 'warning' });
          return;
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        }

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen sharing cancelled or denied:', err.message);
      }
    }
  }, [isScreenSharing, getMediaStream, addToast]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupStreams();
    };
  }, [cleanupStreams]);

  return {
    callState,
    remoteUser,
    incomingCall,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    callError,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    handleSignalingMessage,
  };
}
