/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../../core/public/mocks';
import { UI_SETTINGS } from '../../../data/common';
import {
  hasPPLIntervalMacros,
  interpolatePPLIntervalMacros,
  resolveAutoPPLInterval,
} from './ppl_interval_macros';

const uiSettingsWith = (barTarget = 50, maxBars = 100) => {
  const uiSettings = coreMock.createStart().uiSettings;
  (uiSettings.get as jest.Mock).mockImplementation((key: string) => {
    if (key === UI_SETTINGS.HISTOGRAM_BAR_TARGET) return barTarget;
    if (key === UI_SETTINGS.HISTOGRAM_MAX_BARS) return maxBars;
    if (key === 'dateFormat:scaled') return [];
    return undefined;
  });
  return uiSettings;
};

const range = (hours: number) => ({
  from: '2024-01-01T00:00:00Z',
  to: new Date(Date.parse('2024-01-01T00:00:00Z') + hours * 3600 * 1000).toISOString(),
});

describe('PPL interval macros', () => {
  describe('interpolatePPLIntervalMacros', () => {
    const interval = '30m';

    it('replaces $__interval and ${__interval} with the span expression', () => {
      expect(
        interpolatePPLIntervalMacros(
          'source=logs | stats count() by span(@timestamp, $__interval), span(t, ${__interval})',
          interval
        )
      ).toBe('source=logs | stats count() by span(@timestamp, 30m), span(t, 30m)');
    });

    it('leaves other variables and look-alike names alone', () => {
      expect(
        interpolatePPLIntervalMacros('$host $__intervalx $__interval_ms $__range', interval)
      ).toBe('$host $__intervalx $__interval_ms $__range');
    });
  });

  it('hasPPLIntervalMacros tells whether a query uses them', () => {
    expect(hasPPLIntervalMacros('span(@timestamp, $__interval)')).toBe(true);
    expect(hasPPLIntervalMacros('span(@timestamp, ${__interval})')).toBe(true);
    expect(hasPPLIntervalMacros('span(@timestamp, 1h) | where x = $host')).toBe(false);
    expect(hasPPLIntervalMacros('eval t = $__interval_ms')).toBe(false);
  });

  describe('resolveAutoPPLInterval', () => {
    it('matches the histogram Auto interval over the time range', () => {
      const uiSettings = uiSettingsWith();
      // 15m / 50 = 18s -> 30s; 24h / 50 = 28.8m -> 30m; 7d / 50 = 3.4h -> 3h.
      expect(resolveAutoPPLInterval(range(0.25), uiSettings)).toBe('30s');
      expect(resolveAutoPPLInterval(range(24), uiSettings)).toBe('30m');
      expect(resolveAutoPPLInterval(range(24 * 7), uiSettings)).toBe('3h');
    });

    it('follows the histogram:barTarget setting', () => {
      // 24h / 10 = 2.4h -> 3h.
      expect(resolveAutoPPLInterval(range(24), uiSettingsWith(10))).toBe('3h');
    });

    it('is undefined without a readable time range', () => {
      const uiSettings = uiSettingsWith();
      expect(resolveAutoPPLInterval(undefined, uiSettings)).toBeUndefined();
      expect(resolveAutoPPLInterval({ from: 'nope', to: 'now' }, uiSettings)).toBeUndefined();
    });
  });
});
