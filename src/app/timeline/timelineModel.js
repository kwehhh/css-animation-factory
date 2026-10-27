// Timeline model: what the preview's running CSS animations look like on a
// time axis. Built from the browser's own animation objects (Web Animations
// API), so it covers every way an animation can be declared (class longhands,
// the `animation` shorthand, raw preset CSS, :nth-of-type rules, pseudo-
// elements) without re-parsing any CSS.
//
// All times are milliseconds of "scene time": 0 = every animation's start, as
// on a fresh page load. Animation `delay` is part of scene time.

// Keyframe object keys that are not animated properties.
const KEYFRAME_META = ['offset', 'computedOffset', 'easing', 'composite'];
// Diamonds drawn per animation at most (a short infinite animation in a long
// scene would otherwise draw thousands).
const MAX_DIAMONDS = 400;

export const EMPTY_MODEL = Object.freeze({ entries: [], byPath: new Map(), length: 0, signature: '' });

/** Layer path key, as Preview writes it in `data-caf-path`: [0, 2, 1] -> "0-2-1". */
export const pathKey = (path = []) => path.join('-');

const isReversed = (direction, iteration) => {
  if (direction === 'reverse') return true;
  if (direction === 'alternate') return iteration % 2 === 1;
  if (direction === 'alternate-reverse') return iteration % 2 === 0;
  return false;
};

/**
 * How many iterations one pass of the timeline shows: all of them when finite,
 * else one cycle (two for alternate, so the way back is visible too).
 */
const shownIterations = ({ iterations, direction }) => {
  if (Number.isFinite(iterations)) return iterations;
  return /alternate/.test(direction) ? 2 : 1;
};

/** One animation, described for the timeline. Null when it has no layer. */
export function describeAnimation(anim, index) {
  const effect = anim.effect;
  const target = effect && effect.target;
  const layer = target && target.closest && target.closest('[data-caf-path]');
  if (!layer) return null;

  const timing = effect.getTiming();
  const frames = effect.getKeyframes();
  const duration = Number(timing.duration) || 0;
  const delay = Number(timing.delay) || 0;
  const iterations = timing.iterations === undefined ? 1 : timing.iterations;
  const direction = timing.direction || 'normal';
  // Two keyframes can share an offset (a hard cut); one diamond is enough.
  const offsets = [...new Set(frames.map((frame) => Number(frame.computedOffset.toFixed(4))))].sort((a, b) => a - b);
  const props = [...new Set(frames.flatMap((frame) => Object.keys(frame).filter((key) => !KEYFRAME_META.includes(key))))];
  const entry = {
    id: `${index}`,
    path: layer.getAttribute('data-caf-path'),
    name: anim.animationName || anim.id || 'animation',
    pseudo: effect.pseudoElement || '',
    target,
    delay,
    duration,
    iterations,
    direction,
    offsets,
    props
  };
  entry.start = Math.max(0, delay);
  entry.end = Math.max(entry.start, delay + duration * shownIterations(entry));
  entry.infinite = !Number.isFinite(iterations);
  return entry;
}

/** Group the preview's animations by layer and measure the scene. */
export function buildModel(animations = []) {
  const entries = animations.map(describeAnimation).filter(Boolean);
  const byPath = new Map();
  entries.forEach((entry) => {
    if (!byPath.has(entry.path)) byPath.set(entry.path, []);
    byPath.get(entry.path).push(entry);
  });
  const length = entries.reduce((max, entry) => Math.max(max, entry.end), 0);
  const signature = entries.map((e) => [
    e.path, e.name, e.pseudo, e.delay, e.duration, e.iterations, e.direction, e.offsets.join('|')
  ].join(':')).join(';');
  return { entries, byPath, length, signature };
}

/**
 * Scene times of an animation's keyframes, every shown iteration, within
 * [from, to]. Each: { time, offset, iteration }.
 */
export function keyframeTimes(entry, from = 0, to = Infinity) {
  const { delay, duration, direction, offsets } = entry;
  if (!duration || !offsets.length) {
    return entry.start >= from && entry.start <= to ? [{ time: entry.start, offset: 0, iteration: 0 }] : [];
  }
  const iterations = Number.isFinite(entry.iterations)
    ? Math.ceil(entry.iterations)
    : Math.max(1, Math.ceil((to - delay) / duration));
  const last = Number.isFinite(entry.iterations) ? delay + duration * entry.iterations : Infinity;
  const out = [];
  for (let i = 0; i < iterations && out.length < MAX_DIAMONDS; i++) {
    offsets.forEach((offset) => {
      const local = isReversed(direction, i) ? 1 - offset : offset;
      const time = delay + i * duration + local * duration;
      if (time >= from - 0.5 && time <= Math.min(to, last) + 0.5) out.push({ time, offset, iteration: i });
    });
  }
  // A cycle's end and the next cycle's start land on the same time: keep one.
  return out
    .sort((a, b) => a.time - b.time)
    .filter((kf, i, list) => i === 0 || Math.abs(kf.time - list[i - 1].time) > 0.5);
}

/** Every keyframe time in the scene (or in `entries`), sorted, deduplicated. */
export function allKeyframeTimes(entries, length) {
  const times = entries.flatMap((entry) => keyframeTimes(entry, 0, length).map((kf) => kf.time));
  return [...new Set(times.map((t) => Math.round(t)))].sort((a, b) => a - b);
}

/**
 * One layer's span on the scene axis: [start, end] across its animations, and
 * whether every one of them repeats forever (then a later scene time maps back
 * into the span, see localTime).
 */
export function layerSpan(entries = []) {
  if (!entries.length) return null;
  const start = Math.min(...entries.map((e) => e.start));
  const end = Math.max(...entries.map((e) => e.end));
  return { start, end: Math.max(end, start + 1), repeats: entries.every((e) => e.infinite) };
}

/** Where scene time `t` falls inside a layer's span (see layerSpan). */
export function localTime(t, span) {
  if (!span) return 0;
  if (t <= span.end) return Math.max(span.start, t);
  if (!span.repeats) return span.end;
  const cycle = span.end - span.start;
  return span.start + ((t - span.start) % cycle);
}

/** "0.55s", "12.30s"; under 10 seconds keeps two decimals. */
export function formatTime(ms = 0) {
  const s = Math.max(0, ms) / 1000;
  return `${s.toFixed(s < 100 ? 2 : 1)}s`;
}

/** Ruler tick label: "250ms", "1s", "1.5s". */
export function formatTick(ms) {
  if (ms === 0) return '0';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  return `${Number.isInteger(s) ? s : s.toFixed(1)}s`;
}

const TICK_STEPS = [10, 20, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000, 15000, 30000, 60000];

/** Ruler ticks for a scene `length` ms drawn `width` px wide: a label every >= 64px. */
export function rulerTicks(length, width) {
  if (!length || !width) return [];
  const pxPerMs = width / length;
  const step = TICK_STEPS.find((s) => s * pxPerMs >= 64) || TICK_STEPS[TICK_STEPS.length - 1];
  const ticks = [];
  for (let t = 0; t <= length + 0.5; t += step) ticks.push(t);
  return ticks;
}

/** The animated properties' current values, e.g. "opacity: 1; transform: matrix(…)". */
export function computedSummary(entries = [], max = 3) {
  const first = entries[0];
  if (!first || !first.target || !first.target.isConnected) return '';
  // transform and opacity are what most motion is made of: list them first.
  const rank = (prop) => {
    const i = ['transform', 'opacity'].indexOf(prop);
    return i === -1 ? 2 : i;
  };
  const props = [...new Set(entries.flatMap((e) => e.props))]
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, max);
  const style = window.getComputedStyle(first.target, first.pseudo || null);
  return props
    .map((prop) => `${prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${style[prop]}`)
    .join('; ');
}
