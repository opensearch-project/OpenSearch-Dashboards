/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { stateTimelineTooltipFormatter } from './state_timeline_utils';
import { resolveDisplayName, renderTooltipContent } from '../utils/tooltip';

describe('stateTimelineTooltipFormatter', () => {
  it('formats grouped state timeline tooltip rows', () => {
    const formatter = stateTimelineTooltipFormatter({ groupField: 'service' })({
      styles: {} as any,
      formatValue: (value) => String(value),
      getDisplayName: resolveDisplayName({ svc_a: 'Service A' }),
      renderTooltipContent,
    });

    const html = formatter({
      marker: '<span></span>',
      seriesName: 'Running',
      dimensionNames: ['service', 'start', 'end', 'duration', 'mergedCount'],
      value: ['svc_a', '2026-08-10T00:00:00Z', '2026-08-10T01:00:00Z', '1h', 3],
    });

    expect(html).toContain('Service A');
    expect(html).toContain('Running');
    expect(html).toContain('duration');
    expect(html).toContain('1h');
    expect(html).toContain('count');
    expect(html).toContain('3');
  });
});
