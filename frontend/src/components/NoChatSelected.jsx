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
    <div className="flex flex-1 items-center justify-center w-full px-4 sm:px-6 lg:px-8 bg-base-100/50">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl text-center space-y-6 sm:space-y-8">
        {/* Icon Display */}
        <div className="flex justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-primary/10 flex items-center justify-center animate-bounce shadow-lg">
            <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary" />
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-base-content">
          Welcome to <span className="text-primary">Genchat</span>
        </h2>

        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-base-content/70 leading-relaxed max-w-md mx-auto px-2">
          Please choose a conversation from the sidebar to begin chatting.  
          On smaller screens, use the{" "}
          <span className="font-semibold text-primary">hamburger menu</span> to
          access your chats.
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
