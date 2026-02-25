import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-[calc(100vh-64px)] bg-gradient-to-br from-base-100 via-primary/5 to-secondary/10 w-full overflow-hidden transition-all duration-700 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>
      <div className="flex items-center justify-center p-4 md:p-6 h-full relative z-10">
        <div className="glassy rounded-3xl w-full h-full max-w-7xl max-h-[850px] overflow-hidden shadow-2xl border border-white/5">
          <div className="flex h-full rounded-3xl overflow-hidden">
            {/* Mobile: show sidebar when no user selected, hide when chatting */}
            {/* Desktop: always show sidebar */}
            <div className={`${selectedUser ? "hidden md:flex" : "flex"} w-full md:w-1/3 md:max-w-sm`}>
              <Sidebar />
            </div>

            {/* Mobile: show chat when user selected, hide when no user */}
            {/* Desktop: always show chat area */}
            <div className={`${selectedUser ? "flex" : "hidden md:flex"} flex-1`}>
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
