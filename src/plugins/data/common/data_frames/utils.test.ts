/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import datemath from '@opensearch/datemath';
import { formatTimePickerDate } from '.';

describe('formatTimePickerDate', () => {
  const mockDateFormat = 'YYYY-MM-DD HH:mm:ss';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle date range with rounding', () => {
    jest.spyOn(datemath, 'parse');

    const result = formatTimePickerDate({ from: 'now/d', to: 'now/d' }, mockDateFormat);

    expect(result.fromDate).not.toEqual(result.toDate);

    expect(datemath.parse).toHaveBeenCalledTimes(2);
    expect(datemath.parse).toHaveBeenCalledWith('now/d', { roundUp: undefined });
    expect(datemath.parse).toHaveBeenCalledWith('now/d', { roundUp: true });
  });
});
