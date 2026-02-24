import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300 w-full overflow-hidden transition-all duration-700">
      <div className="flex items-center justify-center p-4 md:p-8 h-full">
        <div className="glassy rounded-[2.5rem] w-full h-full max-w-7xl max-h-[calc(100dvh-4rem)] overflow-hidden shadow-2xl transition-all duration-500">
          <div className="flex h-full rounded-[2.5rem] overflow-hidden">
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
