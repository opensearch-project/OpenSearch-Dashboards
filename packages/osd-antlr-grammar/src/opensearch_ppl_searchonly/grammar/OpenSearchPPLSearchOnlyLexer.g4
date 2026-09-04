lexer grammar OpenSearchPPLSearchOnlyLexer;

// Restricted lexer for the PPL `search` command's <search-expression> only
// (see the search command docs). It is intentionally small: it feeds a
// single-line search box with grammar-driven autocomplete, not the full PPL
// pipeline (that lives in OpenSearchPPLLexer). Keywords are case-insensitive.

// Boolean keywords
AND: [aA][nN][dD];
OR: [oO][rR];
NOT: [nN][oO][tT];
IN: [iI][nN];

// Comparison operators (longest match first so '>='/'<='/'!=' beat '>'/'<')
NEQ: '!=';
GE: '>=';
LE: '<=';
EQ: '=';
GT: '>';
LT: '<';

// Delimiters
LPAREN: '(';
RPAREN: ')';
COMMA: ',';

// Literals. PHRASE covers both single- and double-quoted values (the search
// command accepts either); the trailing quote is optional so an in-progress
// "err| still parses for autocomplete. BACKTICK wraps field names containing
// dots or other special characters (e.g. `resource.attributes.service.name`).
PHRASE:
    '"' ('\\' . | ~["\\])* '"'?
    | '\'' ('\\' . | ~['\\])* '\''?;
BACKTICK: '`' ('\\' . | ~[`\\])* '`'?;

// A bare term / field name / unquoted value: any run of characters that are not
// whitespace, operators, delimiters, or quotes. This naturally captures
// wildcards (* ?), hyphens, dots, @, and relative-time values like -7d / +1d@d.
TERM: ~[ \t\r\n=<>()!,"'`]+;

WS: [ \t\r\n]+ -> channel(HIDDEN);
