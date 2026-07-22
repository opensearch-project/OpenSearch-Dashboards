/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  suggestWildcardFromName,
  suggestWildcardFromNames,
  longestCommonPrefix,
  commaSeparated,
  seedCreatePattern,
} from './suggest_wildcard';

describe('suggestWildcardFromName', () => {
  it('strips a single trailing numeric counter', () => {
    expect(suggestWildcardFromName('logs-0001')).toBe('logs-*');
    expect(suggestWildcardFromName('my-name-logs-019')).toBe('my-name-logs-*');
    expect(suggestWildcardFromName('nginx_access_000123')).toBe('nginx_access_*');
  });

  it('strips the ENTIRE trailing run of numeric date tokens', () => {
    expect(suggestWildcardFromName('logs-2026.07.09')).toBe('logs-*');
    expect(suggestWildcardFromName('logs-02.01.2026')).toBe('logs-*');
    expect(suggestWildcardFromName('logs-02-01-2026')).toBe('logs-*');
    expect(suggestWildcardFromName('logs-app-2026.07.09')).toBe('logs-app-*');
  });

  it('anchors the wildcard at the correct mixed separator', () => {
    // The separator before the numeric run is `.`, not `-`, so it must round-trip.
    expect(suggestWildcardFromName('logs.2026-07-09')).toBe('logs.*');
  });

  it('reduces a data-stream backing index', () => {
    expect(suggestWildcardFromName('.ds-logs-otel-2026.07.09-000001')).toBe('.ds-logs-otel-*');
  });

  it('leaves an all-numeric name unchanged (no text stem to anchor on)', () => {
    expect(suggestWildcardFromName('2026.07.09')).toBe('2026.07.09');
  });

  it('leaves a name whose trailing token is not purely numeric unchanged', () => {
    expect(suggestWildcardFromName('logs-v2')).toBe('logs-v2');
    expect(suggestWildcardFromName('logs-2026w01')).toBe('logs-2026w01');
    expect(suggestWildcardFromName('logs-app-reindex')).toBe('logs-app-reindex');
  });

  it('leaves a too-thin stem unchanged (guard rail: stem >= 3 chars)', () => {
    expect(suggestWildcardFromName('a-1')).toBe('a-1');
    expect(suggestWildcardFromName('x-0001')).toBe('x-0001');
  });

  it('returns the exact name when there is no usable separator', () => {
    expect(suggestWildcardFromName('orders')).toBe('orders');
    expect(suggestWildcardFromName('logs001')).toBe('logs001');
  });

  it('leaves an existing wildcard untouched', () => {
    expect(suggestWildcardFromName('logs-app-*')).toBe('logs-app-*');
  });

  it('handles empty input', () => {
    expect(suggestWildcardFromName('')).toBe('');
  });
});

describe('longestCommonPrefix', () => {
  it('returns the shared prefix', () => {
    expect(longestCommonPrefix(['logs-app-a', 'logs-app-b'])).toBe('logs-app-');
  });

  it('returns empty when there is no shared prefix', () => {
    expect(longestCommonPrefix(['logs-app', 'nginx'])).toBe('');
  });

  it('returns the single element unchanged', () => {
    expect(longestCommonPrefix(['only'])).toBe('only');
  });

  it('returns empty for an empty list', () => {
    expect(longestCommonPrefix([])).toBe('');
  });
});

describe('suggestWildcardFromNames', () => {
  it('reduces each name then agrees on a single family (fixes the LCP date truncation)', () => {
    // Both reduce to `logs-app-*`; raw LCP would give the broken `logs-app-2026.07.0*`.
    expect(suggestWildcardFromNames(['logs-app-2026.07.09', 'logs-app-2026.07.08'])).toBe(
      'logs-app-*'
    );
  });

  it('comma-joins when reduced families differ (avoids over-broad LCP like ap*)', () => {
    expect(suggestWildcardFromNames(['api-1', 'app-1'])).toBe('api-1,app-1');
  });

  it('comma-joins names that do not reduce (no numeric suffix)', () => {
    expect(suggestWildcardFromNames(['orders', 'users'])).toBe('orders,users');
  });

  it('delegates to the single-name heuristic for one item', () => {
    expect(suggestWildcardFromNames(['logs-app-2026.07.09'])).toBe('logs-app-*');
  });
});

describe('commaSeparated', () => {
  it('joins names with commas', () => {
    expect(commaSeparated(['a', 'b', 'c'])).toBe('a,b,c');
  });
});

describe('seedCreatePattern', () => {
  it('seeds a wildcard for a single index', () => {
    expect(seedCreatePattern(['logs-app-2026.07.09'])).toEqual({
      mode: 'wildcard',
      pattern: 'logs-app-*',
    });
  });

  it('seeds a wildcard for a multi-set that reduces to one family', () => {
    expect(seedCreatePattern(['logs-app-001', 'logs-app-002'])).toEqual({
      mode: 'wildcard',
      pattern: 'logs-app-*',
    });
  });

  it('seeds comma-separated for a heterogeneous multi-set', () => {
    expect(seedCreatePattern(['orders', 'users'])).toEqual({
      mode: 'comma',
      pattern: 'orders,users',
    });
  });

  it('handles an empty selection', () => {
    expect(seedCreatePattern([])).toEqual({ mode: 'wildcard', pattern: '' });
  });
});
