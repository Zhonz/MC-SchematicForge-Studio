export interface VideoOptions {
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  poster?: string;
  preload?: 'auto' | 'metadata' | 'none';
}

export interface VideoFilter {
  name: string;
  value: string;
}

export class VideoUtils {
  private static instance: VideoUtils;
  private videos: Map<string, HTMLVideoElement> = new Map();
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  static getInstance(): VideoUtils {
    if (!VideoUtils.instance) {
      VideoUtils.instance = new VideoUtils();
    }
    return VideoUtils.instance;
  }

  static create(
    container: HTMLElement,
    src: string,
    options?: VideoOptions
  ): HTMLVideoElement {
    const video = document.createElement('video');
    
    video.src = src;
    video.autoplay = options?.autoplay ?? false;
    video.loop = options?.loop ?? false;
    video.muted = options?.muted ?? false;
    video.controls = options?.controls ?? true;
    video.preload = options?.preload ?? 'auto';
    
    if (options?.poster) {
      video.poster = options.poster;
    }
    
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    
    container.appendChild(video);
    
    return video;
  }

  static load(
    container: HTMLElement,
    sources: Array<{ src: string; type: string }>,
    options?: VideoOptions
  ): HTMLVideoElement {
    const video = document.createElement('video');
    
    video.autoplay = options?.autoplay ?? false;
    video.loop = options?.loop ?? false;
    video.muted = options?.muted ?? false;
    video.controls = options?.controls ?? true;
    video.preload = options?.preload ?? 'auto';
    
    if (options?.poster) {
      video.poster = options.poster;
    }
    
    sources.forEach(({ src, type }) => {
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      video.appendChild(source);
    });
    
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    
    container.appendChild(video);
    
    return video;
  }

  static play(video: HTMLVideoElement): Promise<void> {
    return video.play() || Promise.resolve();
  }

  static pause(video: HTMLVideoElement): void {
    video.pause();
  }

  static togglePlay(video: HTMLVideoElement): Promise<void> {
    if (video.paused) {
      return VideoUtils.play(video);
    }
    VideoUtils.pause(video);
    return Promise.resolve();
  }

  static seek(video: HTMLVideoElement, time: number): void {
    video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
  }

  static seekToPercent(video: HTMLVideoElement, percent: number): void {
    const time = (percent / 100) * (video.duration || 0);
    VideoUtils.seek(video, time);
  }

  static seekForward(video: HTMLVideoElement, seconds: number): void {
    VideoUtils.seek(video, video.currentTime + seconds);
  }

  static seekBackward(video: HTMLVideoElement, seconds: number): void {
    VideoUtils.seek(video, video.currentTime - seconds);
  }

  static setVolume(video: HTMLVideoElement, volume: number): void {
    video.volume = Math.max(0, Math.min(1, volume));
  }

  static getVolume(video: HTMLVideoElement): number {
    return video.volume;
  }

  static mute(video: HTMLVideoElement): void {
    video.muted = true;
  }

  static unmute(video: HTMLVideoElement): void {
    video.muted = false;
  }

  static toggleMute(video: HTMLVideoElement): void {
    video.muted = !video.muted;
  }

  static setPlaybackRate(video: HTMLVideoElement, rate: number): void {
    video.playbackRate = Math.max(0.25, Math.min(4, rate));
  }

  static getPlaybackRate(video: HTMLVideoElement): number {
    return video.playbackRate;
  }

  static setPoster(video: HTMLVideoElement, poster: string): void {
    video.poster = poster;
  }

  static formatTime(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  static parseTime(timeString: string): number {
    const parts = timeString.split(':').map(Number);
    
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    
    return parts[0] || 0;
  }

  static getProgress(video: HTMLVideoElement): number {
    if (video.duration === 0 || isNaN(video.duration)) return 0;
    return (video.currentTime / video.duration) * 100;
  }

  static getBuffered(video: HTMLVideoElement): number {
    if (video.buffered.length === 0 || video.duration === 0) return 0;
    return (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
  }

  static isReady(video: HTMLVideoElement): boolean {
    return video.readyState >= 3;
  }

  static isEnded(video: HTMLVideoElement): boolean {
    return video.ended;
  }

  static isPaused(video: HTMLVideoElement): boolean {
    return video.paused;
  }

  static waitForReady(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      if (video.readyState >= 3) {
        resolve();
        return;
      }
      
      const onReady = () => {
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('canplay', onReady);
        resolve();
      };
      
      video.addEventListener('loadedmetadata', onReady);
      video.addEventListener('canplay', onReady);
    });
  }

  static waitForEnd(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      if (video.ended) {
        resolve();
        return;
      }
      
      const onEnded = () => {
        video.removeEventListener('ended', onEnded);
        resolve();
      };
      
      video.addEventListener('ended', onEnded);
    });
  }

  static getFrame(video: HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
    }
    
    return canvas;
  }

  static captureFrame(video: HTMLVideoElement, format = 'image/png', quality = 0.92): string {
    const canvas = VideoUtils.getFrame(video);
    return canvas.toDataURL(format, quality);
  }

  static downloadFrame(video: HTMLVideoElement, filename = 'frame.png', format = 'image/png'): void {
    const dataUrl = VideoUtils.captureFrame(video, format);
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  static extractFrames(
    video: HTMLVideoElement,
    count: number,
    callback: (canvas: HTMLCanvasElement, index: number) => void
  ): void {
    const duration = video.duration;
    const interval = duration / (count + 1);
    
    for (let i = 1; i <= count; i++) {
      const time = interval * i;
      
      video.currentTime = time;
      
      video.addEventListener('seeked', function handler() {
        video.removeEventListener('seeked', handler);
        const canvas = VideoUtils.getFrame(video);
        callback(canvas, i);
      });
    }
  }

  static applyFilter(video: HTMLVideoElement, filter: VideoFilter): void {
    video.style.filter = `${filter.name}(${filter.value})`;
  }

  static removeFilter(video: HTMLVideoElement): void {
    video.style.filter = '';
  }

  static setBrightness(video: HTMLVideoElement, value: number): void {
    video.style.filter = `brightness(${value}%)`;
  }

  static setContrast(video: HTMLVideoElement, value: number): void {
    video.style.filter = `contrast(${value}%)`;
  }

  static setSaturation(video: HTMLVideoElement, value: number): void {
    video.style.filter = `saturate(${value}%)`;
  }

  static setGrayscale(video: HTMLVideoElement, value: number): void {
    video.style.filter = `grayscale(${value}%)`;
  }

  static setSepia(video: HTMLVideoElement, value: number): void {
    video.style.filter = `sepia(${value}%)`;
  }

  static setBlur(video: HTMLVideoElement, value: number): void {
    video.style.filter = `blur(${value}px)`;
  }

  static setHueRotate(video: HTMLVideoElement, value: number): void {
    video.style.filter = `hue-rotate(${value}deg)`;
  }

  static setOpacity(video: HTMLVideoElement, value: number): void {
    video.style.opacity = String(value);
  }

  static fadeIn(video: HTMLVideoElement, duration = 1000): Promise<void> {
    return new Promise((resolve) => {
      video.style.opacity = '0';
      VideoUtils.play(video);
      
      const startTime = performance.now();
      
      const fade = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        video.style.opacity = String(progress);
        
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(fade);
    });
  }

  static fadeOut(video: HTMLVideoElement, duration = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const startOpacity = parseFloat(video.style.opacity) || 1;
      
      const fade = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        video.style.opacity = String(startOpacity * (1 - progress));
        
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          VideoUtils.pause(video);
          resolve();
        }
      };
      
      requestAnimationFrame(fade);
    });
  }

  static getMetadata(video: HTMLVideoElement): {
    duration: number;
    width: number;
    height: number;
    videoWidth: number;
    videoHeight: number;
    aspectRatio: number;
  } {
    return {
      duration: video.duration,
      width: video.offsetWidth,
      height: video.offsetHeight,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      aspectRatio: video.videoWidth / video.videoHeight,
    };
  }

  static getSupportedFormats(): string[] {
    const formats = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
    ];
    
    const video = document.createElement('video');
    
    return formats.filter((format) => {
      return video.canPlayType(format) !== '';
    });
  }

  static canPlayType(video: HTMLVideoElement, type: string): boolean {
    return video.canPlayType(type) !== '';
  }

  static getReadyState(video: HTMLVideoElement): string {
    const states = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAV E_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
    return states[video.readyState] || 'UNKNOWN';
  }

  static attachSubtitle(
    video: HTMLVideoElement,
    src: string,
    label: string,
    language: string
  ): TextTrack {
    const track = video.addTextTrack('subtitles', label, language);
    track.mode = 'showing';
    
    const trackElement = document.createElement('track');
    trackElement.src = src;
    trackElement.kind = 'subtitles';
    trackElement.label = label;
    trackElement.srclang = language;
    trackElement.default = true;
    
    video.appendChild(trackElement);
    
    return track;
  }

  static addCue(
    video: HTMLVideoElement,
    track: TextTrack,
    startTime: number,
    endTime: number,
    text: string
  ): VTTCue {
    const cue = new VTTCue(startTime, endTime, text);
    track.addCue(cue);
    
    return cue;
  }

  static removeAllCues(video: HTMLVideoElement, track: TextTrack): void {
    while (track.cues && track.cues.length > 0) {
      const cue = track.cues?.[0];
      if (cue) {
        track.removeCue(cue);
      }
    }
  }
}

export class VideoPlayer {
  private container: HTMLElement;
  private video: HTMLVideoElement;
  private controls: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private playButton: HTMLElement | null = null;
  private volumeSlider: HTMLInputElement | null = null;
  private timeDisplay: HTMLElement | null = null;
  private fullscreenButton: HTMLElement | null = null;

  constructor(container: HTMLElement, src: string, options?: VideoOptions) {
    this.container = container;
    this.video = VideoUtils.create(container, src, options);
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.video.addEventListener('play', () => this.updatePlayButton());
    this.video.addEventListener('pause', () => this.updatePlayButton());
    this.video.addEventListener('timeupdate', () => this.updateProgress());
    this.video.addEventListener('loadedmetadata', () => this.updateDuration());
    this.video.addEventListener('click', () => this.togglePlay());
  }

  createControls(): void {
    this.controls = document.createElement('div');
    this.controls.className = 'video-controls';
    this.controls.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.7));
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    
    this.playButton = document.createElement('button');
    this.playButton.innerHTML = '▶';
    this.playButton.onclick = () => this.togglePlay();
    
    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      flex: 1;
      height: 4px;
      background: rgba(255,255,255,0.3);
      cursor: pointer;
      position: relative;
    `;
    
    this.timeDisplay = document.createElement('span');
    this.timeDisplay.style.color = 'white';
    this.timeDisplay.innerText = '00:00 / 00:00';
    
    this.volumeSlider = document.createElement('input');
    this.volumeSlider.type = 'range';
    this.volumeSlider.min = '0';
    this.volumeSlider.max = '1';
    this.volumeSlider.step = '0.1';
    this.volumeSlider.value = String(this.video.volume);
    this.volumeSlider.oninput = () => {
      this.video.volume = parseFloat(this.volumeSlider!.value);
    };
    
    this.fullscreenButton = document.createElement('button');
    this.fullscreenButton.innerHTML = '⛶';
    this.fullscreenButton.onclick = () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        this.container.requestFullscreen();
      }
    };
    
    this.controls.appendChild(this.playButton);
    this.controls.appendChild(this.progressBar);
    this.controls.appendChild(this.timeDisplay);
    this.controls.appendChild(this.volumeSlider);
    this.controls.appendChild(this.fullscreenButton);
    
    this.container.style.position = 'relative';
    this.container.appendChild(this.controls);
  }

  private togglePlay(): void {
    VideoUtils.togglePlay(this.video);
  }

  private updatePlayButton(): void {
    if (this.playButton) {
      this.playButton.innerHTML = this.video.paused ? '▶' : '⏸';
    }
  }

  private updateProgress(): void {
    if (this.progressBar) {
      const progress = VideoUtils.getProgress(this.video);
      this.progressBar.style.width = `${progress}%`;
    }
    
    if (this.timeDisplay) {
      const current = VideoUtils.formatTime(this.video.currentTime);
      const duration = VideoUtils.formatTime(this.video.duration);
      this.timeDisplay.innerText = `${current} / ${duration}`;
    }
  }

  private updateDuration(): void {
    this.updateProgress();
  }

  getVideo(): HTMLVideoElement {
    return this.video;
  }

  play(): Promise<void> {
    return VideoUtils.play(this.video);
  }

  pause(): void {
    VideoUtils.pause(this.video);
  }

  seek(time: number): void {
    VideoUtils.seek(this.video, time);
  }

  setVolume(volume: number): void {
    VideoUtils.setVolume(this.video, volume);
  }

  destroy(): void {
    this.video.remove();
    if (this.controls) {
      this.controls.remove();
    }
  }
}

export class VideoRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  async start(camera = true, screen = false): Promise<MediaStream> {
    if (camera && screen) {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    } else if (camera) {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } else {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
    }
    
    return this.stream;
  }

  async startRecording(options?: {
    mimeType?: string;
    videoBitsPerSecond?: number;
  }): Promise<void> {
    if (!this.stream) {
      throw new Error('No media stream available');
    }
    
    const mimeType = options?.mimeType || 'video/webm;codecs=vp8';
    
    this.recordedChunks = [];
    
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType,
      videoBitsPerSecond: options?.videoBitsPerSecond,
    });
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.start(1000);
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder!.mimeType || 'video/webm',
        });
        resolve(blob);
      };
      
      this.mediaRecorder.stop();
    });
  }

  pauseRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  downloadRecording(filename = 'recording.webm'): void {
    if (this.recordedChunks.length === 0) return;
    
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

export class VideoLoop {
  private video: HTMLVideoElement;
  private sections: Array<{ start: number; end: number }> = [];
  private currentSection: number = 0;
  private isLooping: boolean = false;

  constructor(video: HTMLVideoElement) {
    this.video = video;
    
    this.video.addEventListener('timeupdate', () => this.checkLoop());
  }

  addSection(start: number, end: number): void {
    this.sections.push({ start, end });
  }

  clearSections(): void {
    this.sections = [];
  }

  startLoop(): void {
    if (this.sections.length === 0) return;
    
    this.isLooping = true;
    this.currentSection = 0;
    this.video.currentTime = this.sections[0].start;
    this.video.play();
  }

  stopLoop(): void {
    this.isLooping = false;
    this.video.pause();
  }

  private checkLoop(): void {
    if (!this.isLooping || this.sections.length === 0) return;
    
    const currentSection = this.sections[this.currentSection];
    
    if (this.video.currentTime >= currentSection.end) {
      this.currentSection = (this.currentSection + 1) % this.sections.length;
      this.video.currentTime = this.sections[this.currentSection].start;
    }
  }

  setSection(index: number): void {
    if (index >= 0 && index < this.sections.length) {
      this.currentSection = index;
      this.video.currentTime = this.sections[index].start;
    }
  }

  getCurrentSection(): number {
    return this.currentSection;
  }

  getSections(): Array<{ start: number; end: number }> {
    return [...this.sections];
  }
}

export default VideoUtils;
