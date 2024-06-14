/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AbstractParseTreeVisitor } from 'antlr4ng';
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
} from '../../../generated/OpenSearchPPLParser';
import { OpenSearchPPLParserVisitor } from '../../../generated/OpenSearchPPLParserVisitor';
import { PPLNode } from '../node';
import { Aggregations } from '../tree/aggragations';
import {
  AggregateFunction,
  AggregateTerm,
  GroupBy,
  Field,
  Span,
  SpanExpression,
} from '../expression';

type VisitResult = PPLNode | PPLNode[] | string;

export class StatsAstVisitor
  extends AbstractParseTreeVisitor<VisitResult>
  implements OpenSearchPPLParserVisitor<VisitResult> {
  protected defaultResult(): PPLNode {
    return new PPLNode('default', [] as PPLNode[]);
  }

  visitRoot(ctx: RootContext) {
    if (!ctx.pplStatement()) return this.defaultResult();
    return this.visitPplStatement(ctx.pplStatement()!);
  }

  visitPplStatement(ctx: PplStatementContext): PPLNode {
    for (const childCtx of ctx.children) {
      if (childCtx instanceof DmlStatementContext) {
        return this.visitDmlStatement(childCtx);
      }
    }
    return this.defaultResult();
  }

  visitDmlStatement(ctx: DmlStatementContext): PPLNode {
    for (const childCtx of ctx.children) {
      if (childCtx instanceof QueryStatementContext) {
        return this.visitQueryStatement(childCtx);
      }
    }
    return this.defaultResult();
  }

  visitQueryStatement(ctx: QueryStatementContext): PPLNode {
    for (const childCtx of ctx.children) {
      if (childCtx instanceof CommandsContext) {
        return this.visitCommands(childCtx);
      }
    }
    return this.defaultResult();
  }

  visitCommands(ctx: CommandsContext): PPLNode {
    for (const childCtx of ctx.children) {
      if (childCtx instanceof StatsCommandContext) {
        return this.visitStatsCommand(childCtx);
      }
    }
    return this.defaultResult();
  }

  /**
   * Stats command
   */
  visitStatsCommand(ctx: StatsCommandContext): PPLNode {
    return new Aggregations(
      'stats_command',
      [] as PPLNode[],
      ctx.PARTITIONS() && ctx.integerLiteral()
        ? {
            keyword: ctx.PARTITIONS()?.getText(),
            sign: '=',
            value: ctx.integerLiteral()?.getText(),
          }
        : {}, // visit partitions partial
      ctx.ALLNUM() && ctx.booleanLiteral()
        ? {
            keyword: ctx.ALLNUM()?.getText(),
            sign: '=',
            value: this.visitBooleanLiteral(ctx.booleanLiteral()[0]),
          }
        : {}, // visit allnum partial
      ctx.DELIM() && ctx.stringLiteral()
        ? {
            keyword: ctx.DELIM()?.getText(),
            sign: '=',
            value: this.visitStringLiteral(ctx.stringLiteral()!),
          }
        : '', // visit delim partial
      ctx.statsAggTerm().map((aggTermAlternative) => this.visitStatsAggTerm(aggTermAlternative)), // visit statsAggTerm
      ctx.statsByClause() ? this.visitStatsByClause(ctx.statsByClause()!) : ({} as GroupBy), // visit group list
      ctx.DEDUP_SPLITVALUES() && ctx.booleanLiteral()
        ? {
            keyword: ctx.DEDUP_SPLITVALUES()?.getText(),
            sign: '=',
            value: this.visitBooleanLiteral(ctx.booleanLiteral()[1]),
          }
        : '', // visit dedup split value
      {
        start: (ctx as StatsCommandContext & { startIndex: number }).startIndex,
        end: ctx.stop,
      } // stats start/end indices in query for later query concatenation
    );
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
    return new AggregateTerm(
      'stats_agg_term',
      [] as PPLNode[],
      this.visitStatsFunction(ctx.statsFunction()),
      ctx.wcFieldExpression() ? this.visitWcFieldExpression(ctx.wcFieldExpression()!) : ''
    );
  }

  visitWcFieldExpression(ctx: WcFieldExpressionContext): string {
    // return only text from here to all its chilren for now
    return ctx.wcQualifiedName().getText();
  }

  visitStatsByClause(ctx: StatsByClauseContext): PPLNode {
    return new GroupBy(
      'stats_by_clause',
      [] as PPLNode[],
      ctx.fieldList() ? this.visitFieldList(ctx.fieldList()!) : [],
      ctx.bySpanClause() ? this.visitBySpanClause(ctx.bySpanClause()!) : this.defaultResult()
    );
  }

  visitBySpanClause(ctx: BySpanClauseContext): PPLNode {
    return new Span(
      'span_clause',
      [] as PPLNode[],
      this.visitSpanClause(ctx.spanClause()),
      ctx.qualifiedName() ? this.visitQualifiedName(ctx.qualifiedName()!) : ''
    );
  }

  visitSpanClause(ctx: SpanClauseContext): PPLNode {
    return new SpanExpression(
      'span_expression',
      [] as PPLNode[],
      this.visitFieldExpression(ctx.fieldExpression()),
      this.visitLiteralValue(ctx.literalValue()),
      ctx.timespanUnit() ? this.visitTimespanUnit(ctx.timespanUnit()!) : ''
    );
  }

  visitLiteralValue(ctx: LiteralValueContext): string {
    return ctx.getText();
  }

  visitTimespanUnit(ctx: TimespanUnitContext): string {
    return ctx.getText();
  }

  visitStatsFunction(ctx: StatsFunctionContext): PPLNode {
    let funcName = '';
    let valueExpr = '';
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

    return new AggregateFunction(
      'stats_function',
      [] as PPLNode[],
      funcName,
      valueExpr,
      percentileAggFunction,
      takeAggFunction
    );
  }

  visitePercentileAggFunction(pc: PercentileAggFunctionContext) {
    return pc.getText();
  }

  visitTakeAggFunctionCall(take: TakeAggFunctionCallContext) {
    return take.getText();
  }

  visitValueExpression(ctx: ValueExpressionContext): string {
    return ctx.getText();
  }

  visitStatsFunctionName(ctx: StatsFunctionNameContext): string {
    return ctx.getText();
  }

  visitFieldList(ctx: FieldListContext): PPLNode[] {
    return ctx.fieldExpression().map((fieldExprAlternative) => {
      return new Field(
        'field_expression',
        [] as PPLNode[],
        this.visitFieldExpression(fieldExprAlternative)
      );
    });
  }

  visitFieldExpression(ctx: FieldExpressionContext): string {
    return this.visitQualifiedName(ctx.qualifiedName());
  }

  visitQualifiedName(ctx: QualifiedNameContext): string {
    return ctx.getText();
  }
}
