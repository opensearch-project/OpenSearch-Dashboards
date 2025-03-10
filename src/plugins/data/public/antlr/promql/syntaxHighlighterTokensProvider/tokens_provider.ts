/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { CharStream, CommonTokenStream, ParserRuleContext, TerminalNode, Token } from 'antlr4ng';
import { PromQLLexer } from '../.generated/PromQLLexer';
import { PromQLParser } from '../.generated/PromQLParser';
import { PromQLParserVisitor } from '../.generated/PromQLParserVisitor';

export class PromQLState implements monaco.languages.IState {
  clone() {
    return new PromQLState();
  }

  equals(other: any) {
    return true;
  }
}

export class PromQLTokensProvider implements monaco.languages.TokensProvider {
  getInitialState(): monaco.languages.IState {
    return new PromQLState();
  }

  tokenize(line: string, state: monaco.languages.IState): monaco.languages.ILineTokens {
    const inputStream = CharStream.fromString(line);
    const lexer = new PromQLLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new PromQLParser(tokenStream);
    parser.removeErrorListeners();
    const tree = parser.expression();

    const tokenClassifier = new TokenClassifier();
    const tokens = tokenClassifier.visit(tree);

    if (!tokens) {
      throw new Error('yea');
    }

    return {
      tokens: tokens.map((token) => {
        return { startIndex: token.token.start, scopes: token.classification ?? '' };
      }),
      endState: new PromQLState(),
    };
  }
}

const classificationSymbols: { [key: number]: string } = {
  [PromQLParser.EQ]: 'operator.logical',
  [PromQLParser.GT]: 'operator.logical',
  [PromQLParser.GE]: 'operator.logical',
  [PromQLParser.LT]: 'operator.logical',
  [PromQLParser.LE]: 'operator.logical',
  [PromQLParser.AND]: 'operator.boolean',
  [PromQLParser.OR]: 'operator.boolean',
  [PromQLParser.LEFT_BRACE]: 'delimiter.parenthesis',
  [PromQLParser.RIGHT_BRACE]: 'delimiter.parenthesis',
  [PromQLParser.STRING]: 'string',
};

const classificationRules: { [key: number]: string } = {
  [PromQLParser.RULE_metricName]: 'token',
  [PromQLParser.RULE_functionNames]: 'variable',
};

interface TokenClassification {
  token: Token;
  classification: string | undefined;
}

// finds the most relevant rule or type for a given token
class TokenClassifier extends PromQLParserVisitor<TokenClassification[]> {
  visitTerminal(node: TerminalNode): [TokenClassification] {
    const classification = classificationSymbols[node.getSymbol().type];
    return [{ token: node.getSymbol(), classification }];
  }

  visitChildren(node: ParserRuleContext): TokenClassification[] {
    const combinedTokens: TokenClassification[] = [];
    for (let i = 0; i < node.getChildCount(); i++) {
      const child = node.getChild(i)!;
      const childResult = child.accept(this)!;

      childResult.forEach((res) => {
        if (!res.classification) {
          // set the classification as the first rule encountered from a terminal node
          combinedTokens.push({ ...res, classification: classificationRules[node.ruleIndex] });
        } else {
          combinedTokens.push(res);
        }
      });
    }
    return combinedTokens;
  }
}
