/*
  Motion (linear kinematics) — standard constant-acceleration formulas as
  pure functions. Reusable building blocks for future chapters; no lesson
  narrative or worked examples here.
*/

/** x = x0 + v0*t + 1/2*a*t^2 */
export function position(x0, v0, a, t) {
  return x0 + v0 * t + 0.5 * a * t * t;
}

/** v = v0 + a*t */
export function velocity(v0, a, t) {
  return v0 + a * t;
}

/** v^2 = v0^2 + 2*a*deltaX, solved for v (sign matches the direction of motion). */
export function velocityFromDisplacement(v0, a, deltaX) {
  const vSq = v0 * v0 + 2 * a * deltaX;
  return Math.sign(v0 + a) * Math.sqrt(Math.max(vSq, 0));
}

/** deltaX = 1/2*(v0 + v)*t */
export function displacement(v0, v, t) {
  return 0.5 * (v0 + v) * t;
}

export function averageSpeed(distance, time) {
  return distance / time;
}

/** @param {number} deltaX @param {number} time */
export function averageVelocity(deltaX, time) {
  return deltaX / time;
}

/** a = (v - v0) / t */
export function acceleration(v0, v, t) {
  return (v - v0) / t;
}
