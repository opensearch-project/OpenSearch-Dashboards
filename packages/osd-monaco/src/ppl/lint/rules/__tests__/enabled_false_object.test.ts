/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../../ppl_language_analyzer';
import type { LintRunContext } from '../../types';
import { getBundledCatalog } from '../../catalog';

const RULE_ID = 'enabled-false-object';

describe('enabled-false-object', () => {
  let analyzer: PPLLanguageAnalyzer;

  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  const diagnosticsFor = (code: string, context?: LintRunContext) =>
    analyzer.lint(code, context).diagnostics.filter((d) => d.ruleId === RULE_ID);

  const withDisabled = (...names: string[]): LintRunContext => ({
    fields: new Set(['status']),
    disabledObjectFields: new Set(names),
  });

  describe('self-suppression', () => {
    it('does not fire without a disabled-object set', () => {
      expect(diagnosticsFor('source=logs | where session.id = 1')).toHaveLength(0);
    });

    it('does not fire when the disabled-object set is empty', () => {
      expect(
        diagnosticsFor('source=logs | where session.id = 1', {
          disabledObjectFields: new Set<string>(),
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

    it('carries the full path and its enclosing object as hover facts', () => {
      const [diagnostic] = diagnosticsFor(
        'source=logs | where session.id = 1',
        withDisabled('session')
      );
      expect(diagnostic.hoverFacts).toEqual({ field: 'session.id', root: 'session' });
    });
  });
});
