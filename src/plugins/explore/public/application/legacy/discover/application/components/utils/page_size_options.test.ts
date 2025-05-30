/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defaultPageOptions, generatePageSizeOptions } from './page_size_options';

describe('generatePageSizeOptions', () => {
  it('generates default options and additional options based on sample size', () => {
    const sampleSize = 1000;

    const pageSizeOptions = generatePageSizeOptions(sampleSize);

    // Expected result based on the provided sample size
    const expectedOptions = [...defaultPageOptions, 500, 1000];

    // Check if the generated options match the expected result
    expect(pageSizeOptions).toEqual(expectedOptions);
  });

  it('handles edge case when sample size is less than maxSize', () => {
    const sampleSize = 50;

    // Call the function
    const pageSizeOptions = generatePageSizeOptions(sampleSize);

    // Check if the generated options match the expected result
    expect(pageSizeOptions).toEqual(defaultPageOptions);
  });

  it('handles edge case when sample size is less than 0', () => {
    const sampleSize = -10;

    // Call the function
    const pageSizeOptions = generatePageSizeOptions(sampleSize);

    // Check if the generated options match the expected result
    expect(pageSizeOptions).toEqual(defaultPageOptions);
  });
});
