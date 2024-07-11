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
groupExpression:
	LPAREN groupContent ((OR | AND) (NOT?) groupContent)* RPAREN;
groupContent: groupExpression | termSearch;
field: IDENTIFIER;
rangeValue: NUMBER | PHRASE;
value: PHRASE | NUMBER | termSearch | groupExpression;
comparisonOperator: GT | LT | GE | LE;