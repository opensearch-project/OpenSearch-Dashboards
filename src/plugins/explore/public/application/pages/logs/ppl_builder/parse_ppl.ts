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

// Normalize an ANTLR optional-context accessor result (single node, array, or
// nullish) into a plain array.
const toArray = <T>(x: T | T[] | null | undefined): T[] =>
  Array.isArray(x) ? x : x != null ? [x] : [];

const SINGLE_ARG_AGG: Record<string, AggFn> = { dc: 'distinct_count' };
for (const def of AGG_FUNCTIONS) {
  if (def.needsField && def.id !== 'percentile') SINGLE_ARG_AGG[def.id] = def.id;
}

function unquote(text: string): string {
  const trimmed = text.trim();
  const first = trimmed[0];
  if ((first === "'" || first === '"' || first === '`') && trimmed.endsWith(first)) {
    return trimmed.slice(1, -1).replace(/\\\\/g, '\\').replace(/\\'/g, "'").replace(/\\"/g, '"');
  }
  return trimmed;
}

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

function parseFieldExpression(text: string): { field: string; functions: ScalarCall[] } | null {
  const trimmed = text.trim();
  // A back-quoted field is a literal identifier, not an expression: accept it
  // verbatim so names with dashes/spaces (e.g. `response-time`) round-trip.
  // buildPPL emits these quoted via quoteFieldExpr; parsing must mirror that.
  if (trimmed[0] === '`' && trimmed.endsWith('`') && trimmed.length >= 2) {
    return { field: unquote(trimmed), functions: [] };
  }
  const call = text.match(/^([a-zA-Z_][\w]*)\((.*)\)$/);
  if (!call) {
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
  if (extraParams.length > (def.params.length || 0)) return null;
  const fn: ScalarCall = { id: fnId, name: def.name, params: extraParams };
  return { field: inner.field, functions: [...inner.functions, fn] };
}

function buildFieldAgg(fn: AggFn, argText: string, percentile?: number): Aggregation | null {
  const parsed = parseFieldExpression(argText);
  if (!parsed) return null;
  const agg: Aggregation = { id: nextAggId(), fn, field: parsed.field };
  if (parsed.functions.length > 0) agg.functions = parsed.functions;
  if (percentile !== undefined) agg.percentile = percentile;
  return agg;
}

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
    const list = toArray(fieldListCtx.fieldExpression && fieldListCtx.fieldExpression());
    state.groupBy.fields = list.map((e: any) => unquote(e.getText())).filter(Boolean);
  }
  const bySpanCtx = byCtx.bySpanClause && byCtx.bySpanClause();
  if (bySpanCtx) {
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

// The field may be a bare identifier or back-quoted. whereField (build_ppl)
// always back-quotes the WHERE field, and a back-quoted name can hold any
// character except a backtick (spaces, colons, slashes, parens, #, ...), so the
// quoted alternative must accept `[^`]+` rather than the bare-identifier charset
// — otherwise a filter on a field like `geo.city name` compiles but cannot be
// parsed back, and the query is wrongly flagged as unrepresentable in Builder.
const COMPARISON_RE = /^\s*(?:`([^`]+)`|([\w.@-]+))\s*(=|!=|>=|<=|<|>)\s*(.+?)\s*$/;

function unquoteValue(text: string): string {
  const t = text.trim();
  if ((t[0] === "'" || t[0] === '"') && t.endsWith(t[0]) && t.length >= 2) {
    return t.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
  }
  return t;
}

type BoolSplit =
  | { kind: 'single' }
  | { kind: 'mixed' }
  | { kind: 'split'; joiner: 'AND' | 'OR'; operands: string[] };

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
    if (c === "'" || c === '"' || c === '`') {
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
  const rhs = m[4].trim();
  if (rhs.startsWith('`')) return null;
  const field = (m[1] ?? m[2]).replace(/\.keyword$/, '');
  return { field, op: m[3], value: unquoteValue(rhs) };
}

export function parseWherePredicate(text: string): WhereFilter | null {
  const trimmed = text.trim();
  const mkFilter = (field: string, operator: WhereOperator, values: string[]): WhereFilter => ({
    id: nextFilterId(),
    field,
    operator,
    values,
  });

  const existsMatch = trimmed.match(/^(ISNOTNULL|ISNULL)\(\s*(?:`([^`]+)`|([\w.@-]+))\s*\)$/i);
  if (existsMatch) {
    const operator: WhereOperator = /^ISNOTNULL$/i.test(existsMatch[1]) ? 'exists' : 'not_exists';
    return mkFilter((existsMatch[2] ?? existsMatch[3]).replace(/\.keyword$/, ''), operator, []);
  }

  const split = splitTopLevelBool(trimmed);

  if (split.kind === 'mixed') return null;

  if (split.kind === 'single') {
    const cmp = parseComparison(trimmed);
    if (!cmp) return null;
    if (cmp.op === '=') return mkFilter(cmp.field, 'is', [cmp.value]);
    if (cmp.op === '!=') return mkFilter(cmp.field, 'is_not', [cmp.value]);
    // A range filter with only one bound set compiles to a lone comparison
    // (`>= min` or `< max`), so map those back to a partial `is_between`. This
    // keeps a one-sided range representable in Builder mode and round-trips the
    // recompiled PPL exactly. (A one-sided `is_not_between` produces the same
    // lone operator, so it collapses to the equivalent `is_between` here.)
    if (cmp.op === '>=') return mkFilter(cmp.field, 'is_between', [cmp.value, '']);
    if (cmp.op === '<') return mkFilter(cmp.field, 'is_between', ['', cmp.value]);
    return null;
  }

  const comparisons = split.operands.map(parseComparison);
  if (comparisons.some((c) => c === null)) return null;
  const cmps = comparisons as Comparison[];

  const field = cmps[0].field;
  if (cmps.some((c) => c.field !== field)) return null;
  const ops = cmps.map((c) => c.op);
  const values = cmps.map((c) => c.value);

  if (split.joiner === 'AND' && ops.length === 2 && ops[0] === '>=' && ops[1] === '<') {
    return mkFilter(field, 'is_between', values);
  }
  if (split.joiner === 'OR' && ops.length === 2 && ops[0] === '<' && ops[1] === '>=') {
    return mkFilter(field, 'is_not_between', values);
  }
  if (split.joiner === 'OR' && ops.every((op) => op === '=')) {
    return mkFilter(field, 'is_one_of', values);
  }
  if (split.joiner === 'AND' && ops.every((op) => op === '!=')) {
    return mkFilter(field, 'is_not_one_of', values);
  }
  return null;
}

function parseSortCommand(sortCtx: any): Sort | null {
  if (sortCtx._count) return null;

  const byCtx = sortCtx.sortbyClause && sortCtx.sortbyClause();
  if (!byCtx) return null;
  const fields = toArray(byCtx.sortField && byCtx.sortField());
  if (fields.length !== 1) return null;

  const field = fields[0];
  const exprCtx = field.sortFieldExpression && field.sortFieldExpression();
  if (!exprCtx) return null;
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
    if (!searchCmd) return fallback;

    const state = emptyState();

    const searchFrom = searchCmd as any;
    const exprList = toArray(searchFrom.searchExpression && searchFrom.searchExpression());

    const exprRange = (e: any): [number, number] | null => {
      const s = e?.start ? e.start.start : undefined;
      const t = e?.stop ? e.stop.stop : undefined;
      return typeof s === 'number' && typeof t === 'number' ? [s, t] : null;
    };

    // Capture the leading `source = <index>` / `index = <index>` clause exactly as
    // written (spacing, quoting, index form) so a Builder -> Code round-trip
    // re-emits the source the user actually typed rather than a reconstructed one.
    // A back-quoted source (source = `my-index`) does NOT parse as a
    // searchExpression node, so match it on the raw search-command text (bounded to
    // the text before the first pipe) rather than relying on exprList[0]. The value
    // matches a back-quoted name, a comma-separated index list, or a bare token.
    const searchCmdRange = exprRange(searchCmd);
    const searchCmdText =
      searchCmdRange && Number.isFinite(searchCmdRange[0])
        ? query.slice(searchCmdRange[0], searchCmdRange[1] + 1)
        : '';
    const sourceMatch = searchCmdText.match(
      /^(?:search\s+)?(?:source|index)\s*=\s*(?:`[^`]+`|[^\s|]+(?:\s*,\s*[^\s|]+)*)/i
    );
    if (sourceMatch) {
      state.sourceClause = sourceMatch[0].trim();
    }

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

    const commandList = toArray(queryStmt.commands && queryStmt.commands());
    let seenStats = false;
    let seenSort = false;

    for (const cmd of commandList) {
      const whereCtx = cmd.whereCommand && cmd.whereCommand();
      const statsCtx = cmd.statsCommand && cmd.statsCommand();
      const sortCtx = cmd.sortCommand && cmd.sortCommand();

      if (whereCtx) {
        if (seenStats || seenSort) return fallback;
        const exprCtx = whereCtx.logicalExpression && whereCtx.logicalExpression();
        const range = exprCtx ? exprRange(exprCtx) : null;
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

      const statsArgs = statsCtx.statsArgs && statsCtx.statsArgs();
      if (statsArgs && statsArgs.getText && statsArgs.getText() !== '') return fallback;
      if (statsCtx.dedupSplitArg && statsCtx.dedupSplitArg()) return fallback;

      const terms = toArray(statsCtx.statsAggTerm && statsCtx.statsAggTerm());
      for (const term of terms) {
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
