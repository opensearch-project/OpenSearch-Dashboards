/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns the number of decimal places implied by a numeric value.
 * For example, 1 -> 0, 0.2 -> 1, 0.25 -> 2, and 1e-7 -> 7.
 */
export const getDecimalPrecision = (value: number): number => {
  const valueString = value.toString().toLowerCase();

  if (valueString.includes('e-')) {
    const [coefficient, exponent] = valueString.split('e-');
    const coefficientDecimals = coefficient.split('.')[1]?.length ?? 0;
    return Number(exponent) + coefficientDecimals;
  }

  return valueString.split('.')[1]?.length ?? 0;
};

/**
 * Rounds a value to the requested number of decimal places.
 * For example, roundToPrecision(1.7999999999999998, 1) -> 1.8.
 */
export const roundToPrecision = (value: number, precision: number): number => {
  const factor = Math.pow(10, precision);
  return Number((Math.round(value * factor) / factor).toFixed(precision));
};
