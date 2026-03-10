import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import Loader from "./InnovationLoader"; // User renamed this to Loader in their edit
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import useListenTyping from "../hooks/useListenTyping";
import { useSocket } from "../context/SocketContext";
import { Check, CheckCheck, Reply, Trash2, Pin, Edit2, Forward, Smile, ShieldAlert } from "lucide-react";
import ForwardModal from "./ForwardModal";
import { motion, AnimatePresence } from "framer-motion";

const ChatContainer = () => {
  const { messages, getMessages, isMessagesLoading, selectedUser, setReplyingTo, deleteMessage, pinMessage, addReaction, setEditingMessage } = useChatStore();
  const { authUser } = useAuthStore();
  const { socket } = useSocket();
  const scrollRef = useRef(null);

  const [forwardModalMessage, setForwardModalMessage] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  useListenTyping();

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id, selectedUser.isGroup);

      if (!selectedUser.isGroup) {
        socket?.emit("markMessagesAsSeen", { conversationId: selectedUser.conversationId, userIdOfSender: selectedUser._id });
      }

      const pollInterval = setInterval(() => {
        getMessages(selectedUser._id, selectedUser.isGroup, true);
      }, 10000);

      return () => clearInterval(pollInterval);
    }
  }, [selectedUser?._id, selectedUser?.isGroup, getMessages, socket]);

  // Robust scrolling logic using scrollTop to avoid window-level displacement
  useEffect(() => {
    if (scrollRef.current && messages) {
      const container = scrollRef.current;
      // Use requestAnimationFrame for smoother integration with React's render cycle
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      });
    }
  }, [messages]);

  const onReact = (messageId, emoji) => {
    addReaction(messageId, emoji);
    setHoveredMessageId(null); // Close menu after reacting
  };

  return (
    <div className='flex-1 flex flex-col overflow-hidden bg-[#0a0f14]'>
      <ChatHeader />

      <div
        ref={scrollRef}
        className='flex-1 overflow-y-auto p-2 space-y-6 chat-bg relative scrollbar-hide'
      >
        {isMessagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {Array.isArray(messages) &&
                messages.map((message) => {
                  const isMe = message.senderId === authUser._id;
                  const isHovered = hoveredMessageId === message._id;

                  return (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`group flex flex-col ${isMe ? "items-end" : "items-start"} relative`}
                    >
                      <div className={`chat ${isMe ? "chat-end" : "chat-start"} w-full max-w-[85%] md:max-w-[65%]`}>
                        <div className='chat-image avatar mt-1'>
                          <div className='size-10 rounded-full ring-2 ring-white/5 overflow-hidden shadow-xl'>
                            <img
                              src={
                                isMe
                                  ? authUser.profilePic || "/avatar.png"
                                  : message.senderProfilePic || "/avatar.png"
                              }
                              alt='avatar'
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>

                        <div
                          className="flex flex-col gap-1 relative"
                          onMouseEnter={() => setHoveredMessageId(message._id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          {/* Reaction & Action Menu - High-End Floating Menu */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                className={`absolute -top-14 ${isMe ? "right-4" : "left-4"} flex items-center gap-2 p-2.5 bg-[#1a2329]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50`}
                              >
                                <div className="flex items-center gap-2 px-1 border-r border-white/10">
                                  {["👍", "❤️", "😂", "😮", "😢", "🔥", "🥿"].map(emoji => (
                                    <button
                                      key={emoji}
                                      onClick={() => onReact(message._id, emoji)}
                                      className="hover:scale-150 transition-transform duration-200 text-2xl px-1"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5 pr-1">
                                  <button onClick={() => setReplyingTo(message)} title="Reply" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-100"><Reply size={18} /></button>
                                  <button onClick={() => setForwardModalMessage(message)} title="Forward" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-100"><Forward size={18} /></button>
                                  <button onClick={() => pinMessage(message._id)} title="Pin" className="p-2 hover:bg-white/10 rounded-xl transition-colors"><Pin size={18} className={message.isPinned ? "text-blue-400" : "text-slate-100"} /></button>
                                  {isMe && (
                                    <>
                                      <button onClick={() => setEditingMessage(message)} title="Edit" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-100"><Edit2 size={18} /></button>
                                      <button onClick={() => deleteMessage(message._id)} title="Delete" className="p-2 hover:bg-red-500/30 rounded-xl transition-colors text-red-400"><Trash2 size={18} /></button>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div
                            className={`flex flex-col p-0 rounded-2xl shadow-lg overflow-visible min-w-[100px] md:min-w-[120px] ${isMe
                              ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                              : "bg-[#202c33] text-[#e9edef]"
                              } ${message.isPinned ? "ring-2 ring-blue-500/40" : ""} relative`}
                          >
                            {message.isPinned && (
                              <div className="flex items-center gap-2 text-[10px] text-blue-200 px-5 py-2 bg-black/10 font-bold tracking-widest uppercase rounded-t-[28px]">
                                <Pin size={11} /> Pinned
                              </div>
                            )}

                            {message.replyTo && (
                              <div className="bg-black/20 mx-4 mt-4 p-3 rounded-2xl border-l-[6px] border-blue-400 text-xs opacity-90 cursor-pointer hover:bg-black/30 transition-all">
                                <p className="truncate italic font-medium opacity-60">"{messages.find(m => m._id === message.replyTo)?.text || "Original message"}"</p>
                              </div>
                            )}

                            {message.image && (
                              <div className="p-2 pb-0">
                                <img src={message.image} alt='Attachment' className='max-h-[500px] w-full object-cover rounded-[22px] cursor-pointer hover:brightness-110 transition-all shadow-lg' />
                              </div>
                            )}

                            <div className="px-3 py-1.5">
                              {!isMe && selectedUser.isGroup && (
                                <span className="text-[11px] font-black text-blue-400 tracking-wider uppercase opacity-90 block mb-0.5">{message.senderName || "User"}</span>
                              )}
                              <div className="flex items-end gap-2">
                                <div className="flex-1 min-w-0">
                                  {message.text && <span className="text-[14px] leading-[1.5] whitespace-pre-wrap font-sans">{message.text}</span>}
                                </div>
                                <div className="flex items-center gap-1 shrink-0 pb-0.5">
                                  {message.isEdited && <span className="text-[9px] opacity-40 italic">edited</span>}
                                  <time className='text-[10px] opacity-50 font-medium tracking-tight'>{formatMessageTime(message.createdAt)}</time>
                                  {isMe && (
                                    message.seen ? (
                                      <CheckCheck className='size-3.5 text-blue-300' />
                                    ) : message.delivered ? (
                                      <CheckCheck className='size-3.5 text-slate-400/60' />
                                    ) : (
                                      <Check className='size-3.5 text-slate-400/60' />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reactions display - Positioned relative to bubble bottom edge */}
                            <AnimatePresence>
                              {message.reactions && message.reactions.length > 0 && (
                                <motion.div
                                  initial={{ scale: 0.5, opacity: 0, y: 5 }}
                                  animate={{ scale: 1, opacity: 1, y: 0 }}
                                  className={`absolute -bottom-3 ${isMe ? "left-6" : "right-6"} flex gap-1.5 z-20`}
                                >
                                  {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => (
                                    <motion.div
                                      whileHover={{ scale: 1.25, y: -2 }}
                                      key={emoji}
                                      className="bg-[#1a2329] border border-white/30 rounded-full px-3 py-1 text-[13px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center gap-2 text-white font-bold backdrop-blur-3xl"
                                    >
                                      <span>{emoji}</span>
                                      <span className="text-[11px] text-blue-200">{message.reactions.filter(r => r.emoji === emoji).length}</span>
                                    </motion.div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Message Input or Admin-only notice */}
      <AnimatePresence mode="wait">
        {(() => {
          if (selectedUser.isGroup) {
            const isAdmin = selectedUser.admins?.some(id =>
              (typeof id === 'string' ? id : id._id) === authUser._id
            );

            if (selectedUser.settings?.sendMessages && !isAdmin) {
              return (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="p-4 bg-[#1f2c33]/50 backdrop-blur-md border-t border-white/5 flex items-center justify-center gap-3 text-slate-400"
                >
                  <ShieldAlert size={18} className="text-amber-500/60" />
                  <p className="text-sm font-medium italic">Only admins can send messages to this group</p>
                </motion.div>
              );
            }
          }
          return (
            <motion.div
              key="input"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <MessageInput />
            </motion.div>
          );
        })()}
      </AnimatePresence>

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