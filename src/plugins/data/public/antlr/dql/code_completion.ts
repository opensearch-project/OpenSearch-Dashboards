import { CharStream, CommonTokenStream, TokenStream } from 'antlr4ng';
import { DQLLexer } from './generated/DQLLexer';
import { DQLParser, FieldContext } from './generated/DQLParser';
import { CodeCompletionCore } from 'antlr4-c3';
import { getTokenPosition } from '../opensearch_sql/cursor';
import { IndexPattern, IndexPatternField } from '../../index_patterns';
import { CursorPosition } from '../opensearch_sql/types';
import { getHttp } from '../../services';
import { DQLParserListener } from './generated/DQLParserListener';

const findCursorIndex = (
  tokenStream: TokenStream,
  cursor: CursorPosition,
  whitespaceToken: number,
  actualIndex?: boolean
): number | undefined => {
  const cursorCol = cursor.column - 1;

  for (let i = 0; i < tokenStream.size; i++) {
    const token = tokenStream.get(i);
    // console.log('token:', token);
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
    .filter((idxField: IndexPatternField) => !idxField.subType)
    .map((idxField: { displayName: string }) => {
      return idxField.displayName;
    });

  const fieldSuggestions: { text: string; type: string }[] = fieldNames.map((field: string) => {
    return { text: field, type: 'field' };
  });

  return fieldSuggestions;
};

const findValuesFromField = async (indexTitle: string, fieldName: string) => {
  const http = getHttp();
  return await http.fetch(`/api/opensearch-dashboards/suggestions/values/${indexTitle}`, {
    method: 'POST',
    body: JSON.stringify({ query: '', field: fieldName, boolFilter: [] }),
  });
};

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  query,
  language,
  indexPatterns,
}) => {
  const currentIndexPattern: IndexPattern = indexPatterns[0];

  const inputStream = CharStream.fromString(query);
  const lexer = new DQLLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new DQLParser(tokenStream);
  // const tree = parser.query(); // used to check if parsing is happening properly

  // listener for parsing the current query
  class FieldListener extends DQLParserListener {
    lastField: string | undefined;

    constructor() {
      super();
      this.lastField;
    }

    public enterField = (ctx: FieldContext) => {
      this.lastField = ctx.start?.text;
    };

    getLastField() {
      return this.lastField;
    }
  }

  const listener = new FieldListener();
  parser.addParseListener(listener);
  parser.query();

  // find token index
  const cursorIndex =
    findCursorIndex(tokenStream, { line: 1, column: selectionStart }, DQLParser.WS) ?? 0;

  // console.log('cursor index:', cursorIndex);

  const core = new CodeCompletionCore(parser);

  // specify preferred rules to appear in candidate collection
  core.preferredRules = new Set([DQLParser.RULE_field]);

  // specify tokens to ignore
  core.ignoredTokens = new Set([
    DQLParser.LPAREN,
    DQLParser.RPAREN,
    DQLParser.DOT,
    DQLParser.EQ,
    DQLParser.GE,
    DQLParser.GT,
    DQLParser.LE,
    DQLParser.LT,
    DQLParser.NUMBER,
  ]);

  // gets candidates at specified token index
  const candidates = core.collectCandidates(cursorIndex);
  // console.log('candidates', candidates);

  let completions = [];

  // check to see if field rule is a candidate. if so, suggest field names
  if (candidates.rules.has(DQLParser.RULE_field)) {
    completions.push(...findFieldSuggestions(currentIndexPattern));
  }

  const lastField = listener.getLastField();
  if (!!lastField && candidates.tokens.has(DQLParser.PHRASE)) {
    const values = await findValuesFromField(currentIndexPattern.title, lastField);
    console.log(values);
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

  // console.log('completions', completions);

  return completions;
};
