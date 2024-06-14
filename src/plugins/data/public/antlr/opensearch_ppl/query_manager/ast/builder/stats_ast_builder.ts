/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AbstractParseTreeVisitor, ParserRuleContext, TerminalNode } from 'antlr4ng';
import {
  RootContext,
  PplStatementContext,
  CommandsContext,
  StatsCommandContext,
  BooleanLiteralContext,
  BySpanClauseContext,
  FieldExpressionContext,
  FieldListContext,
  IntegerLiteralContext,
  LiteralValueContext,
  QualifiedNameContext,
  SpanClauseContext,
  StatsAggTermContext,
  StatsByClauseContext,
  StatsFunctionContext,
  StatsFunctionNameContext,
  StringLiteralContext,
  TimespanUnitContext,
  ValueExpressionContext,
  WcFieldExpressionContext,
  DmlStatementContext,
  QueryStatementContext,
  PercentileAggFunctionContext,
  TakeAggFunctionCallContext,
  WhereCommandContext,
  ComparisonExpressionContext,
  BooleanExpressionContext,
  RelevanceExpressionContext,
  LogicalExpressionContext,
  PplCommandsContext,
  LogicalAndContext,
  ComparsionContext,
  LogicalOrContext,
  PrimaryExpressionContext,
  DataTypeFunctionCallContext,
  EvalFunctionCallContext,
  TimestampFunctionContext,
  FunctionArgContext,
  EvalFunctionNameContext,
  FunctionArgsContext,
  ValueExpressionDefaultContext,
  IntervalLiteralContext,
} from '../../../generated/OpenSearchPPLParser';
import { OpenSearchPPLParserVisitor } from '../../../generated/OpenSearchPPLParserVisitor';
import { PPLNode, Tokens } from '../node';
import { Aggregations } from '../tree/aggragations';
import {
  AggregateFunction,
  AggregateTerm,
  GroupBy,
  Field,
  Span,
  SpanExpression,
} from '../expression';
import { Filter } from '../tree/filter';
import { ComparisonExpression } from '../expression/comparison_expression';
import { QueryStatement } from '../tree/query_statement';
import { LogicalAnd } from '../expression/logical_and';
import { LogicalOr } from '../expression/logical_or';
import { EvalFunctionCall } from '../expression/eval_function_call';
import { DefaultNode } from '../expression/default_node';
import { IntervalLiteral } from '../expression/interval_literal';

type VisitResult = PPLNode | PPLNode[] | string | string[];

export class StatsAstBuilder
  extends AbstractParseTreeVisitor<VisitResult>
  implements OpenSearchPPLParserVisitor<VisitResult> {
  protected defaultResult(): PPLNode {
    return new DefaultNode({ name: 'default', children: [] as PPLNode[] });
  }

  visitRoot(ctx: RootContext) {
    if (!ctx.pplStatement()) return this.defaultResult();
    return this.visitPplStatement(ctx.pplStatement()!);
  }

  visitPplStatement(ctx: PplStatementContext): PPLNode {
    const childCtx = ctx.getChild(0);
    return childCtx instanceof DmlStatementContext
      ? this.visitDmlStatement(childCtx)
      : this.defaultResult();
  }

  visitDmlStatement(ctx: DmlStatementContext): PPLNode {
    const childCtx = ctx.getChild(0);
    return childCtx instanceof QueryStatementContext
      ? this.visitQueryStatement(childCtx)
      : this.defaultResult();
  }

  visitQueryStatement(ctx: QueryStatementContext): PPLNode {
    let pplCommands: PPLNode = this.defaultResult();
    let commands: PPLNode[] = [];
    ctx.children.forEach((childCtx) => {
      if (childCtx instanceof PplCommandsContext) {
        pplCommands = this.visitPplCommands(childCtx);
      } else if (childCtx instanceof CommandsContext) {
        commands.push(this.visitCommands(childCtx));
      }
    });

    return new QueryStatement({
      name: 'query_statement',
      children: [],
      pplCommands,
      commands,
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitPplCommands(ctx: PplCommandsContext): string {
    return ctx.getText();
  }

  visitCommands(ctx: CommandsContext): VisitResult {
    const childCtx = ctx.getChild(0);
    if (childCtx instanceof StatsCommandContext) {
      return this.visitStatsCommand(childCtx);
    } else if (childCtx instanceof WhereCommandContext) {
      return this.visitWhereCommand(childCtx);
    }

    // TODO: Implement other command types

    return this.visitChildren(ctx) ?? [];
  }

  /**
   * Where command
   */
  visitWhereCommand(ctx: WhereCommandContext): PPLNode {
    let logicalExpression: PPLNode = this.defaultResult();
    ctx.children.forEach((childCtx) => {
      if (childCtx instanceof LogicalAndContext) {
        logicalExpression = this.visitLogicalAnd(childCtx);
      } else if (childCtx instanceof ComparsionContext) {
        logicalExpression = this.visitComparision(childCtx);
      } else if (childCtx instanceof LogicalOrContext) {
        logicalExpression = this.visitLogicalOr(childCtx);
      }
    });

    return new Filter({
      name: 'where_command',
      childern: [] as PPLNode[],
      logicalExpr: logicalExpression as PPLNode,
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitLogicalOr(ctx: LogicalOrContext): PPLNode {
    const logicalOrExpressions: PPLNode[] = [];
    let operator: string = '';
    ctx.children.forEach((childCtx) => {
      if (childCtx instanceof ComparsionContext) {
        logicalOrExpressions.push(this.visitComparision(childCtx));
      } else if (childCtx instanceof TerminalNode) {
        operator = childCtx.getText();
      }
    });

    return new LogicalOr({
      name: 'logical_or',
      children: [] as PPLNode[],
      operator,
      left: logicalOrExpressions[0] as PPLNode,
      right: logicalOrExpressions[1] as PPLNode,
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitLogicalAnd(ctx: LogicalAndContext): PPLNode {
    let operator: string = '';
    let logicalAndExpressions: PPLNode[] = [];
    ctx.children.forEach((childCtx) => {
      if (childCtx instanceof ComparsionContext) {
        logicalAndExpressions.push(this.visitComparision(childCtx));
      } else if (childCtx instanceof TerminalNode) {
        operator = childCtx.getText();
      }
    });

    return new LogicalAnd({
      name: 'logical_and',
      children: [] as PPLNode[],
      operator,
      left: logicalAndExpressions[0] as PPLNode,
      right: logicalAndExpressions[1] as PPLNode,
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitComparision(ctx: ComparsionContext): PPLNode {
    return this.visitComparisonExpression(ctx.getChild(0) as ComparisonExpressionContext);
  }

  visitLogicalExpression(ctx: LogicalExpressionContext): VisitResult {
    return this.visitChildren(ctx)!;
  }

  visitRelevanceExpression(ctx: RelevanceExpressionContext): VisitResult {
    return this.visitChildren(ctx)!;
  }

  visitComparisonExpression(ctx: ComparisonExpressionContext): PPLNode {
    // TODO: Implement this method to include value IN
    return new ComparisonExpression({
      name: 'comparison_expression',
      children: [],
      leftValue: this.visitValueExpression(ctx.getChild(0) as ValueExpressionContext) as string,
      rightValue: this.visitValueExpression(ctx.getChild(2) as ValueExpressionContext) as string,
      operator: ctx.getChild(1)?.getText() as string,
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitBooleanExpression(ctx: BooleanExpressionContext): VisitResult {
    return this.visitChildren(ctx) as VisitResult;
  }

  /**
   * Stats command
   */
  visitStatsCommand(ctx: StatsCommandContext): PPLNode {
    let groupBy: GroupBy = {};
    let aggregationList: PPLNode[] = [];
    ctx.children.forEach((childCtx) => {
      if (childCtx instanceof StatsByClauseContext) {
        groupBy = this.visitStatsByClause(childCtx);
      } else if (childCtx instanceof StatsAggTermContext) {
        aggregationList.push(this.visitStatsAggTerm(childCtx));
      }
    });

    return new Aggregations({
      name: 'stats_command',
      children: [] as PPLNode[],
      partitions: (this.visitChildren(ctx) as string) || '',
      allNum: (this.visitChildren(ctx) as string) || '',
      delim: (this.visitChildren(ctx) as string) || '',
      aggExprList: aggregationList,
      // aggExprList: ctx
      //   .statsAggTerm()
      //   .map((aggTermAlternative) => this.visitStatsAggTerm(aggTermAlternative)),
      // groupExprList: ctx.statsByClause()
      //   ? this.visitStatsByClause(ctx.statsByClause()!)
      //   : ({} as GroupBy),
      groupExprList: groupBy,
      dedupSplitValue: (this.visitChildren(ctx) as string) || '',
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitIntegerLiteral(ctx: IntegerLiteralContext): string {
    return ctx.getText();
  }

  visitBooleanLiteral(ctx: BooleanLiteralContext): string {
    return ctx.getText();
  }

  visitStringLiteral(ctx: StringLiteralContext): string {
    return ctx.getText();
  }

  visitStatsAggTerm(ctx: StatsAggTermContext): PPLNode {
    return new AggregateTerm({
      name: 'stats_agg_term',
      children: [] as PPLNode[],
      func: this.visitStatsFunction(ctx.statsFunction()),
      field: ctx.wcFieldExpression() ? this.visitWcFieldExpression(ctx.wcFieldExpression()!) : '',
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitWcFieldExpression(ctx: WcFieldExpressionContext): string {
    // return only text from here to all its chilren for now
    return ctx.wcQualifiedName().getText();
  }

  visitStatsByClause(ctx: StatsByClauseContext): PPLNode {
    let fields: PPLNode[] = [];
    let spanClause: PPLNode = {};
    ctx.children.forEach((childCtx) => {
      if (childCtx instanceof FieldListContext) {
        fields = this.visitFieldList(childCtx);
      } else if (childCtx instanceof BySpanClauseContext) {
        spanClause = this.visitBySpanClause(childCtx);
      }
    });
    return new GroupBy({
      name: 'stats_by_clause',
      children: [] as PPLNode[],
      fields,
      // fields: ctx.fieldList() ? this.visitFieldList(ctx.fieldList()!) : [],
      // span: ctx.bySpanClause() ? this.visitBySpanClause(ctx.bySpanClause()!) : ({} as Span),
      span: spanClause,
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitBySpanClause(ctx: BySpanClauseContext): PPLNode {
    return new Span({
      name: 'span',
      children: [] as PPLNode[],
      spanClause: this.visitSpanClause(ctx.spanClause()),
      qualifiedName: ctx.qualifiedName() ? this.visitQualifiedName(ctx.qualifiedName()!) : '',
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitSpanClause(ctx: SpanClauseContext): PPLNode {
    return new SpanExpression({
      name: 'span_clause',
      children: [] as PPLNode[],
      fieldExpression: this.visitFieldExpression(ctx.fieldExpression()),
      literalValue: this.visitLiteralValue(ctx.literalValue()),
      timeUnit: ctx.timespanUnit() ? this.visitTimespanUnit(ctx.timespanUnit()!) : '',
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitLiteralValue(ctx: LiteralValueContext): VisitResult {
    const childCtx = ctx.getChild(0);
    if (childCtx instanceof IntervalLiteralContext) {
      return this.visitIntervalLiteral(childCtx);
    }
    return ctx.getText();
  }

  visitIntervalLiteral(ctx: IntervalLiteralContext): VisitResult {
    const typeLiteral = ctx.getChild(0)?.getText() ?? '';
    const value = ctx.getChild(1)?.getText() ?? '';
    const unit = ctx.getChild(2)?.getText() ?? '';

    return new IntervalLiteral({
      name: 'interval_literal',
      children: [] as PPLNode[],
      typeLiteral,
      value,
      unit,
      indices: { start: ctx.start?.start, end: ctx.stop },
    });
  }

  visitTimespanUnit(ctx: TimespanUnitContext): string {
    return ctx.getText();
  }

  visitStatsFunction(ctx: StatsFunctionContext): PPLNode {
    let funcName = '';
    let valueExpr: PPLNode;
    let percentileAggFunction = '';
    let takeAggFunction = '';

    ctx.children.forEach((childCtx) => {
      if (childCtx instanceof ValueExpressionContext) {
        valueExpr = this.visitValueExpression(childCtx);
      } else if (childCtx instanceof StatsFunctionNameContext) {
        funcName = this.visitStatsFunctionName(childCtx);
      } else if (childCtx.getText() === 'count') {
        funcName = 'count';
      } else if (childCtx instanceof PercentileAggFunctionContext) {
        percentileAggFunction = this.visitePercentileAggFunction(childCtx);
      } else if (childCtx instanceof TakeAggFunctionCallContext) {
        takeAggFunction = this.visitTakeAggFunctionCall(childCtx);
      } else if (childCtx.getText() === 'distinct_count' || childCtx.getText() === 'dc') {
        funcName = childCtx.getText();
      }
    });

    return new AggregateFunction({
      name: 'stats_function',
      children: [] as PPLNode[],
      statsFunctionName: funcName,
      valueExpression: valueExpr,
      percentileAggFunction: percentileAggFunction,
      takeAggFunction: takeAggFunction,
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitePercentileAggFunction(pc: PercentileAggFunctionContext) {
    return pc.getText();
  }

  visitTakeAggFunctionCall(take: TakeAggFunctionCallContext) {
    return take.getText();
  }

  visitValueExpression(ctx: ValueExpressionContext): VisitResult {
    const childCtx = ctx.getChild(0);
    if (childCtx instanceof PrimaryExpressionContext) {
      return this.visitPrimaryExpression(childCtx as PrimaryExpressionContext);
    } else if (childCtx instanceof TimestampFunctionContext) {
      return this.visitTimestampFunction(childCtx as TimestampFunctionContext);
    }
    return this.visitChildren(ctx) as VisitResult;
  }

  visitTimestampFunction(ctx: TimestampFunctionContext): string {
    return ctx.getText();
  }

  visitPrimaryExpression(ctx: PrimaryExpressionContext): VisitResult {
    const childCtx = ctx.getChild(0);
    if (childCtx instanceof LiteralValueContext) {
      return this.visitLiteralValue(childCtx as LiteralValueContext);
    } else if (childCtx instanceof FieldExpressionContext) {
      return this.visitFieldExpression(childCtx as FieldExpressionContext);
    } else if (childCtx instanceof DataTypeFunctionCallContext) {
      return this.visitDataTypeFunctionCall(childCtx as DataTypeFunctionCallContext);
    } else if (childCtx instanceof EvalFunctionCallContext) {
      return this.visitEvalFunctionCall(childCtx as EvalFunctionCallContext);
    }
    return ctx.getText();
  }

  visitEvalFunctionCall(ctx: EvalFunctionCallContext): VisitResult {
    let terminateNodes: string[] = [];
    let functionName: string = ''; // Initialize with an empty string
    let functionArgs: string[] = [];
    ctx.children.forEach((childCtx) => {
      if (childCtx instanceof TerminalNode) {
        terminateNodes.push(childCtx.getText());
      } else if (childCtx instanceof FunctionArgsContext) {
        functionArgs = [...(this.visitFunctionArgs(childCtx) as string[])];
      } else if (childCtx instanceof EvalFunctionNameContext) {
        functionName = childCtx.getText();
      }
    });

    return new EvalFunctionCall({
      name: 'eval_function_call',
      children: [] as PPLNode[],
      terminateNodes,
      functionName,
      args: functionArgs,
      indices: { start: ctx.start?.start, end: ctx.stop?.stop },
    });
  }

  visitFunctionArgs(ctx: FunctionArgsContext): VisitResult {
    const args: string[] = [];
    ctx.children.forEach((childCtx) => {
      if (childCtx instanceof FunctionArgContext) {
        args.push(this.visitFunctionArg(childCtx));
      }
    });
    return args;
  }

  visitFunctionArg(ctx: FunctionArgContext): VisitResult {
    const childCtx = ctx.getChild(0);
    if (childCtx instanceof ValueExpressionDefaultContext) {
      return this.visitValueExpressionDefault(childCtx);
    }
    return ctx.getText();
  }

  visitValueExpressionDefault(ctx: ValueExpressionDefaultContext): VisitResult {
    const childCtx = ctx.getChild(0);
    if (childCtx instanceof PrimaryExpressionContext) {
      return this.visitPrimaryExpression(childCtx);
    }
    return ctx.getText();
  }

  visitDataTypeFunctionCall(ctx: DataTypeFunctionCallContext): string {
    return ctx.getText();
  }

  visitStatsFunctionName(ctx: StatsFunctionNameContext): string {
    return ctx.getText();
  }

  visitFieldList(ctx: FieldListContext): PPLNode[] {
    let fieldExpression: string = '';
    return ctx.children
      .filter((childCtx) => childCtx instanceof FieldExpressionContext)
      .map((childCtx) => {
        fieldExpression = this.visitFieldExpression(childCtx);
        return new Field({
          name: 'field_list',
          children: [] as PPLNode[],
          fieldExpression: fieldExpression,
          indices: {
            start: childCtx.start?.start,
            end: childCtx.stop?.stop,
          },
        });
      }) as PPLNode[];
  }

  visitFieldExpression(ctx: FieldExpressionContext): string {
    return ctx.getText();
  }

  visitQualifiedName(ctx: QualifiedNameContext): string {
    return ctx.getText();
  }
}
