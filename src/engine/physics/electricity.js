/*
  Electricity — Ohm's law, circuit combination rules, power, and
  electrostatics (Coulomb's law).
*/

export const COULOMB_CONSTANT = 8.99e9;

export function voltageFromOhmsLaw(current, resistance) {
  return current * resistance;
}

export function currentFromOhmsLaw(voltage, resistance) {
  return voltage / resistance;
}

export function resistanceFromOhmsLaw(voltage, current) {
  return voltage / current;
}

/** Resistors in series: R_total = R1 + R2 + ... */
export function seriesResistance(...resistances) {
  return resistances.reduce((sum, r) => sum + r, 0);
}

/** Resistors in parallel: 1/R_total = 1/R1 + 1/R2 + ... */
export function parallelResistance(...resistances) {
  return 1 / resistances.reduce((sum, r) => sum + 1 / r, 0);
}

/** P = V * I (also equals I^2*R or V^2/R — provide either equivalent form as needed). */
export function electricPower(voltage, current) {
  return voltage * current;
}

/** Coulomb's law: F = k * q1 * q2 / r^2. Sign follows the charges (like charges repel: positive). */
export function coulombsLaw(q1, q2, distance, k = COULOMB_CONSTANT) {
  return (k * q1 * q2) / (distance * distance);
}

/** Electric field from a point charge: E = k * q / r^2. */
export function electricFieldFromPointCharge(charge, distance, k = COULOMB_CONSTANT) {
  return (k * charge) / (distance * distance);
}

export function capacitance(charge, voltage) {
  return charge / voltage;
}

/** Energy stored in a capacitor: U = 1/2 * C * V^2. */
export function capacitorEnergy(capacitanceF, voltage) {
  return 0.5 * capacitanceF * voltage * voltage;
}
