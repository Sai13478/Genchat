import { useState } from "react";
import { useThemeStore } from "../store/useThemeStore";
import {
  Send, Moon, Sun, User, Shield, Smartphone,
  Bell, Accessibility, Check, ChevronRight,
  Monitor, Keyboard, Eye, EyeOff, Lock
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Check out the new Orbit settings!", isSent: false },
  { id: 2, content: "It looks incredibly sleek and functional.", isSent: true },
];

const SettingsPage = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");

  // Local state for market-default settings
  const [accessibility, setAccessibility] = useState({
    fontSize: "medium",
    highContrast: false,
    boldText: false,
  });

  const [privacy, setPrivacy] = useState({
    readReceipts: true,
    lastSeen: "everyone",
    profilePhoto: "everyone",
  });

  const [notifications, setNotifications] = useState({
    messageSounds: true,
    desktopAlerts: true,
    previews: true,
  });

  const [profileData, setProfileData] = useState({
    username: authUser?.username || "",
    bio: authUser?.bio || "Hey there! I am using GenChat.",
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "accessibility", label: "Accessibility", icon: Accessibility },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "devices", label: "Devices", icon: Monitor },
  ];

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    await updateProfile(profileData);
    toast.success("Profile updated successfully");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-[#111b21] rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold text-[#e9edef] mb-6">Edit Profile</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Username</label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="w-full bg-[#0b141a] border border-white/10 rounded-xl px-4 py-3 text-[#e9edef] focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Bio / Status</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full bg-[#0b141a] border border-white/10 rounded-xl px-4 py-3 text-[#e9edef] focus:border-blue-500 outline-none transition-all h-24 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
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
            <div className="bg-[#111b21] rounded-2xl p-6 border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#e9edef]">Font Size</h4>
                  <p className="text-sm text-slate-500">Adjust the message display size</p>
                </div>
                <select
                  value={accessibility.fontSize}
                  onChange={(e) => setAccessibility({ ...accessibility, fontSize: e.target.value })}
                  className="bg-[#0b141a] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e9edef] outline-none"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#e9edef]">High Contrast</h4>
                  <p className="text-sm text-slate-500">Increase visual contrast</p>
                </div>
                <button
                  onClick={() => setAccessibility({ ...accessibility, highContrast: !accessibility.highContrast })}
                  className={`w-12 h-6 rounded-full transition-all relative ${accessibility.highContrast ? "bg-blue-600" : "bg-slate-700"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${accessibility.highContrast ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#e9edef]">Dark Mode</h4>
                  <p className="text-sm text-slate-500">Enable premium dark aesthetic</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full transition-all relative ${theme === "genchat-dark" ? "bg-blue-600" : "bg-slate-700"}`}
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
            <div className="bg-[#111b21] rounded-2xl p-6 border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#e9edef]">Read Receipts</h4>
                  <p className="text-sm text-slate-500">Let others see when you've read messages</p>
                </div>
                <button
                  onClick={() => setPrivacy({ ...privacy, readReceipts: !privacy.readReceipts })}
                  className={`w-12 h-6 rounded-full transition-all relative ${privacy.readReceipts ? "bg-blue-600" : "bg-slate-700"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${privacy.readReceipts ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-6">
                <div className="flex items-center gap-3 text-blue-500 font-bold text-sm">
                  <Lock size={16} /> Two-step Verification
                </div>
                <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                <button className="text-sm font-bold text-blue-500 hover:underline">Setup now</button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-[#111b21] rounded-2xl p-6 border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#e9edef]">Message Sounds</h4>
                  <p className="text-sm text-slate-500">Play a sound for incoming messages</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, messageSounds: !notifications.messageSounds })}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications.messageSounds ? "bg-blue-600" : "bg-slate-700"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications.messageSounds ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#e9edef]">Desktop Alerts</h4>
                  <p className="text-sm text-slate-500">Show a banner for new messages</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, desktopAlerts: !notifications.desktopAlerts })}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications.desktopAlerts ? "bg-blue-600" : "bg-slate-700"}`}
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
            <div className="bg-[#111b21] rounded-2xl p-6 border border-white/5">
              <h4 className="font-bold text-[#e9edef] mb-4">Logged In Devices</h4>
              <div className="space-y-4">
                {[
                  { device: "Windows Chrome", location: "Bangalore, India", current: true },
                  { device: "iPhone 15 Pro", location: "Mumbai, India", current: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#0b141a] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600/10 p-2 rounded-lg">
                        {item.device.includes("iPhone") ? <Smartphone className="text-blue-500" size={20} /> : <Monitor className="text-blue-500" size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#e9edef]">{item.device} {item.current && <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded-full ml-2">Current</span>}</p>
                        <p className="text-[10px] text-slate-500">{item.location}</p>
                      </div>
                    </div>
                    {!item.current && <button className="text-xs text-red-500 hover:underline">Log out</button>}
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 text-sm font-bold text-red-500 border border-red-500/20 py-2 rounded-xl hover:bg-red-500/10 transition-all">
                Logout from all devices
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
      <div className='px-4 py-3 border-b border-white/5 bg-[#202c33] shrink-0'>
        <h1 className="text-xl font-bold text-[#e9edef]">Settings</h1>
        <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Orbit Configuration</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-[80px] md:w-[240px] border-r border-white/5 bg-[#111b21] p-3 flex flex-col gap-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all
                ${activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}
              `}
            >
              <tab.icon size={20} />
              <span className="hidden md:block font-medium text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b141a] p-4 md:p-8">
          <div className="max-w-3xl mx-auto flex flex-col gap-8">
            {renderContent()}

            {/* Global Preview Section */}
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-bold text-[#e9edef] px-1">Live Appearance Preview</h3>
              <div className="rounded-2xl border border-white/5 overflow-hidden bg-[#111b21] shadow-2xl p-6">
                <div className="max-w-md mx-auto">
                  <div className="bg-[#0b141a] rounded-2xl shadow-sm overflow-hidden border border-white/10">
                    <div className="px-4 py-3 border-b border-white/5 bg-[#202c33]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">S</div>
                        <div>
                          <h3 className="font-bold text-sm text-[#e9edef]">System Preview</h3>
                          <p className="text-[10px] text-emerald-500">Active Settings</p>
                        </div>
                      </div>
                    </div>
                    <div className={`p-4 space-y-4 min-h-[160px] ${accessibility.fontSize === "small" ? "text-xs" : accessibility.fontSize === "large" ? "text-lg" : "text-sm"} ${accessibility.boldText ? "font-bold" : ""}`}>
                      {PREVIEW_MESSAGES.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${msg.isSent ? "bg-blue-600 text-white shadow-lg" : "bg-[#202c33] text-[#e9edef] border border-white/5"}`}>
                            <p>{msg.content}</p>
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
