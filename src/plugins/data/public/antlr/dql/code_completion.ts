import { CharStream, CommonTokenStream, TokenStream } from 'antlr4ng';
import { DQLLexer } from './generated/DQLLexer';
import {
  DQLParser,
  FieldContext,
  ValueContext,
  FieldExpressionContext,
} from './generated/DQLParser';
import { CodeCompletionCore } from 'antlr4-c3';
import { getTokenPosition } from '../opensearch_sql/cursor';
import { IndexPattern, IndexPatternField } from '../../index_patterns';
import { CursorPosition } from '../opensearch_sql/types';
import { getHttp } from '../../services';
import { DQLParserListener } from './generated/DQLParserListener';
import { QuerySuggestionGetFnArgs } from '../../autocomplete';
import { DQLParserVisitor } from './generated/DQLParserVisitor';

const findCursorIndex = (
  tokenStream: TokenStream,
  cursor: CursorPosition,
  whitespaceToken: number,
  actualIndex?: boolean
): number | undefined => {
  const cursorCol = cursor.column - 1;

  for (let i = 0; i < tokenStream.size; i++) {
    const token = tokenStream.get(i);
    const { startLine, endColumn, endLine } = getTokenPosition(token, whitespaceToken);

    // endColumn makes sense only if startLine === endLine
    if (endLine > cursor.line || (startLine === cursor.line && endColumn > cursorCol)) {
      if (actualIndex) {
        return i;
      }

      if (tokenStream.get(i).type === whitespaceToken) {
        return i + 1;
      }
      return i;
    }
  }

  return undefined;
};

const findFieldSuggestions = (indexPattern: IndexPattern) => {
  const fieldNames: string[] = indexPattern.fields
    .getAll()
    .filter((idxField: IndexPatternField) => !idxField.subType) // filter removed .keyword fields
    .map((idxField: { displayName: string }) => {
      return idxField.displayName;
    });

  const fieldSuggestions: { text: string; type: string }[] = fieldNames.map((field: string) => {
    return { text: field, type: 'field' };
  });

  return fieldSuggestions;
};

const getFieldSuggestedValues = async (
  indexTitle: string,
  fieldName: string,
  currentValue: string
) => {
  const http = getHttp();
  return await http.fetch(`/api/opensearch-dashboards/suggestions/values/${indexTitle}`, {
    method: 'POST',
    body: JSON.stringify({ query: currentValue, field: fieldName, boolFilter: [] }),
  });
};

const findValueSuggestions = async (index: IndexPattern, field: string, value: string) => {
  // check to see if last field is within index and if it can suggest values, first check
  // if .keyword appended field exists because that has values
  const matchedField =
    index.fields.getAll().find((idxField: IndexPatternField) => {
      // check to see if the field matches another field with .keyword appended
      if (idxField.displayName === `${field}.keyword`) return idxField;
    }) ||
    index.fields.getAll().find((idxField: IndexPatternField) => {
      // if the display name matches, return
      if (idxField.displayName === field) return idxField;
    });

  if (matchedField?.type === 'boolean') {
    return ['true', 'false'];
  }

  if (!matchedField || !matchedField.aggregatable || matchedField.type !== 'string') return;

  // ask api for suggestions
  return await getFieldSuggestedValues(index.title, matchedField.displayName, value);
};

// visitor for parsing the current query
class QueryVisitor extends DQLParserVisitor<{ field: string; value: string }> {
  public visitFieldExpression = (ctx: FieldExpressionContext) => {
    let foundValue = '';

    if (ctx.value()?.PHRASE()) {
      const strippedPhrase = ctx
        .value()
        ?.PHRASE()
        ?.getText()
        .replace(/^["']|["']$/g, '');
      if (strippedPhrase) foundValue = strippedPhrase;
    }
    if (ctx.value()?.termSearch() || ctx.value()?.NUMBER()) {
      const valueText = ctx.value()?.getText();
      if (valueText) foundValue = valueText;
    }
    // if (ctx.groupExpression()) {
    //   console.log('in a group');
    // }
    return { field: ctx.field().getText(), value: foundValue };
  };
}

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  query,
  language,
  indexPatterns,
}: QuerySuggestionGetFnArgs) => {
  const currentIndexPattern = indexPatterns[0] as IndexPattern;

  const inputStream = CharStream.fromString(query);
  const lexer = new DQLLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new DQLParser(tokenStream);
  const tree = parser.query();

  const visitor = new QueryVisitor();

  // find token index
  const cursorIndex =
    findCursorIndex(tokenStream, { line: 1, column: selectionStart }, DQLParser.WS) ?? 0;

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
    DQLParser.NUMBER,
  ]);

  // gets candidates at specified token index
  const candidates = core.collectCandidates(cursorIndex);

  let completions = [];

  // check to see if field rule is a candidate. if so, suggest field names
  if (candidates.rules.has(DQLParser.RULE_field)) {
    completions.push(...findFieldSuggestions(currentIndexPattern));
  }

  // find suggested values for the last found field
  const { field: lastField = '', value: lastValue = '' } = visitor.visit(tree) ?? {};
  // console.log('lastField: ', lastField);
  console.log('lastValue: ', lastValue);
  if (!!lastField && candidates.tokens.has(DQLParser.PHRASE)) {
    const values = await findValueSuggestions(currentIndexPattern, lastField, lastValue ?? '');
    completions.push(
      ...values.map((val: any) => {
        return { text: val, type: 'value' };
      })
    );
  }

  // suggest other candidates, mainly keywords
  [...candidates.tokens.keys()].forEach((token: number) => {
    // ignore identifier, already handled with field rule
    if (token === DQLParser.IDENTIFIER || token === DQLParser.PHRASE) {
      return;
    }

    const tokenSymbolName = parser.vocabulary.getSymbolicName(token)?.toLowerCase();
    completions.push({ text: tokenSymbolName, type: 'keyword' });
  });

  return completions;
};
