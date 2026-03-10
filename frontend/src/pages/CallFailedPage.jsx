import { useLocation, useNavigate } from "react-router-dom";
import { PhoneOff, Home, RefreshCw } from "lucide-react";

const CallFailedPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const reason = location.state?.reason || "The call could not be completed at this time.";

    return (
        <div className='flex-1 flex flex-col items-center justify-center bg-[#0b141a] text-white p-6 animate-in fade-in duration-500'>
            <div className='relative mb-12'>
                <div className='w-32 h-32 rounded-full bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/30'>
                    <PhoneOff size={48} className='text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' />
                </div>
                <div className='absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center animate-bounce shadow-lg shadow-red-500/40'>
                    <span className='font-bold text-lg'>!</span>
                </div>
            </div>

            <div className='text-center max-w-md space-y-4 mb-12'>
                <h1 className='text-4xl font-black tracking-tight text-white'>Call Failed</h1>
                <p className='text-slate-400 text-lg leading-relaxed'>
                    {reason}
                </p>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center'>
                <button
                    onClick={() => navigate("/")}
                    className='flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all font-bold text-slate-200 hover:text-white'
                >
                    <Home size={20} />
                    Back to Home
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className='flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl transition-all font-bold text-white shadow-lg shadow-emerald-500/20'
                >
                    <RefreshCw size={20} />
                    Try Again
                </button>
            </div>
        </div>
    );
};

export default CallFailedPage;
