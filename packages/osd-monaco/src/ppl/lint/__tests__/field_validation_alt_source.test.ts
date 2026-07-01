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

  // ─── Extraction-command created fields ───────────────────────────────────────

  describe('capture-pattern extraction (grok/parse/rex)', () => {
    // --- POSITIVE: extracted field resolves downstream ---

    it('grok: extracted field used in WHERE is not flagged', () => {
      expect(
        fieldDiags('search accounts | grok status "%{NUMBER:duration}" | where duration > 5')
      ).toEqual([]);
    });

    it('grok: underscore in semantic name resolves correctly', () => {
      expect(
        fieldDiags('search accounts | grok status "%{IP:client_ip}" | where client_ip = "1.2.3.4"')
      ).toEqual([]);
    });

    it('grok: multiple captures all resolve downstream', () => {
      expect(
        fieldDiags(
          'search accounts | grok status "%{IP:src_ip} %{NUMBER:port}" | where src_ip = "x" | where port > 0'
        )
      ).toEqual([]);
    });

    it('parse: Java named group resolves in WHERE', () => {
      expect(
        fieldDiags('search accounts | parse name "(?<firstWord>\\\\w+)" | where firstWord = "x"')
      ).toEqual([]);
    });

    it('parse: Python (?P<name>) opener resolves', () => {
      expect(
        fieldDiags('search accounts | parse name "(?P<token>\\\\w+)" | where token = "x"')
      ).toEqual([]);
    });

    it('rex: extracted field resolves in STATS BY', () => {
      expect(
        fieldDiags(
          'search accounts | rex field=name "(?<firstWord>\\\\w+)" | stats count() by firstWord'
        )
      ).toEqual([]);
    });

    it('extracted field used in arithmetic expression resolves', () => {
      expect(
        fieldDiags('search accounts | grok status "%{NUMBER:latency}" | where latency + 1 > 100')
      ).toEqual([]);
    });

    // --- NEGATIVE: things that SHOULD still be flagged ---

    it('STILL flags an unknown grok SOURCE field', () => {
      expect(
        fieldDiags('search accounts | grok nope "%{NUMBER:duration}" | where duration > 5')
      ).toEqual([expect.stringContaining('Unknown field "nope"')]);
    });

    it('STILL flags an unknown parse SOURCE field', () => {
      expect(fieldDiags('search accounts | parse nope "(?<x>\\\\w+)" | where x = "y"')).toEqual([
        expect.stringContaining('Unknown field "nope"'),
      ]);
    });

    it('invalid Java group name is NOT registered — downstream typo still flagged', () => {
      // `user_id` is an invalid Java group name (underscore) — the engine
      // never creates it, so `bogus` should still be caught.
      expect(
        fieldDiags('search accounts | parse name "(?<user_id>\\\\d+)" | where bogus = 1')
      ).toEqual([expect.stringContaining('Unknown field "bogus"')]);
    });

    it('grok with no captures (%{SYNTAX} without colon) registers nothing', () => {
      expect(fieldDiags('search accounts | grok status "%{NUMBER}" | where bogus > 5')).toEqual([
        expect.stringContaining('Unknown field "bogus"'),
      ]);
    });
  });

  describe('named-slot extraction (patterns/spath)', () => {
    // --- POSITIVE: output field resolves ---

    it('patterns NEW_FIELD output resolves in WHERE', () => {
      expect(
        fieldDiags('search accounts | patterns name NEW_FIELD=\'tpl\' | where tpl = "x"')
      ).toEqual([]);
    });

    it('patterns_field ALSO resolves even when NEW_FIELD is set (3.6 ignores NEW_FIELD)', () => {
      // The 3.6 runtime engine ignores NEW_FIELD and always emits
      // `patterns_field`, while Calcite 2.19 honors NEW_FIELD. Registering both
      // keeps the linter correct regardless of the target engine version.
      expect(
        fieldDiags('search accounts | patterns name NEW_FIELD=\'tpl\' | where patterns_field = "x"')
      ).toEqual([]);
    });

    it('patterns default output field resolves when NEW_FIELD omitted', () => {
      expect(fieldDiags('search accounts | patterns name | where patterns_field = "x"')).toEqual(
        []
      );
    });

    it('patterns companion `tokens` column resolves downstream', () => {
      expect(
        fieldDiags("search accounts | patterns name NEW_FIELD='tpl' | stats count() by tokens")
      ).toEqual([]);
    });

    it('spath OUTPUT field resolves in WHERE', () => {
      expect(
        fieldDiags('search accounts | spath input=name output=parsed | where parsed = "x"')
      ).toEqual([]);
    });

    it('spath OUTPUT field NOT double-flagged at its declaration site', () => {
      expect(fieldDiags('search accounts | spath input=name output=parsed')).toEqual([]);
    });

    it('spath with PATH (no OUTPUT) derives field from path text', () => {
      expect(
        fieldDiags('search accounts | spath input=name path=address | where address = "x"')
      ).toEqual([]);
    });

    // --- NEGATIVE: source still validated ---

    it('STILL flags an unknown spath INPUT (source) field', () => {
      expect(fieldDiags('search accounts | spath input=nope output=parsed')).toEqual([
        expect.stringContaining('Unknown field "nope"'),
      ]);
    });

    it('STILL flags unrelated unknown fields after extraction', () => {
      expect(
        fieldDiags('search accounts | grok status "%{NUMBER:duration}" | where bogus > 5')
      ).toEqual([expect.stringContaining('Unknown field "bogus"')]);
    });
  });

  describe('extraction + alternate-source scoping', () => {
    // pr4 scopes collectCreatedFields to non-alt-source stages, so a field
    // extracted inside an `append [search ...]` subquery must NOT leak into the
    // outer known-field set. Referencing it in the outer pipeline is a real
    // unknown-field bug and must still be flagged. (On the flat poc-v3 collector
    // this leaks and is a false negative — this test is the reason the pr4 port
    // is strictly more correct.)
    it('does NOT leak a grok field from inside append into the outer scope', () => {
      expect(
        fieldDiags(
          'search accounts | append [search logs | grok status "%{NUMBER:dur}"] | where dur > 1'
        )
      ).toEqual([expect.stringContaining('Unknown field "dur"')]);
    });

    it('an outer-pipeline extraction still resolves normally', () => {
      expect(
        fieldDiags(
          'search accounts | append [search logs | where status > 1] | grok status "%{NUMBER:dur}" | where dur > 1'
        )
      ).toEqual([]);
    });

    it('extraction after a join still resolves (no interference)', () => {
      expect(
        fieldDiags(
          'search accounts | join left=l right=r on l.id = r.id departments | grok status "%{NUMBER:dur}" | where dur > 5'
        )
      ).toEqual([]);
    });
  });
});
