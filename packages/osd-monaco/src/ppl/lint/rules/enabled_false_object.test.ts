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
