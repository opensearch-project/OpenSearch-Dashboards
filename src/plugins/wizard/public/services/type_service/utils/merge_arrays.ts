/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { uniq } from 'lodash';

export function mergeArrays<T extends object, K extends keyof T>(a: T[], b: T[], key: K): T[] {
  const dict: Record<PropertyKey, T> = {};

  const rawCombinedArrays = [...a, ...b];

  // Create an ordered list of unique the array keys. Removing duplicates while keeping the order
  const combinedOrder = uniq(rawCombinedArrays.map((entry) => entry[key]));

  // Create a map of all unique ID's and their values.
  // If there is more than one entry with the same ID, the last entry is kept
  rawCombinedArrays.forEach((entry) => {
    if (!entry.hasOwnProperty(key)) {
      throw new Error('Key not present in an object in one the arrays to merge');
    }

    const id = entry[key];

    if (typeof id !== 'string' && typeof id !== 'number') {
      throw new Error('Can only merge arrays with keys of type number or string');
    }

    dict[id] = entry;
  });

  // Return the combined array in order with unique keys keeping only the last entry for each unique id
  return combinedOrder.map((entryId) => {
    if (typeof entryId !== 'string' && typeof entryId !== 'number') {
      throw new Error('Can only merge arrays with keys of type number or string');
    }
    return dict[entryId];
  });
}
