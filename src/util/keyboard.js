const IS_MAC = typeof navigator !== 'undefined'
  && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

/**
 * Human label for a Cmd/Ctrl shortcut, e.g. shortcutLabel('Z', { shift: true })
 * → "⇧⌘Z" on Mac, "Ctrl+Shift+Z" elsewhere.
 */
const shortcutLabel = (key, { shift = false } = {}) => (
  IS_MAC ? `${shift ? '⇧' : ''}⌘${key}` : `Ctrl+${shift ? 'Shift+' : ''}${key}`
);

/**
 * True when a key event comes from somewhere that owns its own shortcuts
 * (text fields, selects, contenteditable, CodeMirror), so app-level
 * Cmd/Ctrl+Z etc. must leave it alone.
 */
const isEditableTarget = (target) => {
  if (!target || !target.closest) return false;
  return !!target.closest([
    'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"])',
    'textarea',
    'select',
    '[contenteditable=""]',
    '[contenteditable="true"]',
    '.CodeMirror',
  ].join(', '));
};

/**
 * True when Space on this target already means something: it presses a
 * button, toggles a checkbox, etc. App-level Space (play/pause) must not fire
 * on top of that. Sliders are not on the list: Space does nothing on them, and
 * "scrub, then Space to play" is the natural flow.
 */
const isActivatableTarget = (target) => {
  if (!target || !target.closest) return false;
  return isEditableTarget(target) || !!target.closest([
    'button',
    'a[href]',
    'summary',
    'input[type="checkbox"]',
    'input[type="radio"]',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
    'input[type="file"]',
    'input[type="color"]',
    '[role="button"]',
    '[role="checkbox"]',
    '[role="switch"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="option"]',
  ].join(', '));
};

/**
 * onMouseDown for toolbars: a mouse click on a button doesn't move focus to
 * it, so a following Space plays/pauses instead of pressing that button again.
 * Keyboard focus (Tab) is unaffected. Form fields still focus: a range input
 * would not drag at all without its mousedown.
 */
const keepFocusOnMouseDown = (e) => {
  if (!e.target.closest || !e.target.closest('select, input, textarea, [contenteditable="true"]')) {
    e.preventDefault();
  }
};

export { IS_MAC, shortcutLabel, isEditableTarget, isActivatableTarget, keepFocusOnMouseDown };
