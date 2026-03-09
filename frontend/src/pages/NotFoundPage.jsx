import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

const NotFoundPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/login");
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen w-full orbit-bg flex items-center justify-center p-6 select-none font-sans">
            <div className="max-w-md w-full orbit-card p-8 md:p-12 flex flex-col items-center gap-8 shadow-2xl border border-white/5">

                <div className="flex flex-col items-center gap-2">
                    <span className="text-[12px] tracking-[0.3em] font-extrabold uppercase text-blue-500/80">Error 404</span>
                </div>

                <Loader />

                <div className="flex flex-col items-center gap-3 text-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        LOST IN ORBIT
                    </h1>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        The resource you're looking for has drifted away. <br />
                        Pulling you back to base in a few seconds...
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 w-full">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all duration-200 active:scale-[0.98]"
                    >
                        Return to Main
                    </button>

                    <div className="flex items-center gap-2 opacity-40">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Redirecting</span>
                        <div className="flex gap-1">
                            <div className="h-1 w-1 rounded-full bg-white animate-pulse"></div>
                            <div className="h-1 w-1 rounded-full bg-white animate-pulse [animation-delay:0.2s]"></div>
                            <div className="h-1 w-1 rounded-full bg-white animate-pulse [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
