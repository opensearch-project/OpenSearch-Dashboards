/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCatalogEntryById } from '../../catalog';
import { HoverCardInput, renderHoverCard } from '../hover_card';

function render(overrides: Partial<HoverCardInput> = {}): string {
  return renderHoverCard({
    severityLabel: 'Warning',
    ...overrides,
  });
}

describe('renderHoverCard', () => {
  it('renders supplemental guidance without repeating marker content', () => {
    const entry = getCatalogEntryById('division-by-zero');
    const markerMessage = 'Dividing by zero returns no value (null) instead of an error.';
    const md = render({
      docUrl: entry?.docUrl,
      howToFix: entry?.howToFix,
    });

    expect(md).toContain('⚠️ **Warning**');
    expect(md).not.toContain('Rule:');
    expect(md).not.toContain('division-by-zero');
    expect(md).not.toContain(markerMessage);
    expect(md).toContain('**Fix** — Check your divisor');
    expect(md).toContain(
      '[Learn more →](https://docs.opensearch.org/latest/sql-and-ppl/ppl/functions/expressions/#arithmetic-operators)'
    );
  });

  it('renders the Fix line from catalog howToFix and no facts section', () => {
    const entry = getCatalogEntryById('agg-on-text');
    const md = render({ howToFix: entry?.howToFix });

    expect(md).toContain('**Fix** — Aggregate a numeric field instead, cast this field');
    expect(md).not.toContain('Numeric aggregations cannot');
    expect(md).not.toContain('**Your query**');
  });

  it('renders a deterministic quick-fix preview', () => {
    const entry = getCatalogEntryById('field-validation');
    const md = render({
      severityLabel: 'Error',
      howToFix: entry?.howToFix,
      fixText: 'revenue',
    });

    expect(md).toContain('❌ **Error**');
    expect(md).toContain('**Quick fix available** — `revenue`');
    expect(md).not.toContain('Closest known field');
  });

  it('does not add a facts/Details section for a wildcard source', () => {
    const entry = getCatalogEntryById('wildcard-source-zero-match');
    const md = render({
      severityLabel: 'Info',
      howToFix: entry?.howToFix,
      fixText: '`logs-2026.07.25`',
    });

    expect(md).toContain('ℹ️ **Info**');
    expect(md).toContain('**Quick fix available** — `` `logs-2026.07.25` ``');
    expect(md).not.toContain('matched 0 of');
    expect(md).not.toContain('Did you mean one of');
    expect(md).not.toContain('**Your query**');
  });

  it('fences a quick fix containing a backtick verbatim', () => {
    const md = render({ fixText: 'weird`name' });
    expect(md).toContain('weird`name');
    expect(md).not.toContain('weirdˋname');
  });

  it('preserves inline-code Markdown in bundled howToFix guidance', () => {
    const entry = getCatalogEntryById('head-without-sort');
    const md = render({ howToFix: entry?.howToFix });
    expect(md).toContain('Add `sort` before `head`');
  });

  it('percent-encodes parentheses in the doc link target', () => {
    const md = render({
      docUrl: 'https://docs.example/path_(disambiguation)/#a',
    });
    expect(md).toContain('[Learn more →](https://docs.example/path_%28disambiguation%29/#a)');
  });

  it('returns an empty string when no supplemental guidance is available', () => {
    expect(render()).toBe('');
  });
});
