lexer grammar DQLLexer;

// Keywords
AND: [aA] [nN] [dD];
OR: [oO] [rR];
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
DOT: '.';

// Literals
PHRASE: '"' (ESC | ~["\\])* '"';
NUMBER: '-'? [0-9]+ ('.' [0-9]+)?;
DATESTRING:
	'"' [0-9] [0-9] [0-9] [0-9] '-' [0-9] [0-9] '-' [0-9] [0-9] '"';
IDENTIFIER: [a-zA-Z_*][a-zA-Z0-9_*]*;
WS: [ \t\r\n]+ -> skip;

// Fragments
fragment ESC: '\\' .;