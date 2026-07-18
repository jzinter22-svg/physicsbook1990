/**
 * showToast('Saved successfully.', { variant: 'success', duration: 4000 })
 * Fires a document event that <toast-stack> (mounted once per page) picks
 * up — callers never need a direct reference to the stack element.
 */
export function showToast(message, options = {}) {
  document.dispatchEvent(
    new CustomEvent('show-toast', {
      detail: {
        message,
        variant: options.variant ?? 'info',
        duration: options.duration ?? 4000,
      },
    })
  );
}
