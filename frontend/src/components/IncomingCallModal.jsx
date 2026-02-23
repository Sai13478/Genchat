import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCallStore } from "../store/useCallStore";
import { useSocket } from "../context/SocketContext";
import { Phone, PhoneOff } from "lucide-react";

const IncomingCallModal = () => {
    const { incomingCallData, answerCall, declineCall } = useCallStore();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const ringtoneRef = useRef(null);

    useEffect(() => {
        if (incomingCallData) {
            // Initialize ringtone
            ringtoneRef.current = new Audio("/ringtone.mp3");
            ringtoneRef.current.loop = true;

            // Play ringtone (handle potential autoplay restrictions)
            ringtoneRef.current.play().catch((error) => {
                console.warn("Ringtone autoplay prevented: ", error);
            });
        }

        // Cleanup: stop audio when user answers/declines or component unmounts
        return () => {
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current.currentTime = 0;
                ringtoneRef.current = null;
            }
        };
    }, [incomingCallData]);

    if (!incomingCallData) {
        return null;
    }

    const handleAccept = () => {
        answerCall(socket);
        navigate("/call");
    };

    const handleDecline = () => {
        declineCall(socket);
    };

    const { from, callType } = incomingCallData;

    return (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[100] animate-in fade-in duration-300'>
            <div className='relative w-full h-full max-w-lg flex flex-col items-center justify-between py-20 px-8 text-white'>
                <div className='flex flex-col items-center gap-6'>
                    <div className='avatar'>
                        <div className='w-32 h-32 rounded-full ring-4 ring-emerald-500/30 ring-offset-4 ring-offset-black/50 overflow-hidden shadow-2xl'>
                            <img src={from.profilePic || "/avatar.png"} alt='Caller' className="object-cover w-full h-full" />
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className='text-3xl font-bold tracking-tight'>
                            {from.username}
                            <span className="text-lg opacity-50 ml-1">#{from.tag}</span>
                        </h2>
                        <p className='text-emerald-400 font-medium animate-pulse'>Incoming {callType} call...</p>
                    </div>
                </div>

                <div className='flex justify-center gap-12 sm:gap-20 w-full mb-10'>
                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={handleDecline}
                            className='w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95'
                        >
                            <PhoneOff size={28} />
                        </button>
                        <span className="text-sm font-medium text-red-100">Decline</span>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={handleAccept}
                            className='w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 animate-bounce-subtle'
                        >
                            <Phone size={28} />
                        </button>
                        <span className="text-sm font-medium text-emerald-100">Accept</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default IncomingCallModal;