import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { PhoneOff, MicOff, Mic, VideoOff, Video } from 'lucide-react';

const CallPage = ({ authUser }) => {
  const { receiverId } = useParams();
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const ringtone = useRef(new Audio('/ringtone.mp3'));
  ringtone.current.loop = true;
  const localStream = useRef(null);
  const socketRef = useRef(null);

  const [timer, setTimer] = useState(0);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (!authUser || !authUser._id) return;

    socketRef.current = io('http://localhost:3000', {
      query: { userId: authUser._id },
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
      initiateCall(receiverId);
    });

    socketRef.current.on('offer', handleIncomingCall);
    socketRef.current.on('answer', async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socketRef.current.on('ice-candidate', async ({ candidate }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socketRef.current.on('call-declined', handleCallDeclined);
    socketRef.current.on('call-ended', handleCallEnded);
    socketRef.current.on('missed-call', handleMissedCall);

    return () => {
      socketRef.current.disconnect();
    };
  }, [authUser._id]);

  useEffect(() => {
    let interval;
    if (callAccepted) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callAccepted]);

  const startLocalStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    localStream.current = stream;
    return stream;
  } catch (error) {
    console.error('Camera access error:', error.name, error.message);
    alert(`Camera error: ${error.name} - ${error.message}`);
    return null;
  }
};



  const createPeerConnection = (receiverId) => {
    const pc = new RTCPeerConnection();
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', { candidate: event.candidate, receiverId });
      }
    };
    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
    peerConnection.current = pc;
    return pc;
  };

  const initiateCall = async (receiverId) => {
    const stream = await startLocalStream();
    const pc = createPeerConnection(receiverId);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current.emit('offer', {
      offer,
      receiverId,
      senderId: authUser._id,
      callerName: authUser.fullName,
    });

    setIsCallActive(true);
    setCallAccepted(true);
  };

  const handleIncomingCall = async ({ offer, senderId, callerName }) => {
    if (senderId === authUser._id) return;
    setIncomingCall({ from: senderId, offer, callerName });
    ringtone.current.play();
  };

  const acceptCall = async () => {
    setCallAccepted(true);
    const stream = await startLocalStream();
    const pc = createPeerConnection(incomingCall.from);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current.emit('answer', { answer, receiverId: incomingCall.from });
    setIsCallActive(true);
    setIncomingCall(null);
    ringtone.current.pause();
    ringtone.current.currentTime = 0;
  };

  const declineCall = () => {
    socketRef.current.emit('call-declined', { receiverId: incomingCall.from });
    ringtone.current.pause();
    ringtone.current.currentTime = 0;
    setIncomingCall(null);
  };

  const handleCallDeclined = () => {
    alert('Call was declined.');
    navigate('/');
  };

  const handleMissedCall = () => {
    alert('Missed call: No answer.');
    navigate('/');
  };

  const handleCallEnded = () => {
    endCall();
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
    ringtone.current.pause();
    ringtone.current.currentTime = 0;
    setIsCallActive(false);
    setCallAccepted(false);
    setIncomingCall(null);
    navigate('/');
  };

  const handleHangUp = () => {
    socketRef.current.emit('call-ended', { receiverId });
    endCall();
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white relative">
      {incomingCall && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          <h2 className="text-2xl mb-4">📞 {incomingCall.callerName} is calling...</h2>
          <div className="flex gap-4">
            <button onClick={acceptCall} className="bg-green-600 px-6 py-2 rounded text-lg">
              Accept
            </button>
            <button onClick={declineCall} className="bg-red-600 px-6 py-2 rounded text-lg">
              Decline
            </button>
          </div>
        </div>
      )}

      <div className="text-2xl mb-4">Call Duration: {formatTime(timer)}</div>

      <div className="flex gap-4 mb-6">
        <video ref={localVideoRef} autoPlay muted playsInline className="w-72 rounded shadow" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-72 rounded shadow" />
      </div>

      <div className="flex space-x-6">
        <button onClick={toggleMute} className="bg-gray-700 p-3 rounded-full">
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button onClick={toggleVideo} className="bg-gray-700 p-3 rounded-full">
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
        <button onClick={handleHangUp} className="bg-red-600 p-3 rounded-full">
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

export default CallPage;
