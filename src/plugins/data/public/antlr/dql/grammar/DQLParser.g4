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
	: orTerm (OR orTerm)*
	;
	
orTerm
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
	| fieldExpression
	| termSearch
	;

comparisonExpression
	: field comparisonOperator rangeValue
	;

fieldExpression
	: field EQ (value | groupExpression)
	;

termSearch
	: IDENTIFIER (IDENTIFIER)*
	;
	
groupExpression
	: LPAREN groupContent ((OR | AND) (NOT?) groupContent)* RPAREN
	;

groupContent
	: groupExpression 
	| value
	;

field
	: IDENTIFIER
	;

rangeValue
	: NUMBER
	| PHRASE
	;

value
	: PHRASE 
	| NUMBER 
	| termSearch
	;
	
comparisonOperator
	: GT 
	| LT 
	| GE 
	| LE
	;