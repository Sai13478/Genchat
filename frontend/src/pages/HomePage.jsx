import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-gradient-to-br from-base-200 via-base-300 to-primary/20 w-full overflow-hidden transition-all duration-700">
      <div className="flex items-center justify-center pt-20 pb-4 px-4 h-full">
        <div className="glassy rounded-3xl w-full h-full max-h-[calc(100dvh-8rem)] overflow-hidden">
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
