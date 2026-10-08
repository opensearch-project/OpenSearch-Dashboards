parser grammar OpenSearchPPLSearchOnlyParser;

options {
    tokenVocab = OpenSearchPPLSearchOnlyLexer;
}

// Grammar for the PPL `search` command <search-expression>. Operator precedence
// per the docs is: parentheses > NOT > OR > AND, so AND binds loosest and sits
// at the top. Juxtaposed expressions (no explicit operator) are implicitly
// AND-ed, matching "multiple search terms are combined using AND".

searchExpression
    : andExpression
    ;

andExpression
    : orExpression (AND? orExpression)*
    ;

orExpression
    : notExpression (OR notExpression)*
    ;

notExpression
    : NOT? primaryExpression
    ;

primaryExpression
    : LPAREN andExpression RPAREN
    | comparisonExpression
    | inExpression
    | term
    ;

comparisonExpression
    : field comparisonOperator value
    ;

inExpression
    : field IN LPAREN value (COMMA value)* RPAREN
    ;

comparisonOperator
    : EQ
    | NEQ
    | GT
    | GE
    | LT
    | LE
    ;

field
    : TERM
    | BACKTICK
    ;

value
    : PHRASE
    | TERM
    | BACKTICK
    ;

term
    : PHRASE
    | TERM
    ;
