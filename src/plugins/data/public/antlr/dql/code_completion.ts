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
  // gets candidates at specified index
  const core = new CodeCompletionCore(parser);

  core.preferredRules = new Set([DQLParser.RULE_field]);

  const candidates = core.collectCandidates(cursorIndex);

  let completions = [];

  if (candidates.rules.has(DQLParser.RULE_field)) {
    completions.push(...findFieldSuggestions(indexPatterns));
  }

  [...candidates.tokens.keys()].forEach((token: number) => {
    if (token === DQLParser.IDENTIFIER) {
      return;
    }

    const tokenSymbolName = parser.vocabulary.getSymbolicName(token)?.toLowerCase();
    completions.push({ text: tokenSymbolName, type: 'function' });
  });

  return completions;
};
