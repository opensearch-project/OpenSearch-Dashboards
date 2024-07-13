import { CharStream, CommonTokenStream, TokenStream, Trees } from 'antlr4ng';
import { DQLLexer } from './generated/DQLLexer';
import { DQLParser } from './generated/DQLParser';
import { CodeCompletionCore } from 'antlr4-c3';
import { getTokenPosition } from '../opensearch_sql/cursor';
import { IndexPatternField } from '../../index_patterns';
import { CursorPosition } from '../opensearch_sql/types';

// const validField = (idxPatField: IndexPatternField) => {
//   return idxPatField.aggregatable ||
// }

const findCursorIndex = (
  tokenStream: TokenStream,
  cursor: CursorPosition,
  whitespaceToken: number,
  actualIndex?: boolean
): number | undefined => {
  const cursorCol = cursor.column - 1;

  for (let i = 0; i < tokenStream.size; i++) {
    const token = tokenStream.get(i);
    console.log('token:', token);
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

const findFieldSuggestions = (indexPatterns) => {
  // console.log(
  //   indexPatterns[0].fields
  //     .getAll()
  //     .filter((idxPatField: IndexPatternField) => !idxPatField.subType)
  // );
  const fieldNames: string[] = indexPatterns[0].fields
    .getAll()
    .filter((idxField: IndexPatternField) => !idxField.subType)
    .map((idxField: { displayName: string }) => {
      return idxField.displayName;
    });

  const fieldSuggestions: { text: string; type: string }[] = fieldNames.map((field: string) => {
    return { text: field, type: 'text' };
  });

  return fieldSuggestions;
};

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  query,
  language,
  indexPatterns,
}) => {
  const inputStream = CharStream.fromString(query);
  const lexer = new DQLLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new DQLParser(tokenStream);
  const tree = parser.query(); // used to check if parsing is happening properly

  // find token index
  const cursorIndex =
    findCursorIndex(tokenStream, { line: 1, column: selectionStart }, DQLParser.WS) ?? 0;

  console.log('cursor index:', cursorIndex);

  const core = new CodeCompletionCore(parser);

  // specify preferred rules to appear in candidate collection
  core.preferredRules = new Set([DQLParser.RULE_field]);

  // specify tokens to ignore
  core.ignoredTokens = new Set([
    DQLParser.EOF,
    DQLParser.LPAREN,
    DQLParser.RPAREN,
    DQLParser.DOT,
    DQLParser.EQ,
    DQLParser.GE,
    DQLParser.GT,
    DQLParser.LE,
    DQLParser.LT,
    DQLParser.NUMBER,
    DQLParser.PHRASE,
  ]);

  // gets candidates at specified token index
  const candidates = core.collectCandidates(cursorIndex);
  console.log('candidates', candidates);

  let completions = [];

  // check to see if field rule is a candidate. if so, suggest field names
  if (candidates.rules.has(DQLParser.RULE_field)) {
    completions.push(...findFieldSuggestions(indexPatterns));
  }

  // suggest other candidates, mainly keywords
  [...candidates.tokens.keys()].forEach((token: number) => {
    // ignore identifier, already handled with field rule
    if (token === DQLParser.IDENTIFIER) {
      return;
    }

    const tokenSymbolName = parser.vocabulary.getSymbolicName(token)?.toLowerCase();
    completions.push({ text: tokenSymbolName, type: 'function' });
  });

  console.log('completions', completions);

  return completions;
};
