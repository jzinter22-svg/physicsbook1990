/*
  Waves & oscillation — wave-property relationships and simple harmonic
  motion (SHM), which underlies springs, pendulums, and wave sources alike.
*/

/** v = f * lambda */
export function waveSpeed(frequency, wavelength) {
  return frequency * wavelength;
}

export function period(frequency) {
  return 1 / frequency;
}

export function frequency(periodSeconds) {
  return 1 / periodSeconds;
}

/** omega = 2*pi*f */
export function angularFrequency(frequency) {
  return 2 * Math.PI * frequency;
}

/** SHM position: x(t) = A * cos(omega*t + phase) */
export function shmPosition(amplitude, omega, t, phase = 0) {
  return amplitude * Math.cos(omega * t + phase);
}

/** SHM velocity: v(t) = -A * omega * sin(omega*t + phase) */
export function shmVelocity(amplitude, omega, t, phase = 0) {
  return -amplitude * omega * Math.sin(omega * t + phase);
}

/** SHM acceleration: a(t) = -omega^2 * x(t) */
export function shmAcceleration(amplitude, omega, t, phase = 0) {
  return -omega * omega * shmPosition(amplitude, omega, t, phase);
}

/** Simple pendulum period (small-angle approximation): T = 2*pi*sqrt(L/g). */
export function pendulumPeriod(length, g = 9.81) {
  return 2 * Math.PI * Math.sqrt(length / g);
}

/** Mass-spring system period: T = 2*pi*sqrt(m/k). */
export function springPeriod(mass, springConstant) {
  return 2 * Math.PI * Math.sqrt(mass / springConstant);
}

/**
 * Doppler-shifted observed frequency. Positive `observerSpeed` /
 * `sourceSpeed` means moving TOWARD the other party; negative means moving
 * away. `waveSpeedInMedium` is the propagation speed (e.g. ~343 m/s for
 * sound in air).
 */
export function dopplerFrequency(sourceFrequency, waveSpeedInMedium, observerSpeed = 0, sourceSpeed = 0) {
  return sourceFrequency * ((waveSpeedInMedium + observerSpeed) / (waveSpeedInMedium - sourceSpeed));
}

/** Superposition of two waves of the same frequency at a point (amplitude, phase in radians each). */
export function superpose(amplitude1, phase1, amplitude2, phase2) {
  const x = amplitude1 * Math.cos(phase1) + amplitude2 * Math.cos(phase2);
  const y = amplitude1 * Math.sin(phase1) + amplitude2 * Math.sin(phase2);
  return { amplitude: Math.hypot(x, y), phase: Math.atan2(y, x) };
}
