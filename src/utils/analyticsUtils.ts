export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  customDimensions?: Record<string, string | number>;
  timestamp?: number;
}

export interface PageView {
  path: string;
  title?: string;
  referrer?: string;
}

export interface UserTiming {
  category: string;
  variable: string;
  value: number;
  label?: string;
}

export interface Exception {
  description: string;
  fatal?: boolean;
}

export class AnalyticsUtils {
  private static events: AnalyticsEvent[] = [];
  private static listeners: Set<(event: AnalyticsEvent) => void> = new Set();
  private static enabled: boolean = true;
  private static debugMode: boolean = false;

  static trackEvent(event: AnalyticsEvent): void {
    if (!this.enabled) return;

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now()
    };

    this.events.push(enrichedEvent);

    if (this.debugMode) {
      console.log('[Analytics]', enrichedEvent);
    }

    this.listeners.forEach(listener => listener(enrichedEvent));
  }

  static trackPageView(page: PageView): void {
    this.trackEvent({
      category: 'Page',
      action: 'view',
      label: page.path,
      customDimensions: {
        title: page.title || '',
        referrer: page.referrer || document.referrer
      }
    });
  }

  static trackTiming(timing: UserTiming): void {
    this.trackEvent({
      category: 'Timing',
      action: timing.category,
      label: timing.variable,
      value: timing.value
    });
  }

  static trackException(exception: Exception): void {
    this.trackEvent({
      category: 'Exception',
      action: exception.fatal ? 'fatal' : 'handled',
      label: exception.description
    });
  }

  static trackClick(
    element: HTMLElement,
    options?: { category?: string; label?: string }
  ): void {
    const category = options?.category || 'Click';
    const label = options?.label || element.id || element.className || element.tagName;

    this.trackEvent({
      category,
      action: 'click',
      label
    });
  }

  static trackFormSubmit(
    form: HTMLFormElement,
    options?: { category?: string; label?: string; success?: boolean }
  ): void {
    this.trackEvent({
      category: options?.category || 'Form',
      action: 'submit',
      label: options?.label || form.id || form.name || 'unknown',
      value: options?.success ? 1 : 0
    });
  }

  static trackSearch(
    searchTerm: string,
    resultsCount?: number
  ): void {
    this.trackEvent({
      category: 'Search',
      action: 'search',
      label: searchTerm,
      value: resultsCount
    });
  }

  static trackDownload(
    fileName: string,
    fileType?: string,
    fileSize?: number
  ): void {
    this.trackEvent({
      category: 'Download',
      action: 'download',
      label: fileName,
      customDimensions: {
        fileType: fileType || 'unknown',
        fileSize: fileSize || 0
      }
    });
  }

  static trackVideoPlay(
    videoId: string,
    currentTime?: number
  ): void {
    this.trackEvent({
      category: 'Video',
      action: 'play',
      label: videoId,
      value: currentTime
    });
  }

  static trackVideoPause(
    videoId: string,
    currentTime?: number
  ): void {
    this.trackEvent({
      category: 'Video',
      action: 'pause',
      label: videoId,
      value: currentTime
    });
  }

  static trackVideoComplete(videoId: string): void {
    this.trackEvent({
      category: 'Video',
      action: 'complete',
      label: videoId,
      value: 1
    });
  }

  static trackError(
    message: string,
    stack?: string,
    fatal?: boolean
  ): void {
    this.trackException({
      description: message + (stack ? `\n${stack}` : ''),
      fatal
    });
  }

  static trackConversion(
    conversionName: string,
    value?: number,
    currency?: string
  ): void {
    this.trackEvent({
      category: 'Conversion',
      action: conversionName,
      value: value,
      customDimensions: {
        currency: currency || 'USD'
      }
    });
  }

  static trackUserEngagement(
    engagementType: 'scroll' | 'hover' | 'focus' | 'interaction',
    target: string,
    duration?: number
  ): void {
    this.trackEvent({
      category: 'Engagement',
      action: engagementType,
      label: target,
      value: duration
    });
  }

  static getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  static getEventsByCategory(category: string): AnalyticsEvent[] {
    return this.events.filter(e => e.category === category);
  }

  static getEventsByAction(action: string): AnalyticsEvent[] {
    return this.events.filter(e => e.action === action);
  }

  static getRecentEvents(count: number = 10): AnalyticsEvent[] {
    return this.events.slice(-count);
  }

  static clearEvents(): void {
    this.events = [];
  }

  static subscribe(listener: (event: AnalyticsEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  static enable(): void {
    this.enabled = true;
  }

  static disable(): void {
    this.enabled = false;
  }

  static isEnabled(): boolean {
    return this.enabled;
  }

  static setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  static exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  static importEvents(json: string): number {
    try {
      const imported = JSON.parse(json) as AnalyticsEvent[];
      this.events.push(...imported);
      return imported.length;
    } catch {
      return 0;
    }
  }
}

export class PerformanceAnalytics {
  private static marks: Map<string, number> = new Map();
  private static measures: { name: string; duration: number; startTime: number }[] = [];

  static mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  static measure(
    name: string,
    startMark: string,
    endMark?: string
  ): number {
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : performance.now();

    if (startTime === undefined) return 0;

    const duration = (endTime ?? 0) - startTime;
    this.measures.push({ name, duration, startTime });
    return duration;
  }

  static getMeasures(): { name: string; duration: number; startTime: number }[] {
    return [...this.measures];
  }

  static clearMarks(): void {
    this.marks.clear();
  }

  static clearMeasures(): void {
    this.measures = [];
  }

  static getNavigationTiming(): PerformanceNavigationTiming | null {
    const nav = performance.getEntriesByType('navigation')[0];
    return nav as PerformanceNavigationTiming || null;
  }

  static getPaintTiming(): { firstPaint: number; firstContentfulPaint: number } {
    const entries = performance.getEntriesByType('paint');
    let firstPaint = 0;
    let firstContentfulPaint = 0;

    entries.forEach(entry => {
      if (entry.name === 'first-paint') {
        firstPaint = entry.startTime;
      }
      if (entry.name === 'first-contentful-paint') {
        firstContentfulPaint = entry.startTime;
      }
    });

    return { firstPaint, firstContentfulPaint };
  }

  static getResourceTiming(): PerformanceResourceTiming[] {
    return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  }

  static getMemoryUsage(): {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  } {
    const memory = (performance as unknown as { memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    } }).memory;
    
    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    
    return {};
  }
}

export class FunnelAnalytics {
  private steps: Map<string, Set<string>> = new Map();

  trackStep(funnelName: string, stepName: string, userId?: string): void {
    if (!this.steps.has(funnelName)) {
      this.steps.set(funnelName, new Set());
    }
    this.steps.get(funnelName)?.add(stepName);

    AnalyticsUtils.trackEvent({
      category: 'Funnel',
      action: stepName,
      label: funnelName,
      customDimensions: {
        userId: userId || 'anonymous',
        stepOrder: this.getStepIndex(funnelName, stepName)
      }
    });
  }

  private getStepIndex(funnelName: string, stepName: string): number {
    const steps = Array.from(this.steps.get(funnelName) || []);
    return steps.indexOf(stepName) + 1;
  }

  getFunnelSteps(funnelName: string): string[] {
    return Array.from(this.steps.get(funnelName) || []);
  }

  getFunnelConversionRate(
    funnelName: string,
    stepA: string,
    stepB: string
  ): number {
    const stepAEvents = AnalyticsUtils.getEventsByAction(stepA);
    const stepBEvents = AnalyticsUtils.getEventsByAction(stepB);

    if (stepAEvents.length === 0) return 0;
    return (stepBEvents.length / stepAEvents.length) * 100;
  }
}

export class ABTestAnalytics {
  private static tests: Map<string, {
    variants: Map<string, number>;
    results: Map<string, AnalyticsEvent[]>;
  }> = new Map();

  static startTest(testName: string, variants: string[]): void {
    const test = {
      variants: new Map<string, number>(
        variants.map(v => [v, 0])
      ),
      results: new Map<string, AnalyticsEvent[]>(
        variants.map(v => [v, []])
      )
    };
    this.tests.set(testName, test);
  }

  static assignVariant(testName: string): string | null {
    const test = this.tests.get(testName);
    if (!test) return null;

    const variants = Array.from(test.variants.keys());
    const variant = variants[Math.floor(Math.random() * variants.length)];
    test.variants.set(variant, (test.variants.get(variant) || 0) + 1);

    return variant;
  }

  static trackConversion(
    testName: string,
    variant: string,
    conversionValue?: number
  ): void {
    const test = this.tests.get(testName);
    if (!test) return;

    const results = test.results.get(variant) || [];
    results.push({
      category: 'A/B Test',
      action: 'conversion',
      label: testName,
      value: conversionValue,
      timestamp: Date.now()
    });
    test.results.set(variant, results);
  }

  static getTestResults(testName: string): {
    variant: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
  }[] {
    const test = this.tests.get(testName);
    if (!test) return [];

    return Array.from(test.variants.entries()).map(([variant, visitors]) => {
      const conversions = test.results.get(variant)?.length || 0;
      return {
        variant,
        visitors,
        conversions,
        conversionRate: visitors > 0 ? (conversions / visitors) * 100 : 0
      };
    });
  }

  static getWinner(testName: string): string | null {
    const results = this.getTestResults(testName);
    if (results.length === 0) return null;

    return results.reduce((winner, current) =>
      current.conversionRate > winner.conversionRate ? current : winner
    ).variant;
  }
}

export class CohortAnalytics {
  private static cohorts: Map<string, {
    startDate: Date;
    users: Set<string>;
    events: AnalyticsEvent[];
  }> = new Map();

  static createCohort(cohortId: string, userIds: string[]): void {
    this.cohorts.set(cohortId, {
      startDate: new Date(),
      users: new Set(userIds),
      events: []
    });
  }

  static addUserToCohort(cohortId: string, userId: string): void {
    const cohort = this.cohorts.get(cohortId);
    if (cohort) {
      cohort.users.add(userId);
    }
  }

  static trackCohortEvent(
    cohortId: string,
    userId: string,
    event: AnalyticsEvent
  ): void {
    const cohort = this.cohorts.get(cohortId);
    if (cohort && cohort.users.has(userId)) {
      cohort.events.push({
        ...event,
        customDimensions: {
          ...event.customDimensions,
          cohortId,
          daysSinceStart: Math.floor(
            (Date.now() - cohort.startDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        }
      });
    }
  }

  static getCohortRetention(
    cohortId: string,
    day: number
  ): number {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) return 0;

    const dayInMs = day * 24 * 60 * 60 * 1000;
    const targetDate = cohort.startDate.getTime() + dayInMs;

    const activeUsers = new Set<string>();
    cohort.events.forEach(event => {
      if (event.timestamp && event.timestamp >= targetDate - 24 * 60 * 60 * 1000 &&
          event.timestamp <= targetDate + 24 * 60 * 60 * 1000) {
        const userId = event.customDimensions?.['userId'] as string;
        if (userId) activeUsers.add(userId);
      }
    });

    return (activeUsers.size / cohort.users.size) * 100;
  }

  static getCohortRetentionCurve(cohortId: string, days: number = 30): number[] {
    const retention: number[] = [];
    for (let i = 0; i <= days; i++) {
      retention.push(this.getCohortRetention(cohortId, i));
    }
    return retention;
  }
}

export default AnalyticsUtils;
