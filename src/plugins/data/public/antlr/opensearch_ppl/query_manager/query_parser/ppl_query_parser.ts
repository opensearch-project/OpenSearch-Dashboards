/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLSyntaxParser } from '../antlr/ppl_syntax_parser';
import { OpenSearchPPLParser } from '../../generated/OpenSearchPPLParser';
import { AstBuilderConfigs, ParsingCommand, StatsAstBuilder } from '../ast/builder/stats_ast_builder';

export interface ParsedTokens {
  logicalExpression?: LogicalComparisonExpression | LogicalAndExpression | LogicalOrExpression;
  pplCommands?: string;
}

export interface LogicalComparisonExpression {
  leftValue: EvaluationFunction | string;
  rightValue: EvaluationFunction | string;
  operator: string;
}

export interface CommonCompararisonExpression {
  left: string;
  right: string;
  operator: string;
}

export interface LogicalAndExpression extends CommonCompararisonExpression {}

export interface LogicalOrExpression extends CommonCompararisonExpression {}

export interface EvaluationFunction {
  function: string;
  args: string[];
}

export class PPLQueryParser {
  parser: OpenSearchPPLParser | null = null;
  visitor: any = null;
  rawQuery: string = '';

  parse(pplQuery: string) {
    this.rawQuery = pplQuery;
    this.parser = new PPLSyntaxParser().parse(this.rawQuery);
    return this;
  }

  getParsedTokens(): ParsedTokens | null {
    this.visitor = new StatsAstBuilder();
    let inter = null;
    try {
      inter = this.visitor.visitRoot(this.parser!.root()).getTokens();
    } catch (e) {
      console.error(e);
    }
    return inter;
  }
}
