/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import {
  PromQLLexer,
  PromQLParser,
  PromQLParserVisitor,
  ExpressionContext,
  VectorOperationContext,
  ParensContext,
  InstantSelectorContext,
  LabelMatcherContext,
  AggregationContext,
  FunctionContext,
  MatrixSelectorContext,
  OffsetContext,
  ParameterContext,
} from '@osd/antlr-grammar';
import { OP_DEF_MAP } from './operation_lookup';

export interface LabelFilter {
  // Stable id generated at creation so React keys survive reordering/removal
  // from the middle of the list — index keys swap combo box focus state.
  id: string;
  label: string;
  op: string;
  // An unfinished filter has no value; an empty string is a valid matcher.
  value?: string;
}

let filterIdCounter = 0;
export const nextFilterId = (): string => `lf-${++filterIdCounter}`;

export const emptyFilter = (): LabelFilter => ({ id: nextFilterId(), label: '', op: '=' });

export interface OperationGrouping {
  mode: 'by' | 'without';
  labels: string[];
}

export interface Operation {
  id: string;
  name: string;
  params: string[];
  grouping?: OperationGrouping;
}

export interface BuilderState {
  metric: string;
  labelFilters: LabelFilter[];
  operations: Operation[];
  range?: string;
}

interface ParseResult {
  canBuild: boolean;
  state: BuilderState;
}

export const RANGE_FUNCTIONS = new Set([
  'rate',
  'irate',
  'increase',
  'delta',
  'deriv',
  'idelta',
  'avg_over_time',
  'min_over_time',
  'max_over_time',
  'sum_over_time',
  'count_over_time',
  'quantile_over_time',
  'stddev_over_time',
  'stdvar_over_time',
  'last_over_time',
  'present_over_time',
  'changes',
  'resets',
  'absent_over_time',
  'holt_winters',
  'predict_linear',
]);

const OP_MAP: Record<number, string> = {
  [PromQLParser.EQ]: '=',
  [PromQLParser.NE]: '!=',
  [PromQLParser.RE]: '=~',
  [PromQLParser.NRE]: '!~',
};

/** Maps grammar token types to builder binary-operation IDs. */
const BINARY_OP_ID_MAP: Record<number, string> = {
  [PromQLParser.ADD]: 'add',
  [PromQLParser.SUB]: 'sub',
  [PromQLParser.MULT]: 'mul',
  [PromQLParser.DIV]: 'div',
  [PromQLParser.MOD]: 'mod',
  [PromQLParser.POW]: 'pow',
  [PromQLParser.DEQ]: 'eq',
  [PromQLParser.NE]: 'neq',
  [PromQLParser.GT]: 'gt',
  [PromQLParser.LT]: 'lt',
  [PromQLParser.GE]: 'gte',
  [PromQLParser.LE]: 'lte',
};

const emptyState = (): BuilderState => ({
  metric: '',
  labelFilters: [emptyFilter()],
  operations: [],
});

const PARSE_CACHE_MAX = 64;
const parseCache = new Map<string, ParseResult>();

/**
 * Parse a single PromQL expression string into a BuilderState.
 * Results are cached to avoid redundant ANTLR parser instantiation on repeated calls
 * (e.g. during render, mode-switch checks, builder keystrokes).
 * Returns { canBuild: false } for queries too complex for the visual builder
 * (binary ops, subqueries, nested selectors, etc.)
 */
export function parsePromQL(query: string): ParseResult {
  const trimmed = query.trim();
  if (!trimmed) return { canBuild: true, state: emptyState() };

  const cached = parseCache.get(trimmed);
  if (cached) return cached;

  let result: ParseResult;
  try {
    const replaced = replaceQuotedLabelNames(trimmed);
    if (!replaced) throw new Error('Undecodable quoted label name');
    const { text, names } = replaced;
    const lexer = new PromQLLexer(CharStream.fromString(text));
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new PromQLParser(tokenStream);
    parser.removeErrorListeners();

    const tree = parser.expression();
    if (parser.numberOfSyntaxErrors > 0) {
      result = { canBuild: false, state: emptyState() };
    } else {
      const visitor = new BuilderStateVisitor();
      visitor.visit(tree);

      if (!visitor.canBuild || !visitor.metric) {
        result = { canBuild: false, state: emptyState() };
      } else {
        const restore = (label: string) => names.get(label) ?? label;
        const labelFilters = visitor.labelFilters.map((f) => ({ ...f, label: restore(f.label) }));
        const operations = visitor.operations.map((op) =>
          op.grouping
            ? { ...op, grouping: { ...op.grouping, labels: op.grouping.labels.map(restore) } }
            : op
        );
        result = {
          canBuild: true,
          state: {
            metric: visitor.metric,
            labelFilters: labelFilters.length > 0 ? labelFilters : [emptyFilter()],
            operations,
            ...(visitor.range ? { range: visitor.range } : {}),
          },
        };
      }
    }
  } catch {
    result = { canBuild: false, state: emptyState() };
  }

  if (parseCache.size >= PARSE_CACHE_MAX) {
    const firstKey = parseCache.keys().next().value;
    if (firstKey !== undefined) parseCache.delete(firstKey);
  }
  parseCache.set(trimmed, result);
  return result;
}

// PromQL strings: double- or single-quoted with Go escapes, or backtick-quoted raw strings.
const STRING_LITERAL = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`/g;
const MATCHER_OPERATOR = /^\s*(?:=~|!~|!=|=)/;
// `by (...)` / `without (...)` on the text with every string masked, so it can't match inside one.
const GROUPING = /\b(by|without)(\s*)\(([^()]*)\)/g;
const MASK = /\u0000(\d+)\u0000/g;

const SIMPLE_ESCAPES: Record<string, string> = {
  a: '\u0007',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v',
  '\\': '\\',
  '"': '"',
  "'": "'",
};

/**
 * The value of a PromQL string literal (its quotes included), or undefined when it can't be
 * decoded, or decodes to control characters the builder can't write back.
 */
export const decodePromQLString = (literal: string): string | undefined => {
  const quote = literal[0];
  if (literal.length < 2 || literal[literal.length - 1] !== quote) return undefined;
  const body = literal.slice(1, -1);
  let value: string;
  if (quote === '`') {
    value = body;
  } else if (quote === '"' || quote === "'") {
    let out = '';
    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if (ch !== '\\') {
        out += ch;
        continue;
      }
      const next = body[++i];
      if (next === undefined) return undefined;
      if (next in SIMPLE_ESCAPES) {
        // A quote is escaped only inside its own kind of string.
        if ((next === '"' || next === "'") && next !== quote) return undefined;
        out += SIMPLE_ESCAPES[next];
        continue;
      }
      const hexLength = next === 'x' ? 2 : next === 'u' ? 4 : next === 'U' ? 8 : 0;
      const digits = hexLength
        ? body.slice(i + 1, i + 1 + hexLength)
        : /[0-7]/.test(next)
          ? body.slice(i, i + 3)
          : '';
      const valid = hexLength ? /^[0-9a-fA-F]+$/ : /^[0-7]{3}$/;
      if (!digits || digits.length !== (hexLength || 3) || !valid.test(digits)) return undefined;
      const code = parseInt(digits, hexLength ? 16 : 8);
      if (code > 0x10ffff) return undefined;
      out += String.fromCodePoint(code);
      i += hexLength ? hexLength : 2;
    }
    value = out;
  } else {
    return undefined;
  }

  return /[\u0000-\u001f\u007f]/.test(value) ? undefined : value;
};

/**
 * The grammar only takes bare label names, but Prometheus 3 quotes names it can't take bare
 * (`"k8s.namespace.name"="x"`, `by ("service.name")`). Swap each for a placeholder name
 * before parsing; `names` maps the placeholders back. Undefined when a quoted name can't be
 * decoded.
 */
const replaceQuotedLabelNames = (query: string) => {
  // Mask every string first, left to right, so each one is taken whole (whatever its quotes) and
  // nothing inside one is read as a name or a grouping clause.
  const strings: string[] = [];
  const masked = query.replace(STRING_LITERAL, (literal: string) => {
    strings.push(literal);
    return `\u0000${strings.length - 1}\u0000`;
  });
  const names = new Map<string, string>();
  const nameIndexes = new Set<number>();
  let decodable = true;
  const placeholder = (index: number) => {
    const name = decodePromQLString(strings[index]);
    if (name === undefined) decodable = false;
    const id = `__osd_label_${names.size}__`;
    names.set(id, name ?? '');
    nameIndexes.add(index);
    return id;
  };
  const placeholders = new Map<number, string>();
  const nameAt = (index: number) => {
    if (!placeholders.has(index)) placeholders.set(index, placeholder(index));
    return placeholders.get(index)!;
  };
  // A string is a label name when it opens a matcher (right after `{` or `,`, and followed by a
  // matcher operator) or is listed in a grouping clause.
  masked.replace(MASK, (marker: string, index: string, offset: number, source: string) => {
    const before = source.slice(0, offset).trimEnd();
    const after = source.slice(offset + marker.length);
    if ((before.endsWith('{') || before.endsWith(',')) && MATCHER_OPERATOR.test(after)) {
      nameAt(Number(index));
    }
    return marker;
  });
  masked.replace(GROUPING, (clause: string, _mode: string, _space: string, labels: string) => {
    labels.replace(MASK, (marker: string, index: string) => {
      nameAt(Number(index));
      return marker;
    });
    return clause;
  });
  const text = masked.replace(MASK, (_marker: string, index: string) => {
    const i = Number(index);
    return nameIndexes.has(i) ? placeholders.get(i)! : strings[i];
  });
  return decodable ? { text, names } : undefined;
};

/**
 * Visitor that walks the ANTLR parse tree and extracts BuilderState fields.
 *
 * Supports the "linear chain" pattern that the builder can represent:
 *   metric{labels}  →  [range]  →  function()  →  aggregation()
 *
 * Bails out (canBuild=false) for binary ops, subqueries, or other
 * structures the visual builder cannot represent.
 */
class BuilderStateVisitor extends PromQLParserVisitor<void> {
  metric = '';
  labelFilters: LabelFilter[] = [];
  operations: Operation[] = [];
  range?: string;
  canBuild = true;

  // Track if we've seen a selector — more than one means binary op
  private selectorCount = 0;
  private insideRangeFunction = false;

  defaultResult = () => {};

  visitExpression = (ctx: ExpressionContext) => {
    this.visitChildren(ctx);
  };

  visitVectorOperation = (ctx: VectorOperationContext) => {
    const opCtx = ctx.compareOp?.() || ctx.addOp?.() || ctx.multOp?.() || ctx.powOp?.();
    if (opCtx) {
      const rhs = ctx.vectorOperation(1);
      const scalar = rhs ? this.extractScalarLiteral(rhs) : undefined;
      if (scalar !== undefined) {
        const opToken = opCtx.start?.type;
        const opId = opToken !== undefined ? BINARY_OP_ID_MAP[opToken] : undefined;
        const lhs = ctx.vectorOperation(0);
        if (opId && lhs) {
          this.visit(lhs);
          this.operations.push({
            id: opId,
            name: OP_DEF_MAP[opId]?.name || opId,
            params: [scalar],
          });
          return;
        }
      }
      this.canBuild = false;
      return;
    }
    if (ctx.andUnlessOp?.() || ctx.orOp?.() || ctx.vectorMatchOp?.()) {
      this.canBuild = false;
      return;
    }
    if (ctx.subqueryOp?.()) {
      this.canBuild = false;
      return;
    }
    if (ctx.unaryOp?.() || ctx.AT?.()) {
      this.canBuild = false;
      return;
    }
    this.visitChildren(ctx);
  };

  /**
   * If the RHS vectorOperation is a simple scalar-like value the builder can
   * represent as a binary-op param, return its text; otherwise return undefined.
   * Accepts: NUMBER literals, bare metric names (identifiers), and STRING literals.
   */
  private extractScalarLiteral(ctx: VectorOperationContext): string | undefined {
    const vector = ctx.vector?.();
    if (!vector) return undefined;
    const literal = vector.literal?.();
    if (literal) {
      const num = literal.NUMBER?.();
      if (num) return num.getText();
      const str = literal.STRING?.();
      if (str) {
        let text = str.getText();
        if (
          (text.startsWith('"') && text.endsWith('"')) ||
          (text.startsWith("'") && text.endsWith("'"))
        )
          text = text.slice(1, -1);
        return text;
      }
      return undefined;
    }
    const sel = vector.instantSelector?.();
    if (sel && sel.metricName?.() && !sel.LEFT_BRACE?.()) {
      return sel.metricName()!.getText();
    }
    return undefined;
  }

  visitInstantSelector = (ctx: InstantSelectorContext) => {
    this.selectorCount++;
    if (this.selectorCount > 1) {
      this.canBuild = false;
      return;
    }

    const metricCtx = ctx.metricName();
    if (metricCtx) {
      this.metric = metricCtx.getText();
    }

    const matcherList = ctx.labelMatcherList();
    if (matcherList) {
      for (const matcher of matcherList.labelMatcher()) {
        this.visitLabelMatcher(matcher);
      }
    }

    // `{__name__="2xx", ...}` is how the builder writes a name PromQL can't take bare.
    if (!this.metric) {
      const nameIndex = this.labelFilters.findIndex((f) => f.label === '__name__' && f.op === '=');
      if (nameIndex !== -1) {
        this.metric = this.labelFilters[nameIndex].value ?? '';
        this.labelFilters.splice(nameIndex, 1);
      }
    }
  };

  visitLabelMatcher = (ctx: LabelMatcherContext) => {
    const label = ctx.labelName()?.getText() || '';
    const opCtx = ctx.labelMatcherOperator();
    const opToken = opCtx?.start?.type;
    const op = (opToken !== undefined && OP_MAP[opToken]) || '=';
    // The builder holds the value itself and escapes it again when it writes the query, so decode
    // it here. A value it can't decode keeps the query in code mode.
    const value = decodePromQLString(ctx.labelValue()?.getText() || '');
    if (value === undefined) {
      this.canBuild = false;
      return;
    }
    this.labelFilters.push({ id: nextFilterId(), label, op, value });
  };

  visitFunction = (ctx: FunctionContext) => {
    if (!this.canBuild) return;

    const fnName = ctx.functionNames()?.getText()?.toLowerCase() || '';
    const params: ParameterContext[] = ctx.parameter() || [];

    if (RANGE_FUNCTIONS.has(fnName)) {
      let rangeDuration = '';
      const literalParams: string[] = [];

      this.insideRangeFunction = true;
      for (const param of params) {
        const literal = param.literal?.();
        if (literal) {
          literalParams.push(literal.getText());
        } else {
          this.visit(param);
        }
      }
      this.insideRangeFunction = false;

      const matrixCtx = this.findMatrixSelector(ctx);
      if (matrixCtx) {
        const timeRange = matrixCtx.timeRange();
        if (timeRange) {
          rangeDuration = timeRange.duration()?.getText() || '';
        }
      }

      // Param layout matches operation_categories paramNames order:
      // quantile_over_time: [Quantile, Range]; holt_winters / predict_linear: [Range, ...]
      const opParams =
        fnName === 'quantile_over_time'
          ? [...literalParams, rangeDuration]
          : [rangeDuration, ...literalParams];

      this.operations.push({ id: fnName, name: fnName, params: opParams });
    } else {
      const fnParams: string[] = [];

      for (const param of params) {
        const literal = param.literal?.();
        if (literal) {
          let text = literal.getText();
          if (
            (text.startsWith('"') && text.endsWith('"')) ||
            (text.startsWith("'") && text.endsWith("'"))
          ) {
            text = text.slice(1, -1);
          }
          fnParams.push(text);
        } else {
          this.visit(param);
        }
      }

      const EXPECTED_PARAMS: Record<string, string[]> = {
        label_replace: ['', '', '', ''],
        clamp: ['1', '100'],
        clamp_min: ['0'],
        clamp_max: ['100'],
      };
      const expected = EXPECTED_PARAMS[fnName];
      if (expected) {
        while (fnParams.length < expected.length) fnParams.push(expected[fnParams.length]);
      }

      this.operations.push({ id: fnName, name: fnName, params: fnParams });
    }
  };

  visitAggregation = (ctx: AggregationContext) => {
    if (!this.canBuild) return;

    const opName = ctx.aggregationOperators()?.getText()?.toLowerCase() || '';
    const params: string[] = [];

    const paramList = ctx.parameterList();
    if (paramList) {
      for (const param of paramList.parameter()) {
        const literal = param.literal?.();
        if (literal) {
          let text = literal.getText();
          if (
            (text.startsWith('"') && text.endsWith('"')) ||
            (text.startsWith("'") && text.endsWith("'"))
          ) {
            text = text.slice(1, -1);
          }
          params.push(text);
        } else {
          this.visit(param);
        }
      }
    }

    let grouping: OperationGrouping | undefined;
    const byCtx = ctx.by();
    const withoutCtx = ctx.without();
    if (byCtx) {
      const labels =
        byCtx
          .labelNameList()
          ?.labelName()
          ?.map((ln) => ln.getText()) || [];
      grouping = { mode: 'by', labels };
    } else if (withoutCtx) {
      const labels =
        withoutCtx
          .labelNameList()
          ?.labelName()
          ?.map((ln) => ln.getText()) || [];
      grouping = { mode: 'without', labels };
    }

    this.operations.push({ id: opName, name: opName, params, grouping });
  };

  visitMatrixSelector = (ctx: MatrixSelectorContext) => {
    const instantCtx = ctx.instantSelector();
    if (instantCtx) {
      this.visitInstantSelector(instantCtx);
    }
    if (!this.insideRangeFunction) {
      const timeRange = ctx.timeRange();
      if (timeRange) {
        this.range = timeRange.duration()?.getText() || '';
      }
    }
  };

  visitOffset = (_ctx: OffsetContext) => {
    this.canBuild = false;
  };

  visitParens = (ctx: ParensContext) => {
    this.visitChildren(ctx);
  };

  private findMatrixSelector(ctx: ParserRuleContext | null): MatrixSelectorContext | null {
    if (!ctx) return null;
    if (ctx instanceof MatrixSelectorContext) return ctx;
    if (ctx.children) {
      for (const child of ctx.children) {
        const found = this.findMatrixSelector(child as ParserRuleContext);
        if (found) return found;
      }
    }
    return null;
  }
}
