// Copy text: the async Clipboard API, or the old execCommand way where it is
// missing or not allowed. Best-effort: a failure is swallowed, not thrown.
function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      return navigator.clipboard.writeText(text).catch(() => {});
    }
  } catch {
    // fall through to legacy fallback
  }

  // Legacy fallback for older browsers / permission issues.
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  } catch {
    // ignore
  }
}

export { copyToClipboard };
