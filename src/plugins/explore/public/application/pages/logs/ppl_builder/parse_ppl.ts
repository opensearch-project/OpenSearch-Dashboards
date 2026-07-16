/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream } from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import {
  AggFn,
  Aggregation,
  PPLBuilderState,
  ScalarCall,
  Sort,
  WhereFilter,
  WhereOperator,
  emptyState,
  nextAggId,
  nextFilterId,
} from './types';
import { AGG_FUNCTIONS, SCALAR_FN_IDS, SCALAR_FN_MAP } from './operations';

export interface PPLParseResult {
  canBuild: boolean;
  state: PPLBuilderState;
}

// Aggregations that take a single expression argument. Derived from the catalog
// (every field aggregation except `percentile`, which takes a second arg) so it
// can't drift as aggregations are added, plus `dc` — the terse PPL alias for
// distinct_count that isn't a catalog id.
const SINGLE_ARG_AGG: Record<string, AggFn> = {
  ...AGG_FUNCTIONS.reduce(
    (acc, def) => {
      if (def.needsField && def.id !== 'percentile') acc[def.id] = def.id;
      return acc;
    },
    {} as Record<string, AggFn>
  ),
  dc: 'distinct_count',
};

/** Strip surrounding quotes/backticks and unescape a PPL string literal. */
function unquote(text: string): string {
  const trimmed = text.trim();
  const first = trimmed[0];
  if ((first === "'" || first === '"' || first === '`') && trimmed.endsWith(first)) {
    return trimmed.slice(1, -1).replace(/\\\\/g, '\\').replace(/\\'/g, "'").replace(/\\"/g, '"');
  }
  return trimmed;
}

/**
 * Split a comma-separated argument list on TOP-LEVEL commas only (commas inside
 * nested parentheses belong to inner calls). Input is already whitespace-free.
 */
function splitTopLevelArgs(s: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) {
      args.push(s.slice(start, i));
      start = i + 1;
    }
  }
  args.push(s.slice(start));
  return args;
}

/**
 * Parse a field expression that may be wrapped in a chain of known scalar
 * functions, e.g. `abs(round(latency,1))` -> { field: 'latency', functions:
 * [round(params=['1']), abs] }. Functions are returned innermost-first. Returns
 * null when it hits a call whose name is not a recognized scalar function (the
 * builder can't model it, so the caller bails to code mode).
 */
function parseFieldExpression(text: string): { field: string; functions: ScalarCall[] } | null {
  const call = text.match(/^([a-zA-Z_][\w]*)\((.*)\)$/);
  if (!call) {
    // A bare token (field name). Reject anything that isn't a plain field
    // reference: stray parens, or arithmetic/comparison operators (e.g.
    // `latency/1000`) which the builder can't model as a single field.
    if (!text || /[()+\-*/%<>=!&|^~]/.test(text)) return null;
    return { field: unquote(text), functions: [] };
  }
  const fnId = call[1].toLowerCase();
  if (!SCALAR_FN_IDS.has(fnId)) return null;
  const args = splitTopLevelArgs(call[2]);
  const inner = parseFieldExpression(args[0]);
  if (!inner) return null;
  const def = SCALAR_FN_MAP[fnId];
  const extraParams = args.slice(1);
  // Guard against more args than the catalog defines (an unmodeled variant).
  if (extraParams.length > (def.params.length || 0)) return null;
  const fn: ScalarCall = { id: fnId, name: def.name, params: extraParams };
  return { field: inner.field, functions: [...inner.functions, fn] };
}

/** Build an Aggregation from a wrapped-field expression, or null. */
function buildFieldAgg(fn: AggFn, argText: string, percentile?: number): Aggregation | null {
  const parsed = parseFieldExpression(argText);
  if (!parsed) return null;
  const agg: Aggregation = { id: nextAggId(), fn, field: parsed.field };
  if (parsed.functions.length > 0) agg.functions = parsed.functions;
  if (percentile !== undefined) agg.percentile = percentile;
  return agg;
}

/** Parse a single statsFunction's text into an Aggregation, or null if unmodeled. */
function parseAggFunctionText(text: string): Aggregation | null {
  const compact = text.replace(/\s+/g, '');
  if (/^(count|c)\(\)$/i.test(compact)) {
    return { id: nextAggId(), fn: 'count' };
  }
  const call = compact.match(/^([a-zA-Z_][\w]*)\((.*)\)$/);
  if (!call) return null;
  const fn = call[1].toLowerCase();
  const args = splitTopLevelArgs(call[2]);
  if (fn in SINGLE_ARG_AGG) {
    if (args.length !== 1 || !args[0]) return null;
    return buildFieldAgg(SINGLE_ARG_AGG[fn], args[0]);
  }
  if (fn === 'percentile' || fn === 'percentile_approx') {
    if (args.length !== 2) return null;
    const pct = Number(args[1]);
    if (!Number.isFinite(pct)) return null;
    return buildFieldAgg('percentile', args[0], pct);
  }
  return null;
}

function parseStatsByClause(byCtx: any, state: PPLBuilderState): boolean {
  const fieldListCtx = byCtx.fieldList && byCtx.fieldList();
  if (fieldListCtx) {
    const exprs = fieldListCtx.fieldExpression ? fieldListCtx.fieldExpression() : [];
    const list = Array.isArray(exprs) ? exprs : [exprs];
    state.groupBy.fields = list.map((e: any) => unquote(e.getText())).filter(Boolean);
  }
  const bySpanCtx = byCtx.bySpanClause && byCtx.bySpanClause();
  if (bySpanCtx) {
    // A renamed span (AS alias) isn't modeled — bail to code mode.
    if (typeof bySpanCtx.AS === 'function' && bySpanCtx.AS()) return false;
    const spanCtx = bySpanCtx.spanClause && bySpanCtx.spanClause();
    if (spanCtx) {
      const field = unquote(spanCtx.fieldExpression().getText());
      const value = spanCtx.literalValue().getText();
      const unitCtx = spanCtx.timespanUnit && spanCtx.timespanUnit();
      const unit = unitCtx ? unitCtx.getText() : '';
      state.groupBy.span = { field, interval: `${value}${unit}`, auto: false };
    }
  }
  return true;
}

// A single comparison term inside a where predicate, e.g. `` `status` >= 200 ``.
const COMPARISON_RE = /^\s*`?([\w.@-]+)`?\s*(=|!=|>=|<=|<|>)\s*(.+?)\s*$/;

/** Unquote a PPL value literal: strip surrounding quotes and unescape `''`. */
function unquoteValue(text: string): string {
  const t = text.trim();
  if ((t[0] === "'" || t[0] === '"') && t.endsWith(t[0]) && t.length >= 2) {
    return t.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
  }
  return t;
}

type BoolSplit =
  | { kind: 'single' } // no top-level boolean operator — a lone comparison
  | { kind: 'mixed' } // top level mixes AND and OR — not a modeled shape
  | { kind: 'split'; joiner: 'AND' | 'OR'; operands: string[] };

/**
 * Split a where predicate on a single top-level boolean operator (` AND ` or
 * ` OR `), respecting parentheses and string literals. Returns `single` when the
 * predicate has no top-level boolean (a lone comparison), `mixed` when it mixes
 * AND and OR (a shape the builder can't model), or the joiner + operands when it
 * is a flat join of one operator — which is exactly the shape our known
 * multi-term filter forms take.
 */
function splitTopLevelBool(text: string): BoolSplit {
  const operands: string[] = [];
  let depth = 0;
  let quote = '';
  let joiner: 'AND' | 'OR' | null = null;
  let start = 0;
  const upper = text.toUpperCase();
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = '';
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (depth === 0) {
      const isAnd = upper.startsWith(' AND ', i);
      const isOr = upper.startsWith(' OR ', i);
      if (isAnd || isOr) {
        const here: 'AND' | 'OR' = isAnd ? 'AND' : 'OR';
        // A predicate that mixes AND and OR at the top level isn't a shape the
        // builder models — signal so the caller falls back to code mode.
        if (joiner && joiner !== here) return { kind: 'mixed' };
        joiner = here;
        operands.push(text.slice(start, i));
        i += isAnd ? 4 : 3;
        start = i + 1;
      }
    }
  }
  operands.push(text.slice(start));
  if (!joiner) return { kind: 'single' };
  return { kind: 'split', joiner, operands };
}

interface Comparison {
  field: string;
  op: string;
  value: string;
}

function parseComparison(text: string): Comparison | null {
  const m = text.trim().match(COMPARISON_RE);
  if (!m) return null;
  const rhs = m[3].trim();
  // Reject a back-quoted identifier on the right-hand side (a field-to-field
  // comparison like `` `a` = `b` ``): the builder only emits literal values, so
  // this shape isn't ours to model — fall back to code mode.
  if (rhs.startsWith('`')) return null;
  return { field: m[1].replace(/\.keyword$/, ''), op: m[2], value: unquoteValue(rhs) };
}

/**
 * Reconstruct a structured {@link WhereFilter} from a `where` predicate string,
 * or null when the predicate isn't one of the shapes the builder emits (see
 * `compileWhereFilter` / `FilterUtils.toPredicate`). Returning null makes the
 * caller fall back to code mode, preserving today's safety for arbitrary
 * boolean expressions the visual builder can't represent.
 */
export function parseWherePredicate(text: string): WhereFilter | null {
  const trimmed = text.trim();

  // exists / not_exists — ISNOTNULL(`f`) / ISNULL(`f`).
  const existsMatch = trimmed.match(/^(ISNOTNULL|ISNULL)\(\s*`?([\w.@-]+)`?\s*\)$/i);
  if (existsMatch) {
    const operator: WhereOperator = /^ISNOTNULL$/i.test(existsMatch[1]) ? 'exists' : 'not_exists';
    return {
      id: nextFilterId(),
      field: existsMatch[2].replace(/\.keyword$/, ''),
      operator,
      values: [],
    };
  }

  const split = splitTopLevelBool(trimmed);

  // A top level mixing AND and OR isn't a shape the builder models.
  if (split.kind === 'mixed') return null;

  // Single comparison — is / is_not.
  if (split.kind === 'single') {
    const cmp = parseComparison(trimmed);
    if (!cmp) return null;
    if (cmp.op === '=') {
      return { id: nextFilterId(), field: cmp.field, operator: 'is', values: [cmp.value] };
    }
    if (cmp.op === '!=') {
      return { id: nextFilterId(), field: cmp.field, operator: 'is_not', values: [cmp.value] };
    }
    return null; // a lone range bound isn't a modeled shape
  }

  const comparisons = split.operands.map(parseComparison);
  if (comparisons.some((c) => c === null)) return null;
  const cmps = comparisons as Comparison[];

  // All terms must reference the same field for a modeled multi-term filter.
  const field = cmps[0].field;
  if (cmps.some((c) => c.field !== field)) return null;
  const ops = cmps.map((c) => c.op);

  // is_between: `f >= gte AND f < lt`
  if (split.joiner === 'AND' && ops.length === 2 && ops[0] === '>=' && ops[1] === '<') {
    return {
      id: nextFilterId(),
      field,
      operator: 'is_between',
      values: [cmps[0].value, cmps[1].value],
    };
  }
  // is_not_between: `f < gte OR f >= lt`
  if (split.joiner === 'OR' && ops.length === 2 && ops[0] === '<' && ops[1] === '>=') {
    return {
      id: nextFilterId(),
      field,
      operator: 'is_not_between',
      values: [cmps[0].value, cmps[1].value],
    };
  }
  // is_one_of: `f = a OR f = b [OR …]`
  if (split.joiner === 'OR' && ops.every((op) => op === '=')) {
    return {
      id: nextFilterId(),
      field,
      operator: 'is_one_of',
      values: cmps.map((c) => c.value),
    };
  }
  // is_not_one_of: `f != a AND f != b [AND …]`
  if (split.joiner === 'AND' && ops.every((op) => op === '!=')) {
    return {
      id: nextFilterId(),
      field,
      operator: 'is_not_one_of',
      values: cmps.map((c) => c.value),
    };
  }
  return null;
}

/**
 * Parse a `sort` command into a single Sort, or null when it uses a shape the
 * builder can't model (a result limit, more than one column, or a type-cast
 * sort field like `num(x)`). Direction comes from either the field's `-`/`+`
 * prefix or a trailing `asc`/`desc`; `-` / `desc` mean descending. The column
 * text is unquoted so a back-quoted aggregation column (`` `count()` ``)
 * round-trips to its compiled expression (`count()`).
 */
function parseSortCommand(sortCtx: any): Sort | null {
  // A result limit (`sort 10 by …`) isn't modeled by the builder.
  if (sortCtx._count) return null;

  const byCtx = sortCtx.sortbyClause && sortCtx.sortbyClause();
  if (!byCtx) return null;
  const rawFields = byCtx.sortField ? byCtx.sortField() : [];
  const fields = Array.isArray(rawFields) ? rawFields : rawFields ? [rawFields] : [];
  if (fields.length !== 1) return null;

  const field = fields[0];
  const exprCtx = field.sortFieldExpression && field.sortFieldExpression();
  if (!exprCtx) return null;
  // Reject type-cast sort forms (auto/str/ip/num(...)) — only a plain field is
  // modeled. Those wrap the field in a cast keyword + parentheses.
  const fieldExprCtx = exprCtx.fieldExpression && exprCtx.fieldExpression();
  if (!fieldExprCtx) return null;
  if (exprCtx.getText() !== fieldExprCtx.getText()) return null;

  const column = unquote(fieldExprCtx.getText());
  if (!column) return null;

  const prefixDesc = typeof field.MINUS === 'function' && !!field.MINUS();
  const suffixDesc =
    (typeof sortCtx.DESC === 'function' && !!sortCtx.DESC()) ||
    (typeof sortCtx.D === 'function' && !!sortCtx.D());
  return { column, desc: prefixDesc || suffixDesc };
}

/**
 * Parse a PPL query into builder state. `canBuild` is false when the query uses
 * any command/expression the visual builder can't round-trip.
 *
 * The builder shape is: `source=<index> <search-expression> | stats … by …`.
 * The search expression (everything on the source segment after the
 * `source=<index>` fromClause) is captured verbatim into `searchExpression`;
 * only a single trailing `stats` command is modeled beyond it.
 */
export function parsePPL(query: string): PPLParseResult {
  const fallback: PPLParseResult = { canBuild: false, state: emptyState() };
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return { canBuild: true, state: emptyState() };
  }

  try {
    const inputStream = CharStream.fromString(query);
    const lexer = new SimplifiedOpenSearchPPLLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new SimplifiedOpenSearchPPLParser(tokenStream);
    // Surface syntax errors as a parse failure rather than a partial tree.
    let hadError = false;
    parser.removeErrorListeners();
    parser.addErrorListener({
      syntaxError: () => {
        hadError = true;
      },
      reportAmbiguity: () => {},
      reportAttemptingFullContext: () => {},
      reportContextSensitivity: () => {},
    });

    const root = parser.root();
    if (hadError) return fallback;

    const stmt = root.pplStatement && root.pplStatement();
    const queryStmt = stmt && stmt.queryStatement && stmt.queryStatement();
    if (!queryStmt) return fallback;

    const pplCommands = queryStmt.pplCommands && queryStmt.pplCommands();
    const searchCmd = pplCommands && pplCommands.searchCommand && pplCommands.searchCommand();
    if (!searchCmd) return fallback; // describe/show aren't builder-representable

    const state = emptyState();

    // The simplified grammar parses `source = logs` as a searchExpression (a
    // `source=logs` field comparison), NOT as a fromClause — so the source
    // clause and the real search terms both appear as top-level
    // searchExpression nodes. The dataset-owned source clause is the first node
    // whose field is `source`/`index`; it is dropped (the builder is source-less
    // — see `buildPPL`), and everything after it is the user's search expression,
    // sliced verbatim from the original query so it round-trips.
    // `searchExpression()` lives on the SearchFromContext subclass, not the base
    // SearchCommandContext that `searchCommand()` is typed to return, so read it
    // through `any` (matching this function's loose parser-node access style).
    const searchFrom = searchCmd as any;
    const searchExprs = searchFrom.searchExpression ? searchFrom.searchExpression() : [];
    const exprList = Array.isArray(searchExprs) ? searchExprs : searchExprs ? [searchExprs] : [];

    const exprRange = (e: any): [number, number] | null => {
      const s = e?.start ? e.start.start : undefined;
      const t = e?.stop ? e.stop.stop : undefined;
      return typeof s === 'number' && typeof t === 'number' ? [s, t] : null;
    };

    let searchStartIdx = 0;
    if (exprList.length > 0 && /^(source|index)\s*=/i.test(exprList[0].getText())) {
      searchStartIdx = 1;
    }

    const searchNodes = exprList.slice(searchStartIdx);
    if (searchNodes.length > 0) {
      let lo = Infinity;
      let hi = -Infinity;
      for (const e of searchNodes) {
        const r = exprRange(e);
        if (r) {
          lo = Math.min(lo, r[0]);
          hi = Math.max(hi, r[1]);
        }
      }
      if (Number.isFinite(lo) && hi >= 0) {
        state.searchExpression = query.slice(lo, hi + 1).trim();
      }
    }

    // Beyond the source, the builder models leading `where` filters, a single
    // `stats` command, and/or a single trailing `sort`. Sort is its own pipe
    // operation: it may appear alone (sorting raw search rows) or after stats
    // (sorting the aggregated output), but must come last — nothing the builder
    // models follows a sort. `where` filters must precede stats/sort: a `where`
    // after aggregation is post-aggregation (HAVING-like) filtering the builder
    // can't represent, so it falls back to code mode.
    const commands = queryStmt.commands ? queryStmt.commands() : [];
    const commandList = Array.isArray(commands) ? commands : commands ? [commands] : [];
    let seenStats = false;
    let seenSort = false;

    for (const cmd of commandList) {
      const whereCtx = cmd.whereCommand && cmd.whereCommand();
      const statsCtx = cmd.statsCommand && cmd.statsCommand();
      const sortCtx = cmd.sortCommand && cmd.sortCommand();

      if (whereCtx) {
        // Post-aggregation / post-sort `where` isn't a builder-representable filter.
        if (seenStats || seenSort) return fallback;
        const exprCtx = whereCtx.logicalExpression && whereCtx.logicalExpression();
        const range = exprCtx ? exprRange(exprCtx) : null;
        // Slice the predicate verbatim so quoting/spacing round-trips faithfully.
        const predicateText = range ? query.slice(range[0], range[1] + 1) : '';
        const filter = parseWherePredicate(predicateText);
        if (!filter) return fallback;
        state.filters.push(filter);
        continue;
      }

      if (sortCtx) {
        if (seenSort) return fallback;
        seenSort = true;
        const sort = parseSortCommand(sortCtx);
        if (!sort) return fallback;
        state.sort = sort;
        continue;
      }

      if (!statsCtx) return fallback;
      if (seenStats) return fallback;
      if (seenSort) return fallback;
      seenStats = true;

      // Reject statsArgs (partitions/allnum/delim/...) and dedupSplit.
      const statsArgs = statsCtx.statsArgs && statsCtx.statsArgs();
      if (statsArgs && statsArgs.getText && statsArgs.getText() !== '') return fallback;
      if (statsCtx.dedupSplitArg && statsCtx.dedupSplitArg()) return fallback;

      const aggTerms = statsCtx.statsAggTerm ? statsCtx.statsAggTerm() : [];
      const terms = Array.isArray(aggTerms) ? aggTerms : [aggTerms];
      for (const term of terms) {
        // An aliased aggregation (AS foo) isn't modeled.
        if (typeof term.AS === 'function' && term.AS()) return fallback;
        const fnCtx = term.statsFunction && term.statsFunction();
        if (!fnCtx) return fallback;
        const agg = parseAggFunctionText(fnCtx.getText());
        if (!agg) return fallback;
        state.aggregations.push(agg);
      }

      const byCtx = statsCtx.statsByClause && statsCtx.statsByClause();
      if (byCtx) {
        if (!parseStatsByClause(byCtx, state)) return fallback;
      }
    }

    return { canBuild: true, state };
  } catch {
    return fallback;
  }
}
