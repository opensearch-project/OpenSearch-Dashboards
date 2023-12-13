/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { uniq } from 'lodash';

/**
 * Generates an array of pagination options based on the provided `sampleSize`.
 * The array includes default values (25, 50, 100) and additional options derived from the `sampleSize` setting.
 * Ensures uniqueness and sorts the array in ascending order, representing available page size options for pagination.
 * @param {number} sampleSize - The sample size used to determine additional pagination options.
 * @returns {number[]} - An array of available page size options.
 */

export const generatePageSizeOptions = (sampleSize: number): number[] => {
  if (sampleSize && sampleSize > 0) {
    const maxSize = 500;
    const pageSizeFromSetting = [...Array(Math.floor(sampleSize / maxSize)).keys()].map(
      (i) => (i + 1) * maxSize
    );
    return uniq([...defaultPageOptions, ...pageSizeFromSetting]).sort((a, b) => a - b);
  }
  return defaultPageOptions;
};

export const defaultPageOptions = [25, 50, 100];
