// 音訊：Web Audio API。
// - 第一次使用者手勢之前不建立 AudioContext、不播放任何聲音 (行動瀏覽器會擋)
// - BGM 以樂譜即時合成；SE 為 Kenney (CC0) 音檔，缺少的音效另以合成補上
// - 任何音檔載入失敗都只略過，不影響遊戲

import { MUSIC } from '../content/music.js';

const SE_FILES = {
    footstep: 'assets/audio/se/footstep.ogg',
    door_open: 'assets/audio/se/door_open.ogg',
    door_close: 'assets/audio/se/door_close.ogg',
    locked: 'assets/audio/se/locked.ogg',
    item: 'assets/audio/se/item.ogg',
    ok: 'assets/audio/se/ok.ogg',
    ng: 'assets/audio/se/ng.ogg',
    select: 'assets/audio/se/select.ogg',
    back: 'assets/audio/se/back.ogg',
    cloth: 'assets/audio/se/cloth.ogg',
};

const NOTE_BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function midiOf(name) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(name);
    if (!m) return null;
    return 12 * (Number(m[3]) + 1) + NOTE_BASE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

const freqOf = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** 把樂譜字串轉成事件：step -> [{ midi, len, wave, vol }] 與總長度 */
export function compileTrack(def) {
    const events = new Map();
    let total = 0;
    for (const voice of def.voices) {
        let step = 0;
        for (const token of voice.notes.split(/\s+/).filter(Boolean)) {
            const [name, lenStr] = token.split(':');
            const len = Number(lenStr || 1);
            if (name !== '-') {
                const midi = midiOf(name);
                if (midi != null) {
                    if (!events.has(step)) events.set(step, []);
                    events.get(step).push({ midi, len, wave: voice.wave, vol: voice.vol });
                }
            }
            step += len;
        }
        total = Math.max(total, step);
    }
    return { events, total: Math.max(4, Math.ceil(total / 4) * 4), stepSec: 60 / def.bpm / 4 };
}

class GameAudio {
    constructor() {
        this.ctx = null;
        this.unlocked = false;
        this.settings = { bgm: 0.6, se: 0.8 };
        this.buffers = new Map(); // SE 名稱 -> AudioBuffer | null
        this.loading = new Map();
        this.track = null; // 目前播放中的 BGM
        this.wantedBgm = null; // 解鎖前要求播放的曲名
        this.lastBlip = 0;
        this.noiseBuffer = null;
        if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => this.onVisibility());
    }

    /** 在第一次使用者手勢中呼叫 */
    unlock() {
        if (this.unlocked) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try {
            this.ctx = new AC();
        } catch {
            return;
        }
        this.unlocked = true;
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.bgmBus = this.ctx.createGain();
        this.seBus = this.ctx.createGain();
        this.bgmBus.connect(this.master);
        this.seBus.connect(this.master);
        this.applySettings();
        this.ctx.resume?.();
        // 雜訊緩衝 (合成音效用)
        const len = this.ctx.sampleRate * 1;
        this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        // 預先解碼 SE 檔
        for (const name of Object.keys(SE_FILES)) this.loadSE(name);
        if (this.wantedBgm) this.playBGM(this.wantedBgm.name, this.wantedBgm.opts);
    }

    setSettings(patch) {
        Object.assign(this.settings, patch);
        this.applySettings();
    }

    applySettings() {
        if (!this.unlocked) return;
        this.bgmBus.gain.value = this.settings.bgm;
        this.seBus.gain.value = this.settings.se;
    }

    onVisibility() {
        if (!this.ctx) return;
        if (document.hidden) this.ctx.suspend?.();
        else this.ctx.resume?.();
    }

    // ---------- SE ----------

    async loadSE(name) {
        if (this.buffers.has(name)) return this.buffers.get(name);
        if (this.loading.has(name)) return this.loading.get(name);
        const p = (async () => {
            try {
                const res = await fetch(SE_FILES[name]);
                if (!res.ok) throw new Error(String(res.status));
                const buf = await res.arrayBuffer();
                const audio = await new Promise((ok, ng) => this.ctx.decodeAudioData(buf, ok, ng));
                this.buffers.set(name, audio);
                return audio;
            } catch {
                this.buffers.set(name, null);
                return null;
            }
        })();
        this.loading.set(name, p);
        return p;
    }

    playSE(name, { vol = 1, rate = 1 } = {}) {
        if (!this.unlocked || !this.ctx || this.ctx.state === 'suspended') return;
        if (SYNTH_SE[name]) {
            try { SYNTH_SE[name](this, this.ctx.currentTime, vol); } catch { /* ignore */ }
            return;
        }
        const buf = this.buffers.get(name);
        if (!buf) return;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = rate;
        const g = this.ctx.createGain();
        g.gain.value = vol;
        src.connect(g).connect(this.seBus);
        src.start();
    }

    // ---------- BGM ----------

    playBGM(name, { fade = 0.8 } = {}) {
        if (!this.unlocked) { this.wantedBgm = { name, opts: { fade } }; return; }
        this.wantedBgm = { name, opts: { fade } };
        if (this.track && this.track.name === name) return;
        const def = MUSIC[name];
        if (!def) return;
        this.stopBGM(fade);
        const compiled = compileTrack(def);
        const gain = this.ctx.createGain();
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + fade);
        gain.connect(this.bgmBus);
        const track = {
            name, gain, compiled,
            nextStep: 0,
            nextTime: this.ctx.currentTime + 0.05,
            timer: null,
            stopped: false,
        };
        track.timer = setInterval(() => this.schedule(track), 40);
        this.schedule(track);
        this.track = track;
    }

    stopBGM(fade = 0.8) {
        const t = this.track;
        this.wantedBgm = null;
        if (!t) return;
        this.track = null;
        t.stopped = true;
        clearInterval(t.timer);
        try {
            t.gain.gain.cancelScheduledValues(this.ctx.currentTime);
            t.gain.gain.setValueAtTime(t.gain.gain.value, this.ctx.currentTime);
            t.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fade);
        } catch { /* ignore */ }
        setTimeout(() => { try { t.gain.disconnect(); } catch { /* ignore */ } }, fade * 1000 + 300);
    }

    get currentBGM() {
        return this.track ? this.track.name : (this.wantedBgm ? this.wantedBgm.name : null);
    }

    schedule(track) {
        if (track.stopped || !this.ctx) return;
        const ahead = this.ctx.currentTime + 0.25;
        const { events, total, stepSec } = track.compiled;
        // 回到分頁後時間可能落後很多：直接跳到現在，避免一次補播
        if (track.nextTime < this.ctx.currentTime - 0.5) track.nextTime = this.ctx.currentTime + 0.05;
        while (track.nextTime < ahead) {
            const evs = events.get(track.nextStep % total);
            if (evs) for (const e of evs) this.note(track, e, track.nextTime, stepSec);
            track.nextTime += stepSec;
            track.nextStep++;
        }
    }

    note(track, e, time, stepSec) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const dur = e.len * stepSec;
        osc.type = e.wave;
        osc.frequency.value = freqOf(e.midi);
        g.gain.setValueAtTime(0.0001, time);
        g.gain.linearRampToValueAtTime(e.vol, time + 0.012);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0001, e.vol * 0.5), time + dur * 0.6);
        g.gain.linearRampToValueAtTime(0.0001, time + dur * 0.98);
        osc.connect(g).connect(track.gain);
        osc.start(time);
        osc.stop(time + dur + 0.02);
    }
}

// ---------------------------------------------------------------------
// 合成音效
// ---------------------------------------------------------------------

function tone(a, { type = 'square', f0, f1, t0, dur, vol = 0.2, vibrato = 0 }) {
    const o = a.ctx.createOscillator();
    const g = a.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 != null) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    if (vibrato) {
        const lfo = a.ctx.createOscillator();
        const lg = a.ctx.createGain();
        lfo.frequency.value = 18;
        lg.gain.value = vibrato;
        lfo.connect(lg).connect(o.frequency);
        lfo.start(t0);
        lfo.stop(t0 + dur + 0.05);
    }
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.seBus);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
}

function noise(a, { t0, dur, vol = 0.3, freq = 2000, q = 1, type = 'bandpass', f1 }) {
    const s = a.ctx.createBufferSource();
    s.buffer = a.noiseBuffer;
    const f = a.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    f.Q.value = q;
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(a.seBus);
    s.start(t0, Math.random() * 0.5);
    s.stop(t0 + dur + 0.05);
}

const SYNTH_SE = {
    blip(a, t, vol) {
        const now = performance.now();
        if (now - a.lastBlip < 45) return;
        a.lastBlip = now;
        tone(a, { f0: 620, t0: t, dur: 0.03, vol: 0.05 * vol });
    },
    sneeze(a, t, vol) {
        noise(a, { t0: t, dur: 0.12, vol: 0.18 * vol, freq: 1200, f1: 2600, q: 2 });
        noise(a, { t0: t + 0.2, dur: 0.28, vol: 0.5 * vol, freq: 900, f1: 3500, q: 1.2 });
        tone(a, { type: 'triangle', f0: 700, f1: 260, t0: t + 0.2, dur: 0.25, vol: 0.12 * vol });
    },
    itch(a, t, vol) {
        for (let i = 0; i < 4; i++) noise(a, { t0: t + i * 0.09, dur: 0.07, vol: 0.2 * vol, freq: 5000, q: 0.8, type: 'highpass' });
    },
    ghost(a, t, vol) {
        tone(a, { type: 'sawtooth', f0: 150, f1: 48, t0: t, dur: 0.9, vol: 0.2 * vol, vibrato: 12 });
        noise(a, { t0: t, dur: 0.5, vol: 0.12 * vol, freq: 300, q: 1, type: 'lowpass' });
    },
    faint(a, t, vol) {
        tone(a, { type: 'triangle', f0: 720, f1: 70, t0: t, dur: 0.75, vol: 0.28 * vol });
        tone(a, { type: 'square', f0: 120, f1: 40, t0: t + 0.7, dur: 0.18, vol: 0.3 * vol });
    },
    bee(a, t, vol) {
        tone(a, { type: 'sawtooth', f0: 230, t0: t, dur: 0.45, vol: 0.1 * vol, vibrato: 40 });
    },
    sting(a, t, vol) {
        tone(a, { type: 'square', f0: 90, f1: 60, t0: t, dur: 0.35, vol: 0.25 * vol });
        tone(a, { type: 'square', f0: 95, f1: 63, t0: t, dur: 0.35, vol: 0.2 * vol });
    },
    tick(a, t, vol) {
        tone(a, { type: 'square', f0: 1000, t0: t, dur: 0.04, vol: 0.08 * vol });
    },
    success(a, t, vol) {
        [523, 659, 784, 1047].forEach((f, i) => tone(a, { type: 'square', f0: f, t0: t + i * 0.09, dur: 0.14, vol: 0.12 * vol }));
    },
    pop(a, t, vol) {
        tone(a, { type: 'sine', f0: 300, f1: 900, t0: t, dur: 0.12, vol: 0.3 * vol });
    },
};

export const audio = new GameAudio();
