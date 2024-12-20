lexer grammar DQLLexer;

// Keywords
OR: [oO] [rR];
AND: [aA] [nN] [dD];
NOT: [nN] [oO] [tT];

// Operators
GT: '>';
LT: '<';
GE: '>=';
LE: '<=';
EQ: ':';

// Delimiters
LPAREN: '(';
RPAREN: ')';

// Literals
PHRASE: '"' (~["\\])* '"'?;
ID: [a-zA-Z0-9_@*]+[a-zA-Z0-9_*.]*;

// SKIP
WS: [ \t\r\n]+ -> channel(HIDDEN);