import React from 'react';

/**
 * The controller's model + play/loop/speed state, re-rendering only when one
 * of those changes (not every frame).
 */
const readTimeline = (controller) => ({
  model: controller.model,
  playing: controller.playing,
  direction: controller.direction,
  loop: controller.loop,
  speed: controller.speed
});

export function useTimeline(controller) {
  const [state, setState] = React.useState(() => readTimeline(controller));
  React.useEffect(() => {
    const sync = () => setState((prev) => {
      const next = readTimeline(controller);
      return Object.keys(next).some((key) => next[key] !== prev[key]) ? next : prev;
    });
    sync();
    return controller.onChange(sync);
  }, [controller]);
  return state;
}

/**
 * Run `fn(time, length)` on every timeline frame, for direct DOM writes
 * (playhead position, time readout). `fn` may change between renders.
 */
export function useTimelineFrame(controller, fn) {
  const ref = React.useRef(fn);
  // After every render: take the newest `fn`, and apply the current time
  // again, since a re-render can move what `fn` draws against (a new layer, a
  // resized track) while the clock stands still.
  React.useLayoutEffect(() => {
    ref.current = fn;
    fn(controller.time, controller.model.length);
  });
  React.useEffect(() => controller.onFrame((time, length) => ref.current(time, length)), [controller]);
}
