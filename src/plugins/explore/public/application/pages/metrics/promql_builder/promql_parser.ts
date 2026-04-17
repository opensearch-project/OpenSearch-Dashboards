/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream } from 'antlr4ng';
import {
  PromQLLexer,
  PromQLParser,
  PromQLParserVisitor,
  InstantSelectorContext,
  LabelMatcherContext,
  AggregationContext,
} from '@osd/antlr-grammar';
import { OP_DEF_MAP } from './operation_categories';

export interface LabelFilter {
  label: string;
  op: string;
  value: string;
}

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

export interface ParseResult {
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
  labelFilters: [{ label: '', op: '=', value: '' }],
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
    const lexer = new PromQLLexer(CharStream.fromString(trimmed));
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new PromQLParser(tokenStream);
    parser.removeErrorListeners();

    const tree = parser.expression();
    if (parser.numberOfSyntaxErrors > 0) {
      result = { canBuild: false, state: emptyState() };
    } else {
      const visitor = new BuilderStateVisitor();
      visitor.visit(tree);

      if (!visitor.canBuild) {
        result = { canBuild: false, state: emptyState() };
      } else {
        result = {
          canBuild: true,
          state: {
            metric: visitor.metric,
            labelFilters:
              visitor.labelFilters.length > 0
                ? visitor.labelFilters
                : [{ label: '', op: '=', value: '' }],
            operations: visitor.operations,
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

  visitExpression = (ctx: any) => {
    this.visitChildren(ctx);
  };

  visitVectorOperation = (ctx: any) => {
    // Identify which binary op (if any) is present
    const opCtx = ctx.compareOp?.() || ctx.addOp?.() || ctx.multOp?.() || ctx.powOp?.();
    if (opCtx) {
      // Binary op: allow only if RHS is a scalar literal
      const rhs = ctx.vectorOperation?.(1);
      const scalar = this.extractScalarLiteral(rhs);
      if (scalar !== undefined) {
        const opToken = opCtx.start?.type;
        const opId = opToken !== undefined ? BINARY_OP_ID_MAP[opToken] : undefined;
        if (opId) {
          // Visit LHS to extract metric/operations, then append the binary op
          this.visit(ctx.vectorOperation(0));
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
    // Subquery
    if (ctx.subqueryOp?.()) {
      this.canBuild = false;
      return;
    }
    // Unary negation / @ modifier — not representable in builder
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
  private extractScalarLiteral(ctx: any): string | undefined {
    const vector = ctx?.vector?.();
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
    // Bare identifier (metric name with no labels/braces)
    const sel = vector.instantSelector?.();
    if (sel && sel.metricName?.() && !sel.LEFT_BRACE?.()) {
      return sel.metricName().getText();
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
  };

  visitLabelMatcher = (ctx: LabelMatcherContext) => {
    const label = ctx.labelName()?.getText() || '';
    const opCtx = ctx.labelMatcherOperator();
    const opToken = opCtx?.start?.type;
    const op = (opToken !== undefined && OP_MAP[opToken]) || '=';
    let value = ctx.labelValue()?.getText() || '';
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    this.labelFilters.push({ label, op, value });
  };

  visitFunction = (ctx: any) => {
    if (!this.canBuild) return;

    const fnName = ctx.functionNames()?.getText()?.toLowerCase() || '';
    const params = ctx.parameter() || [];

    if (RANGE_FUNCTIONS.has(fnName)) {
      // For range functions, extract the range duration and any literal params
      let rangeDuration = '';
      const literalParams: string[] = [];

      // Visit children to extract the inner selector, and collect literal params
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

      // Try to find the matrix selector's duration from the tree
      const matrixCtx = this.findMatrixSelector(ctx);
      if (matrixCtx) {
        const timeRange = matrixCtx.timeRange();
        if (timeRange) {
          rangeDuration = timeRange.duration()?.getText() || '';
        }
      }

      // Param layout must match operation_categories paramNames order:
      // quantile_over_time: [Quantile, Range] — literal before range
      // holt_winters: [Range, Smoothing, Trend] — range before literals
      // predict_linear: [Range, Seconds] — range before literals
      // others: [Range]
      const opParams =
        fnName === 'quantile_over_time'
          ? [...literalParams, rangeDuration]
          : [rangeDuration, ...literalParams];

      this.operations.push({ id: fnName, name: fnName, params: opParams });
    } else {
      // For functions like histogram_quantile(0.95, expr), abs(expr), etc.
      const fnParams: string[] = [];

      for (const param of params) {
        // If param is a literal (number/string), capture it
        const literal = param.literal?.();
        if (literal) {
          let text = literal.getText();
          // Strip surrounding quotes from string literals
          if (
            (text.startsWith('"') && text.endsWith('"')) ||
            (text.startsWith("'") && text.endsWith("'"))
          ) {
            text = text.slice(1, -1);
          }
          fnParams.push(text);
        } else {
          // It's a sub-expression — visit it to extract selector/ops
          this.visit(param);
        }
      }

      // Ensure functions always have their expected number of params
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

    // Extract numeric params (e.g., topk(5, ...) → ['5'])
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
          // Sub-expression — visit to extract inner selector
          this.visit(param);
        }
      }
    }

    // Extract by/without clause
    let grouping: OperationGrouping | undefined;
    const byCtx = ctx.by();
    const withoutCtx = ctx.without();
    if (byCtx) {
      const labels =
        byCtx
          .labelNameList()
          ?.labelName()
          ?.map((ln: any) => ln.getText()) || [];
      grouping = { mode: 'by', labels };
    } else if (withoutCtx) {
      const labels =
        withoutCtx
          .labelNameList()
          ?.labelName()
          ?.map((ln: any) => ln.getText()) || [];
      grouping = { mode: 'without', labels };
    }

    this.operations.push({ id: opName, name: opName, params, grouping });
  };

  visitMatrixSelector = (ctx: any) => {
    // Visit the inner instant selector
    const instantCtx = ctx.instantSelector();
    if (instantCtx) {
      this.visitInstantSelector(instantCtx);
    }
    // Extract range for standalone matrix selectors (no wrapping range function)
    if (!this.insideRangeFunction) {
      const timeRange = ctx.timeRange();
      if (timeRange) {
        this.range = timeRange.duration()?.getText() || '';
      }
    }
  };

  visitOffset = (ctx: any) => {
    // offset is too complex for builder currently
    this.canBuild = false;
  };

  visitParens = (ctx: any) => {
    // Parenthesized expression — just visit the inner expression
    this.visitChildren(ctx);
  };

  private findMatrixSelector(ctx: any): any {
    if (!ctx) return null;
    if (ctx.constructor?.name === 'MatrixSelectorContext') return ctx;
    if (ctx.children) {
      for (const child of ctx.children) {
        const found = this.findMatrixSelector(child);
        if (found) return found;
      }
    }
    return null;
  }
}
