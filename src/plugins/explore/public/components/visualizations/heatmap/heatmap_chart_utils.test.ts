/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { heatmapTooltipFormatter } from './heatmap_chart_utils';
import { resolveDisplayName, renderTooltipContent } from '../utils/tooltip';

describe('heatmapTooltipFormatter', () => {
  it('formats heatmap tooltip rows from encoded dimensions', () => {
    const formatter = heatmapTooltipFormatter({
      styles: {} as any,
      formatValue: (value) => String(value),
      getDisplayName: resolveDisplayName(),
      renderTooltipContent,
    });

    const html = formatter({
      marker: '<span></span>',
      dimensionNames: ['origin', 'destination', 'delay'],
      encode: {
        x: [0],
        y: [1],
        value: [2],
      },
      value: ['SFO', 'SEA', 12],
    });

    expect(html).toContain('origin');
    expect(html).toContain('SFO');
    expect(html).toContain('destination');
    expect(html).toContain('SEA');
    expect(html).toContain('delay');
    expect(html).toContain('12');
  });
});
