/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext, ParseTree } from 'antlr4ng';
import {
  isRuleNode,
  isTerminalNode,
  findAllDescendantsByRule,
  findChildByRule,
} from './rule_index';
import { RuleNameToIndex } from './rule_index';
import { extractCreatedFieldNames } from './pattern_fields';
import { normalizeFieldName } from './field_path';

export interface PipelineStage {
  command: string;
  node: ParserRuleContext;
}

export interface PipelineShape {
  // Command stages in pipe (source) order.
  stages: PipelineStage[];
  // Field names created upstream in the pipeline.
  createdFields: Set<string>;
}

const COMMAND_RULE_NAMES = [
  'searchCommand',
  'whereCommand',
  'fieldsCommand',
  'tableCommand',
  'joinCommand',
  'renameCommand',
  'statsCommand',
  'eventstatsCommand',
  'streamstatsCommand',
  'dedupCommand',
  'sortCommand',
  'evalCommand',
  'headCommand',
  'binCommand',
  'topCommand',
  'rareCommand',
  'grokCommand',
  'parseCommand',
  'spathCommand',
  'patternsCommand',
  'lookupCommand',
  'fillnullCommand',
  'trendlineCommand',
  'appendcolCommand',
  'appendCommand',
  'expandCommand',
  'flattenCommand',
  'reverseCommand',
  'regexCommand',
  'timechartCommand',
  'rexCommand',
  'replaceCommand',
  'unionCommand',
  'multisearchCommand',
];

function buildIndexToCommandName(ruleNameToIndex: RuleNameToIndex): Map<number, string> {
  const map = new Map<number, string>();
  for (const name of COMMAND_RULE_NAMES) {
    const idx = ruleNameToIndex(name);
    if (idx !== -1) {
      map.set(idx, name);
    }
  }
  return map;
}

// Default output field name `patterns` uses when NEW_FIELD is omitted.
const PATTERNS_DEFAULT_FIELD = 'patterns_field';

// `patterns` also emits a companion `tokens` struct column alongside its main
// output field (confirmed against the live Calcite 2.19 engine). Register it so
// a downstream reference to `tokens` isn't false-flagged.
const PATTERNS_TOKENS_FIELD = 'tokens';

function unquote(raw: string): string {
  return raw.length >= 2 && /^['"]/.test(raw) && raw[0] === raw[raw.length - 1]
    ? raw.slice(1, -1)
    : raw;
}

/**
 * Value of a named-slot parameter: find the terminal matching `keyword`, then
 * return the text of the first rule-node sibling after it. Used to read
 * `NEW_FIELD = <literal>` (patterns) and `OUTPUT = <expr>` (spath).
 */
function findSlotValueAfterKeyword(node: ParserRuleContext, keyword: string): string | undefined {
  const stack: ParseTree[] = [node];
  while (stack.length > 0) {
    const n = stack.pop()!;
    if (!isRuleNode(n)) continue;
    const children = n.children ?? [];
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (isTerminalNode(c) && c.getText().toUpperCase() === keyword) {
        for (let j = i + 1; j < children.length; j++) {
          const v = children[j];
          if (isRuleNode(v)) return v.getText();
        }
      }
    }
    stack.push(...children);
  }
  return undefined;
}

// Collect created field names from a single command node. Best-effort: it scans
// for `... AS <name>` patterns and known LHS positions (eval clause).
function collectCreatedFields(
  stage: PipelineStage,
  ruleNameToIndex: RuleNameToIndex,
  out: Set<string>
): void {
  // Walk descendants looking for an `AS` terminal followed by a name node.
  // `cast(field AS int)` also has an `AS` terminal, but the node after it is the
  // target type (a `convertedDataType`), not a created field — skip those so a
  // type name like `int` never pollutes the known-field set.
  const convertedTypeIdx = ruleNameToIndex('convertedDataType');
  // Not every `AS` introduces a field. `join departments AS d` binds `d` as a
  // *table* alias (the `AS` sits under `tableSourceClause`), not a column on the
  // outer source. Registering it would silently expand the known-field set and
  // could mask a real unknown-field warning on a downstream field named `d`.
  // Skip an `AS` whose immediate container is a table/source-alias context —
  // the same vocabulary field_validation excludes from the existence pass.
  const aliasContextIdx = new Set(
    ['tableSourceClause', 'tableSource', 'tableQualifiedName', 'sourceReference', 'sideAlias']
      .map(ruleNameToIndex)
      .filter((idx) => idx !== -1)
  );
  const stack: ParseTree[] = [stage.node];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node === undefined || !isRuleNode(node)) {
      continue;
    }
    const children = node.children ?? [];
    // A table/source-alias `AS` (join alias) names a table, not a field — skip
    // the whole container so its alias never enters the created-field set.
    const isAliasContext = aliasContextIdx.has(node.ruleIndex);
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (isTerminalNode(child) && child.getText().toLowerCase() === 'as') {
        const next = children[i + 1];
        if (isRuleNode(next) && next.ruleIndex !== convertedTypeIdx && !isAliasContext) {
          const name = normalizeFieldName(next.getText());
          if (name) {
            out.add(name);
          }
        }
      }
    }

    stack.push(...children);
  }

  // eval LHS names: evalClause's first fieldExpression child.
  const fieldExprIdx = ruleNameToIndex('fieldExpression');
  const evalClauseIdx = ruleNameToIndex('evalClause');
  if (evalClauseIdx !== -1) {
    const evalStack: ParseTree[] = [stage.node];
    while (evalStack.length > 0) {
      const node = evalStack.pop();
      if (node === undefined || !isRuleNode(node)) {
        continue;
      }
      if (node.ruleIndex === evalClauseIdx) {
        const first = (node.children ?? []).find(
          (c) => isRuleNode(c) && c.ruleIndex === fieldExprIdx
        ) as ParserRuleContext | undefined;
        if (first) {
          const name = normalizeFieldName(first.getText());
          if (name) {
            out.add(name);
          }
        }
      }
      evalStack.push(...(node.children ?? []));
    }
  }

  // (a) Capture-pattern extraction: grok / parse / rex. The created names live
  // inside the pattern string literal, which the AS/eval scans never descend
  // into. grok/parse type the pattern as the last stringLiteral in the command;
  // rex has a single stringLiteral (its pattern). Picking the last-starting
  // literal is correct for all three.
  if (
    stage.command === 'grokCommand' ||
    stage.command === 'parseCommand' ||
    stage.command === 'rexCommand'
  ) {
    const literals = findAllDescendantsByRule(stage.node, ruleNameToIndex, 'stringLiteral');
    let pattern: ParserRuleContext | undefined;
    for (const lit of literals) {
      if (!pattern || (lit.start?.start ?? -1) > (pattern.start?.start ?? -1)) {
        pattern = lit;
      }
    }
    if (pattern) {
      for (const name of extractCreatedFieldNames(pattern.getText())) {
        out.add(name);
      }
    }
  }

  // (b) Named-slot extraction: patterns. Engine versions disagree on the output
  // name: the Calcite 2.19 engine honors `NEW_FIELD='x'` (output column `x`) and
  // also emits a companion `tokens` struct; the 3.6 runtime engine ignores
  // NEW_FIELD entirely and always names the column `patterns_field` (no
  // `tokens`). Both behaviors were confirmed live. Since over-registering a
  // created field only risks missing a rare typo while under-registering causes
  // a false "unknown field" flag, register the union: the explicit NEW_FIELD
  // name (when present), the default `patterns_field`, and `tokens`.
  if (stage.command === 'patternsCommand') {
    const newFieldLit = findSlotValueAfterKeyword(stage.node, 'NEW_FIELD');
    if (newFieldLit) {
      out.add(unquote(newFieldLit));
    }
    out.add(PATTERNS_DEFAULT_FIELD);
    out.add(PATTERNS_TOKENS_FIELD);
  }

  // (c) Named-slot extraction: spath. Each spathParameter either names its
  // output via `OUTPUT = <name>` or, absent that, derives the field from the
  // indexable path text. `INPUT` is deliberately left unregistered so the
  // source field is still validated.
  if (stage.command === 'spathCommand') {
    for (const param of findAllDescendantsByRule(stage.node, ruleNameToIndex, 'spathParameter')) {
      const output = findSlotValueAfterKeyword(param, 'OUTPUT');
      if (output) {
        // OUTPUT is either a `'`/`"`-wrapped string literal or a bare/backtick
        // ident. Strip exactly one enclosing pair per form so it matches a bare
        // downstream reference — never both, or a name with embedded quotes
        // (`output="'x'"`) would over-strip and no longer match `` `'x'` ``.
        const first = output[0];
        out.add(first === "'" || first === '"' ? unquote(output) : normalizeFieldName(output));
        continue;
      }
      const path = findChildByRule(param, ruleNameToIndex, 'indexablePath');
      if (path) {
        out.add(normalizeFieldName(path.getText()));
      }
    }
  }
}

export function buildPipelineShape(
  tree: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): PipelineShape {
  const indexToCommand = buildIndexToCommandName(ruleNameToIndex);
  const stages: PipelineStage[] = [];
  const createdFields = new Set<string>();

  const visit = (node: ParseTree): void => {
    if (isRuleNode(node)) {
      const commandName = indexToCommand.get(node.ruleIndex);
      if (commandName) {
        stages.push({ command: commandName, node });
      }
      const children = node.children ?? [];
      for (const child of children) {
        visit(child);
      }
    }
  };
  visit(tree);

  // Fields created inside an alternate-source subtree (`append [search ...]`,
  // subsearch, lookup, appendcol, union) belong to that other source, not the
  // outer pipeline — so they must not leak into the outer known-field set.
  // `stages` is left intact (head_without_sort runs its own alt-source check on
  // it); only the created-field collection is scoped.
  const altSourceRoots = collectAlternateSourceSubtrees(tree, ruleNameToIndex);
  for (const stage of stages) {
    if (!isInsideAltSource(stage.node, altSourceRoots)) {
      collectCreatedFields(stage, ruleNameToIndex, createdFields);
    }
  }

  return { stages, createdFields };
}

/**
 * Walk up from `node` to the root; true if any ancestor is one of the
 * alternate-source subtree roots from {@link collectAlternateSourceSubtrees}.
 *
 * Shared by two callers with different needs for the root node itself:
 *   - `buildPipelineShape` (created-field scoping) prunes the alt-source root and
 *     everything under it, so it walks from `node` (`excludeRoot` = false).
 *   - `head_without_sort` (sort/head ordering) must still analyze a top-level
 *     append/lookup as order-destroying while pruning only the stages nested in
 *     its bracketed sub-pipeline, so it walks from `node.parent` (`excludeRoot`).
 */
export function isInsideAltSource(
  node: ParserRuleContext,
  altSourceRoots: Set<ParserRuleContext>,
  excludeRoot = false
): boolean {
  let n: ParserRuleContext | null = excludeRoot ? (node.parent as ParserRuleContext | null) : node;
  for (; n; n = n.parent as ParserRuleContext | null) {
    if (altSourceRoots.has(n)) {
      return true;
    }
  }
  return false;
}

/** Subtrees with an alternate field source, pruned during field-validation. */
export function collectAlternateSourceSubtrees(
  tree: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): Set<ParserRuleContext> {
  const subtrees = new Set<ParserRuleContext>();

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'lookupCommand')) {
    subtrees.add(node);
  }

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'appendCommand')) {
    if (findAllDescendantsByRule(node, ruleNameToIndex, 'searchCommand').length > 0) {
      subtrees.add(node);
    }
  }

  // appendcol's bracketed pipeline computes an attached column; its internal row
  // order is independent of the main pipeline, so commands inside it must not
  // affect (or be affected by) the top-level sort/head ordering analysis.
  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'appendcolCommand')) {
    subtrees.add(node);
  }

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'subSearch')) {
    subtrees.add(node);
  }

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'unionDataset')) {
    subtrees.add(node);
  }

  return subtrees;
}
