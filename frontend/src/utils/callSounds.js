// Create a single Audio object to manage the ringtone
// The path '/sounds/ringtone.mp3' directly maps to the file in the 'public/sounds' folder.
const ringtone = new Audio('/sounds/ringtone.mp3');
ringtone.loop = true; // Make the ringtone loop until stopped

/**
 * Plays the incoming call ringtone.
 */
export const playIncomingRingtone = () => {
    // You can use a different sound for incoming calls if you want
    // ringtone.src = '/sounds/incoming_sound.mp3';
    ringtone.play().catch(error => {
        // Autoplay is often blocked by browsers until the user interacts with the page.
        // This error is common and expected in those cases.
        console.warn("Ringtone playback failed, likely due to browser autoplay policy:", error);
    });
};

/**
 * Plays the outgoing call ringtone.
 */
export const playOutgoingRingtone = () => {
    // You can use a different sound for outgoing calls
    // ringtone.src = '/sounds/outgoing_sound.mp3';
    ringtone.play().catch(error => {
        console.warn("Ringtone playback failed, likely due to browser autoplay policy:", error);
    });
};

/**
 * Stops the currently playing ringtone.
 */
export const stopRingtone = () => {
    ringtone.pause();
    ringtone.currentTime = 0; // Reset audio to the beginning
};

