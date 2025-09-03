import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import useListenMessages from "../hooks/useListenMessages";
import useListenTyping from "../hooks/useListenTyping";
import { useSocket } from "../context/SocketContext";
import { CheckCheck } from "lucide-react";

const ChatContainer = () => {
  const { messages, getMessages, isMessagesLoading, selectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const { socket } = useSocket();
  const messageEndRef = useRef(null);

  // This custom hook now handles all real-time message listening.
  useListenMessages();
  useListenTyping();

  useEffect(() => {
    // When the selected user changes:
    if (selectedUser?._id) {
      // 1. Fetch the message history.
      getMessages(selectedUser._id);

      // 2. Mark all messages from this user as seen.
      socket?.emit("markMessagesAsSeen", { conversationId: selectedUser.conversationId, userIdOfSender: selectedUser._id });
    }
  }, [selectedUser?._id, getMessages, socket]);

  useEffect(() => {
    // Scroll to the bottom whenever the messages array changes.
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className='flex-1 flex flex-col overflow-auto'>
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col overflow-auto'>
      <ChatHeader />

      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {Array.isArray(messages) &&
          messages.map((message) => (
            <div
              key={message._id}
              className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            >
              <div className=' chat-image avatar'>
                <div className='size-10 rounded-full border'>
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt='profile pic'
                  />
                </div>
              </div>
              <div className='chat-header mb-1'>
                <time className='text-xs opacity-50 ml-1'>{formatMessageTime(message.createdAt)}</time>
              </div>
              <div className='chat-bubble flex flex-col'>
                {message.image && (
                  <img src={message.image} alt='Attachment' className='sm:max-w-[200px] rounded-md mb-2' />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
              {message.senderId === authUser._id && (
                <div className='chat-footer opacity-50 flex gap-1 items-center'>
                  <CheckCheck className={`size-4 ${message.seen ? "text-blue-500" : ""}`} />
                </div>
              )}
            </div>
          ))}
        {/* Empty div used as a stable anchor for auto-scrolling */}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
