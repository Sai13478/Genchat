import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { MessageSquare } from "lucide-react";

const socket = io();

const NoChatSelected = () => {
  const [callLogs, setCallLogs] = useState([]);

  useEffect(() => {
    socket.emit("fetchCallLogs");
    socket.on("callLogs", (logs) => setCallLogs(logs));
    socket.on("newCallLog", (log) =>
      setCallLogs((prevLogs) => [log, ...prevLogs])
    );

    return () => {
      socket.off("callLogs");
      socket.off("newCallLog");
    };
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center w-full px-4 sm:px-8 lg:px-16 bg-base-100/50">
      <div className="w-full max-w-lg text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary/10 flex items-center justify-center animate-bounce shadow-lg">
            <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-base-content">
          Welcome to <span className="text-primary">Genchat</span>
        </h2>
        <p className="text-sm sm:text-base text-base-content/70 leading-relaxed max-w-md mx-auto">
          Please choose a conversation from the sidebar to begin chatting. Stay
          connected and start meaningful conversations anytime.
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
