import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="h-screen flex items-center justify-center orbit-bg px-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-2 group">
            <div
              className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center transition-transform shadow-lg"
            >
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold mt-2 text-[#e9edef]">Welcome Back</h1>
            <p className="text-slate-400">Sign in to your account</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-400">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="email"
                className="w-full bg-[#111b21] border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-[#e9edef] outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                placeholder="you@example.com"
                value={formData.email}
                autoComplete="email"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-400">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-[#111b21] border border-white/5 rounded-lg pl-10 pr-10 py-2.5 text-[#e9edef] outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Logging in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-slate-400">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-blue-500 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
