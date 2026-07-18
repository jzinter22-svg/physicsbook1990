import { Vector2 } from '../vector.js';

/** p = m * v (scalar, 1D). */
export function momentum(mass, velocity) {
  return mass * velocity;
}

/** p = m * v (2D vector — returns a new Vector2). */
export function momentumVector(mass, velocity) {
  return Vector2.scale(velocity, mass);
}

/** Impulse: J = F * t, equal to the change in momentum. */
export function impulse(force, time) {
  return force * time;
}

export function momentumChange(massA, velocityInitial, velocityFinal) {
  return massA * (velocityFinal - velocityInitial);
}

/**
 * 1D perfectly elastic collision (kinetic energy conserved). Returns the
 * post-collision velocities of both bodies.
 */
export function elasticCollision1D(m1, v1, m2, v2) {
  const totalMass = m1 + m2;
  return {
    v1: ((m1 - m2) * v1 + 2 * m2 * v2) / totalMass,
    v2: ((m2 - m1) * v2 + 2 * m1 * v1) / totalMass,
  };
}

/** 1D perfectly inelastic collision — the bodies stick together afterward. */
export function inelasticCollision1D(m1, v1, m2, v2) {
  return (m1 * v1 + m2 * v2) / (m1 + m2);
}

/** Coefficient of restitution: e = -(v1f - v2f) / (v1i - v2i). 1 = perfectly elastic, 0 = perfectly inelastic. */
export function coefficientOfRestitution(v1Initial, v2Initial, v1Final, v2Final) {
  return -(v1Final - v2Final) / (v1Initial - v2Initial);
}
