/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Type definition for the calculation methods supported by calculateValue
 */
export type CalculationMethod =
  | 'first*'
  | 'first'
  | 'last*'
  | 'last'
  | 'min'
  | 'max'
  | 'mean'
  | 'median'
  | 'variance'
  | 'count'
  | 'distinct_count'
  | 'total';

/**
 * Calculates a single value from an array of values based on the specified calculation method.
 * @param values Array of numeric values to calculate from
 * @param calculationMethod The calculation method to apply ('first', 'last', 'min', 'max', etc.)
 * @returns The calculated value or undefined if the calculation cannot be performed
 */
export const calculateValue = (
  values: any[],
  calculationMethod: CalculationMethod
): number | undefined => {
  if (!values || values.length === 0) {
    return undefined;
  }

  const numbers = values
    .filter((n) => {
      if (typeof n === 'number' && !isNaN(n)) {
        return true;
      }
      if (typeof n === 'string' && n.trim() !== '' && !isNaN(Number(n.trim()))) {
        return true;
      }
      return false;
    })
    .map(Number);

  // For operations that require numbers, check if we have any valid numbers
  if (
    numbers.length === 0 &&
    ['min', 'max', 'mean', 'median', 'variance', 'total'].includes(calculationMethod)
  ) {
    return undefined;
  }

  switch (calculationMethod) {
    case 'first*': {
      return numbers[0];
    }
    case 'first':
      return values[0];
    case 'last*': {
      return numbers[numbers.length - 1];
    }
    case 'last':
      return values[values.length - 1];
    case 'min':
      return Math.min(...numbers);
    case 'max':
      return Math.max(...numbers);
    case 'mean':
      return numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
    case 'median': {
      const sorted = [...numbers].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }
    case 'variance': {
      const mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
      return numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
    }
    case 'count':
      return values.length;
    case 'distinct_count': {
      const uniqueValues = new Set(values);
      return uniqueValues.size;
    }
    case 'total':
      return numbers.reduce((sum, val) => sum + val, 0);
    default:
      return undefined;
  }
};

/**
 * Calculates the percentage change between the first and last numeric values in an array.
 * Formula: (last_numeric_value - first_numeric_value) / first_numeric_value
 * @param values Array of values to calculate from (may contain non-numeric values)
 * @returns The percentage change as a decimal value (e.g., 0.25 for 25% increase) or undefined if calculation cannot be performed
 */
export const calculatePercentage = (values: any[]): number | undefined => {
  if (!values || values.length === 0) {
    return undefined;
  }

  const numbers = values
    .filter((n) => {
      if (typeof n === 'number' && !isNaN(n)) {
        return true;
      }
      if (typeof n === 'string' && n.trim() !== '' && !isNaN(Number(n.trim()))) {
        return true;
      }
      return false;
    })
    .map(Number);

  if (numbers.length < 2) {
    return undefined; // Need at least two numeric values to calculate percentage change
  }

  const firstValue = numbers[0];
  const lastValue = numbers[numbers.length - 1];

  // Avoid division by zero
  if (firstValue === 0) {
    return undefined;
  }

  return (lastValue - firstValue) / Math.abs(firstValue);
};
