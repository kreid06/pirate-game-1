// This file exports functions for loading and playing audio assets used in the game.

export const loadAudio = (url: string): Promise<HTMLAudioElement> => {
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.addEventListener('canplaythrough', () => resolve(audio), false);
        audio.addEventListener('error', () => reject(new Error(`Failed to load audio: ${url}`)), false);
    });
};

export const playAudio = (audio: HTMLAudioElement): void => {
    audio.currentTime = 0; // Reset to start
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
};