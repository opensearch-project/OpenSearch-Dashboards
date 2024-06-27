parser grammar DQLParser;

options {
	tokenVocab = DQLLexer;
}

query: orExpression;
orExpression: andExpression (OR andExpression)*;
andExpression: notExpression (AND notExpression)*;
notExpression: NOT notExpression | primaryExpression;
primaryExpression:
	LPAREN query RPAREN
	| comparisonExpression
	| fieldExpression
	| termSearch;
comparisonExpression: field comparisonOperator rangeValue;
fieldExpression: field EQ value;
termSearch: IDENTIFIER;
termOrExpression: LPAREN termSearch (OR termSearch)* RPAREN;
field: IDENTIFIER (DOT IDENTIFIER)*;
rangeValue: NUMBER | DATESTRING;
value: PHRASE | NUMBER | termSearch | termOrExpression;
comparisonOperator: GT | LT | GE | LE;