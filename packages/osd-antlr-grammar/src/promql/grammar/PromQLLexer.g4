/*
 [The "BSD licence"]
 Copyright (c) 2013 Terence Parr
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions
 are met:
 1. Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
 3. The name of the author may not be used to endorse or promote products
    derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// $antlr-format alignTrailingComments true, columnLimit 150, maxEmptyLinesToKeep 1, reflowComments false, useTab false
// $antlr-format allowShortRulesOnASingleLine true, allowShortBlocksOnASingleLine true, minEmptyLines 0, alignSemicolons ownLine
// $antlr-format alignColons trailing, singleLineOverrulesHangingColon true, alignLexerCommands true, alignLabels true, alignTrailers true

lexer grammar PromQLLexer;

channels {
    WHITESPACE,
    COMMENTS
}

// All keywords in PromQL are case insensitive, it is just function,
// label and metric names that are not.
options {
    caseInsensitive = true;
}

fragment NUMERAL: [0-9]* '.'? [0-9]+;

fragment SCIENTIFIC_NUMBER: NUMERAL ([e] [-+]? [0-9]+)?;

fragment HEXADECIMAL: '0' [x] [0-9a-f]+;

NUMBER: [-+]? NUMERAL | SCIENTIFIC_NUMBER | HEXADECIMAL | 'nan' | 'inf';

STRING: '\'' (~('\'' | '\\') | '\\' .)* '\'' | '"' (~('"' | '\\') | '\\' .)* '"';

// Binary operators

ADD  : '+';
SUB  : '-';
MULT : '*';
DIV  : '/';
MOD  : '%';
POW  : '^';

AND    : 'and';
OR     : 'or';
UNLESS : 'unless';

// Comparison operators

EQ  : '=';
DEQ : '==';
NE  : '!=';
GT  : '>';
LT  : '<';
GE  : '>=';
LE  : '<=';
RE  : '=~';
NRE : '!~';

// Aggregation modifiers

BY      : 'by';
WITHOUT : 'without';

// Join modifiers

ON          : 'on';
IGNORING    : 'ignoring';
GROUP_LEFT  : 'group_left';
GROUP_RIGHT : 'group_right';

OFFSET: 'offset';

BOOL: 'bool';

// Aggregation Operators
SUM          : 'sum';
MIN          : 'min';
MAX          : 'max';
AVG          : 'avg';
GROUP        : 'group';
STDDEV       : 'stddev';
STDVAR       : 'stdvar';
COUNT        : 'count';
COUNT_VALUES : 'count_values';
BOTTOMK      : 'bottomk';
TOPK         : 'topk';
QUANTILE     : 'quantile';
LIMITK       : 'limitk';
LIMIT_RATIO  : 'limit_ratio';

// Function names
ABS                : 'abs';
ABSENT             : 'absent';
ABSENT_OVER_TIME   : 'absent_over_time';
CEIL               : 'ceil';
CHANGES            : 'changes';
CLAMP              : 'clamp';
CLAMP_MAX          : 'clamp_max';
CLAMP_MIN          : 'clamp_min';
DAY_OF_MONTH       : 'day_of_month';
DAY_OF_WEEK        : 'day_of_week';
DAY_OF_YEAR        : 'day_of_year';
DAYS_IN_MONTH      : 'days_in_month';
DELTA              : 'delta';
DERIV              : 'deriv';
EXP                : 'exp';
FLOOR              : 'floor';
HISTOGRAM_COUNT    : 'histogram_count';
HISTOGRAM_SUM      : 'histogram_sum';
HISTOGRAM_FRACTION : 'histogram_fraction';
HISTOGRAM_QUANTILE : 'histogram_quantile';
HOLT_WINTERS       : 'holt_winters';
HOUR               : 'hour';
IDELTA             : 'idelta';
INCREASE           : 'increase';
IRATE              : 'irate';
LABEL_JOIN         : 'label_join';
LABEL_REPLACE      : 'label_replace';
LN                 : 'ln';
LOG2               : 'log2';
LOG10              : 'log10';
MINUTE             : 'minute';
MONTH              : 'month';
PREDICT_LINEAR     : 'predict_linear';
RATE               : 'rate';
RESETS             : 'resets';
ROUND              : 'round';
SCALAR             : 'scalar';
SGN                : 'sgn';
SORT               : 'sort';
SORT_DESC          : 'sort_desc';
SQRT               : 'sqrt';
TIME               : 'time';
TIMESTAMP          : 'timestamp';
VECTOR             : 'vector';
YEAR               : 'year';
AVG_OVER_TIME      : 'avg_over_time';
MIN_OVER_TIME      : 'min_over_time';
MAX_OVER_TIME      : 'max_over_time';
SUM_OVER_TIME      : 'sum_over_time';
COUNT_OVER_TIME    : 'count_over_time';
QUANTILE_OVER_TIME : 'quantile_over_time';
STDDEV_OVER_TIME   : 'stddev_over_time';
STDVAR_OVER_TIME   : 'stdvar_over_time';
LAST_OVER_TIME     : 'last_over_time';
PRESENT_OVER_TIME  : 'present_over_time';
ACOS               : 'acos';
ACOSH              : 'acosh';
ASIN               : 'asin';
ASINH              : 'asinh';
ATAN               : 'atan';
ATANH              : 'atanh';
COS                : 'cos';
COSH               : 'cosh';
SIN                : 'sin';
SINH               : 'sinh';
TAN                : 'tan';
TANH               : 'tanh';
DEG                : 'deg';
PI                 : 'pi';
RAD                : 'rad';

LEFT_BRACE  : '{';
RIGHT_BRACE : '}';

LEFT_PAREN  : '(';
RIGHT_PAREN : ')';

LEFT_BRACKET  : '[';
RIGHT_BRACKET : ']';

COMMA: ',';

COLON: ':';

AT: '@';

// The proper order (longest to the shortest) must be validated after parsing
DURATION: ([0-9]+ ('ms' | [smhdwy]))+;

METRIC_NAME : [a-z_:] [a-z0-9_:]*;
LABEL_NAME  : [a-z_] [a-z0-9_]*;

WS         : [\r\t\n ]+   -> channel(WHITESPACE);
SL_COMMENT : '#' .*? '\n' -> channel(COMMENTS);