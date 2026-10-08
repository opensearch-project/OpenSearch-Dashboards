/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../ppl_language_analyzer';
import type { LintRunContext } from '../types';
import { getBundledCatalog } from '../catalog';

const RULE_ID = 'enabled-false-object';

describe('enabled-false-object', () => {
  let analyzer: PPLLanguageAnalyzer;

  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  const diagnosticsFor = (code: string, context?: LintRunContext) =>
    analyzer.lint(code, context).diagnostics.filter((d) => d.ruleId === RULE_ID);

  // The rule is gated to Calcite on OpenSearch >= 3.7 (the surface it was
  // verified on); the context must declare that surface or the version filter
  // suppresses the rule before the detector runs.
  const withDisabled = (...names: string[]): LintRunContext => ({
    dataSourceVersion: '3.7.0',
    isCalcite: true,
    fields: new Set(['status']),
    disabledObjectFields: new Set(names),
  });

  describe('self-suppression', () => {
    it('does not fire without a disabled-object set', () => {
      expect(
        diagnosticsFor('source=logs | where session.id = 1', {
          dataSourceVersion: '3.7.0',
          isCalcite: true,
        })
      ).toHaveLength(0);
    });

    it('does not fire when the disabled-object set is empty', () => {
      expect(
        diagnosticsFor('source=logs | where session.id = 1', {
          dataSourceVersion: '3.7.0',
          isCalcite: true,
          disabledObjectFields: new Set<string>(),
        })
      ).toHaveLength(0);
    });

    it('does not fire off the validated surface (no Calcite signal)', () => {
      expect(
        diagnosticsFor('source=logs | where session.id = 1', {
          fields: new Set(['status']),
          disabledObjectFields: new Set(['session']),
        })
      ).toHaveLength(0);
    });
  });

  describe('detection', () => {
    it('flags a reference into a disabled object in where', () => {
      expect(
        diagnosticsFor('source=logs | where session.id = 1', withDisabled('session'))
      ).toHaveLength(1);
    });

    it('flags a reference in a fields projection', () => {
      expect(
        diagnosticsFor('source=logs | fields session.id', withDisabled('session'))
      ).toHaveLength(1);
    });

    it('flags a reference in eval', () => {
      expect(
        diagnosticsFor('source=logs | eval x = session.id', withDisabled('session'))
      ).toHaveLength(1);
    });

    it('does not flag a dotted path whose root is not disabled', () => {
      expect(
        diagnosticsFor('source=logs | where other.id = 1', withDisabled('session'))
      ).toHaveLength(0);
    });

    it('flags a subfield of a nested disabled object (dotted producer name)', () => {
      expect(
        diagnosticsFor('source=logs | where outer.inner.deep = 1', withDisabled('outer.inner'))
      ).toHaveLength(1);
    });

    it('reports one diagnostic when disabled roots overlap', () => {
      expect(
        diagnosticsFor(
          'source=logs | where outer.inner.deep = 1',
          withDisabled('outer', 'outer.inner')
        )
      ).toHaveLength(1);
    });

    it('flags a direct reference to the nested disabled object itself', () => {
      expect(
        diagnosticsFor('source=logs | fields outer.inner', withDisabled('outer.inner'))
      ).toHaveLength(1);
    });

    it('does not flag a sibling that only shares a name prefix', () => {
      // `log` is disabled; `logger.field` shares the leading text but is a
      // different top-level object, so the `.` boundary must not match it.
      expect(
        diagnosticsFor('source=logs | where logger.field = 1', withDisabled('log'))
      ).toHaveLength(0);
    });

    it('does not flag a bare field with no dotted path', () => {
      expect(diagnosticsFor('source=logs | where status = 1', withDisabled('status'))).toHaveLength(
        0
      );
    });

    it('flags each reference to the disabled object separately', () => {
      expect(
        diagnosticsFor(
          'source=logs | where session.id = 1 | fields session.name',
          withDisabled('session')
        )
      ).toHaveLength(2);
    });
  });

  // A field under an `enabled: false` object is absent from `_field_caps`, so it is
  // absent from `context.fields` too — which means field-validation would call it
  // missing from the schema and put a second, wrong squiggle on the same reference. These
  // assert the two rules divide the judgement: this rule owns it, field-validation
  // stays quiet, and a genuine typo is still caught.
  describe('does not double-flag with field-validation', () => {
    const unknownField = (code: string, context?: LintRunContext) =>
      analyzer.lint(code, context).diagnostics.filter((d) => d.ruleId === 'field-validation');

    it('field-validation stays silent on a field under a disabled object', () => {
      const ctx = withDisabled('session');
      expect(diagnosticsFor('source=logs | where session.id = 1', ctx)).toHaveLength(1);
      expect(unknownField('source=logs | where session.id = 1', ctx)).toHaveLength(0);
    });

    it('field-validation stays silent on the disabled object root itself', () => {
      expect(unknownField('source=logs | where session = 1', withDisabled('session'))).toHaveLength(
        0
      );
    });

    it('still reports a genuine unknown field that is not under a disabled object', () => {
      const found = unknownField('source=logs | where nosuchfield = 1', withDisabled('session'));
      expect(found).toHaveLength(1);
      expect(found[0].message).toContain('not defined or recognized in the current schema');
    });

    it('does not suppress a sibling whose name merely shares a prefix', () => {
      // `sessionless` must not be treated as living under `session`; the
      // `root + '.'` boundary is what prevents that.
      const found = unknownField('source=logs | where sessionless = 1', withDisabled('session'));
      expect(found).toHaveLength(1);
    });

    it('reports the field as unknown again when the mapping probe did not resolve', () => {
      // No disabledObjectFields → the suppression cannot apply, so behavior falls
      // back to what it was before this change rather than silently hiding it.
      const found = unknownField('source=logs | where session.id = 1', {
        dataSourceVersion: '3.7.0',
        isCalcite: true,
        fields: new Set(['status']),
      });
      expect(found).toHaveLength(1);
    });
  });

  describe('reported diagnostic', () => {
    it('reports the catalog message, not an interpolated literal', () => {
      const catalogMessage = getBundledCatalog().find((r) => r.id === RULE_ID)?.message;
      const [diagnostic] = diagnosticsFor(
        'source=logs | where session.id = 1',
        withDisabled('session')
      );
      expect(diagnostic.message).toBe(catalogMessage);
    });
  });
});
