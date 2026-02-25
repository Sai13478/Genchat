import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();


  return (
    <div className='h-full bg-transparent flex items-center justify-center p-4 md:p-6'>
      <div className='flex h-full w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden bg-slate-900/60 backdrop-blur-2xl border border-slate-800 modern-shadow'>
        <div className={`w-full md:w-1/3 md:max-w-sm border-r border-slate-800 bg-slate-900/40 ${selectedUser ? "hidden md:flex" : "flex"}`}>
          <Sidebar />
        </div>
        <div className={`flex-1 flex flex-col overflow-hidden ${selectedUser ? "flex" : "hidden md:flex"}`}>
          {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
        </div>
      </div>
    </div>
  );
};

export default HomePage;