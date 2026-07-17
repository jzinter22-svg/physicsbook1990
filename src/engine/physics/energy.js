import { STANDARD_GRAVITY } from './force.js';

/** KE = 1/2 * m * v^2 */
export function kineticEnergy(mass, speed) {
  return 0.5 * mass * speed * speed;
}

/** PE_gravity = m * g * h */
export function gravitationalPotentialEnergy(mass, height, g = STANDARD_GRAVITY) {
  return mass * g * height;
}

/** PE_spring = 1/2 * k * x^2 */
export function springPotentialEnergy(springConstant, displacement) {
  return 0.5 * springConstant * displacement * displacement;
}

/** W = F * d * cos(theta) — theta is the angle between force and displacement, radians. */
export function work(force, distance, angleRad = 0) {
  return force * distance * Math.cos(angleRad);
}

/** P = W / t */
export function powerFromWork(workDone, time) {
  return workDone / time;
}

/** P = F * v */
export function powerFromForce(force, speed) {
  return force * speed;
}

export function mechanicalEnergy(kinetic, potential) {
  return kinetic + potential;
}
