import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, PhoneCall } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-40 w-full backdrop-blur-xl transition-all duration-300">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group transition-all">
              <div className="size-10 rounded-xl bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/5">
                <MessageSquare className="w-6 h-6 text-primary group-hover:text-primary transition-colors" />
              </div>
              <h1 className="text-2xl font-bold tracking-tighter">
                <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent italic">Gen</span>
                <span className="text-slate-100">Chat</span>
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={"/settings"}
              className="btn btn-sm btn-ghost gap-2 hover:bg-white/5 border border-white/5 modern-shadow transition-all"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline text-slate-300">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/call-logs"} className="btn btn-sm btn-ghost gap-2 hover:bg-white/5 border border-white/5 modern-shadow transition-all">
                  <PhoneCall className='size-4 text-slate-400' />
                  <span className='hidden sm:inline text-slate-300'>Call Logs</span>
                </Link>

                <Link to={"/profile"} className="btn btn-sm btn-ghost gap-2 hover:bg-white/5 border border-white/5 modern-shadow transition-all">
                  <User className="size-5 text-slate-400" />
                  <span className="hidden sm:inline text-slate-300">Profile</span>
                </Link>

                <button
                  className="btn btn-sm btn-outline btn-error gap-2 ml-2 hover:scale-105 transition-transform"
                  onClick={logout}
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Logout</span>
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
