/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParserRuleContext, ParseTree } from 'antlr4ng';
import { InstantSelectorContext, LabelMatcherContext } from './.generated/PromQLParser';
import { PromQLParserVisitor } from './.generated/PromQLParserVisitor';

export interface InstantSelectorResult {
  metricName: string | undefined;
  labelName: string | undefined;
}

/**

Instant Selector Format:

                       ┌───────────────┐                           
                       │instantSelector│                           
                       └───────┬───────┘                           
                ┌──────────────┴────────────┐                      
                ▼                           ▼                      
         ┌───────────┐              ┌────────────────┐             
         │metricName?│              │labelMatcherList│             
         └───────────┘              └───────┬────────┘             
                                            │                      
                               ┌────────────┴──────────┬─ ─ ─ ─ ─ ─
                               ▼                       ▼           
                          ┌────────────┐         ┌────────────┐     
                          │labelMatcher│         │labelMatcher│     
                          └─────┬──────┘         └────────────┘     
                                │                                   
           ┌────────────────────┼──────────────────┐                
           ▼                    ▼                  ▼                
        ┌─────────┐  ┌────────────────────┐  ┌──────────┐           
        │labelName│  │labelMatcherOperator│  │labelValue│           
        └─────────┘  └────────────────────┘  └──────────┘      

Assuming the cursor is within a particular labelMatcher group (only considering this scenario
since labelName and labelValue are the preferred rules here), There will be 0 or 1 metric names
and 0 or 1 label names. 
This is the reasoning behind why InstantSelectorResult and the Visitor implementation is as below
 */

export class InstantSelectorVisitor extends PromQLParserVisitor<InstantSelectorResult> {
  cursorIndex: number;

  constructor(cursorIndex: number) {
    super();
    this.cursorIndex = cursorIndex;
  }

  public defaultResult = () => {
    return { metricName: undefined, labelName: undefined };
  };

  public aggregateResult = (
    aggregate: InstantSelectorResult,
    nextResult: InstantSelectorResult
  ) => {
    // if the aggregate's field doesn't contain a value, replace it with that of nextResult
    if (!aggregate.metricName) {
      aggregate.metricName = nextResult.metricName;
    }
    if (!aggregate.labelName) {
      aggregate.labelName = nextResult.labelName;
    }
    return aggregate;
  };

  // the instant selector will contain the cursor, the metric name wouldn't. so to get the relevant
  // metric name from a particular labelName or labelValue, we'll need to stop at the instant selector
  public visitInstantSelector = (ctx: InstantSelectorContext) => {
    const result: InstantSelectorResult = this.defaultResult();

    if (contextContainsCursor(ctx, this.cursorIndex)) {
      result.metricName = ctx.metricName()?.getText();
    }

    if (ctx.labelMatcherList() !== null) {
      const nextResult: InstantSelectorResult | null = this.visit(ctx.labelMatcherList()!);
      return this.aggregateResult(result, nextResult ?? this.defaultResult());
    }

    return result;
  };

  public visitLabelMatcher = (ctx: LabelMatcherContext) => {
    const result: InstantSelectorResult = this.defaultResult();

    if (contextContainsCursor(ctx, this.cursorIndex)) {
      result.labelName = ctx.labelName()?.getText();
    }

    return result;
  };
}

export const contextContainsCursor = (ctx: ParserRuleContext, cursorIndex: number) => {
  const startPos = ctx.start?.start ?? -1;
  const endPos = ctx.stop?.stop ?? -1;

  if (startPos === -1 || endPos === -1) return false; // early return if either position is "not implemented"

  return startPos <= cursorIndex && endPos + 1 >= cursorIndex;
};

export const getNamesFromInstantSelector = (
  cursorIndex: number,
  ast: ParseTree
): InstantSelectorResult => {
  const instantSelectorVisitor = new InstantSelectorVisitor(cursorIndex);
  return instantSelectorVisitor.visit(ast) ?? { metricName: undefined, labelName: undefined };
};
