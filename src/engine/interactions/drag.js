/*
  attachDrag — pointer-based dragging for a canvas region or an SVG shape,
  using the Pointer Events API (one code path for mouse, touch, and pen —
  no separate touch handlers to keep mobile-friendly). Also wires arrow-key
  nudging when the target is focusable, since a canvas has no native
  keyboard equivalent for "drag this" otherwise.
*/

/**
 * @param {HTMLElement | SVGElement} target
 * @param {object} handlers
 * @param {(event: PointerEvent) => boolean} [handlers.hitTest] Return false to ignore this pointerdown
 *   (e.g. the point isn't over the draggable shape on a canvas). Omit when `target` IS the shape
 *   (an SVG element), where any pointerdown on it should count.
 * @param {(event: PointerEvent) => void} [handlers.onStart]
 * @param {(event: PointerEvent, delta: {dx: number, dy: number}) => void} [handlers.onDrag]
 *   `dx`/`dy` are in client pixels since the last event — convert with the engine's
 *   `toWorld`/scale as needed.
 * @param {(event: PointerEvent) => void} [handlers.onEnd]
 * @param {number} [handlers.nudge] Keyboard arrow-key step size passed to onDrag's delta (client-pixel-equivalent units). Set 0 to disable.
 * @returns {() => void} cleanup function — call to remove all listeners.
 */
export function attachDrag(target, { hitTest, onStart, onDrag, onEnd, nudge = 4 } = {}) {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const onPointerDown = (event) => {
    if (hitTest && !hitTest(event)) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    target.setPointerCapture?.(event.pointerId);
    onStart?.(event);
    event.preventDefault();
  };

  const onPointerMove = (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    onDrag?.(event, { dx, dy });
  };

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    onEnd?.(event);
  };

  const onKeyDown = (event) => {
    if (!nudge) return;
    const deltas = {
      ArrowLeft: [-nudge, 0],
      ArrowRight: [nudge, 0],
      ArrowUp: [0, -nudge],
      ArrowDown: [0, nudge],
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    onStart?.(event);
    onDrag?.(event, { dx: delta[0], dy: delta[1] });
    onEnd?.(event);
  };

  target.style.touchAction = 'none';
  target.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('pointermove', onPointerMove);
  target.addEventListener('pointerup', endDrag);
  target.addEventListener('pointercancel', endDrag);
  target.addEventListener('keydown', onKeyDown);

  return () => {
    target.removeEventListener('pointerdown', onPointerDown);
    target.removeEventListener('pointermove', onPointerMove);
    target.removeEventListener('pointerup', endDrag);
    target.removeEventListener('pointercancel', endDrag);
    target.removeEventListener('keydown', onKeyDown);
  };
}
