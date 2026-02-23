import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-200 w-full">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full h-[calc(100vh-8rem)] overflow-hidden">
          <div className="flex h-full rounded-lg overflow-hidden">
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
