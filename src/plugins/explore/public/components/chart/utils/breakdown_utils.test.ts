/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shouldShowBreakdownSelector } from './breakdown_utils';
import { DataView } from '../../../../../data/common';

describe('shouldShowBreakdownSelector', () => {
  it('should return true only when dataView has @timestamp as time field', () => {
    expect(shouldShowBreakdownSelector(undefined)).toBe(false);

    expect(
      shouldShowBreakdownSelector({
        timeFieldName: '@timestamp',
      } as DataView)
    ).toBe(true);

    expect(
      shouldShowBreakdownSelector({
        timeFieldName: 'custom_time_field',
      } as DataView)
    ).toBe(false);
  });
});
