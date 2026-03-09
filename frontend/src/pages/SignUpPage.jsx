import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from "lucide-react";
import { Link } from "react-router-dom";

import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const handleValidation = () => {
    if (!formData.username.trim()) return "Username is required";
    if (!formData.email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email)) return "Invalid email format";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = handleValidation();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    signup(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center orbit-bg px-6">
      <div className="w-full max-w-md space-y-8">
        {/* LOGO */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-2 group">
            <div
              className="size-12 rounded-xl bg-blue-600 flex items-center justify-center transition-transform shadow-lg"
            >
              <MessageSquare className="size-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold mt-2 text-[#e9edef]">Create Account</h1>
            <p className="text-slate-400">Get started with your free account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-400">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="size-5 text-slate-500" />
              </div>
              <input
                type="text"
                className="w-full bg-[#111b21] border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-[#e9edef] outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                placeholder="johndoe (tag will be added automatically)"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-400">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="size-5 text-slate-500" />
              </div>
              <input
                type="email"
                className="w-full bg-[#111b21] border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-[#e9edef] outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-400">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="size-5 text-slate-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-[#111b21] border border-white/5 rounded-lg pl-10 pr-10 py-2.5 text-[#e9edef] outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-400">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="size-5 text-slate-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-[#111b21] border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-[#e9edef] outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            disabled={isSigningUp}
          >
            {isSigningUp ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default SignUpPage;
