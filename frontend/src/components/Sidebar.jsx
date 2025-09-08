import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocket } from "../context/SocketContext";
import useGetConversations from "../hooks/useGetConversations";
import Conversation from "./Conversation";

const Sidebar = () => {
  const { authUser, logout } = useAuthStore();
  const { onlineUsers } = useSocket();
  const { conversations, loading } = useGetConversations();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between p-4 border-b md:hidden bg-base-100">
        <Menu
          className="w-6 h-6 cursor-pointer"
          onClick={() => setIsOpen(true)}
        />
        <p className="font-bold">Genchat</p>
        <LogOut className="cursor-pointer" onClick={logout} />
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out
           w-64 bg-base-100 border-r border-slate-500 p-4 flex flex-col z-50
           md:relative md:translate-x-0 md:flex md:w-1/3 max-w-sm`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={authUser.profilePic}
              alt="User avatar"
              className="w-8 h-8 rounded-full"
            />
            <p>{authUser.fullName}</p>
          </div>
          <LogOut className="cursor-pointer" onClick={logout} />
        </div>

        <div className="divider px-3" />

        <div className="flex-1 overflow-auto">
          {loading && <p>Loading conversations...</p>}
          {!loading &&
            conversations.map((conversation) => (
              <Conversation
                key={conversation._id}
                conversation={conversation}
                isOnline={onlineUsers?.includes(conversation._id)}
              />
            ))}
        </div>

        {/* Close button on mobile */}
        <button
          className="absolute top-4 right-4 md:hidden"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
      </div>
    </>
  );
};

export default Sidebar;
    