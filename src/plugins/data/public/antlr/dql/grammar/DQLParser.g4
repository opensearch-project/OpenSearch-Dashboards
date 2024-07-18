parser grammar DQLParser;

options {
	tokenVocab = DQLLexer;
}

query
	: primaryExpression 
	| operatorExpression
	;

operatorExpression
	: andExpression 
	| orExpression
	;

orExpression
	: term (OR term)*
	;

term
	: primaryExpression 
	| andExpression
	;

andExpression
	: primaryExpression (AND primaryExpression)*
	;

primaryExpression
	: LPAREN query RPAREN
	| NOT primaryExpression
	| comparisonExpression
	| keyValueExpression
	| tokenSearch
	;

comparisonExpression
	: field comparisonOperator rangeValue
	;

keyValueExpression
	: field EQ (value | groupExpression)
	;

tokenSearch
	: ID (ID)*
	;
	
groupExpression
	: LPAREN groupContent ((OR | AND) (NOT?) groupContent)* RPAREN
	;

groupContent
	: groupExpression 
	| value
	;

field
	: ID
	;

rangeValue
	: NUMBER
	| PHRASE
	;

value
	: PHRASE 
	| NUMBER 
	| tokenSearch
	;
	
comparisonOperator
	: GT 
	| LT 
	| GE 
	| LE
	;