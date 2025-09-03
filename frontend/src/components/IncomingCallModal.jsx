import { Phone, PhoneOff } from "lucide-react";
import useCallStore from "../store/useCallStore";
import { useSocket } from "../context/SocketContext";

const IncomingCallModal = () => {
	const { incomingCallData, answerCall, declineCall } = useCallStore();
	const { socket } = useSocket();

	if (!incomingCallData) return null;

	const handleAccept = () => {
		answerCall(socket);
	};

	const handleDecline = () => {
		declineCall(socket);
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<div className='bg-base-200 p-6 rounded-lg shadow-lg flex flex-col items-center gap-4'>
				<div className='avatar'>
					<div className='w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2'>
						<img src={incomingCallData.from.profilePic || "/avatar.png"} alt='caller avatar' />
					</div>
				</div>
				<p className='text-lg font-semibold'>{incomingCallData.from.fullName} is calling...</p>
				<div className='flex gap-4 mt-2'>
					<button onClick={handleDecline} className='btn btn-circle btn-error'>
						<PhoneOff />
					</button>
					<button onClick={handleAccept} className='btn btn-circle btn-success'>
						<Phone />
					</button>
				</div>
			</div>
		</div>
	);
};

export default IncomingCallModal;