/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext, ParseTree } from 'antlr4ng';
import { isRuleNode } from '../rule_index';
import { Diagnostic, DiagnosticRange } from '../diagnostic';
import { findCompiledFieldSlotShapeMatches } from '../field_slot_shape_text';
import { CatalogEntry, Detector, LintRunContext } from '../types';
import { buildPipelineShape, collectAlternateSourceSubtrees } from '../pipeline_shape';
import {
  findAllDescendantsByRule,
  findChildByRule,
  isParserRuleContext,
  RuleNameToIndex,
} from '../rule_index';
import { rangeFromContext } from '../range_utils';
import { nearestWithinThreshold } from '../edit_distance';

/**
 * Documentation links for the field-slot shape pass. The shape finding is about
 * the command's syntax (no Splunk-style `field=`), distinct from the existence
 * pass's "unknown field" link, so it carries its own per-command doc URL.
 */
const SHAPE_DOC_URL: Record<string, string> = {
  grokCommand: 'https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/grok/',
  parseCommand: 'https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/parse/',
  patternsCommand: 'https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/patterns/',
};

// `source` / `index` are the fromClause keywords. The compiled-simplified
// grammar mis-parses `source=idx` into a fieldExpression for the `source`
// keyword (the runtime grammar parses it as an excluded fromClause), so the
// existence pass must skip these to avoid a false "Unknown field" on every
// source-first query against a sub-3.6 cluster.
const SOURCE_KEYWORDS: ReadonlySet<string> = new Set(['source', 'index']);

/** Display keyword for each field-slot command, used in the shape message. */
const SHAPE_COMMAND_KEYWORD: Record<string, string> = {
  grokCommand: 'grok',
  parseCommand: 'parse',
  patternsCommand: 'patterns',
};

// Schema check: a field reference is unknown when it is not in the union of
// index fields and fields created upstream. Self-suppresses without context.

/**
 * Compute a small set of rule indices used to exclude non-field-reference
 * positions — table sources and join structure (`fromClause`, `sideAlias`,
 * `joinCriteria`, etc.). Created-field name slots (eval LHS, rename target) are
 * intentionally *not* listed: those are protected via `createdFields` instead, so
 * the eval/rename RHS is still walked and validated like any other expression.
 */
function resolveExcludedAncestorIndices(ruleNameToIndex: RuleNameToIndex): Set<number> {
  const excluded = new Set<number>();
  for (const name of [
    'fromClause',
    'tableSource',
    'tableSourceClause',
    'tableQualifiedName',
    'sourceReference',
    'sideAlias',
    'joinCriteria',
  ]) {
    const idx = ruleNameToIndex(name);
    if (idx !== -1) {
      excluded.add(idx);
    }
  }
  return excluded;
}

/**
 * Collect join alias names declared in `left=l right=r` (`sideAlias`) clauses.
 * Downstream stages can reference these aliases (`| where l.response = 200`),
 * and the leading segment then names the join side rather than a field on the
 * outer index — so a dotted reference whose prefix matches a declared alias is
 * skipped by field-validation. Returns an empty set when `sideAlias` /
 * `qualifiedName` are absent on the active grammar surface.
 */
function collectJoinAliases(
  tree: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): Set<string> {
  const aliases = new Set<string>();
  const sideAliasNodes = findAllDescendantsByRule(tree, ruleNameToIndex, 'sideAlias');
  for (const sideAlias of sideAliasNodes) {
    // Descendant (not direct-child) search: a `sideAlias` wraps exactly one alias
    // identifier, but the runtime grammar may nest its `qualifiedName` below an
    // intermediate rule. Direct-children-only lookup would then return an empty
    // alias set and false-flag every join-alias ref. `sideAlias` holds a single
    // alias, so descending can't over-collect.
    for (const qn of findAllDescendantsByRule(sideAlias, ruleNameToIndex, 'qualifiedName')) {
      const text = qn.getText();
      if (text) {
        aliases.add(text);
      }
    }
  }
  return aliases;
}

/**
 * Strip a single pair of enclosing backticks from one dotted segment so a
 * backtick-quoted identifier (`` `age` ``) matches the unquoted name in the
 * field set. Applied per segment, so `` a.`b` `` normalizes to `a.b`.
 */
function unquoteIdent(segment: string): string {
  return segment.startsWith('`') && segment.endsWith('`') && segment.length >= 2
    ? segment.slice(1, -1)
    : segment;
}

function hasExcludedAncestor(node: ParserRuleContext, excludedIndices: Set<number>): boolean {
  let current: ParseTree | null = node.parent;
  while (current) {
    if (isRuleNode(current) && excludedIndices.has(current.ruleIndex)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function suggestField(name: string, known: Iterable<string>): string | undefined {
  // Only suggest when reasonably close (≤ 1/3 of the name length, min 2).
  const threshold = Math.max(2, Math.floor(name.length / 3));
  return nearestWithinThreshold(name, known, threshold);
}

/**
 * PASS 2 — existence. Walk every `fieldExpression` and flag references that are
 * neither an index field nor created upstream. Self-suppresses without a field
 * list (R22.3). This is field-validation's original behavior, unchanged.
 */
function detectUnknownFields(
  tree: ParserRuleContext,
  config: CatalogEntry,
  context: LintRunContext,
  ruleNameToIndex: RuleNameToIndex
): Diagnostic[] {
  const fields = context.fields;
  if (!fields || fields.size === 0) {
    return []; // R22.3 self-suppress
  }

  const { createdFields } = buildPipelineShape(tree, ruleNameToIndex);
  // Membership test over the two source sets rather than copying them into one
  // merged set on every keystroke. The suggestion path (cold — only runs once a
  // field is already unknown) materializes the union inline.
  const isKnown = (n: string): boolean => fields.has(n) || createdFields.has(n);
  // The source/index keyword workaround is only needed on the compiled-simplified
  // surface (and the test/fallback path, which has no surface set). On the runtime
  // bundle `source=idx` parses as an excluded fromClause, so a `fieldExpression`
  // whose text is `source`/`index` there is a genuine field reference we must
  // validate. Gate the skip so real fields named `source`/`index` aren't silenced.
  const skipSourceKeywords = context.grammarSurface !== 'runtime-bundle';
  const excludedIndices = resolveExcludedAncestorIndices(ruleNameToIndex);
  const alternateSourceRoots = collectAlternateSourceSubtrees(tree, ruleNameToIndex);
  const joinAliases = collectJoinAliases(tree, ruleNameToIndex);
  const fieldExprIdx = ruleNameToIndex('fieldExpression');
  if (fieldExprIdx === -1) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const seen = new Set<string>();

  const stack: ParseTree[] = [tree];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node === undefined || !isParserRuleContext(node)) {
      continue;
    }
    // Hard prune: alternate-source subtree roots (lookup / append-with-source /
    // subsearch / union). Their field refs belong to a different source, so we
    // skip the whole subtree without pushing children.
    if (alternateSourceRoots.has(node)) {
      continue;
    }
    if (node.ruleIndex === fieldExprIdx) {
      const raw = node.getText();
      // Normalize backtick-quoted segments per dotted part so `` `age` ``
      // matches the unquoted `age` in the field set.
      const name = raw.split('.').map(unquoteIdent).join('.');
      // On the compiled-simplified surface, `source=idx` / `index=idx` parses the
      // leading `source`/`index` keyword into a fieldExpression (the runtime
      // grammar instead parses it as an excluded fromClause). Skip that keyword
      // so sub-3.6 clusters don't get a spurious "Unknown field" on every query.
      if (skipSourceKeywords && SOURCE_KEYWORDS.has(name.toLowerCase())) {
        continue;
      }
      const prefix = name.includes('.') ? name.split('.')[0] : null;
      // Soft skip: alias-qualified refs (`l.response` where `l` is a declared
      // join alias). Still descend into children — alias-qualified refs appear
      // in downstream pipeline stages outside the alternate-source regions.
      if (prefix !== null && joinAliases.has(prefix)) {
        // Push children reversed so they pop (LIFO) in source order — the first
        // duplicate of a field is then flagged, not the last (B6).
        const aliasChildren = node.children ?? [];
        for (let i = aliasChildren.length - 1; i >= 0; i--) {
          stack.push(aliasChildren[i]);
        }
        continue;
      }
      // Dot-qualified references: validate only the leaf for join contexts is
      // complex; v1 validates the full text and the leading segment.
      const leaf = prefix ?? name;
      if (
        name &&
        !hasExcludedAncestor(node, excludedIndices) &&
        !isKnown(name) &&
        !isKnown(leaf) &&
        !seen.has(name)
      ) {
        seen.add(name);
        const suggestion = suggestField(name, [...fields, ...createdFields]);
        const suffix = suggestion ? ` Did you mean "${suggestion}"?` : '';
        diagnostics.push({
          ruleId: config.id,
          severity: config.severity,
          message: `Unknown field "${name}".${suffix}`,
          range: rangeFromContext(node),
          docUrl: config.docUrl,
          hoverFacts: { field: name, ...(suggestion ? { suggestion } : {}) },
          // The diagnostic range spans exactly the field reference, so the fix
          // replaces it in place (no explicit fix range needed).
          ...(suggestion
            ? { fix: { title: `Replace with "${suggestion}"`, text: suggestion } }
            : {}),
        });
      }
    }
    // Push children reversed so they pop (LIFO) in source order, so the first
    // occurrence of a duplicate field is the one flagged (B6).
    const children = node.children ?? [];
    for (let i = children.length - 1; i >= 0; i--) {
      stack.push(children[i]);
    }
  }

  return diagnostics;
}

/**
 * Right-hand side of an `=`/`==` comparison inside a field slot — the bare field
 * the user almost certainly meant when they wrote Splunk-style `grok field=body`
 * (the fix rewrites it to `grok body`). Returns undefined unless the expression
 * contains exactly that shape:
 *  - It must be an equality (`=` or `==`); other operators (`>`, `<`, `like`)
 *    are genuine comparisons with ambiguous intent and get no fix.
 *  - The right operand is read from the comparison node's children *after* the
 *    operator, which works across surfaces: on the runtime bundle the operator
 *    sits under `comparisonExpression` with `valueExpression` operands; on the
 *    simplified surface it sits directly under `expression`.
 */
function equalsRhs(
  expression: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): string | undefined {
  const opIdx = ruleNameToIndex('comparisonOperator');
  if (opIdx === -1) {
    return undefined;
  }
  const operators = findAllDescendantsByRule(expression, ruleNameToIndex, 'comparisonOperator');
  // Only a single equality comparison is the unambiguous `field=value` typo.
  if (operators.length !== 1) {
    return undefined;
  }
  const operator = operators[0];
  const opText = operator.getText();
  if (opText !== '=' && opText !== '==') {
    return undefined;
  }
  const parent = operator.parent;
  if (!isRuleNode(parent)) {
    return undefined;
  }
  const siblings = parent.children ?? [];
  const opPos = siblings.indexOf(operator);
  if (opPos === -1 || opPos === siblings.length - 1) {
    return undefined;
  }
  const rhs = siblings
    .slice(opPos + 1)
    .map((c) => (c as ParseTree).getText())
    .join('');
  return rhs.length > 0 ? rhs : undefined;
}

/**
 * PASS 1 — field-slot shape. The `grok`/`parse`/`patterns` commands take a bare
 * field name in their `source_field` slot, but the grammar types that slot as a
 * full `expression`, so Splunk-style `grok field=body "..."` parses cleanly and
 * fails only at engine time ("Field [field] not found"). This pass flags any
 * `source_field` expression that is not a bare field reference.
 *
 * The classification mirrors the engine's own acceptance: a slot is OK iff its
 * expression collapses to a single `fieldExpression` whose text equals the whole
 * expression (a bare field, dotted paths included). A `comparisonOperator`,
 * `literalValue`, or a wrapped/multi-field expression is flagged. An expression
 * with no field/literal/operator structure at all is the simplified-grammar
 * error-recovery shape — left to the syntax channel (see the surface gate in
 * `fieldValidationDetector`).
 */
function detectFieldSlotShape(
  tree: ParserRuleContext,
  config: CatalogEntry,
  ruleNameToIndex: RuleNameToIndex
): Diagnostic[] {
  const exprIdx = ruleNameToIndex('expression');
  const fieldExprIdx = ruleNameToIndex('fieldExpression');
  // `expression` and `fieldExpression` exist on every surface; if either is
  // absent the surface is one this pass was never designed for — no-op.
  if (exprIdx === -1 || fieldExprIdx === -1) {
    return [];
  }
  const opIdx = ruleNameToIndex('comparisonOperator');
  const litIdx = ruleNameToIndex('literalValue');

  const diagnostics: Diagnostic[] = [];

  for (const commandName of ['grokCommand', 'parseCommand', 'patternsCommand']) {
    for (const command of findAllDescendantsByRule(tree, ruleNameToIndex, commandName)) {
      const expression = findChildByRule(command, ruleNameToIndex, 'expression');
      if (!expression) {
        continue;
      }

      const fieldExprs = findAllDescendantsByRule(expression, ruleNameToIndex, 'fieldExpression');
      const hasComparison =
        opIdx !== -1 &&
        findAllDescendantsByRule(expression, ruleNameToIndex, 'comparisonOperator').length > 0;
      const hasLiteral =
        litIdx !== -1 &&
        findAllDescendantsByRule(expression, ruleNameToIndex, 'literalValue').length > 0;

      // Bare field reference: exactly one fieldExpression spanning the whole
      // expression. This is the only accepted shape.
      const isBareField =
        fieldExprs.length === 1 &&
        !hasComparison &&
        !hasLiteral &&
        fieldExprs[0].getText() === expression.getText();
      if (isBareField) {
        continue;
      }

      // No field/literal/comparison structure at all → the parser error-
      // recovered (simplified surface). Leave it to the syntax channel.
      if (fieldExprs.length === 0 && !hasComparison && !hasLiteral) {
        continue;
      }

      const keyword = SHAPE_COMMAND_KEYWORD[commandName] ?? commandName;
      // The `field=value` shape is the Splunk-habit typo: an equality whose
      // right-hand side is the field the user meant. Offer a one-click rewrite
      // to the bare field. Other flagged shapes (literals, wrapped/arithmetic
      // expressions, non-equality comparisons) have ambiguous intent, so they
      // get a message but no fix.
      const rhs = hasComparison ? equalsRhs(expression, ruleNameToIndex) : undefined;

      diagnostics.push({
        ruleId: config.id,
        // A rule has one catalog entry and one user-facing severity toggle; the
        // shape pass must honor it rather than forcing `error`, or a user who
        // sets field-validation to `warning` still sees red from this pass.
        severity: config.severity,
        // The message is deliberately generic: this pass flags any non-bare-field
        // shape (literal, arithmetic, or any comparison — not only `field=`), so a
        // Splunk-specific message would misdescribe the `... > 1` / `... = x` cases.
        message: `${keyword} expects a field name here, not an expression.`,
        range: rangeFromContext(expression),
        docUrl: SHAPE_DOC_URL[commandName] ?? config.docUrl,
        hoverFacts: { field: expression.getText() },
        ...(rhs ? { fix: { title: `Remove "field=" (use "${rhs}")`, text: rhs } } : {}),
      });
    }
  }

  return diagnostics;
}

/**
 * Compiled-surface counterpart to `detectFieldSlotShape`. On the simplified
 * grammar `grok field=body` error-recovers and can't be recognized off the
 * parse tree, so scan the raw source text for exactly that one backend-accepted
 * typo. Fires only when `sourceText` is present (the analyzer sets it).
 */
function detectCompiledFieldSlotShape(
  sourceText: string | undefined,
  config: CatalogEntry
): Diagnostic[] {
  if (!sourceText) {
    return [];
  }

  return findCompiledFieldSlotShapeMatches(sourceText).map((match) => ({
    ruleId: config.id,
    // Honor the rule's single severity toggle (catalog default is `error`),
    // matching the runtime shape pass — not a hard-coded `error` — so a user who
    // downgrades field-validation to `warning` sees it consistently on both
    // grammar surfaces.
    severity: config.severity,
    // Same generic wording as the runtime shape pass. It flags any non-bare-field
    // shape, so it avoids a Splunk-specific message.
    message: `${match.keyword} expects a field name here, not an expression.`,
    range: match.range,
    docUrl: SHAPE_DOC_URL[match.commandName] ?? config.docUrl,
    hoverFacts: { field: match.expressionText },
    ...(match.replacement
      ? {
          fix: {
            title: `Remove "field=" (use "${match.replacement}")`,
            text: match.replacement,
          },
        }
      : {}),
  }));
}

/**
 * Does `inner` fall entirely within `outer` (same or tighter span)? Used to drop
 * an existence finding that the shape pass already covers — e.g. on
 * `grok field=body`, the existence pass would otherwise also flag the misparsed
 * `field` as an unknown field. Both ranges use the same 1-based-line /
 * 0-based-column convention.
 */
function rangeContains(outer: DiagnosticRange, inner: DiagnosticRange): boolean {
  const startsAfter =
    inner.startLine > outer.startLine ||
    (inner.startLine === outer.startLine && inner.startColumn >= outer.startColumn);
  const endsBefore =
    inner.endLine < outer.endLine ||
    (inner.endLine === outer.endLine && inner.endColumn <= outer.endColumn);
  return startsAfter && endsBefore;
}

/**
 * PASS 3 — internal overlap suppression. Drop any existence (warning) finding
 * whose range is contained within a shape (error) finding's range, so a single
 * `grok field=body` surfaces one actionable error rather than a confusing
 * error + "Unknown field 'field'" pair. Shape findings are always kept.
 */
function suppressContained(
  shapeDiagnostics: Diagnostic[],
  existenceDiagnostics: Diagnostic[]
): Diagnostic[] {
  if (shapeDiagnostics.length === 0) {
    return existenceDiagnostics;
  }
  const survivingExistence = existenceDiagnostics.filter(
    (existence) => !shapeDiagnostics.some((shape) => rangeContains(shape.range, existence.range))
  );
  return [...shapeDiagnostics, ...survivingExistence];
}

/**
 * field-validation is a merged detector with two independent passes:
 *  - PASS 1 (shape): grok/parse/patterns field-slot must be a bare field, not a
 *    Splunk-style `field=` expression. Emits `error`. Deferred on the simplified
 *    grammar surface, where the same input is already a syntax error.
 *  - PASS 2 (existence): a referenced field must exist on the source. Emits
 *    `warning` (the catalog nominal). Self-gates on an empty field list.
 * PASS 3 suppresses an existence finding the shape pass already covers.
 */
export const fieldValidationDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  // PASS 1 — shape. Needs no field list. On the runtime bundle read it off the
  // parse tree; on the compiled-simplified surface the same input error-recovers
  // and can't be read off the tree, so scan the source text for the one
  // backend-accepted `field=` typo instead. Callers that declare no surface
  // (unit tests, older callers) fall through to the tree-based pass.
  const shapeDiagnostics =
    context.grammarSurface === 'compiled-simplified'
      ? detectCompiledFieldSlotShape(context.sourceText, config)
      : detectFieldSlotShape(tree, config, ruleNameToIndex);

  // PASS 2 — existence (self-gates on empty fields).
  const existenceDiagnostics = detectUnknownFields(tree, config, context, ruleNameToIndex);

  // PASS 3 — drop existence findings the shape pass already covers.
  return suppressContained(shapeDiagnostics, existenceDiagnostics);
};
