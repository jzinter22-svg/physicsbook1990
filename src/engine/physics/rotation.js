/*
  Rotation — angular kinematics, torque, and moment of inertia. Mirrors the
  linear formulas in motion.js with their rotational analogs.
*/

/** theta = theta0 + omega0*t + 1/2*alpha*t^2 */
export function angularPosition(theta0, omega0, alpha, t) {
  return theta0 + omega0 * t + 0.5 * alpha * t * t;
}

/** omega = omega0 + alpha*t */
export function angularVelocity(omega0, alpha, t) {
  return omega0 + alpha * t;
}

/** torque = I * alpha (net torque from moment of inertia and angular acceleration). */
export function torqueFromInertia(momentOfInertia, angularAcceleration) {
  return momentOfInertia * angularAcceleration;
}

/** torque = F * r * sin(theta) — theta is the angle between the force and the lever arm, in radians. */
export function torqueFromForce(forceMagnitude, leverArm, angleRad = Math.PI / 2) {
  return forceMagnitude * leverArm * Math.sin(angleRad);
}

export function angularMomentum(momentOfInertia, angularVel) {
  return momentOfInertia * angularVel;
}

/** a_c = v^2 / r */
export function centripetalAcceleration(speed, radius) {
  return (speed * speed) / radius;
}

/** F_c = m * v^2 / r */
export function centripetalForce(mass, speed, radius) {
  return (mass * speed * speed) / radius;
}

/** Standard moments of inertia for common shapes rotating about their central axis. */
export const momentOfInertia = {
  pointMass: (mass, radius) => mass * radius * radius,
  solidDisk: (mass, radius) => 0.5 * mass * radius * radius,
  solidSphere: (mass, radius) => 0.4 * mass * radius * radius,
  hollowSphere: (mass, radius) => (2 / 3) * mass * radius * radius,
  hollowCylinder: (mass, radius) => mass * radius * radius,
  rodCenter: (mass, length) => (mass * length * length) / 12,
  rodEnd: (mass, length) => (mass * length * length) / 3,
};
