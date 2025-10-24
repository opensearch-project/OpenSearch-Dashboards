/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shouldShowBreakdownSelector } from './breakdown_utils';
import { DataView } from '../../../../../data/common';

describe('shouldShowBreakdownSelector', () => {
  it('should return true only when dataView exists', () => {
    expect(shouldShowBreakdownSelector(undefined)).toBe(false);

    expect(
      shouldShowBreakdownSelector({
        timeFieldName: '@timestamp',
      } as DataView)
    ).toBe(true);
  });
});
