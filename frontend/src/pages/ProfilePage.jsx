import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, ArrowLeft, LogOut } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, logout } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="h-full w-full overflow-y-auto orbit-bg">
      <div className='px-4 py-3 border-b border-white/5 bg-[#202c33] sticky top-0 z-10 flex items-center gap-3'>
        <button
          onClick={(e) => {
            console.log("Profile Back Button Clicked");
            e.preventDefault();
            e.stopPropagation();
            navigate("/");
          }}
          className="md:hidden p-2 hover:bg-white/5 rounded-full text-slate-400 relative z-[9999] cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#e9edef]">Profile</h1>
          <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Manage your personal information</p>
        </div>
        <button
          onClick={logout}
          className="md:hidden p-2 hover:bg-red-500/10 rounded-full text-slate-400 hover:text-red-400 transition-all"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="w-full flex justify-center p-4 py-12">
        <div className="bg-[#111b21] rounded-2xl p-8 space-y-8 w-full max-w-2xl border border-white/5 shadow-2xl">

          {/* avatar upload section */}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-[#202c33]"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-blue-600 hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-slate-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </div>
              <p className="px-4 py-2.5 bg-[#202c33] rounded-lg border border-white/5 text-[#e9edef]">
                {authUser?.username}
                <span className="text-xs opacity-50 ml-1">#{authUser?.tag}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-slate-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-[#202c33] rounded-lg border border-white/5 text-[#e9edef]">{authUser?.email}</p>
            </div>
          </div>

          <div className="mt-6 bg-[#202c33]/50 rounded-xl p-6 border border-white/5">
            <h2 className="text-lg font-medium text-[#e9edef] mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Member Since</span>
                <span className="text-[#e9edef]">{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Account Status</span>
                <span className="text-emerald-500 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;