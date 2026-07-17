/*
  Chemistry — mole/mass conversions, the ideal gas law, solution
  concentration, and reaction yield.
*/

/** Universal gas constant, J/(mol*K). */
export const GAS_CONSTANT = 8.314;

export function molesFromMass(mass, molarMass) {
  return mass / molarMass;
}

export function massFromMoles(moles, molarMass) {
  return moles * molarMass;
}

/** Ideal gas law solved for pressure: P = nRT / V. */
export function idealGasPressure(moles, temperatureK, volume, R = GAS_CONSTANT) {
  return (moles * R * temperatureK) / volume;
}

/** Ideal gas law solved for volume: V = nRT / P. */
export function idealGasVolume(moles, temperatureK, pressure, R = GAS_CONSTANT) {
  return (moles * R * temperatureK) / pressure;
}

/** Ideal gas law solved for temperature: T = PV / (nR). */
export function idealGasTemperature(pressure, volume, moles, R = GAS_CONSTANT) {
  return (pressure * volume) / (moles * R);
}

/** Ideal gas law solved for moles: n = PV / (RT). */
export function idealGasMoles(pressure, volume, temperatureK, R = GAS_CONSTANT) {
  return (pressure * volume) / (R * temperatureK);
}

/** Molar concentration: c = n / V (V in liters, c in mol/L). */
export function molarConcentration(moles, volumeLiters) {
  return moles / volumeLiters;
}

/** Dilution equation: C1*V1 = C2*V2, solved for V2. */
export function dilutionVolume(concentration1, volume1, concentration2) {
  return (concentration1 * volume1) / concentration2;
}

export function percentYield(actualYield, theoreticalYield) {
  return (actualYield / theoreticalYield) * 100;
}

/** Celsius <-> Kelvin, used throughout gas-law calculations. */
export function celsiusToKelvin(celsius) {
  return celsius + 273.15;
}

export function kelvinToCelsius(kelvin) {
  return kelvin - 273.15;
}
