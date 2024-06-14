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
  WhereCommandContext,
  LogicalExpressionContext,
} from '../../../generated/OpenSearchPPLParser';
import { PPLNode } from '../node';
import { OpenSearchPPLParserVisitor } from '../../../generated/OpenSearchPPLParserVisitor';
import { LogicalExpression } from '../tree/logical_expression';

type VisitResult = PPLNode | PPLNode[] | string;

export class TimeAstBuilder
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
      if (childCtx instanceof WhereCommandContext) {
        return this.visitWhereCommand(childCtx);
      }
    }
    return this.defaultResult();
  }

  visitWhereCommand(ctx: WhereCommandContext): PPLNode {
    for (const childCtx of ctx.children) {
      if (childCtx instanceof LogicalExpressionContext) {
        return this.visitLogicalExpression(childCtx);
      }
    }
    return this.defaultResult();
  }

  visitLogicalExpression(ctx: LogicalExpressionContext): PPLNode {
    // return new LogicalExpression();
    // return this.defaultResult();
  }
}
