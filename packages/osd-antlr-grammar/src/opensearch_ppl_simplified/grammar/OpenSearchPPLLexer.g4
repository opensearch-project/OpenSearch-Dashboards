/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */


lexer grammar OpenSearchPPLLexer;

channels { WHITESPACE, ERRORCHANNEL }
options { caseInsensitive = true; }

SPACE:                              [ \t\r\n]+    -> channel(WHITESPACE);

// COMMAND KEYWORDS
SEARCH:                             'SEARCH';
DESCRIBE:                           'DESCRIBE';
SHOW:                               'SHOW';
EXPLAIN:                            'EXPLAIN';
FROM:                               'FROM';
WHERE:                              'WHERE';
FIELDS:                             'FIELDS';
FIELD:                              'FIELD';
TABLE:                              'TABLE';  // Alias for FIELDS command
RENAME:                             'RENAME';
STATS:                              'STATS';
EVENTSTATS:                         'EVENTSTATS';
DEDUP:                              'DEDUP';
SORT:                               'SORT';
EVAL:                               'EVAL';
HEAD:                               'HEAD';
BIN:                                'BIN';
TOP:                                'TOP';
RARE:                               'RARE';
PARSE:                              'PARSE';
SPATH:                              'SPATH';
REGEX:                              'REGEX';
REX:                                'REX';
SED:                                'SED';
PUNCT:                              'PUNCT';
GROK:                               'GROK';
PATTERN:                            'PATTERN';
PATTERNS:                           'PATTERNS';
NEW_FIELD:                          'NEW_FIELD';
KMEANS:                             'KMEANS';
AD:                                 'AD';
ML:                                 'ML';
FILLNULL:                           'FILLNULL';
FLATTEN:                            'FLATTEN';
TRENDLINE:                          'TRENDLINE';
TIMECHART:                          'TIMECHART';
APPENDCOL:                          'APPENDCOL';
EXPAND:                             'EXPAND';
SIMPLE_PATTERN:                     'SIMPLE_PATTERN';
BRAIN:                              'BRAIN';
VARIABLE_COUNT_THRESHOLD:           'VARIABLE_COUNT_THRESHOLD';
FREQUENCY_THRESHOLD_PERCENTAGE:     'FREQUENCY_THRESHOLD_PERCENTAGE';
METHOD:                             'METHOD';
MAX_SAMPLE_COUNT:                   'MAX_SAMPLE_COUNT';
MAX_MATCH:                          'MAX_MATCH';
OFFSET_FIELD:                       'OFFSET_FIELD';
BUFFER_LIMIT:                       'BUFFER_LIMIT';
LABEL:                              'LABEL';
AGGREGATION:                        'AGGREGATION';

//Native JOIN KEYWORDS
JOIN:                               'JOIN';
ON:                                 'ON';
INNER:                              'INNER';
OUTER:                              'OUTER';
FULL:                               'FULL';
SEMI:                               'SEMI';
ANTI:                               'ANTI';
CROSS:                              'CROSS';
LEFT_HINT:                          'HINT.LEFT';
RIGHT_HINT:                         'HINT.RIGHT';

// COMMAND ASSIST KEYWORDS
AS:                                 'AS';
BY:                                 'BY';
SOURCE:                             'SOURCE';
INDEX:                              'INDEX';
A:                                  'A';
ASC:                                'ASC';
D:                                  'D';
DESC:                               'DESC';
DATASOURCES:                        'DATASOURCES';
USING:                              'USING';
WITH:                               'WITH';
SIMPLE:                             'SIMPLE';
STANDARD:                           'STANDARD';
COST:                               'COST';
EXTENDED:                           'EXTENDED';
OVERRIDE:                           'OVERRIDE';
OVERWRITE:                          'OVERWRITE';

// SORT FIELD KEYWORDS
// TODO #3180: Fix broken sort functionality
AUTO:                               'AUTO';
STR:                                'STR';
NUM:                                'NUM';

// TRENDLINE KEYWORDS
SMA:                                'SMA';
WMA:                                'WMA';

// ARGUMENT KEYWORDS
KEEPEMPTY:                          'KEEPEMPTY';
CONSECUTIVE:                        'CONSECUTIVE';
DEDUP_SPLITVALUES:                  'DEDUP_SPLITVALUES';
PARTITIONS:                         'PARTITIONS';
ALLNUM:                             'ALLNUM';
DELIM:                              'DELIM';
BUCKET_NULLABLE:                    'BUCKET_NULLABLE';
CENTROIDS:                          'CENTROIDS';
ITERATIONS:                         'ITERATIONS';
DISTANCE_TYPE:                      'DISTANCE_TYPE';
NUMBER_OF_TREES:                    'NUMBER_OF_TREES';
SHINGLE_SIZE:                       'SHINGLE_SIZE';
SAMPLE_SIZE:                        'SAMPLE_SIZE';
OUTPUT_AFTER:                       'OUTPUT_AFTER';
TIME_DECAY:                         'TIME_DECAY';
ANOMALY_RATE:                       'ANOMALY_RATE';
CATEGORY_FIELD:                     'CATEGORY_FIELD';
TIME_FIELD:                         'TIME_FIELD';
TIME_ZONE:                          'TIME_ZONE';
TRAINING_DATA_SIZE:                 'TRAINING_DATA_SIZE';
ANOMALY_SCORE_THRESHOLD:            'ANOMALY_SCORE_THRESHOLD';
APPEND:                             'APPEND';
COUNTFIELD:                         'COUNTFIELD';
SHOWCOUNT:                          'SHOWCOUNT';
LIMIT:                              'LIMIT';
USEOTHER:                           'USEOTHER';
INPUT:                              'INPUT';
OUTPUT:                             'OUTPUT';
PATH:                               'PATH';

// COMPARISON FUNCTION KEYWORDS
CASE:                               'CASE';
ELSE:                               'ELSE';
IN:                                 'IN';
EXISTS:                             'EXISTS';

// Geo IP eval function
GEOIP:                              'GEOIP';

// LOGICAL KEYWORDS
NOT:                                'NOT';
OR:                                 'OR';
AND:                                'AND';
XOR:                                'XOR';
TRUE:                               'TRUE';
FALSE:                              'FALSE';
REGEXP:                             'REGEXP';
REGEX_MATCH:                        'REGEX_MATCH';

// DATETIME, INTERVAL AND UNIT KEYWORDS
CONVERT_TZ:                         'CONVERT_TZ';
DATETIME:                           'DATETIME';
DAY:                                'DAY';
DAY_HOUR:                           'DAY_HOUR';
DAY_MICROSECOND:                    'DAY_MICROSECOND';
DAY_MINUTE:                         'DAY_MINUTE';
DAY_OF_YEAR:                        'DAY_OF_YEAR';
DAY_SECOND:                         'DAY_SECOND';
HOUR:                               'HOUR';
HOUR_MICROSECOND:                   'HOUR_MICROSECOND';
HOUR_MINUTE:                        'HOUR_MINUTE';
HOUR_OF_DAY:                        'HOUR_OF_DAY';
HOUR_SECOND:                        'HOUR_SECOND';
INTERVAL:                           'INTERVAL';
MICROSECOND:                        'MICROSECOND';
MILLISECOND:                        'MILLISECOND';
MINUTE:                             'MINUTE';
MINUTE_MICROSECOND:                 'MINUTE_MICROSECOND';
MINUTE_OF_DAY:                      'MINUTE_OF_DAY';
MINUTE_OF_HOUR:                     'MINUTE_OF_HOUR';
MINUTE_SECOND:                      'MINUTE_SECOND';
MONTH:                              'MONTH';
MONTH_OF_YEAR:                      'MONTH_OF_YEAR';
QUARTER:                            'QUARTER';
SECOND:                             'SECOND';
SECOND_MICROSECOND:                 'SECOND_MICROSECOND';
SECOND_OF_MINUTE:                   'SECOND_OF_MINUTE';
WEEK:                               'WEEK';
WEEK_OF_YEAR:                       'WEEK_OF_YEAR';
YEAR:                               'YEAR';
YEAR_MONTH:                         'YEAR_MONTH';

// DATASET TYPES
DATAMODEL:                          'DATAMODEL';
LOOKUP:                             'LOOKUP';
SAVEDSEARCH:                        'SAVEDSEARCH';

// CONVERTED DATA TYPES
INT:                                'INT';
INTEGER:                            'INTEGER';
DOUBLE:                             'DOUBLE';
LONG:                               'LONG';
FLOAT:                              'FLOAT';
STRING:                             'STRING';
BOOLEAN:                            'BOOLEAN';
IP:                                 'IP';

// SPECIAL CHARACTERS AND OPERATORS
PIPE:                               '|';
COMMA:                              ',';
DOT:                                '.';
EQUAL:                              '=';
DOUBLE_EQUAL:                       '==';
GREATER:                            '>';
LESS:                               '<';
NOT_GREATER:                        '<' '=';
NOT_LESS:                           '>' '=';
NOT_EQUAL:                          '!' '=';
PLUS:                               '+';
MINUS:                              '-';
STAR:                               '*';
DIVIDE:                             '/';
MODULE:                             '%';
EXCLAMATION_SYMBOL:                 '!';
COLON:                              ':';
LT_PRTHS:                           '(';
RT_PRTHS:                           ')';
LT_SQR_PRTHS:                       '[';
RT_SQR_PRTHS:                       ']';
LT_CURLY:                           '{';
RT_CURLY:                           '}';
SINGLE_QUOTE:                       '\'';
DOUBLE_QUOTE:                       '"';
BACKTICK:                           '`';
ARROW:                              '->';

// Operators. Bit

BIT_NOT_OP:                         '~';
BIT_AND_OP:                         '&';
BIT_XOR_OP:                         '^';

// AGGREGATIONS
AVG:                                'AVG';
COUNT:                              'COUNT';
DISTINCT_COUNT:                     'DISTINCT_COUNT';
DISTINCT_COUNT_APPROX:              'DISTINCT_COUNT_APPROX';
ESTDC:                              'ESTDC';
ESTDC_ERROR:                        'ESTDC_ERROR';
MAX:                                'MAX';
MEAN:                               'MEAN';
MEDIAN:                             'MEDIAN';
MIN:                                'MIN';
MODE:                               'MODE';
RANGE:                              'RANGE';
STDEV:                              'STDEV';
STDEVP:                             'STDEVP';
SUM:                                'SUM';
SUMSQ:                              'SUMSQ';
VAR_SAMP:                           'VAR_SAMP';
VAR_POP:                            'VAR_POP';
STDDEV_SAMP:                        'STDDEV_SAMP';
STDDEV_POP:                         'STDDEV_POP';
PERC:                               'PERC';
PERCENTILE:                         'PERCENTILE';
PERCENTILE_APPROX:                  'PERCENTILE_APPROX';
EARLIEST:                           'EARLIEST';
LATEST:                             'LATEST';
TAKE:                               'TAKE';
LIST:                               'LIST';
VALUES:                             'VALUES';
PER_DAY:                            'PER_DAY';
PER_HOUR:                           'PER_HOUR';
PER_MINUTE:                         'PER_MINUTE';
PER_SECOND:                         'PER_SECOND';
RATE:                               'RATE';
SPARKLINE:                          'SPARKLINE';
C:                                  'C';
DC:                                 'DC';

// SCALAR WINDOW FUNCTIONS
ROW_NUMBER:                         'ROW_NUMBER';
RANK:                               'RANK';
DENSE_RANK:                         'DENSE_RANK';
PERCENT_RANK:                       'PERCENT_RANK';
CUME_DIST:                          'CUME_DIST';
FIRST:                              'FIRST';
LAST:                               'LAST';
NTH:                                'NTH';
NTILE:                              'NTILE';

// BASIC FUNCTIONS
PLUS_FUCTION:                       'ADD';
MINUS_FUCTION:                      'SUBTRACT';
STAR_FUNCTION:                      'MULTIPLY';
DIVIDE_FUNCTION:                    'DIVIDE';
ABS:                                'ABS';
CBRT:                               'CBRT';
CEIL:                               'CEIL';
CEILING:                            'CEILING';
CONV:                               'CONV';
CRC32:                              'CRC32';
E:                                  'E';
EXP:                                'EXP';
EXPM1:                              'EXPM1';
FLOOR:                              'FLOOR';
LN:                                 'LN';
LOG:                                'LOG';
LOG_WITH_BASE:                      ([0-9]+ ('.' [0-9]+)?)? ('LOG' | 'log') [0-9]+ ('.' [0-9]+)?;
MOD:                                'MOD';
MODULUS:                            'MODULUS';
PI:                                 'PI';
POSITION:                           'POSITION';
POW:                                'POW';
POWER:                              'POWER';
RAND:                               'RAND';
ROUND:                              'ROUND';
SIGN:                               'SIGN';
SQRT:                               'SQRT';
TRUNCATE:                           'TRUNCATE';
RINT:                               'RINT';
SIGNUM:                             'SIGNUM';

// TRIGONOMETRIC FUNCTIONS
ACOS:                               'ACOS';
ASIN:                               'ASIN';
ATAN:                               'ATAN';
ATAN2:                              'ATAN2';
COS:                                'COS';
COSH:                               'COSH';
COT:                                'COT';
DEGREES:                            'DEGREES';
RADIANS:                            'RADIANS';
SIN:                                'SIN';
SINH:                               'SINH';
TAN:                                'TAN';

// CRYPTOGRAPHIC FUNCTIONS
MD5:                                  'MD5';
SHA1:                                 'SHA1';
SHA2:                                 'SHA2';

// DATE AND TIME FUNCTIONS
ADDDATE:                            'ADDDATE';
ADDTIME:                            'ADDTIME';
CURDATE:                            'CURDATE';
CURRENT_DATE:                       'CURRENT_DATE';
CURRENT_TIME:                       'CURRENT_TIME';
CURRENT_TIMESTAMP:                  'CURRENT_TIMESTAMP';
CURTIME:                            'CURTIME';
DATE:                               'DATE';
DATEDIFF:                           'DATEDIFF';
DATE_ADD:                           'DATE_ADD';
DATE_FORMAT:                        'DATE_FORMAT';
DATE_SUB:                           'DATE_SUB';
DAYNAME:                            'DAYNAME';
DAYOFMONTH:                         'DAYOFMONTH';
DAYOFWEEK:                          'DAYOFWEEK';
DAYOFYEAR:                          'DAYOFYEAR';
DAY_OF_MONTH:                       'DAY_OF_MONTH';
DAY_OF_WEEK:                        'DAY_OF_WEEK';
EXTRACT:                            'EXTRACT';
FROM_DAYS:                          'FROM_DAYS';
FROM_UNIXTIME:                      'FROM_UNIXTIME';
GET_FORMAT:                         'GET_FORMAT';
LAST_DAY:                           'LAST_DAY';
LOCALTIME:                          'LOCALTIME';
LOCALTIMESTAMP:                     'LOCALTIMESTAMP';
MAKEDATE:                           'MAKEDATE';
MAKETIME:                           'MAKETIME';
MONTHNAME:                          'MONTHNAME';
NOW:                                'NOW';
PERIOD_ADD:                         'PERIOD_ADD';
PERIOD_DIFF:                        'PERIOD_DIFF';
SEC_TO_TIME:                        'SEC_TO_TIME';
STR_TO_DATE:                        'STR_TO_DATE';
SUBDATE:                            'SUBDATE';
SUBTIME:                            'SUBTIME';
SYSDATE:                            'SYSDATE';
TIME:                               'TIME';
TIMEDIFF:                           'TIMEDIFF';
TIMESTAMP:                          'TIMESTAMP';
TIMESTAMPADD:                       'TIMESTAMPADD';
TIMESTAMPDIFF:                      'TIMESTAMPDIFF';
TIME_FORMAT:                        'TIME_FORMAT';
TIME_TO_SEC:                        'TIME_TO_SEC';
TO_DAYS:                            'TO_DAYS';
TO_SECONDS:                         'TO_SECONDS';
UNIX_TIMESTAMP:                     'UNIX_TIMESTAMP';
UTC_DATE:                           'UTC_DATE';
UTC_TIME:                           'UTC_TIME';
UTC_TIMESTAMP:                      'UTC_TIMESTAMP';
WEEKDAY:                            'WEEKDAY';
YEARWEEK:                           'YEARWEEK';
STRFTIME:                           'STRFTIME';

// TEXT FUNCTIONS
SUBSTR:                             'SUBSTR';
SUBSTRING:                          'SUBSTRING';
LTRIM:                              'LTRIM';
RTRIM:                              'RTRIM';
TRIM:                               'TRIM';
TO:                                 'TO';
LOWER:                              'LOWER';
UPPER:                              'UPPER';
CONCAT:                             'CONCAT';
CONCAT_WS:                          'CONCAT_WS';
LENGTH:                             'LENGTH';
STRCMP:                             'STRCMP';
RIGHT:                              'RIGHT';
LEFT:                               'LEFT';
ASCII:                              'ASCII';
LOCATE:                             'LOCATE';
REPLACE:                            'REPLACE';
REVERSE:                            'REVERSE';
CAST:                               'CAST';

// BOOL FUNCTIONS
LIKE:                               'LIKE';
ISNULL:                             'ISNULL';
ISNOTNULL:                          'ISNOTNULL';
CIDRMATCH:                          'CIDRMATCH';
BETWEEN:                            'BETWEEN';
ISPRESENT:                          'ISPRESENT';
ISEMPTY:                            'ISEMPTY';
ISBLANK:                            'ISBLANK';

// COLLECTION FUNCTIONS
ARRAY:                              'ARRAY';
ARRAY_LENGTH:                       'ARRAY_LENGTH';
MVJOIN:                             'MVJOIN';
FORALL:                             'FORALL';
FILTER:                             'FILTER';
TRANSFORM:                          'TRANSFORM';
REDUCE:                             'REDUCE';

// JSON FUNCTIONS
JSON_VALID:                         'JSON_VALID';
JSON:                               'JSON';
JSON_OBJECT:                        'JSON_OBJECT';
JSON_ARRAY:                         'JSON_ARRAY';
JSON_ARRAY_LENGTH:                  'JSON_ARRAY_LENGTH';
JSON_EXTRACT:                       'JSON_EXTRACT';
JSON_KEYS:                          'JSON_KEYS';
JSON_SET:                           'JSON_SET';
JSON_DELETE:                        'JSON_DELETE';
JSON_APPEND:                        'JSON_APPEND';
JSON_EXTEND:                        'JSON_EXTEND';

// FLOWCONTROL FUNCTIONS
IFNULL:                             'IFNULL';
NULLIF:                             'NULLIF';
IF:                                 'IF';
TYPEOF:                             'TYPEOF';
COALESCE:                           'COALESCE';

// RELEVANCE FUNCTIONS AND PARAMETERS
MATCH:                              'MATCH';
MATCH_PHRASE:                       'MATCH_PHRASE';
MATCH_PHRASE_PREFIX:                'MATCH_PHRASE_PREFIX';
MATCH_BOOL_PREFIX:                  'MATCH_BOOL_PREFIX';
SIMPLE_QUERY_STRING:                'SIMPLE_QUERY_STRING';
MULTI_MATCH:                        'MULTI_MATCH';
QUERY_STRING:                       'QUERY_STRING';

ALLOW_LEADING_WILDCARD:             'ALLOW_LEADING_WILDCARD';
ANALYZE_WILDCARD:                   'ANALYZE_WILDCARD';
ANALYZER:                           'ANALYZER';
AUTO_GENERATE_SYNONYMS_PHRASE_QUERY:'AUTO_GENERATE_SYNONYMS_PHRASE_QUERY';
BOOST:                              'BOOST';
CUTOFF_FREQUENCY:                   'CUTOFF_FREQUENCY';
DEFAULT_FIELD:                      'DEFAULT_FIELD';
DEFAULT_OPERATOR:                   'DEFAULT_OPERATOR';
ENABLE_POSITION_INCREMENTS:         'ENABLE_POSITION_INCREMENTS';
ESCAPE:                             'ESCAPE';
FLAGS:                              'FLAGS';
FUZZY_MAX_EXPANSIONS:               'FUZZY_MAX_EXPANSIONS';
FUZZY_PREFIX_LENGTH:                'FUZZY_PREFIX_LENGTH';
FUZZY_TRANSPOSITIONS:               'FUZZY_TRANSPOSITIONS';
FUZZY_REWRITE:                      'FUZZY_REWRITE';
FUZZINESS:                          'FUZZINESS';
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
TYPE:                               'TYPE';
ZERO_TERMS_QUERY:                   'ZERO_TERMS_QUERY';

// SPAN KEYWORDS
SPAN:                               'SPAN';
BINS:                               'BINS';
MINSPAN:                            'MINSPAN';
START:                              'START';
END:                                'END';
ALIGNTIME:                          'ALIGNTIME';
MS:                                 'MS';
S:                                  'S';
M:                                  'M';
H:                                  'H';
W:                                  'W';
Q:                                  'Q';
Y:                                  'Y';

// Extended timescale units
SEC:                                'SEC';
SECS:                               'SECS';
SECONDS:                            'SECONDS';
MINS:                               'MINS';
MINUTES:                            'MINUTES';
HR:                                 'HR';
HRS:                                'HRS';
HOURS:                              'HOURS';
DAYS:                               'DAYS';
MON:                                'MON';
MONTHS:                             'MONTHS';
US:                                 'US';
CS:                                 'CS';
DS:                                 'DS';


// PERCENTILE SHORTCUT FUNCTIONS
// Must precede ID to avoid conflicts with identifier matching
PERCENTILE_SHORTCUT:                PERC(INTEGER_LITERAL | DECIMAL_LITERAL) | 'P'(INTEGER_LITERAL | DECIMAL_LITERAL);

// LITERALS AND VALUES
//STRING_LITERAL:                     DQUOTA_STRING | SQUOTA_STRING | BQUOTA_STRING;
ID:                                 ID_LITERAL;
CLUSTER:                            CLUSTER_PREFIX_LITERAL;
INTEGER_LITERAL:                    DEC_DIGIT+;
DECIMAL_LITERAL:                    (DEC_DIGIT+)? '.' DEC_DIGIT+;
FLOAT_LITERAL:                      (DEC_DIGIT+)? '.' DEC_DIGIT+ 'F';
DOUBLE_LITERAL:                     (DEC_DIGIT+)? '.' DEC_DIGIT+ 'D';

fragment DATE_SUFFIX:               ([\-.][*0-9]+)+;
fragment CLUSTER_PREFIX_LITERAL:    [*A-Z]+?[*A-Z_\-0-9]* COLON;
ID_DATE_SUFFIX:                     CLUSTER_PREFIX_LITERAL? ID_LITERAL DATE_SUFFIX;
DQUOTA_STRING:                      '"' ( '\\'. | '""' | ~('"'| '\\') )* '"';
SQUOTA_STRING:                      '\'' ('\\'. | '\'\'' | ~('\'' | '\\'))* '\'';
BQUOTA_STRING:                      '`' ( '\\'. | '``' | ~('`'|'\\'))* '`';
fragment DEC_DIGIT:                 [0-9];

// Identifiers cannot start with a single '_' since this an OpenSearch reserved
// metadata field.  Two underscores (or more) is acceptable, such as '__field'.
fragment ID_LITERAL:                ([@*A-Z_])+?[*A-Z_\-0-9]*;

LINE_COMMENT:                       '//' ('\\\n' | ~[\r\n])* '\r'? '\n'? -> channel(HIDDEN);
BLOCK_COMMENT:                      '/*' .*? '*/' -> channel(HIDDEN);

ERROR_RECOGNITION:                  .    -> channel(ERRORCHANNEL);