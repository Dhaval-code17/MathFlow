class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // volume
        this.masterGain.connect(this.ctx.destination);
    }

    playTone(freq, type = 'sine', duration = 0.1, fadeOut = true) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();

        if (fadeOut) {
            gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        }

        osc.stop(this.ctx.currentTime + duration);
    }

    playHover() {
        // Soft digital tick
        this.playTone(800, 'sine', 0.05);
    }

    playClick() {
        // Futuristic beep
        this.playTone(1200, 'square', 0.1);
        setTimeout(() => this.playTone(600, 'sine', 0.1), 50);
    }

    playSuccess() {
        // Rising synth
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(now + 1.5);
    }

    playError() {
        // Glitch
        this.playTone(100, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(80, 'sawtooth', 0.2), 100);
    }

    playGlitch() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playEasterEgg() {
        // Pi sequence or something mysterious
        const notes = [314, 415, 592, 653, 589];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.3), i * 300);
        });
    }
}

export default new SoundManager();
