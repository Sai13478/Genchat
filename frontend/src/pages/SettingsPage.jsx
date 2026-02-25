import { useThemeStore } from "../store/useThemeStore";
import { Send, Moon, Sun } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { registerPasskey } = useAuthStore();

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-900/40 custom-scrollbar">
      <div className='px-4 py-3 border-b border-white/5 bg-slate-800/20 backdrop-blur-md sticky top-0 z-10'>
        <h1 className="text-xl font-bold text-slate-100">Settings</h1>
        <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Customize your experience</p>
      </div>

      <div className="w-full flex justify-center p-4 py-12">
        <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 space-y-8 w-full max-w-2xl border border-white/5 shadow-2xl">

          <div className="bg-base-300 rounded-3xl p-6 flex items-center justify-between gap-4 border border-base-content/5 shadow-xl">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${theme === "genchat-dark" ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"}`}>
                {theme === "genchat-dark" ? <Moon size={24} /> : <Sun size={24} />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-base-content">Dark Mode</h3>
                <p className="text-sm text-base-content/60">Switch between light and dark premium aesthetics</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`
              relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 outline-none ring-offset-2 focus:ring-2 focus:ring-primary/50
              ${theme === "genchat-dark" ? "bg-primary" : "bg-slate-200"}
            `}
            >
              <span className="sr-only">Toggle theme</span>
              <span
                className={`
                inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-500
                ${theme === "genchat-dark" ? "translate-x-7" : "translate-x-1"}
              `}
              />
            </button>
          </div>



          {/* Preview Section */}
          <h3 className="text-lg font-semibold mb-3">Preview</h3>
          <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
            <div className="p-4 bg-base-200">
              <div className="max-w-lg mx-auto">
                {/* Mock Chat UI */}
                <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                        J
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">John Doe</h3>
                        <p className="text-xs text-base-content/70">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                    {PREVIEW_MESSAGES.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`
                          max-w-[80%] rounded-xl p-3 shadow-sm
                          ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                        `}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`
                            text-[10px] mt-1.5
                            ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                          `}
                          >
                            12:00 PM
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-base-300 bg-base-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered flex-1 text-sm h-10"
                        placeholder="Type a message..."
                        value="This is a preview"
                        readOnly
                      />
                      <button className="btn btn-primary h-10 min-h-0">
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
