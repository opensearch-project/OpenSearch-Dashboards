/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHoverCard } from '../hover_card';
import { getRuleHoverContent } from '../engine_outcomes';

describe('renderHoverCard', () => {
  it('renders the engine-behavior line and verified version for division-by-zero', () => {
    const md = renderHoverCard({
      ruleId: 'division-by-zero',
      severityLabel: 'Warning',
      message: 'Dividing by zero returns null silently — guard with coalesce() or a conditional.',
      docUrl:
        'https://docs.opensearch.org/latest/sql-and-ppl/ppl/functions/expressions/#arithmetic-operators',
      content: getRuleHoverContent('division-by-zero'),
      facts: { literal: '0' },
    });
    expect(md).toContain('**division-by-zero** · Warning');
    expect(md).toContain('**Engine behavior** —');
    expect(md).toContain('produces null');
    expect(md).toContain('verified on OpenSearch 3.7');
    expect(md).toContain('**Why warning** —');
    expect(md).toContain('Offending value:');
    expect(md).toContain('`0`');
    expect(md).toContain('**Safe to ignore** —');
    expect(md).toContain(
      '[Learn more →](https://docs.opensearch.org/latest/sql-and-ppl/ppl/functions/expressions/#arithmetic-operators)'
    );
  });

  it('renders a field/type "Your query" line for agg-on-text', () => {
    const md = renderHoverCard({
      ruleId: 'agg-on-text',
      severityLabel: 'Warning',
      message:
        'Numeric aggregation "avg" on text field "response_body" returns null rather than a numeric result.',
      content: getRuleHoverContent('agg-on-text'),
      facts: { field: 'response_body', esType: 'text', aggName: 'avg' },
    });
    expect(md).toContain('**Your query** —');
    expect(md).toContain('`response_body` is mapped as `text`');
    expect(md).toContain('`avg()` needs a numeric type');
  });

  it('enumerates candidate indices for wildcard-source-zero-match', () => {
    const md = renderHoverCard({
      ruleId: 'wildcard-source-zero-match',
      severityLabel: 'Info',
      message: 'Source pattern "logs-*" matches no known index.',
      content: getRuleHoverContent('wildcard-source-zero-match'),
      facts: { pattern: 'logs-*', totalIndices: 47, candidateIndices: ['logs_2024', 'logs_2025'] },
    });
    expect(md).toContain('`logs-*` matched 0 of 47 visible indices');
    expect(md).toContain('Did you mean one of: `logs_2024`, `logs_2025`?');
  });

  it('renders a closest-field suggestion from facts', () => {
    const md = renderHoverCard({
      ruleId: 'field-validation',
      severityLabel: 'Warning',
      message: 'Unknown field "reveneu". Did you mean "revenue"?',
      content: getRuleHoverContent('field-validation'),
      facts: { field: 'reveneu', suggestion: 'revenue' },
    });
    expect(md).toContain('Closest known field: `revenue`');
  });

  it('attributes esType to the root object, never to the subfield', () => {
    const md = renderHoverCard({
      ruleId: 'flat-object-subfield',
      severityLabel: 'Error',
      message: 'Subfield "attributes.http.method" of flat_object field "attributes".',
      content: getRuleHoverContent('flat-object-subfield'),
      facts: { field: 'attributes.http.method', root: 'attributes', esType: 'flat_object' },
    });
    // The subfield has no mapping of its own; the type describes the root.
    expect(md).toContain(
      '`attributes.http.method` lives inside `attributes`, mapped as `flat_object`'
    );
    expect(md).not.toContain('`attributes.http.method` is mapped as `flat_object`');
  });

  it('fences inline code containing a backtick verbatim (no lookalike substitution)', () => {
    const md = renderHoverCard({
      ruleId: 'field-validation',
      severityLabel: 'Warning',
      message: 'Unknown field.',
      content: getRuleHoverContent('field-validation'),
      facts: { field: 'weird`name' },
    });
    // The real backtick survives; the U+02CB lookalike must not appear.
    expect(md).toContain('weird`name');
    expect(md).not.toContain('weirdˋname');
  });

  it('escapes tilde and pipe in the message', () => {
    const md = renderHoverCard({
      ruleId: 'r',
      severityLabel: 'Info',
      message: 'strike ~~through~~ and pipe | here',
    });
    expect(md).toContain('strike \\~\\~through\\~\\~ and pipe \\| here');
  });

  it('percent-encodes parentheses in the doc link target so it cannot close early', () => {
    const md = renderHoverCard({
      ruleId: 'r',
      severityLabel: 'Info',
      message: 'm',
      docUrl: 'https://docs.example/path_(disambiguation)/#a',
    });
    expect(md).toContain('[Learn more →](https://docs.example/path_%28disambiguation%29/#a)');
  });

  it('degrades to just the header + message when no static content or facts', () => {
    const md = renderHoverCard({
      ruleId: 'ppl-lint',
      severityLabel: 'Info',
      message: 'Something happened.',
    });
    expect(md).toContain('**ppl-lint** · Info');
    expect(md).toContain('Something happened.');
    expect(md).not.toContain('**Engine behavior**');
    expect(md).not.toContain('Learn more');
  });

  it('escapes markdown-significant characters in the message', () => {
    const md = renderHoverCard({
      ruleId: 'r',
      severityLabel: 'Info',
      message: 'use *star* and _under_ and [brackets]',
    });
    expect(md).toContain('use \\*star\\* and \\_under\\_ and \\[brackets\\]');
  });
});
