/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates an array of pagination options based on the provided `pageSizeLimit`.
 * The array includes default values (25, 50, 100) and additional options derived from the `pageSizeLimit` setting.
 * Ensures uniqueness and sorts the array in ascending order, representing available page size options for pagination.
 * @param {number} pageSizeLimit - The sample size used to determine additional pagination options.
 * @returns {number[]} - An array of available page size options.
 */

export const generatePageSizeOptions = (pageSizeLimit: number): number[] => {
  const isInDefaultRange = pageSizeLimit < defaultPageOptions[defaultPageOptions.length - 1];

  if (pageSizeLimit && pageSizeLimit > 0 && !isInDefaultRange) {
    const stepSize = 500;
    const pageSizeFromSetting = [...Array(Math.ceil(pageSizeLimit / stepSize)).keys()].map(
      (i) => (i + 1) * stepSize
    );
    return Array.from(new Set([...defaultPageOptions, ...pageSizeFromSetting])).sort(
      (a, b) => a - b
    );
  }
  return defaultPageOptions;
};

export const defaultPageOptions = [25, 50, 100];
