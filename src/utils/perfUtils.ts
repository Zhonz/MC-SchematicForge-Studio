export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memory: MemoryInfo | null;
  renderTime: number;
  updateTime: number;
  timestamp: number;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  used: string;
  total: string;
  limit: string;
}

export interface FPSSample {
  timestamp: number;
  fps: number;
}

export interface PerformanceSnapshot {
  id: string;
  timestamp: number;
  metrics: PerformanceMetrics;
  label?: string;
}

export interface PerformanceReport {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  snapshots: PerformanceSnapshot[];
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  averageFrameTime: number;
  averageMemory?: number;
  warnings: string[];
}

export interface ProfilerMark {
  name: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface ProfilerMeasure {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

export class PerformanceMonitor {
  private fps: FPSSample[] = [];
  private maxFPSSamples = 60;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsUpdateInterval = 500;
  private lastFPSUpdate = 0;
  private currentFPS = 60;
  private snapshots: PerformanceSnapshot[] = [];
  private maxSnapshots = 100;
  private observers: Array<(metrics: PerformanceMetrics) => void> = [];
  private isRunning = false;
  private animationFrameId: number | null = null;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.lastFPSUpdate = this.lastFrameTime;
    this.tick();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.frameCount++;

    if (now - this.lastFPSUpdate >= this.fpsUpdateInterval) {
      this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
      this.frameCount = 0;
      this.lastFPSUpdate = now;

      this.fps.push({ timestamp: now, fps: this.currentFPS });
      if (this.fps.length > this.maxFPSSamples) {
        this.fps.shift();
      }
    }

    const metrics = this.getMetrics();
    this.takeSnapshot(metrics);
    this.notifyObservers(metrics);

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  getMetrics(): PerformanceMetrics {
    return {
      fps: this.currentFPS,
      frameTime: this.lastFrameTime,
      memory: this.getMemoryInfo(),
      renderTime: 0,
      updateTime: 0,
      timestamp: performance.now(),
    };
  }

  private getMemoryInfo(): MemoryInfo | null {
    const perf = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };

    if (perf.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = perf.memory;
      return {
        usedJSHeapSize,
        totalJSHeapSize,
        jsHeapSizeLimit,
        used: this.formatBytes(usedJSHeapSize),
        total: this.formatBytes(totalJSHeapSize),
        limit: this.formatBytes(jsHeapSizeLimit),
      };
    }

    return null;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  takeSnapshot(metrics?: PerformanceMetrics, label?: string): PerformanceSnapshot {
    const snapshot: PerformanceSnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: performance.now(),
      metrics: metrics || this.getMetrics(),
      label,
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  getSnapshots(): PerformanceSnapshot[] {
    return [...this.snapshots];
  }

  getAverageFPS(): number {
    if (this.fps.length === 0) return 60;
    const sum = this.fps.reduce((acc, sample) => acc + sample.fps, 0);
    return Math.round(sum / this.fps.length);
  }

  getFPSHistory(): FPSSample[] {
    return [...this.fps];
  }

  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index !== -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(metrics: PerformanceMetrics): void {
    for (const observer of this.observers) {
      observer(metrics);
    }
  }

  clear(): void {
    this.fps = [];
    this.snapshots = [];
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getCurrentFPS(): number {
    return this.currentFPS;
  }
}

export class PerformanceProfiler {
  private marks: ProfilerMark[] = [];
  protected measures: ProfilerMeasure[] = [];
  private activeMarks: Map<string, number> = new Map();
  private startTime = performance.now();

  mark(name: string, metadata?: Record<string, unknown>): void {
    this.marks.push({
      name,
      timestamp: performance.now(),
      metadata,
    });
  }

  measure(name: string, startMark: string, endMark?: string): ProfilerMeasure | null {
    const start = this.marks.find((m) => m.name === startMark);
    if (!start) return null;

    let endTime = endMark ? performance.now() : performance.now();
    if (endMark) {
      const end = this.marks.find((m) => m.name === endMark);
      if (end) {
        endTime = end.timestamp;
      }
    }

    const measure: ProfilerMeasure = {
      name,
      startTime: start.timestamp,
      endTime,
      duration: endTime - start.timestamp,
    };

    this.measures.push(measure);
    return measure;
  }

  startMeasure(name: string): void {
    this.activeMarks.set(name, performance.now());
  }

  endMeasure(name: string, metadata?: Record<string, unknown>): ProfilerMeasure | null {
    const startTime = this.activeMarks.get(name);
    if (startTime === undefined) return null;

    const endTime = performance.now();
    this.activeMarks.delete(name);

    const measure: ProfilerMeasure = {
      name,
      startTime,
      endTime,
      duration: endTime - startTime,
      metadata,
    };

    this.measures.push(measure);
    return measure;
  }

  recordMeasure(name: string, startTime: number, endTime: number, duration: number): void {
    this.measures.push({
      name,
      startTime,
      endTime,
      duration,
    });
  }

  getMarks(name?: string): ProfilerMark[] {
    if (name) {
      return this.marks.filter((m) => m.name === name);
    }
    return [...this.marks];
  }

  getMeasures(name?: string): ProfilerMeasure[] {
    if (name) {
      return this.measures.filter((m) => m.name === name);
    }
    return [...this.measures];
  }

  getTotalDuration(): number {
    if (this.measures.length === 0) return 0;
    return this.measures.reduce((acc, m) => acc + m.duration, 0);
  }

  getMeasureByName(name: string): ProfilerMeasure | undefined {
    return this.measures.find((m) => m.name === name);
  }

  getMeasureSummary(): Record<string, { count: number; total: number; average: number; min: number; max: number }> {
    const summary: Record<string, { count: number; total: number; average: number; min: number; max: number }> = {};

    for (const measure of this.measures) {
      if (!summary[measure.name]) {
        summary[measure.name] = { count: 0, total: 0, average: 0, min: Infinity, max: -Infinity };
      }

      const s = summary[measure.name];
      s.count++;
      s.total += measure.duration;
      s.min = Math.min(s.min, measure.duration);
      s.max = Math.max(s.max, measure.duration);
    }

    for (const name in summary) {
      const s = summary[name];
      s.average = s.total / s.count;
      s.min = s.min === Infinity ? 0 : s.min;
    }

    return summary;
  }

  clear(): void {
    this.marks = [];
    this.measures = [];
    this.activeMarks.clear();
    this.startTime = performance.now();
  }
}

export class PerformanceRecorder {
  private reports: Map<string, PerformanceReport> = new Map();
  private currentRecording: {
    id: string;
    startTime: number;
    snapshots: PerformanceSnapshot[];
    monitor: PerformanceMonitor;
  } | null = null;

  startRecording(id: string): void {
    if (this.currentRecording) {
      this.stopRecording();
    }

    const monitor = new PerformanceMonitor();
    monitor.start();

    this.currentRecording = {
      id,
      startTime: performance.now(),
      snapshots: [],
      monitor,
    };

    monitor.subscribe((metrics) => {
      if (this.currentRecording) {
        this.currentRecording.snapshots.push({
          id: `snapshot-${Date.now()}`,
          timestamp: performance.now(),
          metrics,
        });
      }
    });
  }

  stopRecording(): PerformanceReport | null {
    if (!this.currentRecording) return null;

    const { id, startTime, snapshots, monitor } = this.currentRecording;
    const endTime = performance.now();
    monitor.stop();

    const fpsValues = snapshots.map((s) => s.metrics.fps);
    const warnings: string[] = [];

    const avgFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
    const minFPS = Math.min(...fpsValues);
    const maxFPS = Math.max(...fpsValues);

    if (avgFPS < 30) {
      warnings.push(`Average FPS (${avgFPS.toFixed(1)}) is below acceptable threshold (30 FPS)`);
    }

    if (minFPS < 15) {
      warnings.push(`Minimum FPS (${minFPS}) dropped below critical threshold (15 FPS)`);
    }

    const frameTimes = snapshots.map((s) => s.metrics.frameTime);
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;

    const report: PerformanceReport = {
      id,
      startTime,
      endTime,
      duration: endTime - startTime,
      snapshots,
      averageFPS: Math.round(avgFPS),
      minFPS,
      maxFPS,
      averageFrameTime: Math.round(avgFrameTime * 100) / 100,
      warnings,
    };

    this.reports.set(id, report);
    this.currentRecording = null;

    return report;
  }

  getReport(id: string): PerformanceReport | undefined {
    return this.reports.get(id);
  }

  getAllReports(): PerformanceReport[] {
    return Array.from(this.reports.values());
  }

  deleteReport(id: string): void {
    this.reports.delete(id);
  }

  clearReports(): void {
    this.reports.clear();
  }
}

export class MemoryTracker {
  private samples: Array<{ timestamp: number; used: number; total: number }> = [];
  private maxSamples = 100;
  private updateInterval: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private observers: Array<(sample: { timestamp: number; used: number; total: number }) => void> = [];

  constructor(updateInterval = 1000) {
    this.updateInterval = updateInterval;
  }

  start(): void {
    if (this.intervalId) return;
    this.sample();
    this.intervalId = setInterval(() => this.sample(), this.updateInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private sample(): void {
    const perf = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
      };
    };

    if (perf.memory) {
      const sample = {
        timestamp: performance.now(),
        used: perf.memory.usedJSHeapSize,
        total: perf.memory.totalJSHeapSize,
      };

      this.samples.push(sample);
      if (this.samples.length > this.maxSamples) {
        this.samples.shift();
      }

      this.notifyObservers(sample);
    }
  }

  getSamples(): Array<{ timestamp: number; used: number; total: number }> {
    return [...this.samples];
  }

  getCurrentUsage(): { used: number; total: number; percentage: number } | null {
    const perf = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
      };
    };

    if (perf.memory) {
      const { usedJSHeapSize, totalJSHeapSize } = perf.memory;
      return {
        used: usedJSHeapSize,
        total: totalJSHeapSize,
        percentage: (usedJSHeapSize / totalJSHeapSize) * 100,
      };
    }

    return null;
  }

  subscribe(observer: (sample: { timestamp: number; used: number; total: number }) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index !== -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(sample: { timestamp: number; used: number; total: number }): void {
    for (const observer of this.observers) {
      observer(sample);
    }
  }

  clear(): void {
    this.samples = [];
  }
}

export const defaultPerformanceMonitor = new PerformanceMonitor();
export const defaultProfiler = new PerformanceProfiler();
export const defaultRecorder = new PerformanceRecorder();
export const defaultMemoryTracker = new MemoryTracker();

export function measure<T>(fn: () => T, label?: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  defaultProfiler.recordMeasure(label || 'anonymous', start, end, duration);
  return result;
}

export async function measureAsync<T>(fn: () => Promise<T>, label?: string): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  defaultProfiler.recordMeasure(label || 'anonymous', start, end, duration);
  return result;
}
