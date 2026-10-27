import { EMPTY_MODEL, allKeyframeTimes, buildModel } from './timelineModel.js';

// Re-read the animations' timing at least this often: an edit (say a new
// duration) changes an existing animation without creating a new one.
const MODEL_REFRESH_MS = 400;
// A frame gap longer than this (background tab, breakpoint) is not played
// through: the clock resumes where it was instead of jumping ahead.
const MAX_FRAME_MS = 100;

/**
 * A CSS animation its element no longer names (its class was removed, its
 * animation renamed). Chrome keeps one alive if it was paused through the API,
 * as every animation here is: it no longer renders, but it would still show
 * in the timelines and the Layers badges.
 */
function isOrphanedCssAnimation(anim) {
  const target = anim.animationName && anim.effect && anim.effect.target;
  if (!target) return false;
  const names = window.getComputedStyle(target, anim.effect.pseudoElement || null).animationName
    .split(',')
    .map((name) => name.trim().replace(/^["']|["']$/g, ''));
  return !names.includes(anim.animationName);
}

/**
 * One clock for the whole preview. Every CSS animation under the preview root
 * is paused and moved to the same scene time each frame, so play, pause,
 * scrub, loop and speed apply to all of them at once and the preview always
 * shows exactly the time on the playhead. Animations added later (a new class,
 * an edit) are picked up on the next frame.
 *
 * Listeners:
 *  - onFrame(fn(time, length)): every frame the time moved or was set. For the
 *    playheads and time readouts (they write to the DOM directly, so the
 *    panels do not re-render 60 times a second).
 *  - onChange(fn()): the model (which animations, their timing) or the
 *    play/loop/speed state changed. For React state.
 */
export default class TimelineController {
  constructor({ getRoot, playing = true, loop = true, speed = 1 } = {}) {
    this.getRoot = getRoot;
    this.time = 0;
    this.playing = playing;
    this.loop = loop;
    this.speed = speed;
    this.model = EMPTY_MODEL;
    this.frameListeners = new Set();
    this.changeListeners = new Set();
    this.animations = [];
    this.lastFrame = null;
    this.lastModelAt = 0;
    this.raf = null;
    this.timeDirty = true;
  }

  start() {
    if (this.raf !== null) return;
    const loop = (now) => {
      this.tick(now);
      this.raf = window.requestAnimationFrame(loop);
    };
    this.raf = window.requestAnimationFrame(loop);
  }

  stop() {
    if (this.raf !== null) window.cancelAnimationFrame(this.raf);
    this.raf = null;
    this.lastFrame = null;
  }

  onFrame(fn) {
    this.frameListeners.add(fn);
    fn(this.time, this.model.length);
    return () => this.frameListeners.delete(fn);
  }

  onChange(fn) {
    this.changeListeners.add(fn);
    return () => this.changeListeners.delete(fn);
  }

  emitChange() {
    this.changeListeners.forEach((fn) => fn());
  }

  /** Re-read the animations on the next frame (the document just changed). */
  invalidate() {
    this.lastModelAt = 0;
  }

  tick(now) {
    const root = this.getRoot && this.getRoot();
    if (!root || !root.getAnimations) return;

    const animations = root.getAnimations({ subtree: true }).filter((anim) => {
      if (!isOrphanedCssAnimation(anim)) return true;
      anim.cancel();
      return false;
    });
    const listChanged = animations.length !== this.animations.length
      || animations.some((anim, i) => anim !== this.animations[i]);
    this.animations = animations;
    if (listChanged || now - this.lastModelAt > MODEL_REFRESH_MS) {
      this.lastModelAt = now;
      this.refreshModel();
    }

    const { length } = this.model;
    if (this.playing && this.lastFrame !== null && length > 0) {
      const dt = Math.min(MAX_FRAME_MS, now - this.lastFrame);
      let time = this.time + dt * this.speed;
      if (time >= length) {
        if (this.loop) {
          time = 0;
        } else {
          time = length;
          this.playing = false;
          this.emitChange();
        }
      }
      this.setTime(time);
    }
    this.lastFrame = now;
    if (this.time > length) this.setTime(length);

    // Drive every animation to the scene time. Only touch what differs, so an
    // idle, paused preview costs nothing.
    animations.forEach((anim) => {
      if (anim.playState !== 'paused') anim.pause();
      if (anim.currentTime === null || Math.abs(anim.currentTime - this.time) > 0.5) {
        anim.currentTime = this.time;
      }
    });

    if (this.timeDirty) {
      this.timeDirty = false;
      this.frameListeners.forEach((fn) => fn(this.time, length));
    }
  }

  refreshModel() {
    const model = buildModel(this.animations);
    if (model.signature === this.model.signature) {
      // Same animations and timing; keep the old object so React skips work,
      // but take the new element references (a re-render can replace nodes).
      this.model.entries.forEach((entry, i) => { entry.target = model.entries[i].target; });
      return;
    }
    this.model = model;
    this.timeDirty = true;
    this.emitChange();
  }

  setTime(time) {
    if (time === this.time) return;
    this.time = time;
    this.timeDirty = true;
  }

  // --- Transport ------------------------------------------------------------

  play() {
    if (this.playing) return;
    // Playing from the end starts over, like any player.
    if (!this.loop && this.time >= this.model.length) this.setTime(0);
    this.playing = true;
    this.lastFrame = null;
    this.emitChange();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    this.emitChange();
  }

  toggle() {
    if (this.playing) this.pause(); else this.play();
  }

  /** Jump to `time` (clamped to the scene). Playback state is unchanged. */
  seek(time) {
    const { length } = this.model;
    this.setTime(Math.min(length, Math.max(0, Number(time) || 0)));
    this.lastFrame = null;
  }

  restart() {
    this.seek(0);
  }

  setLoop(loop) {
    this.loop = !!loop;
    this.emitChange();
  }

  setSpeed(speed) {
    this.speed = Number(speed) || 1;
    this.emitChange();
  }

  /**
   * Pause on the previous (-1) or next (+1) keyframe, of `entries` when given
   * (one layer) or of the whole scene.
   */
  stepKeyframe(direction, entries = this.model.entries) {
    const times = allKeyframeTimes(entries, this.model.length);
    const now = Math.round(this.time);
    const target = direction < 0
      ? [...times].reverse().find((t) => t < now)
      : times.find((t) => t > now);
    this.pause();
    if (target !== undefined) this.seek(target);
  }
}
