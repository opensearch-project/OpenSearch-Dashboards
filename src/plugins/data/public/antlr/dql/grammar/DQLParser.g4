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
    : field comparisonOperator value
    ;

keyValueExpression
    : field EQ (value | groupExpression)
    ;

tokenSearch
    : ID (ID)*
    ;
    
groupExpression
    : LPAREN NOT? groupContent ((OR | AND) NOT? groupContent)* RPAREN
    ;

groupContent
    : groupExpression
    | value
    ;

field
    : ID
    ;

value
    : PHRASE 
    | tokenSearch
    ;
    
comparisonOperator
    : GT 
    | LT 
    | GE 
    | LE
    ;