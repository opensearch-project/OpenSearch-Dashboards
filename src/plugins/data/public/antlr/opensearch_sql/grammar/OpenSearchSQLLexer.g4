/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
MySQL (Positive Technologies) grammar
The MIT License (MIT).
Copyright (c) 2015-2017, Ivan Kochurkin (kvanttt@gmail.com), Positive Technologies.
Copyright (c) 2017, Ivan Khudyashev (IHudyashov@ptsecurity.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

lexer grammar OpenSearchSQLLexer;

channels { SQLCOMMENT, ERRORCHANNEL }

options {
    caseInsensitive = true;
}


// SKIP

SPACE:                              [ \t\r\n]+    -> channel(HIDDEN);
SPEC_SQL_COMMENT:                   '/*!' .+? '*/' -> channel(SQLCOMMENT);
COMMENT_INPUT:                      '/*' .*? '*/' -> channel(HIDDEN);
LINE_COMMENT:                       (
                                      ('-- ' | '#') ~[\r\n]* ('\r'? '\n' | EOF)
                                      | '--' ('\r'? '\n' | EOF)
                                    ) -> channel(HIDDEN);


// Keywords
// Common Keywords

ALL:                                'ALL';
AND:                                'AND';
AS:                                 'AS';
ASC:                                'ASC';
BOOLEAN:                            'BOOLEAN';
BETWEEN:                            'BETWEEN';
BY:                                 'BY';
CASE:                               'CASE';
CAST:                               'CAST';
CROSS:                              'CROSS';
COLUMNS:                            'COLUMNS';
DATETIME:                           'DATETIME';
DELETE:                             'DELETE';
DESC:                               'DESC';
DESCRIBE:                           'DESCRIBE';
DISTINCT:                           'DISTINCT';
DOUBLE:                             'DOUBLE';
ELSE:                               'ELSE';
EXISTS:                             'EXISTS';
FALSE:                              'FALSE';
FLOAT:                              'FLOAT';
FIRST:                              'FIRST';
FROM:                               'FROM';
GROUP:                              'GROUP';
HAVING:                             'HAVING';
IN:                                 'IN';
INNER:                              'INNER';
INT:                                'INT';
INTEGER:                            'INTEGER';
IS:                                 'IS';
JOIN:                               'JOIN';
LAST:                               'LAST';
LEFT:                               'LEFT';
LIKE:                               'LIKE';
LIMIT:                              'LIMIT';
LONG:                               'LONG';
MATCH:                              'MATCH';
NATURAL:                            'NATURAL';
MISSING_LITERAL:                    'MISSING';
NOT:                                'NOT';
NULL_LITERAL:                       'NULL';
NULLS:                              'NULLS';
ON:                                 'ON';
OR:                                 'OR';
ORDER:                              'ORDER';
OUTER:                              'OUTER';
OVER:                               'OVER';
PARTITION:                          'PARTITION';
REGEXP:                             'REGEXP';
RIGHT:                              'RIGHT';
SELECT:                             'SELECT';
SHOW:                               'SHOW';
STRING:                             'STRING';
THEN:                               'THEN';
TRUE:                               'TRUE';
UNION:                              'UNION';
USING:                              'USING';
WHEN:                               'WHEN';
WHERE:                              'WHERE';


// OD SQL special keyword
// MISSING:                            'MISSING';
EXCEPT:                             'MINUS';


// Group function Keywords

AVG:                                'AVG';
COUNT:                              'COUNT';
MAX:                                'MAX';
MIN:                                'MIN';
SUM:                                'SUM';
VAR_POP:                            'VAR_POP';
VAR_SAMP:                           'VAR_SAMP';
VARIANCE:                           'VARIANCE';
STD:                                'STD';
STDDEV:                             'STDDEV';
STDDEV_POP:                         'STDDEV_POP';
STDDEV_SAMP:                        'STDDEV_SAMP';


// Common function Keywords

SUBSTRING:                          'SUBSTRING';
TRIM:                               'TRIM';

// Keywords, but can be ID
// Common Keywords, but can be ID

END:                                'END';
FULL:                               'FULL';
OFFSET:                             'OFFSET';

// INTERVAL AND UNIT KEYWORDS
INTERVAL:                           'INTERVAL';
MICROSECOND:                        'MICROSECOND';
SECOND:                             'SECOND';
MINUTE:                             'MINUTE';
HOUR:                               'HOUR';
DAY:                                'DAY';
WEEK:                               'WEEK';
MONTH:                              'MONTH';
QUARTER:                            'QUARTER';
YEAR:                               'YEAR';
SECOND_MICROSECOND:                 'SECOND_MICROSECOND';
MINUTE_MICROSECOND:                 'MINUTE_MICROSECOND';
MINUTE_SECOND:                      'MINUTE_SECOND';
HOUR_MICROSECOND:                   'HOUR_MICROSECOND';
HOUR_SECOND:                        'HOUR_SECOND';
HOUR_MINUTE:                        'HOUR_MINUTE';
DAY_MICROSECOND:                    'DAY_MICROSECOND';
DAY_SECOND:                         'DAY_SECOND';
DAY_MINUTE:                         'DAY_MINUTE';
DAY_HOUR:                           'DAY_HOUR';
YEAR_MONTH:                         'YEAR_MONTH';


// PRIVILEGES

TABLES:                             'TABLES';


// Common function names

ABS:                                'ABS';
ACOS:                               'ACOS';
ADD:                                'ADD';
ADDTIME:                            'ADDTIME';
ASCII:                              'ASCII';
ASIN:                               'ASIN';
ATAN:                               'ATAN';
ATAN2:                              'ATAN2';
CBRT:                               'CBRT';
CEIL:                               'CEIL';
CEILING:                            'CEILING';
CONCAT:                             'CONCAT';
CONCAT_WS:                          'CONCAT_WS';
CONV:                               'CONV';
CONVERT_TZ:                         'CONVERT_TZ';
COS:                                'COS';
COSH:                               'COSH';
COT:                                'COT';
CRC32:                              'CRC32';
CURDATE:                            'CURDATE';
CURTIME:                            'CURTIME';
CURRENT_DATE:                       'CURRENT_DATE';
CURRENT_TIME:                       'CURRENT_TIME';
CURRENT_TIMESTAMP:                  'CURRENT_TIMESTAMP';
DATE:                               'DATE';
DATE_ADD:                           'DATE_ADD';
DATE_FORMAT:                        'DATE_FORMAT';
DATE_SUB:                           'DATE_SUB';
DATEDIFF:                           'DATEDIFF';
DAYNAME:                            'DAYNAME';
DAYOFMONTH:                         'DAYOFMONTH';
DAYOFWEEK:                          'DAYOFWEEK';
DAYOFYEAR:                          'DAYOFYEAR';
DEGREES:                            'DEGREES';
DIVIDE:                             'DIVIDE';
E:                                  'E';
EXP:                                'EXP';
EXPM1:                              'EXPM1';
EXTRACT:                            'EXTRACT';
FLOOR:                              'FLOOR';
FROM_DAYS:                          'FROM_DAYS';
FROM_UNIXTIME:                      'FROM_UNIXTIME';
GET_FORMAT:                         'GET_FORMAT';
IF:                                 'IF';
IFNULL:                             'IFNULL';
ISNULL:                             'ISNULL';
LAST_DAY:                           'LAST_DAY';
LENGTH:                             'LENGTH';
LN:                                 'LN';
LOCALTIME:                          'LOCALTIME';
LOCALTIMESTAMP:                     'LOCALTIMESTAMP';
LOCATE:                             'LOCATE';
LOG:                                'LOG';
LOG10:                              'LOG10';
LOG2:                               'LOG2';
LOWER:                              'LOWER';
LTRIM:                              'LTRIM';
MAKEDATE:                           'MAKEDATE';
MAKETIME:                           'MAKETIME';
MODULUS:                            'MODULUS';
MONTHNAME:                          'MONTHNAME';
MULTIPLY:                           'MULTIPLY';
NOW:                                'NOW';
NULLIF:                             'NULLIF';
PERIOD_ADD:                         'PERIOD_ADD';
PERIOD_DIFF:                        'PERIOD_DIFF';
PI:                                 'PI';
POSITION:                           'POSITION';
POW:                                'POW';
POWER:                              'POWER';
RADIANS:                            'RADIANS';
RAND:                               'RAND';
REPLACE:                            'REPLACE';
RINT:                               'RINT';
ROUND:                              'ROUND';
RTRIM:                              'RTRIM';
REVERSE:                            'REVERSE';
SEC_TO_TIME:                        'SEC_TO_TIME';
SIGN:                               'SIGN';
SIGNUM:                             'SIGNUM';
SIN:                                'SIN';
SINH:                               'SINH';
SQRT:                               'SQRT';
STR_TO_DATE:                        'STR_TO_DATE';
SUBDATE:                            'SUBDATE';
SUBTIME:                            'SUBTIME';
SUBTRACT:                           'SUBTRACT';
SYSDATE:                            'SYSDATE';
TAN:                                'TAN';
TIME:                               'TIME';
TIMEDIFF:                           'TIMEDIFF';
TIME_FORMAT:                        'TIME_FORMAT';
TIME_TO_SEC:                        'TIME_TO_SEC';
TIMESTAMP:                          'TIMESTAMP';
TRUNCATE:                           'TRUNCATE';
TO_DAYS:                            'TO_DAYS';
TO_SECONDS:                         'TO_SECONDS';
UNIX_TIMESTAMP:                     'UNIX_TIMESTAMP';
UPPER:                              'UPPER';
UTC_DATE:                           'UTC_DATE';
UTC_TIME:                           'UTC_TIME';
UTC_TIMESTAMP:                      'UTC_TIMESTAMP';

D:                                  'D';
T:                                  'T';
TS:                                 'TS';
LEFT_BRACE:                         '{';
RIGHT_BRACE:                        '}';


// Window function names
DENSE_RANK:                         'DENSE_RANK';
RANK:                               'RANK';
ROW_NUMBER:                         'ROW_NUMBER';

// OD SQL special functions
DATE_HISTOGRAM:                     'DATE_HISTOGRAM';
DAY_OF_MONTH:                       'DAY_OF_MONTH';
DAY_OF_YEAR:                        'DAY_OF_YEAR';
DAY_OF_WEEK:                        'DAY_OF_WEEK';
EXCLUDE:                            'EXCLUDE';
EXTENDED_STATS:                     'EXTENDED_STATS';
FIELD:                              'FIELD';
FILTER:                             'FILTER';
GEO_BOUNDING_BOX:                   'GEO_BOUNDING_BOX';
GEO_CELL:                           'GEO_CELL';
GEO_DISTANCE:                       'GEO_DISTANCE';
GEO_DISTANCE_RANGE:                 'GEO_DISTANCE_RANGE';
GEO_INTERSECTS:                     'GEO_INTERSECTS';
GEO_POLYGON:                        'GEO_POLYGON';
HISTOGRAM:                          'HISTOGRAM';
HOUR_OF_DAY:                        'HOUR_OF_DAY';
INCLUDE:                            'INCLUDE';
IN_TERMS:                           'IN_TERMS';
MATCHPHRASE:                        'MATCHPHRASE';
MATCH_PHRASE:                       'MATCH_PHRASE';
MATCHPHRASEQUERY:                   'MATCHPHRASEQUERY';
SIMPLE_QUERY_STRING:                'SIMPLE_QUERY_STRING';
QUERY_STRING:                       'QUERY_STRING';
MATCH_PHRASE_PREFIX:                'MATCH_PHRASE_PREFIX';
MATCHQUERY:                         'MATCHQUERY';
MATCH_QUERY:                        'MATCH_QUERY';
MINUTE_OF_DAY:                      'MINUTE_OF_DAY';
MINUTE_OF_HOUR:                     'MINUTE_OF_HOUR';
MONTH_OF_YEAR:                      'MONTH_OF_YEAR';
MULTIMATCH:                         'MULTIMATCH';
MULTI_MATCH:                        'MULTI_MATCH';
MULTIMATCHQUERY:                    'MULTIMATCHQUERY';
NESTED:                             'NESTED';
PERCENTILES:                        'PERCENTILES';
PERCENTILE:                         'PERCENTILE';
PERCENTILE_APPROX:                  'PERCENTILE_APPROX';
REGEXP_QUERY:                       'REGEXP_QUERY';
REVERSE_NESTED:                     'REVERSE_NESTED';
QUERY:                              'QUERY';
RANGE:                              'RANGE';
SCORE:                              'SCORE';
SCOREQUERY:                         'SCOREQUERY';
SCORE_QUERY:                        'SCORE_QUERY';
SECOND_OF_MINUTE:                   'SECOND_OF_MINUTE';
STATS:                              'STATS';
TERM:                               'TERM';
TERMS:                              'TERMS';
TIMESTAMPADD:                       'TIMESTAMPADD';
TIMESTAMPDIFF:                      'TIMESTAMPDIFF';
TOPHITS:                            'TOPHITS';
TYPEOF:                             'TYPEOF';
WEEK_OF_YEAR:                       'WEEK_OF_YEAR';
WEEKOFYEAR:                         'WEEKOFYEAR';
WEEKDAY:                            'WEEKDAY';
WILDCARDQUERY:                      'WILDCARDQUERY';
WILDCARD_QUERY:                     'WILDCARD_QUERY';

// TEXT FUNCTIONS
SUBSTR:                             'SUBSTR';
STRCMP:                             'STRCMP';

// DATE AND TIME FUNCTIONS
ADDDATE:                            'ADDDATE';
YEARWEEK:                           'YEARWEEK';

// RELEVANCE FUNCTIONS AND PARAMETERS
ALLOW_LEADING_WILDCARD:             'ALLOW_LEADING_WILDCARD';
ANALYZER:                           'ANALYZER';
ANALYZE_WILDCARD:                   'ANALYZE_WILDCARD';
AUTO_GENERATE_SYNONYMS_PHRASE_QUERY:'AUTO_GENERATE_SYNONYMS_PHRASE_QUERY';
BOOST:                              'BOOST';
CASE_INSENSITIVE:                   'CASE_INSENSITIVE';
CUTOFF_FREQUENCY:                   'CUTOFF_FREQUENCY';
DEFAULT_FIELD:                      'DEFAULT_FIELD';
DEFAULT_OPERATOR:                   'DEFAULT_OPERATOR';
ESCAPE:                             'ESCAPE';
ENABLE_POSITION_INCREMENTS:         'ENABLE_POSITION_INCREMENTS';
FIELDS:                             'FIELDS';
FLAGS:                              'FLAGS';
FUZZINESS:                          'FUZZINESS';
FUZZY_MAX_EXPANSIONS:               'FUZZY_MAX_EXPANSIONS';
FUZZY_PREFIX_LENGTH:                'FUZZY_PREFIX_LENGTH';
FUZZY_REWRITE:                      'FUZZY_REWRITE';
FUZZY_TRANSPOSITIONS:               'FUZZY_TRANSPOSITIONS';
LENIENT:                            'LENIENT';
LOW_FREQ_OPERATOR:                  'LOW_FREQ_OPERATOR';
MAX_DETERMINIZED_STATES:            'MAX_DETERMINIZED_STATES';
MAX_EXPANSIONS:                     'MAX_EXPANSIONS';
MINIMUM_SHOULD_MATCH:               'MINIMUM_SHOULD_MATCH';
OPERATOR:                           'OPERATOR';
PHRASE_SLOP:                        'PHRASE_SLOP';
PREFIX_LENGTH:                      'PREFIX_LENGTH';
QUOTE_ANALYZER:                     'QUOTE_ANALYZER';
QUOTE_FIELD_SUFFIX:                 'QUOTE_FIELD_SUFFIX';
REWRITE:                            'REWRITE';
SLOP:                               'SLOP';
TIE_BREAKER:                        'TIE_BREAKER';
TIME_ZONE:                          'TIME_ZONE';
TYPE:                               'TYPE';
ZERO_TERMS_QUERY:                   'ZERO_TERMS_QUERY';
HIGHLIGHT:                          'HIGHLIGHT';
HIGHLIGHT_PRE_TAGS:                 'PRE_TAGS';
HIGHLIGHT_POST_TAGS:                'POST_TAGS';

// RELEVANCE FUNCTIONS
MATCH_BOOL_PREFIX:                  'MATCH_BOOL_PREFIX';
// Operators

// Operators. Arithmetics

STAR:                               '*';
SLASH:                              '/';
MODULE:                             '%';
PLUS:                               '+';
MINUS:                              '-';
DIV:                                'DIV';
MOD:                                'MOD';


// Operators. Comparation

EQUAL_SYMBOL:                       '=';
GREATER_SYMBOL:                     '>';
LESS_SYMBOL:                        '<';
EXCLAMATION_SYMBOL:                 '!';


// Operators. Bit

BIT_NOT_OP:                         '~';
BIT_OR_OP:                          '|';
BIT_AND_OP:                         '&';
BIT_XOR_OP:                         '^';


// Constructors symbols

DOT:                                '.';
LR_BRACKET:                         '(';
RR_BRACKET:                         ')';
LT_SQR_PRTHS:                       '[';
RT_SQR_PRTHS:                       ']';
COMMA:                              ',';
SEMI:                               ';';
AT_SIGN:                            '@';
ZERO_DECIMAL:                       '0';
ONE_DECIMAL:                        '1';
TWO_DECIMAL:                        '2';
SINGLE_QUOTE_SYMB:                  '\'';
DOUBLE_QUOTE_SYMB:                  '"';
REVERSE_QUOTE_SYMB:                 '`';
COLON_SYMB:                         ':';


// Literal Primitives

START_NATIONAL_STRING_LITERAL:      'N' SQUOTA_STRING;
STRING_LITERAL:                     SQUOTA_STRING;
DECIMAL_LITERAL:                    DEC_DIGIT+;
HEXADECIMAL_LITERAL:                'X' '\'' (HEX_DIGIT HEX_DIGIT)+ '\''
                                    | '0X' HEX_DIGIT+;

REAL_LITERAL:                       (DEC_DIGIT+)? '.' DEC_DIGIT+
                                    | DEC_DIGIT+ '.' EXPONENT_NUM_PART
                                    | (DEC_DIGIT+)? '.' (DEC_DIGIT+ EXPONENT_NUM_PART)
                                    | DEC_DIGIT+ EXPONENT_NUM_PART;
NULL_SPEC_LITERAL:                  '\\' 'N';
BIT_STRING:                         BIT_STRING_L;



// Identifiers

ID:                                 ID_LITERAL;
DOUBLE_QUOTE_ID:                    DQUOTA_STRING;
BACKTICK_QUOTE_ID:                  BQUOTA_STRING;


// Fragments for Literal primitives
fragment EXPONENT_NUM_PART:         'E' [-+]? DEC_DIGIT+;
// fragment ID_LITERAL:                [a-zA-Z_][a-zA-Z_0-9]*;
fragment ID_LITERAL:                ([@*A-Z_])+ ([*A-Z_\-0-9])*;
fragment DQUOTA_STRING:             '"' ( '\\'. | '""' | ~('"'| '\\') )* '"';
fragment SQUOTA_STRING:             '\'' ('\\'. | '\'\'' | ~('\'' | '\\'))* '\'';
fragment BQUOTA_STRING:             '`' ( '\\'. | '``' | ~('`'|'\\'))* '`';
fragment HEX_DIGIT:                 [0-9A-F];
fragment DEC_DIGIT:                 [0-9];
fragment BIT_STRING_L:              'B' '\'' [01]+ '\'';
// Last tokens must generate Errors

// Identifiers cannot start with a single '_' since this an OpenSearch reserved
// metadata field.  Two underscores (or more) is acceptable, such as '__field'.
// fragment ID_LITERAL:                ([@*A-Z_])+?[*A-Z_\-0-9]*;

ERROR_RECOGNITION:                  .    -> channel(ERRORCHANNEL);