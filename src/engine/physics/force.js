import { Vector2 } from '../vector.js';

/** Standard gravity, m/s^2 — used as the default `g` throughout this module. */
export const STANDARD_GRAVITY = 9.81;

/** Newton's second law: F = m * a. */
export function netForce(mass, accel) {
  return mass * accel;
}

/** Weight: F = m * g. */
export function weight(mass, g = STANDARD_GRAVITY) {
  return mass * g;
}

/** Kinetic friction: F = mu * N. */
export function frictionForce(normalForce, coefficient) {
  return coefficient * normalForce;
}

/** Hooke's law: F = -k * x (signed — restoring force opposes displacement). */
export function springForce(springConstant, displacement) {
  return -springConstant * displacement;
}

/** Normal force on a frictionless incline of angle `angleRad` from horizontal. */
export function normalForceOnIncline(mass, angleRad, g = STANDARD_GRAVITY) {
  return mass * g * Math.cos(angleRad);
}

/** Component of gravity along an incline of angle `angleRad`. */
export function gravityAlongIncline(mass, angleRad, g = STANDARD_GRAVITY) {
  return mass * g * Math.sin(angleRad);
}

/** Newton's law of universal gravitation: F = G * m1 * m2 / r^2. */
export function gravitationalForce(m1, m2, distance, G = 6.674e-11) {
  return (G * m1 * m2) / (distance * distance);
}

/** Vector sum of any number of force vectors ({x, y} or Vector2). */
export function sumForces(forces) {
  const total = Vector2.zero();
  for (const f of forces) total.add(f);
  return total;
}
