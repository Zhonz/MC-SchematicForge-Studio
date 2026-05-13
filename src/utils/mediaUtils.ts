export interface MediaInfo {
  type: string;
  src: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface VideoTrack {
  id: string;
  kind: string;
  label: string;
  language: string;
  enabled: boolean;
}

export interface AudioTrack {
  id: string;
  kind: string;
  label: string;
  language: string;
  enabled: boolean;
}

export interface MediaState {
  paused: boolean;
  ended: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  buffered: number;
  seeking: boolean;
  readyState: number;
}

export class MediaUtils {
  private static instance: MediaUtils;
  private mediaElements: Map<HTMLMediaElement, MediaState> = new Map();

  static getInstance(): MediaUtils {
    if (!MediaUtils.instance) {
      MediaUtils.instance = new MediaUtils();
    }
    return MediaUtils.instance;
  }

  static loadVideo(src: string, container: HTMLElement, options?: {
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    poster?: string;
  }): HTMLVideoElement {
    const video = document.createElement('video');
    
    video.src = src;
    video.autoplay = options?.autoplay ?? false;
    video.loop = options?.loop ?? false;
    video.muted = options?.muted ?? false;
    video.controls = options?.controls ?? true;
    
    if (options?.poster) {
      video.poster = options.poster;
    }
    
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    
    container.appendChild(video);
    
    return video;
  }

  static loadAudio(src: string, options?: {
    autoplay?: boolean;
    loop?: boolean;
    volume?: number;
  }): HTMLAudioElement {
    const audio = document.createElement('audio');
    
    audio.src = src;
    audio.autoplay = options?.autoplay ?? false;
    audio.loop = options?.loop ?? false;
    
    if (options?.volume !== undefined) {
      audio.volume = Math.max(0, Math.min(1, options.volume));
    }
    
    return audio;
  }

  static play(media: HTMLMediaElement): Promise<void> {
    return media.play() || Promise.resolve();
  }

  static pause(media: HTMLMediaElement): void {
    media.pause();
  }

  static togglePlay(media: HTMLMediaElement): Promise<void> {
    if (media.paused) {
      return MediaUtils.play(media);
    }
    MediaUtils.pause(media);
    return Promise.resolve();
  }

  static seek(media: HTMLMediaElement, time: number): void {
    media.currentTime = Math.max(0, Math.min(time, media.duration || 0));
  }

  static seekRelative(media: HTMLMediaElement, delta: number): void {
    MediaUtils.seek(media, media.currentTime + delta);
  }

  static seekPercent(media: HTMLMediaElement, percent: number): void {
    const time = (percent / 100) * (media.duration || 0);
    MediaUtils.seek(media, time);
  }

  static setVolume(media: HTMLMediaElement, volume: number): void {
    media.volume = Math.max(0, Math.min(1, volume));
  }

  static getVolume(media: HTMLMediaElement): number {
    return media.volume;
  }

  static mute(media: HTMLMediaElement): void {
    media.muted = true;
  }

  static unmute(media: HTMLMediaElement): void {
    media.muted = false;
  }

  static toggleMute(media: HTMLMediaElement): void {
    media.muted = !media.muted;
  }

  static setPlaybackRate(media: HTMLMediaElement, rate: number): void {
    media.playbackRate = Math.max(0.25, Math.min(4, rate));
  }

  static getPlaybackRate(media: HTMLMediaElement): number {
    return media.playbackRate;
  }

  static isPlaying(media: HTMLMediaElement): boolean {
    return !media.paused && !media.ended && media.readyState > 2;
  }

  static getDuration(media: HTMLMediaElement): number {
    return media.duration || 0;
  }

  static getCurrentTime(media: HTMLMediaElement): number {
    return media.currentTime;
  }

  static getBufferedPercentage(media: HTMLMediaElement): number {
    if (media.buffered.length === 0 || media.duration === 0) return 0;
    return (media.buffered.end(media.buffered.length - 1) / media.duration) * 100;
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

  static getMediaState(media: HTMLMediaElement): MediaState {
    return {
      paused: media.paused,
      ended: media.ended,
      duration: media.duration,
      currentTime: media.currentTime,
      volume: media.volume,
      muted: media.muted,
      playbackRate: media.playbackRate,
      buffered: MediaUtils.getBufferedPercentage(media),
      seeking: media.seeking,
      readyState: media.readyState,
    };
  }

  static snapshot(video: HTMLVideoElement, format = 'image/png', quality = 0.92): string {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL(format, quality);
  }

  static downloadSnapshot(video: HTMLVideoElement, filename = 'snapshot.png'): void {
    const dataUrl = MediaUtils.snapshot(video);
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  static getVideoTracks(video: HTMLVideoElement): VideoTrack[] {
    if (!video.textTracks) return [];
    
    const tracks: VideoTrack[] = [];
    
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      tracks.push({
        id: track.id || String(i),
        kind: track.kind,
        label: track.label,
        language: track.language,
        enabled: track.mode === 'showing',
      });
    }
    
    return tracks;
  }

  static getAudioTracks(video: HTMLVideoElement): AudioTrack[] {
    const audioTracks = (video as unknown as { audioTracks?: { length: number; [index: number]: { id: string; kind: string; label: string; language: string; enabled: boolean } } }).audioTracks;
    if (!audioTracks) return [];
    
    const tracks: AudioTrack[] = [];
    
    for (let i = 0; i < audioTracks.length; i++) {
      const track = audioTracks[i];
      tracks.push({
        id: track.id || String(i),
        kind: track.kind,
        label: track.label,
        language: track.language,
        enabled: track.enabled,
      });
    }
    
    return tracks;
  }

  static enableTextTrack(video: HTMLVideoElement, language?: string, kind?: string): TextTrack | null {
    const tracks = video.textTracks;
    
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      
      if (language && track.language !== language) continue;
      if (kind && track.kind !== kind) continue;
      
      track.mode = 'showing';
      return track;
    }
    
    return null;
  }

  static disableTextTrack(video: HTMLVideoElement): void {
    const tracks = video.textTracks;
    
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = 'hidden';
    }
  }

  static addTextTrack(
    video: HTMLVideoElement,
    kind: TextTrackKind,
    label: string,
    language: string,
    content: string
  ): TextTrack {
    const track = video.addTextTrack(kind, label, language);
    const cue = new VTTCue(0, video.duration || 100, content);
    track.addCue(cue);
    
    return track;
  }

  static fadeIn(media: HTMLMediaElement, duration = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startVolume = media.volume;
      media.volume = 0;
      media.play().catch(() => {});
      
      const startTime = performance.now();
      
      const fade = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        media.volume = startVolume * progress;
        
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(fade);
    });
  }

  static fadeOut(media: HTMLMediaElement, duration = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startVolume = media.volume;
      
      const startTime = performance.now();
      
      const fade = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        media.volume = startVolume * (1 - progress);
        
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          media.pause();
          resolve();
        }
      };
      
      requestAnimationFrame(fade);
    });
  }

  static waitForReady(media: HTMLMediaElement): Promise<void> {
    return new Promise((resolve) => {
      if (media.readyState >= 3) {
        resolve();
        return;
      }
      
      const onReady = () => {
        media.removeEventListener('loadedmetadata', onReady);
        media.removeEventListener('canplay', onReady);
        resolve();
      };
      
      media.addEventListener('loadedmetadata', onReady);
      media.addEventListener('canplay', onReady);
    });
  }

  static waitForEnd(media: HTMLMediaElement): Promise<void> {
    return new Promise((resolve) => {
      if (media.ended) {
        resolve();
        return;
      }
      
      const onEnded = () => {
        media.removeEventListener('ended', onEnded);
        resolve();
      };
      
      media.addEventListener('ended', onEnded);
    });
  }
}

export class PictureInPicture {
  static isSupported(): boolean {
    return 'pictureInPictureEnabled' in document;
  }

  static async enter(video: HTMLVideoElement): Promise<PictureInPictureWindow | null> {
    if (!PictureInPicture.isSupported()) return null;
    
    try {
      return await video.requestPictureInPicture();
    } catch {
      return null;
    }
  }

  static async exit(): Promise<void> {
    if (!PictureInPicture.isSupported()) return;
    
    try {
      await document.exitPictureInPicture();
    } catch {
    }
  }

  static async toggle(video: HTMLVideoElement): Promise<boolean> {
    if (!PictureInPicture.isSupported()) return false;
    
    if (document.pictureInPictureElement === video) {
      await PictureInPicture.exit();
      return false;
    }
    
    await PictureInPicture.enter(video);
    return true;
  }

  static isActive(video: HTMLVideoElement): boolean {
    return document.pictureInPictureElement === video;
  }
}

export class Fullscreen {
  static isSupported(): boolean {
    return 'fullscreenEnabled' in document;
  }

  static async enter(element: HTMLElement): Promise<void> {
    if (!Fullscreen.isSupported()) return;
    
    try {
      await element.requestFullscreen();
    } catch {
    }
  }

  static async exit(): Promise<void> {
    if (!Fullscreen.isSupported()) return;
    
    try {
      await document.exitFullscreen();
    } catch {
    }
  }

  static async toggle(element: HTMLElement): Promise<void> {
    if (!Fullscreen.isSupported()) return;
    
    if (document.fullscreenElement === element) {
      await Fullscreen.exit();
    } else {
      await Fullscreen.enter(element);
    }
  }

  static isActive(element?: HTMLElement): boolean {
    if (element) {
      return document.fullscreenElement === element;
    }
    return !!document.fullscreenElement;
  }
}

export class MediaRecorderUtils {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  static isSupported(mimeType?: string): boolean {
    if (!MediaRecorder.isTypeSupported) return false;
    if (mimeType) return MediaRecorder.isTypeSupported(mimeType);
    
    return true;
  }

  static getSupportedMimeTypes(): string[] {
    const types = [
      'video/webm',
      'video/webm;codecs=vp8',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8,vp9',
      'video/mp4',
    ];
    
    return types.filter((type) => MediaRecorder.isTypeSupported(type));
  }

  start(
    stream: MediaStream,
    options?: {
      mimeType?: string;
      videoBitsPerSecond?: number;
      audioBitsPerSecond?: number;
    }
  ): MediaRecorder | null {
    const mimeType = options?.mimeType || 'video/webm;codecs=vp8';
    
    const constraints: MediaRecorderOptions = {
      mimeType,
      videoBitsPerSecond: options?.videoBitsPerSecond,
      audioBitsPerSecond: options?.audioBitsPerSecond,
    };
    
    try {
      this.mediaRecorder = new MediaRecorder(stream, constraints);
      this.recordedChunks = [];
      
      return this.mediaRecorder;
    } catch {
      return null;
    }
  }

  onDataAvailable(callback: (blob: Blob) => void): void {
    if (!this.mediaRecorder) return;
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
        callback(event.data);
      }
    };
  }

  startRecording(): void {
    if (!this.mediaRecorder) return;
    this.mediaRecorder.start(1000);
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'video/webm',
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

  getState(): RecordingState | null {
    return this.mediaRecorder?.state || null;
  }
}

export class CameraUtils {
  static async getCameras(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput');
  }

  static async getMicrophones(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'audioinput');
  }

  static async getSpeakers(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'audiooutput');
  }

  static async requestCamera(constraints?: MediaTrackConstraints): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      video: constraints || true,
      audio: false,
    });
  }

  static async requestMicrophone(constraints?: MediaTrackConstraints): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      video: false,
      audio: constraints || true,
    });
  }

  static async requestScreen(constraints?: DisplayMediaStreamOptions): Promise<MediaStream> {
    return navigator.mediaDevices.getDisplayMedia(constraints || {
      video: true,
      audio: true,
    });
  }

  static async requestCameraAndMicrophone(
    videoConstraints?: MediaTrackConstraints,
    audioConstraints?: MediaTrackConstraints
  ): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      video: videoConstraints || true,
      audio: audioConstraints || true,
    });
  }

  static stopStream(stream: MediaStream): void {
    stream.getTracks().forEach((track) => track.stop());
  }

  static getVideoTrack(stream: MediaStream): MediaStreamTrack | null {
    const tracks = stream.getVideoTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }

  static getAudioTrack(stream: MediaStream): MediaStreamTrack | null {
    const tracks = stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }

  static async switchCamera(
    stream: MediaStream,
    deviceId: string
  ): Promise<MediaStreamTrack | null> {
    const oldTrack = CameraUtils.getVideoTrack(stream);
    if (oldTrack) {
      oldTrack.stop();
      stream.removeTrack(oldTrack);
    }
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      
      const newTrack = newStream.getVideoTracks()[0];
      if (newTrack) {
        stream.addTrack(newTrack);
        return newTrack;
      }
    } catch {
    }
    
    return null;
  }

  static async switchMicrophone(
    stream: MediaStream,
    deviceId: string
  ): Promise<MediaStreamTrack | null> {
    const oldTrack = CameraUtils.getAudioTrack(stream);
    if (oldTrack) {
      oldTrack.stop();
      stream.removeTrack(oldTrack);
    }
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      
      const newTrack = newStream.getAudioTracks()[0];
      if (newTrack) {
        stream.addTrack(newTrack);
        return newTrack;
      }
    } catch {
    }
    
    return null;
  }

  static applyConstraints(
    track: MediaStreamTrack,
    constraints: MediaTrackConstraints
  ): Promise<void> {
    return track.applyConstraints(constraints);
  }

  static getCapabilities(track: MediaStreamTrack): MediaTrackCapabilities | null {
    return track.getCapabilities() as MediaTrackCapabilities | null;
  }

  static getSettings(track: MediaStreamTrack): MediaTrackSettings {
    return track.getSettings();
  }
}

export class VolumeControl {
  private media: HTMLMediaElement;
  private min: number;
  private max: number;
  private step: number;

  constructor(
    media: HTMLMediaElement,
    options?: { min?: number; max?: number; step?: number }
  ) {
    this.media = media;
    this.min = options?.min ?? 0;
    this.max = options?.max ?? 1;
    this.step = options?.step ?? 0.1;
  }

  getVolume(): number {
    return this.media.volume;
  }

  setVolume(volume: number): void {
    this.media.volume = Math.max(this.min, Math.min(this.max, volume));
  }

  increase(): number {
    const newVolume = this.media.volume + this.step;
    this.setVolume(newVolume);
    return this.media.volume;
  }

  decrease(): number {
    const newVolume = this.media.volume - this.step;
    this.setVolume(newVolume);
    return this.media.volume;
  }

  mute(): void {
    this.media.muted = true;
  }

  unmute(): void {
    this.media.muted = false;
  }

  toggleMute(): boolean {
    this.media.muted = !this.media.muted;
    return this.media.muted;
  }

  isMuted(): boolean {
    return this.media.muted;
  }
}

export default MediaUtils;
