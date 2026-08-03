/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCatalogEntryById } from '../../catalog';
import { HoverCardInput, renderHoverCard } from '../hover_card';

function render(overrides: Partial<HoverCardInput> = {}): string {
  return renderHoverCard({
    severityLabel: 'Warning',
    message: 'Something happened.',
    ...overrides,
  });
}

describe('renderHoverCard', () => {
  it('renders a concise, action-oriented division-by-zero card', () => {
    const entry = getCatalogEntryById('division-by-zero');
    const md = render({
      message: 'Dividing by zero returns no value (null) instead of an error.',
      docUrl: entry?.docUrl,
      howToFix: entry?.howToFix,
    });

    expect(md).toContain('⚠️ **Warning**');
    // The rule id is NOT repeated in the card: Monaco already renders it as the
    // marker's `code`, linked to the rule's doc section.
    expect(md).not.toContain('Rule:');
    expect(md).not.toContain('division-by-zero');
    expect(md).toContain('Dividing by zero returns no value');
    expect(md).toContain('**Fix** — Use the intended divisor');
    expect(md).toContain(
      '[Learn more →](https://docs.opensearch.org/latest/sql-and-ppl/ppl/functions/expressions/#arithmetic-operators)'
    );
    // The verbose engine-outcomes sections are gone from the simplified card.
    expect(md).not.toContain('Engine behavior');
    expect(md).not.toContain('Why warning');
    expect(md).not.toContain('Your query');
    expect(md).not.toContain('Safe to ignore');
  });

  it('renders the Fix line from catalog howToFix and no facts section', () => {
    const entry = getCatalogEntryById('agg-on-text');
    const md = render({
      message:
        'avg on text field "response_body" may return no value (null), because text is not stored as a number.',
      howToFix: entry?.howToFix,
    });

    expect(md).toContain('text field "response\\_body"');
    expect(md).toContain('**Fix** — Aggregate a numeric field instead');
    expect(md).not.toContain('**Your query**');
    expect(md).not.toContain('mapped as');
  });

  it('renders a deterministic quick-fix preview', () => {
    const entry = getCatalogEntryById('field-validation');
    const md = render({
      severityLabel: 'Error',
      message: 'Unknown field "reveneu". Did you mean "revenue"?',
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
      message: 'Source pattern "lgos-*" matches no known index.',
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

  // The rule-id fencing case is gone with the id itself; `code()` is still covered
  // by the quick-fix backtick case above, which is its only remaining caller.

  it('preserves inline-code Markdown in bundled howToFix guidance', () => {
    const entry = getCatalogEntryById('head-without-sort');
    const md = render({ howToFix: entry?.howToFix });
    expect(md).toContain('Add `sort` before `head`');
  });

  it('escapes markdown-significant characters in the detector message', () => {
    const md = render({ message: 'use *star*, _under_, [brackets], ~~strike~~, and pipe |' });
    expect(md).toContain(
      'use \\*star\\*, \\_under\\_, \\[brackets\\], \\~\\~strike\\~\\~, and pipe \\|'
    );
  });

  it('percent-encodes parentheses in the doc link target', () => {
    const md = render({
      docUrl: 'https://docs.example/path_(disambiguation)/#a',
    });
    expect(md).toContain('[Learn more →](https://docs.example/path_%28disambiguation%29/#a)');
  });

  it('degrades to the severity and message when no rule help is available', () => {
    const md = render({ severityLabel: 'Info', message: 'Something happened.' });
    expect(md).toBe('ℹ️ **Info**\n\nSomething happened.');
  });
});
