/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isChartType } from './is_chart_type';

describe('isChartType', () => {
  it('recognizes Sankey configurations restored from URL or saved state', () => {
    expect(isChartType('sankey')).toBe(true);
  });
});
