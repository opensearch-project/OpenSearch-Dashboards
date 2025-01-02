/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, TokenStream } from 'antlr4ng';
import { CodeCompletionCore } from 'antlr4-c3';
import { monaco } from '@osd/monaco';
import { DQLLexer } from './.generated/DQLLexer';
import {
  DQLParser,
  GroupContentContext,
  GroupExpressionContext,
  KeyValueExpressionContext,
} from './.generated/DQLParser';
import { getTokenPosition } from '../shared/cursor';
import { IndexPattern, IndexPatternField } from '../../index_patterns';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { DQLParserVisitor } from './.generated/DQLParserVisitor';
import { IDataPluginServices } from '../..';
import { fetchFieldSuggestions } from '../shared/utils';
import { SuggestionItemDetailsTags } from '../shared/constants';

const findCursorIndex = (
  tokenStream: TokenStream,
  cursorColumn: number,
  cursorLine: number
): number | undefined => {
  for (let i = 0; i < tokenStream.size; i++) {
    const token = tokenStream.get(i);
    const { startLine, endColumn, endLine } = getTokenPosition(token, DQLParser.WS);

    const moveToNextToken = [DQLParser.WS, DQLParser.EQ, DQLParser.LPAREN];
    if (endLine > cursorLine || (startLine === cursorLine && endColumn >= cursorColumn)) {
      if (moveToNextToken.includes(tokenStream.get(i).type)) {
        return i + 1;
      }
      return i;
    }
  }

  return undefined;
};

const findValueSuggestions = async (
  index: IndexPattern,
  field: string,
  value: string,
  services: IDataPluginServices,
  boolFilter?: any,
  signal?: AbortSignal
) => {
  // check to see if last field is within index and if it can suggest values, first check
  // if .keyword appended field exists because that has values
  const matchedField =
    index.fields.find((idxField: IndexPatternField) => {
      // check to see if the field matches another field with .keyword appended
      if (idxField.name === `${field}.keyword`) return idxField;
    }) ||
    index.fields.find((idxField: IndexPatternField) => {
      // if the display name matches, return
      if (idxField.name === field) return idxField;
    });

  if (!matchedField) return;

  return await services?.data.autocomplete.getValueSuggestions({
    indexPattern: index,
    field: matchedField,
    query: value,
    boolFilter,
    signal,
  });
};

export const getSuggestions = async ({
  query,
  indexPattern,
  position,
  selectionEnd,
  services,
  boolFilter,
  signal,
}: QuerySuggestionGetFnArgs): Promise<QuerySuggestion[]> => {
  if (
    !services ||
    !services.appName ||
    // TODO: might need to get language then pass here paul needs this to prevent this failing on other pages
    // !getQueryService()
    //   .queryString.getLanguageService()
    //   .supportsEnhancementsEnabled(services.appName) ||
    !indexPattern
  ) {
    return [];
  }
  try {
    const inputStream = CharStream.fromString(query);
    const lexer = new DQLLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new DQLParser(tokenStream);
    parser.removeErrorListeners();
    const tree = parser.query();

    // find token index
    const cursorColumn = position?.column !== undefined ? position.column - 1 : selectionEnd;
    const cursorLine = position?.lineNumber ?? 1;

    const cursorIndex = findCursorIndex(tokenStream, cursorColumn, cursorLine) ?? 0;

    const core = new CodeCompletionCore(parser);

    // specify preferred rules to appear in candidate collection
    core.preferredRules = new Set([DQLParser.RULE_field]);

    // specify tokens to ignore
    core.ignoredTokens = new Set([DQLParser.LPAREN, DQLParser.RPAREN]);

    // gets candidates at specified token index
    const candidates = core.collectCandidates(cursorIndex);

    // manually remove NOT from candidates when cursor is in a phrase
    if (tokenStream.get(cursorIndex).type === DQLParser.PHRASE) {
      candidates.tokens.delete(DQLParser.NOT);
    }

    const completions: QuerySuggestion[] = [];

    // check to see if field rule is a candidate. if so, suggest field names
    if (candidates.rules.has(DQLParser.RULE_field)) {
      completions.push(
        ...fetchFieldSuggestions(indexPattern, (field: string) => {
          const indexField = indexPattern.getFieldByName(field);
          if (indexField && ['boolean', 'string'].includes(indexField.type)) {
            return `${field} : `;
          }
          return `${field} `;
        })
      );
    }

    interface FoundLastValue {
      field: string | undefined;
      value: string | undefined;
    }

    // visitor for parsing the current query
    class QueryVisitor extends DQLParserVisitor<FoundLastValue> {
      public defaultResult = () => {
        return { field: undefined, value: undefined };
      };

      public aggregateResult = (aggregate: FoundLastValue, nextResult: FoundLastValue) => {
        if (nextResult.field) {
          return nextResult;
        }
        return aggregate;
      };

      public visitKeyValueExpression = (ctx: KeyValueExpressionContext) => {
        const startPos = ctx.start?.start ?? -1;
        let endPos = ctx.stop?.stop ?? -1;

        // find the WS token after the last KV token, pushing endPos out if applicable
        const { stop: lastKVToken } = ctx.getSourceInterval();
        if (tokenStream.get(lastKVToken + 1).type === DQLParser.WS) {
          endPos = tokenStream.get(lastKVToken + 1).stop;
        }

        // early return if the cursor is not within the bounds of this KV pair
        if (!(startPos <= cursorColumn && endPos + 1 >= cursorColumn))
          return { field: undefined, value: undefined };

        // keep as empty string to intentionally return so if no value is found in value()
        let foundValue = '';
        const getTextWithoutQuotes = (text: string | undefined) =>
          text?.replace(/^["']|["']$/g, '');

        if (ctx.value()?.PHRASE()) {
          const phraseText = getTextWithoutQuotes(ctx.value()?.PHRASE()?.getText());
          if (phraseText) foundValue = phraseText;
        } else if (ctx.value()?.tokenSearch()) {
          const valueText = ctx.value()?.getText();
          if (valueText) foundValue = valueText;
        } else if (ctx.groupExpression()) {
          // continue calls down the tree for value group expressions
          const groupRes = this.visitGroupExpression(ctx.groupExpression()!);
          // only pull value off of groupRes, field should be undefined
          const lastGroupContent = getTextWithoutQuotes(groupRes.value);
          if (lastGroupContent) foundValue = lastGroupContent;
        }
        return { field: ctx.field().getText(), value: foundValue };
      };

      public visitGroupExpression = (ctx: GroupExpressionContext) => {
        let foundValue = '';

        // within the multiple group contents, call visitor on each one
        ctx.groupContent().forEach((child) => {
          const ret = this.visitGroupContent(child);
          if (ret.value) foundValue = ret.value;
        });

        return { field: undefined, value: foundValue };
      };

      public visitGroupContent = (ctx: GroupContentContext) => {
        const startPos = ctx.start?.start ?? -1;
        const endPos = ctx.stop?.stop ?? -1;

        // NOTE: currently there is no support to look for tokens after whitespace, only
        // returning if the cursor is directly touching a token

        if (!(startPos <= cursorColumn && endPos + 1 >= cursorColumn))
          return { field: undefined, value: undefined };

        // trigger group expression to find content within
        const foundValue = !!ctx.groupExpression()
          ? this.visitGroupExpression(ctx.groupExpression()!).value
          : ctx.getText();

        return { field: undefined, value: foundValue };
      };
    }

    const visitor = new QueryVisitor();
    // find suggested values for the last found field (only for kvexpression rule)
    const { field: lastField = '', value: lastValue = '' } = visitor.visit(tree) ?? {};
    if (!!lastField && candidates.tokens.has(DQLParser.PHRASE)) {
      const values = await findValueSuggestions(
        indexPattern,
        lastField,
        lastValue ?? '',
        services,
        boolFilter,
        signal
      );
      if (!!values) {
        completions.push(
          ...values?.map((val: any) => {
            return {
              text: val,
              type: monaco.languages.CompletionItemKind.Value,
              detail: SuggestionItemDetailsTags.Value,
              replacePosition: new monaco.Range(
                cursorLine,
                cursorColumn - lastValue.length + 1,
                cursorLine,
                cursorColumn + 1
              ),
              insertText: `"${val}" `,
            };
          })
        );
      }
    }

    const booleanOperators = new Set([DQLParser.AND, DQLParser.OR, DQLParser.NOT]);
    const relationalOperators = new Set([
      DQLParser.EQ,
      DQLParser.GE,
      DQLParser.GT,
      DQLParser.LE,
      DQLParser.LT,
    ]);

    // suggest other candidates, mainly keywords
    [...candidates.tokens.keys()].forEach((token: number) => {
      // ignore identifier, already handled with field rule
      if (token === DQLParser.ID || token === DQLParser.PHRASE) {
        return;
      }

      const tokenSymbolName = relationalOperators.has(token)
        ? parser.vocabulary.getDisplayName(token)?.replace(/'/g, '')
        : parser.vocabulary.getSymbolicName(token)?.toLowerCase();

      if (tokenSymbolName) {
        let type = monaco.languages.CompletionItemKind.Keyword;
        let detail = SuggestionItemDetailsTags.Keyword;

        if (booleanOperators.has(token) || relationalOperators.has(token)) {
          type = monaco.languages.CompletionItemKind.Operator;
          detail = SuggestionItemDetailsTags.Operator;
        }

        completions.push({
          text: tokenSymbolName,
          type,
          detail,
          insertText: `${tokenSymbolName} `,
        });
      }
    });

    return completions;
  } catch {
    return [];
  }
};
