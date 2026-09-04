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
import { normalizeFieldPath } from './field_path';

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

/**
 * What a command does to the row order it receives.
 *
 * - `preserves` — rows come out in the order they went in.
 * - `establishes` — the command imposes its own deterministic order, so whatever
 *   order it received no longer matters and the result is still ordered.
 * - `invalidates` — the outgoing order is not guaranteed.
 *
 * Every command must be classified, because an unclassified one is invisible to
 * {@link buildPipelineShape}: it never becomes a stage, so `head-without-sort`
 * treats it as order-preserving AND the fields it creates are never registered,
 * which makes field-validation report them as unknown.
 *
 * Classifications were read off `_explain` on a live 3.8 cluster: a surviving
 * top-level `sort0` means the incoming order carried through, a new top-level
 * sort means the command established one, and an aggregate or union that
 * swallows the sort means the order is gone.
 */
export type CommandOrderEffect = 'preserves' | 'establishes' | 'invalidates';

/**
 * Every direct alternative of the grammar's `commands` rule, on both the bundled
 * (203-rule) and runtime (259-rule on 3.8) surfaces, plus the initial-position
 * commands that can start a pipeline.
 *
 * Names are resolved per grammar, so an entry absent from the active grammar is
 * simply skipped — which is why aliases for the same command can coexist here.
 */
const COMMAND_ORDER_EFFECTS: Record<string, CommandOrderEffect> = {
  // Row-shaping commands: they add, rename, drop, or reformat columns and emit
  // one row per input row, in order.
  searchCommand: 'preserves',
  whereCommand: 'preserves',
  fieldsCommand: 'preserves',
  tableCommand: 'preserves',
  renameCommand: 'preserves',
  evalCommand: 'preserves',
  headCommand: 'preserves',
  binCommand: 'preserves',
  grokCommand: 'preserves',
  parseCommand: 'preserves',
  rexCommand: 'preserves',
  spathCommand: 'preserves',
  patternsCommand: 'preserves',
  regexCommand: 'preserves',
  fillnullCommand: 'preserves',
  flattenCommand: 'preserves',
  reverseCommand: 'preserves',
  dedupCommand: 'preserves',
  streamstatsCommand: 'preserves',
  trendlineCommand: 'preserves',
  appendcolCommand: 'preserves',
  convertCommand: 'preserves',
  fieldformatCommand: 'preserves',
  nomvCommand: 'preserves',
  foreachCommand: 'preserves',
  // Expansion multiplies rows, but the copies stay grouped with their source row,
  // so a prior sort still holds.
  expandCommand: 'preserves',
  mvexpandCommand: 'preserves',
  // Adds a per-row total column; no union, no re-sort.
  addtotalsCommand: 'preserves',

  // These impose their own order.
  sortCommand: 'establishes',
  // top/rare rank by count (ROW_NUMBER over ORDER BY count, with the field list
  // as a deterministic tie-break) and are one grammar rule from 3.6 on.
  topCommand: 'establishes',
  rareCommand: 'establishes',
  rareTopCommand: 'establishes',
  // Both aggregate and then sort by the row-split key / time bucket.
  chartCommand: 'establishes',
  timechartCommand: 'establishes',

  // Aggregation, pivots, joins, and unions: the incoming order does not survive.
  statsCommand: 'invalidates',
  eventstatsCommand: 'invalidates',
  joinCommand: 'invalidates',
  lookupCommand: 'invalidates',
  appendCommand: 'invalidates',
  unionCommand: 'invalidates',
  multisearchCommand: 'invalidates',
  replaceCommand: 'invalidates',
  // Output rows are the input columns, so an upstream row order is meaningless.
  transposeCommand: 'invalidates',
  // Groups rows into arrays via an aggregate that swallows the sort.
  mvcombineCommand: 'invalidates',
  // Appends a summary row through a union.
  appendPipeCommand: 'invalidates',
  addcoltotalsCommand: 'invalidates',
  // Joins a second table, like lookup.
  graphLookupCommand: 'invalidates',
  // Re-sorts by span and series.
  timewrapCommand: 'invalidates',
  // ML commands route through a separate transport action rather than the query
  // pipeline. Not verifiable on a cluster without the ML plugin, so treated
  // conservatively: an unnecessary "add sort" hint beats a silent false negative.
  adCommand: 'invalidates',
  kmeansCommand: 'invalidates',
  mlCommand: 'invalidates',

  // Metadata commands. They start a pipeline rather than transform one, and
  // return a small fixed result set in a defined order.
  describeCommand: 'establishes',
  showDataSourcesCommand: 'establishes',
  restCommand: 'establishes',
};

/** Commands whose row order survives, for {@link CommandOrderEffect} consumers. */
export const ORDER_PRESERVING_COMMANDS: ReadonlySet<string> = new Set(
  Object.keys(COMMAND_ORDER_EFFECTS).filter((name) => COMMAND_ORDER_EFFECTS[name] === 'preserves')
);

/** Commands that impose their own deterministic order. */
export const ORDER_ESTABLISHING_COMMANDS: ReadonlySet<string> = new Set(
  Object.keys(COMMAND_ORDER_EFFECTS).filter((name) => COMMAND_ORDER_EFFECTS[name] === 'establishes')
);

export const COMMAND_RULE_NAMES = Object.keys(COMMAND_ORDER_EFFECTS);

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

// Default totals column name `addtotals`/`addcoltotals` use when FIELDNAME is
// omitted (confirmed against the live 3.8 engine).
const TOTALS_DEFAULT_FIELD = 'Total';

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

// Shared with field_validation's reference side so quote-stripping can't drift.
export const normalizeFieldName = normalizeFieldPath;

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

  // (d) Named-slot extraction: addtotals / addcoltotals. Both add a totals column
  // named by `FIELDNAME = <literal>`, defaulting to `Total` (confirmed on a live
  // 3.8 cluster). Neither uses `AS`, so the scans above never see the name.
  if (stage.command === 'addtotalsCommand' || stage.command === 'addcoltotalsCommand') {
    const fieldName = findSlotValueAfterKeyword(stage.node, 'FIELDNAME');
    out.add(fieldName ? unquote(fieldName) : TOTALS_DEFAULT_FIELD);
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

  // Commands carrying a bracketed sub-pipeline: its internal row order is
  // independent of the main pipeline, so commands inside it must not affect (or
  // be affected by) the top-level sort/head ordering analysis. Without this, a
  // `sort` inside the brackets would suppress an unordered outer `head`.
  for (const name of ['appendcolCommand', 'appendPipeCommand', 'foreachCommand']) {
    for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, name)) {
      subtrees.add(node);
    }
  }

  // graphlookup is deliberately NOT pruned. It joins a second table like lookup,
  // but its `as <name>` output IS a column on the outer pipeline (verified on a
  // live 3.8 cluster: `graphlookup ... as outf | fields outf` returns `outf`), so
  // pruning it would drop that created field and false-flag a valid reference.

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'subSearch')) {
    subtrees.add(node);
  }

  for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, 'unionDataset')) {
    subtrees.add(node);
  }

  return subtrees;
}
