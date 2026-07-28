/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../ppl_language_analyzer';
import type { LintRunContext } from '../types';

// Source-scoped rules (field-validation + the three type-aware rules) read the
// ACTIVE dataset's field metadata. When the query's explicit `source=` names a
// different index than the selected dataset, those metadata are wrong for the
// query, so the rules must self-suppress rather than emit a finding (or an unsafe
// fix) that describes the wrong index. runLint gates them via
// `sourceConflictsWithDataset`, which suppresses ONLY on a proven mismatch and
// fails open for every uncertain case.
//
// All assertions run on the compiled (simplified-grammar) surface via
// analyzer.lint, matching analyzer_lint.test.ts.

describe('source-scoped rule suppression on a source/dataset mismatch (compiled surface)', () => {
  let analyzer: PPLLanguageAnalyzer;
  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  // The selected dataset is `orders`. Its metadata: `note` is text, `qty` is a
  // number, `attributes` is a flat_object, and the known field set does not
  // include `returns`-only columns.
  const ordersMetadata = (selectedSourcePattern: string | undefined): LintRunContext => ({
    selectedSourcePattern,
    dataSourceVersion: '3.8.0',
    isCalcite: true,
    fields: new Set<string>(['note', 'qty', 'attributes']),
    typeMap: new Map<string, string>([
      ['note', 'text'],
      ['qty', 'long'],
      ['attributes', 'flat_object'],
    ]),
  });

  const ids = (code: string, ctx: LintRunContext): string[] =>
    analyzer.lint(code, ctx).diagnostics.map((d) => d.ruleId);

  describe('suppressed when the query source clearly differs from the selected dataset', () => {
    // `orders` selected, query runs against `returns` → every source-scoped rule
    // is meaningless against orders' metadata.
    const ctx = ordersMetadata('orders');

    it('suppresses agg-on-text', () => {
      expect(ids('source=returns | stats avg(note)', ctx)).not.toContain('agg-on-text');
    });

    it('suppresses type-mismatch-numeric', () => {
      expect(ids('source=returns | where qty = "many"', ctx)).not.toContain(
        'type-mismatch-numeric'
      );
    });

    it('suppresses flat-object-subfield', () => {
      expect(ids('source=returns | fields attributes.http', ctx)).not.toContain(
        'flat-object-subfield'
      );
    });

    it('suppresses field-validation', () => {
      expect(ids('source=returns | where onlyInReturns = 1', ctx)).not.toContain(
        'field-validation'
      );
    });
  });

  describe('still fires when the query source matches the selected dataset', () => {
    const ctx = ordersMetadata('orders');

    it('fires agg-on-text', () => {
      expect(ids('source=orders | stats avg(note)', ctx)).toContain('agg-on-text');
    });

    it('fires type-mismatch-numeric', () => {
      expect(ids('source=orders | where qty = "many"', ctx)).toContain('type-mismatch-numeric');
    });

    it('fires flat-object-subfield', () => {
      expect(ids('source=orders | fields attributes.http', ctx)).toContain('flat-object-subfield');
    });

    it('fires field-validation', () => {
      expect(ids('source=orders | where onlyInReturns = 1', ctx)).toContain('field-validation');
    });
  });

  describe('fails open (still fires) when the match cannot be proven', () => {
    it('fires when there is no selected pattern to compare against', () => {
      const ctx = ordersMetadata(undefined);
      expect(ids('source=returns | stats avg(note)', ctx)).toContain('agg-on-text');
    });

    it('fires for a pipe-first query (executed source is the selected dataset)', () => {
      const ctx = ordersMetadata('orders');
      expect(ids('| stats avg(note)', ctx)).toContain('agg-on-text');
    });

    it('fires when the selected pattern is a wildcard', () => {
      const ctx = ordersMetadata('order*');
      expect(ids('source=orders | stats avg(note)', ctx)).toContain('agg-on-text');
    });

    it('fires when the query source is a wildcard', () => {
      const ctx = ordersMetadata('orders');
      expect(ids('source=orders* | stats avg(note)', ctx)).toContain('agg-on-text');
    });
  });

  it('does not suppress a structural (non-source-scoped) rule on a mismatch', () => {
    // head-without-sort reads no dataset metadata, so a source mismatch is
    // irrelevant and it must still fire.
    const ctx = ordersMetadata('orders');
    expect(ids('source=returns | head 5', ctx)).toContain('head-without-sort');
  });
});
