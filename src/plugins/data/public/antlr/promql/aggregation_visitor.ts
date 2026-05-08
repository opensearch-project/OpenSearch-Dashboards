/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParserRuleContext, ParseTree } from 'antlr4ng';
import {
  AggregationContext,
  LabelNameListContext,
  MetricNameContext,
  ParameterListContext,
  PromQLParser,
  PromQLParserVisitor,
} from '@osd/antlr-grammar';

/**
TODO: Explain how we're getting metric from aggregation
 */

export class AggregationVisitor extends PromQLParserVisitor<string | null> {
  cursorIndex: number;
  withinCorrectAggregation: boolean;

  constructor(cursorIndex: number) {
    super();
    this.cursorIndex = cursorIndex;
    this.withinCorrectAggregation = false;
  }

  public defaultResult = () => {
    return null;
  };

  public aggregateResult = (aggregate: string | null, nextResult: string | null) => {
    return aggregate ?? nextResult;
  };

  public visitLabelNameList = (ctx: LabelNameListContext) => {
    if (!this.withinCorrectAggregation && contextContainsCursor(ctx, this.cursorIndex)) {
      const aggregation = ctx.parent?.parent;
      if (aggregation?.ruleIndex === PromQLParser.RULE_aggregation) {
        this.withinCorrectAggregation = true;
        return this.visitChildren((aggregation as AggregationContext).parameterList());
      }
    }
    return null;
  };

  public visitParameterList = (ctx: ParameterListContext) => {
    if (this.withinCorrectAggregation) {
      const lastParameter = ctx.parameter().at(-1);
      if (lastParameter) {
        return this.visitChildren(lastParameter);
      }
    }
    return null;
  };

  public visitMetricName = (ctx: MetricNameContext) => {
    if (this.withinCorrectAggregation) {
      this.withinCorrectAggregation = false;
      return ctx.getText();
    }
    return null;
  };
}

// TODO: move this to utils w/ instant selector's
// TODO: look into turning this into just a token based thing instead of cursor index
export const contextContainsCursor = (ctx: ParserRuleContext, cursorIndex: number) => {
  const startPos = ctx.start?.start ?? -1;
  const endPos = ctx.stop?.stop ?? -1;

  if (startPos === -1 || endPos === -1) return false; // early return if either position is "not implemented"

  return startPos <= cursorIndex && endPos + 1 >= cursorIndex;
};

export const getMetricFromAggregation = (cursorIndex: number, ast: ParseTree): string | null => {
  const aggregationVisitor = new AggregationVisitor(cursorIndex);
  return aggregationVisitor.visit(ast);
};
