/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatalogEntry } from '../../types';
import { ExplainPlan } from '../explain_types';
import { runExplainLint, hasExplainRules } from '../run_explain_lint';
import { registerExplainDetector, resetExplainDetectorRegistry } from '../explain_registry';

import filterScript from '../__fixtures__/filter_script.json';
import filterPushed from '../__fixtures__/filter_pushed.json';

function toPlan(payload: { calcite: { logical: string; physical: string } }): ExplainPlan {
  return {
    isCalcite: true,
    physicalText: payload.calcite.physical,
    logicalText: payload.calcite.logical,
  };
}

const TREE_FILTER_SCRIPT_PLAN: ExplainPlan = {
  isCalcite: true,
  physicalTree: {
    rels: [
      {
        relOp: 'CalciteEnumerableIndexScan',
        PushDownContext: ['SCRIPT->>(-($1, 2), 30)'],
        sourceBuilder: { query: { script: { script: { lang: 'opensearch_compounded_script' } } } },
      },
    ],
  },
  logicalTree: { rels: [{ relOp: 'LogicalFilter' }] },
};

// A small catalog covering: a tree rule (must be ignored here), and the two
// explain rules, all enabled so we exercise the run path.
const CATALOG: CatalogEntry[] = [
  {
    id: 'head-without-sort',
    detector: 'head-without-sort',
    enabled: true,
    severity: 'info',
    message: 'tree rule',
    docUrl: 'x',
    appliesTo: {},
  },
  {
    id: 'operation-not-pushed',
    detector: 'operation-not-pushed',
    enabled: true,
    severity: 'warning',
    message: 'fallback',
    docUrl: 'x',
    appliesTo: { minVersion: '3.3.0', engine: 'calcite' },
    needsExplain: true,
  },
  {
    id: 'operation-pushed-as-script',
    detector: 'operation-pushed-as-script',
    enabled: true,
    severity: 'info',
    message: 'fallback',
    docUrl: 'x',
    appliesTo: { minVersion: '3.3.0', engine: 'calcite' },
    needsExplain: true,
  },
];

const BASE = {
  query: 'source=accounts | where age - 2 > 30',
  isCalcite: true,
  dataSourceVersion: '3.7.0',
};

describe('runExplainLint', () => {
  afterEach(() => resetExplainDetectorRegistry());

  it('runs only explain-tagged rules and skips tree rules', () => {
    const diags = runExplainLint(toPlan(filterScript), { ...BASE, catalog: CATALOG });
    const ids = diags.map((d) => d.ruleId);
    expect(ids).toContain('operation-pushed-as-script');
    expect(ids).not.toContain('head-without-sort');
    expect(ids).not.toContain('operation-not-pushed');
  });

  it('runs explain rules against a json_tree plan', () => {
    const diags = runExplainLint(TREE_FILTER_SCRIPT_PLAN, { ...BASE, catalog: CATALOG });
    expect(diags.map((d) => d.ruleId)).toContain('operation-pushed-as-script');
  });

  it('produces no diagnostics for a fully-pushed plan', () => {
    const diags = runExplainLint(toPlan(filterPushed), { ...BASE, catalog: CATALOG });
    expect(diags).toEqual([]);
  });

  it('skips disabled explain rules', () => {
    const disabled = CATALOG.map((c) =>
      c.id === 'operation-pushed-as-script' ? { ...c, enabled: false } : c
    );
    const diags = runExplainLint(toPlan(filterScript), { ...BASE, catalog: disabled });
    expect(diags.map((d) => d.ruleId)).not.toContain('operation-pushed-as-script');
  });

  it('honors per-rule overrides (disable via overrides)', () => {
    const diags = runExplainLint(toPlan(filterScript), {
      ...BASE,
      catalog: CATALOG,
      overrides: { 'operation-pushed-as-script': { enabled: false } },
    });
    expect(diags.map((d) => d.ruleId)).not.toContain('operation-pushed-as-script');
  });

  it('honors a severity override', () => {
    const diags = runExplainLint(toPlan(filterScript), {
      ...BASE,
      catalog: CATALOG,
      overrides: { 'operation-pushed-as-script': { severity: 'warning' } },
    });
    const diag = diags.find((d) => d.ruleId === 'operation-pushed-as-script');
    expect(diag?.severity).toBe('warning');
  });

  it('engine-gates Calcite rules off when the source is not Calcite', () => {
    const diags = runExplainLint(toPlan(filterScript), {
      ...BASE,
      catalog: CATALOG,
      isCalcite: false,
    });
    expect(diags).toEqual([]);
  });

  it('version-gates rules below minVersion', () => {
    const diags = runExplainLint(toPlan(filterScript), {
      ...BASE,
      catalog: CATALOG,
      dataSourceVersion: '3.2.0',
    });
    expect(diags).toEqual([]);
  });

  it.each([undefined, '', 'not-a-version'])(
    'skips explain rules when the data-source version is %p',
    (dataSourceVersion) => {
      const diags = runExplainLint(toPlan(filterScript), {
        ...BASE,
        catalog: CATALOG,
        dataSourceVersion,
      });
      expect(diags).toEqual([]);
    }
  );

  it('isolates a throwing rule without dropping the rest', () => {
    registerExplainDetector('operation-pushed-as-script', () => {
      throw new Error('boom');
    });
    const diags = runExplainLint(toPlan(filterScript), { ...BASE, catalog: CATALOG });
    // The throwing rule is swallowed; no exception bubbles up.
    expect(Array.isArray(diags)).toBe(true);
  });
});

describe('hasExplainRules', () => {
  it('is true when an enabled, applicable explain rule exists', () => {
    expect(hasExplainRules({ catalog: CATALOG, isCalcite: true, dataSourceVersion: '3.7.0' })).toBe(
      true
    );
  });

  it('is false when every explain rule is disabled', () => {
    const disabled = CATALOG.map((c) => (c.needsExplain ? { ...c, enabled: false } : c));
    expect(
      hasExplainRules({ catalog: disabled, isCalcite: true, dataSourceVersion: '3.7.0' })
    ).toBe(false);
  });

  it('is false when the source is not Calcite', () => {
    expect(
      hasExplainRules({ catalog: CATALOG, isCalcite: false, dataSourceVersion: '3.7.0' })
    ).toBe(false);
  });

  it.each([undefined, '', 'not-a-version'])(
    'is false when the data-source version is %p',
    (dataSourceVersion) => {
      expect(hasExplainRules({ catalog: CATALOG, isCalcite: true, dataSourceVersion })).toBe(false);
    }
  );

  it('is false when overrides disable all explain rules', () => {
    expect(
      hasExplainRules({
        catalog: CATALOG,
        isCalcite: true,
        dataSourceVersion: '3.7.0',
        overrides: {
          'operation-not-pushed': { enabled: false },
          'operation-pushed-as-script': { enabled: false },
        },
      })
    ).toBe(false);
  });
});
