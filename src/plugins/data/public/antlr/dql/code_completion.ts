import { CharStream, CommonTokenStream } from 'antlr4ng';
import { DQLLexer } from './generated/DQLLexer';
import { DQLParser, FieldContext } from './generated/DQLParser';
import { DQLParserVisitor } from './generated/DQLParserVisitor';

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  query,
  language,
  indexPatterns,
}) => {
  console.log('dsl query:', query);

  const inputStream = CharStream.fromString(query);
  const lexer = new DQLLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new DQLParser(tokenStream);
  const tree = parser.query();

  // console.log('tell em to drink da whole ocean:', tree);

  class MyVisitor extends DQLParserVisitor<string> {
    public visitField = (ctx: FieldContext): string => {
      console.log('found field:', ctx.getText());
      return ctx.getText();
    };
  }

  const visitor = new MyVisitor();
  const result = visitor.visit(tree);
  // console.log('dql parsing results:', result);

  // the schema from that
  const fieldNames = indexPatterns[0].fields.map((idxField: { displayName: string }) => {
    return idxField.displayName;
  });
  console.log('fields', fieldNames);

  // put all the fields into the autosuggest
  const fieldSuggestions = fieldNames.map((field) => {
    return { text: field, type: 'text' };
  });

  return fieldSuggestions;
};
