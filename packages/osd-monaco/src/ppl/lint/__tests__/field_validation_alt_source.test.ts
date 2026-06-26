/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLLanguageAnalyzer } from '../../ppl_language_analyzer';
import type { LintRunContext } from '../types';

// Fix 3: field-validation must not flag field references that legitimately
// belong to a different source — join aliases, lookup-table columns, append /
// subsearch inner sources — nor backtick-quoted identifiers. It must still flag
// genuinely unknown fields on the outer source. All assertions run on the
// compiled (simplified-grammar) surface, matching analyzer_lint.test.ts.

describe('field-validation alternate-source suppression (compiled surface)', () => {
  let analyzer: PPLLanguageAnalyzer;

  beforeEach(() => {
    analyzer = new PPLLanguageAnalyzer();
  });

  // The outer source `accounts` exposes exactly these fields.
  const ctx: LintRunContext = {
    fields: new Set<string>(['age', 'response', 'id', 'status', 'name']),
  };

  const fieldDiags = (code: string): string[] =>
    analyzer
      .lint(code, ctx)
      .diagnostics.filter((d) => d.ruleId === 'field-validation')
      .map((d) => d.message);

  describe('join aliases', () => {
    it('does NOT flag a left-alias ref downstream', () => {
      expect(
        fieldDiags(
          'search accounts | join left=l right=r on l.id = r.id departments | where l.response = 200'
        )
      ).toEqual([]);
    });

    it('does NOT flag a right-alias ref downstream', () => {
      expect(
        fieldDiags(
          'search accounts | join left=l right=r on l.id = r.id departments | where r.status = 1'
        )
      ).toEqual([]);
    });

    it('does NOT flag alias refs in the ON clause', () => {
      expect(
        fieldDiags('search accounts | join left=l right=r on l.id = r.id departments')
      ).toEqual([]);
    });

    it('STILL flags a bare unknown field in a join pipeline', () => {
      expect(
        fieldDiags(
          'search accounts | join left=l right=r on l.id = r.id departments | where nope = 1'
        )
      ).toEqual([expect.stringContaining('Unknown field "nope"')]);
    });

    it('STILL flags a dotted ref whose prefix is not a declared alias', () => {
      expect(
        fieldDiags(
          'search accounts | join left=l right=r on l.id = r.id departments | where x.response = 200'
        )
      ).toEqual([expect.stringContaining('Unknown field "x.response"')]);
    });
  });

  describe('alternate-source subtrees', () => {
    it('does NOT flag lookup-table columns', () => {
      expect(fieldDiags('search accounts | lookup departments dept AS d | where age > 1')).toEqual(
        []
      );
    });

    it('does NOT flag fields inside append with its own source', () => {
      expect(
        fieldDiags(
          'search accounts | append [search departments | where really_unknown = 1] | where age > 1'
        )
      ).toEqual([]);
    });

    it('does NOT flag fields inside an IN subsearch', () => {
      expect(
        fieldDiags('search accounts | where status IN [search departments | fields dept_id]')
      ).toEqual([]);
    });

    it('scopes the prune: the same unknown field STILL fires on the outer source', () => {
      // `really_unknown` is suppressed inside the append source above, but a
      // bare reference on the outer `accounts` source must still fire — proving
      // the prune is scoped to the alternate-source subtree, not global.
      expect(fieldDiags('search accounts | where really_unknown = 1')).toEqual([
        expect.stringContaining('Unknown field "really_unknown"'),
      ]);
    });

    it('does NOT leak a field created inside append into the outer known-set', () => {
      // `foo` is created by the eval *inside* the append's own pipeline, so it
      // is not a column on the outer `accounts` source. A downstream reference
      // must still be flagged — the creation must be scoped to its subtree.
      expect(
        fieldDiags('search accounts | append [search dept | eval foo = age] | where foo > 1')
      ).toEqual([expect.stringContaining('Unknown field "foo"')]);
    });

    it('still treats a top-level eval field as known downstream', () => {
      // The mirror case: a top-level eval is NOT inside an alternate source, so
      // its created field stays in the known-set and must not be flagged.
      expect(fieldDiags('search accounts | eval bar = age | where bar > 1')).toEqual([]);
    });
  });

  describe('backtick-quoted identifiers', () => {
    it('does NOT flag a backtick-quoted known field', () => {
      expect(fieldDiags('search accounts | where `age` > 30')).toEqual([]);
    });

    it('STILL flags a backtick-quoted unknown field', () => {
      expect(fieldDiags('search accounts | where `bogus` > 30')).toEqual([
        expect.stringContaining('Unknown field "bogus"'),
      ]);
    });
  });

  // The compiled-simplified grammar mis-parses `source=idx` / `index=idx` into a
  // fieldExpression for the leading `source`/`index` keyword (the runtime grammar
  // parses it as an excluded fromClause). Without a guard this fires a spurious
  // "Unknown field" on EVERY source-first query against a sub-3.6 cluster — the
  // dominant case in the editor's compiled-fallback path.
  describe('source-first keyword is not flagged on the compiled surface', () => {
    it('does NOT flag the `source` keyword in `source=accounts`', () => {
      expect(fieldDiags('source=accounts | where status = 200')).toEqual([]);
    });

    it('does NOT flag the `index` keyword in `index=accounts`', () => {
      expect(fieldDiags('index=accounts | where status = 200')).toEqual([]);
    });

    it('does NOT flag `source` with surrounding spaces', () => {
      expect(fieldDiags('source = accounts | where status = 200')).toEqual([]);
    });

    it('STILL flags a genuinely unknown field on a source-first query', () => {
      expect(fieldDiags('source=accounts | where nope = 1')).toEqual([
        expect.stringContaining('Unknown field "nope"'),
      ]);
    });
  });

  // The eval created-field *name* slot (eval LHS) is protected by createdFields,
  // so the eval RHS must still be walked and validated like a `where` clause — a
  // typo there is a real unknown-field bug. Previously the whole evalClause was
  // excluded by ancestor, hiding the RHS. (Rename fields parse as
  // `wcFieldExpression`, which the existence pass never walks, so rename-source
  // validation is out of scope here — see field_slot_shape's cast-guard block
  // for the createdFields side of this fix.)
  describe('eval RHS scope', () => {
    const scopeCtx: LintRunContext = {
      fields: new Set<string>(['age', 'name', 'response', 'total']),
    };
    const scopeDiags = (code: string): string[] =>
      analyzer
        .lint(code, scopeCtx)
        .diagnostics.filter((d) => d.ruleId === 'field-validation')
        .map((d) => d.message);

    it('flags an unknown field in an eval RHS, not the eval target', () => {
      expect(scopeDiags('source=t | eval x = nonexistent + 1')).toEqual([
        expect.stringContaining('Unknown field "nonexistent"'),
      ]);
    });

    it('flags an unknown field in an eval RHS division', () => {
      expect(scopeDiags('source=t | eval ratio = respose / total')).toEqual([
        expect.stringContaining('Unknown field "respose"'),
      ]);
    });

    it('keeps an eval target known downstream', () => {
      expect(scopeDiags('source=t | eval x = 1 | where x > 0')).toEqual([]);
    });

    it('keeps a stats alias known downstream', () => {
      expect(scopeDiags('source=t | stats avg(age) as avgage | where avgage > 1')).toEqual([]);
    });
  });

  // B2: suggestField must prefer a distance-0 (case-only) match over a
  // distance-1 one seen earlier in the field set — otherwise the quick-fix
  // rewrites the user's case-typo into the *wrong* field.
  describe('suggestion prefers an exact case-insensitive match (B2)', () => {
    // `ages` (distance 1 from `AGE`) is listed before `age` (distance 0) so the
    // old `break` at distance 1 would have returned `ages`.
    const caseCtx: LintRunContext = { fields: new Set<string>(['ages', 'age']) };
    const caseDiags = (code: string): string[] =>
      analyzer
        .lint(code, caseCtx)
        .diagnostics.filter((d) => d.ruleId === 'field-validation')
        .map((d) => d.message);

    it('suggests the exact-but-for-case field, not a distance-1 neighbor', () => {
      expect(caseDiags('search accounts | where AGE > 30')).toEqual([
        'Unknown field "AGE". Did you mean "age"?',
      ]);
    });
  });
});
