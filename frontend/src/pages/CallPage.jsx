// src/pages/CallPage.jsx
import { useEffect, useRef } from "react";
import { useCallStore } from "../store/useCallStore";
import { useNavigate } from "react-router-dom";

const CallPage = () => {
  const { localStream, remoteStream, callInfo, endCall } = useCallStore();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    endCall();
    navigate("/");
  };

  if (!callInfo) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        No active call
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h2 className="mb-4">
        {callInfo.callType === "video"
          ? `Video Call with ${callInfo.callee.fullName}`
          : `Audio Call with ${callInfo.callee.fullName}`}
      </h2>

      <div className="relative w-full max-w-4xl flex justify-center">
        {callInfo.callType === "video" && (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-[70vh] bg-gray-900 rounded-2xl"
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 right-4 w-40 rounded-xl border-2 border-white"
            />
          </>
        )}

        {callInfo.callType === "audio" && (
          <div className="text-lg">🔊 Audio Call in Progress...</div>
        )}
      </div>

      <button
        onClick={handleEndCall}
        className="mt-6 px-6 py-2 bg-red-600 rounded-xl hover:bg-red-700"
      >
        End Call
      </button>
    </div>
  );
};

export default CallPage;
