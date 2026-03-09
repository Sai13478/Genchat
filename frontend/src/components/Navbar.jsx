import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, PhoneCall } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="bg-[#202c33] border-b border-white/5 sticky top-0 z-40 w-full transition-all duration-300">
      <div className="container mx-auto px-4 h-14">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group transition-all">
              <div className="size-9 rounded-lg bg-blue-600 flex items-center justify-center transition-transform shadow-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tighter">
                <span className="text-blue-500 italic">Gen</span>
                <span className="text-[#e9edef]">Chat</span>
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={"/settings"}
              className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-white"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-white" title="Profile">
                  <User className="size-5" />
                </Link>

                <button
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-all text-slate-400 hover:text-red-500 ml-1"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut className="size-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
