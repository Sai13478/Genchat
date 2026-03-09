import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import InnovationLoader from "./InnovationLoader";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import useListenMessages from "../hooks/useListenMessages";
import useListenTyping from "../hooks/useListenTyping";
import { useSocket } from "../context/SocketContext";
import { Check, CheckCheck, Reply, Trash2, Pin, Edit2, Forward, Smile, ShieldAlert } from "lucide-react";
import ForwardModal from "./ForwardModal";

const ChatContainer = () => {
  const { messages, getMessages, isMessagesLoading, selectedUser, setReplyingTo, deleteMessage, pinMessage, addReaction, setEditingMessage } = useChatStore();
  const { authUser } = useAuthStore();
  const { socket } = useSocket();
  const messageEndRef = useRef(null);

  const [forwardModalMessage, setForwardModalMessage] = useState(null);

  // This custom hook now handles all real-time message listening.
  // useListenMessages is now called globally in App.jsx to handle notifications
  useListenTyping();

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id, selectedUser.isGroup);

      if (!selectedUser.isGroup) {
        socket?.emit("markMessagesAsSeen", { conversationId: selectedUser.conversationId, userIdOfSender: selectedUser._id });
      }
    }
  }, [selectedUser?._id, selectedUser?.isGroup, getMessages, socket]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className='flex-1 flex flex-col overflow-hidden bg-[#0b141a]'>
      <ChatHeader />

      <div className='flex-1 overflow-y-auto p-4 space-y-4 chat-bg relative'>
        {isMessagesLoading ? (
          <InnovationLoader />
        ) : (
          <>
            {Array.isArray(messages) &&
              messages.map((message) => {
                const isMe = message.senderId === authUser._id;

                return (
                  <div
                    key={message._id}
                    className={`group flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className={`chat ${isMe ? "chat-end" : "chat-start"} w-full`}>
                      <div className='chat-image avatar'>
                        <div className='size-10 rounded-full border border-white/5'>
                          <img
                            src={
                              isMe
                                ? authUser.profilePic || "/avatar.png"
                                : message.senderProfilePic || "/avatar.png"
                            }
                            alt='avatar'
                          />
                        </div>
                      </div>
                      <div className='chat-header mb-1 flex items-center gap-2'>
                        {!isMe && selectedUser.isGroup && (
                          <span className="text-xs font-bold text-blue-400">{message.senderName || "User"}</span>
                        )}
                        <time className='text-[10px] opacity-50'>{formatMessageTime(message.createdAt)}</time>
                      </div>

                      <div className="relative flex items-center group/bubble max-w-[85%]">
                        {/* Action Menu - Visible on hover */}
                        <div className={`absolute top-0 ${isMe ? "-left-24" : "-right-28"} hidden group-hover/bubble:flex items-center gap-1 p-1 bg-[#202c33] border border-white/10 rounded-lg shadow-xl z-10 transition-all`}>
                          <button onClick={() => setReplyingTo(message)} title="Reply" className="p-1 hover:bg-white/10 rounded"><Reply size={14} className="text-slate-400" /></button>

                          <div className="relative group/reactions">
                            <button className="p-1 hover:bg-white/10 rounded text-slate-400"><Smile size={14} /></button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/reactions:flex items-center gap-1 p-1.5 bg-[#111b21] border border-white/10 rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                              {["👍", "❤️", "😂", "😮", "😢", "🔥"].map(emoji => (
                                <button key={emoji} onClick={() => addReaction(message._id, emoji)} className="hover:scale-125 transition-transform p-0.5">{emoji}</button>
                              ))}
                            </div>
                          </div>

                          <button onClick={() => setForwardModalMessage(message)} title="Forward" className="p-1 hover:bg-white/10 rounded"><Forward size={14} className="text-slate-400" /></button>
                          <button onClick={() => pinMessage(message._id)} title="Pin" className="p-1 hover:bg-white/10 rounded"><Pin size={14} className={message.isPinned ? "text-blue-400" : "text-slate-400"} /></button>
                          {isMe && (
                            <>
                              <button onClick={() => setEditingMessage(message)} title="Edit" className="p-1 hover:bg-white/10 rounded"><Edit2 size={14} className="text-slate-400" /></button>
                              <button onClick={() => deleteMessage(message._id)} title="Delete" className="p-1 hover:bg-error/20 rounded"><Trash2 size={14} className="text-error" /></button>
                            </>
                          )}
                        </div>

                        <div
                          className={`chat-bubble flex flex-col p-3 rounded-2xl shadow-md w-full ${isMe
                            ? "bg-blue-600 text-white"
                            : "bg-[#202c33] text-[#e9edef]"} ${message.isPinned ? "ring-2 ring-blue-500/50" : ""}`}
                        >
                          {message.isPinned && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-300 mb-1">
                              <Pin size={10} /> Pinned
                            </div>
                          )}

                          {message.replyTo && (
                            <div className="bg-black/20 p-2 rounded-lg border-l-4 border-primary mb-2 text-xs opacity-80 cursor-pointer hover:bg-black/30 transition-all">
                              <p className="font-bold text-primary mb-1">Replying to</p>
                              <p className="truncate italic">"{messages.find(m => m._id === message.replyTo)?.text || "Original message"}"</p>
                            </div>
                          )}

                          {message.image && (
                            <img src={message.image} alt='Attachment' className='sm:max-w-[300px] rounded-xl mb-2 cursor-pointer hover:opacity-90 transition-all' />
                          )}

                          <div className="flex flex-col">
                            {message.text && <p className="text-sm leading-relaxed">{message.text}</p>}
                            <div className="flex justify-end items-center gap-1 mt-1">
                              {message.isEdited && <span className="text-[9px] opacity-40 italic">edited</span>}
                              {isMe && (
                                <div className='opacity-80 flex gap-0.5 items-center'>
                                  {message.seen ? (
                                    <CheckCheck className='size-3 text-blue-400' />
                                  ) : message.delivered ? (
                                    <CheckCheck className='size-3 text-slate-500' />
                                  ) : (
                                    <Check className='size-3 text-slate-500' />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Reactions display */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className={`absolute -bottom-3 ${isMe ? "left-0" : "right-0"} flex gap-1`}>
                              {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => (
                                <div key={emoji} className="bg-[#111b21] border border-white/5 rounded-full px-1.5 py-0.5 text-[10px] shadow-lg flex items-center gap-1">
                                  {emoji} <span className="text-slate-500">{message.reactions.filter(r => r.emoji === emoji).length}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            <div ref={messageEndRef} />
          </>
        )}
      </div>

      {/* Message Input or Admin-only notice */}
      {(() => {
        if (!selectedUser.isGroup) return <MessageInput />;

        const isAdmin = selectedUser.admins?.some(id =>
          (typeof id === 'string' ? id : id._id) === authUser._id
        );

        if (selectedUser.settings?.sendMessages && !isAdmin) {
          return (
            <div className="p-4 bg-[#202c33] border-t border-white/5 flex items-center justify-center gap-3 text-slate-500 animate-in slide-in-from-bottom-2">
              <ShieldAlert size={18} className="text-amber-500/50" />
              <p className="text-sm font-medium italic">Only admins can send messages to this group</p>
            </div>
          );
        }

        return <MessageInput />;
      })()}

      {forwardModalMessage && (
        <ForwardModal
          message={forwardModalMessage}
          onClose={() => setForwardModalMessage(null)}
        />
      )}
    </div>
  );
};

export default ChatContainer;