import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { MessageSquare } from "lucide-react";

const NoChatSelected = () => {
  const { socket } = useSocket();
  // State to store call logs fetched from the server
  const [callLogs, setCallLogs] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Emit an event to request existing call logs from your backend
    socket.emit("fetchCallLogs");

    // Listen for the server's response with the call logs
    socket.on("callLogs", (logs) => {
      setCallLogs(logs);
    });

    // Listen for new call log events in real time
    socket.on("newCallLog", (log) => {
      // Prepend the new log to show the latest at the top
      setCallLogs((prevLogs) => [log, ...prevLogs]);
    });

    // Cleanup event listeners when the component unmounts
    return () => {
      socket.off("callLogs");
      socket.off("newCallLog");
    };
  }, [socket]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-16 bg-transparent">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center
             justify-center shadow-2xl shadow-primary/20 transition-all duration-700 hover:scale-105"
            >
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tighter text-slate-100">
            Welcome to <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent italic">Gen</span>Chat
          </h2>
          <p className="text-slate-500 text-lg max-w-sm mx-auto leading-relaxed">
            Please choose a conversation from the sidebar to begin chatting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;