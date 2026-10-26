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

export { IS_MAC, shortcutLabel, isEditableTarget };
