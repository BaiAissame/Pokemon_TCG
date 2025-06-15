// service/SoundService.js
class SoundService {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        this.loadSounds();
    }

    loadSounds() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.soundConfigs = {
            cardDraw: { frequency: 440, duration: 0.2, type: 'square' },
            cardPlay: { frequency: 660, duration: 0.3, type: 'sawtooth' },
            attack: { frequency: 220, duration: 0.5, type: 'square' },
            win: { frequency: 880, duration: 1, type: 'sine' },
            lose: { frequency: 110, duration: 1, type: 'square' },
            notification: { frequency: 550, duration: 0.2, type: 'triangle' },
            combo: { frequency: 770, duration: 0.15, type: 'sine' }
        };
    }

    playSound(soundName, options = {}) {
        if (!this.enabled || !this.audioContext) return;

        const config = this.soundConfigs[soundName];
        if (!config) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(
                config.frequency * (options.pitch || 1),
                this.audioContext.currentTime
            );
            oscillator.type = config.type;

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(
                this.volume * (options.volume || 1),
                this.audioContext.currentTime + 0.01
            );
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                this.audioContext.currentTime + config.duration
            );

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + config.duration);
        } catch (error) {
            console.warn('Erreur de lecture audio:', error);
        }
    }

    playSequence(sounds) {
        sounds.forEach((sound, index) => {
            setTimeout(() => {
                this.playSound(sound.name, sound.options);
            }, index * 200);
        });
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}

export default SoundService;
