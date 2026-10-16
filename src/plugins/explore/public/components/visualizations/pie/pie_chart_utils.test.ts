/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { pieDisplayNameTooltipFormatter } from './pie_chart_utils';
import { resolveDisplayName, renderTooltipContent } from '../utils/tooltip';

describe('pieDisplayNameTooltipFormatter', () => {
  it('formats pie tooltip with display names and formatted values', () => {
    const formatter = pieDisplayNameTooltipFormatter({
      styles: {} as any,
      formatValue: (value) => `${value} ms`,
      getDisplayName: resolveDisplayName({ A: 'Alpha' }),
      renderTooltipContent,
    });

    const html = formatter({
      marker: '<span></span>',
      name: 'A',
      value: 100,
    });

    expect(html).toContain('Alpha');
    expect(html).toContain('100 ms');
  });
});
