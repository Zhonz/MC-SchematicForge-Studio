export type SoundType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface SoundOptions {
  type?: SoundType;
  frequency?: number;
  duration?: number;
  volume?: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
}

export interface AudioContextState {
  context: AudioContext;
  masterGain: GainNode;
  analyser: AnalyserNode;
}

export class AudioUtils {
  private static instance: AudioUtils;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeSounds: Map<string, AudioBufferSourceNode> = new Map();

  static getInstance(): AudioUtils {
    if (!AudioUtils.instance) {
      AudioUtils.instance = new AudioUtils();
    }
    return AudioUtils.instance;
  }

  static init(): AudioContextState | null {
    if (AudioUtils.instance.audioContext) {
      return {
        context: AudioUtils.instance.audioContext,
        masterGain: AudioUtils.instance.masterGain!,
        analyser: AudioUtils.instance.analyser!,
      };
    }
    
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioCtx();
      
      const masterGain = context.createGain();
      masterGain.connect(context.destination);
      
      const analyser = context.createAnalyser();
      analyser.connect(masterGain);
      
      AudioUtils.instance.audioContext = context;
      AudioUtils.instance.masterGain = masterGain;
      AudioUtils.instance.analyser = analyser;
      
      return {
        context,
        masterGain,
        analyser,
      };
    } catch {
      return null;
    }
  }

  static getContext(): AudioContext | null {
    if (!AudioUtils.instance.audioContext) {
      AudioUtils.init();
    }
    return AudioUtils.instance.audioContext;
  }

  static resume(): Promise<void> {
    const context = AudioUtils.getContext();
    if (!context) return Promise.resolve();
    
    if (context.state === 'suspended') {
      return context.resume();
    }
    
    return Promise.resolve();
  }

  static suspend(): Promise<void> {
    const context = AudioUtils.getContext();
    if (!context) return Promise.resolve();
    
    return context.suspend();
  }

  static setMasterVolume(volume: number): void {
    if (AudioUtils.instance.masterGain) {
      AudioUtils.instance.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  static getMasterVolume(): number {
    if (AudioUtils.instance.masterGain) {
      return AudioUtils.instance.masterGain.gain.value;
    }
    return 1;
  }

  static playTone(
    frequency: number,
    duration: number,
    options?: { type?: SoundType; volume?: number }
  ): Promise<void> {
    return new Promise(async (resolve) => {
      const context = AudioUtils.getContext();
      if (!context) {
        resolve();
        return;
      }
      
      await AudioUtils.resume();
      
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = options?.type || 'sine';
      oscillator.frequency.value = frequency;
      
      gainNode.gain.value = options?.volume ?? 0.5;
      gainNode.gain.setValueAtTime(options?.volume ?? 0.5, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(AudioUtils.instance.masterGain!);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + duration);
      
      oscillator.onended = () => {
        resolve();
      };
    });
  }

  static playBeep(frequency = 800, duration = 100, volume = 0.5): Promise<void> {
    return AudioUtils.playTone(frequency, duration, { type: 'sine', volume });
  }

  static playSuccess(): Promise<void> {
    return new Promise(async (resolve) => {
      await AudioUtils.playTone(523.25, 0.15, { volume: 0.5 });
      await AudioUtils.playTone(659.25, 0.15, { volume: 0.5 });
      await AudioUtils.playTone(783.99, 0.3, { volume: 0.5 });
      resolve();
    });
  }

  static playError(): Promise<void> {
    return new Promise(async (resolve) => {
      await AudioUtils.playTone(200, 0.15, { type: 'square', volume: 0.3 });
      await AudioUtils.playTone(150, 0.3, { type: 'square', volume: 0.3 });
      resolve();
    });
  }

  static playClick(): Promise<void> {
    return AudioUtils.playTone(1000, 0.05, { type: 'sine', volume: 0.3 });
  }

  static playPop(): Promise<void> {
    return new Promise(async (resolve) => {
      await AudioUtils.playTone(400, 0.05, { type: 'sine', volume: 0.4 });
      await AudioUtils.playTone(300, 0.05, { type: 'sine', volume: 0.3 });
      resolve();
    });
  }

  static async playMelody(notes: Array<{ frequency: number; duration: number }>, volume = 0.5): Promise<void> {
    for (const note of notes) {
      await AudioUtils.playTone(note.frequency, note.duration, { volume });
    }
  }

  static createEnvelope(
    gainNode: GainNode,
    context: AudioContext,
    options: { attack?: number; decay?: number; sustain?: number; release?: number }
  ): void {
    const { attack = 0.1, decay = 0.1, sustain = 0.5, release = 0.2 } = options;
    const now = context.currentTime;
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + attack);
    gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);
    gainNode.gain.setValueAtTime(sustain, now + attack + decay + 0.5);
    gainNode.gain.linearRampToValueAtTime(0, now + attack + decay + 0.5 + release);
  }

  static async loadSound(url: string, name?: string): Promise<string> {
    const context = AudioUtils.getContext();
    if (!context) throw new Error('AudioContext not initialized');
    
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    
    const soundName = name || url;
    AudioUtils.instance.audioBuffers.set(soundName, audioBuffer);
    
    return soundName;
  }

  static playSound(name: string, options?: { volume?: number; loop?: boolean }): AudioBufferSourceNode | null {
    const context = AudioUtils.getContext();
    if (!context) return null;
    
    const buffer = AudioUtils.instance.audioBuffers.get(name);
    if (!buffer) return null;
    
    const source = context.createBufferSource();
    const gainNode = context.createGain();
    
    source.buffer = buffer;
    source.loop = options?.loop ?? false;
    
    gainNode.gain.value = options?.volume ?? 1;
    
    source.connect(gainNode);
    gainNode.connect(AudioUtils.instance.masterGain!);
    
    source.start(0);
    
    AudioUtils.instance.activeSounds.set(name, source);
    
    return source;
  }

  static stopSound(name: string): void {
    const source = AudioUtils.instance.activeSounds.get(name);
    if (source) {
      try {
        source.stop();
      } catch {
      }
      AudioUtils.instance.activeSounds.delete(name);
    }
  }

  static stopAllSounds(): void {
    AudioUtils.instance.activeSounds.forEach((source) => {
      try {
        source.stop();
      } catch {
      }
    });
    AudioUtils.instance.activeSounds.clear();
  }

  static createAnalyser(): AnalyserNode | null {
    const context = AudioUtils.getContext();
    if (!context) return null;
    
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    
    return analyser;
  }

  static getFrequencyData(analyser: AnalyserNode): Uint8Array {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  static getTimeDomainData(analyser: AnalyserNode): Uint8Array {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  static createFilter(
    type: BiquadFilterType,
    frequency: number,
    Q = 1
  ): BiquadFilterNode | null {
    const context = AudioUtils.getContext();
    if (!context) return null;
    
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    
    return filter;
  }

  static createConvolver(impulseUrl: string): Promise<ConvolverNode | null> {
    return new Promise(async (resolve) => {
      const context = AudioUtils.getContext();
      if (!context) {
        resolve(null);
        return;
      }
      
      try {
        const convolver = context.createConvolver();
        const response = await fetch(impulseUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        
        convolver.buffer = audioBuffer;
        resolve(convolver);
      } catch {
        resolve(null);
      }
    });
  }

  static async createReverb(
    duration: number,
    decay: number
  ): Promise<ConvolverNode | null> {
    const context = AudioUtils.getContext();
    if (!context) return null;
    
    const rate = context.sampleRate;
    const length = rate * duration;
    const impulse = context.createBuffer(2, length, rate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    const convolver = context.createConvolver();
    convolver.buffer = impulse;
    
    return convolver;
  }

  static createCompressor(): DynamicsCompressorNode | null {
    const context = AudioUtils.getContext();
    if (!context) return null;
    
    return context.createDynamicsCompressor();
  }
}

export class SoundEffects {
  private context: AudioContext;
  private gainNode: GainNode;

  constructor(context?: AudioContext) {
    this.context = context || AudioUtils.getContext()!;
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
  }

  play(type: 'sine' | 'square' | 'sawtooth' | 'triangle', frequency: number, duration: number): void {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.value = 0.3;
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  blip(): void {
    this.play('square', 660, 0.05);
  }

  click(): void {
    this.play('square', 1000, 0.02);
  }

  pop(): void {
    this.play('sine', 400, 0.05);
  }

  beep(): void {
    this.play('sine', 800, 0.1);
  }

  boop(): void {
    this.play('triangle', 200, 0.15);
  }

  ding(): void {
    this.play('sine', 880, 0.3);
  }

  chime(): void {
    this.play('sine', 1318.5, 0.5);
  }

  laser(): void {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(1000, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.2);
    
    gainNode.gain.value = 0.2;
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.2);
  }

  explosion(): void {
    const bufferSize = this.context.sampleRate * 0.5;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const noise = this.context.createBufferSource();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    
    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    
    gainNode.gain.value = 0.5;
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    noise.start(this.context.currentTime);
  }
}

export class MusicPlayer {
  private context: AudioContext;
  private masterGain: GainNode;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private tempo: number = 120;
  private scheduledNodes: AudioScheduledSourceNode[] = [];

  constructor(context?: AudioContext) {
    this.context = context || AudioUtils.getContext()!;
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
  }

  setVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  setTempo(tempo: number): void {
    this.tempo = Math.max(30, Math.min(300, tempo));
  }

  noteToFrequency(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  playNote(note: number, duration: number, startTime?: number): void {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.value = this.noteToFrequency(note);
    
    const start = startTime || this.context.currentTime;
    const end = start + duration;
    
    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(0.5, start + 0.01);
    gainNode.gain.setValueAtTime(0.5, end - 0.01);
    gainNode.gain.linearRampToValueAtTime(0, end);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(start);
    oscillator.stop(end);
    
    this.scheduledNodes.push(oscillator);
  }

  playSequence(notes: Array<{ note: number; duration: number; delay?: number }>): void {
    let currentTime = this.context.currentTime;
    
    for (const { note, duration, delay = 0 } of notes) {
      const noteDuration = (60 / this.tempo) * duration;
      this.playNote(note, noteDuration, currentTime + delay);
      currentTime += noteDuration;
    }
  }

  playScale(startNote: number, count: number, ascending = true): void {
    const notes: Array<{ note: number; duration: number }> = [];
    
    for (let i = 0; i < count; i++) {
      const note = ascending ? startNote + i : startNote - i;
      notes.push({ note, duration: 0.25 });
    }
    
    this.playSequence(notes);
  }

  arpeggio(rootNote: number, intervals: number[], times: number): void {
    const notes: Array<{ note: number; duration: number }> = [];
    
    for (let i = 0; i < times; i++) {
      for (const interval of intervals) {
        notes.push({ note: rootNote + interval, duration: 0.125 });
      }
    }
    
    this.playSequence(notes);
  }

  chord(notes: number[], duration: number): void {
    const startTime = this.context.currentTime;
    
    for (const note of notes) {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = this.noteToFrequency(note);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.setValueAtTime(0.3, startTime + duration - 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    }
  }

  stop(): void {
    this.scheduledNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
      }
    });
    this.scheduledNodes = [];
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private chunks: Blob[] = [];

  async requestPermission(): Promise<boolean> {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      return false;
    }
  }

  async startRecording(): Promise<MediaRecorder | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      source.connect(analyser);
      
      this.mediaRecorder = new MediaRecorder(stream);
      this.chunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(100);
      
      return this.mediaRecorder;
    } catch {
      return null;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        resolve(blob);
      };
      
      this.mediaRecorder.stop();
    });
  }

  getAnalyser(): AnalyserNode | null {
    if (!this.audioContext) return null;
    
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;
    return analyser;
  }

  getFrequencyData(): Uint8Array | null {
    const analyser = this.getAnalyser();
    if (!analyser) return null;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

export class AudioVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement, analyser: AnalyserNode) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.analyser = analyser;
  }

  drawBarChart(): void {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      
      this.analyser.getByteFrequencyData(dataArray);
      
      this.ctx.fillStyle = 'rgb(0, 0, 0)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      const barWidth = (this.canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * this.canvas.height;
        
        const r = (dataArray[i] / 255) * 255;
        const g = 50;
        const b = (dataArray[i] / 255) * 255;
        
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  }

  drawWaveform(): void {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      
      this.analyser.getByteTimeDomainData(dataArray);
      
      this.ctx.fillStyle = 'rgb(0, 0, 0)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'rgb(0, 255, 0)';
      this.ctx.beginPath();
      
      const sliceWidth = this.canvas.width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * this.canvas.height) / 2;
        
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
      this.ctx.stroke();
    };
    
    draw();
  }

  drawCircular(): void {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      
      this.analyser.getByteFrequencyData(dataArray);
      
      this.ctx.fillStyle = 'rgb(0, 0, 0)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.4;
      
      for (let i = 0; i < bufferLength; i++) {
        const amplitude = dataArray[i] / 255;
        const angle = (i / bufferLength) * Math.PI * 2;
        
        const innerRadius = radius;
        const outerRadius = radius + amplitude * 100;
        
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * outerRadius;
        const y2 = centerY + Math.sin(angle) * outerRadius;
        
        const hue = (amplitude * 360) | 0;
        this.ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      }
    };
    
    draw();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

export default AudioUtils;
