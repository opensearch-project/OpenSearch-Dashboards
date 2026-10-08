/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllDescendantsByRule, findChildByRule, RuleNameToIndex } from '../rule_index';
import { collectAlternateSourceSubtrees } from '../pipeline_shape';
import { rangeFromContext } from '../range_utils';

// Advisory (no engine throw): `rex`, `parse`, and `grok` extract new fields by
// running a pattern over a source field for every input row. When that source
// field is a `text` mapping, the engine loads `_source`, decompresses, and
// evaluates the pattern per document — the dominant cost called out in the
// pattern-prefilter RFC (opensearch-project/sql#5608, perf idea #1). This rule
// surfaces that cost so a user can consider a selective prefilter or a
// purpose-built field.
//
// It is deliberately advisory-only, `info` severity, and ships disabled: the
// linter cannot safely rewrite the query. `rex`/`parse`/`grok` are row-preserving
// (planned as a Calcite Project, not a Filter — CalciteRelNodeVisitor.java:426,
// :374, :1060/:4473), so a non-matching document is kept with a null/empty
// extracted value. Inserting a `where <source> like '%literal%'` before the
// extraction would delete those rows, which is a result change, not an
// optimization. The transparent optimization belongs in the engine; the linter
// only educates. See ppl-lint-rex-prefilter-design.md.
//
// Grammar anchors:
//   rexCommand   : REX rexExpr
//   rexExpr      : FIELD EQUAL field=qualifiedName (rexOption)* pattern=stringLiteral (rexOption)*
//   grokCommand  : GROK (source_field = expression) (pattern = stringLiteral)
//   parseCommand : PARSE (source_field = expression) (pattern = stringLiteral)
// `rex` exists only on the simplified (compiled) surface; `parse`/`grok` exist on
// both. A command absent on the active surface resolves to -1 and no-ops.

// Catalogued `sourceScoped`: `typeMap` describes the selected dataset's mapping,
// so an explicit `source=` naming a different index would have the source field's
// type read from the wrong mapping — flagging a scan cost on a field that is not
// `text` there, or missing one that is.
//
// esTypes for which extraction incurs the analyzed-text scan cost this rule is
// about. `keyword` is deliberately excluded: its cost profile differs (whole-
// value, doc-values backed) and folding it in would dilute the message. See
// open question 2 in the design doc.
const TEXT_TYPES: ReadonlySet<string> = new Set(['text']);

interface ExtractionCommand {
  /** grammar rule name of the command node. */
  rule: string;
  /** display keyword used in the message. */
  keyword: string;
  /** resolve the bare source-field name for one command node, or undefined. */
  sourceField: (command: ParserRuleContext, ruleNameToIndex: RuleNameToIndex) => string | undefined;
}

/**
 * `rex`'s source field is `FIELD EQUAL field=qualifiedName` inside `rexExpr`.
 * The `qualifiedName` we want is `rexExpr`'s direct child; a `rexOption`'s
 * `offsetField=qualifiedName` is nested one level deeper (under `rexOption`), so
 * `findChildByRule` on `rexExpr` returns the source field and never the option.
 */
function rexSourceField(
  command: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): string | undefined {
  const rexExpr = findChildByRule(command, ruleNameToIndex, 'rexExpr');
  if (!rexExpr) {
    return undefined;
  }
  const field = findChildByRule(rexExpr, ruleNameToIndex, 'qualifiedName');
  return field?.getText();
}

/**
 * `parse`/`grok` take a bare field in their `source_field = expression` slot.
 * Only a genuine bare field is resolved: exactly one `fieldExpression` spanning
 * the whole expression. A `field=body` Splunk-style typo or a wrapped/computed
 * expression is left alone — that shape is field-validation's concern, and the
 * source type is not a plain field lookup there.
 */
function bareFieldSource(
  command: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): string | undefined {
  const expression = findChildByRule(command, ruleNameToIndex, 'expression');
  if (!expression) {
    return undefined;
  }
  const fieldExprs = findAllDescendantsByRule(expression, ruleNameToIndex, 'fieldExpression');
  if (fieldExprs.length !== 1 || fieldExprs[0].getText() !== expression.getText()) {
    return undefined;
  }
  return fieldExprs[0].getText();
}

const EXTRACTION_COMMANDS: readonly ExtractionCommand[] = [
  { rule: 'rexCommand', keyword: 'rex', sourceField: rexSourceField },
  { rule: 'parseCommand', keyword: 'parse', sourceField: bareFieldSource },
  { rule: 'grokCommand', keyword: 'grok', sourceField: bareFieldSource },
];

// Simplified card message: a short, field-personalized cost heads-up. The
// actionable guidance (pre-filter before extraction) lives on the catalog
// `howToFix` line rather than being spelled out inline, matching the other
// rules' hover cards.
function scanCostMessage(keyword: string, field: string): string {
  return `${keyword} runs the pattern against every input row from text field "${field}", even when it finds no match.`;
}

export const rexScanCostDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  const typeMap = context.typeMap;
  if (!typeMap) {
    return []; // self-suppress without type metadata (Bucket-B)
  }

  // The outer index's typeMap does not apply inside lookup / append-with-source
  // / subsearch / join-right / union subtrees, so an extraction there could be
  // over a field of a different source. Prune those subtrees, mirroring
  // field-validation.
  const alternateSourceRoots = collectAlternateSourceSubtrees(tree, ruleNameToIndex);
  const isInsideAlternateSource = (node: ParserRuleContext): boolean => {
    for (let n: ParserRuleContext | null = node; n; n = n.parent as ParserRuleContext | null) {
      if (alternateSourceRoots.has(n)) {
        return true;
      }
    }
    return false;
  };

  const diagnostics: Diagnostic[] = [];

  for (const { rule, keyword, sourceField } of EXTRACTION_COMMANDS) {
    for (const command of findAllDescendantsByRule(tree, ruleNameToIndex, rule)) {
      if (isInsideAlternateSource(command)) {
        continue;
      }
      const field = sourceField(command, ruleNameToIndex);
      if (field === undefined) {
        continue;
      }
      const esType = typeMap.get(field);
      if (esType === undefined || !TEXT_TYPES.has(esType)) {
        continue;
      }
      diagnostics.push({
        ruleId: config.id,
        severity: config.severity,
        message: scanCostMessage(keyword, field),
        range: rangeFromContext(command),
        docUrl: config.docUrl,
      });
    }
  }

  return diagnostics;
};
