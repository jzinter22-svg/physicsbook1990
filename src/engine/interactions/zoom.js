/*
  attachZoom — mouse-wheel zoom on desktop, two-finger pinch on touch/mobile,
  both funneled through the same onZoom(factor, center) callback so the
  caller (usually adjusting a CanvasEngine/SvgEngine's `pixelsPerUnit`)
  only has to handle one code path.
*/

/**
 * @param {HTMLElement} target
 * @param {object} handlers
 * @param {(factor: number, center: {x: number, y: number}) => void} handlers.onZoom
 *   `factor` > 1 zooms in, < 1 zooms out; `center` is the client-coordinate
 *   focal point (keep that point visually fixed while scaling, if desired).
 * @param {number} [handlers.wheelSensitivity]
 * @returns {() => void} cleanup function.
 */
export function attachZoom(target, { onZoom, wheelSensitivity = 0.001 } = {}) {
  const onWheel = (event) => {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * wheelSensitivity);
    onZoom?.(factor, { x: event.clientX, y: event.clientY });
  };

  const activePointers = new Map();
  let lastPinchDistance = null;

  const pinchDistance = () => {
    const points = [...activePointers.values()];
    if (points.length < 2) return null;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };

  const pinchCenter = () => {
    const points = [...activePointers.values()];
    return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
  };

  const onPointerDown = (event) => {
    if (event.pointerType !== 'touch') return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    lastPinchDistance = pinchDistance();
  };

  const onPointerMove = (event) => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const distance = pinchDistance();
    if (distance && lastPinchDistance) {
      onZoom?.(distance / lastPinchDistance, pinchCenter());
    }
    if (distance) lastPinchDistance = distance;
  };

  const onPointerEnd = (event) => {
    activePointers.delete(event.pointerId);
    lastPinchDistance = activePointers.size >= 2 ? pinchDistance() : null;
  };

  target.style.touchAction = 'none';
  target.addEventListener('wheel', onWheel, { passive: false });
  target.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('pointermove', onPointerMove);
  target.addEventListener('pointerup', onPointerEnd);
  target.addEventListener('pointercancel', onPointerEnd);

  return () => {
    target.removeEventListener('wheel', onWheel);
    target.removeEventListener('pointerdown', onPointerDown);
    target.removeEventListener('pointermove', onPointerMove);
    target.removeEventListener('pointerup', onPointerEnd);
    target.removeEventListener('pointercancel', onPointerEnd);
  };
}
