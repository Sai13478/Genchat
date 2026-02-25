import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
    </div>
  );
};

export default HomePage;