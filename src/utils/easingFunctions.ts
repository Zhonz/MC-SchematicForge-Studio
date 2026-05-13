export type EasingFunction = (t: number) => number;

export const Easing = {
  linear: (t: number) => t,

  quadIn: (t: number) => t * t,
  quadOut: (t: number) => t * (2 - t),
  quadInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  cubicIn: (t: number) => t * t * t,
  cubicOut: (t: number) => --t * t * t + 1,
  cubicInOut: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  quartIn: (t: number) => t * t * t * t,
  quartOut: (t: number) => 1 - --t * t * t * t,
  quartInOut: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,

  quintIn: (t: number) => t * t * t * t * t,
  quintOut: (t: number) => 1 + --t * t * t * t * t,
  quintInOut: (t: number) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,

  sineIn: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  sineOut: (t: number) => Math.sin((t * Math.PI) / 2),
  sineInOut: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,

  expoIn: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  expoOut: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoInOut: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  circIn: (t: number) => 1 - Math.sqrt(1 - t * t),
  circOut: (t: number) => Math.sqrt(1 - --t * t),
  circInOut: (t: number) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
      : (Math.sqrt(1 - 4 * --t * t) + 1) / 2,

  elasticIn: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c = (2 * Math.PI) / 3;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c);
  },
  elasticOut: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
  },
  elasticInOut: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c = (5 * Math.PI) / 4.5;
    if (t < 0.5)
      return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c)) / 2;
    return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c)) / 2 + 1;
  },

  backIn: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  backOut: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * --t * t * t + c1 * t * t;
  },
  backInOut: (t: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    if (t < 0.5)
      return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2;
    return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  bounceOut: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  bounceIn: (t: number) => 1 - Easing.bounceOut(1 - t),
  bounceInOut: (t: number) =>
    t < 0.5 ? (1 - Easing.bounceOut(1 - 2 * t)) / 2 : (1 + Easing.bounceOut(2 * t - 1)) / 2,
};

export function interpolate(
  start: number,
  end: number,
  progress: number,
  easing: EasingFunction = Easing.linear
): number {
  return start + (end - start) * easing(progress);
}

export function bounce(progress: number, bounces: number = 3): number {
  const decay = Math.exp(-progress * bounces * 2);
  return Math.sin(progress * Math.PI * bounces * 2) * decay;
}

export function spring(
  progress: number,
  options: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  } = {}
): number {
  const { stiffness = 100, damping = 10, mass = 1 } = options;
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * progress) *
      (Math.cos(omegaD * progress) + (zeta * omega / omegaD) * Math.sin(omegaD * progress));
  }
  return 1 - (1 + omega * progress) * Math.exp(-omega * progress);
}
