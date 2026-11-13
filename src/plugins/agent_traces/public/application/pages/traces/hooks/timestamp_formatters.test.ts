/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from '../../../../../../../core/public';
import { getTimestampFormatters } from './timestamp_formatters';

const settings = (values: Record<string, string | undefined>) =>
  ({ get: (key: string) => values[key] }) as unknown as IUiSettingsClient;

describe('getTimestampFormatters', () => {
  const ts = '2026-11-11 12:18:50.793';

  it('uses the default date format: full precision for rows, seconds for lists', () => {
    const { formatTs, formatListTs } = getTimestampFormatters(settings({ 'dateFormat:tz': 'UTC' }));
    expect(formatTs(ts)).toBe('Nov 11, 2026 @ 12:18:50.793');
    expect(formatListTs(ts)).toBe('Nov 11, 2026 @ 12:18:50');
  });

  it("follows a custom dateFormat, like Explore's lists", () => {
    const { formatTs, formatListTs } = getTimestampFormatters(
      settings({ dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS', 'dateFormat:tz': 'UTC' })
    );
    expect(formatTs(ts)).toBe('2026-11-11 12:18:50.793');
    expect(formatListTs(ts)).toBe('2026-11-11 12:18:50');
  });

  it('applies dateFormat:tz', () => {
    const { formatListTs } = getTimestampFormatters(
      settings({ 'dateFormat:tz': 'America/New_York' })
    );
    expect(formatListTs(ts)).toBe('Nov 11, 2026 @ 07:18:50');
  });
});
