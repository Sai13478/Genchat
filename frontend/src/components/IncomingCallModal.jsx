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
        <div className='fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50'>
            <div className='bg-base-200 p-8 rounded-lg shadow-xl text-center flex flex-col items-center gap-4 animate-fade-in'>
                <div className='avatar mb-4'>
                    <div className='w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2'>
                        <img src={from.profilePic || "/avatar.png"} alt='Caller Avatar' />
                    </div>
                </div>
                <h2 className='text-2xl font-bold'>Incoming {callType} Call</h2>
                <p className='text-lg text-gray-400'>{from.fullName} is calling...</p>
                <div className='flex justify-center gap-6 mt-4'>
                    <button onClick={handleDecline} className='btn btn-circle btn-error btn-lg'>
                        <PhoneOff />
                    </button>
                    <button onClick={handleAccept} className='btn btn-circle btn-success btn-lg'>
                        <Phone />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;