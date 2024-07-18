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
NUMBER: '-'? [0-9]+ ('.' [0-9]+)?;
ID: [a-zA-Z_*][a-zA-Z0-9_.*]*;

// SKIP
WS: [ \t\r\n]+ -> channel(HIDDEN);