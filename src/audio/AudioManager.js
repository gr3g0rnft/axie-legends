// =============================================
// AUDIO MANAGER - Motor de sonido (SFX Howl + Música HTML5)
// =============================================
import { Howler, Howl } from 'howler';
import musicFile from '../../public/sounds/music.webm';

export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.musicAudio = null;
        this.masterVolume = 1.0;
        this.sfxVolume = 1.0;
        this.musicVolume = 0.5;
        this.muted = false;
        this.initialized = false;
        
        this.soundConfig = {
            shoot: { src: '/axie-legends/sounds/shoot.wav', volume: 0.6 },
            hit: { src: '/axie-legends/sounds/hit.wav', volume: 0.7 },
            explosion: { src: '/axie-legends/sounds/explosion.wav', volume: 0.8 },
            gold: { src: '/axie-legends/sounds/gold.wav', volume: 0.5 },
            potion: { src: '/axie-legends/sounds/potion.wav', volume: 0.6 },
            victory: { src: '/axie-legends/sounds/victory.wav', volume: 0.8 },
            defeat: { src: '/axie-legends/sounds/defeat.wav', volume: 0.8 },
            wave: { src: '/axie-legends/sounds/gold.wav', volume: 0.5, rate: 1.5 },
            shop: { src: '/axie-legends/sounds/potion.wav', volume: 0.4, rate: 0.7 },
        };
    }

    init() {
        if (this.initialized) return Promise.resolve();
        Howler.autoUnlock = true;
        this.loadSettings();
        this.initialized = true;
        console.log('🔊 AudioManager inicializado');
        return Promise.resolve();
    }

    load(name) {
        if (this.sounds.has(name)) return this.sounds.get(name);
        const cfg = this.soundConfig[name];
        if (!cfg) return null;
        
        const howl = new Howl({
            src: [cfg.src],
            volume: (cfg.volume || 1) * this.sfxVolume * this.masterVolume,
            rate: cfg.rate || 1,
            preload: true,
        });
        this.sounds.set(name, howl);
        return howl;
    }

    play(name, options = {}) {
        if (this.muted) return null;
        const howl = this.sounds.get(name) || this.load(name);
        if (!howl) return null;
        const volume = (options.volume ?? 1) * this.sfxVolume * this.masterVolume;
        const id = howl.play();
        howl.volume(volume, id);
        return { howl, id, stop: () => howl.stop(id) };
    }

    playMusic(name = 'music') {
        if (this.muted) return null;
        if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio = null;
        }

        console.log(`🎶 Iniciando música de fondo (${musicFile})...`);
        try {
            this.musicAudio = new Audio(musicFile);
            this.musicAudio.loop = true;
            this.musicAudio.volume = this.musicVolume * this.masterVolume;
            
            this.musicAudio.play().then(() => {
                console.log('🎵 ¡Música sonando correctamente!');
            }).catch(err => {
                console.warn('⚠️ Reproducción automática bloqueada por el navegador. Se activará al hacer clic.', err);
                // Desbloqueo automático al primer clic en la página
                const unlock = () => {
                    this.musicAudio.play().catch(() => {});
                    window.removeEventListener('pointerdown', unlock);
                };
                window.addEventListener('pointerdown', unlock);
            });
        } catch (e) {
            console.error('❌ Error creando elemento de música:', e);
        }
        return this.musicAudio;
    }

    stopMusic() {
        if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio = null;
        }
    }

    setMasterVolume(v) { this.masterVolume = Math.max(0, Math.min(1, v)); this.applyVolumes(); this.saveSettings(); }
    setSfxVolume(v) { this.sfxVolume = Math.max(0, Math.min(1, v)); this.applyVolumes(); this.saveSettings(); }
    setMusicVolume(v) { 
        this.musicVolume = Math.max(0, Math.min(1, v)); 
        if (this.musicAudio) this.musicAudio.volume = this.musicVolume * this.masterVolume;
        this.saveSettings(); 
    }
    
    applyVolumes() {
        this.sounds.forEach(h => h.volume(this.sfxVolume * this.masterVolume));
        if (this.musicAudio) this.musicAudio.volume = this.musicVolume * this.masterVolume;
    }

    setMuted(m) { 
        this.muted = m; 
        Howler.mute(m); 
        if (this.musicAudio) this.musicAudio.muted = m;
        this.saveSettings(); 
    }

    saveSettings() {
        const data = { master: this.masterVolume, sfx: this.sfxVolume, music: this.musicVolume, muted: this.muted };
        localStorage.setItem('axie-legends-audio', JSON.stringify(data));
    }
    
    loadSettings() {
        try {
            const data = JSON.parse(localStorage.getItem('axie-legends-audio') || '{}');
            this.masterVolume = data.master ?? 1;
            this.sfxVolume = data.sfx ?? 1;
            this.musicVolume = data.music ?? 0.5;
            this.muted = data.muted ?? false;
            Howler.volume(this.masterVolume);
        } catch (e) { /* por defecto */ }
    }
}

export const audio = new AudioManager();
export default AudioManager;
