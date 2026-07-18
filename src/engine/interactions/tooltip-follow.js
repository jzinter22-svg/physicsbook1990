/*
  attachFollowTooltip — a floating, pointer-following tooltip for canvas
  content (individual shapes drawn on a canvas have no DOM node of their own
  to hang a <ui-tooltip> off of). Reuses the same `.ui-tooltip-bubble` visual
  styling from src/styles/base.css, just positioned at the pointer instead of
  anchored to a trigger element.
*/

/**
 * @param {HTMLElement} target Usually a CanvasEngine/SvgEngine's canvas or svg element.
 * @param {(event: PointerEvent) => string | null} getContent
 *   Called on every pointer move over `target`; return the tooltip text for
 *   whatever is under the pointer, or null/empty to hide the tooltip. Do
 *   your own hit-testing here (e.g. via `engine.clientToWorld(event.clientX, event.clientY)`).
 * @returns {() => void} cleanup function — also removes the tooltip element.
 */
export function attachFollowTooltip(target, getContent) {
  const bubble = document.createElement('div');
  bubble.className = 'ui-tooltip-bubble';
  bubble.style.position = 'fixed';
  bubble.style.transform = 'none';
  bubble.style.opacity = '0';
  bubble.style.visibility = 'hidden';
  document.body.appendChild(bubble);

  const OFFSET = 14;

  const place = (event) => {
    bubble.style.left = `${event.clientX + OFFSET}px`;
    bubble.style.top = `${event.clientY + OFFSET}px`;
  };

  const onPointerMove = (event) => {
    const content = getContent(event);
    if (!content) {
      bubble.style.opacity = '0';
      bubble.style.visibility = 'hidden';
      return;
    }
    bubble.textContent = content;
    place(event);
    bubble.style.opacity = '1';
    bubble.style.visibility = 'visible';
  };

  const hide = () => {
    bubble.style.opacity = '0';
    bubble.style.visibility = 'hidden';
  };

  target.addEventListener('pointermove', onPointerMove);
  target.addEventListener('pointerleave', hide);

  return () => {
    target.removeEventListener('pointermove', onPointerMove);
    target.removeEventListener('pointerleave', hide);
    bubble.remove();
  };
}
