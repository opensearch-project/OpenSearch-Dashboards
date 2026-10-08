/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimeUnit } from '../../../types';
import { ceilToTimeUnit } from './time';

describe('ceilToTimeUnit', () => {
  test.each([
    [TimeUnit.YEAR, new Date(2023, 5, 15), new Date(2024, 0, 1)],
    [TimeUnit.MONTH, new Date(2023, 0, 15), new Date(2023, 1, 1)],
    [TimeUnit.DATE, new Date(2023, 0, 15, 12), new Date(2023, 0, 16)],
    [TimeUnit.HOUR, new Date(2023, 0, 15, 12, 30), new Date(2023, 0, 15, 13)],
    [TimeUnit.MINUTE, new Date(2023, 0, 15, 12, 30, 30), new Date(2023, 0, 15, 12, 31)],
    [TimeUnit.SECOND, new Date(2023, 0, 15, 12, 30, 30, 500), new Date(2023, 0, 15, 12, 30, 31)],
  ])('rounds %s up to the next boundary', (unit, timestamp, expected) => {
    expect(ceilToTimeUnit(timestamp, unit)).toEqual(expected);
  });

  it('preserves a timestamp already on the bucket boundary', () => {
    const timestamp = new Date(2023, 0, 15, 12);

    expect(ceilToTimeUnit(timestamp, TimeUnit.HOUR)).toEqual(timestamp);
  });
});
