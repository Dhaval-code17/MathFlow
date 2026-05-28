class SoundEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // volume
        this.masterGain.connect(this.ctx.destination);
    }

    _resume() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    playTone(freq, type = 'sine', duration = 0.1, fadeOut = true) {
        this._resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.5, now);
        if (fadeOut) {
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        }

        osc.stop(now + duration);
    }

    playNumber(num) {
        // Different pitch for each number
        const baseFreq = 400;
        const pitch = baseFreq + (parseInt(num) || 0) * 50;
        this.playTone(pitch, 'sine', 0.1);
    }

    playOperator() {
        this.playTone(300, 'triangle', 0.15);
    }

    playClear() {
        this._resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(now + 0.3);
    }

    playEqual(resultVal) {
        this._resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        // Pitch based on result magnitude (capped)
        const magnitude = Math.min(Math.abs(resultVal) / 100, 1000);

        osc.frequency.setValueAtTime(220 + magnitude, now);
        osc.frequency.linearRampToValueAtTime(440 + magnitude, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(880 + magnitude, now + 0.4);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(now + 0.8);
    }

    playLevelUp() {
        this._resume();
        const now = this.ctx.currentTime;

        const playNote = (freq, time) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.value = freq;
            osc.type = 'square';

            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 0.4);
        };

        playNote(440, now);
        playNote(554, now + 0.1); // C#
        playNote(659, now + 0.2); // E
        playNote(880, now + 0.3); // A
    }

    playError() {
        this.playTone(150, 'sawtooth', 0.3);
    }

    playGlitch() {
        const now = this.ctx.currentTime;
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(100 + Math.random() * 500, 'sawtooth', 0.05);
            }, i * 50);
        }
    }
}

export default new SoundEngine();
