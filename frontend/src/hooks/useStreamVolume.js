import { useState, useEffect } from "react";

const useStreamVolume = (stream) => {
    const [volume, setVolume] = useState(0);

    useEffect(() => {
        if (!stream) {
            setVolume(0);
            return;
        }

        let audioContext;
        let analyser;
        let microphone;
        let javascriptNode;

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);

            javascriptNode.onaudioprocess = () => {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                let values = 0;

                const length = array.length;
                for (let i = 0; i < length; i++) {
                    values += array[i];
                }

                const average = values / length;
                setVolume(average);
            };
        } catch (e) {
            console.error("Error setting up volume meter:", e);
        }

        return () => {
            if (javascriptNode) javascriptNode.disconnect();
            if (analyser) analyser.disconnect();
            if (microphone) microphone.disconnect();
            if (audioContext) audioContext.close();
        };
    }, [stream]);

    return volume;
};

export default useStreamVolume;
