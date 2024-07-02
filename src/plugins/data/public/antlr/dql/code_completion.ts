import { CharStream, CommonTokenStream } from 'antlr4ng';
import { DQLLexer } from './generated/DQLLexer';
import { DQLParser, FieldContext } from './generated/DQLParser';
import { DQLParserVisitor } from './generated/DQLParserVisitor';
import { CodeCompletionCore } from 'antlr4-c3';
import { findCursorTokenIndex } from '../opensearch_sql/cursor';
import { QuerySuggestion, QuerySuggestionField } from '../../autocomplete';

const findFieldSuggestions = (indexPatterns) => {
  const fieldNames: string[] = indexPatterns[0].fields
    .filter((idxField: { readFromDocValues: boolean }) => idxField.readFromDocValues)
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
  const tree = parser.query();

  // find token index
  const cursorIndex =
    findCursorTokenIndex(tokenStream, { line: 1, column: selectionStart }, DQLParser.WS) ?? 0;

  const core = new CodeCompletionCore(parser);

  // specify preferred rules to appear in candidate collection
  core.preferredRules = new Set([DQLParser.RULE_field]);

  // gets candidates at specified token index
  const candidates = core.collectCandidates(cursorIndex);
  candidates.tokens.forEach((_, k) => {
    console.log('token candidate names', parser.vocabulary.getSymbolicName(k));
  });

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

  return completions;
};
