parser grammar DQLParser;

options {
    tokenVocab = DQLLexer;
}

query
    : operatorExpression
    ;

operatorExpression
    : notExpression (booleanOperator notExpression)*
    ;
    
booleanOperator
    : OR
    | AND
    ;
    
notExpression
    : NOT? primaryExpression
    ;

primaryExpression
    : LPAREN query RPAREN
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