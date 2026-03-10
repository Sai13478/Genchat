import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  Moon, Sun, User, Shield, Smartphone,
  Bell, Accessibility, Monitor, Lock, Trash2, ArrowLeft, LogOut
} from "lucide-react";
import toast from "react-hot-toast";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Check out the new Orbit settings!", isSent: false },
  { id: 2, content: "It looks incredibly sleek and functional.", isSent: true },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { authUser, updateProfile, isUpdatingProfile, updateSettings, getSessions, logoutAllDevices, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [sessions, setSessions] = useState([]);

  // Local state initialized from authUser.settings
  const [profileData, setProfileData] = useState({
    username: authUser?.username || "",
    bio: authUser?.bio || "Hey there! I am using GenChat.",
  });

  const [accessibility, setAccessibility] = useState(authUser?.settings?.accessibility || {
    fontSize: "medium",
    highContrast: false,
  });

  const [privacy, setPrivacy] = useState(authUser?.settings?.privacy || {
    readReceipts: true,
  });

  const [notifications, setNotifications] = useState(authUser?.settings?.notifications || {
    messageSounds: true,
    desktopAlerts: true,
  });

  useEffect(() => {
    if (activeTab === "devices") {
      getSessions().then(setSessions);
    }
  }, [activeTab, getSessions]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    await updateProfile(profileData);
  };

  const handleUpdateSettings = async (category, key, value) => {
    const updatedCategory = { ... (category === 'accessibility' ? accessibility : category === 'privacy' ? privacy : notifications), [key]: value };

    if (category === 'accessibility') setAccessibility(updatedCategory);
    else if (category === 'privacy') setPrivacy(updatedCategory);
    else if (category === 'notifications') setNotifications(updatedCategory);

    await updateSettings({ [category]: updatedCategory });
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "accessibility", label: "Accessibility", icon: Accessibility },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "devices", label: "Devices", icon: Monitor },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-[#111b21] rounded-2xl p-6 border border-white/5 shadow-xl">
              <h3 className="text-lg font-bold text-[#e9edef] mb-6">Edit Profile</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1">Username</label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="w-full bg-[#0b141a] border border-white/10 rounded-xl px-4 py-3 text-[#e9edef] focus:border-primary focus:ring-1 ring-primary/20 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1">Bio / Status</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full bg-[#0b141a] border border-white/10 rounded-xl px-4 py-3 text-[#e9edef] focus:border-primary focus:ring-1 ring-primary/20 outline-none transition-all h-28 resize-none placeholder:text-slate-700"
                    placeholder="Tell the world about yourself..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.98]"
                >
                  {isUpdatingProfile ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </div>
        );

      case "accessibility":
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-[#111b21] rounded-2xl p-6 border border-white/5 space-y-6 shadow-xl">
              <div className="flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-[#e9edef] group-hover:text-primary transition-colors">Font Size</h4>
                  <p className="text-sm text-slate-500">Adjust the message display size</p>
                </div>
                <select
                  value={accessibility.fontSize}
                  onChange={(e) => handleUpdateSettings('accessibility', 'fontSize', e.target.value)}
                  className="bg-[#0b141a] border border-white/10 rounded-xl px-4 py-2 text-sm text-[#e9edef] outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div className="flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-[#e9edef] group-hover:text-primary transition-colors">High Contrast</h4>
                  <p className="text-sm text-slate-500">Increase visual contrast for better readability</p>
                </div>
                <button
                  onClick={() => handleUpdateSettings('accessibility', 'highContrast', !accessibility.highContrast)}
                  className={`w-12 h-6 rounded-full transition-all relative ${accessibility.highContrast ? "bg-primary shadow-lg shadow-primary/20" : "bg-slate-700 hover:bg-slate-600"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${accessibility.highContrast ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-[#e9edef] group-hover:text-primary transition-colors">Dark Mode</h4>
                  <p className="text-sm text-slate-500">Enable premium dark aesthetic (System Default)</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full transition-all relative ${theme === "genchat-dark" ? "bg-primary shadow-lg shadow-primary/20" : "bg-slate-700 hover:bg-slate-600"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === "genchat-dark" ? "left-7" : "left-1"}`} />
                </button>
              </div>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-[#111b21] rounded-2xl p-6 border border-white/5 space-y-6 shadow-xl">
              <div className="flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-[#e9edef] group-hover:text-primary transition-colors">Read Receipts</h4>
                  <p className="text-sm text-slate-500">Let others see when you've read messages</p>
                </div>
                <button
                  onClick={() => handleUpdateSettings('privacy', 'readReceipts', !privacy.readReceipts)}
                  className={`w-12 h-6 rounded-full transition-all relative ${privacy.readReceipts ? "bg-primary shadow-lg shadow-primary/20" : "bg-slate-700 hover:bg-slate-600"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${privacy.readReceipts ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-6 group">
                <div className="flex items-center gap-3 text-primary font-bold text-sm">
                  <Lock size={16} /> Two-step Verification
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">Add an extra layer of security to your account by requiring a PIN when registering your phone number again.</p>
                <button className="text-sm font-bold text-primary hover:underline transition-all">Setup now</button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-[#111b21] rounded-2xl p-6 border border-white/5 space-y-6 shadow-xl">
              <div className="flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-[#e9edef] group-hover:text-primary transition-colors">Message Sounds</h4>
                  <p className="text-sm text-slate-500">Play a sound for incoming messages</p>
                </div>
                <button
                  onClick={() => handleUpdateSettings('notifications', 'messageSounds', !notifications.messageSounds)}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications.messageSounds ? "bg-primary shadow-lg shadow-primary/20" : "bg-slate-700 hover:bg-slate-600"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications.messageSounds ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-[#e9edef] group-hover:text-primary transition-colors">Desktop Alerts</h4>
                  <p className="text-sm text-slate-500">Show a banner for new messages on your desktop</p>
                </div>
                <button
                  onClick={() => handleUpdateSettings('notifications', 'desktopAlerts', !notifications.desktopAlerts)}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications.desktopAlerts ? "bg-primary shadow-lg shadow-primary/20" : "bg-slate-700 hover:bg-slate-600"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications.desktopAlerts ? "left-7" : "left-1"}`} />
                </button>
              </div>
            </div>
          </div>
        );

      case "devices":
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-[#111b21] rounded-2xl p-6 border border-white/5 shadow-xl">
              <h4 className="font-bold text-[#e9edef] mb-6 flex items-center gap-2">
                <Monitor size={20} className="text-primary" /> Logged In Devices
              </h4>
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <p className="text-center text-slate-500 py-4 italic text-sm">Loading sessions...</p>
                ) : (
                  sessions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-[#0b141a] border border-white/5 group hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-all">
                          {item.device.toLowerCase().includes("phone") ? (
                            <Smartphone className="text-primary" size={20} />
                          ) : (
                            <Monitor className="text-primary" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#e9edef] flex items-center gap-2">
                            {item.device}
                            {item.current && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Current</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium tracking-wide">{item.location}</p>
                        </div>
                      </div>
                      {!item.current && (
                        <button className="text-[11px] font-bold text-error/60 hover:text-error hover:underline transition-all">Log out</button>
                      )}
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={logoutAllDevices}
                className="w-full mt-8 text-sm font-bold text-error border border-error/20 py-3.5 rounded-2xl hover:bg-error/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Logout from all devices
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full flex flex-col orbit-bg overflow-hidden">
      <div className='px-6 py-4 border-b border-white/5 bg-[#202c33] shrink-0 z-10 shadow-lg flex items-center justify-between'>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              console.log("Settings Back Button Clicked");
              e.preventDefault();
              e.stopPropagation();
              navigate("/");
            }}
            className="md:hidden p-2 hover:bg-white/5 rounded-full text-slate-400 relative z-[9999] cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#e9edef]">Settings</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase opacity-70">Orbit Configuration</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="md:hidden p-2 hover:bg-red-500/10 rounded-full text-slate-400 hover:text-red-400 transition-all"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-[80px] md:w-[260px] border-r border-white/5 bg-[#111b21] p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group
                ${activeTab === tab.id
                  ? "bg-primary text-white shadow-xl shadow-primary/20 translate-x-1"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }
              `}
            >
              <tab.icon size={20} className={activeTab === tab.id ? "scale-110" : "group-hover:scale-110 transition-transform"} />
              <span className="hidden md:block font-bold text-sm tracking-tight">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b141a]/50 backdrop-blur-sm p-4 md:p-10">
          <div className="max-w-3xl mx-auto flex flex-col gap-10">
            {renderContent()}

            {/* Global Preview Section */}
            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-3 px-1">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h3 className="text-lg font-bold text-[#e9edef]">Live Appearance Preview</h3>
              </div>
              <div className="rounded-3xl border border-white/5 overflow-hidden bg-[#111b21]/80 backdrop-blur-md shadow-2xl p-8 border-t-white/10 relative group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="max-w-md mx-auto relative z-10">
                  <div className="bg-[#0b141a] rounded-3xl shadow-2xl overflow-hidden border border-white/10 transform transition-transform group-hover:scale-[1.01]">
                    <div className="px-5 py-4 border-b border-white/5 bg-[#202c33]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20">S</div>
                        <div>
                          <h3 className="font-bold text-sm text-[#e9edef]">System Preview</h3>
                          <div className="flex items-center gap-1.5">
                            <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Active Settings</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`p-6 space-y-5 min-h-[180px] transition-all ${accessibility.fontSize === "small" ? "text-xs" : accessibility.fontSize === "large" ? "text-lg" : "text-sm"}`}>
                      {PREVIEW_MESSAGES.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isSent ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
                          <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${msg.isSent
                            ? "bg-primary text-white shadow-lg shadow-primary/20 rounded-tr-none"
                            : "bg-[#202c33] text-[#e9edef] border border-white/5 rounded-tl-none"}`}>
                            <p className="leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}
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
