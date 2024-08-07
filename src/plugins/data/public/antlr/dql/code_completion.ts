/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, TokenStream } from 'antlr4ng';
import { CodeCompletionCore } from 'antlr4-c3';
import { HttpSetup } from 'opensearch-dashboards/public';
import { monaco } from '@osd/monaco';
import { DQLLexer } from './.generated/DQLLexer';
import { DQLParser, KeyValueExpressionContext } from './.generated/DQLParser';
import { getTokenPosition } from '../shared/cursor';
import { IndexPattern, IndexPatternField } from '../../index_patterns';
import { QuerySuggestionGetFnArgs } from '../../autocomplete';
import { DQLParserVisitor } from './.generated/DQLParserVisitor';
import { getUiService } from '../../services';

const findCursorIndex = (
  tokenStream: TokenStream,
  cursorColumn: number,
  cursorLine: number,
  whitespaceToken: number
): number | undefined => {
  const actualCursorCol = cursorColumn - 1;

  for (let i = 0; i < tokenStream.size; i++) {
    const token = tokenStream.get(i);
    const { startLine, endColumn, endLine } = getTokenPosition(token, whitespaceToken);

    if (endLine > cursorLine || (startLine === cursorLine && endColumn >= actualCursorCol)) {
      if (tokenStream.get(i).type === whitespaceToken || tokenStream.get(i).type === DQLParser.EQ) {
        return i + 1;
      }
      return i;
    }
  }

  return undefined;
};

const findFieldSuggestions = (indexPattern: IndexPattern) => {
  const fieldNames: string[] = indexPattern.fields
    .filter((idxField: IndexPatternField) => !idxField?.subType) // filter removed .keyword fields
    .map((idxField: { name: string }) => {
      return idxField.name;
    });

  const fieldSuggestions: Array<{
    text: string;
    type: monaco.languages.CompletionItemKind;
  }> = fieldNames.map((field: string) => {
    return {
      text: field,
      type: monaco.languages.CompletionItemKind.Field,
      insertText: `${field}: `,
    };
  });

  return fieldSuggestions;
};

const getFieldSuggestedValues = async (
  indexTitle: string,
  fieldName: string,
  currentValue: string,
  http?: HttpSetup
) => {
  if (!http) return [];
  return await http.fetch(`/api/opensearch-dashboards/suggestions/values/${indexTitle}`, {
    method: 'POST',
    body: JSON.stringify({ query: currentValue, field: fieldName, boolFilter: [] }),
  });
};

const findValueSuggestions = async (
  index: IndexPattern,
  field: string,
  value: string,
  http?: HttpSetup
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

  if (matchedField?.type === 'boolean') {
    return ['true', 'false'];
  }

  if (!matchedField || !matchedField.aggregatable || matchedField.type !== 'string') return;

  // ask api for suggestions
  return await getFieldSuggestedValues(index.title, matchedField.name, value, http);
};

// visitor for parsing the current query
class QueryVisitor extends DQLParserVisitor<{ field: string; value: string }> {
  public visitKeyValueExpression = (ctx: KeyValueExpressionContext) => {
    let foundValue = '';
    const getTextWithoutQuotes = (text: string | undefined) => text?.replace(/^["']|["']$/g, '');

    if (ctx.value()?.PHRASE()) {
      const phraseText = getTextWithoutQuotes(ctx.value()?.PHRASE()?.getText());
      if (phraseText) foundValue = phraseText;
    } else if (ctx.value()?.tokenSearch()) {
      const valueText = ctx.value()?.getText();
      if (valueText) foundValue = valueText;
    } else if (ctx.groupExpression()) {
      const lastGroupContent = getTextWithoutQuotes(
        ctx.groupExpression()?.groupContent().at(-1)?.getText()
      );
      if (lastGroupContent) foundValue = lastGroupContent;
    }
    return { field: ctx.field().getText(), value: foundValue };
  };
}

export const getSuggestions = async ({
  query,
  indexPattern,
  position,
  selectionEnd,
  services,
}: QuerySuggestionGetFnArgs) => {
  if (
    !services ||
    !services.appName ||
    !getUiService().Settings.supportsEnhancementsEnabled(services.appName) ||
    !indexPattern
  ) {
    return [];
  }
  try {
    const http = services.http;

    const inputStream = CharStream.fromString(query);
    const lexer = new DQLLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new DQLParser(tokenStream);
    parser.removeErrorListeners();
    const tree = parser.query();

    const visitor = new QueryVisitor();

    // find token index
    const cursorColumn = position?.column ?? selectionEnd;
    const cursorLine = position?.lineNumber ?? 1;

    const cursorIndex = findCursorIndex(tokenStream, cursorColumn, cursorLine, DQLParser.WS) ?? 0;

    const core = new CodeCompletionCore(parser);

    // specify preferred rules to appear in candidate collection
    core.preferredRules = new Set([DQLParser.RULE_field]);

    // specify tokens to ignore
    core.ignoredTokens = new Set([
      DQLParser.LPAREN,
      DQLParser.RPAREN,
      DQLParser.EQ,
      DQLParser.GE,
      DQLParser.GT,
      DQLParser.LE,
      DQLParser.LT,
    ]);

    // gets candidates at specified token index
    const candidates = core.collectCandidates(cursorIndex);

    const completions = [];

    // check to see if field rule is a candidate. if so, suggest field names
    if (candidates.rules.has(DQLParser.RULE_field)) {
      completions.push(...findFieldSuggestions(indexPattern));
    }

    // find suggested values for the last found field (only for kvexpression rule)
    const { field: lastField = '', value: lastValue = '' } = visitor.visit(tree) ?? {};
    if (!!lastField && candidates.tokens.has(DQLParser.PHRASE)) {
      const values = await findValueSuggestions(indexPattern, lastField, lastValue ?? '', http);
      if (!!values) {
        completions.push(
          ...values?.map((val: any) => {
            return { text: val, type: monaco.languages.CompletionItemKind.Value };
          })
        );
      }
    }

    // suggest other candidates, mainly keywords
    [...candidates.tokens.keys()].forEach((token: number) => {
      // ignore identifier, already handled with field rule
      if (token === DQLParser.ID || token === DQLParser.PHRASE) {
        return;
      }

      const tokenSymbolName = parser.vocabulary.getSymbolicName(token)?.toLowerCase();
      completions.push({
        text: tokenSymbolName,
        type: monaco.languages.CompletionItemKind.Keyword,
      });
    });

    return completions;
  } catch {
    return [];
  }
};
