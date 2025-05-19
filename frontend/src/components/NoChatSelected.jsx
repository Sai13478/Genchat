import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { MessageSquare } from "lucide-react";

// Initialize the socket connection (update the URL as needed)
const socket = io();

const NoChatSelected = () => {
  // State to store call logs fetched from the server
  const [callLogs, setCallLogs] = useState([]);

  useEffect(() => {
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
  }, []);

  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-bounce"
            >
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold">Welcome to Genchat</h2>
        <p className="text-base-content/60">
          Please choose a conversation from the sidebar to begin chatting.
        </p>

        {/* Call Logs Section */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold">Recent Call Logs</h3>
          {callLogs.length === 0 ? (
            <div className="mt-4 text-lg">No call logs available yet</div>
          ) : (
            callLogs.map((log, index) => (
              <div
                key={index}
                className="flex justify-center items-center mt-4 bg-white p-4 rounded-lg shadow"
              >
                <img
                  src={
                    log.icon ||
                    "https://example.com/your_whatsapp_icon_image.png"
                  }
                  alt="Call Icon"
                  className="w-12 h-12 mr-2"
                />
                <span className="text-lg">
                  {/* log.type could be 'Missed Call', 'Incoming', etc.
                      log.timestamp (in milliseconds) is formatted as a readable time */}
                  {log.type} at {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;