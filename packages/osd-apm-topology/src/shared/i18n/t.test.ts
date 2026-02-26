/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { t, getLocalizedMessages } from './t';
import { Locale } from './locale';

describe('getLocalizedMessages', () => {
  it('returns English messages for English locale', () => {
    const messages = getLocalizedMessages(Locale.en);
    expect(messages).toBeDefined();
    expect(messages.breadcrumbs.world).toBe('World');
  });

  it('defaults to English for unknown locale', () => {
    const messages = getLocalizedMessages('unknown' as Locale);
    expect(messages.breadcrumbs.world).toBe('World');
  });
});

describe('t', () => {
  it('returns English string for valid key', () => {
    expect(t('breadcrumbs.world')).toBe('World');
  });

  it('returns nested key value', () => {
    expect(t('buttons.viewInsights')).toBe('View insights');
  });

  it('replaces parameters in template', () => {
    expect(t('healthDonut.legend.faults', { value: '15' })).toBe('15% faults (5xx)');
  });

  it('returns key string when key not found', () => {
    expect(t('nonexistent.key' as any)).toBe('nonexistent.key');
  });

  it('defaults to English locale', () => {
    expect(t('breadcrumbs.world')).toBe('World');
  });

  it('falls back to English for unknown locale', () => {
    const result = t('breadcrumbs.world', {}, 'unknown' as Locale);
    expect(result).toBe('World');
  });
});
