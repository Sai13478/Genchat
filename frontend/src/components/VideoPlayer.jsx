import React, { useEffect, useRef } from 'react';
import { useCallStore } from '../store/useCallStore';

const VideoPlayer = () => {
    // Select only the streams from the store to prevent unnecessary re-renders
    const remoteStream = useCallStore(state => state.remoteStream);
    
    // Using a ref to directly manipulate the video element
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        // This effect runs whenever the remoteStream changes
        if (remoteVideoRef.current && remoteStream) {
            console.log("Attaching remote stream to video element.");
            // Set the srcObject of the video element to the remote stream
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // If there's no remote stream, we don't need to render anything
    if (!remoteStream) {
        return null;
    }

    return (
        <div className="remote-video-container">
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={false} // Make sure this is false to hear the audio
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
        </div>
    );
};

export default VideoPlayer;
