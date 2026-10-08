// Generated from ./src/opensearch_sql/grammar/OpenSearchSQLParser.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { OpenSearchSQLParserVisitor } from "./OpenSearchSQLParserVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class OpenSearchSQLParser extends antlr.Parser {
    public static readonly SPACE = 1;
    public static readonly SPEC_SQL_COMMENT = 2;
    public static readonly COMMENT_INPUT = 3;
    public static readonly LINE_COMMENT = 4;
    public static readonly ALL = 5;
    public static readonly AND = 6;
    public static readonly AS = 7;
    public static readonly ASC = 8;
    public static readonly BOOLEAN = 9;
    public static readonly BETWEEN = 10;
    public static readonly BY = 11;
    public static readonly CASE = 12;
    public static readonly CAST = 13;
    public static readonly CROSS = 14;
    public static readonly COLUMNS = 15;
    public static readonly DATETIME = 16;
    public static readonly DELETE = 17;
    public static readonly DESC = 18;
    public static readonly DESCRIBE = 19;
    public static readonly DISTINCT = 20;
    public static readonly DOUBLE = 21;
    public static readonly ELSE = 22;
    public static readonly EXISTS = 23;
    public static readonly FALSE = 24;
    public static readonly FLOAT = 25;
    public static readonly FIRST = 26;
    public static readonly FROM = 27;
    public static readonly GROUP = 28;
    public static readonly HAVING = 29;
    public static readonly IN = 30;
    public static readonly INNER = 31;
    public static readonly INT = 32;
    public static readonly INTEGER = 33;
    public static readonly IS = 34;
    public static readonly JOIN = 35;
    public static readonly LAST = 36;
    public static readonly LEFT = 37;
    public static readonly LIKE = 38;
    public static readonly LIMIT = 39;
    public static readonly LONG = 40;
    public static readonly MATCH = 41;
    public static readonly NATURAL = 42;
    public static readonly MISSING_LITERAL = 43;
    public static readonly NOT = 44;
    public static readonly NULL_LITERAL = 45;
    public static readonly NULLS = 46;
    public static readonly ON = 47;
    public static readonly OR = 48;
    public static readonly ORDER = 49;
    public static readonly OUTER = 50;
    public static readonly OVER = 51;
    public static readonly PARTITION = 52;
    public static readonly REGEXP = 53;
    public static readonly RIGHT = 54;
    public static readonly SELECT = 55;
    public static readonly SHOW = 56;
    public static readonly STRING = 57;
    public static readonly THEN = 58;
    public static readonly TRUE = 59;
    public static readonly UNION = 60;
    public static readonly USING = 61;
    public static readonly WHEN = 62;
    public static readonly WHERE = 63;
    public static readonly EXCEPT = 64;
    public static readonly AVG = 65;
    public static readonly COUNT = 66;
    public static readonly MAX = 67;
    public static readonly MIN = 68;
    public static readonly SUM = 69;
    public static readonly VAR_POP = 70;
    public static readonly VAR_SAMP = 71;
    public static readonly VARIANCE = 72;
    public static readonly STD = 73;
    public static readonly STDDEV = 74;
    public static readonly STDDEV_POP = 75;
    public static readonly STDDEV_SAMP = 76;
    public static readonly SUBSTRING = 77;
    public static readonly TRIM = 78;
    public static readonly END = 79;
    public static readonly FULL = 80;
    public static readonly OFFSET = 81;
    public static readonly INTERVAL = 82;
    public static readonly FIXED_INTERVAL = 83;
    public static readonly CALENDAR_INTERVAL = 84;
    public static readonly MICROSECOND = 85;
    public static readonly SECOND = 86;
    public static readonly MINUTE = 87;
    public static readonly HOUR = 88;
    public static readonly DAY = 89;
    public static readonly WEEK = 90;
    public static readonly MONTH = 91;
    public static readonly QUARTER = 92;
    public static readonly YEAR = 93;
    public static readonly SECOND_MICROSECOND = 94;
    public static readonly MINUTE_MICROSECOND = 95;
    public static readonly MINUTE_SECOND = 96;
    public static readonly HOUR_MICROSECOND = 97;
    public static readonly HOUR_SECOND = 98;
    public static readonly HOUR_MINUTE = 99;
    public static readonly DAY_MICROSECOND = 100;
    public static readonly DAY_SECOND = 101;
    public static readonly DAY_MINUTE = 102;
    public static readonly DAY_HOUR = 103;
    public static readonly YEAR_MONTH = 104;
    public static readonly TABLES = 105;
    public static readonly ABS = 106;
    public static readonly ACOS = 107;
    public static readonly ADD = 108;
    public static readonly ADDTIME = 109;
    public static readonly ASCII = 110;
    public static readonly ASIN = 111;
    public static readonly ATAN = 112;
    public static readonly ATAN2 = 113;
    public static readonly CBRT = 114;
    public static readonly CEIL = 115;
    public static readonly CEILING = 116;
    public static readonly CONCAT = 117;
    public static readonly CONCAT_WS = 118;
    public static readonly CONV = 119;
    public static readonly CONVERT_TZ = 120;
    public static readonly COS = 121;
    public static readonly COSH = 122;
    public static readonly COT = 123;
    public static readonly CRC32 = 124;
    public static readonly CURDATE = 125;
    public static readonly CURTIME = 126;
    public static readonly CURRENT_DATE = 127;
    public static readonly CURRENT_TIME = 128;
    public static readonly CURRENT_TIMESTAMP = 129;
    public static readonly DATE = 130;
    public static readonly DATE_ADD = 131;
    public static readonly DATE_FORMAT = 132;
    public static readonly DATE_SUB = 133;
    public static readonly DATEDIFF = 134;
    public static readonly DAYNAME = 135;
    public static readonly DAYOFMONTH = 136;
    public static readonly DAYOFWEEK = 137;
    public static readonly DAYOFYEAR = 138;
    public static readonly DEGREES = 139;
    public static readonly DIVIDE = 140;
    public static readonly E = 141;
    public static readonly EXP = 142;
    public static readonly EXPM1 = 143;
    public static readonly EXTRACT = 144;
    public static readonly FLOOR = 145;
    public static readonly FROM_DAYS = 146;
    public static readonly FROM_UNIXTIME = 147;
    public static readonly GET_FORMAT = 148;
    public static readonly IF = 149;
    public static readonly IFNULL = 150;
    public static readonly ISNULL = 151;
    public static readonly LAST_DAY = 152;
    public static readonly LENGTH = 153;
    public static readonly LN = 154;
    public static readonly LOCALTIME = 155;
    public static readonly LOCALTIMESTAMP = 156;
    public static readonly LOCATE = 157;
    public static readonly LOG = 158;
    public static readonly LOG10 = 159;
    public static readonly LOG2 = 160;
    public static readonly LOWER = 161;
    public static readonly LTRIM = 162;
    public static readonly MAKEDATE = 163;
    public static readonly MAKETIME = 164;
    public static readonly MODULUS = 165;
    public static readonly MONTHNAME = 166;
    public static readonly MULTIPLY = 167;
    public static readonly NOW = 168;
    public static readonly NULLIF = 169;
    public static readonly PERIOD_ADD = 170;
    public static readonly PERIOD_DIFF = 171;
    public static readonly PI = 172;
    public static readonly POSITION = 173;
    public static readonly POW = 174;
    public static readonly POWER = 175;
    public static readonly RADIANS = 176;
    public static readonly RAND = 177;
    public static readonly REPLACE = 178;
    public static readonly RINT = 179;
    public static readonly ROUND = 180;
    public static readonly RTRIM = 181;
    public static readonly REVERSE = 182;
    public static readonly SEC_TO_TIME = 183;
    public static readonly SIGN = 184;
    public static readonly SIGNUM = 185;
    public static readonly SIN = 186;
    public static readonly SINH = 187;
    public static readonly SQRT = 188;
    public static readonly STR_TO_DATE = 189;
    public static readonly SUBDATE = 190;
    public static readonly SUBTIME = 191;
    public static readonly SUBTRACT = 192;
    public static readonly SYSDATE = 193;
    public static readonly TAN = 194;
    public static readonly TIME = 195;
    public static readonly TIMEDIFF = 196;
    public static readonly TIME_FORMAT = 197;
    public static readonly TIME_TO_SEC = 198;
    public static readonly TIMESTAMP = 199;
    public static readonly TRUNCATE = 200;
    public static readonly TO_DAYS = 201;
    public static readonly TO_SECONDS = 202;
    public static readonly UNIX_TIMESTAMP = 203;
    public static readonly UPPER = 204;
    public static readonly UTC_DATE = 205;
    public static readonly UTC_TIME = 206;
    public static readonly UTC_TIMESTAMP = 207;
    public static readonly D = 208;
    public static readonly T = 209;
    public static readonly TS = 210;
    public static readonly LEFT_BRACE = 211;
    public static readonly RIGHT_BRACE = 212;
    public static readonly DENSE_RANK = 213;
    public static readonly RANK = 214;
    public static readonly ROW_NUMBER = 215;
    public static readonly DATE_HISTOGRAM = 216;
    public static readonly DAY_OF_MONTH = 217;
    public static readonly DAY_OF_YEAR = 218;
    public static readonly DAY_OF_WEEK = 219;
    public static readonly EXCLUDE = 220;
    public static readonly EXTENDED_STATS = 221;
    public static readonly FIELD = 222;
    public static readonly FILTER = 223;
    public static readonly GEO_BOUNDING_BOX = 224;
    public static readonly GEO_CELL = 225;
    public static readonly GEO_DISTANCE = 226;
    public static readonly GEO_DISTANCE_RANGE = 227;
    public static readonly GEO_INTERSECTS = 228;
    public static readonly GEO_POLYGON = 229;
    public static readonly HISTOGRAM = 230;
    public static readonly HOUR_OF_DAY = 231;
    public static readonly INCLUDE = 232;
    public static readonly IN_TERMS = 233;
    public static readonly MATCHPHRASE = 234;
    public static readonly MATCH_PHRASE = 235;
    public static readonly MATCHPHRASEQUERY = 236;
    public static readonly SIMPLE_QUERY_STRING = 237;
    public static readonly QUERY_STRING = 238;
    public static readonly MATCH_PHRASE_PREFIX = 239;
    public static readonly MATCHQUERY = 240;
    public static readonly MATCH_QUERY = 241;
    public static readonly MINUTE_OF_DAY = 242;
    public static readonly MINUTE_OF_HOUR = 243;
    public static readonly MONTH_OF_YEAR = 244;
    public static readonly MULTIMATCH = 245;
    public static readonly MULTI_MATCH = 246;
    public static readonly MULTIMATCHQUERY = 247;
    public static readonly NESTED = 248;
    public static readonly PERCENTILES = 249;
    public static readonly PERCENTILE = 250;
    public static readonly PERCENTILE_APPROX = 251;
    public static readonly REGEXP_QUERY = 252;
    public static readonly REVERSE_NESTED = 253;
    public static readonly QUERY = 254;
    public static readonly RANGE = 255;
    public static readonly SCORE = 256;
    public static readonly SCOREQUERY = 257;
    public static readonly SCORE_QUERY = 258;
    public static readonly SECOND_OF_MINUTE = 259;
    public static readonly STATS = 260;
    public static readonly TERM = 261;
    public static readonly TERMS = 262;
    public static readonly TIMESTAMPADD = 263;
    public static readonly TIMESTAMPDIFF = 264;
    public static readonly TOPHITS = 265;
    public static readonly TYPEOF = 266;
    public static readonly WEEK_OF_YEAR = 267;
    public static readonly WEEKOFYEAR = 268;
    public static readonly WEEKDAY = 269;
    public static readonly WILDCARDQUERY = 270;
    public static readonly WILDCARD_QUERY = 271;
    public static readonly SUBSTR = 272;
    public static readonly STRCMP = 273;
    public static readonly ADDDATE = 274;
    public static readonly YEARWEEK = 275;
    public static readonly ALLOW_LEADING_WILDCARD = 276;
    public static readonly ANALYZER = 277;
    public static readonly ANALYZE_WILDCARD = 278;
    public static readonly AUTO_GENERATE_SYNONYMS_PHRASE_QUERY = 279;
    public static readonly BOOST = 280;
    public static readonly CASE_INSENSITIVE = 281;
    public static readonly CUTOFF_FREQUENCY = 282;
    public static readonly DEFAULT_FIELD = 283;
    public static readonly DEFAULT_OPERATOR = 284;
    public static readonly ESCAPE = 285;
    public static readonly ENABLE_POSITION_INCREMENTS = 286;
    public static readonly FIELDS = 287;
    public static readonly FLAGS = 288;
    public static readonly FUZZINESS = 289;
    public static readonly FUZZY_MAX_EXPANSIONS = 290;
    public static readonly FUZZY_PREFIX_LENGTH = 291;
    public static readonly FUZZY_REWRITE = 292;
    public static readonly FUZZY_TRANSPOSITIONS = 293;
    public static readonly LENIENT = 294;
    public static readonly LOW_FREQ_OPERATOR = 295;
    public static readonly MAX_DETERMINIZED_STATES = 296;
    public static readonly MAX_EXPANSIONS = 297;
    public static readonly MINIMUM_SHOULD_MATCH = 298;
    public static readonly OPERATOR = 299;
    public static readonly PHRASE_SLOP = 300;
    public static readonly PREFIX_LENGTH = 301;
    public static readonly QUOTE_ANALYZER = 302;
    public static readonly QUOTE_FIELD_SUFFIX = 303;
    public static readonly REWRITE = 304;
    public static readonly SLOP = 305;
    public static readonly TIE_BREAKER = 306;
    public static readonly TIME_ZONE = 307;
    public static readonly TYPE = 308;
    public static readonly ZERO_TERMS_QUERY = 309;
    public static readonly HIGHLIGHT = 310;
    public static readonly HIGHLIGHT_PRE_TAGS = 311;
    public static readonly HIGHLIGHT_POST_TAGS = 312;
    public static readonly MATCH_BOOL_PREFIX = 313;
    public static readonly STAR = 314;
    public static readonly SLASH = 315;
    public static readonly MODULE = 316;
    public static readonly PLUS = 317;
    public static readonly MINUS = 318;
    public static readonly DIV = 319;
    public static readonly MOD = 320;
    public static readonly EQUAL_SYMBOL = 321;
    public static readonly GREATER_SYMBOL = 322;
    public static readonly LESS_SYMBOL = 323;
    public static readonly EXCLAMATION_SYMBOL = 324;
    public static readonly BIT_NOT_OP = 325;
    public static readonly BIT_OR_OP = 326;
    public static readonly BIT_AND_OP = 327;
    public static readonly BIT_XOR_OP = 328;
    public static readonly DOT = 329;
    public static readonly LR_BRACKET = 330;
    public static readonly RR_BRACKET = 331;
    public static readonly LT_SQR_PRTHS = 332;
    public static readonly RT_SQR_PRTHS = 333;
    public static readonly COMMA = 334;
    public static readonly SEMI = 335;
    public static readonly AT_SIGN = 336;
    public static readonly ZERO_DECIMAL = 337;
    public static readonly ONE_DECIMAL = 338;
    public static readonly TWO_DECIMAL = 339;
    public static readonly SINGLE_QUOTE_SYMB = 340;
    public static readonly DOUBLE_QUOTE_SYMB = 341;
    public static readonly REVERSE_QUOTE_SYMB = 342;
    public static readonly COLON_SYMB = 343;
    public static readonly START_NATIONAL_STRING_LITERAL = 344;
    public static readonly STRING_LITERAL = 345;
    public static readonly DECIMAL_LITERAL = 346;
    public static readonly HEXADECIMAL_LITERAL = 347;
    public static readonly REAL_LITERAL = 348;
    public static readonly NULL_SPEC_LITERAL = 349;
    public static readonly BIT_STRING = 350;
    public static readonly ID = 351;
    public static readonly DOUBLE_QUOTE_ID = 352;
    public static readonly BACKTICK_QUOTE_ID = 353;
    public static readonly ERROR_RECOGNITION = 354;
    public static readonly RULE_root = 0;
    public static readonly RULE_sqlStatement = 1;
    public static readonly RULE_dmlStatement = 2;
    public static readonly RULE_selectStatement = 3;
    public static readonly RULE_adminStatement = 4;
    public static readonly RULE_showStatement = 5;
    public static readonly RULE_describeStatement = 6;
    public static readonly RULE_columnFilter = 7;
    public static readonly RULE_tableFilter = 8;
    public static readonly RULE_showDescribePattern = 9;
    public static readonly RULE_compatibleID = 10;
    public static readonly RULE_querySpecification = 11;
    public static readonly RULE_selectClause = 12;
    public static readonly RULE_selectSpec = 13;
    public static readonly RULE_selectElements = 14;
    public static readonly RULE_selectElement = 15;
    public static readonly RULE_fromClause = 16;
    public static readonly RULE_relation = 17;
    public static readonly RULE_whereClause = 18;
    public static readonly RULE_groupByClause = 19;
    public static readonly RULE_groupByElements = 20;
    public static readonly RULE_groupByElement = 21;
    public static readonly RULE_havingClause = 22;
    public static readonly RULE_orderByClause = 23;
    public static readonly RULE_orderByElement = 24;
    public static readonly RULE_limitClause = 25;
    public static readonly RULE_windowFunctionClause = 26;
    public static readonly RULE_windowFunction = 27;
    public static readonly RULE_overClause = 28;
    public static readonly RULE_partitionByClause = 29;
    public static readonly RULE_constant = 30;
    public static readonly RULE_decimalLiteral = 31;
    public static readonly RULE_numericLiteral = 32;
    public static readonly RULE_stringLiteral = 33;
    public static readonly RULE_booleanLiteral = 34;
    public static readonly RULE_realLiteral = 35;
    public static readonly RULE_sign = 36;
    public static readonly RULE_nullLiteral = 37;
    public static readonly RULE_datetimeLiteral = 38;
    public static readonly RULE_dateLiteral = 39;
    public static readonly RULE_timeLiteral = 40;
    public static readonly RULE_timestampLiteral = 41;
    public static readonly RULE_datetimeConstantLiteral = 42;
    public static readonly RULE_intervalLiteral = 43;
    public static readonly RULE_intervalUnit = 44;
    public static readonly RULE_expression = 45;
    public static readonly RULE_predicate = 46;
    public static readonly RULE_expressions = 47;
    public static readonly RULE_expressionAtom = 48;
    public static readonly RULE_comparisonOperator = 49;
    public static readonly RULE_nullNotnull = 50;
    public static readonly RULE_functionCall = 51;
    public static readonly RULE_timestampFunction = 52;
    public static readonly RULE_timestampFunctionName = 53;
    public static readonly RULE_getFormatFunction = 54;
    public static readonly RULE_getFormatType = 55;
    public static readonly RULE_extractFunction = 56;
    public static readonly RULE_simpleDateTimePart = 57;
    public static readonly RULE_complexDateTimePart = 58;
    public static readonly RULE_datetimePart = 59;
    public static readonly RULE_highlightFunction = 60;
    public static readonly RULE_bucketFunction = 61;
    public static readonly RULE_intervalArgName = 62;
    public static readonly RULE_positionFunction = 63;
    public static readonly RULE_matchQueryAltSyntaxFunction = 64;
    public static readonly RULE_scalarFunctionName = 65;
    public static readonly RULE_bucketFunctionName = 66;
    public static readonly RULE_specificFunction = 67;
    public static readonly RULE_relevanceFunction = 68;
    public static readonly RULE_scoreRelevanceFunction = 69;
    public static readonly RULE_noFieldRelevanceFunction = 70;
    public static readonly RULE_singleFieldRelevanceFunction = 71;
    public static readonly RULE_multiFieldRelevanceFunction = 72;
    public static readonly RULE_altSingleFieldRelevanceFunction = 73;
    public static readonly RULE_altMultiFieldRelevanceFunction = 74;
    public static readonly RULE_convertedDataType = 75;
    public static readonly RULE_caseFuncAlternative = 76;
    public static readonly RULE_aggregateFunction = 77;
    public static readonly RULE_percentileApproxFunction = 78;
    public static readonly RULE_filterClause = 79;
    public static readonly RULE_aggregationFunctionName = 80;
    public static readonly RULE_mathematicalFunctionName = 81;
    public static readonly RULE_trigonometricFunctionName = 82;
    public static readonly RULE_arithmeticFunctionName = 83;
    public static readonly RULE_dateTimeFunctionName = 84;
    public static readonly RULE_textFunctionName = 85;
    public static readonly RULE_flowControlFunctionName = 86;
    public static readonly RULE_noFieldRelevanceFunctionName = 87;
    public static readonly RULE_systemFunctionName = 88;
    public static readonly RULE_nestedFunctionName = 89;
    public static readonly RULE_scoreRelevanceFunctionName = 90;
    public static readonly RULE_singleFieldRelevanceFunctionName = 91;
    public static readonly RULE_multiFieldRelevanceFunctionName = 92;
    public static readonly RULE_altSingleFieldRelevanceFunctionName = 93;
    public static readonly RULE_altMultiFieldRelevanceFunctionName = 94;
    public static readonly RULE_functionArgs = 95;
    public static readonly RULE_functionArg = 96;
    public static readonly RULE_relevanceArg = 97;
    public static readonly RULE_highlightArg = 98;
    public static readonly RULE_relevanceArgName = 99;
    public static readonly RULE_highlightArgName = 100;
    public static readonly RULE_relevanceFieldAndWeight = 101;
    public static readonly RULE_relevanceFieldWeight = 102;
    public static readonly RULE_relevanceField = 103;
    public static readonly RULE_relevanceQuery = 104;
    public static readonly RULE_relevanceArgValue = 105;
    public static readonly RULE_highlightArgValue = 106;
    public static readonly RULE_bucketArgValue = 107;
    public static readonly RULE_alternateMultiMatchArgName = 108;
    public static readonly RULE_alternateMultiMatchQuery = 109;
    public static readonly RULE_alternateMultiMatchField = 110;
    public static readonly RULE_tableName = 111;
    public static readonly RULE_columnName = 112;
    public static readonly RULE_allTupleFields = 113;
    public static readonly RULE_alias = 114;
    public static readonly RULE_qualifiedName = 115;
    public static readonly RULE_ident = 116;
    public static readonly RULE_keywordsCanBeId = 117;

    public static readonly literalNames = [
        null, null, null, null, null, "'ALL'", "'AND'", "'AS'", "'ASC'", 
        "'BOOLEAN'", "'BETWEEN'", "'BY'", "'CASE'", "'CAST'", "'CROSS'", 
        "'COLUMNS'", "'DATETIME'", "'DELETE'", "'DESC'", "'DESCRIBE'", "'DISTINCT'", 
        "'DOUBLE'", "'ELSE'", "'EXISTS'", "'FALSE'", "'FLOAT'", "'FIRST'", 
        "'FROM'", "'GROUP'", "'HAVING'", "'IN'", "'INNER'", "'INT'", "'INTEGER'", 
        "'IS'", "'JOIN'", "'LAST'", "'LEFT'", "'LIKE'", "'LIMIT'", "'LONG'", 
        "'MATCH'", "'NATURAL'", "'MISSING'", "'NOT'", "'NULL'", "'NULLS'", 
        "'ON'", "'OR'", "'ORDER'", "'OUTER'", "'OVER'", "'PARTITION'", "'REGEXP'", 
        "'RIGHT'", "'SELECT'", "'SHOW'", "'STRING'", "'THEN'", "'TRUE'", 
        "'UNION'", "'USING'", "'WHEN'", "'WHERE'", "'MINUS'", "'AVG'", "'COUNT'", 
        "'MAX'", "'MIN'", "'SUM'", "'VAR_POP'", "'VAR_SAMP'", "'VARIANCE'", 
        "'STD'", "'STDDEV'", "'STDDEV_POP'", "'STDDEV_SAMP'", "'SUBSTRING'", 
        "'TRIM'", "'END'", "'FULL'", "'OFFSET'", "'INTERVAL'", "'FIXED_INTERVAL'", 
        "'CALENDAR_INTERVAL'", "'MICROSECOND'", "'SECOND'", "'MINUTE'", 
        "'HOUR'", "'DAY'", "'WEEK'", "'MONTH'", "'QUARTER'", "'YEAR'", "'SECOND_MICROSECOND'", 
        "'MINUTE_MICROSECOND'", "'MINUTE_SECOND'", "'HOUR_MICROSECOND'", 
        "'HOUR_SECOND'", "'HOUR_MINUTE'", "'DAY_MICROSECOND'", "'DAY_SECOND'", 
        "'DAY_MINUTE'", "'DAY_HOUR'", "'YEAR_MONTH'", "'TABLES'", "'ABS'", 
        "'ACOS'", "'ADD'", "'ADDTIME'", "'ASCII'", "'ASIN'", "'ATAN'", "'ATAN2'", 
        "'CBRT'", "'CEIL'", "'CEILING'", "'CONCAT'", "'CONCAT_WS'", "'CONV'", 
        "'CONVERT_TZ'", "'COS'", "'COSH'", "'COT'", "'CRC32'", "'CURDATE'", 
        "'CURTIME'", "'CURRENT_DATE'", "'CURRENT_TIME'", "'CURRENT_TIMESTAMP'", 
        "'DATE'", "'DATE_ADD'", "'DATE_FORMAT'", "'DATE_SUB'", "'DATEDIFF'", 
        "'DAYNAME'", "'DAYOFMONTH'", "'DAYOFWEEK'", "'DAYOFYEAR'", "'DEGREES'", 
        "'DIVIDE'", "'E'", "'EXP'", "'EXPM1'", "'EXTRACT'", "'FLOOR'", "'FROM_DAYS'", 
        "'FROM_UNIXTIME'", "'GET_FORMAT'", "'IF'", "'IFNULL'", "'ISNULL'", 
        "'LAST_DAY'", "'LENGTH'", "'LN'", "'LOCALTIME'", "'LOCALTIMESTAMP'", 
        "'LOCATE'", "'LOG'", "'LOG10'", "'LOG2'", "'LOWER'", "'LTRIM'", 
        "'MAKEDATE'", "'MAKETIME'", "'MODULUS'", "'MONTHNAME'", "'MULTIPLY'", 
        "'NOW'", "'NULLIF'", "'PERIOD_ADD'", "'PERIOD_DIFF'", "'PI'", "'POSITION'", 
        "'POW'", "'POWER'", "'RADIANS'", "'RAND'", "'REPLACE'", "'RINT'", 
        "'ROUND'", "'RTRIM'", "'REVERSE'", "'SEC_TO_TIME'", "'SIGN'", "'SIGNUM'", 
        "'SIN'", "'SINH'", "'SQRT'", "'STR_TO_DATE'", "'SUBDATE'", "'SUBTIME'", 
        "'SUBTRACT'", "'SYSDATE'", "'TAN'", "'TIME'", "'TIMEDIFF'", "'TIME_FORMAT'", 
        "'TIME_TO_SEC'", "'TIMESTAMP'", "'TRUNCATE'", "'TO_DAYS'", "'TO_SECONDS'", 
        "'UNIX_TIMESTAMP'", "'UPPER'", "'UTC_DATE'", "'UTC_TIME'", "'UTC_TIMESTAMP'", 
        "'D'", "'T'", "'TS'", "'{'", "'}'", "'DENSE_RANK'", "'RANK'", "'ROW_NUMBER'", 
        "'DATE_HISTOGRAM'", "'DAY_OF_MONTH'", "'DAY_OF_YEAR'", "'DAY_OF_WEEK'", 
        "'EXCLUDE'", "'EXTENDED_STATS'", "'FIELD'", "'FILTER'", "'GEO_BOUNDING_BOX'", 
        "'GEO_CELL'", "'GEO_DISTANCE'", "'GEO_DISTANCE_RANGE'", "'GEO_INTERSECTS'", 
        "'GEO_POLYGON'", "'HISTOGRAM'", "'HOUR_OF_DAY'", "'INCLUDE'", "'IN_TERMS'", 
        "'MATCHPHRASE'", "'MATCH_PHRASE'", "'MATCHPHRASEQUERY'", "'SIMPLE_QUERY_STRING'", 
        "'QUERY_STRING'", "'MATCH_PHRASE_PREFIX'", "'MATCHQUERY'", "'MATCH_QUERY'", 
        "'MINUTE_OF_DAY'", "'MINUTE_OF_HOUR'", "'MONTH_OF_YEAR'", "'MULTIMATCH'", 
        "'MULTI_MATCH'", "'MULTIMATCHQUERY'", "'NESTED'", "'PERCENTILES'", 
        "'PERCENTILE'", "'PERCENTILE_APPROX'", "'REGEXP_QUERY'", "'REVERSE_NESTED'", 
        "'QUERY'", "'RANGE'", "'SCORE'", "'SCOREQUERY'", "'SCORE_QUERY'", 
        "'SECOND_OF_MINUTE'", "'STATS'", "'TERM'", "'TERMS'", "'TIMESTAMPADD'", 
        "'TIMESTAMPDIFF'", "'TOPHITS'", "'TYPEOF'", "'WEEK_OF_YEAR'", "'WEEKOFYEAR'", 
        "'WEEKDAY'", "'WILDCARDQUERY'", "'WILDCARD_QUERY'", "'SUBSTR'", 
        "'STRCMP'", "'ADDDATE'", "'YEARWEEK'", "'ALLOW_LEADING_WILDCARD'", 
        "'ANALYZER'", "'ANALYZE_WILDCARD'", "'AUTO_GENERATE_SYNONYMS_PHRASE_QUERY'", 
        "'BOOST'", "'CASE_INSENSITIVE'", "'CUTOFF_FREQUENCY'", "'DEFAULT_FIELD'", 
        "'DEFAULT_OPERATOR'", "'ESCAPE'", "'ENABLE_POSITION_INCREMENTS'", 
        "'FIELDS'", "'FLAGS'", "'FUZZINESS'", "'FUZZY_MAX_EXPANSIONS'", 
        "'FUZZY_PREFIX_LENGTH'", "'FUZZY_REWRITE'", "'FUZZY_TRANSPOSITIONS'", 
        "'LENIENT'", "'LOW_FREQ_OPERATOR'", "'MAX_DETERMINIZED_STATES'", 
        "'MAX_EXPANSIONS'", "'MINIMUM_SHOULD_MATCH'", "'OPERATOR'", "'PHRASE_SLOP'", 
        "'PREFIX_LENGTH'", "'QUOTE_ANALYZER'", "'QUOTE_FIELD_SUFFIX'", "'REWRITE'", 
        "'SLOP'", "'TIE_BREAKER'", "'TIME_ZONE'", "'TYPE'", "'ZERO_TERMS_QUERY'", 
        "'HIGHLIGHT'", "'PRE_TAGS'", "'POST_TAGS'", "'MATCH_BOOL_PREFIX'", 
        "'*'", "'/'", "'%'", "'+'", "'-'", "'DIV'", "'MOD'", "'='", "'>'", 
        "'<'", "'!'", "'~'", "'|'", "'&'", "'^'", "'.'", "'('", "')'", "'['", 
        "']'", "','", "';'", "'@'", "'0'", "'1'", "'2'", "'''", "'\"'", 
        "'`'", "':'"
    ];

    public static readonly symbolicNames = [
        null, "SPACE", "SPEC_SQL_COMMENT", "COMMENT_INPUT", "LINE_COMMENT", 
        "ALL", "AND", "AS", "ASC", "BOOLEAN", "BETWEEN", "BY", "CASE", "CAST", 
        "CROSS", "COLUMNS", "DATETIME", "DELETE", "DESC", "DESCRIBE", "DISTINCT", 
        "DOUBLE", "ELSE", "EXISTS", "FALSE", "FLOAT", "FIRST", "FROM", "GROUP", 
        "HAVING", "IN", "INNER", "INT", "INTEGER", "IS", "JOIN", "LAST", 
        "LEFT", "LIKE", "LIMIT", "LONG", "MATCH", "NATURAL", "MISSING_LITERAL", 
        "NOT", "NULL_LITERAL", "NULLS", "ON", "OR", "ORDER", "OUTER", "OVER", 
        "PARTITION", "REGEXP", "RIGHT", "SELECT", "SHOW", "STRING", "THEN", 
        "TRUE", "UNION", "USING", "WHEN", "WHERE", "EXCEPT", "AVG", "COUNT", 
        "MAX", "MIN", "SUM", "VAR_POP", "VAR_SAMP", "VARIANCE", "STD", "STDDEV", 
        "STDDEV_POP", "STDDEV_SAMP", "SUBSTRING", "TRIM", "END", "FULL", 
        "OFFSET", "INTERVAL", "FIXED_INTERVAL", "CALENDAR_INTERVAL", "MICROSECOND", 
        "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR", 
        "SECOND_MICROSECOND", "MINUTE_MICROSECOND", "MINUTE_SECOND", "HOUR_MICROSECOND", 
        "HOUR_SECOND", "HOUR_MINUTE", "DAY_MICROSECOND", "DAY_SECOND", "DAY_MINUTE", 
        "DAY_HOUR", "YEAR_MONTH", "TABLES", "ABS", "ACOS", "ADD", "ADDTIME", 
        "ASCII", "ASIN", "ATAN", "ATAN2", "CBRT", "CEIL", "CEILING", "CONCAT", 
        "CONCAT_WS", "CONV", "CONVERT_TZ", "COS", "COSH", "COT", "CRC32", 
        "CURDATE", "CURTIME", "CURRENT_DATE", "CURRENT_TIME", "CURRENT_TIMESTAMP", 
        "DATE", "DATE_ADD", "DATE_FORMAT", "DATE_SUB", "DATEDIFF", "DAYNAME", 
        "DAYOFMONTH", "DAYOFWEEK", "DAYOFYEAR", "DEGREES", "DIVIDE", "E", 
        "EXP", "EXPM1", "EXTRACT", "FLOOR", "FROM_DAYS", "FROM_UNIXTIME", 
        "GET_FORMAT", "IF", "IFNULL", "ISNULL", "LAST_DAY", "LENGTH", "LN", 
        "LOCALTIME", "LOCALTIMESTAMP", "LOCATE", "LOG", "LOG10", "LOG2", 
        "LOWER", "LTRIM", "MAKEDATE", "MAKETIME", "MODULUS", "MONTHNAME", 
        "MULTIPLY", "NOW", "NULLIF", "PERIOD_ADD", "PERIOD_DIFF", "PI", 
        "POSITION", "POW", "POWER", "RADIANS", "RAND", "REPLACE", "RINT", 
        "ROUND", "RTRIM", "REVERSE", "SEC_TO_TIME", "SIGN", "SIGNUM", "SIN", 
        "SINH", "SQRT", "STR_TO_DATE", "SUBDATE", "SUBTIME", "SUBTRACT", 
        "SYSDATE", "TAN", "TIME", "TIMEDIFF", "TIME_FORMAT", "TIME_TO_SEC", 
        "TIMESTAMP", "TRUNCATE", "TO_DAYS", "TO_SECONDS", "UNIX_TIMESTAMP", 
        "UPPER", "UTC_DATE", "UTC_TIME", "UTC_TIMESTAMP", "D", "T", "TS", 
        "LEFT_BRACE", "RIGHT_BRACE", "DENSE_RANK", "RANK", "ROW_NUMBER", 
        "DATE_HISTOGRAM", "DAY_OF_MONTH", "DAY_OF_YEAR", "DAY_OF_WEEK", 
        "EXCLUDE", "EXTENDED_STATS", "FIELD", "FILTER", "GEO_BOUNDING_BOX", 
        "GEO_CELL", "GEO_DISTANCE", "GEO_DISTANCE_RANGE", "GEO_INTERSECTS", 
        "GEO_POLYGON", "HISTOGRAM", "HOUR_OF_DAY", "INCLUDE", "IN_TERMS", 
        "MATCHPHRASE", "MATCH_PHRASE", "MATCHPHRASEQUERY", "SIMPLE_QUERY_STRING", 
        "QUERY_STRING", "MATCH_PHRASE_PREFIX", "MATCHQUERY", "MATCH_QUERY", 
        "MINUTE_OF_DAY", "MINUTE_OF_HOUR", "MONTH_OF_YEAR", "MULTIMATCH", 
        "MULTI_MATCH", "MULTIMATCHQUERY", "NESTED", "PERCENTILES", "PERCENTILE", 
        "PERCENTILE_APPROX", "REGEXP_QUERY", "REVERSE_NESTED", "QUERY", 
        "RANGE", "SCORE", "SCOREQUERY", "SCORE_QUERY", "SECOND_OF_MINUTE", 
        "STATS", "TERM", "TERMS", "TIMESTAMPADD", "TIMESTAMPDIFF", "TOPHITS", 
        "TYPEOF", "WEEK_OF_YEAR", "WEEKOFYEAR", "WEEKDAY", "WILDCARDQUERY", 
        "WILDCARD_QUERY", "SUBSTR", "STRCMP", "ADDDATE", "YEARWEEK", "ALLOW_LEADING_WILDCARD", 
        "ANALYZER", "ANALYZE_WILDCARD", "AUTO_GENERATE_SYNONYMS_PHRASE_QUERY", 
        "BOOST", "CASE_INSENSITIVE", "CUTOFF_FREQUENCY", "DEFAULT_FIELD", 
        "DEFAULT_OPERATOR", "ESCAPE", "ENABLE_POSITION_INCREMENTS", "FIELDS", 
        "FLAGS", "FUZZINESS", "FUZZY_MAX_EXPANSIONS", "FUZZY_PREFIX_LENGTH", 
        "FUZZY_REWRITE", "FUZZY_TRANSPOSITIONS", "LENIENT", "LOW_FREQ_OPERATOR", 
        "MAX_DETERMINIZED_STATES", "MAX_EXPANSIONS", "MINIMUM_SHOULD_MATCH", 
        "OPERATOR", "PHRASE_SLOP", "PREFIX_LENGTH", "QUOTE_ANALYZER", "QUOTE_FIELD_SUFFIX", 
        "REWRITE", "SLOP", "TIE_BREAKER", "TIME_ZONE", "TYPE", "ZERO_TERMS_QUERY", 
        "HIGHLIGHT", "HIGHLIGHT_PRE_TAGS", "HIGHLIGHT_POST_TAGS", "MATCH_BOOL_PREFIX", 
        "STAR", "SLASH", "MODULE", "PLUS", "MINUS", "DIV", "MOD", "EQUAL_SYMBOL", 
        "GREATER_SYMBOL", "LESS_SYMBOL", "EXCLAMATION_SYMBOL", "BIT_NOT_OP", 
        "BIT_OR_OP", "BIT_AND_OP", "BIT_XOR_OP", "DOT", "LR_BRACKET", "RR_BRACKET", 
        "LT_SQR_PRTHS", "RT_SQR_PRTHS", "COMMA", "SEMI", "AT_SIGN", "ZERO_DECIMAL", 
        "ONE_DECIMAL", "TWO_DECIMAL", "SINGLE_QUOTE_SYMB", "DOUBLE_QUOTE_SYMB", 
        "REVERSE_QUOTE_SYMB", "COLON_SYMB", "START_NATIONAL_STRING_LITERAL", 
        "STRING_LITERAL", "DECIMAL_LITERAL", "HEXADECIMAL_LITERAL", "REAL_LITERAL", 
        "NULL_SPEC_LITERAL", "BIT_STRING", "ID", "DOUBLE_QUOTE_ID", "BACKTICK_QUOTE_ID", 
        "ERROR_RECOGNITION"
    ];
    public static readonly ruleNames = [
        "root", "sqlStatement", "dmlStatement", "selectStatement", "adminStatement", 
        "showStatement", "describeStatement", "columnFilter", "tableFilter", 
        "showDescribePattern", "compatibleID", "querySpecification", "selectClause", 
        "selectSpec", "selectElements", "selectElement", "fromClause", "relation", 
        "whereClause", "groupByClause", "groupByElements", "groupByElement", 
        "havingClause", "orderByClause", "orderByElement", "limitClause", 
        "windowFunctionClause", "windowFunction", "overClause", "partitionByClause", 
        "constant", "decimalLiteral", "numericLiteral", "stringLiteral", 
        "booleanLiteral", "realLiteral", "sign", "nullLiteral", "datetimeLiteral", 
        "dateLiteral", "timeLiteral", "timestampLiteral", "datetimeConstantLiteral", 
        "intervalLiteral", "intervalUnit", "expression", "predicate", "expressions", 
        "expressionAtom", "comparisonOperator", "nullNotnull", "functionCall", 
        "timestampFunction", "timestampFunctionName", "getFormatFunction", 
        "getFormatType", "extractFunction", "simpleDateTimePart", "complexDateTimePart", 
        "datetimePart", "highlightFunction", "bucketFunction", "intervalArgName", 
        "positionFunction", "matchQueryAltSyntaxFunction", "scalarFunctionName", 
        "bucketFunctionName", "specificFunction", "relevanceFunction", "scoreRelevanceFunction", 
        "noFieldRelevanceFunction", "singleFieldRelevanceFunction", "multiFieldRelevanceFunction", 
        "altSingleFieldRelevanceFunction", "altMultiFieldRelevanceFunction", 
        "convertedDataType", "caseFuncAlternative", "aggregateFunction", 
        "percentileApproxFunction", "filterClause", "aggregationFunctionName", 
        "mathematicalFunctionName", "trigonometricFunctionName", "arithmeticFunctionName", 
        "dateTimeFunctionName", "textFunctionName", "flowControlFunctionName", 
        "noFieldRelevanceFunctionName", "systemFunctionName", "nestedFunctionName", 
        "scoreRelevanceFunctionName", "singleFieldRelevanceFunctionName", 
        "multiFieldRelevanceFunctionName", "altSingleFieldRelevanceFunctionName", 
        "altMultiFieldRelevanceFunctionName", "functionArgs", "functionArg", 
        "relevanceArg", "highlightArg", "relevanceArgName", "highlightArgName", 
        "relevanceFieldAndWeight", "relevanceFieldWeight", "relevanceField", 
        "relevanceQuery", "relevanceArgValue", "highlightArgValue", "bucketArgValue", 
        "alternateMultiMatchArgName", "alternateMultiMatchQuery", "alternateMultiMatchField", 
        "tableName", "columnName", "allTupleFields", "alias", "qualifiedName", 
        "ident", "keywordsCanBeId",
    ];

    public get grammarFileName(): string { return "OpenSearchSQLParser.g4"; }
    public get literalNames(): (string | null)[] { return OpenSearchSQLParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return OpenSearchSQLParser.symbolicNames; }
    public get ruleNames(): string[] { return OpenSearchSQLParser.ruleNames; }
    public get serializedATN(): number[] { return OpenSearchSQLParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, OpenSearchSQLParser._ATN, OpenSearchSQLParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public root(): RootContext {
        let localContext = new RootContext(this.context, this.state);
        this.enterRule(localContext, 0, OpenSearchSQLParser.RULE_root);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 237;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 19 || _la === 55 || _la === 56) {
                {
                this.state = 236;
                this.sqlStatement();
                }
            }

            this.state = 240;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 335) {
                {
                this.state = 239;
                this.match(OpenSearchSQLParser.SEMI);
                }
            }

            this.state = 242;
            this.match(OpenSearchSQLParser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public sqlStatement(): SqlStatementContext {
        let localContext = new SqlStatementContext(this.context, this.state);
        this.enterRule(localContext, 2, OpenSearchSQLParser.RULE_sqlStatement);
        try {
            this.state = 246;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.SELECT:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 244;
                this.dmlStatement();
                }
                break;
            case OpenSearchSQLParser.DESCRIBE:
            case OpenSearchSQLParser.SHOW:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 245;
                this.adminStatement();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public dmlStatement(): DmlStatementContext {
        let localContext = new DmlStatementContext(this.context, this.state);
        this.enterRule(localContext, 4, OpenSearchSQLParser.RULE_dmlStatement);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 248;
            this.selectStatement();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public selectStatement(): SelectStatementContext {
        let localContext = new SelectStatementContext(this.context, this.state);
        this.enterRule(localContext, 6, OpenSearchSQLParser.RULE_selectStatement);
        try {
            localContext = new SimpleSelectContext(localContext);
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 250;
            this.querySpecification();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public adminStatement(): AdminStatementContext {
        let localContext = new AdminStatementContext(this.context, this.state);
        this.enterRule(localContext, 8, OpenSearchSQLParser.RULE_adminStatement);
        try {
            this.state = 254;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.SHOW:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 252;
                this.showStatement();
                }
                break;
            case OpenSearchSQLParser.DESCRIBE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 253;
                this.describeStatement();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public showStatement(): ShowStatementContext {
        let localContext = new ShowStatementContext(this.context, this.state);
        this.enterRule(localContext, 10, OpenSearchSQLParser.RULE_showStatement);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 256;
            this.match(OpenSearchSQLParser.SHOW);
            this.state = 257;
            this.match(OpenSearchSQLParser.TABLES);
            this.state = 258;
            this.tableFilter();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public describeStatement(): DescribeStatementContext {
        let localContext = new DescribeStatementContext(this.context, this.state);
        this.enterRule(localContext, 12, OpenSearchSQLParser.RULE_describeStatement);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 260;
            this.match(OpenSearchSQLParser.DESCRIBE);
            this.state = 261;
            this.match(OpenSearchSQLParser.TABLES);
            this.state = 262;
            this.tableFilter();
            this.state = 264;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 15) {
                {
                this.state = 263;
                this.columnFilter();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public columnFilter(): ColumnFilterContext {
        let localContext = new ColumnFilterContext(this.context, this.state);
        this.enterRule(localContext, 14, OpenSearchSQLParser.RULE_columnFilter);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 266;
            this.match(OpenSearchSQLParser.COLUMNS);
            this.state = 267;
            this.match(OpenSearchSQLParser.LIKE);
            this.state = 268;
            this.showDescribePattern();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tableFilter(): TableFilterContext {
        let localContext = new TableFilterContext(this.context, this.state);
        this.enterRule(localContext, 16, OpenSearchSQLParser.RULE_tableFilter);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 270;
            this.match(OpenSearchSQLParser.LIKE);
            this.state = 271;
            this.showDescribePattern();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public showDescribePattern(): ShowDescribePatternContext {
        let localContext = new ShowDescribePatternContext(this.context, this.state);
        this.enterRule(localContext, 18, OpenSearchSQLParser.RULE_showDescribePattern);
        try {
            this.state = 275;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.MODULE:
            case OpenSearchSQLParser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 273;
                localContext._oldID = this.compatibleID();
                }
                break;
            case OpenSearchSQLParser.STRING_LITERAL:
            case OpenSearchSQLParser.DOUBLE_QUOTE_ID:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 274;
                this.stringLiteral();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public compatibleID(): CompatibleIDContext {
        let localContext = new CompatibleIDContext(this.context, this.state);
        this.enterRule(localContext, 20, OpenSearchSQLParser.RULE_compatibleID);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 278;
            this.errorHandler.sync(this);
            alternative = 1 + 1;
            do {
                switch (alternative) {
                case 1 + 1:
                    {
                    {
                    this.state = 277;
                    _la = this.tokenStream.LA(1);
                    if(!(_la === 316 || _la === 351)) {
                    this.errorHandler.recoverInline(this);
                    }
                    else {
                        this.errorHandler.reportMatch(this);
                        this.consume();
                    }
                    }
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                this.state = 280;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 6, this.context);
            } while (alternative !== 1 && alternative !== antlr.ATN.INVALID_ALT_NUMBER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public querySpecification(): QuerySpecificationContext {
        let localContext = new QuerySpecificationContext(this.context, this.state);
        this.enterRule(localContext, 22, OpenSearchSQLParser.RULE_querySpecification);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 282;
            this.selectClause();
            this.state = 284;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 27) {
                {
                this.state = 283;
                this.fromClause();
                }
            }

            this.state = 287;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 39) {
                {
                this.state = 286;
                this.limitClause();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public selectClause(): SelectClauseContext {
        let localContext = new SelectClauseContext(this.context, this.state);
        this.enterRule(localContext, 24, OpenSearchSQLParser.RULE_selectClause);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 289;
            this.match(OpenSearchSQLParser.SELECT);
            this.state = 291;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 5 || _la === 20) {
                {
                this.state = 290;
                this.selectSpec();
                }
            }

            this.state = 293;
            this.selectElements();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public selectSpec(): SelectSpecContext {
        let localContext = new SelectSpecContext(this.context, this.state);
        this.enterRule(localContext, 26, OpenSearchSQLParser.RULE_selectSpec);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 295;
            _la = this.tokenStream.LA(1);
            if(!(_la === 5 || _la === 20)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public selectElements(): SelectElementsContext {
        let localContext = new SelectElementsContext(this.context, this.state);
        this.enterRule(localContext, 28, OpenSearchSQLParser.RULE_selectElements);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 299;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.STAR:
                {
                this.state = 297;
                localContext._star = this.match(OpenSearchSQLParser.STAR);
                }
                break;
            case OpenSearchSQLParser.CASE:
            case OpenSearchSQLParser.CAST:
            case OpenSearchSQLParser.DATETIME:
            case OpenSearchSQLParser.FALSE:
            case OpenSearchSQLParser.FIRST:
            case OpenSearchSQLParser.LAST:
            case OpenSearchSQLParser.LEFT:
            case OpenSearchSQLParser.MATCH:
            case OpenSearchSQLParser.NOT:
            case OpenSearchSQLParser.NULL_LITERAL:
            case OpenSearchSQLParser.RIGHT:
            case OpenSearchSQLParser.TRUE:
            case OpenSearchSQLParser.AVG:
            case OpenSearchSQLParser.COUNT:
            case OpenSearchSQLParser.MAX:
            case OpenSearchSQLParser.MIN:
            case OpenSearchSQLParser.SUM:
            case OpenSearchSQLParser.VAR_POP:
            case OpenSearchSQLParser.VAR_SAMP:
            case OpenSearchSQLParser.VARIANCE:
            case OpenSearchSQLParser.STD:
            case OpenSearchSQLParser.STDDEV:
            case OpenSearchSQLParser.STDDEV_POP:
            case OpenSearchSQLParser.STDDEV_SAMP:
            case OpenSearchSQLParser.SUBSTRING:
            case OpenSearchSQLParser.TRIM:
            case OpenSearchSQLParser.FULL:
            case OpenSearchSQLParser.INTERVAL:
            case OpenSearchSQLParser.FIXED_INTERVAL:
            case OpenSearchSQLParser.CALENDAR_INTERVAL:
            case OpenSearchSQLParser.MICROSECOND:
            case OpenSearchSQLParser.SECOND:
            case OpenSearchSQLParser.MINUTE:
            case OpenSearchSQLParser.HOUR:
            case OpenSearchSQLParser.DAY:
            case OpenSearchSQLParser.WEEK:
            case OpenSearchSQLParser.MONTH:
            case OpenSearchSQLParser.QUARTER:
            case OpenSearchSQLParser.YEAR:
            case OpenSearchSQLParser.ABS:
            case OpenSearchSQLParser.ACOS:
            case OpenSearchSQLParser.ADD:
            case OpenSearchSQLParser.ADDTIME:
            case OpenSearchSQLParser.ASCII:
            case OpenSearchSQLParser.ASIN:
            case OpenSearchSQLParser.ATAN:
            case OpenSearchSQLParser.ATAN2:
            case OpenSearchSQLParser.CBRT:
            case OpenSearchSQLParser.CEIL:
            case OpenSearchSQLParser.CEILING:
            case OpenSearchSQLParser.CONCAT:
            case OpenSearchSQLParser.CONCAT_WS:
            case OpenSearchSQLParser.CONV:
            case OpenSearchSQLParser.CONVERT_TZ:
            case OpenSearchSQLParser.COS:
            case OpenSearchSQLParser.COSH:
            case OpenSearchSQLParser.COT:
            case OpenSearchSQLParser.CRC32:
            case OpenSearchSQLParser.CURDATE:
            case OpenSearchSQLParser.CURTIME:
            case OpenSearchSQLParser.CURRENT_DATE:
            case OpenSearchSQLParser.CURRENT_TIME:
            case OpenSearchSQLParser.CURRENT_TIMESTAMP:
            case OpenSearchSQLParser.DATE:
            case OpenSearchSQLParser.DATE_ADD:
            case OpenSearchSQLParser.DATE_FORMAT:
            case OpenSearchSQLParser.DATE_SUB:
            case OpenSearchSQLParser.DATEDIFF:
            case OpenSearchSQLParser.DAYNAME:
            case OpenSearchSQLParser.DAYOFMONTH:
            case OpenSearchSQLParser.DAYOFWEEK:
            case OpenSearchSQLParser.DAYOFYEAR:
            case OpenSearchSQLParser.DEGREES:
            case OpenSearchSQLParser.DIVIDE:
            case OpenSearchSQLParser.E:
            case OpenSearchSQLParser.EXP:
            case OpenSearchSQLParser.EXPM1:
            case OpenSearchSQLParser.EXTRACT:
            case OpenSearchSQLParser.FLOOR:
            case OpenSearchSQLParser.FROM_DAYS:
            case OpenSearchSQLParser.FROM_UNIXTIME:
            case OpenSearchSQLParser.GET_FORMAT:
            case OpenSearchSQLParser.IF:
            case OpenSearchSQLParser.IFNULL:
            case OpenSearchSQLParser.ISNULL:
            case OpenSearchSQLParser.LAST_DAY:
            case OpenSearchSQLParser.LENGTH:
            case OpenSearchSQLParser.LN:
            case OpenSearchSQLParser.LOCALTIME:
            case OpenSearchSQLParser.LOCALTIMESTAMP:
            case OpenSearchSQLParser.LOCATE:
            case OpenSearchSQLParser.LOG:
            case OpenSearchSQLParser.LOG10:
            case OpenSearchSQLParser.LOG2:
            case OpenSearchSQLParser.LOWER:
            case OpenSearchSQLParser.LTRIM:
            case OpenSearchSQLParser.MAKEDATE:
            case OpenSearchSQLParser.MAKETIME:
            case OpenSearchSQLParser.MODULUS:
            case OpenSearchSQLParser.MONTHNAME:
            case OpenSearchSQLParser.MULTIPLY:
            case OpenSearchSQLParser.NOW:
            case OpenSearchSQLParser.NULLIF:
            case OpenSearchSQLParser.PERIOD_ADD:
            case OpenSearchSQLParser.PERIOD_DIFF:
            case OpenSearchSQLParser.PI:
            case OpenSearchSQLParser.POSITION:
            case OpenSearchSQLParser.POW:
            case OpenSearchSQLParser.POWER:
            case OpenSearchSQLParser.RADIANS:
            case OpenSearchSQLParser.RAND:
            case OpenSearchSQLParser.REPLACE:
            case OpenSearchSQLParser.RINT:
            case OpenSearchSQLParser.ROUND:
            case OpenSearchSQLParser.RTRIM:
            case OpenSearchSQLParser.REVERSE:
            case OpenSearchSQLParser.SEC_TO_TIME:
            case OpenSearchSQLParser.SIGN:
            case OpenSearchSQLParser.SIGNUM:
            case OpenSearchSQLParser.SIN:
            case OpenSearchSQLParser.SINH:
            case OpenSearchSQLParser.SQRT:
            case OpenSearchSQLParser.STR_TO_DATE:
            case OpenSearchSQLParser.SUBDATE:
            case OpenSearchSQLParser.SUBTIME:
            case OpenSearchSQLParser.SUBTRACT:
            case OpenSearchSQLParser.SYSDATE:
            case OpenSearchSQLParser.TAN:
            case OpenSearchSQLParser.TIME:
            case OpenSearchSQLParser.TIMEDIFF:
            case OpenSearchSQLParser.TIME_FORMAT:
            case OpenSearchSQLParser.TIME_TO_SEC:
            case OpenSearchSQLParser.TIMESTAMP:
            case OpenSearchSQLParser.TRUNCATE:
            case OpenSearchSQLParser.TO_DAYS:
            case OpenSearchSQLParser.TO_SECONDS:
            case OpenSearchSQLParser.UNIX_TIMESTAMP:
            case OpenSearchSQLParser.UPPER:
            case OpenSearchSQLParser.UTC_DATE:
            case OpenSearchSQLParser.UTC_TIME:
            case OpenSearchSQLParser.UTC_TIMESTAMP:
            case OpenSearchSQLParser.D:
            case OpenSearchSQLParser.T:
            case OpenSearchSQLParser.TS:
            case OpenSearchSQLParser.LEFT_BRACE:
            case OpenSearchSQLParser.DENSE_RANK:
            case OpenSearchSQLParser.RANK:
            case OpenSearchSQLParser.ROW_NUMBER:
            case OpenSearchSQLParser.DATE_HISTOGRAM:
            case OpenSearchSQLParser.DAY_OF_MONTH:
            case OpenSearchSQLParser.DAY_OF_YEAR:
            case OpenSearchSQLParser.DAY_OF_WEEK:
            case OpenSearchSQLParser.FIELD:
            case OpenSearchSQLParser.HISTOGRAM:
            case OpenSearchSQLParser.HOUR_OF_DAY:
            case OpenSearchSQLParser.MATCHPHRASE:
            case OpenSearchSQLParser.MATCH_PHRASE:
            case OpenSearchSQLParser.MATCHPHRASEQUERY:
            case OpenSearchSQLParser.SIMPLE_QUERY_STRING:
            case OpenSearchSQLParser.QUERY_STRING:
            case OpenSearchSQLParser.MATCH_PHRASE_PREFIX:
            case OpenSearchSQLParser.MATCHQUERY:
            case OpenSearchSQLParser.MATCH_QUERY:
            case OpenSearchSQLParser.MINUTE_OF_DAY:
            case OpenSearchSQLParser.MINUTE_OF_HOUR:
            case OpenSearchSQLParser.MONTH_OF_YEAR:
            case OpenSearchSQLParser.MULTIMATCH:
            case OpenSearchSQLParser.MULTI_MATCH:
            case OpenSearchSQLParser.MULTIMATCHQUERY:
            case OpenSearchSQLParser.NESTED:
            case OpenSearchSQLParser.PERCENTILE:
            case OpenSearchSQLParser.PERCENTILE_APPROX:
            case OpenSearchSQLParser.QUERY:
            case OpenSearchSQLParser.SCORE:
            case OpenSearchSQLParser.SCOREQUERY:
            case OpenSearchSQLParser.SCORE_QUERY:
            case OpenSearchSQLParser.SECOND_OF_MINUTE:
            case OpenSearchSQLParser.TIMESTAMPADD:
            case OpenSearchSQLParser.TIMESTAMPDIFF:
            case OpenSearchSQLParser.TYPEOF:
            case OpenSearchSQLParser.WEEK_OF_YEAR:
            case OpenSearchSQLParser.WEEKOFYEAR:
            case OpenSearchSQLParser.WEEKDAY:
            case OpenSearchSQLParser.WILDCARDQUERY:
            case OpenSearchSQLParser.WILDCARD_QUERY:
            case OpenSearchSQLParser.SUBSTR:
            case OpenSearchSQLParser.STRCMP:
            case OpenSearchSQLParser.ADDDATE:
            case OpenSearchSQLParser.YEARWEEK:
            case OpenSearchSQLParser.TYPE:
            case OpenSearchSQLParser.HIGHLIGHT:
            case OpenSearchSQLParser.MATCH_BOOL_PREFIX:
            case OpenSearchSQLParser.PLUS:
            case OpenSearchSQLParser.MINUS:
            case OpenSearchSQLParser.MOD:
            case OpenSearchSQLParser.DOT:
            case OpenSearchSQLParser.LR_BRACKET:
            case OpenSearchSQLParser.ZERO_DECIMAL:
            case OpenSearchSQLParser.ONE_DECIMAL:
            case OpenSearchSQLParser.TWO_DECIMAL:
            case OpenSearchSQLParser.STRING_LITERAL:
            case OpenSearchSQLParser.DECIMAL_LITERAL:
            case OpenSearchSQLParser.REAL_LITERAL:
            case OpenSearchSQLParser.ID:
            case OpenSearchSQLParser.DOUBLE_QUOTE_ID:
            case OpenSearchSQLParser.BACKTICK_QUOTE_ID:
                {
                this.state = 298;
                this.selectElement();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 305;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 334) {
                {
                {
                this.state = 301;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 302;
                this.selectElement();
                }
                }
                this.state = 307;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public selectElement(): SelectElementContext {
        let localContext = new SelectElementContext(this.context, this.state);
        this.enterRule(localContext, 30, OpenSearchSQLParser.RULE_selectElement);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 308;
            this.expression(0);
            this.state = 313;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (((((_la - 7)) & ~0x1F) === 0 && ((1 << (_la - 7)) & 1611137537) !== 0) || ((((_la - 54)) & ~0x1F) === 0 && ((1 << (_la - 54)) & 3850434561) !== 0) || ((((_la - 86)) & ~0x1F) === 0 && ((1 << (_la - 86)) & 4293918975) !== 0) || ((((_la - 118)) & ~0x1F) === 0 && ((1 << (_la - 118)) & 3154116607) !== 0) || ((((_la - 150)) & ~0x1F) === 0 && ((1 << (_la - 150)) & 4286578687) !== 0) || ((((_la - 182)) & ~0x1F) === 0 && ((1 << (_la - 182)) & 536870911) !== 0) || ((((_la - 217)) & ~0x1F) === 0 && ((1 << (_la - 217)) & 2382381095) !== 0) || ((((_la - 259)) & ~0x1F) === 0 && ((1 << (_la - 259)) & 124801) !== 0) || ((((_la - 308)) & ~0x1F) === 0 && ((1 << (_la - 308)) & 2101249) !== 0) || _la === 351 || _la === 353) {
                {
                this.state = 310;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 7) {
                    {
                    this.state = 309;
                    this.match(OpenSearchSQLParser.AS);
                    }
                }

                this.state = 312;
                this.alias();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fromClause(): FromClauseContext {
        let localContext = new FromClauseContext(this.context, this.state);
        this.enterRule(localContext, 32, OpenSearchSQLParser.RULE_fromClause);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 315;
            this.match(OpenSearchSQLParser.FROM);
            this.state = 316;
            this.relation();
            this.state = 318;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 63) {
                {
                this.state = 317;
                this.whereClause();
                }
            }

            this.state = 321;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 28) {
                {
                this.state = 320;
                this.groupByClause();
                }
            }

            this.state = 324;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 29) {
                {
                this.state = 323;
                this.havingClause();
                }
            }

            this.state = 327;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 49) {
                {
                this.state = 326;
                this.orderByClause();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public relation(): RelationContext {
        let localContext = new RelationContext(this.context, this.state);
        this.enterRule(localContext, 34, OpenSearchSQLParser.RULE_relation);
        let _la: number;
        try {
            this.state = 344;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.DATETIME:
            case OpenSearchSQLParser.FIRST:
            case OpenSearchSQLParser.LAST:
            case OpenSearchSQLParser.LEFT:
            case OpenSearchSQLParser.RIGHT:
            case OpenSearchSQLParser.AVG:
            case OpenSearchSQLParser.COUNT:
            case OpenSearchSQLParser.MAX:
            case OpenSearchSQLParser.MIN:
            case OpenSearchSQLParser.SUM:
            case OpenSearchSQLParser.SUBSTRING:
            case OpenSearchSQLParser.TRIM:
            case OpenSearchSQLParser.FULL:
            case OpenSearchSQLParser.FIXED_INTERVAL:
            case OpenSearchSQLParser.CALENDAR_INTERVAL:
            case OpenSearchSQLParser.MICROSECOND:
            case OpenSearchSQLParser.SECOND:
            case OpenSearchSQLParser.MINUTE:
            case OpenSearchSQLParser.HOUR:
            case OpenSearchSQLParser.DAY:
            case OpenSearchSQLParser.WEEK:
            case OpenSearchSQLParser.MONTH:
            case OpenSearchSQLParser.QUARTER:
            case OpenSearchSQLParser.YEAR:
            case OpenSearchSQLParser.ABS:
            case OpenSearchSQLParser.ACOS:
            case OpenSearchSQLParser.ADD:
            case OpenSearchSQLParser.ADDTIME:
            case OpenSearchSQLParser.ASCII:
            case OpenSearchSQLParser.ASIN:
            case OpenSearchSQLParser.ATAN:
            case OpenSearchSQLParser.ATAN2:
            case OpenSearchSQLParser.CBRT:
            case OpenSearchSQLParser.CEIL:
            case OpenSearchSQLParser.CEILING:
            case OpenSearchSQLParser.CONCAT:
            case OpenSearchSQLParser.CONCAT_WS:
            case OpenSearchSQLParser.CONV:
            case OpenSearchSQLParser.CONVERT_TZ:
            case OpenSearchSQLParser.COS:
            case OpenSearchSQLParser.COSH:
            case OpenSearchSQLParser.COT:
            case OpenSearchSQLParser.CRC32:
            case OpenSearchSQLParser.CURDATE:
            case OpenSearchSQLParser.CURTIME:
            case OpenSearchSQLParser.CURRENT_DATE:
            case OpenSearchSQLParser.CURRENT_TIME:
            case OpenSearchSQLParser.CURRENT_TIMESTAMP:
            case OpenSearchSQLParser.DATE:
            case OpenSearchSQLParser.DATE_ADD:
            case OpenSearchSQLParser.DATE_FORMAT:
            case OpenSearchSQLParser.DATE_SUB:
            case OpenSearchSQLParser.DATEDIFF:
            case OpenSearchSQLParser.DAYNAME:
            case OpenSearchSQLParser.DAYOFMONTH:
            case OpenSearchSQLParser.DAYOFWEEK:
            case OpenSearchSQLParser.DAYOFYEAR:
            case OpenSearchSQLParser.DEGREES:
            case OpenSearchSQLParser.DIVIDE:
            case OpenSearchSQLParser.E:
            case OpenSearchSQLParser.EXP:
            case OpenSearchSQLParser.EXPM1:
            case OpenSearchSQLParser.FLOOR:
            case OpenSearchSQLParser.FROM_DAYS:
            case OpenSearchSQLParser.FROM_UNIXTIME:
            case OpenSearchSQLParser.IF:
            case OpenSearchSQLParser.IFNULL:
            case OpenSearchSQLParser.ISNULL:
            case OpenSearchSQLParser.LAST_DAY:
            case OpenSearchSQLParser.LENGTH:
            case OpenSearchSQLParser.LN:
            case OpenSearchSQLParser.LOCALTIME:
            case OpenSearchSQLParser.LOCALTIMESTAMP:
            case OpenSearchSQLParser.LOCATE:
            case OpenSearchSQLParser.LOG:
            case OpenSearchSQLParser.LOG10:
            case OpenSearchSQLParser.LOG2:
            case OpenSearchSQLParser.LOWER:
            case OpenSearchSQLParser.LTRIM:
            case OpenSearchSQLParser.MAKEDATE:
            case OpenSearchSQLParser.MAKETIME:
            case OpenSearchSQLParser.MODULUS:
            case OpenSearchSQLParser.MONTHNAME:
            case OpenSearchSQLParser.MULTIPLY:
            case OpenSearchSQLParser.NOW:
            case OpenSearchSQLParser.NULLIF:
            case OpenSearchSQLParser.PERIOD_ADD:
            case OpenSearchSQLParser.PERIOD_DIFF:
            case OpenSearchSQLParser.PI:
            case OpenSearchSQLParser.POW:
            case OpenSearchSQLParser.POWER:
            case OpenSearchSQLParser.RADIANS:
            case OpenSearchSQLParser.RAND:
            case OpenSearchSQLParser.REPLACE:
            case OpenSearchSQLParser.RINT:
            case OpenSearchSQLParser.ROUND:
            case OpenSearchSQLParser.RTRIM:
            case OpenSearchSQLParser.REVERSE:
            case OpenSearchSQLParser.SEC_TO_TIME:
            case OpenSearchSQLParser.SIGN:
            case OpenSearchSQLParser.SIGNUM:
            case OpenSearchSQLParser.SIN:
            case OpenSearchSQLParser.SINH:
            case OpenSearchSQLParser.SQRT:
            case OpenSearchSQLParser.STR_TO_DATE:
            case OpenSearchSQLParser.SUBDATE:
            case OpenSearchSQLParser.SUBTIME:
            case OpenSearchSQLParser.SUBTRACT:
            case OpenSearchSQLParser.SYSDATE:
            case OpenSearchSQLParser.TAN:
            case OpenSearchSQLParser.TIME:
            case OpenSearchSQLParser.TIMEDIFF:
            case OpenSearchSQLParser.TIME_FORMAT:
            case OpenSearchSQLParser.TIME_TO_SEC:
            case OpenSearchSQLParser.TIMESTAMP:
            case OpenSearchSQLParser.TRUNCATE:
            case OpenSearchSQLParser.TO_DAYS:
            case OpenSearchSQLParser.TO_SECONDS:
            case OpenSearchSQLParser.UNIX_TIMESTAMP:
            case OpenSearchSQLParser.UPPER:
            case OpenSearchSQLParser.UTC_DATE:
            case OpenSearchSQLParser.UTC_TIME:
            case OpenSearchSQLParser.UTC_TIMESTAMP:
            case OpenSearchSQLParser.D:
            case OpenSearchSQLParser.T:
            case OpenSearchSQLParser.TS:
            case OpenSearchSQLParser.DAY_OF_MONTH:
            case OpenSearchSQLParser.DAY_OF_YEAR:
            case OpenSearchSQLParser.DAY_OF_WEEK:
            case OpenSearchSQLParser.FIELD:
            case OpenSearchSQLParser.HOUR_OF_DAY:
            case OpenSearchSQLParser.MINUTE_OF_DAY:
            case OpenSearchSQLParser.MINUTE_OF_HOUR:
            case OpenSearchSQLParser.MONTH_OF_YEAR:
            case OpenSearchSQLParser.NESTED:
            case OpenSearchSQLParser.SECOND_OF_MINUTE:
            case OpenSearchSQLParser.TYPEOF:
            case OpenSearchSQLParser.WEEK_OF_YEAR:
            case OpenSearchSQLParser.WEEKOFYEAR:
            case OpenSearchSQLParser.WEEKDAY:
            case OpenSearchSQLParser.SUBSTR:
            case OpenSearchSQLParser.STRCMP:
            case OpenSearchSQLParser.ADDDATE:
            case OpenSearchSQLParser.YEARWEEK:
            case OpenSearchSQLParser.TYPE:
            case OpenSearchSQLParser.MOD:
            case OpenSearchSQLParser.DOT:
            case OpenSearchSQLParser.ID:
            case OpenSearchSQLParser.BACKTICK_QUOTE_ID:
                localContext = new TableAsRelationContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 329;
                this.tableName();
                this.state = 334;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (((((_la - 7)) & ~0x1F) === 0 && ((1 << (_la - 7)) & 1611137537) !== 0) || ((((_la - 54)) & ~0x1F) === 0 && ((1 << (_la - 54)) & 3850434561) !== 0) || ((((_la - 86)) & ~0x1F) === 0 && ((1 << (_la - 86)) & 4293918975) !== 0) || ((((_la - 118)) & ~0x1F) === 0 && ((1 << (_la - 118)) & 3154116607) !== 0) || ((((_la - 150)) & ~0x1F) === 0 && ((1 << (_la - 150)) & 4286578687) !== 0) || ((((_la - 182)) & ~0x1F) === 0 && ((1 << (_la - 182)) & 536870911) !== 0) || ((((_la - 217)) & ~0x1F) === 0 && ((1 << (_la - 217)) & 2382381095) !== 0) || ((((_la - 259)) & ~0x1F) === 0 && ((1 << (_la - 259)) & 124801) !== 0) || ((((_la - 308)) & ~0x1F) === 0 && ((1 << (_la - 308)) & 2101249) !== 0) || _la === 351 || _la === 353) {
                    {
                    this.state = 331;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                    if (_la === 7) {
                        {
                        this.state = 330;
                        this.match(OpenSearchSQLParser.AS);
                        }
                    }

                    this.state = 333;
                    this.alias();
                    }
                }

                }
                break;
            case OpenSearchSQLParser.LR_BRACKET:
                localContext = new SubqueryAsRelationContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 336;
                this.match(OpenSearchSQLParser.LR_BRACKET);
                this.state = 337;
                (localContext as SubqueryAsRelationContext)._subquery = this.querySpecification();
                this.state = 338;
                this.match(OpenSearchSQLParser.RR_BRACKET);
                this.state = 340;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 7) {
                    {
                    this.state = 339;
                    this.match(OpenSearchSQLParser.AS);
                    }
                }

                this.state = 342;
                this.alias();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public whereClause(): WhereClauseContext {
        let localContext = new WhereClauseContext(this.context, this.state);
        this.enterRule(localContext, 36, OpenSearchSQLParser.RULE_whereClause);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 346;
            this.match(OpenSearchSQLParser.WHERE);
            this.state = 347;
            this.expression(0);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public groupByClause(): GroupByClauseContext {
        let localContext = new GroupByClauseContext(this.context, this.state);
        this.enterRule(localContext, 38, OpenSearchSQLParser.RULE_groupByClause);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 349;
            this.match(OpenSearchSQLParser.GROUP);
            this.state = 350;
            this.match(OpenSearchSQLParser.BY);
            this.state = 351;
            this.groupByElements();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public groupByElements(): GroupByElementsContext {
        let localContext = new GroupByElementsContext(this.context, this.state);
        this.enterRule(localContext, 40, OpenSearchSQLParser.RULE_groupByElements);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 353;
            this.groupByElement();
            this.state = 358;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 334) {
                {
                {
                this.state = 354;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 355;
                this.groupByElement();
                }
                }
                this.state = 360;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public groupByElement(): GroupByElementContext {
        let localContext = new GroupByElementContext(this.context, this.state);
        this.enterRule(localContext, 42, OpenSearchSQLParser.RULE_groupByElement);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 361;
            this.expression(0);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public havingClause(): HavingClauseContext {
        let localContext = new HavingClauseContext(this.context, this.state);
        this.enterRule(localContext, 44, OpenSearchSQLParser.RULE_havingClause);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 363;
            this.match(OpenSearchSQLParser.HAVING);
            this.state = 364;
            this.expression(0);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public orderByClause(): OrderByClauseContext {
        let localContext = new OrderByClauseContext(this.context, this.state);
        this.enterRule(localContext, 46, OpenSearchSQLParser.RULE_orderByClause);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 366;
            this.match(OpenSearchSQLParser.ORDER);
            this.state = 367;
            this.match(OpenSearchSQLParser.BY);
            this.state = 368;
            this.orderByElement();
            this.state = 373;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 334) {
                {
                {
                this.state = 369;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 370;
                this.orderByElement();
                }
                }
                this.state = 375;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public orderByElement(): OrderByElementContext {
        let localContext = new OrderByElementContext(this.context, this.state);
        this.enterRule(localContext, 48, OpenSearchSQLParser.RULE_orderByElement);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 376;
            this.expression(0);
            this.state = 378;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 8 || _la === 18) {
                {
                this.state = 377;
                localContext._order = this.tokenStream.LT(1);
                _la = this.tokenStream.LA(1);
                if(!(_la === 8 || _la === 18)) {
                    localContext._order = this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
            }

            this.state = 382;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 46) {
                {
                this.state = 380;
                this.match(OpenSearchSQLParser.NULLS);
                this.state = 381;
                _la = this.tokenStream.LA(1);
                if(!(_la === 26 || _la === 36)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public limitClause(): LimitClauseContext {
        let localContext = new LimitClauseContext(this.context, this.state);
        this.enterRule(localContext, 50, OpenSearchSQLParser.RULE_limitClause);
        try {
            this.state = 396;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 27, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 384;
                this.match(OpenSearchSQLParser.LIMIT);
                this.state = 388;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 26, this.context) ) {
                case 1:
                    {
                    this.state = 385;
                    localContext._offset = this.decimalLiteral();
                    this.state = 386;
                    this.match(OpenSearchSQLParser.COMMA);
                    }
                    break;
                }
                this.state = 390;
                localContext._limit = this.decimalLiteral();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 391;
                this.match(OpenSearchSQLParser.LIMIT);
                this.state = 392;
                localContext._limit = this.decimalLiteral();
                this.state = 393;
                this.match(OpenSearchSQLParser.OFFSET);
                this.state = 394;
                localContext._offset = this.decimalLiteral();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public windowFunctionClause(): WindowFunctionClauseContext {
        let localContext = new WindowFunctionClauseContext(this.context, this.state);
        this.enterRule(localContext, 52, OpenSearchSQLParser.RULE_windowFunctionClause);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 398;
            localContext._function_ = this.windowFunction();
            this.state = 399;
            this.overClause();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public windowFunction(): WindowFunctionContext {
        let localContext = new WindowFunctionContext(this.context, this.state);
        this.enterRule(localContext, 54, OpenSearchSQLParser.RULE_windowFunction);
        let _la: number;
        try {
            this.state = 408;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.DENSE_RANK:
            case OpenSearchSQLParser.RANK:
            case OpenSearchSQLParser.ROW_NUMBER:
                localContext = new ScalarWindowFunctionContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 401;
                (localContext as ScalarWindowFunctionContext)._functionName = this.tokenStream.LT(1);
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 213)) & ~0x1F) === 0 && ((1 << (_la - 213)) & 7) !== 0))) {
                    (localContext as ScalarWindowFunctionContext)._functionName = this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 402;
                this.match(OpenSearchSQLParser.LR_BRACKET);
                this.state = 404;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 28, this.context) ) {
                case 1:
                    {
                    this.state = 403;
                    this.functionArgs();
                    }
                    break;
                }
                this.state = 406;
                this.match(OpenSearchSQLParser.RR_BRACKET);
                }
                break;
            case OpenSearchSQLParser.AVG:
            case OpenSearchSQLParser.COUNT:
            case OpenSearchSQLParser.MAX:
            case OpenSearchSQLParser.MIN:
            case OpenSearchSQLParser.SUM:
            case OpenSearchSQLParser.VAR_POP:
            case OpenSearchSQLParser.VAR_SAMP:
            case OpenSearchSQLParser.VARIANCE:
            case OpenSearchSQLParser.STD:
            case OpenSearchSQLParser.STDDEV:
            case OpenSearchSQLParser.STDDEV_POP:
            case OpenSearchSQLParser.STDDEV_SAMP:
            case OpenSearchSQLParser.PERCENTILE:
            case OpenSearchSQLParser.PERCENTILE_APPROX:
                localContext = new AggregateWindowFunctionContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 407;
                this.aggregateFunction();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public overClause(): OverClauseContext {
        let localContext = new OverClauseContext(this.context, this.state);
        this.enterRule(localContext, 56, OpenSearchSQLParser.RULE_overClause);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 410;
            this.match(OpenSearchSQLParser.OVER);
            this.state = 411;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 413;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 52) {
                {
                this.state = 412;
                this.partitionByClause();
                }
            }

            this.state = 416;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 49) {
                {
                this.state = 415;
                this.orderByClause();
                }
            }

            this.state = 418;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public partitionByClause(): PartitionByClauseContext {
        let localContext = new PartitionByClauseContext(this.context, this.state);
        this.enterRule(localContext, 58, OpenSearchSQLParser.RULE_partitionByClause);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 420;
            this.match(OpenSearchSQLParser.PARTITION);
            this.state = 421;
            this.match(OpenSearchSQLParser.BY);
            this.state = 422;
            this.expression(0);
            this.state = 427;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 334) {
                {
                {
                this.state = 423;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 424;
                this.expression(0);
                }
                }
                this.state = 429;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public constant(): ConstantContext {
        let localContext = new ConstantContext(this.context, this.state);
        this.enterRule(localContext, 60, OpenSearchSQLParser.RULE_constant);
        let _la: number;
        try {
            this.state = 443;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 35, this.context) ) {
            case 1:
                localContext = new StringContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 430;
                this.stringLiteral();
                }
                break;
            case 2:
                localContext = new SignedDecimalContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 432;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 317 || _la === 318) {
                    {
                    this.state = 431;
                    this.sign();
                    }
                }

                this.state = 434;
                this.decimalLiteral();
                }
                break;
            case 3:
                localContext = new SignedRealContext(localContext);
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 436;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 317 || _la === 318) {
                    {
                    this.state = 435;
                    this.sign();
                    }
                }

                this.state = 438;
                this.realLiteral();
                }
                break;
            case 4:
                localContext = new BooleanContext(localContext);
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 439;
                this.booleanLiteral();
                }
                break;
            case 5:
                localContext = new DatetimeContext(localContext);
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 440;
                this.datetimeLiteral();
                }
                break;
            case 6:
                localContext = new IntervalContext(localContext);
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 441;
                this.intervalLiteral();
                }
                break;
            case 7:
                localContext = new NullContext(localContext);
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 442;
                this.nullLiteral();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public decimalLiteral(): DecimalLiteralContext {
        let localContext = new DecimalLiteralContext(this.context, this.state);
        this.enterRule(localContext, 62, OpenSearchSQLParser.RULE_decimalLiteral);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 445;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 337)) & ~0x1F) === 0 && ((1 << (_la - 337)) & 519) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public numericLiteral(): NumericLiteralContext {
        let localContext = new NumericLiteralContext(this.context, this.state);
        this.enterRule(localContext, 64, OpenSearchSQLParser.RULE_numericLiteral);
        try {
            this.state = 449;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.ZERO_DECIMAL:
            case OpenSearchSQLParser.ONE_DECIMAL:
            case OpenSearchSQLParser.TWO_DECIMAL:
            case OpenSearchSQLParser.DECIMAL_LITERAL:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 447;
                this.decimalLiteral();
                }
                break;
            case OpenSearchSQLParser.REAL_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 448;
                this.realLiteral();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public stringLiteral(): StringLiteralContext {
        let localContext = new StringLiteralContext(this.context, this.state);
        this.enterRule(localContext, 66, OpenSearchSQLParser.RULE_stringLiteral);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 451;
            _la = this.tokenStream.LA(1);
            if(!(_la === 345 || _la === 352)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public booleanLiteral(): BooleanLiteralContext {
        let localContext = new BooleanLiteralContext(this.context, this.state);
        this.enterRule(localContext, 68, OpenSearchSQLParser.RULE_booleanLiteral);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 453;
            _la = this.tokenStream.LA(1);
            if(!(_la === 24 || _la === 59)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public realLiteral(): RealLiteralContext {
        let localContext = new RealLiteralContext(this.context, this.state);
        this.enterRule(localContext, 70, OpenSearchSQLParser.RULE_realLiteral);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 455;
            this.match(OpenSearchSQLParser.REAL_LITERAL);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public sign(): SignContext {
        let localContext = new SignContext(this.context, this.state);
        this.enterRule(localContext, 72, OpenSearchSQLParser.RULE_sign);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 457;
            _la = this.tokenStream.LA(1);
            if(!(_la === 317 || _la === 318)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public nullLiteral(): NullLiteralContext {
        let localContext = new NullLiteralContext(this.context, this.state);
        this.enterRule(localContext, 74, OpenSearchSQLParser.RULE_nullLiteral);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 459;
            this.match(OpenSearchSQLParser.NULL_LITERAL);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public datetimeLiteral(): DatetimeLiteralContext {
        let localContext = new DatetimeLiteralContext(this.context, this.state);
        this.enterRule(localContext, 76, OpenSearchSQLParser.RULE_datetimeLiteral);
        try {
            this.state = 464;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 37, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 461;
                this.dateLiteral();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 462;
                this.timeLiteral();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 463;
                this.timestampLiteral();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public dateLiteral(): DateLiteralContext {
        let localContext = new DateLiteralContext(this.context, this.state);
        this.enterRule(localContext, 78, OpenSearchSQLParser.RULE_dateLiteral);
        let _la: number;
        try {
            this.state = 473;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.DATE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 466;
                this.match(OpenSearchSQLParser.DATE);
                this.state = 467;
                localContext._date = this.stringLiteral();
                }
                break;
            case OpenSearchSQLParser.LEFT_BRACE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 468;
                this.match(OpenSearchSQLParser.LEFT_BRACE);
                this.state = 469;
                _la = this.tokenStream.LA(1);
                if(!(_la === 130 || _la === 208)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 470;
                localContext._date = this.stringLiteral();
                this.state = 471;
                this.match(OpenSearchSQLParser.RIGHT_BRACE);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public timeLiteral(): TimeLiteralContext {
        let localContext = new TimeLiteralContext(this.context, this.state);
        this.enterRule(localContext, 80, OpenSearchSQLParser.RULE_timeLiteral);
        let _la: number;
        try {
            this.state = 482;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.TIME:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 475;
                this.match(OpenSearchSQLParser.TIME);
                this.state = 476;
                localContext._time = this.stringLiteral();
                }
                break;
            case OpenSearchSQLParser.LEFT_BRACE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 477;
                this.match(OpenSearchSQLParser.LEFT_BRACE);
                this.state = 478;
                _la = this.tokenStream.LA(1);
                if(!(_la === 195 || _la === 209)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 479;
                localContext._time = this.stringLiteral();
                this.state = 480;
                this.match(OpenSearchSQLParser.RIGHT_BRACE);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public timestampLiteral(): TimestampLiteralContext {
        let localContext = new TimestampLiteralContext(this.context, this.state);
        this.enterRule(localContext, 82, OpenSearchSQLParser.RULE_timestampLiteral);
        let _la: number;
        try {
            this.state = 491;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.TIMESTAMP:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 484;
                this.match(OpenSearchSQLParser.TIMESTAMP);
                this.state = 485;
                localContext._timestamp = this.stringLiteral();
                }
                break;
            case OpenSearchSQLParser.LEFT_BRACE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 486;
                this.match(OpenSearchSQLParser.LEFT_BRACE);
                this.state = 487;
                _la = this.tokenStream.LA(1);
                if(!(_la === 199 || _la === 210)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 488;
                localContext._timestamp = this.stringLiteral();
                this.state = 489;
                this.match(OpenSearchSQLParser.RIGHT_BRACE);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public datetimeConstantLiteral(): DatetimeConstantLiteralContext {
        let localContext = new DatetimeConstantLiteralContext(this.context, this.state);
        this.enterRule(localContext, 84, OpenSearchSQLParser.RULE_datetimeConstantLiteral);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 493;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 127)) & ~0x1F) === 0 && ((1 << (_la - 127)) & 805306375) !== 0) || ((((_la - 205)) & ~0x1F) === 0 && ((1 << (_la - 205)) & 7) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public intervalLiteral(): IntervalLiteralContext {
        let localContext = new IntervalLiteralContext(this.context, this.state);
        this.enterRule(localContext, 86, OpenSearchSQLParser.RULE_intervalLiteral);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 495;
            this.match(OpenSearchSQLParser.INTERVAL);
            this.state = 496;
            this.expression(0);
            this.state = 497;
            this.intervalUnit();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public intervalUnit(): IntervalUnitContext {
        let localContext = new IntervalUnitContext(this.context, this.state);
        this.enterRule(localContext, 88, OpenSearchSQLParser.RULE_intervalUnit);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 499;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 85)) & ~0x1F) === 0 && ((1 << (_la - 85)) & 1048575) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }

    public expression(): ExpressionContext;
    public expression(_p: number): ExpressionContext;
    public expression(_p?: number): ExpressionContext {
        if (_p === undefined) {
            _p = 0;
        }

        let parentContext = this.context;
        let parentState = this.state;
        let localContext = new ExpressionContext(this.context, parentState);
        let previousContext = localContext;
        let _startState = 90;
        this.enterRecursionRule(localContext, 90, OpenSearchSQLParser.RULE_expression, _p);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 505;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.NOT:
                {
                localContext = new NotExpressionContext(localContext);
                this.context = localContext;
                previousContext = localContext;

                this.state = 502;
                this.match(OpenSearchSQLParser.NOT);
                this.state = 503;
                this.expression(4);
                }
                break;
            case OpenSearchSQLParser.CASE:
            case OpenSearchSQLParser.CAST:
            case OpenSearchSQLParser.DATETIME:
            case OpenSearchSQLParser.FALSE:
            case OpenSearchSQLParser.FIRST:
            case OpenSearchSQLParser.LAST:
            case OpenSearchSQLParser.LEFT:
            case OpenSearchSQLParser.MATCH:
            case OpenSearchSQLParser.NULL_LITERAL:
            case OpenSearchSQLParser.RIGHT:
            case OpenSearchSQLParser.TRUE:
            case OpenSearchSQLParser.AVG:
            case OpenSearchSQLParser.COUNT:
            case OpenSearchSQLParser.MAX:
            case OpenSearchSQLParser.MIN:
            case OpenSearchSQLParser.SUM:
            case OpenSearchSQLParser.VAR_POP:
            case OpenSearchSQLParser.VAR_SAMP:
            case OpenSearchSQLParser.VARIANCE:
            case OpenSearchSQLParser.STD:
            case OpenSearchSQLParser.STDDEV:
            case OpenSearchSQLParser.STDDEV_POP:
            case OpenSearchSQLParser.STDDEV_SAMP:
            case OpenSearchSQLParser.SUBSTRING:
            case OpenSearchSQLParser.TRIM:
            case OpenSearchSQLParser.FULL:
            case OpenSearchSQLParser.INTERVAL:
            case OpenSearchSQLParser.FIXED_INTERVAL:
            case OpenSearchSQLParser.CALENDAR_INTERVAL:
            case OpenSearchSQLParser.MICROSECOND:
            case OpenSearchSQLParser.SECOND:
            case OpenSearchSQLParser.MINUTE:
            case OpenSearchSQLParser.HOUR:
            case OpenSearchSQLParser.DAY:
            case OpenSearchSQLParser.WEEK:
            case OpenSearchSQLParser.MONTH:
            case OpenSearchSQLParser.QUARTER:
            case OpenSearchSQLParser.YEAR:
            case OpenSearchSQLParser.ABS:
            case OpenSearchSQLParser.ACOS:
            case OpenSearchSQLParser.ADD:
            case OpenSearchSQLParser.ADDTIME:
            case OpenSearchSQLParser.ASCII:
            case OpenSearchSQLParser.ASIN:
            case OpenSearchSQLParser.ATAN:
            case OpenSearchSQLParser.ATAN2:
            case OpenSearchSQLParser.CBRT:
            case OpenSearchSQLParser.CEIL:
            case OpenSearchSQLParser.CEILING:
            case OpenSearchSQLParser.CONCAT:
            case OpenSearchSQLParser.CONCAT_WS:
            case OpenSearchSQLParser.CONV:
            case OpenSearchSQLParser.CONVERT_TZ:
            case OpenSearchSQLParser.COS:
            case OpenSearchSQLParser.COSH:
            case OpenSearchSQLParser.COT:
            case OpenSearchSQLParser.CRC32:
            case OpenSearchSQLParser.CURDATE:
            case OpenSearchSQLParser.CURTIME:
            case OpenSearchSQLParser.CURRENT_DATE:
            case OpenSearchSQLParser.CURRENT_TIME:
            case OpenSearchSQLParser.CURRENT_TIMESTAMP:
            case OpenSearchSQLParser.DATE:
            case OpenSearchSQLParser.DATE_ADD:
            case OpenSearchSQLParser.DATE_FORMAT:
            case OpenSearchSQLParser.DATE_SUB:
            case OpenSearchSQLParser.DATEDIFF:
            case OpenSearchSQLParser.DAYNAME:
            case OpenSearchSQLParser.DAYOFMONTH:
            case OpenSearchSQLParser.DAYOFWEEK:
            case OpenSearchSQLParser.DAYOFYEAR:
            case OpenSearchSQLParser.DEGREES:
            case OpenSearchSQLParser.DIVIDE:
            case OpenSearchSQLParser.E:
            case OpenSearchSQLParser.EXP:
            case OpenSearchSQLParser.EXPM1:
            case OpenSearchSQLParser.EXTRACT:
            case OpenSearchSQLParser.FLOOR:
            case OpenSearchSQLParser.FROM_DAYS:
            case OpenSearchSQLParser.FROM_UNIXTIME:
            case OpenSearchSQLParser.GET_FORMAT:
            case OpenSearchSQLParser.IF:
            case OpenSearchSQLParser.IFNULL:
            case OpenSearchSQLParser.ISNULL:
            case OpenSearchSQLParser.LAST_DAY:
            case OpenSearchSQLParser.LENGTH:
            case OpenSearchSQLParser.LN:
            case OpenSearchSQLParser.LOCALTIME:
            case OpenSearchSQLParser.LOCALTIMESTAMP:
            case OpenSearchSQLParser.LOCATE:
            case OpenSearchSQLParser.LOG:
            case OpenSearchSQLParser.LOG10:
            case OpenSearchSQLParser.LOG2:
            case OpenSearchSQLParser.LOWER:
            case OpenSearchSQLParser.LTRIM:
            case OpenSearchSQLParser.MAKEDATE:
            case OpenSearchSQLParser.MAKETIME:
            case OpenSearchSQLParser.MODULUS:
            case OpenSearchSQLParser.MONTHNAME:
            case OpenSearchSQLParser.MULTIPLY:
            case OpenSearchSQLParser.NOW:
            case OpenSearchSQLParser.NULLIF:
            case OpenSearchSQLParser.PERIOD_ADD:
            case OpenSearchSQLParser.PERIOD_DIFF:
            case OpenSearchSQLParser.PI:
            case OpenSearchSQLParser.POSITION:
            case OpenSearchSQLParser.POW:
            case OpenSearchSQLParser.POWER:
            case OpenSearchSQLParser.RADIANS:
            case OpenSearchSQLParser.RAND:
            case OpenSearchSQLParser.REPLACE:
            case OpenSearchSQLParser.RINT:
            case OpenSearchSQLParser.ROUND:
            case OpenSearchSQLParser.RTRIM:
            case OpenSearchSQLParser.REVERSE:
            case OpenSearchSQLParser.SEC_TO_TIME:
            case OpenSearchSQLParser.SIGN:
            case OpenSearchSQLParser.SIGNUM:
            case OpenSearchSQLParser.SIN:
            case OpenSearchSQLParser.SINH:
            case OpenSearchSQLParser.SQRT:
            case OpenSearchSQLParser.STR_TO_DATE:
            case OpenSearchSQLParser.SUBDATE:
            case OpenSearchSQLParser.SUBTIME:
            case OpenSearchSQLParser.SUBTRACT:
            case OpenSearchSQLParser.SYSDATE:
            case OpenSearchSQLParser.TAN:
            case OpenSearchSQLParser.TIME:
            case OpenSearchSQLParser.TIMEDIFF:
            case OpenSearchSQLParser.TIME_FORMAT:
            case OpenSearchSQLParser.TIME_TO_SEC:
            case OpenSearchSQLParser.TIMESTAMP:
            case OpenSearchSQLParser.TRUNCATE:
            case OpenSearchSQLParser.TO_DAYS:
            case OpenSearchSQLParser.TO_SECONDS:
            case OpenSearchSQLParser.UNIX_TIMESTAMP:
            case OpenSearchSQLParser.UPPER:
            case OpenSearchSQLParser.UTC_DATE:
            case OpenSearchSQLParser.UTC_TIME:
            case OpenSearchSQLParser.UTC_TIMESTAMP:
            case OpenSearchSQLParser.D:
            case OpenSearchSQLParser.T:
            case OpenSearchSQLParser.TS:
            case OpenSearchSQLParser.LEFT_BRACE:
            case OpenSearchSQLParser.DENSE_RANK:
            case OpenSearchSQLParser.RANK:
            case OpenSearchSQLParser.ROW_NUMBER:
            case OpenSearchSQLParser.DATE_HISTOGRAM:
            case OpenSearchSQLParser.DAY_OF_MONTH:
            case OpenSearchSQLParser.DAY_OF_YEAR:
            case OpenSearchSQLParser.DAY_OF_WEEK:
            case OpenSearchSQLParser.FIELD:
            case OpenSearchSQLParser.HISTOGRAM:
            case OpenSearchSQLParser.HOUR_OF_DAY:
            case OpenSearchSQLParser.MATCHPHRASE:
            case OpenSearchSQLParser.MATCH_PHRASE:
            case OpenSearchSQLParser.MATCHPHRASEQUERY:
            case OpenSearchSQLParser.SIMPLE_QUERY_STRING:
            case OpenSearchSQLParser.QUERY_STRING:
            case OpenSearchSQLParser.MATCH_PHRASE_PREFIX:
            case OpenSearchSQLParser.MATCHQUERY:
            case OpenSearchSQLParser.MATCH_QUERY:
            case OpenSearchSQLParser.MINUTE_OF_DAY:
            case OpenSearchSQLParser.MINUTE_OF_HOUR:
            case OpenSearchSQLParser.MONTH_OF_YEAR:
            case OpenSearchSQLParser.MULTIMATCH:
            case OpenSearchSQLParser.MULTI_MATCH:
            case OpenSearchSQLParser.MULTIMATCHQUERY:
            case OpenSearchSQLParser.NESTED:
            case OpenSearchSQLParser.PERCENTILE:
            case OpenSearchSQLParser.PERCENTILE_APPROX:
            case OpenSearchSQLParser.QUERY:
            case OpenSearchSQLParser.SCORE:
            case OpenSearchSQLParser.SCOREQUERY:
            case OpenSearchSQLParser.SCORE_QUERY:
            case OpenSearchSQLParser.SECOND_OF_MINUTE:
            case OpenSearchSQLParser.TIMESTAMPADD:
            case OpenSearchSQLParser.TIMESTAMPDIFF:
            case OpenSearchSQLParser.TYPEOF:
            case OpenSearchSQLParser.WEEK_OF_YEAR:
            case OpenSearchSQLParser.WEEKOFYEAR:
            case OpenSearchSQLParser.WEEKDAY:
            case OpenSearchSQLParser.WILDCARDQUERY:
            case OpenSearchSQLParser.WILDCARD_QUERY:
            case OpenSearchSQLParser.SUBSTR:
            case OpenSearchSQLParser.STRCMP:
            case OpenSearchSQLParser.ADDDATE:
            case OpenSearchSQLParser.YEARWEEK:
            case OpenSearchSQLParser.TYPE:
            case OpenSearchSQLParser.HIGHLIGHT:
            case OpenSearchSQLParser.MATCH_BOOL_PREFIX:
            case OpenSearchSQLParser.PLUS:
            case OpenSearchSQLParser.MINUS:
            case OpenSearchSQLParser.MOD:
            case OpenSearchSQLParser.DOT:
            case OpenSearchSQLParser.LR_BRACKET:
            case OpenSearchSQLParser.ZERO_DECIMAL:
            case OpenSearchSQLParser.ONE_DECIMAL:
            case OpenSearchSQLParser.TWO_DECIMAL:
            case OpenSearchSQLParser.STRING_LITERAL:
            case OpenSearchSQLParser.DECIMAL_LITERAL:
            case OpenSearchSQLParser.REAL_LITERAL:
            case OpenSearchSQLParser.ID:
            case OpenSearchSQLParser.DOUBLE_QUOTE_ID:
            case OpenSearchSQLParser.BACKTICK_QUOTE_ID:
                {
                localContext = new PredicateExpressionContext(localContext);
                this.context = localContext;
                previousContext = localContext;
                this.state = 504;
                this.predicate(0);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.context!.stop = this.tokenStream.LT(-1);
            this.state = 515;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 43, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    if (this.parseListeners != null) {
                        this.triggerExitRuleEvent();
                    }
                    previousContext = localContext;
                    {
                    this.state = 513;
                    this.errorHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this.tokenStream, 42, this.context) ) {
                    case 1:
                        {
                        localContext = new AndExpressionContext(new ExpressionContext(parentContext, parentState));
                        (localContext as AndExpressionContext)._left = previousContext;
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchSQLParser.RULE_expression);
                        this.state = 507;
                        if (!(this.precpred(this.context, 3))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 3)");
                        }
                        this.state = 508;
                        this.match(OpenSearchSQLParser.AND);
                        this.state = 509;
                        (localContext as AndExpressionContext)._right = this.expression(4);
                        }
                        break;
                    case 2:
                        {
                        localContext = new OrExpressionContext(new ExpressionContext(parentContext, parentState));
                        (localContext as OrExpressionContext)._left = previousContext;
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchSQLParser.RULE_expression);
                        this.state = 510;
                        if (!(this.precpred(this.context, 2))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 2)");
                        }
                        this.state = 511;
                        this.match(OpenSearchSQLParser.OR);
                        this.state = 512;
                        (localContext as OrExpressionContext)._right = this.expression(3);
                        }
                        break;
                    }
                    }
                }
                this.state = 517;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 43, this.context);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.unrollRecursionContexts(parentContext);
        }
        return localContext;
    }

    public predicate(): PredicateContext;
    public predicate(_p: number): PredicateContext;
    public predicate(_p?: number): PredicateContext {
        if (_p === undefined) {
            _p = 0;
        }

        let parentContext = this.context;
        let parentState = this.state;
        let localContext = new PredicateContext(this.context, parentState);
        let previousContext = localContext;
        let _startState = 92;
        this.enterRecursionRule(localContext, 92, OpenSearchSQLParser.RULE_predicate, _p);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            {
            localContext = new ExpressionAtomPredicateContext(localContext);
            this.context = localContext;
            previousContext = localContext;

            this.state = 519;
            this.expressionAtom(0);
            }
            this.context!.stop = this.tokenStream.LT(-1);
            this.state = 557;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 48, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    if (this.parseListeners != null) {
                        this.triggerExitRuleEvent();
                    }
                    previousContext = localContext;
                    {
                    this.state = 555;
                    this.errorHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this.tokenStream, 47, this.context) ) {
                    case 1:
                        {
                        localContext = new BinaryComparisonPredicateContext(new PredicateContext(parentContext, parentState));
                        (localContext as BinaryComparisonPredicateContext)._left = previousContext;
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchSQLParser.RULE_predicate);
                        this.state = 521;
                        if (!(this.precpred(this.context, 6))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 6)");
                        }
                        this.state = 522;
                        this.comparisonOperator();
                        this.state = 523;
                        (localContext as BinaryComparisonPredicateContext)._right = this.predicate(7);
                        }
                        break;
                    case 2:
                        {
                        localContext = new BetweenPredicateContext(new PredicateContext(parentContext, parentState));
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchSQLParser.RULE_predicate);
                        this.state = 525;
                        if (!(this.precpred(this.context, 4))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 4)");
                        }
                        this.state = 527;
                        this.errorHandler.sync(this);
                        _la = this.tokenStream.LA(1);
                        if (_la === 44) {
                            {
                            this.state = 526;
                            this.match(OpenSearchSQLParser.NOT);
                            }
                        }

                        this.state = 529;
                        this.match(OpenSearchSQLParser.BETWEEN);
                        this.state = 530;
                        this.predicate(0);
                        this.state = 531;
                        this.match(OpenSearchSQLParser.AND);
                        this.state = 532;
                        this.predicate(5);
                        }
                        break;
                    case 3:
                        {
                        localContext = new LikePredicateContext(new PredicateContext(parentContext, parentState));
                        (localContext as LikePredicateContext)._left = previousContext;
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchSQLParser.RULE_predicate);
                        this.state = 534;
                        if (!(this.precpred(this.context, 3))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 3)");
                        }
                        this.state = 536;
                        this.errorHandler.sync(this);
                        _la = this.tokenStream.LA(1);
                        if (_la === 44) {
                            {
                            this.state = 535;
                            this.match(OpenSearchSQLParser.NOT);
                            }
                        }

                        this.state = 538;
                        this.match(OpenSearchSQLParser.LIKE);
                        this.state = 539;
                        (localContext as LikePredicateContext)._right = this.predicate(4);
                        }
                        break;
                    case 4:
                        {
                        localContext = new RegexpPredicateContext(new PredicateContext(parentContext, parentState));
                        (localContext as RegexpPredicateContext)._left = previousContext;
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchSQLParser.RULE_predicate);
                        this.state = 540;
                        if (!(this.precpred(this.context, 2))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 2)");
                        }
                        this.state = 541;
                        this.match(OpenSearchSQLParser.REGEXP);
                        this.state = 542;
                        (localContext as RegexpPredicateContext)._right = this.predicate(3);
                        }
                        break;
                    case 5:
                        {
                        localContext = new IsNullPredicateContext(new PredicateContext(parentContext, parentState));
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchSQLParser.RULE_predicate);
                        this.state = 543;
                        if (!(this.precpred(this.context, 5))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 5)");
                        }
                        this.state = 544;
                        this.match(OpenSearchSQLParser.IS);
                        this.state = 545;
                        this.nullNotnull();
                        }
                        break;
                    case 6:
                        {
                        localContext = new InPredicateContext(new PredicateContext(parentContext, parentState));
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchSQLParser.RULE_predicate);
                        this.state = 546;
                        if (!(this.precpred(this.context, 1))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 1)");
                        }
                        this.state = 548;
                        this.errorHandler.sync(this);
                        _la = this.tokenStream.LA(1);
                        if (_la === 44) {
                            {
                            this.state = 547;
                            this.match(OpenSearchSQLParser.NOT);
                            }
                        }

                        this.state = 550;
                        this.match(OpenSearchSQLParser.IN);
                        this.state = 551;
                        this.match(OpenSearchSQLParser.LR_BRACKET);
                        this.state = 552;
                        this.expressions();
                        this.state = 553;
                        this.match(OpenSearchSQLParser.RR_BRACKET);
                        }
                        break;
                    }
                    }
                }
                this.state = 559;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 48, this.context);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.unrollRecursionContexts(parentContext);
        }
        return localContext;
    }
    public expressions(): ExpressionsContext {
        let localContext = new ExpressionsContext(this.context, this.state);
        this.enterRule(localContext, 94, OpenSearchSQLParser.RULE_expressions);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 560;
            this.expression(0);
            this.state = 565;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 334) {
                {
                {
                this.state = 561;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 562;
                this.expression(0);
                }
                }
                this.state = 567;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }

    public expressionAtom(): ExpressionAtomContext;
    public expressionAtom(_p: number): ExpressionAtomContext;
    public expressionAtom(_p?: number): ExpressionAtomContext {
        if (_p === undefined) {
            _p = 0;
        }

        let parentContext = this.context;
        let parentState = this.state;
        let localContext = new ExpressionAtomContext(this.context, parentState);
        let previousContext = localContext;
        let _startState = 96;
        this.enterRecursionRule(localContext, 96, OpenSearchSQLParser.RULE_expressionAtom, _p);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 576;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 50, this.context) ) {
            case 1:
                {
                localContext = new ConstantExpressionAtomContext(localContext);
                this.context = localContext;
                previousContext = localContext;

                this.state = 569;
                this.constant();
                }
                break;
            case 2:
                {
                localContext = new FullColumnNameExpressionAtomContext(localContext);
                this.context = localContext;
                previousContext = localContext;
                this.state = 570;
                this.columnName();
                }
                break;
            case 3:
                {
                localContext = new FunctionCallExpressionAtomContext(localContext);
                this.context = localContext;
                previousContext = localContext;
                this.state = 571;
                this.functionCall();
                }
                break;
            case 4:
                {
                localContext = new NestedExpressionAtomContext(localContext);
                this.context = localContext;
                previousContext = localContext;
                this.state = 572;
                this.match(OpenSearchSQLParser.LR_BRACKET);
                this.state = 573;
                this.expression(0);
                this.state = 574;
                this.match(OpenSearchSQLParser.RR_BRACKET);
                }
                break;
            }
            this.context!.stop = this.tokenStream.LT(-1);
            this.state = 586;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 52, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    if (this.parseListeners != null) {
                        this.triggerExitRuleEvent();
                    }
                    previousContext = localContext;
                    {
                    this.state = 584;
                    this.errorHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this.tokenStream, 51, this.context) ) {
                    case 1:
                        {
                        localContext = new MathExpressionAtomContext(new ExpressionAtomContext(parentContext, parentState));
                        (localContext as MathExpressionAtomContext)._left = previousContext;
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchSQLParser.RULE_expressionAtom);
                        this.state = 578;
                        if (!(this.precpred(this.context, 2))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 2)");
                        }
                        this.state = 579;
                        (localContext as MathExpressionAtomContext)._mathOperator = this.tokenStream.LT(1);
                        _la = this.tokenStream.LA(1);
                        if(!(((((_la - 314)) & ~0x1F) === 0 && ((1 << (_la - 314)) & 7) !== 0))) {
                            (localContext as MathExpressionAtomContext)._mathOperator = this.errorHandler.recoverInline(this);
                        }
                        else {
                            this.errorHandler.reportMatch(this);
                            this.consume();
                        }
                        this.state = 580;
                        (localContext as MathExpressionAtomContext)._right = this.expressionAtom(3);
                        }
                        break;
                    case 2:
                        {
                        localContext = new MathExpressionAtomContext(new ExpressionAtomContext(parentContext, parentState));
                        (localContext as MathExpressionAtomContext)._left = previousContext;
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchSQLParser.RULE_expressionAtom);
                        this.state = 581;
                        if (!(this.precpred(this.context, 1))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 1)");
                        }
                        this.state = 582;
                        (localContext as MathExpressionAtomContext)._mathOperator = this.tokenStream.LT(1);
                        _la = this.tokenStream.LA(1);
                        if(!(_la === 317 || _la === 318)) {
                            (localContext as MathExpressionAtomContext)._mathOperator = this.errorHandler.recoverInline(this);
                        }
                        else {
                            this.errorHandler.reportMatch(this);
                            this.consume();
                        }
                        this.state = 583;
                        (localContext as MathExpressionAtomContext)._right = this.expressionAtom(2);
                        }
                        break;
                    }
                    }
                }
                this.state = 588;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 52, this.context);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.unrollRecursionContexts(parentContext);
        }
        return localContext;
    }
    public comparisonOperator(): ComparisonOperatorContext {
        let localContext = new ComparisonOperatorContext(this.context, this.state);
        this.enterRule(localContext, 98, OpenSearchSQLParser.RULE_comparisonOperator);
        try {
            this.state = 600;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 53, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 589;
                this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 590;
                this.match(OpenSearchSQLParser.GREATER_SYMBOL);
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 591;
                this.match(OpenSearchSQLParser.LESS_SYMBOL);
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 592;
                this.match(OpenSearchSQLParser.LESS_SYMBOL);
                this.state = 593;
                this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 594;
                this.match(OpenSearchSQLParser.GREATER_SYMBOL);
                this.state = 595;
                this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 596;
                this.match(OpenSearchSQLParser.LESS_SYMBOL);
                this.state = 597;
                this.match(OpenSearchSQLParser.GREATER_SYMBOL);
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 598;
                this.match(OpenSearchSQLParser.EXCLAMATION_SYMBOL);
                this.state = 599;
                this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public nullNotnull(): NullNotnullContext {
        let localContext = new NullNotnullContext(this.context, this.state);
        this.enterRule(localContext, 100, OpenSearchSQLParser.RULE_nullNotnull);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 603;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 44) {
                {
                this.state = 602;
                this.match(OpenSearchSQLParser.NOT);
                }
            }

            this.state = 605;
            this.match(OpenSearchSQLParser.NULL_LITERAL);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public functionCall(): FunctionCallContext {
        let localContext = new FunctionCallContext(this.context, this.state);
        this.enterRule(localContext, 102, OpenSearchSQLParser.RULE_functionCall);
        let _la: number;
        try {
            this.state = 634;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 56, this.context) ) {
            case 1:
                localContext = new NestedAllFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 607;
                this.nestedFunctionName();
                this.state = 608;
                this.match(OpenSearchSQLParser.LR_BRACKET);
                this.state = 609;
                this.allTupleFields();
                this.state = 610;
                this.match(OpenSearchSQLParser.RR_BRACKET);
                }
                break;
            case 2:
                localContext = new ScalarFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 612;
                this.scalarFunctionName();
                this.state = 613;
                this.match(OpenSearchSQLParser.LR_BRACKET);
                this.state = 614;
                this.functionArgs();
                this.state = 615;
                this.match(OpenSearchSQLParser.RR_BRACKET);
                }
                break;
            case 3:
                localContext = new SpecificFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 617;
                this.specificFunction();
                }
                break;
            case 4:
                localContext = new WindowFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 618;
                this.windowFunctionClause();
                }
                break;
            case 5:
                localContext = new AggregateFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 619;
                this.aggregateFunction();
                }
                break;
            case 6:
                localContext = new FilteredAggregationFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 620;
                this.aggregateFunction();
                this.state = 622;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 49) {
                    {
                    this.state = 621;
                    this.orderByClause();
                    }
                }

                this.state = 624;
                this.filterClause();
                }
                break;
            case 7:
                localContext = new ScoreRelevanceFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 626;
                this.scoreRelevanceFunction();
                }
                break;
            case 8:
                localContext = new RelevanceFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 627;
                this.relevanceFunction();
                }
                break;
            case 9:
                localContext = new HighlightFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 628;
                this.highlightFunction();
                }
                break;
            case 10:
                localContext = new PositionFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 629;
                this.positionFunction();
                }
                break;
            case 11:
                localContext = new ExtractFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 630;
                this.extractFunction();
                }
                break;
            case 12:
                localContext = new GetFormatFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 631;
                this.getFormatFunction();
                }
                break;
            case 13:
                localContext = new BucketFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 13);
                {
                this.state = 632;
                this.bucketFunction();
                }
                break;
            case 14:
                localContext = new TimestampFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 14);
                {
                this.state = 633;
                this.timestampFunction();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public timestampFunction(): TimestampFunctionContext {
        let localContext = new TimestampFunctionContext(this.context, this.state);
        this.enterRule(localContext, 104, OpenSearchSQLParser.RULE_timestampFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 636;
            this.timestampFunctionName();
            this.state = 637;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 638;
            this.simpleDateTimePart();
            this.state = 639;
            this.match(OpenSearchSQLParser.COMMA);
            this.state = 640;
            localContext._firstArg = this.functionArg();
            this.state = 641;
            this.match(OpenSearchSQLParser.COMMA);
            this.state = 642;
            localContext._secondArg = this.functionArg();
            this.state = 643;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public timestampFunctionName(): TimestampFunctionNameContext {
        let localContext = new TimestampFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 106, OpenSearchSQLParser.RULE_timestampFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 645;
            _la = this.tokenStream.LA(1);
            if(!(_la === 263 || _la === 264)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public getFormatFunction(): GetFormatFunctionContext {
        let localContext = new GetFormatFunctionContext(this.context, this.state);
        this.enterRule(localContext, 108, OpenSearchSQLParser.RULE_getFormatFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 647;
            this.match(OpenSearchSQLParser.GET_FORMAT);
            this.state = 648;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 649;
            this.getFormatType();
            this.state = 650;
            this.match(OpenSearchSQLParser.COMMA);
            this.state = 651;
            this.functionArg();
            this.state = 652;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public getFormatType(): GetFormatTypeContext {
        let localContext = new GetFormatTypeContext(this.context, this.state);
        this.enterRule(localContext, 110, OpenSearchSQLParser.RULE_getFormatType);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 654;
            _la = this.tokenStream.LA(1);
            if(!(_la === 16 || _la === 130 || _la === 195 || _la === 199)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public extractFunction(): ExtractFunctionContext {
        let localContext = new ExtractFunctionContext(this.context, this.state);
        this.enterRule(localContext, 112, OpenSearchSQLParser.RULE_extractFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 656;
            this.match(OpenSearchSQLParser.EXTRACT);
            this.state = 657;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 658;
            this.datetimePart();
            this.state = 659;
            this.match(OpenSearchSQLParser.FROM);
            this.state = 660;
            this.functionArg();
            this.state = 661;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public simpleDateTimePart(): SimpleDateTimePartContext {
        let localContext = new SimpleDateTimePartContext(this.context, this.state);
        this.enterRule(localContext, 114, OpenSearchSQLParser.RULE_simpleDateTimePart);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 663;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 85)) & ~0x1F) === 0 && ((1 << (_la - 85)) & 511) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public complexDateTimePart(): ComplexDateTimePartContext {
        let localContext = new ComplexDateTimePartContext(this.context, this.state);
        this.enterRule(localContext, 116, OpenSearchSQLParser.RULE_complexDateTimePart);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 665;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 94)) & ~0x1F) === 0 && ((1 << (_la - 94)) & 2047) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public datetimePart(): DatetimePartContext {
        let localContext = new DatetimePartContext(this.context, this.state);
        this.enterRule(localContext, 118, OpenSearchSQLParser.RULE_datetimePart);
        try {
            this.state = 669;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.MICROSECOND:
            case OpenSearchSQLParser.SECOND:
            case OpenSearchSQLParser.MINUTE:
            case OpenSearchSQLParser.HOUR:
            case OpenSearchSQLParser.DAY:
            case OpenSearchSQLParser.WEEK:
            case OpenSearchSQLParser.MONTH:
            case OpenSearchSQLParser.QUARTER:
            case OpenSearchSQLParser.YEAR:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 667;
                this.simpleDateTimePart();
                }
                break;
            case OpenSearchSQLParser.SECOND_MICROSECOND:
            case OpenSearchSQLParser.MINUTE_MICROSECOND:
            case OpenSearchSQLParser.MINUTE_SECOND:
            case OpenSearchSQLParser.HOUR_MICROSECOND:
            case OpenSearchSQLParser.HOUR_SECOND:
            case OpenSearchSQLParser.HOUR_MINUTE:
            case OpenSearchSQLParser.DAY_MICROSECOND:
            case OpenSearchSQLParser.DAY_SECOND:
            case OpenSearchSQLParser.DAY_MINUTE:
            case OpenSearchSQLParser.DAY_HOUR:
            case OpenSearchSQLParser.YEAR_MONTH:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 668;
                this.complexDateTimePart();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public highlightFunction(): HighlightFunctionContext {
        let localContext = new HighlightFunctionContext(this.context, this.state);
        this.enterRule(localContext, 120, OpenSearchSQLParser.RULE_highlightFunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 671;
            this.match(OpenSearchSQLParser.HIGHLIGHT);
            this.state = 672;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 673;
            this.relevanceField();
            this.state = 678;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 334) {
                {
                {
                this.state = 674;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 675;
                this.highlightArg();
                }
                }
                this.state = 680;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 681;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bucketFunction(): BucketFunctionContext {
        let localContext = new BucketFunctionContext(this.context, this.state);
        this.enterRule(localContext, 122, OpenSearchSQLParser.RULE_bucketFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 683;
            this.bucketFunctionName();
            this.state = 684;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 685;
            this.match(OpenSearchSQLParser.FIELD);
            this.state = 686;
            this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
            this.state = 687;
            localContext._field = this.bucketArgValue();
            this.state = 688;
            this.match(OpenSearchSQLParser.COMMA);
            this.state = 689;
            this.intervalArgName();
            this.state = 690;
            this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
            this.state = 691;
            localContext._interval = this.constant();
            this.state = 692;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public intervalArgName(): IntervalArgNameContext {
        let localContext = new IntervalArgNameContext(this.context, this.state);
        this.enterRule(localContext, 124, OpenSearchSQLParser.RULE_intervalArgName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 694;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 82)) & ~0x1F) === 0 && ((1 << (_la - 82)) & 7) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public positionFunction(): PositionFunctionContext {
        let localContext = new PositionFunctionContext(this.context, this.state);
        this.enterRule(localContext, 126, OpenSearchSQLParser.RULE_positionFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 696;
            this.match(OpenSearchSQLParser.POSITION);
            this.state = 697;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 698;
            this.functionArg();
            this.state = 699;
            this.match(OpenSearchSQLParser.IN);
            this.state = 700;
            this.functionArg();
            this.state = 701;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public matchQueryAltSyntaxFunction(): MatchQueryAltSyntaxFunctionContext {
        let localContext = new MatchQueryAltSyntaxFunctionContext(this.context, this.state);
        this.enterRule(localContext, 128, OpenSearchSQLParser.RULE_matchQueryAltSyntaxFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 703;
            localContext._field = this.relevanceField();
            this.state = 704;
            this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
            this.state = 705;
            this.match(OpenSearchSQLParser.MATCH_QUERY);
            this.state = 706;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 707;
            localContext._query = this.relevanceQuery();
            this.state = 708;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public scalarFunctionName(): ScalarFunctionNameContext {
        let localContext = new ScalarFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 130, OpenSearchSQLParser.RULE_scalarFunctionName);
        try {
            this.state = 716;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.ABS:
            case OpenSearchSQLParser.ACOS:
            case OpenSearchSQLParser.ADD:
            case OpenSearchSQLParser.ASIN:
            case OpenSearchSQLParser.ATAN:
            case OpenSearchSQLParser.ATAN2:
            case OpenSearchSQLParser.CBRT:
            case OpenSearchSQLParser.CEIL:
            case OpenSearchSQLParser.CEILING:
            case OpenSearchSQLParser.CONV:
            case OpenSearchSQLParser.COS:
            case OpenSearchSQLParser.COSH:
            case OpenSearchSQLParser.COT:
            case OpenSearchSQLParser.CRC32:
            case OpenSearchSQLParser.DEGREES:
            case OpenSearchSQLParser.DIVIDE:
            case OpenSearchSQLParser.E:
            case OpenSearchSQLParser.EXP:
            case OpenSearchSQLParser.EXPM1:
            case OpenSearchSQLParser.FLOOR:
            case OpenSearchSQLParser.LN:
            case OpenSearchSQLParser.LOG:
            case OpenSearchSQLParser.LOG10:
            case OpenSearchSQLParser.LOG2:
            case OpenSearchSQLParser.MODULUS:
            case OpenSearchSQLParser.MULTIPLY:
            case OpenSearchSQLParser.PI:
            case OpenSearchSQLParser.POW:
            case OpenSearchSQLParser.POWER:
            case OpenSearchSQLParser.RADIANS:
            case OpenSearchSQLParser.RAND:
            case OpenSearchSQLParser.RINT:
            case OpenSearchSQLParser.ROUND:
            case OpenSearchSQLParser.SIGN:
            case OpenSearchSQLParser.SIGNUM:
            case OpenSearchSQLParser.SIN:
            case OpenSearchSQLParser.SINH:
            case OpenSearchSQLParser.SQRT:
            case OpenSearchSQLParser.SUBTRACT:
            case OpenSearchSQLParser.TAN:
            case OpenSearchSQLParser.TRUNCATE:
            case OpenSearchSQLParser.MOD:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 710;
                this.mathematicalFunctionName();
                }
                break;
            case OpenSearchSQLParser.DATETIME:
            case OpenSearchSQLParser.MICROSECOND:
            case OpenSearchSQLParser.SECOND:
            case OpenSearchSQLParser.MINUTE:
            case OpenSearchSQLParser.HOUR:
            case OpenSearchSQLParser.DAY:
            case OpenSearchSQLParser.WEEK:
            case OpenSearchSQLParser.MONTH:
            case OpenSearchSQLParser.QUARTER:
            case OpenSearchSQLParser.YEAR:
            case OpenSearchSQLParser.ADDTIME:
            case OpenSearchSQLParser.CONVERT_TZ:
            case OpenSearchSQLParser.CURDATE:
            case OpenSearchSQLParser.CURTIME:
            case OpenSearchSQLParser.CURRENT_DATE:
            case OpenSearchSQLParser.CURRENT_TIME:
            case OpenSearchSQLParser.CURRENT_TIMESTAMP:
            case OpenSearchSQLParser.DATE:
            case OpenSearchSQLParser.DATE_ADD:
            case OpenSearchSQLParser.DATE_FORMAT:
            case OpenSearchSQLParser.DATE_SUB:
            case OpenSearchSQLParser.DATEDIFF:
            case OpenSearchSQLParser.DAYNAME:
            case OpenSearchSQLParser.DAYOFMONTH:
            case OpenSearchSQLParser.DAYOFWEEK:
            case OpenSearchSQLParser.DAYOFYEAR:
            case OpenSearchSQLParser.FROM_DAYS:
            case OpenSearchSQLParser.FROM_UNIXTIME:
            case OpenSearchSQLParser.LAST_DAY:
            case OpenSearchSQLParser.LOCALTIME:
            case OpenSearchSQLParser.LOCALTIMESTAMP:
            case OpenSearchSQLParser.MAKEDATE:
            case OpenSearchSQLParser.MAKETIME:
            case OpenSearchSQLParser.MONTHNAME:
            case OpenSearchSQLParser.NOW:
            case OpenSearchSQLParser.PERIOD_ADD:
            case OpenSearchSQLParser.PERIOD_DIFF:
            case OpenSearchSQLParser.SEC_TO_TIME:
            case OpenSearchSQLParser.STR_TO_DATE:
            case OpenSearchSQLParser.SUBDATE:
            case OpenSearchSQLParser.SUBTIME:
            case OpenSearchSQLParser.SYSDATE:
            case OpenSearchSQLParser.TIME:
            case OpenSearchSQLParser.TIMEDIFF:
            case OpenSearchSQLParser.TIME_FORMAT:
            case OpenSearchSQLParser.TIME_TO_SEC:
            case OpenSearchSQLParser.TIMESTAMP:
            case OpenSearchSQLParser.TO_DAYS:
            case OpenSearchSQLParser.TO_SECONDS:
            case OpenSearchSQLParser.UNIX_TIMESTAMP:
            case OpenSearchSQLParser.UTC_DATE:
            case OpenSearchSQLParser.UTC_TIME:
            case OpenSearchSQLParser.UTC_TIMESTAMP:
            case OpenSearchSQLParser.DAY_OF_MONTH:
            case OpenSearchSQLParser.DAY_OF_YEAR:
            case OpenSearchSQLParser.DAY_OF_WEEK:
            case OpenSearchSQLParser.HOUR_OF_DAY:
            case OpenSearchSQLParser.MINUTE_OF_DAY:
            case OpenSearchSQLParser.MINUTE_OF_HOUR:
            case OpenSearchSQLParser.MONTH_OF_YEAR:
            case OpenSearchSQLParser.SECOND_OF_MINUTE:
            case OpenSearchSQLParser.WEEK_OF_YEAR:
            case OpenSearchSQLParser.WEEKOFYEAR:
            case OpenSearchSQLParser.WEEKDAY:
            case OpenSearchSQLParser.ADDDATE:
            case OpenSearchSQLParser.YEARWEEK:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 711;
                this.dateTimeFunctionName();
                }
                break;
            case OpenSearchSQLParser.LEFT:
            case OpenSearchSQLParser.RIGHT:
            case OpenSearchSQLParser.SUBSTRING:
            case OpenSearchSQLParser.TRIM:
            case OpenSearchSQLParser.ASCII:
            case OpenSearchSQLParser.CONCAT:
            case OpenSearchSQLParser.CONCAT_WS:
            case OpenSearchSQLParser.LENGTH:
            case OpenSearchSQLParser.LOCATE:
            case OpenSearchSQLParser.LOWER:
            case OpenSearchSQLParser.LTRIM:
            case OpenSearchSQLParser.REPLACE:
            case OpenSearchSQLParser.RTRIM:
            case OpenSearchSQLParser.REVERSE:
            case OpenSearchSQLParser.UPPER:
            case OpenSearchSQLParser.SUBSTR:
            case OpenSearchSQLParser.STRCMP:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 712;
                this.textFunctionName();
                }
                break;
            case OpenSearchSQLParser.IF:
            case OpenSearchSQLParser.IFNULL:
            case OpenSearchSQLParser.ISNULL:
            case OpenSearchSQLParser.NULLIF:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 713;
                this.flowControlFunctionName();
                }
                break;
            case OpenSearchSQLParser.TYPEOF:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 714;
                this.systemFunctionName();
                }
                break;
            case OpenSearchSQLParser.NESTED:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 715;
                this.nestedFunctionName();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bucketFunctionName(): BucketFunctionNameContext {
        let localContext = new BucketFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 132, OpenSearchSQLParser.RULE_bucketFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 718;
            _la = this.tokenStream.LA(1);
            if(!(_la === 216 || _la === 230)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public specificFunction(): SpecificFunctionContext {
        let localContext = new SpecificFunctionContext(this.context, this.state);
        this.enterRule(localContext, 134, OpenSearchSQLParser.RULE_specificFunction);
        let _la: number;
        try {
            this.state = 752;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 64, this.context) ) {
            case 1:
                localContext = new CaseFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 720;
                this.match(OpenSearchSQLParser.CASE);
                this.state = 721;
                this.expression(0);
                this.state = 723;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                do {
                    {
                    {
                    this.state = 722;
                    this.caseFuncAlternative();
                    }
                    }
                    this.state = 725;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                } while (_la === 62);
                this.state = 729;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 22) {
                    {
                    this.state = 727;
                    this.match(OpenSearchSQLParser.ELSE);
                    this.state = 728;
                    (localContext as CaseFunctionCallContext)._elseArg = this.functionArg();
                    }
                }

                this.state = 731;
                this.match(OpenSearchSQLParser.END);
                }
                break;
            case 2:
                localContext = new CaseFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 733;
                this.match(OpenSearchSQLParser.CASE);
                this.state = 735;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                do {
                    {
                    {
                    this.state = 734;
                    this.caseFuncAlternative();
                    }
                    }
                    this.state = 737;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                } while (_la === 62);
                this.state = 741;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 22) {
                    {
                    this.state = 739;
                    this.match(OpenSearchSQLParser.ELSE);
                    this.state = 740;
                    (localContext as CaseFunctionCallContext)._elseArg = this.functionArg();
                    }
                }

                this.state = 743;
                this.match(OpenSearchSQLParser.END);
                }
                break;
            case 3:
                localContext = new DataTypeFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 745;
                this.match(OpenSearchSQLParser.CAST);
                this.state = 746;
                this.match(OpenSearchSQLParser.LR_BRACKET);
                this.state = 747;
                this.expression(0);
                this.state = 748;
                this.match(OpenSearchSQLParser.AS);
                this.state = 749;
                this.convertedDataType();
                this.state = 750;
                this.match(OpenSearchSQLParser.RR_BRACKET);
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public relevanceFunction(): RelevanceFunctionContext {
        let localContext = new RelevanceFunctionContext(this.context, this.state);
        this.enterRule(localContext, 136, OpenSearchSQLParser.RULE_relevanceFunction);
        try {
            this.state = 759;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 65, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 754;
                this.noFieldRelevanceFunction();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 755;
                this.singleFieldRelevanceFunction();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 756;
                this.multiFieldRelevanceFunction();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 757;
                this.altSingleFieldRelevanceFunction();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 758;
                this.altMultiFieldRelevanceFunction();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public scoreRelevanceFunction(): ScoreRelevanceFunctionContext {
        let localContext = new ScoreRelevanceFunctionContext(this.context, this.state);
        this.enterRule(localContext, 138, OpenSearchSQLParser.RULE_scoreRelevanceFunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 761;
            this.scoreRelevanceFunctionName();
            this.state = 762;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 763;
            this.relevanceFunction();
            this.state = 766;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 334) {
                {
                this.state = 764;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 765;
                localContext._weight = this.relevanceFieldWeight();
                }
            }

            this.state = 768;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public noFieldRelevanceFunction(): NoFieldRelevanceFunctionContext {
        let localContext = new NoFieldRelevanceFunctionContext(this.context, this.state);
        this.enterRule(localContext, 140, OpenSearchSQLParser.RULE_noFieldRelevanceFunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 770;
            this.noFieldRelevanceFunctionName();
            this.state = 771;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 772;
            localContext._query = this.relevanceQuery();
            this.state = 777;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 334) {
                {
                {
                this.state = 773;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 774;
                this.relevanceArg();
                }
                }
                this.state = 779;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 780;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public singleFieldRelevanceFunction(): SingleFieldRelevanceFunctionContext {
        let localContext = new SingleFieldRelevanceFunctionContext(this.context, this.state);
        this.enterRule(localContext, 142, OpenSearchSQLParser.RULE_singleFieldRelevanceFunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 782;
            this.singleFieldRelevanceFunctionName();
            this.state = 783;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 784;
            localContext._field = this.relevanceField();
            this.state = 785;
            this.match(OpenSearchSQLParser.COMMA);
            this.state = 786;
            localContext._query = this.relevanceQuery();
            this.state = 791;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 334) {
                {
                {
                this.state = 787;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 788;
                this.relevanceArg();
                }
                }
                this.state = 793;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 794;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public multiFieldRelevanceFunction(): MultiFieldRelevanceFunctionContext {
        let localContext = new MultiFieldRelevanceFunctionContext(this.context, this.state);
        this.enterRule(localContext, 144, OpenSearchSQLParser.RULE_multiFieldRelevanceFunction);
        let _la: number;
        try {
            this.state = 833;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 72, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 796;
                this.multiFieldRelevanceFunctionName();
                this.state = 797;
                this.match(OpenSearchSQLParser.LR_BRACKET);
                this.state = 798;
                this.match(OpenSearchSQLParser.LT_SQR_PRTHS);
                this.state = 799;
                localContext._field = this.relevanceFieldAndWeight();
                this.state = 804;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 334) {
                    {
                    {
                    this.state = 800;
                    this.match(OpenSearchSQLParser.COMMA);
                    this.state = 801;
                    localContext._field = this.relevanceFieldAndWeight();
                    }
                    }
                    this.state = 806;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 807;
                this.match(OpenSearchSQLParser.RT_SQR_PRTHS);
                this.state = 808;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 809;
                localContext._query = this.relevanceQuery();
                this.state = 814;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 334) {
                    {
                    {
                    this.state = 810;
                    this.match(OpenSearchSQLParser.COMMA);
                    this.state = 811;
                    this.relevanceArg();
                    }
                    }
                    this.state = 816;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 817;
                this.match(OpenSearchSQLParser.RR_BRACKET);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 819;
                this.multiFieldRelevanceFunctionName();
                this.state = 820;
                this.match(OpenSearchSQLParser.LR_BRACKET);
                this.state = 821;
                this.alternateMultiMatchQuery();
                this.state = 822;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 823;
                this.alternateMultiMatchField();
                this.state = 828;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 334) {
                    {
                    {
                    this.state = 824;
                    this.match(OpenSearchSQLParser.COMMA);
                    this.state = 825;
                    this.relevanceArg();
                    }
                    }
                    this.state = 830;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 831;
                this.match(OpenSearchSQLParser.RR_BRACKET);
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public altSingleFieldRelevanceFunction(): AltSingleFieldRelevanceFunctionContext {
        let localContext = new AltSingleFieldRelevanceFunctionContext(this.context, this.state);
        this.enterRule(localContext, 146, OpenSearchSQLParser.RULE_altSingleFieldRelevanceFunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 835;
            localContext._field = this.relevanceField();
            this.state = 836;
            this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
            this.state = 837;
            localContext._altSyntaxFunctionName = this.altSingleFieldRelevanceFunctionName();
            this.state = 838;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 839;
            localContext._query = this.relevanceQuery();
            this.state = 844;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 334) {
                {
                {
                this.state = 840;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 841;
                this.relevanceArg();
                }
                }
                this.state = 846;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 847;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public altMultiFieldRelevanceFunction(): AltMultiFieldRelevanceFunctionContext {
        let localContext = new AltMultiFieldRelevanceFunctionContext(this.context, this.state);
        this.enterRule(localContext, 148, OpenSearchSQLParser.RULE_altMultiFieldRelevanceFunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 849;
            localContext._field = this.relevanceField();
            this.state = 850;
            this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
            this.state = 851;
            localContext._altSyntaxFunctionName = this.altMultiFieldRelevanceFunctionName();
            this.state = 852;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 853;
            localContext._query = this.relevanceQuery();
            this.state = 858;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 334) {
                {
                {
                this.state = 854;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 855;
                this.relevanceArg();
                }
                }
                this.state = 860;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 861;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public convertedDataType(): ConvertedDataTypeContext {
        let localContext = new ConvertedDataTypeContext(this.context, this.state);
        this.enterRule(localContext, 150, OpenSearchSQLParser.RULE_convertedDataType);
        try {
            this.state = 873;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.DATE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 863;
                localContext._typeName = this.match(OpenSearchSQLParser.DATE);
                }
                break;
            case OpenSearchSQLParser.TIME:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 864;
                localContext._typeName = this.match(OpenSearchSQLParser.TIME);
                }
                break;
            case OpenSearchSQLParser.TIMESTAMP:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 865;
                localContext._typeName = this.match(OpenSearchSQLParser.TIMESTAMP);
                }
                break;
            case OpenSearchSQLParser.INT:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 866;
                localContext._typeName = this.match(OpenSearchSQLParser.INT);
                }
                break;
            case OpenSearchSQLParser.INTEGER:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 867;
                localContext._typeName = this.match(OpenSearchSQLParser.INTEGER);
                }
                break;
            case OpenSearchSQLParser.DOUBLE:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 868;
                localContext._typeName = this.match(OpenSearchSQLParser.DOUBLE);
                }
                break;
            case OpenSearchSQLParser.LONG:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 869;
                localContext._typeName = this.match(OpenSearchSQLParser.LONG);
                }
                break;
            case OpenSearchSQLParser.FLOAT:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 870;
                localContext._typeName = this.match(OpenSearchSQLParser.FLOAT);
                }
                break;
            case OpenSearchSQLParser.STRING:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 871;
                localContext._typeName = this.match(OpenSearchSQLParser.STRING);
                }
                break;
            case OpenSearchSQLParser.BOOLEAN:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 872;
                localContext._typeName = this.match(OpenSearchSQLParser.BOOLEAN);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public caseFuncAlternative(): CaseFuncAlternativeContext {
        let localContext = new CaseFuncAlternativeContext(this.context, this.state);
        this.enterRule(localContext, 152, OpenSearchSQLParser.RULE_caseFuncAlternative);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 875;
            this.match(OpenSearchSQLParser.WHEN);
            this.state = 876;
            localContext._condition = this.functionArg();
            this.state = 877;
            this.match(OpenSearchSQLParser.THEN);
            this.state = 878;
            localContext._consequent = this.functionArg();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public aggregateFunction(): AggregateFunctionContext {
        let localContext = new AggregateFunctionContext(this.context, this.state);
        this.enterRule(localContext, 154, OpenSearchSQLParser.RULE_aggregateFunction);
        try {
            this.state = 896;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 76, this.context) ) {
            case 1:
                localContext = new RegularAggregateFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 880;
                (localContext as RegularAggregateFunctionCallContext)._functionName = this.aggregationFunctionName();
                this.state = 881;
                this.match(OpenSearchSQLParser.LR_BRACKET);
                this.state = 882;
                this.functionArg();
                this.state = 883;
                this.match(OpenSearchSQLParser.RR_BRACKET);
                }
                break;
            case 2:
                localContext = new CountStarFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 885;
                this.match(OpenSearchSQLParser.COUNT);
                this.state = 886;
                this.match(OpenSearchSQLParser.LR_BRACKET);
                this.state = 887;
                this.match(OpenSearchSQLParser.STAR);
                this.state = 888;
                this.match(OpenSearchSQLParser.RR_BRACKET);
                }
                break;
            case 3:
                localContext = new DistinctCountFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 889;
                this.match(OpenSearchSQLParser.COUNT);
                this.state = 890;
                this.match(OpenSearchSQLParser.LR_BRACKET);
                this.state = 891;
                this.match(OpenSearchSQLParser.DISTINCT);
                this.state = 892;
                this.functionArg();
                this.state = 893;
                this.match(OpenSearchSQLParser.RR_BRACKET);
                }
                break;
            case 4:
                localContext = new PercentileApproxFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 895;
                this.percentileApproxFunction();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public percentileApproxFunction(): PercentileApproxFunctionContext {
        let localContext = new PercentileApproxFunctionContext(this.context, this.state);
        this.enterRule(localContext, 156, OpenSearchSQLParser.RULE_percentileApproxFunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 898;
            _la = this.tokenStream.LA(1);
            if(!(_la === 250 || _la === 251)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 899;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 900;
            localContext._aggField = this.functionArg();
            this.state = 901;
            this.match(OpenSearchSQLParser.COMMA);
            this.state = 902;
            localContext._percent = this.numericLiteral();
            this.state = 905;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 334) {
                {
                this.state = 903;
                this.match(OpenSearchSQLParser.COMMA);
                this.state = 904;
                localContext._compression = this.numericLiteral();
                }
            }

            this.state = 907;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public filterClause(): FilterClauseContext {
        let localContext = new FilterClauseContext(this.context, this.state);
        this.enterRule(localContext, 158, OpenSearchSQLParser.RULE_filterClause);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 909;
            this.match(OpenSearchSQLParser.FILTER);
            this.state = 910;
            this.match(OpenSearchSQLParser.LR_BRACKET);
            this.state = 911;
            this.match(OpenSearchSQLParser.WHERE);
            this.state = 912;
            this.expression(0);
            this.state = 913;
            this.match(OpenSearchSQLParser.RR_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public aggregationFunctionName(): AggregationFunctionNameContext {
        let localContext = new AggregationFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 160, OpenSearchSQLParser.RULE_aggregationFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 915;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 65)) & ~0x1F) === 0 && ((1 << (_la - 65)) & 4095) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public mathematicalFunctionName(): MathematicalFunctionNameContext {
        let localContext = new MathematicalFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 162, OpenSearchSQLParser.RULE_mathematicalFunctionName);
        try {
            this.state = 944;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 78, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 917;
                this.match(OpenSearchSQLParser.ABS);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 918;
                this.match(OpenSearchSQLParser.CBRT);
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 919;
                this.match(OpenSearchSQLParser.CEIL);
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 920;
                this.match(OpenSearchSQLParser.CEILING);
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 921;
                this.match(OpenSearchSQLParser.CONV);
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 922;
                this.match(OpenSearchSQLParser.CRC32);
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 923;
                this.match(OpenSearchSQLParser.E);
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 924;
                this.match(OpenSearchSQLParser.EXP);
                }
                break;
            case 9:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 925;
                this.match(OpenSearchSQLParser.EXPM1);
                }
                break;
            case 10:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 926;
                this.match(OpenSearchSQLParser.FLOOR);
                }
                break;
            case 11:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 927;
                this.match(OpenSearchSQLParser.LN);
                }
                break;
            case 12:
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 928;
                this.match(OpenSearchSQLParser.LOG);
                }
                break;
            case 13:
                this.enterOuterAlt(localContext, 13);
                {
                this.state = 929;
                this.match(OpenSearchSQLParser.LOG10);
                }
                break;
            case 14:
                this.enterOuterAlt(localContext, 14);
                {
                this.state = 930;
                this.match(OpenSearchSQLParser.LOG2);
                }
                break;
            case 15:
                this.enterOuterAlt(localContext, 15);
                {
                this.state = 931;
                this.match(OpenSearchSQLParser.MOD);
                }
                break;
            case 16:
                this.enterOuterAlt(localContext, 16);
                {
                this.state = 932;
                this.match(OpenSearchSQLParser.PI);
                }
                break;
            case 17:
                this.enterOuterAlt(localContext, 17);
                {
                this.state = 933;
                this.match(OpenSearchSQLParser.POW);
                }
                break;
            case 18:
                this.enterOuterAlt(localContext, 18);
                {
                this.state = 934;
                this.match(OpenSearchSQLParser.POWER);
                }
                break;
            case 19:
                this.enterOuterAlt(localContext, 19);
                {
                this.state = 935;
                this.match(OpenSearchSQLParser.RAND);
                }
                break;
            case 20:
                this.enterOuterAlt(localContext, 20);
                {
                this.state = 936;
                this.match(OpenSearchSQLParser.RINT);
                }
                break;
            case 21:
                this.enterOuterAlt(localContext, 21);
                {
                this.state = 937;
                this.match(OpenSearchSQLParser.ROUND);
                }
                break;
            case 22:
                this.enterOuterAlt(localContext, 22);
                {
                this.state = 938;
                this.match(OpenSearchSQLParser.SIGN);
                }
                break;
            case 23:
                this.enterOuterAlt(localContext, 23);
                {
                this.state = 939;
                this.match(OpenSearchSQLParser.SIGNUM);
                }
                break;
            case 24:
                this.enterOuterAlt(localContext, 24);
                {
                this.state = 940;
                this.match(OpenSearchSQLParser.SQRT);
                }
                break;
            case 25:
                this.enterOuterAlt(localContext, 25);
                {
                this.state = 941;
                this.match(OpenSearchSQLParser.TRUNCATE);
                }
                break;
            case 26:
                this.enterOuterAlt(localContext, 26);
                {
                this.state = 942;
                this.trigonometricFunctionName();
                }
                break;
            case 27:
                this.enterOuterAlt(localContext, 27);
                {
                this.state = 943;
                this.arithmeticFunctionName();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public trigonometricFunctionName(): TrigonometricFunctionNameContext {
        let localContext = new TrigonometricFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 164, OpenSearchSQLParser.RULE_trigonometricFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 946;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 107)) & ~0x1F) === 0 && ((1 << (_la - 107)) & 114801) !== 0) || _la === 139 || ((((_la - 176)) & ~0x1F) === 0 && ((1 << (_la - 176)) & 265217) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public arithmeticFunctionName(): ArithmeticFunctionNameContext {
        let localContext = new ArithmeticFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 166, OpenSearchSQLParser.RULE_arithmeticFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 948;
            _la = this.tokenStream.LA(1);
            if(!(_la === 108 || ((((_la - 140)) & ~0x1F) === 0 && ((1 << (_la - 140)) & 167772161) !== 0) || _la === 192 || _la === 320)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public dateTimeFunctionName(): DateTimeFunctionNameContext {
        let localContext = new DateTimeFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 168, OpenSearchSQLParser.RULE_dateTimeFunctionName);
        try {
            this.state = 1009;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.CURRENT_DATE:
            case OpenSearchSQLParser.CURRENT_TIME:
            case OpenSearchSQLParser.CURRENT_TIMESTAMP:
            case OpenSearchSQLParser.LOCALTIME:
            case OpenSearchSQLParser.LOCALTIMESTAMP:
            case OpenSearchSQLParser.UTC_DATE:
            case OpenSearchSQLParser.UTC_TIME:
            case OpenSearchSQLParser.UTC_TIMESTAMP:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 950;
                this.datetimeConstantLiteral();
                }
                break;
            case OpenSearchSQLParser.ADDDATE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 951;
                this.match(OpenSearchSQLParser.ADDDATE);
                }
                break;
            case OpenSearchSQLParser.ADDTIME:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 952;
                this.match(OpenSearchSQLParser.ADDTIME);
                }
                break;
            case OpenSearchSQLParser.CONVERT_TZ:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 953;
                this.match(OpenSearchSQLParser.CONVERT_TZ);
                }
                break;
            case OpenSearchSQLParser.CURDATE:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 954;
                this.match(OpenSearchSQLParser.CURDATE);
                }
                break;
            case OpenSearchSQLParser.CURTIME:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 955;
                this.match(OpenSearchSQLParser.CURTIME);
                }
                break;
            case OpenSearchSQLParser.DATE:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 956;
                this.match(OpenSearchSQLParser.DATE);
                }
                break;
            case OpenSearchSQLParser.DATE_ADD:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 957;
                this.match(OpenSearchSQLParser.DATE_ADD);
                }
                break;
            case OpenSearchSQLParser.DATE_FORMAT:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 958;
                this.match(OpenSearchSQLParser.DATE_FORMAT);
                }
                break;
            case OpenSearchSQLParser.DATE_SUB:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 959;
                this.match(OpenSearchSQLParser.DATE_SUB);
                }
                break;
            case OpenSearchSQLParser.DATEDIFF:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 960;
                this.match(OpenSearchSQLParser.DATEDIFF);
                }
                break;
            case OpenSearchSQLParser.DATETIME:
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 961;
                this.match(OpenSearchSQLParser.DATETIME);
                }
                break;
            case OpenSearchSQLParser.DAY:
                this.enterOuterAlt(localContext, 13);
                {
                this.state = 962;
                this.match(OpenSearchSQLParser.DAY);
                }
                break;
            case OpenSearchSQLParser.DAYNAME:
                this.enterOuterAlt(localContext, 14);
                {
                this.state = 963;
                this.match(OpenSearchSQLParser.DAYNAME);
                }
                break;
            case OpenSearchSQLParser.DAYOFMONTH:
                this.enterOuterAlt(localContext, 15);
                {
                this.state = 964;
                this.match(OpenSearchSQLParser.DAYOFMONTH);
                }
                break;
            case OpenSearchSQLParser.DAY_OF_MONTH:
                this.enterOuterAlt(localContext, 16);
                {
                this.state = 965;
                this.match(OpenSearchSQLParser.DAY_OF_MONTH);
                }
                break;
            case OpenSearchSQLParser.DAYOFWEEK:
                this.enterOuterAlt(localContext, 17);
                {
                this.state = 966;
                this.match(OpenSearchSQLParser.DAYOFWEEK);
                }
                break;
            case OpenSearchSQLParser.DAYOFYEAR:
                this.enterOuterAlt(localContext, 18);
                {
                this.state = 967;
                this.match(OpenSearchSQLParser.DAYOFYEAR);
                }
                break;
            case OpenSearchSQLParser.DAY_OF_YEAR:
                this.enterOuterAlt(localContext, 19);
                {
                this.state = 968;
                this.match(OpenSearchSQLParser.DAY_OF_YEAR);
                }
                break;
            case OpenSearchSQLParser.DAY_OF_WEEK:
                this.enterOuterAlt(localContext, 20);
                {
                this.state = 969;
                this.match(OpenSearchSQLParser.DAY_OF_WEEK);
                }
                break;
            case OpenSearchSQLParser.FROM_DAYS:
                this.enterOuterAlt(localContext, 21);
                {
                this.state = 970;
                this.match(OpenSearchSQLParser.FROM_DAYS);
                }
                break;
            case OpenSearchSQLParser.FROM_UNIXTIME:
                this.enterOuterAlt(localContext, 22);
                {
                this.state = 971;
                this.match(OpenSearchSQLParser.FROM_UNIXTIME);
                }
                break;
            case OpenSearchSQLParser.HOUR:
                this.enterOuterAlt(localContext, 23);
                {
                this.state = 972;
                this.match(OpenSearchSQLParser.HOUR);
                }
                break;
            case OpenSearchSQLParser.HOUR_OF_DAY:
                this.enterOuterAlt(localContext, 24);
                {
                this.state = 973;
                this.match(OpenSearchSQLParser.HOUR_OF_DAY);
                }
                break;
            case OpenSearchSQLParser.LAST_DAY:
                this.enterOuterAlt(localContext, 25);
                {
                this.state = 974;
                this.match(OpenSearchSQLParser.LAST_DAY);
                }
                break;
            case OpenSearchSQLParser.MAKEDATE:
                this.enterOuterAlt(localContext, 26);
                {
                this.state = 975;
                this.match(OpenSearchSQLParser.MAKEDATE);
                }
                break;
            case OpenSearchSQLParser.MAKETIME:
                this.enterOuterAlt(localContext, 27);
                {
                this.state = 976;
                this.match(OpenSearchSQLParser.MAKETIME);
                }
                break;
            case OpenSearchSQLParser.MICROSECOND:
                this.enterOuterAlt(localContext, 28);
                {
                this.state = 977;
                this.match(OpenSearchSQLParser.MICROSECOND);
                }
                break;
            case OpenSearchSQLParser.MINUTE:
                this.enterOuterAlt(localContext, 29);
                {
                this.state = 978;
                this.match(OpenSearchSQLParser.MINUTE);
                }
                break;
            case OpenSearchSQLParser.MINUTE_OF_DAY:
                this.enterOuterAlt(localContext, 30);
                {
                this.state = 979;
                this.match(OpenSearchSQLParser.MINUTE_OF_DAY);
                }
                break;
            case OpenSearchSQLParser.MINUTE_OF_HOUR:
                this.enterOuterAlt(localContext, 31);
                {
                this.state = 980;
                this.match(OpenSearchSQLParser.MINUTE_OF_HOUR);
                }
                break;
            case OpenSearchSQLParser.MONTH:
                this.enterOuterAlt(localContext, 32);
                {
                this.state = 981;
                this.match(OpenSearchSQLParser.MONTH);
                }
                break;
            case OpenSearchSQLParser.MONTHNAME:
                this.enterOuterAlt(localContext, 33);
                {
                this.state = 982;
                this.match(OpenSearchSQLParser.MONTHNAME);
                }
                break;
            case OpenSearchSQLParser.MONTH_OF_YEAR:
                this.enterOuterAlt(localContext, 34);
                {
                this.state = 983;
                this.match(OpenSearchSQLParser.MONTH_OF_YEAR);
                }
                break;
            case OpenSearchSQLParser.NOW:
                this.enterOuterAlt(localContext, 35);
                {
                this.state = 984;
                this.match(OpenSearchSQLParser.NOW);
                }
                break;
            case OpenSearchSQLParser.PERIOD_ADD:
                this.enterOuterAlt(localContext, 36);
                {
                this.state = 985;
                this.match(OpenSearchSQLParser.PERIOD_ADD);
                }
                break;
            case OpenSearchSQLParser.PERIOD_DIFF:
                this.enterOuterAlt(localContext, 37);
                {
                this.state = 986;
                this.match(OpenSearchSQLParser.PERIOD_DIFF);
                }
                break;
            case OpenSearchSQLParser.QUARTER:
                this.enterOuterAlt(localContext, 38);
                {
                this.state = 987;
                this.match(OpenSearchSQLParser.QUARTER);
                }
                break;
            case OpenSearchSQLParser.SEC_TO_TIME:
                this.enterOuterAlt(localContext, 39);
                {
                this.state = 988;
                this.match(OpenSearchSQLParser.SEC_TO_TIME);
                }
                break;
            case OpenSearchSQLParser.SECOND:
                this.enterOuterAlt(localContext, 40);
                {
                this.state = 989;
                this.match(OpenSearchSQLParser.SECOND);
                }
                break;
            case OpenSearchSQLParser.SECOND_OF_MINUTE:
                this.enterOuterAlt(localContext, 41);
                {
                this.state = 990;
                this.match(OpenSearchSQLParser.SECOND_OF_MINUTE);
                }
                break;
            case OpenSearchSQLParser.SUBDATE:
                this.enterOuterAlt(localContext, 42);
                {
                this.state = 991;
                this.match(OpenSearchSQLParser.SUBDATE);
                }
                break;
            case OpenSearchSQLParser.SUBTIME:
                this.enterOuterAlt(localContext, 43);
                {
                this.state = 992;
                this.match(OpenSearchSQLParser.SUBTIME);
                }
                break;
            case OpenSearchSQLParser.SYSDATE:
                this.enterOuterAlt(localContext, 44);
                {
                this.state = 993;
                this.match(OpenSearchSQLParser.SYSDATE);
                }
                break;
            case OpenSearchSQLParser.STR_TO_DATE:
                this.enterOuterAlt(localContext, 45);
                {
                this.state = 994;
                this.match(OpenSearchSQLParser.STR_TO_DATE);
                }
                break;
            case OpenSearchSQLParser.TIME:
                this.enterOuterAlt(localContext, 46);
                {
                this.state = 995;
                this.match(OpenSearchSQLParser.TIME);
                }
                break;
            case OpenSearchSQLParser.TIME_FORMAT:
                this.enterOuterAlt(localContext, 47);
                {
                this.state = 996;
                this.match(OpenSearchSQLParser.TIME_FORMAT);
                }
                break;
            case OpenSearchSQLParser.TIME_TO_SEC:
                this.enterOuterAlt(localContext, 48);
                {
                this.state = 997;
                this.match(OpenSearchSQLParser.TIME_TO_SEC);
                }
                break;
            case OpenSearchSQLParser.TIMEDIFF:
                this.enterOuterAlt(localContext, 49);
                {
                this.state = 998;
                this.match(OpenSearchSQLParser.TIMEDIFF);
                }
                break;
            case OpenSearchSQLParser.TIMESTAMP:
                this.enterOuterAlt(localContext, 50);
                {
                this.state = 999;
                this.match(OpenSearchSQLParser.TIMESTAMP);
                }
                break;
            case OpenSearchSQLParser.TO_DAYS:
                this.enterOuterAlt(localContext, 51);
                {
                this.state = 1000;
                this.match(OpenSearchSQLParser.TO_DAYS);
                }
                break;
            case OpenSearchSQLParser.TO_SECONDS:
                this.enterOuterAlt(localContext, 52);
                {
                this.state = 1001;
                this.match(OpenSearchSQLParser.TO_SECONDS);
                }
                break;
            case OpenSearchSQLParser.UNIX_TIMESTAMP:
                this.enterOuterAlt(localContext, 53);
                {
                this.state = 1002;
                this.match(OpenSearchSQLParser.UNIX_TIMESTAMP);
                }
                break;
            case OpenSearchSQLParser.WEEK:
                this.enterOuterAlt(localContext, 54);
                {
                this.state = 1003;
                this.match(OpenSearchSQLParser.WEEK);
                }
                break;
            case OpenSearchSQLParser.WEEKDAY:
                this.enterOuterAlt(localContext, 55);
                {
                this.state = 1004;
                this.match(OpenSearchSQLParser.WEEKDAY);
                }
                break;
            case OpenSearchSQLParser.WEEK_OF_YEAR:
                this.enterOuterAlt(localContext, 56);
                {
                this.state = 1005;
                this.match(OpenSearchSQLParser.WEEK_OF_YEAR);
                }
                break;
            case OpenSearchSQLParser.WEEKOFYEAR:
                this.enterOuterAlt(localContext, 57);
                {
                this.state = 1006;
                this.match(OpenSearchSQLParser.WEEKOFYEAR);
                }
                break;
            case OpenSearchSQLParser.YEAR:
                this.enterOuterAlt(localContext, 58);
                {
                this.state = 1007;
                this.match(OpenSearchSQLParser.YEAR);
                }
                break;
            case OpenSearchSQLParser.YEARWEEK:
                this.enterOuterAlt(localContext, 59);
                {
                this.state = 1008;
                this.match(OpenSearchSQLParser.YEARWEEK);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public textFunctionName(): TextFunctionNameContext {
        let localContext = new TextFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 170, OpenSearchSQLParser.RULE_textFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1011;
            _la = this.tokenStream.LA(1);
            if(!(_la === 37 || _la === 54 || _la === 77 || _la === 78 || ((((_la - 110)) & ~0x1F) === 0 && ((1 << (_la - 110)) & 385) !== 0) || ((((_la - 153)) & ~0x1F) === 0 && ((1 << (_la - 153)) & 838861585) !== 0) || _la === 204 || _la === 272 || _la === 273)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public flowControlFunctionName(): FlowControlFunctionNameContext {
        let localContext = new FlowControlFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 172, OpenSearchSQLParser.RULE_flowControlFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1013;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 149)) & ~0x1F) === 0 && ((1 << (_la - 149)) & 1048583) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public noFieldRelevanceFunctionName(): NoFieldRelevanceFunctionNameContext {
        let localContext = new NoFieldRelevanceFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 174, OpenSearchSQLParser.RULE_noFieldRelevanceFunctionName);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1015;
            this.match(OpenSearchSQLParser.QUERY);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public systemFunctionName(): SystemFunctionNameContext {
        let localContext = new SystemFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 176, OpenSearchSQLParser.RULE_systemFunctionName);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1017;
            this.match(OpenSearchSQLParser.TYPEOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public nestedFunctionName(): NestedFunctionNameContext {
        let localContext = new NestedFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 178, OpenSearchSQLParser.RULE_nestedFunctionName);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1019;
            this.match(OpenSearchSQLParser.NESTED);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public scoreRelevanceFunctionName(): ScoreRelevanceFunctionNameContext {
        let localContext = new ScoreRelevanceFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 180, OpenSearchSQLParser.RULE_scoreRelevanceFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1021;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 256)) & ~0x1F) === 0 && ((1 << (_la - 256)) & 7) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public singleFieldRelevanceFunctionName(): SingleFieldRelevanceFunctionNameContext {
        let localContext = new SingleFieldRelevanceFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 182, OpenSearchSQLParser.RULE_singleFieldRelevanceFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1023;
            _la = this.tokenStream.LA(1);
            if(!(_la === 41 || ((((_la - 234)) & ~0x1F) === 0 && ((1 << (_la - 234)) & 231) !== 0) || _la === 270 || _la === 271 || _la === 313)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public multiFieldRelevanceFunctionName(): MultiFieldRelevanceFunctionNameContext {
        let localContext = new MultiFieldRelevanceFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 184, OpenSearchSQLParser.RULE_multiFieldRelevanceFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1025;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 237)) & ~0x1F) === 0 && ((1 << (_la - 237)) & 1795) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public altSingleFieldRelevanceFunctionName(): AltSingleFieldRelevanceFunctionNameContext {
        let localContext = new AltSingleFieldRelevanceFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 186, OpenSearchSQLParser.RULE_altSingleFieldRelevanceFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1027;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 234)) & ~0x1F) === 0 && ((1 << (_la - 234)) & 195) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public altMultiFieldRelevanceFunctionName(): AltMultiFieldRelevanceFunctionNameContext {
        let localContext = new AltMultiFieldRelevanceFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 188, OpenSearchSQLParser.RULE_altMultiFieldRelevanceFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1029;
            _la = this.tokenStream.LA(1);
            if(!(_la === 245 || _la === 246)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public functionArgs(): FunctionArgsContext {
        let localContext = new FunctionArgsContext(this.context, this.state);
        this.enterRule(localContext, 190, OpenSearchSQLParser.RULE_functionArgs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1039;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 83963904) !== 0) || ((((_la - 36)) & ~0x1F) === 0 && ((1 << (_la - 36)) & 3766747939) !== 0) || ((((_la - 68)) & ~0x1F) === 0 && ((1 << (_la - 68)) & 67098623) !== 0) || ((((_la - 106)) & ~0x1F) === 0 && ((1 << (_la - 106)) & 4294967295) !== 0) || ((((_la - 138)) & ~0x1F) === 0 && ((1 << (_la - 138)) & 4294967295) !== 0) || ((((_la - 170)) & ~0x1F) === 0 && ((1 << (_la - 170)) & 4294967295) !== 0) || ((((_la - 202)) & ~0x1F) === 0 && ((1 << (_la - 202)) & 806616063) !== 0) || ((((_la - 234)) & ~0x1F) === 0 && ((1 << (_la - 234)) & 1674805247) !== 0) || ((((_la - 266)) & ~0x1F) === 0 && ((1 << (_la - 266)) & 1023) !== 0) || ((((_la - 308)) & ~0x1F) === 0 && ((1 << (_la - 308)) & 3764393509) !== 0) || ((((_la - 345)) & ~0x1F) === 0 && ((1 << (_la - 345)) & 459) !== 0)) {
                {
                this.state = 1031;
                this.functionArg();
                this.state = 1036;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 334) {
                    {
                    {
                    this.state = 1032;
                    this.match(OpenSearchSQLParser.COMMA);
                    this.state = 1033;
                    this.functionArg();
                    }
                    }
                    this.state = 1038;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public functionArg(): FunctionArgContext {
        let localContext = new FunctionArgContext(this.context, this.state);
        this.enterRule(localContext, 192, OpenSearchSQLParser.RULE_functionArg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1041;
            this.expression(0);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public relevanceArg(): RelevanceArgContext {
        let localContext = new RelevanceArgContext(this.context, this.state);
        this.enterRule(localContext, 194, OpenSearchSQLParser.RULE_relevanceArg);
        try {
            this.state = 1051;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.ALLOW_LEADING_WILDCARD:
            case OpenSearchSQLParser.ANALYZER:
            case OpenSearchSQLParser.ANALYZE_WILDCARD:
            case OpenSearchSQLParser.AUTO_GENERATE_SYNONYMS_PHRASE_QUERY:
            case OpenSearchSQLParser.BOOST:
            case OpenSearchSQLParser.CASE_INSENSITIVE:
            case OpenSearchSQLParser.CUTOFF_FREQUENCY:
            case OpenSearchSQLParser.DEFAULT_FIELD:
            case OpenSearchSQLParser.DEFAULT_OPERATOR:
            case OpenSearchSQLParser.ESCAPE:
            case OpenSearchSQLParser.ENABLE_POSITION_INCREMENTS:
            case OpenSearchSQLParser.FIELDS:
            case OpenSearchSQLParser.FLAGS:
            case OpenSearchSQLParser.FUZZINESS:
            case OpenSearchSQLParser.FUZZY_MAX_EXPANSIONS:
            case OpenSearchSQLParser.FUZZY_PREFIX_LENGTH:
            case OpenSearchSQLParser.FUZZY_REWRITE:
            case OpenSearchSQLParser.FUZZY_TRANSPOSITIONS:
            case OpenSearchSQLParser.LENIENT:
            case OpenSearchSQLParser.LOW_FREQ_OPERATOR:
            case OpenSearchSQLParser.MAX_DETERMINIZED_STATES:
            case OpenSearchSQLParser.MAX_EXPANSIONS:
            case OpenSearchSQLParser.MINIMUM_SHOULD_MATCH:
            case OpenSearchSQLParser.OPERATOR:
            case OpenSearchSQLParser.PHRASE_SLOP:
            case OpenSearchSQLParser.PREFIX_LENGTH:
            case OpenSearchSQLParser.QUOTE_ANALYZER:
            case OpenSearchSQLParser.QUOTE_FIELD_SUFFIX:
            case OpenSearchSQLParser.REWRITE:
            case OpenSearchSQLParser.SLOP:
            case OpenSearchSQLParser.TIE_BREAKER:
            case OpenSearchSQLParser.TIME_ZONE:
            case OpenSearchSQLParser.TYPE:
            case OpenSearchSQLParser.ZERO_TERMS_QUERY:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 1043;
                this.relevanceArgName();
                this.state = 1044;
                this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
                this.state = 1045;
                this.relevanceArgValue();
                }
                break;
            case OpenSearchSQLParser.STRING_LITERAL:
            case OpenSearchSQLParser.DOUBLE_QUOTE_ID:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 1047;
                localContext._argName = this.stringLiteral();
                this.state = 1048;
                this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
                this.state = 1049;
                localContext._argVal = this.relevanceArgValue();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public highlightArg(): HighlightArgContext {
        let localContext = new HighlightArgContext(this.context, this.state);
        this.enterRule(localContext, 196, OpenSearchSQLParser.RULE_highlightArg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1053;
            this.highlightArgName();
            this.state = 1054;
            this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
            this.state = 1055;
            this.highlightArgValue();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public relevanceArgName(): RelevanceArgNameContext {
        let localContext = new RelevanceArgNameContext(this.context, this.state);
        this.enterRule(localContext, 198, OpenSearchSQLParser.RULE_relevanceArgName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1057;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 276)) & ~0x1F) === 0 && ((1 << (_la - 276)) & 4294967295) !== 0) || _la === 308 || _la === 309)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public highlightArgName(): HighlightArgNameContext {
        let localContext = new HighlightArgNameContext(this.context, this.state);
        this.enterRule(localContext, 200, OpenSearchSQLParser.RULE_highlightArgName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1059;
            _la = this.tokenStream.LA(1);
            if(!(_la === 311 || _la === 312)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public relevanceFieldAndWeight(): RelevanceFieldAndWeightContext {
        let localContext = new RelevanceFieldAndWeightContext(this.context, this.state);
        this.enterRule(localContext, 202, OpenSearchSQLParser.RULE_relevanceFieldAndWeight);
        try {
            this.state = 1069;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 83, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 1061;
                localContext._field = this.relevanceField();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 1062;
                localContext._field = this.relevanceField();
                this.state = 1063;
                localContext._weight = this.relevanceFieldWeight();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 1065;
                localContext._field = this.relevanceField();
                this.state = 1066;
                this.match(OpenSearchSQLParser.BIT_XOR_OP);
                this.state = 1067;
                localContext._weight = this.relevanceFieldWeight();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public relevanceFieldWeight(): RelevanceFieldWeightContext {
        let localContext = new RelevanceFieldWeightContext(this.context, this.state);
        this.enterRule(localContext, 204, OpenSearchSQLParser.RULE_relevanceFieldWeight);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1071;
            this.numericLiteral();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public relevanceField(): RelevanceFieldContext {
        let localContext = new RelevanceFieldContext(this.context, this.state);
        this.enterRule(localContext, 206, OpenSearchSQLParser.RULE_relevanceField);
        try {
            this.state = 1075;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.DATETIME:
            case OpenSearchSQLParser.FIRST:
            case OpenSearchSQLParser.LAST:
            case OpenSearchSQLParser.LEFT:
            case OpenSearchSQLParser.RIGHT:
            case OpenSearchSQLParser.AVG:
            case OpenSearchSQLParser.COUNT:
            case OpenSearchSQLParser.MAX:
            case OpenSearchSQLParser.MIN:
            case OpenSearchSQLParser.SUM:
            case OpenSearchSQLParser.SUBSTRING:
            case OpenSearchSQLParser.TRIM:
            case OpenSearchSQLParser.FULL:
            case OpenSearchSQLParser.FIXED_INTERVAL:
            case OpenSearchSQLParser.CALENDAR_INTERVAL:
            case OpenSearchSQLParser.MICROSECOND:
            case OpenSearchSQLParser.SECOND:
            case OpenSearchSQLParser.MINUTE:
            case OpenSearchSQLParser.HOUR:
            case OpenSearchSQLParser.DAY:
            case OpenSearchSQLParser.WEEK:
            case OpenSearchSQLParser.MONTH:
            case OpenSearchSQLParser.QUARTER:
            case OpenSearchSQLParser.YEAR:
            case OpenSearchSQLParser.ABS:
            case OpenSearchSQLParser.ACOS:
            case OpenSearchSQLParser.ADD:
            case OpenSearchSQLParser.ADDTIME:
            case OpenSearchSQLParser.ASCII:
            case OpenSearchSQLParser.ASIN:
            case OpenSearchSQLParser.ATAN:
            case OpenSearchSQLParser.ATAN2:
            case OpenSearchSQLParser.CBRT:
            case OpenSearchSQLParser.CEIL:
            case OpenSearchSQLParser.CEILING:
            case OpenSearchSQLParser.CONCAT:
            case OpenSearchSQLParser.CONCAT_WS:
            case OpenSearchSQLParser.CONV:
            case OpenSearchSQLParser.CONVERT_TZ:
            case OpenSearchSQLParser.COS:
            case OpenSearchSQLParser.COSH:
            case OpenSearchSQLParser.COT:
            case OpenSearchSQLParser.CRC32:
            case OpenSearchSQLParser.CURDATE:
            case OpenSearchSQLParser.CURTIME:
            case OpenSearchSQLParser.CURRENT_DATE:
            case OpenSearchSQLParser.CURRENT_TIME:
            case OpenSearchSQLParser.CURRENT_TIMESTAMP:
            case OpenSearchSQLParser.DATE:
            case OpenSearchSQLParser.DATE_ADD:
            case OpenSearchSQLParser.DATE_FORMAT:
            case OpenSearchSQLParser.DATE_SUB:
            case OpenSearchSQLParser.DATEDIFF:
            case OpenSearchSQLParser.DAYNAME:
            case OpenSearchSQLParser.DAYOFMONTH:
            case OpenSearchSQLParser.DAYOFWEEK:
            case OpenSearchSQLParser.DAYOFYEAR:
            case OpenSearchSQLParser.DEGREES:
            case OpenSearchSQLParser.DIVIDE:
            case OpenSearchSQLParser.E:
            case OpenSearchSQLParser.EXP:
            case OpenSearchSQLParser.EXPM1:
            case OpenSearchSQLParser.FLOOR:
            case OpenSearchSQLParser.FROM_DAYS:
            case OpenSearchSQLParser.FROM_UNIXTIME:
            case OpenSearchSQLParser.IF:
            case OpenSearchSQLParser.IFNULL:
            case OpenSearchSQLParser.ISNULL:
            case OpenSearchSQLParser.LAST_DAY:
            case OpenSearchSQLParser.LENGTH:
            case OpenSearchSQLParser.LN:
            case OpenSearchSQLParser.LOCALTIME:
            case OpenSearchSQLParser.LOCALTIMESTAMP:
            case OpenSearchSQLParser.LOCATE:
            case OpenSearchSQLParser.LOG:
            case OpenSearchSQLParser.LOG10:
            case OpenSearchSQLParser.LOG2:
            case OpenSearchSQLParser.LOWER:
            case OpenSearchSQLParser.LTRIM:
            case OpenSearchSQLParser.MAKEDATE:
            case OpenSearchSQLParser.MAKETIME:
            case OpenSearchSQLParser.MODULUS:
            case OpenSearchSQLParser.MONTHNAME:
            case OpenSearchSQLParser.MULTIPLY:
            case OpenSearchSQLParser.NOW:
            case OpenSearchSQLParser.NULLIF:
            case OpenSearchSQLParser.PERIOD_ADD:
            case OpenSearchSQLParser.PERIOD_DIFF:
            case OpenSearchSQLParser.PI:
            case OpenSearchSQLParser.POW:
            case OpenSearchSQLParser.POWER:
            case OpenSearchSQLParser.RADIANS:
            case OpenSearchSQLParser.RAND:
            case OpenSearchSQLParser.REPLACE:
            case OpenSearchSQLParser.RINT:
            case OpenSearchSQLParser.ROUND:
            case OpenSearchSQLParser.RTRIM:
            case OpenSearchSQLParser.REVERSE:
            case OpenSearchSQLParser.SEC_TO_TIME:
            case OpenSearchSQLParser.SIGN:
            case OpenSearchSQLParser.SIGNUM:
            case OpenSearchSQLParser.SIN:
            case OpenSearchSQLParser.SINH:
            case OpenSearchSQLParser.SQRT:
            case OpenSearchSQLParser.STR_TO_DATE:
            case OpenSearchSQLParser.SUBDATE:
            case OpenSearchSQLParser.SUBTIME:
            case OpenSearchSQLParser.SUBTRACT:
            case OpenSearchSQLParser.SYSDATE:
            case OpenSearchSQLParser.TAN:
            case OpenSearchSQLParser.TIME:
            case OpenSearchSQLParser.TIMEDIFF:
            case OpenSearchSQLParser.TIME_FORMAT:
            case OpenSearchSQLParser.TIME_TO_SEC:
            case OpenSearchSQLParser.TIMESTAMP:
            case OpenSearchSQLParser.TRUNCATE:
            case OpenSearchSQLParser.TO_DAYS:
            case OpenSearchSQLParser.TO_SECONDS:
            case OpenSearchSQLParser.UNIX_TIMESTAMP:
            case OpenSearchSQLParser.UPPER:
            case OpenSearchSQLParser.UTC_DATE:
            case OpenSearchSQLParser.UTC_TIME:
            case OpenSearchSQLParser.UTC_TIMESTAMP:
            case OpenSearchSQLParser.D:
            case OpenSearchSQLParser.T:
            case OpenSearchSQLParser.TS:
            case OpenSearchSQLParser.DAY_OF_MONTH:
            case OpenSearchSQLParser.DAY_OF_YEAR:
            case OpenSearchSQLParser.DAY_OF_WEEK:
            case OpenSearchSQLParser.FIELD:
            case OpenSearchSQLParser.HOUR_OF_DAY:
            case OpenSearchSQLParser.MINUTE_OF_DAY:
            case OpenSearchSQLParser.MINUTE_OF_HOUR:
            case OpenSearchSQLParser.MONTH_OF_YEAR:
            case OpenSearchSQLParser.NESTED:
            case OpenSearchSQLParser.SECOND_OF_MINUTE:
            case OpenSearchSQLParser.TYPEOF:
            case OpenSearchSQLParser.WEEK_OF_YEAR:
            case OpenSearchSQLParser.WEEKOFYEAR:
            case OpenSearchSQLParser.WEEKDAY:
            case OpenSearchSQLParser.SUBSTR:
            case OpenSearchSQLParser.STRCMP:
            case OpenSearchSQLParser.ADDDATE:
            case OpenSearchSQLParser.YEARWEEK:
            case OpenSearchSQLParser.TYPE:
            case OpenSearchSQLParser.MOD:
            case OpenSearchSQLParser.DOT:
            case OpenSearchSQLParser.ID:
            case OpenSearchSQLParser.BACKTICK_QUOTE_ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 1073;
                this.qualifiedName();
                }
                break;
            case OpenSearchSQLParser.STRING_LITERAL:
            case OpenSearchSQLParser.DOUBLE_QUOTE_ID:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 1074;
                this.stringLiteral();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public relevanceQuery(): RelevanceQueryContext {
        let localContext = new RelevanceQueryContext(this.context, this.state);
        this.enterRule(localContext, 208, OpenSearchSQLParser.RULE_relevanceQuery);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1077;
            this.relevanceArgValue();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public relevanceArgValue(): RelevanceArgValueContext {
        let localContext = new RelevanceArgValueContext(this.context, this.state);
        this.enterRule(localContext, 210, OpenSearchSQLParser.RULE_relevanceArgValue);
        try {
            this.state = 1081;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 85, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 1079;
                this.qualifiedName();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 1080;
                this.constant();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public highlightArgValue(): HighlightArgValueContext {
        let localContext = new HighlightArgValueContext(this.context, this.state);
        this.enterRule(localContext, 212, OpenSearchSQLParser.RULE_highlightArgValue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1083;
            this.stringLiteral();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public bucketArgValue(): BucketArgValueContext {
        let localContext = new BucketArgValueContext(this.context, this.state);
        this.enterRule(localContext, 214, OpenSearchSQLParser.RULE_bucketArgValue);
        try {
            this.state = 1087;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 86, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 1085;
                this.constant();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 1086;
                this.qualifiedName();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public alternateMultiMatchArgName(): AlternateMultiMatchArgNameContext {
        let localContext = new AlternateMultiMatchArgNameContext(this.context, this.state);
        this.enterRule(localContext, 216, OpenSearchSQLParser.RULE_alternateMultiMatchArgName);
        try {
            this.state = 1092;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.FIELDS:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 1089;
                this.match(OpenSearchSQLParser.FIELDS);
                }
                break;
            case OpenSearchSQLParser.QUERY:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 1090;
                this.match(OpenSearchSQLParser.QUERY);
                }
                break;
            case OpenSearchSQLParser.STRING_LITERAL:
            case OpenSearchSQLParser.DOUBLE_QUOTE_ID:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 1091;
                this.stringLiteral();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public alternateMultiMatchQuery(): AlternateMultiMatchQueryContext {
        let localContext = new AlternateMultiMatchQueryContext(this.context, this.state);
        this.enterRule(localContext, 218, OpenSearchSQLParser.RULE_alternateMultiMatchQuery);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1094;
            localContext._argName = this.alternateMultiMatchArgName();
            this.state = 1095;
            this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
            this.state = 1096;
            localContext._argVal = this.relevanceArgValue();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public alternateMultiMatchField(): AlternateMultiMatchFieldContext {
        let localContext = new AlternateMultiMatchFieldContext(this.context, this.state);
        this.enterRule(localContext, 220, OpenSearchSQLParser.RULE_alternateMultiMatchField);
        try {
            this.state = 1108;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 88, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 1098;
                localContext._argName = this.alternateMultiMatchArgName();
                this.state = 1099;
                this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
                this.state = 1100;
                localContext._argVal = this.relevanceArgValue();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 1102;
                localContext._argName = this.alternateMultiMatchArgName();
                this.state = 1103;
                this.match(OpenSearchSQLParser.EQUAL_SYMBOL);
                this.state = 1104;
                this.match(OpenSearchSQLParser.LT_SQR_PRTHS);
                this.state = 1105;
                localContext._argVal = this.relevanceArgValue();
                this.state = 1106;
                this.match(OpenSearchSQLParser.RT_SQR_PRTHS);
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public tableName(): TableNameContext {
        let localContext = new TableNameContext(this.context, this.state);
        this.enterRule(localContext, 222, OpenSearchSQLParser.RULE_tableName);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1110;
            this.qualifiedName();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public columnName(): ColumnNameContext {
        let localContext = new ColumnNameContext(this.context, this.state);
        this.enterRule(localContext, 224, OpenSearchSQLParser.RULE_columnName);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1112;
            this.qualifiedName();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public allTupleFields(): AllTupleFieldsContext {
        let localContext = new AllTupleFieldsContext(this.context, this.state);
        this.enterRule(localContext, 226, OpenSearchSQLParser.RULE_allTupleFields);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1114;
            localContext._path = this.qualifiedName();
            this.state = 1115;
            this.match(OpenSearchSQLParser.DOT);
            this.state = 1116;
            this.match(OpenSearchSQLParser.STAR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public alias(): AliasContext {
        let localContext = new AliasContext(this.context, this.state);
        this.enterRule(localContext, 228, OpenSearchSQLParser.RULE_alias);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1118;
            this.ident();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public qualifiedName(): QualifiedNameContext {
        let localContext = new QualifiedNameContext(this.context, this.state);
        this.enterRule(localContext, 230, OpenSearchSQLParser.RULE_qualifiedName);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1120;
            this.ident();
            this.state = 1125;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 89, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 1121;
                    this.match(OpenSearchSQLParser.DOT);
                    this.state = 1122;
                    this.ident();
                    }
                    }
                }
                this.state = 1127;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 89, this.context);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public ident(): IdentContext {
        let localContext = new IdentContext(this.context, this.state);
        this.enterRule(localContext, 232, OpenSearchSQLParser.RULE_ident);
        let _la: number;
        try {
            this.state = 1135;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchSQLParser.DOT:
            case OpenSearchSQLParser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 1129;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 329) {
                    {
                    this.state = 1128;
                    this.match(OpenSearchSQLParser.DOT);
                    }
                }

                this.state = 1131;
                this.match(OpenSearchSQLParser.ID);
                }
                break;
            case OpenSearchSQLParser.BACKTICK_QUOTE_ID:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 1132;
                this.match(OpenSearchSQLParser.BACKTICK_QUOTE_ID);
                }
                break;
            case OpenSearchSQLParser.FIRST:
            case OpenSearchSQLParser.LAST:
            case OpenSearchSQLParser.AVG:
            case OpenSearchSQLParser.COUNT:
            case OpenSearchSQLParser.MAX:
            case OpenSearchSQLParser.MIN:
            case OpenSearchSQLParser.SUM:
            case OpenSearchSQLParser.FULL:
            case OpenSearchSQLParser.FIXED_INTERVAL:
            case OpenSearchSQLParser.CALENDAR_INTERVAL:
            case OpenSearchSQLParser.D:
            case OpenSearchSQLParser.T:
            case OpenSearchSQLParser.TS:
            case OpenSearchSQLParser.FIELD:
            case OpenSearchSQLParser.TYPE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 1133;
                this.keywordsCanBeId();
                }
                break;
            case OpenSearchSQLParser.DATETIME:
            case OpenSearchSQLParser.LEFT:
            case OpenSearchSQLParser.RIGHT:
            case OpenSearchSQLParser.SUBSTRING:
            case OpenSearchSQLParser.TRIM:
            case OpenSearchSQLParser.MICROSECOND:
            case OpenSearchSQLParser.SECOND:
            case OpenSearchSQLParser.MINUTE:
            case OpenSearchSQLParser.HOUR:
            case OpenSearchSQLParser.DAY:
            case OpenSearchSQLParser.WEEK:
            case OpenSearchSQLParser.MONTH:
            case OpenSearchSQLParser.QUARTER:
            case OpenSearchSQLParser.YEAR:
            case OpenSearchSQLParser.ABS:
            case OpenSearchSQLParser.ACOS:
            case OpenSearchSQLParser.ADD:
            case OpenSearchSQLParser.ADDTIME:
            case OpenSearchSQLParser.ASCII:
            case OpenSearchSQLParser.ASIN:
            case OpenSearchSQLParser.ATAN:
            case OpenSearchSQLParser.ATAN2:
            case OpenSearchSQLParser.CBRT:
            case OpenSearchSQLParser.CEIL:
            case OpenSearchSQLParser.CEILING:
            case OpenSearchSQLParser.CONCAT:
            case OpenSearchSQLParser.CONCAT_WS:
            case OpenSearchSQLParser.CONV:
            case OpenSearchSQLParser.CONVERT_TZ:
            case OpenSearchSQLParser.COS:
            case OpenSearchSQLParser.COSH:
            case OpenSearchSQLParser.COT:
            case OpenSearchSQLParser.CRC32:
            case OpenSearchSQLParser.CURDATE:
            case OpenSearchSQLParser.CURTIME:
            case OpenSearchSQLParser.CURRENT_DATE:
            case OpenSearchSQLParser.CURRENT_TIME:
            case OpenSearchSQLParser.CURRENT_TIMESTAMP:
            case OpenSearchSQLParser.DATE:
            case OpenSearchSQLParser.DATE_ADD:
            case OpenSearchSQLParser.DATE_FORMAT:
            case OpenSearchSQLParser.DATE_SUB:
            case OpenSearchSQLParser.DATEDIFF:
            case OpenSearchSQLParser.DAYNAME:
            case OpenSearchSQLParser.DAYOFMONTH:
            case OpenSearchSQLParser.DAYOFWEEK:
            case OpenSearchSQLParser.DAYOFYEAR:
            case OpenSearchSQLParser.DEGREES:
            case OpenSearchSQLParser.DIVIDE:
            case OpenSearchSQLParser.E:
            case OpenSearchSQLParser.EXP:
            case OpenSearchSQLParser.EXPM1:
            case OpenSearchSQLParser.FLOOR:
            case OpenSearchSQLParser.FROM_DAYS:
            case OpenSearchSQLParser.FROM_UNIXTIME:
            case OpenSearchSQLParser.IF:
            case OpenSearchSQLParser.IFNULL:
            case OpenSearchSQLParser.ISNULL:
            case OpenSearchSQLParser.LAST_DAY:
            case OpenSearchSQLParser.LENGTH:
            case OpenSearchSQLParser.LN:
            case OpenSearchSQLParser.LOCALTIME:
            case OpenSearchSQLParser.LOCALTIMESTAMP:
            case OpenSearchSQLParser.LOCATE:
            case OpenSearchSQLParser.LOG:
            case OpenSearchSQLParser.LOG10:
            case OpenSearchSQLParser.LOG2:
            case OpenSearchSQLParser.LOWER:
            case OpenSearchSQLParser.LTRIM:
            case OpenSearchSQLParser.MAKEDATE:
            case OpenSearchSQLParser.MAKETIME:
            case OpenSearchSQLParser.MODULUS:
            case OpenSearchSQLParser.MONTHNAME:
            case OpenSearchSQLParser.MULTIPLY:
            case OpenSearchSQLParser.NOW:
            case OpenSearchSQLParser.NULLIF:
            case OpenSearchSQLParser.PERIOD_ADD:
            case OpenSearchSQLParser.PERIOD_DIFF:
            case OpenSearchSQLParser.PI:
            case OpenSearchSQLParser.POW:
            case OpenSearchSQLParser.POWER:
            case OpenSearchSQLParser.RADIANS:
            case OpenSearchSQLParser.RAND:
            case OpenSearchSQLParser.REPLACE:
            case OpenSearchSQLParser.RINT:
            case OpenSearchSQLParser.ROUND:
            case OpenSearchSQLParser.RTRIM:
            case OpenSearchSQLParser.REVERSE:
            case OpenSearchSQLParser.SEC_TO_TIME:
            case OpenSearchSQLParser.SIGN:
            case OpenSearchSQLParser.SIGNUM:
            case OpenSearchSQLParser.SIN:
            case OpenSearchSQLParser.SINH:
            case OpenSearchSQLParser.SQRT:
            case OpenSearchSQLParser.STR_TO_DATE:
            case OpenSearchSQLParser.SUBDATE:
            case OpenSearchSQLParser.SUBTIME:
            case OpenSearchSQLParser.SUBTRACT:
            case OpenSearchSQLParser.SYSDATE:
            case OpenSearchSQLParser.TAN:
            case OpenSearchSQLParser.TIME:
            case OpenSearchSQLParser.TIMEDIFF:
            case OpenSearchSQLParser.TIME_FORMAT:
            case OpenSearchSQLParser.TIME_TO_SEC:
            case OpenSearchSQLParser.TIMESTAMP:
            case OpenSearchSQLParser.TRUNCATE:
            case OpenSearchSQLParser.TO_DAYS:
            case OpenSearchSQLParser.TO_SECONDS:
            case OpenSearchSQLParser.UNIX_TIMESTAMP:
            case OpenSearchSQLParser.UPPER:
            case OpenSearchSQLParser.UTC_DATE:
            case OpenSearchSQLParser.UTC_TIME:
            case OpenSearchSQLParser.UTC_TIMESTAMP:
            case OpenSearchSQLParser.DAY_OF_MONTH:
            case OpenSearchSQLParser.DAY_OF_YEAR:
            case OpenSearchSQLParser.DAY_OF_WEEK:
            case OpenSearchSQLParser.HOUR_OF_DAY:
            case OpenSearchSQLParser.MINUTE_OF_DAY:
            case OpenSearchSQLParser.MINUTE_OF_HOUR:
            case OpenSearchSQLParser.MONTH_OF_YEAR:
            case OpenSearchSQLParser.NESTED:
            case OpenSearchSQLParser.SECOND_OF_MINUTE:
            case OpenSearchSQLParser.TYPEOF:
            case OpenSearchSQLParser.WEEK_OF_YEAR:
            case OpenSearchSQLParser.WEEKOFYEAR:
            case OpenSearchSQLParser.WEEKDAY:
            case OpenSearchSQLParser.SUBSTR:
            case OpenSearchSQLParser.STRCMP:
            case OpenSearchSQLParser.ADDDATE:
            case OpenSearchSQLParser.YEARWEEK:
            case OpenSearchSQLParser.MOD:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 1134;
                this.scalarFunctionName();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public keywordsCanBeId(): KeywordsCanBeIdContext {
        let localContext = new KeywordsCanBeIdContext(this.context, this.state);
        this.enterRule(localContext, 234, OpenSearchSQLParser.RULE_keywordsCanBeId);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 1137;
            _la = this.tokenStream.LA(1);
            if(!(_la === 26 || _la === 36 || ((((_la - 65)) & ~0x1F) === 0 && ((1 << (_la - 65)) & 819231) !== 0) || ((((_la - 208)) & ~0x1F) === 0 && ((1 << (_la - 208)) & 16391) !== 0) || _la === 308)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }

    public override sempred(localContext: antlr.ParserRuleContext | null, ruleIndex: number, predIndex: number): boolean {
        switch (ruleIndex) {
        case 45:
            return this.expression_sempred(localContext as ExpressionContext, predIndex);
        case 46:
            return this.predicate_sempred(localContext as PredicateContext, predIndex);
        case 48:
            return this.expressionAtom_sempred(localContext as ExpressionAtomContext, predIndex);
        }
        return true;
    }
    private expression_sempred(localContext: ExpressionContext | null, predIndex: number): boolean {
        switch (predIndex) {
        case 0:
            return this.precpred(this.context, 3);
        case 1:
            return this.precpred(this.context, 2);
        }
        return true;
    }
    private predicate_sempred(localContext: PredicateContext | null, predIndex: number): boolean {
        switch (predIndex) {
        case 2:
            return this.precpred(this.context, 6);
        case 3:
            return this.precpred(this.context, 4);
        case 4:
            return this.precpred(this.context, 3);
        case 5:
            return this.precpred(this.context, 2);
        case 6:
            return this.precpred(this.context, 5);
        case 7:
            return this.precpred(this.context, 1);
        }
        return true;
    }
    private expressionAtom_sempred(localContext: ExpressionAtomContext | null, predIndex: number): boolean {
        switch (predIndex) {
        case 8:
            return this.precpred(this.context, 2);
        case 9:
            return this.precpred(this.context, 1);
        }
        return true;
    }

    public static readonly _serializedATN: number[] = [
        4,1,354,1140,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,
        7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,
        13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,
        20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,
        26,2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,
        33,7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,
        39,2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,
        46,7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,2,51,7,51,2,52,7,
        52,2,53,7,53,2,54,7,54,2,55,7,55,2,56,7,56,2,57,7,57,2,58,7,58,2,
        59,7,59,2,60,7,60,2,61,7,61,2,62,7,62,2,63,7,63,2,64,7,64,2,65,7,
        65,2,66,7,66,2,67,7,67,2,68,7,68,2,69,7,69,2,70,7,70,2,71,7,71,2,
        72,7,72,2,73,7,73,2,74,7,74,2,75,7,75,2,76,7,76,2,77,7,77,2,78,7,
        78,2,79,7,79,2,80,7,80,2,81,7,81,2,82,7,82,2,83,7,83,2,84,7,84,2,
        85,7,85,2,86,7,86,2,87,7,87,2,88,7,88,2,89,7,89,2,90,7,90,2,91,7,
        91,2,92,7,92,2,93,7,93,2,94,7,94,2,95,7,95,2,96,7,96,2,97,7,97,2,
        98,7,98,2,99,7,99,2,100,7,100,2,101,7,101,2,102,7,102,2,103,7,103,
        2,104,7,104,2,105,7,105,2,106,7,106,2,107,7,107,2,108,7,108,2,109,
        7,109,2,110,7,110,2,111,7,111,2,112,7,112,2,113,7,113,2,114,7,114,
        2,115,7,115,2,116,7,116,2,117,7,117,1,0,3,0,238,8,0,1,0,3,0,241,
        8,0,1,0,1,0,1,1,1,1,3,1,247,8,1,1,2,1,2,1,3,1,3,1,4,1,4,3,4,255,
        8,4,1,5,1,5,1,5,1,5,1,6,1,6,1,6,1,6,3,6,265,8,6,1,7,1,7,1,7,1,7,
        1,8,1,8,1,8,1,9,1,9,3,9,276,8,9,1,10,4,10,279,8,10,11,10,12,10,280,
        1,11,1,11,3,11,285,8,11,1,11,3,11,288,8,11,1,12,1,12,3,12,292,8,
        12,1,12,1,12,1,13,1,13,1,14,1,14,3,14,300,8,14,1,14,1,14,5,14,304,
        8,14,10,14,12,14,307,9,14,1,15,1,15,3,15,311,8,15,1,15,3,15,314,
        8,15,1,16,1,16,1,16,3,16,319,8,16,1,16,3,16,322,8,16,1,16,3,16,325,
        8,16,1,16,3,16,328,8,16,1,17,1,17,3,17,332,8,17,1,17,3,17,335,8,
        17,1,17,1,17,1,17,1,17,3,17,341,8,17,1,17,1,17,3,17,345,8,17,1,18,
        1,18,1,18,1,19,1,19,1,19,1,19,1,20,1,20,1,20,5,20,357,8,20,10,20,
        12,20,360,9,20,1,21,1,21,1,22,1,22,1,22,1,23,1,23,1,23,1,23,1,23,
        5,23,372,8,23,10,23,12,23,375,9,23,1,24,1,24,3,24,379,8,24,1,24,
        1,24,3,24,383,8,24,1,25,1,25,1,25,1,25,3,25,389,8,25,1,25,1,25,1,
        25,1,25,1,25,1,25,3,25,397,8,25,1,26,1,26,1,26,1,27,1,27,1,27,3,
        27,405,8,27,1,27,1,27,3,27,409,8,27,1,28,1,28,1,28,3,28,414,8,28,
        1,28,3,28,417,8,28,1,28,1,28,1,29,1,29,1,29,1,29,1,29,5,29,426,8,
        29,10,29,12,29,429,9,29,1,30,1,30,3,30,433,8,30,1,30,1,30,3,30,437,
        8,30,1,30,1,30,1,30,1,30,1,30,3,30,444,8,30,1,31,1,31,1,32,1,32,
        3,32,450,8,32,1,33,1,33,1,34,1,34,1,35,1,35,1,36,1,36,1,37,1,37,
        1,38,1,38,1,38,3,38,465,8,38,1,39,1,39,1,39,1,39,1,39,1,39,1,39,
        3,39,474,8,39,1,40,1,40,1,40,1,40,1,40,1,40,1,40,3,40,483,8,40,1,
        41,1,41,1,41,1,41,1,41,1,41,1,41,3,41,492,8,41,1,42,1,42,1,43,1,
        43,1,43,1,43,1,44,1,44,1,45,1,45,1,45,1,45,3,45,506,8,45,1,45,1,
        45,1,45,1,45,1,45,1,45,5,45,514,8,45,10,45,12,45,517,9,45,1,46,1,
        46,1,46,1,46,1,46,1,46,1,46,1,46,1,46,3,46,528,8,46,1,46,1,46,1,
        46,1,46,1,46,1,46,1,46,3,46,537,8,46,1,46,1,46,1,46,1,46,1,46,1,
        46,1,46,1,46,1,46,1,46,3,46,549,8,46,1,46,1,46,1,46,1,46,1,46,5,
        46,556,8,46,10,46,12,46,559,9,46,1,47,1,47,1,47,5,47,564,8,47,10,
        47,12,47,567,9,47,1,48,1,48,1,48,1,48,1,48,1,48,1,48,1,48,3,48,577,
        8,48,1,48,1,48,1,48,1,48,1,48,1,48,5,48,585,8,48,10,48,12,48,588,
        9,48,1,49,1,49,1,49,1,49,1,49,1,49,1,49,1,49,1,49,1,49,1,49,3,49,
        601,8,49,1,50,3,50,604,8,50,1,50,1,50,1,51,1,51,1,51,1,51,1,51,1,
        51,1,51,1,51,1,51,1,51,1,51,1,51,1,51,1,51,1,51,3,51,623,8,51,1,
        51,1,51,1,51,1,51,1,51,1,51,1,51,1,51,1,51,1,51,3,51,635,8,51,1,
        52,1,52,1,52,1,52,1,52,1,52,1,52,1,52,1,52,1,53,1,53,1,54,1,54,1,
        54,1,54,1,54,1,54,1,54,1,55,1,55,1,56,1,56,1,56,1,56,1,56,1,56,1,
        56,1,57,1,57,1,58,1,58,1,59,1,59,3,59,670,8,59,1,60,1,60,1,60,1,
        60,1,60,5,60,677,8,60,10,60,12,60,680,9,60,1,60,1,60,1,61,1,61,1,
        61,1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,62,1,62,1,63,1,63,1,
        63,1,63,1,63,1,63,1,63,1,64,1,64,1,64,1,64,1,64,1,64,1,64,1,65,1,
        65,1,65,1,65,1,65,1,65,3,65,717,8,65,1,66,1,66,1,67,1,67,1,67,4,
        67,724,8,67,11,67,12,67,725,1,67,1,67,3,67,730,8,67,1,67,1,67,1,
        67,1,67,4,67,736,8,67,11,67,12,67,737,1,67,1,67,3,67,742,8,67,1,
        67,1,67,1,67,1,67,1,67,1,67,1,67,1,67,1,67,3,67,753,8,67,1,68,1,
        68,1,68,1,68,1,68,3,68,760,8,68,1,69,1,69,1,69,1,69,1,69,3,69,767,
        8,69,1,69,1,69,1,70,1,70,1,70,1,70,1,70,5,70,776,8,70,10,70,12,70,
        779,9,70,1,70,1,70,1,71,1,71,1,71,1,71,1,71,1,71,1,71,5,71,790,8,
        71,10,71,12,71,793,9,71,1,71,1,71,1,72,1,72,1,72,1,72,1,72,1,72,
        5,72,803,8,72,10,72,12,72,806,9,72,1,72,1,72,1,72,1,72,1,72,5,72,
        813,8,72,10,72,12,72,816,9,72,1,72,1,72,1,72,1,72,1,72,1,72,1,72,
        1,72,1,72,5,72,827,8,72,10,72,12,72,830,9,72,1,72,1,72,3,72,834,
        8,72,1,73,1,73,1,73,1,73,1,73,1,73,1,73,5,73,843,8,73,10,73,12,73,
        846,9,73,1,73,1,73,1,74,1,74,1,74,1,74,1,74,1,74,1,74,5,74,857,8,
        74,10,74,12,74,860,9,74,1,74,1,74,1,75,1,75,1,75,1,75,1,75,1,75,
        1,75,1,75,1,75,1,75,3,75,874,8,75,1,76,1,76,1,76,1,76,1,76,1,77,
        1,77,1,77,1,77,1,77,1,77,1,77,1,77,1,77,1,77,1,77,1,77,1,77,1,77,
        1,77,1,77,3,77,897,8,77,1,78,1,78,1,78,1,78,1,78,1,78,1,78,3,78,
        906,8,78,1,78,1,78,1,79,1,79,1,79,1,79,1,79,1,79,1,80,1,80,1,81,
        1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,
        1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,
        3,81,945,8,81,1,82,1,82,1,83,1,83,1,84,1,84,1,84,1,84,1,84,1,84,
        1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,
        1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,
        1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,
        1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,
        1,84,3,84,1010,8,84,1,85,1,85,1,86,1,86,1,87,1,87,1,88,1,88,1,89,
        1,89,1,90,1,90,1,91,1,91,1,92,1,92,1,93,1,93,1,94,1,94,1,95,1,95,
        1,95,5,95,1035,8,95,10,95,12,95,1038,9,95,3,95,1040,8,95,1,96,1,
        96,1,97,1,97,1,97,1,97,1,97,1,97,1,97,1,97,3,97,1052,8,97,1,98,1,
        98,1,98,1,98,1,99,1,99,1,100,1,100,1,101,1,101,1,101,1,101,1,101,
        1,101,1,101,1,101,3,101,1070,8,101,1,102,1,102,1,103,1,103,3,103,
        1076,8,103,1,104,1,104,1,105,1,105,3,105,1082,8,105,1,106,1,106,
        1,107,1,107,3,107,1088,8,107,1,108,1,108,1,108,3,108,1093,8,108,
        1,109,1,109,1,109,1,109,1,110,1,110,1,110,1,110,1,110,1,110,1,110,
        1,110,1,110,1,110,3,110,1109,8,110,1,111,1,111,1,112,1,112,1,113,
        1,113,1,113,1,113,1,114,1,114,1,115,1,115,1,115,5,115,1124,8,115,
        10,115,12,115,1127,9,115,1,116,3,116,1130,8,116,1,116,1,116,1,116,
        1,116,3,116,1136,8,116,1,117,1,117,1,117,1,280,3,90,92,96,118,0,
        2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,
        48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,
        92,94,96,98,100,102,104,106,108,110,112,114,116,118,120,122,124,
        126,128,130,132,134,136,138,140,142,144,146,148,150,152,154,156,
        158,160,162,164,166,168,170,172,174,176,178,180,182,184,186,188,
        190,192,194,196,198,200,202,204,206,208,210,212,214,216,218,220,
        222,224,226,228,230,232,234,0,35,2,0,316,316,351,351,2,0,5,5,20,
        20,2,0,8,8,18,18,2,0,26,26,36,36,1,0,213,215,2,0,337,339,346,346,
        2,0,345,345,352,352,2,0,24,24,59,59,1,0,317,318,2,0,130,130,208,
        208,2,0,195,195,209,209,2,0,199,199,210,210,3,0,127,129,155,156,
        205,207,1,0,85,104,1,0,314,316,1,0,263,264,4,0,16,16,130,130,195,
        195,199,199,1,0,85,93,1,0,94,104,1,0,82,84,2,0,216,216,230,230,1,
        0,250,251,1,0,65,76,7,0,107,107,111,113,121,123,139,139,176,176,
        186,187,194,194,6,0,108,108,140,140,165,165,167,167,192,192,320,
        320,12,0,37,37,54,54,77,78,110,110,117,118,153,153,157,157,161,162,
        178,178,181,182,204,204,272,273,2,0,149,151,169,169,1,0,256,258,
        5,0,41,41,234,236,239,241,270,271,313,313,2,0,237,238,245,247,2,
        0,234,235,240,241,1,0,245,246,1,0,276,309,1,0,311,312,8,0,26,26,
        36,36,65,69,80,80,83,84,208,210,222,222,308,308,1246,0,237,1,0,0,
        0,2,246,1,0,0,0,4,248,1,0,0,0,6,250,1,0,0,0,8,254,1,0,0,0,10,256,
        1,0,0,0,12,260,1,0,0,0,14,266,1,0,0,0,16,270,1,0,0,0,18,275,1,0,
        0,0,20,278,1,0,0,0,22,282,1,0,0,0,24,289,1,0,0,0,26,295,1,0,0,0,
        28,299,1,0,0,0,30,308,1,0,0,0,32,315,1,0,0,0,34,344,1,0,0,0,36,346,
        1,0,0,0,38,349,1,0,0,0,40,353,1,0,0,0,42,361,1,0,0,0,44,363,1,0,
        0,0,46,366,1,0,0,0,48,376,1,0,0,0,50,396,1,0,0,0,52,398,1,0,0,0,
        54,408,1,0,0,0,56,410,1,0,0,0,58,420,1,0,0,0,60,443,1,0,0,0,62,445,
        1,0,0,0,64,449,1,0,0,0,66,451,1,0,0,0,68,453,1,0,0,0,70,455,1,0,
        0,0,72,457,1,0,0,0,74,459,1,0,0,0,76,464,1,0,0,0,78,473,1,0,0,0,
        80,482,1,0,0,0,82,491,1,0,0,0,84,493,1,0,0,0,86,495,1,0,0,0,88,499,
        1,0,0,0,90,505,1,0,0,0,92,518,1,0,0,0,94,560,1,0,0,0,96,576,1,0,
        0,0,98,600,1,0,0,0,100,603,1,0,0,0,102,634,1,0,0,0,104,636,1,0,0,
        0,106,645,1,0,0,0,108,647,1,0,0,0,110,654,1,0,0,0,112,656,1,0,0,
        0,114,663,1,0,0,0,116,665,1,0,0,0,118,669,1,0,0,0,120,671,1,0,0,
        0,122,683,1,0,0,0,124,694,1,0,0,0,126,696,1,0,0,0,128,703,1,0,0,
        0,130,716,1,0,0,0,132,718,1,0,0,0,134,752,1,0,0,0,136,759,1,0,0,
        0,138,761,1,0,0,0,140,770,1,0,0,0,142,782,1,0,0,0,144,833,1,0,0,
        0,146,835,1,0,0,0,148,849,1,0,0,0,150,873,1,0,0,0,152,875,1,0,0,
        0,154,896,1,0,0,0,156,898,1,0,0,0,158,909,1,0,0,0,160,915,1,0,0,
        0,162,944,1,0,0,0,164,946,1,0,0,0,166,948,1,0,0,0,168,1009,1,0,0,
        0,170,1011,1,0,0,0,172,1013,1,0,0,0,174,1015,1,0,0,0,176,1017,1,
        0,0,0,178,1019,1,0,0,0,180,1021,1,0,0,0,182,1023,1,0,0,0,184,1025,
        1,0,0,0,186,1027,1,0,0,0,188,1029,1,0,0,0,190,1039,1,0,0,0,192,1041,
        1,0,0,0,194,1051,1,0,0,0,196,1053,1,0,0,0,198,1057,1,0,0,0,200,1059,
        1,0,0,0,202,1069,1,0,0,0,204,1071,1,0,0,0,206,1075,1,0,0,0,208,1077,
        1,0,0,0,210,1081,1,0,0,0,212,1083,1,0,0,0,214,1087,1,0,0,0,216,1092,
        1,0,0,0,218,1094,1,0,0,0,220,1108,1,0,0,0,222,1110,1,0,0,0,224,1112,
        1,0,0,0,226,1114,1,0,0,0,228,1118,1,0,0,0,230,1120,1,0,0,0,232,1135,
        1,0,0,0,234,1137,1,0,0,0,236,238,3,2,1,0,237,236,1,0,0,0,237,238,
        1,0,0,0,238,240,1,0,0,0,239,241,5,335,0,0,240,239,1,0,0,0,240,241,
        1,0,0,0,241,242,1,0,0,0,242,243,5,0,0,1,243,1,1,0,0,0,244,247,3,
        4,2,0,245,247,3,8,4,0,246,244,1,0,0,0,246,245,1,0,0,0,247,3,1,0,
        0,0,248,249,3,6,3,0,249,5,1,0,0,0,250,251,3,22,11,0,251,7,1,0,0,
        0,252,255,3,10,5,0,253,255,3,12,6,0,254,252,1,0,0,0,254,253,1,0,
        0,0,255,9,1,0,0,0,256,257,5,56,0,0,257,258,5,105,0,0,258,259,3,16,
        8,0,259,11,1,0,0,0,260,261,5,19,0,0,261,262,5,105,0,0,262,264,3,
        16,8,0,263,265,3,14,7,0,264,263,1,0,0,0,264,265,1,0,0,0,265,13,1,
        0,0,0,266,267,5,15,0,0,267,268,5,38,0,0,268,269,3,18,9,0,269,15,
        1,0,0,0,270,271,5,38,0,0,271,272,3,18,9,0,272,17,1,0,0,0,273,276,
        3,20,10,0,274,276,3,66,33,0,275,273,1,0,0,0,275,274,1,0,0,0,276,
        19,1,0,0,0,277,279,7,0,0,0,278,277,1,0,0,0,279,280,1,0,0,0,280,281,
        1,0,0,0,280,278,1,0,0,0,281,21,1,0,0,0,282,284,3,24,12,0,283,285,
        3,32,16,0,284,283,1,0,0,0,284,285,1,0,0,0,285,287,1,0,0,0,286,288,
        3,50,25,0,287,286,1,0,0,0,287,288,1,0,0,0,288,23,1,0,0,0,289,291,
        5,55,0,0,290,292,3,26,13,0,291,290,1,0,0,0,291,292,1,0,0,0,292,293,
        1,0,0,0,293,294,3,28,14,0,294,25,1,0,0,0,295,296,7,1,0,0,296,27,
        1,0,0,0,297,300,5,314,0,0,298,300,3,30,15,0,299,297,1,0,0,0,299,
        298,1,0,0,0,300,305,1,0,0,0,301,302,5,334,0,0,302,304,3,30,15,0,
        303,301,1,0,0,0,304,307,1,0,0,0,305,303,1,0,0,0,305,306,1,0,0,0,
        306,29,1,0,0,0,307,305,1,0,0,0,308,313,3,90,45,0,309,311,5,7,0,0,
        310,309,1,0,0,0,310,311,1,0,0,0,311,312,1,0,0,0,312,314,3,228,114,
        0,313,310,1,0,0,0,313,314,1,0,0,0,314,31,1,0,0,0,315,316,5,27,0,
        0,316,318,3,34,17,0,317,319,3,36,18,0,318,317,1,0,0,0,318,319,1,
        0,0,0,319,321,1,0,0,0,320,322,3,38,19,0,321,320,1,0,0,0,321,322,
        1,0,0,0,322,324,1,0,0,0,323,325,3,44,22,0,324,323,1,0,0,0,324,325,
        1,0,0,0,325,327,1,0,0,0,326,328,3,46,23,0,327,326,1,0,0,0,327,328,
        1,0,0,0,328,33,1,0,0,0,329,334,3,222,111,0,330,332,5,7,0,0,331,330,
        1,0,0,0,331,332,1,0,0,0,332,333,1,0,0,0,333,335,3,228,114,0,334,
        331,1,0,0,0,334,335,1,0,0,0,335,345,1,0,0,0,336,337,5,330,0,0,337,
        338,3,22,11,0,338,340,5,331,0,0,339,341,5,7,0,0,340,339,1,0,0,0,
        340,341,1,0,0,0,341,342,1,0,0,0,342,343,3,228,114,0,343,345,1,0,
        0,0,344,329,1,0,0,0,344,336,1,0,0,0,345,35,1,0,0,0,346,347,5,63,
        0,0,347,348,3,90,45,0,348,37,1,0,0,0,349,350,5,28,0,0,350,351,5,
        11,0,0,351,352,3,40,20,0,352,39,1,0,0,0,353,358,3,42,21,0,354,355,
        5,334,0,0,355,357,3,42,21,0,356,354,1,0,0,0,357,360,1,0,0,0,358,
        356,1,0,0,0,358,359,1,0,0,0,359,41,1,0,0,0,360,358,1,0,0,0,361,362,
        3,90,45,0,362,43,1,0,0,0,363,364,5,29,0,0,364,365,3,90,45,0,365,
        45,1,0,0,0,366,367,5,49,0,0,367,368,5,11,0,0,368,373,3,48,24,0,369,
        370,5,334,0,0,370,372,3,48,24,0,371,369,1,0,0,0,372,375,1,0,0,0,
        373,371,1,0,0,0,373,374,1,0,0,0,374,47,1,0,0,0,375,373,1,0,0,0,376,
        378,3,90,45,0,377,379,7,2,0,0,378,377,1,0,0,0,378,379,1,0,0,0,379,
        382,1,0,0,0,380,381,5,46,0,0,381,383,7,3,0,0,382,380,1,0,0,0,382,
        383,1,0,0,0,383,49,1,0,0,0,384,388,5,39,0,0,385,386,3,62,31,0,386,
        387,5,334,0,0,387,389,1,0,0,0,388,385,1,0,0,0,388,389,1,0,0,0,389,
        390,1,0,0,0,390,397,3,62,31,0,391,392,5,39,0,0,392,393,3,62,31,0,
        393,394,5,81,0,0,394,395,3,62,31,0,395,397,1,0,0,0,396,384,1,0,0,
        0,396,391,1,0,0,0,397,51,1,0,0,0,398,399,3,54,27,0,399,400,3,56,
        28,0,400,53,1,0,0,0,401,402,7,4,0,0,402,404,5,330,0,0,403,405,3,
        190,95,0,404,403,1,0,0,0,404,405,1,0,0,0,405,406,1,0,0,0,406,409,
        5,331,0,0,407,409,3,154,77,0,408,401,1,0,0,0,408,407,1,0,0,0,409,
        55,1,0,0,0,410,411,5,51,0,0,411,413,5,330,0,0,412,414,3,58,29,0,
        413,412,1,0,0,0,413,414,1,0,0,0,414,416,1,0,0,0,415,417,3,46,23,
        0,416,415,1,0,0,0,416,417,1,0,0,0,417,418,1,0,0,0,418,419,5,331,
        0,0,419,57,1,0,0,0,420,421,5,52,0,0,421,422,5,11,0,0,422,427,3,90,
        45,0,423,424,5,334,0,0,424,426,3,90,45,0,425,423,1,0,0,0,426,429,
        1,0,0,0,427,425,1,0,0,0,427,428,1,0,0,0,428,59,1,0,0,0,429,427,1,
        0,0,0,430,444,3,66,33,0,431,433,3,72,36,0,432,431,1,0,0,0,432,433,
        1,0,0,0,433,434,1,0,0,0,434,444,3,62,31,0,435,437,3,72,36,0,436,
        435,1,0,0,0,436,437,1,0,0,0,437,438,1,0,0,0,438,444,3,70,35,0,439,
        444,3,68,34,0,440,444,3,76,38,0,441,444,3,86,43,0,442,444,3,74,37,
        0,443,430,1,0,0,0,443,432,1,0,0,0,443,436,1,0,0,0,443,439,1,0,0,
        0,443,440,1,0,0,0,443,441,1,0,0,0,443,442,1,0,0,0,444,61,1,0,0,0,
        445,446,7,5,0,0,446,63,1,0,0,0,447,450,3,62,31,0,448,450,3,70,35,
        0,449,447,1,0,0,0,449,448,1,0,0,0,450,65,1,0,0,0,451,452,7,6,0,0,
        452,67,1,0,0,0,453,454,7,7,0,0,454,69,1,0,0,0,455,456,5,348,0,0,
        456,71,1,0,0,0,457,458,7,8,0,0,458,73,1,0,0,0,459,460,5,45,0,0,460,
        75,1,0,0,0,461,465,3,78,39,0,462,465,3,80,40,0,463,465,3,82,41,0,
        464,461,1,0,0,0,464,462,1,0,0,0,464,463,1,0,0,0,465,77,1,0,0,0,466,
        467,5,130,0,0,467,474,3,66,33,0,468,469,5,211,0,0,469,470,7,9,0,
        0,470,471,3,66,33,0,471,472,5,212,0,0,472,474,1,0,0,0,473,466,1,
        0,0,0,473,468,1,0,0,0,474,79,1,0,0,0,475,476,5,195,0,0,476,483,3,
        66,33,0,477,478,5,211,0,0,478,479,7,10,0,0,479,480,3,66,33,0,480,
        481,5,212,0,0,481,483,1,0,0,0,482,475,1,0,0,0,482,477,1,0,0,0,483,
        81,1,0,0,0,484,485,5,199,0,0,485,492,3,66,33,0,486,487,5,211,0,0,
        487,488,7,11,0,0,488,489,3,66,33,0,489,490,5,212,0,0,490,492,1,0,
        0,0,491,484,1,0,0,0,491,486,1,0,0,0,492,83,1,0,0,0,493,494,7,12,
        0,0,494,85,1,0,0,0,495,496,5,82,0,0,496,497,3,90,45,0,497,498,3,
        88,44,0,498,87,1,0,0,0,499,500,7,13,0,0,500,89,1,0,0,0,501,502,6,
        45,-1,0,502,503,5,44,0,0,503,506,3,90,45,4,504,506,3,92,46,0,505,
        501,1,0,0,0,505,504,1,0,0,0,506,515,1,0,0,0,507,508,10,3,0,0,508,
        509,5,6,0,0,509,514,3,90,45,4,510,511,10,2,0,0,511,512,5,48,0,0,
        512,514,3,90,45,3,513,507,1,0,0,0,513,510,1,0,0,0,514,517,1,0,0,
        0,515,513,1,0,0,0,515,516,1,0,0,0,516,91,1,0,0,0,517,515,1,0,0,0,
        518,519,6,46,-1,0,519,520,3,96,48,0,520,557,1,0,0,0,521,522,10,6,
        0,0,522,523,3,98,49,0,523,524,3,92,46,7,524,556,1,0,0,0,525,527,
        10,4,0,0,526,528,5,44,0,0,527,526,1,0,0,0,527,528,1,0,0,0,528,529,
        1,0,0,0,529,530,5,10,0,0,530,531,3,92,46,0,531,532,5,6,0,0,532,533,
        3,92,46,5,533,556,1,0,0,0,534,536,10,3,0,0,535,537,5,44,0,0,536,
        535,1,0,0,0,536,537,1,0,0,0,537,538,1,0,0,0,538,539,5,38,0,0,539,
        556,3,92,46,4,540,541,10,2,0,0,541,542,5,53,0,0,542,556,3,92,46,
        3,543,544,10,5,0,0,544,545,5,34,0,0,545,556,3,100,50,0,546,548,10,
        1,0,0,547,549,5,44,0,0,548,547,1,0,0,0,548,549,1,0,0,0,549,550,1,
        0,0,0,550,551,5,30,0,0,551,552,5,330,0,0,552,553,3,94,47,0,553,554,
        5,331,0,0,554,556,1,0,0,0,555,521,1,0,0,0,555,525,1,0,0,0,555,534,
        1,0,0,0,555,540,1,0,0,0,555,543,1,0,0,0,555,546,1,0,0,0,556,559,
        1,0,0,0,557,555,1,0,0,0,557,558,1,0,0,0,558,93,1,0,0,0,559,557,1,
        0,0,0,560,565,3,90,45,0,561,562,5,334,0,0,562,564,3,90,45,0,563,
        561,1,0,0,0,564,567,1,0,0,0,565,563,1,0,0,0,565,566,1,0,0,0,566,
        95,1,0,0,0,567,565,1,0,0,0,568,569,6,48,-1,0,569,577,3,60,30,0,570,
        577,3,224,112,0,571,577,3,102,51,0,572,573,5,330,0,0,573,574,3,90,
        45,0,574,575,5,331,0,0,575,577,1,0,0,0,576,568,1,0,0,0,576,570,1,
        0,0,0,576,571,1,0,0,0,576,572,1,0,0,0,577,586,1,0,0,0,578,579,10,
        2,0,0,579,580,7,14,0,0,580,585,3,96,48,3,581,582,10,1,0,0,582,583,
        7,8,0,0,583,585,3,96,48,2,584,578,1,0,0,0,584,581,1,0,0,0,585,588,
        1,0,0,0,586,584,1,0,0,0,586,587,1,0,0,0,587,97,1,0,0,0,588,586,1,
        0,0,0,589,601,5,321,0,0,590,601,5,322,0,0,591,601,5,323,0,0,592,
        593,5,323,0,0,593,601,5,321,0,0,594,595,5,322,0,0,595,601,5,321,
        0,0,596,597,5,323,0,0,597,601,5,322,0,0,598,599,5,324,0,0,599,601,
        5,321,0,0,600,589,1,0,0,0,600,590,1,0,0,0,600,591,1,0,0,0,600,592,
        1,0,0,0,600,594,1,0,0,0,600,596,1,0,0,0,600,598,1,0,0,0,601,99,1,
        0,0,0,602,604,5,44,0,0,603,602,1,0,0,0,603,604,1,0,0,0,604,605,1,
        0,0,0,605,606,5,45,0,0,606,101,1,0,0,0,607,608,3,178,89,0,608,609,
        5,330,0,0,609,610,3,226,113,0,610,611,5,331,0,0,611,635,1,0,0,0,
        612,613,3,130,65,0,613,614,5,330,0,0,614,615,3,190,95,0,615,616,
        5,331,0,0,616,635,1,0,0,0,617,635,3,134,67,0,618,635,3,52,26,0,619,
        635,3,154,77,0,620,622,3,154,77,0,621,623,3,46,23,0,622,621,1,0,
        0,0,622,623,1,0,0,0,623,624,1,0,0,0,624,625,3,158,79,0,625,635,1,
        0,0,0,626,635,3,138,69,0,627,635,3,136,68,0,628,635,3,120,60,0,629,
        635,3,126,63,0,630,635,3,112,56,0,631,635,3,108,54,0,632,635,3,122,
        61,0,633,635,3,104,52,0,634,607,1,0,0,0,634,612,1,0,0,0,634,617,
        1,0,0,0,634,618,1,0,0,0,634,619,1,0,0,0,634,620,1,0,0,0,634,626,
        1,0,0,0,634,627,1,0,0,0,634,628,1,0,0,0,634,629,1,0,0,0,634,630,
        1,0,0,0,634,631,1,0,0,0,634,632,1,0,0,0,634,633,1,0,0,0,635,103,
        1,0,0,0,636,637,3,106,53,0,637,638,5,330,0,0,638,639,3,114,57,0,
        639,640,5,334,0,0,640,641,3,192,96,0,641,642,5,334,0,0,642,643,3,
        192,96,0,643,644,5,331,0,0,644,105,1,0,0,0,645,646,7,15,0,0,646,
        107,1,0,0,0,647,648,5,148,0,0,648,649,5,330,0,0,649,650,3,110,55,
        0,650,651,5,334,0,0,651,652,3,192,96,0,652,653,5,331,0,0,653,109,
        1,0,0,0,654,655,7,16,0,0,655,111,1,0,0,0,656,657,5,144,0,0,657,658,
        5,330,0,0,658,659,3,118,59,0,659,660,5,27,0,0,660,661,3,192,96,0,
        661,662,5,331,0,0,662,113,1,0,0,0,663,664,7,17,0,0,664,115,1,0,0,
        0,665,666,7,18,0,0,666,117,1,0,0,0,667,670,3,114,57,0,668,670,3,
        116,58,0,669,667,1,0,0,0,669,668,1,0,0,0,670,119,1,0,0,0,671,672,
        5,310,0,0,672,673,5,330,0,0,673,678,3,206,103,0,674,675,5,334,0,
        0,675,677,3,196,98,0,676,674,1,0,0,0,677,680,1,0,0,0,678,676,1,0,
        0,0,678,679,1,0,0,0,679,681,1,0,0,0,680,678,1,0,0,0,681,682,5,331,
        0,0,682,121,1,0,0,0,683,684,3,132,66,0,684,685,5,330,0,0,685,686,
        5,222,0,0,686,687,5,321,0,0,687,688,3,214,107,0,688,689,5,334,0,
        0,689,690,3,124,62,0,690,691,5,321,0,0,691,692,3,60,30,0,692,693,
        5,331,0,0,693,123,1,0,0,0,694,695,7,19,0,0,695,125,1,0,0,0,696,697,
        5,173,0,0,697,698,5,330,0,0,698,699,3,192,96,0,699,700,5,30,0,0,
        700,701,3,192,96,0,701,702,5,331,0,0,702,127,1,0,0,0,703,704,3,206,
        103,0,704,705,5,321,0,0,705,706,5,241,0,0,706,707,5,330,0,0,707,
        708,3,208,104,0,708,709,5,331,0,0,709,129,1,0,0,0,710,717,3,162,
        81,0,711,717,3,168,84,0,712,717,3,170,85,0,713,717,3,172,86,0,714,
        717,3,176,88,0,715,717,3,178,89,0,716,710,1,0,0,0,716,711,1,0,0,
        0,716,712,1,0,0,0,716,713,1,0,0,0,716,714,1,0,0,0,716,715,1,0,0,
        0,717,131,1,0,0,0,718,719,7,20,0,0,719,133,1,0,0,0,720,721,5,12,
        0,0,721,723,3,90,45,0,722,724,3,152,76,0,723,722,1,0,0,0,724,725,
        1,0,0,0,725,723,1,0,0,0,725,726,1,0,0,0,726,729,1,0,0,0,727,728,
        5,22,0,0,728,730,3,192,96,0,729,727,1,0,0,0,729,730,1,0,0,0,730,
        731,1,0,0,0,731,732,5,79,0,0,732,753,1,0,0,0,733,735,5,12,0,0,734,
        736,3,152,76,0,735,734,1,0,0,0,736,737,1,0,0,0,737,735,1,0,0,0,737,
        738,1,0,0,0,738,741,1,0,0,0,739,740,5,22,0,0,740,742,3,192,96,0,
        741,739,1,0,0,0,741,742,1,0,0,0,742,743,1,0,0,0,743,744,5,79,0,0,
        744,753,1,0,0,0,745,746,5,13,0,0,746,747,5,330,0,0,747,748,3,90,
        45,0,748,749,5,7,0,0,749,750,3,150,75,0,750,751,5,331,0,0,751,753,
        1,0,0,0,752,720,1,0,0,0,752,733,1,0,0,0,752,745,1,0,0,0,753,135,
        1,0,0,0,754,760,3,140,70,0,755,760,3,142,71,0,756,760,3,144,72,0,
        757,760,3,146,73,0,758,760,3,148,74,0,759,754,1,0,0,0,759,755,1,
        0,0,0,759,756,1,0,0,0,759,757,1,0,0,0,759,758,1,0,0,0,760,137,1,
        0,0,0,761,762,3,180,90,0,762,763,5,330,0,0,763,766,3,136,68,0,764,
        765,5,334,0,0,765,767,3,204,102,0,766,764,1,0,0,0,766,767,1,0,0,
        0,767,768,1,0,0,0,768,769,5,331,0,0,769,139,1,0,0,0,770,771,3,174,
        87,0,771,772,5,330,0,0,772,777,3,208,104,0,773,774,5,334,0,0,774,
        776,3,194,97,0,775,773,1,0,0,0,776,779,1,0,0,0,777,775,1,0,0,0,777,
        778,1,0,0,0,778,780,1,0,0,0,779,777,1,0,0,0,780,781,5,331,0,0,781,
        141,1,0,0,0,782,783,3,182,91,0,783,784,5,330,0,0,784,785,3,206,103,
        0,785,786,5,334,0,0,786,791,3,208,104,0,787,788,5,334,0,0,788,790,
        3,194,97,0,789,787,1,0,0,0,790,793,1,0,0,0,791,789,1,0,0,0,791,792,
        1,0,0,0,792,794,1,0,0,0,793,791,1,0,0,0,794,795,5,331,0,0,795,143,
        1,0,0,0,796,797,3,184,92,0,797,798,5,330,0,0,798,799,5,332,0,0,799,
        804,3,202,101,0,800,801,5,334,0,0,801,803,3,202,101,0,802,800,1,
        0,0,0,803,806,1,0,0,0,804,802,1,0,0,0,804,805,1,0,0,0,805,807,1,
        0,0,0,806,804,1,0,0,0,807,808,5,333,0,0,808,809,5,334,0,0,809,814,
        3,208,104,0,810,811,5,334,0,0,811,813,3,194,97,0,812,810,1,0,0,0,
        813,816,1,0,0,0,814,812,1,0,0,0,814,815,1,0,0,0,815,817,1,0,0,0,
        816,814,1,0,0,0,817,818,5,331,0,0,818,834,1,0,0,0,819,820,3,184,
        92,0,820,821,5,330,0,0,821,822,3,218,109,0,822,823,5,334,0,0,823,
        828,3,220,110,0,824,825,5,334,0,0,825,827,3,194,97,0,826,824,1,0,
        0,0,827,830,1,0,0,0,828,826,1,0,0,0,828,829,1,0,0,0,829,831,1,0,
        0,0,830,828,1,0,0,0,831,832,5,331,0,0,832,834,1,0,0,0,833,796,1,
        0,0,0,833,819,1,0,0,0,834,145,1,0,0,0,835,836,3,206,103,0,836,837,
        5,321,0,0,837,838,3,186,93,0,838,839,5,330,0,0,839,844,3,208,104,
        0,840,841,5,334,0,0,841,843,3,194,97,0,842,840,1,0,0,0,843,846,1,
        0,0,0,844,842,1,0,0,0,844,845,1,0,0,0,845,847,1,0,0,0,846,844,1,
        0,0,0,847,848,5,331,0,0,848,147,1,0,0,0,849,850,3,206,103,0,850,
        851,5,321,0,0,851,852,3,188,94,0,852,853,5,330,0,0,853,858,3,208,
        104,0,854,855,5,334,0,0,855,857,3,194,97,0,856,854,1,0,0,0,857,860,
        1,0,0,0,858,856,1,0,0,0,858,859,1,0,0,0,859,861,1,0,0,0,860,858,
        1,0,0,0,861,862,5,331,0,0,862,149,1,0,0,0,863,874,5,130,0,0,864,
        874,5,195,0,0,865,874,5,199,0,0,866,874,5,32,0,0,867,874,5,33,0,
        0,868,874,5,21,0,0,869,874,5,40,0,0,870,874,5,25,0,0,871,874,5,57,
        0,0,872,874,5,9,0,0,873,863,1,0,0,0,873,864,1,0,0,0,873,865,1,0,
        0,0,873,866,1,0,0,0,873,867,1,0,0,0,873,868,1,0,0,0,873,869,1,0,
        0,0,873,870,1,0,0,0,873,871,1,0,0,0,873,872,1,0,0,0,874,151,1,0,
        0,0,875,876,5,62,0,0,876,877,3,192,96,0,877,878,5,58,0,0,878,879,
        3,192,96,0,879,153,1,0,0,0,880,881,3,160,80,0,881,882,5,330,0,0,
        882,883,3,192,96,0,883,884,5,331,0,0,884,897,1,0,0,0,885,886,5,66,
        0,0,886,887,5,330,0,0,887,888,5,314,0,0,888,897,5,331,0,0,889,890,
        5,66,0,0,890,891,5,330,0,0,891,892,5,20,0,0,892,893,3,192,96,0,893,
        894,5,331,0,0,894,897,1,0,0,0,895,897,3,156,78,0,896,880,1,0,0,0,
        896,885,1,0,0,0,896,889,1,0,0,0,896,895,1,0,0,0,897,155,1,0,0,0,
        898,899,7,21,0,0,899,900,5,330,0,0,900,901,3,192,96,0,901,902,5,
        334,0,0,902,905,3,64,32,0,903,904,5,334,0,0,904,906,3,64,32,0,905,
        903,1,0,0,0,905,906,1,0,0,0,906,907,1,0,0,0,907,908,5,331,0,0,908,
        157,1,0,0,0,909,910,5,223,0,0,910,911,5,330,0,0,911,912,5,63,0,0,
        912,913,3,90,45,0,913,914,5,331,0,0,914,159,1,0,0,0,915,916,7,22,
        0,0,916,161,1,0,0,0,917,945,5,106,0,0,918,945,5,114,0,0,919,945,
        5,115,0,0,920,945,5,116,0,0,921,945,5,119,0,0,922,945,5,124,0,0,
        923,945,5,141,0,0,924,945,5,142,0,0,925,945,5,143,0,0,926,945,5,
        145,0,0,927,945,5,154,0,0,928,945,5,158,0,0,929,945,5,159,0,0,930,
        945,5,160,0,0,931,945,5,320,0,0,932,945,5,172,0,0,933,945,5,174,
        0,0,934,945,5,175,0,0,935,945,5,177,0,0,936,945,5,179,0,0,937,945,
        5,180,0,0,938,945,5,184,0,0,939,945,5,185,0,0,940,945,5,188,0,0,
        941,945,5,200,0,0,942,945,3,164,82,0,943,945,3,166,83,0,944,917,
        1,0,0,0,944,918,1,0,0,0,944,919,1,0,0,0,944,920,1,0,0,0,944,921,
        1,0,0,0,944,922,1,0,0,0,944,923,1,0,0,0,944,924,1,0,0,0,944,925,
        1,0,0,0,944,926,1,0,0,0,944,927,1,0,0,0,944,928,1,0,0,0,944,929,
        1,0,0,0,944,930,1,0,0,0,944,931,1,0,0,0,944,932,1,0,0,0,944,933,
        1,0,0,0,944,934,1,0,0,0,944,935,1,0,0,0,944,936,1,0,0,0,944,937,
        1,0,0,0,944,938,1,0,0,0,944,939,1,0,0,0,944,940,1,0,0,0,944,941,
        1,0,0,0,944,942,1,0,0,0,944,943,1,0,0,0,945,163,1,0,0,0,946,947,
        7,23,0,0,947,165,1,0,0,0,948,949,7,24,0,0,949,167,1,0,0,0,950,1010,
        3,84,42,0,951,1010,5,274,0,0,952,1010,5,109,0,0,953,1010,5,120,0,
        0,954,1010,5,125,0,0,955,1010,5,126,0,0,956,1010,5,130,0,0,957,1010,
        5,131,0,0,958,1010,5,132,0,0,959,1010,5,133,0,0,960,1010,5,134,0,
        0,961,1010,5,16,0,0,962,1010,5,89,0,0,963,1010,5,135,0,0,964,1010,
        5,136,0,0,965,1010,5,217,0,0,966,1010,5,137,0,0,967,1010,5,138,0,
        0,968,1010,5,218,0,0,969,1010,5,219,0,0,970,1010,5,146,0,0,971,1010,
        5,147,0,0,972,1010,5,88,0,0,973,1010,5,231,0,0,974,1010,5,152,0,
        0,975,1010,5,163,0,0,976,1010,5,164,0,0,977,1010,5,85,0,0,978,1010,
        5,87,0,0,979,1010,5,242,0,0,980,1010,5,243,0,0,981,1010,5,91,0,0,
        982,1010,5,166,0,0,983,1010,5,244,0,0,984,1010,5,168,0,0,985,1010,
        5,170,0,0,986,1010,5,171,0,0,987,1010,5,92,0,0,988,1010,5,183,0,
        0,989,1010,5,86,0,0,990,1010,5,259,0,0,991,1010,5,190,0,0,992,1010,
        5,191,0,0,993,1010,5,193,0,0,994,1010,5,189,0,0,995,1010,5,195,0,
        0,996,1010,5,197,0,0,997,1010,5,198,0,0,998,1010,5,196,0,0,999,1010,
        5,199,0,0,1000,1010,5,201,0,0,1001,1010,5,202,0,0,1002,1010,5,203,
        0,0,1003,1010,5,90,0,0,1004,1010,5,269,0,0,1005,1010,5,267,0,0,1006,
        1010,5,268,0,0,1007,1010,5,93,0,0,1008,1010,5,275,0,0,1009,950,1,
        0,0,0,1009,951,1,0,0,0,1009,952,1,0,0,0,1009,953,1,0,0,0,1009,954,
        1,0,0,0,1009,955,1,0,0,0,1009,956,1,0,0,0,1009,957,1,0,0,0,1009,
        958,1,0,0,0,1009,959,1,0,0,0,1009,960,1,0,0,0,1009,961,1,0,0,0,1009,
        962,1,0,0,0,1009,963,1,0,0,0,1009,964,1,0,0,0,1009,965,1,0,0,0,1009,
        966,1,0,0,0,1009,967,1,0,0,0,1009,968,1,0,0,0,1009,969,1,0,0,0,1009,
        970,1,0,0,0,1009,971,1,0,0,0,1009,972,1,0,0,0,1009,973,1,0,0,0,1009,
        974,1,0,0,0,1009,975,1,0,0,0,1009,976,1,0,0,0,1009,977,1,0,0,0,1009,
        978,1,0,0,0,1009,979,1,0,0,0,1009,980,1,0,0,0,1009,981,1,0,0,0,1009,
        982,1,0,0,0,1009,983,1,0,0,0,1009,984,1,0,0,0,1009,985,1,0,0,0,1009,
        986,1,0,0,0,1009,987,1,0,0,0,1009,988,1,0,0,0,1009,989,1,0,0,0,1009,
        990,1,0,0,0,1009,991,1,0,0,0,1009,992,1,0,0,0,1009,993,1,0,0,0,1009,
        994,1,0,0,0,1009,995,1,0,0,0,1009,996,1,0,0,0,1009,997,1,0,0,0,1009,
        998,1,0,0,0,1009,999,1,0,0,0,1009,1000,1,0,0,0,1009,1001,1,0,0,0,
        1009,1002,1,0,0,0,1009,1003,1,0,0,0,1009,1004,1,0,0,0,1009,1005,
        1,0,0,0,1009,1006,1,0,0,0,1009,1007,1,0,0,0,1009,1008,1,0,0,0,1010,
        169,1,0,0,0,1011,1012,7,25,0,0,1012,171,1,0,0,0,1013,1014,7,26,0,
        0,1014,173,1,0,0,0,1015,1016,5,254,0,0,1016,175,1,0,0,0,1017,1018,
        5,266,0,0,1018,177,1,0,0,0,1019,1020,5,248,0,0,1020,179,1,0,0,0,
        1021,1022,7,27,0,0,1022,181,1,0,0,0,1023,1024,7,28,0,0,1024,183,
        1,0,0,0,1025,1026,7,29,0,0,1026,185,1,0,0,0,1027,1028,7,30,0,0,1028,
        187,1,0,0,0,1029,1030,7,31,0,0,1030,189,1,0,0,0,1031,1036,3,192,
        96,0,1032,1033,5,334,0,0,1033,1035,3,192,96,0,1034,1032,1,0,0,0,
        1035,1038,1,0,0,0,1036,1034,1,0,0,0,1036,1037,1,0,0,0,1037,1040,
        1,0,0,0,1038,1036,1,0,0,0,1039,1031,1,0,0,0,1039,1040,1,0,0,0,1040,
        191,1,0,0,0,1041,1042,3,90,45,0,1042,193,1,0,0,0,1043,1044,3,198,
        99,0,1044,1045,5,321,0,0,1045,1046,3,210,105,0,1046,1052,1,0,0,0,
        1047,1048,3,66,33,0,1048,1049,5,321,0,0,1049,1050,3,210,105,0,1050,
        1052,1,0,0,0,1051,1043,1,0,0,0,1051,1047,1,0,0,0,1052,195,1,0,0,
        0,1053,1054,3,200,100,0,1054,1055,5,321,0,0,1055,1056,3,212,106,
        0,1056,197,1,0,0,0,1057,1058,7,32,0,0,1058,199,1,0,0,0,1059,1060,
        7,33,0,0,1060,201,1,0,0,0,1061,1070,3,206,103,0,1062,1063,3,206,
        103,0,1063,1064,3,204,102,0,1064,1070,1,0,0,0,1065,1066,3,206,103,
        0,1066,1067,5,328,0,0,1067,1068,3,204,102,0,1068,1070,1,0,0,0,1069,
        1061,1,0,0,0,1069,1062,1,0,0,0,1069,1065,1,0,0,0,1070,203,1,0,0,
        0,1071,1072,3,64,32,0,1072,205,1,0,0,0,1073,1076,3,230,115,0,1074,
        1076,3,66,33,0,1075,1073,1,0,0,0,1075,1074,1,0,0,0,1076,207,1,0,
        0,0,1077,1078,3,210,105,0,1078,209,1,0,0,0,1079,1082,3,230,115,0,
        1080,1082,3,60,30,0,1081,1079,1,0,0,0,1081,1080,1,0,0,0,1082,211,
        1,0,0,0,1083,1084,3,66,33,0,1084,213,1,0,0,0,1085,1088,3,60,30,0,
        1086,1088,3,230,115,0,1087,1085,1,0,0,0,1087,1086,1,0,0,0,1088,215,
        1,0,0,0,1089,1093,5,287,0,0,1090,1093,5,254,0,0,1091,1093,3,66,33,
        0,1092,1089,1,0,0,0,1092,1090,1,0,0,0,1092,1091,1,0,0,0,1093,217,
        1,0,0,0,1094,1095,3,216,108,0,1095,1096,5,321,0,0,1096,1097,3,210,
        105,0,1097,219,1,0,0,0,1098,1099,3,216,108,0,1099,1100,5,321,0,0,
        1100,1101,3,210,105,0,1101,1109,1,0,0,0,1102,1103,3,216,108,0,1103,
        1104,5,321,0,0,1104,1105,5,332,0,0,1105,1106,3,210,105,0,1106,1107,
        5,333,0,0,1107,1109,1,0,0,0,1108,1098,1,0,0,0,1108,1102,1,0,0,0,
        1109,221,1,0,0,0,1110,1111,3,230,115,0,1111,223,1,0,0,0,1112,1113,
        3,230,115,0,1113,225,1,0,0,0,1114,1115,3,230,115,0,1115,1116,5,329,
        0,0,1116,1117,5,314,0,0,1117,227,1,0,0,0,1118,1119,3,232,116,0,1119,
        229,1,0,0,0,1120,1125,3,232,116,0,1121,1122,5,329,0,0,1122,1124,
        3,232,116,0,1123,1121,1,0,0,0,1124,1127,1,0,0,0,1125,1123,1,0,0,
        0,1125,1126,1,0,0,0,1126,231,1,0,0,0,1127,1125,1,0,0,0,1128,1130,
        5,329,0,0,1129,1128,1,0,0,0,1129,1130,1,0,0,0,1130,1131,1,0,0,0,
        1131,1136,5,351,0,0,1132,1136,5,353,0,0,1133,1136,3,234,117,0,1134,
        1136,3,130,65,0,1135,1129,1,0,0,0,1135,1132,1,0,0,0,1135,1133,1,
        0,0,0,1135,1134,1,0,0,0,1136,233,1,0,0,0,1137,1138,7,34,0,0,1138,
        235,1,0,0,0,92,237,240,246,254,264,275,280,284,287,291,299,305,310,
        313,318,321,324,327,331,334,340,344,358,373,378,382,388,396,404,
        408,413,416,427,432,436,443,449,464,473,482,491,505,513,515,527,
        536,548,555,557,565,576,584,586,600,603,622,634,669,678,716,725,
        729,737,741,752,759,766,777,791,804,814,828,833,844,858,873,896,
        905,944,1009,1036,1039,1051,1069,1075,1081,1087,1092,1108,1125,1129,
        1135
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!OpenSearchSQLParser.__ATN) {
            OpenSearchSQLParser.__ATN = new antlr.ATNDeserializer().deserialize(OpenSearchSQLParser._serializedATN);
        }

        return OpenSearchSQLParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(OpenSearchSQLParser.literalNames, OpenSearchSQLParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return OpenSearchSQLParser.vocabulary;
    }

    private static readonly decisionsToDFA = OpenSearchSQLParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class RootContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.EOF, 0)!;
    }
    public sqlStatement(): SqlStatementContext | null {
        return this.getRuleContext(0, SqlStatementContext);
    }
    public SEMI(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SEMI, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_root;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRoot) {
            return visitor.visitRoot(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SqlStatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public dmlStatement(): DmlStatementContext | null {
        return this.getRuleContext(0, DmlStatementContext);
    }
    public adminStatement(): AdminStatementContext | null {
        return this.getRuleContext(0, AdminStatementContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_sqlStatement;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSqlStatement) {
            return visitor.visitSqlStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DmlStatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public selectStatement(): SelectStatementContext {
        return this.getRuleContext(0, SelectStatementContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_dmlStatement;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitDmlStatement) {
            return visitor.visitDmlStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SelectStatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_selectStatement;
    }
    public override copyFrom(ctx: SelectStatementContext): void {
        super.copyFrom(ctx);
    }
}
export class SimpleSelectContext extends SelectStatementContext {
    public constructor(ctx: SelectStatementContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public querySpecification(): QuerySpecificationContext {
        return this.getRuleContext(0, QuerySpecificationContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSimpleSelect) {
            return visitor.visitSimpleSelect(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AdminStatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public showStatement(): ShowStatementContext | null {
        return this.getRuleContext(0, ShowStatementContext);
    }
    public describeStatement(): DescribeStatementContext | null {
        return this.getRuleContext(0, DescribeStatementContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_adminStatement;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAdminStatement) {
            return visitor.visitAdminStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ShowStatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SHOW(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.SHOW, 0)!;
    }
    public TABLES(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.TABLES, 0)!;
    }
    public tableFilter(): TableFilterContext {
        return this.getRuleContext(0, TableFilterContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_showStatement;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitShowStatement) {
            return visitor.visitShowStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DescribeStatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DESCRIBE(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.DESCRIBE, 0)!;
    }
    public TABLES(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.TABLES, 0)!;
    }
    public tableFilter(): TableFilterContext {
        return this.getRuleContext(0, TableFilterContext)!;
    }
    public columnFilter(): ColumnFilterContext | null {
        return this.getRuleContext(0, ColumnFilterContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_describeStatement;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitDescribeStatement) {
            return visitor.visitDescribeStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ColumnFilterContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public COLUMNS(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.COLUMNS, 0)!;
    }
    public LIKE(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LIKE, 0)!;
    }
    public showDescribePattern(): ShowDescribePatternContext {
        return this.getRuleContext(0, ShowDescribePatternContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_columnFilter;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitColumnFilter) {
            return visitor.visitColumnFilter(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TableFilterContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LIKE(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LIKE, 0)!;
    }
    public showDescribePattern(): ShowDescribePatternContext {
        return this.getRuleContext(0, ShowDescribePatternContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_tableFilter;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitTableFilter) {
            return visitor.visitTableFilter(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ShowDescribePatternContext extends antlr.ParserRuleContext {
    public _oldID?: CompatibleIDContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public compatibleID(): CompatibleIDContext | null {
        return this.getRuleContext(0, CompatibleIDContext);
    }
    public stringLiteral(): StringLiteralContext | null {
        return this.getRuleContext(0, StringLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_showDescribePattern;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitShowDescribePattern) {
            return visitor.visitShowDescribePattern(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class CompatibleIDContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MODULE(): antlr.TerminalNode[];
    public MODULE(i: number): antlr.TerminalNode | null;
    public MODULE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.MODULE);
    	} else {
    		return this.getToken(OpenSearchSQLParser.MODULE, i);
    	}
    }
    public ID(): antlr.TerminalNode[];
    public ID(i: number): antlr.TerminalNode | null;
    public ID(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.ID);
    	} else {
    		return this.getToken(OpenSearchSQLParser.ID, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_compatibleID;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitCompatibleID) {
            return visitor.visitCompatibleID(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class QuerySpecificationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public selectClause(): SelectClauseContext {
        return this.getRuleContext(0, SelectClauseContext)!;
    }
    public fromClause(): FromClauseContext | null {
        return this.getRuleContext(0, FromClauseContext);
    }
    public limitClause(): LimitClauseContext | null {
        return this.getRuleContext(0, LimitClauseContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_querySpecification;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitQuerySpecification) {
            return visitor.visitQuerySpecification(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SelectClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SELECT(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.SELECT, 0)!;
    }
    public selectElements(): SelectElementsContext {
        return this.getRuleContext(0, SelectElementsContext)!;
    }
    public selectSpec(): SelectSpecContext | null {
        return this.getRuleContext(0, SelectSpecContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_selectClause;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSelectClause) {
            return visitor.visitSelectClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SelectSpecContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ALL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ALL, 0);
    }
    public DISTINCT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DISTINCT, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_selectSpec;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSelectSpec) {
            return visitor.visitSelectSpec(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SelectElementsContext extends antlr.ParserRuleContext {
    public _star?: Token | null;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public selectElement(): SelectElementContext[];
    public selectElement(i: number): SelectElementContext | null;
    public selectElement(i?: number): SelectElementContext[] | SelectElementContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SelectElementContext);
        }

        return this.getRuleContext(i, SelectElementContext);
    }
    public STAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.STAR, 0);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_selectElements;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSelectElements) {
            return visitor.visitSelectElements(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SelectElementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public alias(): AliasContext | null {
        return this.getRuleContext(0, AliasContext);
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.AS, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_selectElement;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSelectElement) {
            return visitor.visitSelectElement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FromClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FROM(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.FROM, 0)!;
    }
    public relation(): RelationContext {
        return this.getRuleContext(0, RelationContext)!;
    }
    public whereClause(): WhereClauseContext | null {
        return this.getRuleContext(0, WhereClauseContext);
    }
    public groupByClause(): GroupByClauseContext | null {
        return this.getRuleContext(0, GroupByClauseContext);
    }
    public havingClause(): HavingClauseContext | null {
        return this.getRuleContext(0, HavingClauseContext);
    }
    public orderByClause(): OrderByClauseContext | null {
        return this.getRuleContext(0, OrderByClauseContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_fromClause;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitFromClause) {
            return visitor.visitFromClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RelationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_relation;
    }
    public override copyFrom(ctx: RelationContext): void {
        super.copyFrom(ctx);
    }
}
export class TableAsRelationContext extends RelationContext {
    public constructor(ctx: RelationContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public tableName(): TableNameContext {
        return this.getRuleContext(0, TableNameContext)!;
    }
    public alias(): AliasContext | null {
        return this.getRuleContext(0, AliasContext);
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.AS, 0);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitTableAsRelation) {
            return visitor.visitTableAsRelation(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class SubqueryAsRelationContext extends RelationContext {
    public _subquery?: QuerySpecificationContext;
    public constructor(ctx: RelationContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public alias(): AliasContext {
        return this.getRuleContext(0, AliasContext)!;
    }
    public querySpecification(): QuerySpecificationContext {
        return this.getRuleContext(0, QuerySpecificationContext)!;
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.AS, 0);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSubqueryAsRelation) {
            return visitor.visitSubqueryAsRelation(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class WhereClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public WHERE(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.WHERE, 0)!;
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_whereClause;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitWhereClause) {
            return visitor.visitWhereClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GroupByClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public GROUP(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.GROUP, 0)!;
    }
    public BY(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.BY, 0)!;
    }
    public groupByElements(): GroupByElementsContext {
        return this.getRuleContext(0, GroupByElementsContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_groupByClause;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitGroupByClause) {
            return visitor.visitGroupByClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GroupByElementsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public groupByElement(): GroupByElementContext[];
    public groupByElement(i: number): GroupByElementContext | null;
    public groupByElement(i?: number): GroupByElementContext[] | GroupByElementContext | null {
        if (i === undefined) {
            return this.getRuleContexts(GroupByElementContext);
        }

        return this.getRuleContext(i, GroupByElementContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_groupByElements;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitGroupByElements) {
            return visitor.visitGroupByElements(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GroupByElementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_groupByElement;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitGroupByElement) {
            return visitor.visitGroupByElement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class HavingClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public HAVING(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.HAVING, 0)!;
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_havingClause;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitHavingClause) {
            return visitor.visitHavingClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class OrderByClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ORDER(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.ORDER, 0)!;
    }
    public BY(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.BY, 0)!;
    }
    public orderByElement(): OrderByElementContext[];
    public orderByElement(i: number): OrderByElementContext | null;
    public orderByElement(i?: number): OrderByElementContext[] | OrderByElementContext | null {
        if (i === undefined) {
            return this.getRuleContexts(OrderByElementContext);
        }

        return this.getRuleContext(i, OrderByElementContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_orderByClause;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitOrderByClause) {
            return visitor.visitOrderByClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class OrderByElementContext extends antlr.ParserRuleContext {
    public _order?: Token | null;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public NULLS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.NULLS, 0);
    }
    public FIRST(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FIRST, 0);
    }
    public LAST(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LAST, 0);
    }
    public ASC(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ASC, 0);
    }
    public DESC(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DESC, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_orderByElement;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitOrderByElement) {
            return visitor.visitOrderByElement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LimitClauseContext extends antlr.ParserRuleContext {
    public _offset?: DecimalLiteralContext;
    public _limit?: DecimalLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LIMIT(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LIMIT, 0)!;
    }
    public decimalLiteral(): DecimalLiteralContext[];
    public decimalLiteral(i: number): DecimalLiteralContext | null;
    public decimalLiteral(i?: number): DecimalLiteralContext[] | DecimalLiteralContext | null {
        if (i === undefined) {
            return this.getRuleContexts(DecimalLiteralContext);
        }

        return this.getRuleContext(i, DecimalLiteralContext);
    }
    public COMMA(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.COMMA, 0);
    }
    public OFFSET(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.OFFSET, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_limitClause;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitLimitClause) {
            return visitor.visitLimitClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class WindowFunctionClauseContext extends antlr.ParserRuleContext {
    public _function_?: WindowFunctionContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public overClause(): OverClauseContext {
        return this.getRuleContext(0, OverClauseContext)!;
    }
    public windowFunction(): WindowFunctionContext {
        return this.getRuleContext(0, WindowFunctionContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_windowFunctionClause;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitWindowFunctionClause) {
            return visitor.visitWindowFunctionClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class WindowFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_windowFunction;
    }
    public override copyFrom(ctx: WindowFunctionContext): void {
        super.copyFrom(ctx);
    }
}
export class AggregateWindowFunctionContext extends WindowFunctionContext {
    public constructor(ctx: WindowFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public aggregateFunction(): AggregateFunctionContext {
        return this.getRuleContext(0, AggregateFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAggregateWindowFunction) {
            return visitor.visitAggregateWindowFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ScalarWindowFunctionContext extends WindowFunctionContext {
    public _functionName?: Token | null;
    public constructor(ctx: WindowFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public ROW_NUMBER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ROW_NUMBER, 0);
    }
    public RANK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.RANK, 0);
    }
    public DENSE_RANK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DENSE_RANK, 0);
    }
    public functionArgs(): FunctionArgsContext | null {
        return this.getRuleContext(0, FunctionArgsContext);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitScalarWindowFunction) {
            return visitor.visitScalarWindowFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class OverClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public OVER(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.OVER, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public partitionByClause(): PartitionByClauseContext | null {
        return this.getRuleContext(0, PartitionByClauseContext);
    }
    public orderByClause(): OrderByClauseContext | null {
        return this.getRuleContext(0, OrderByClauseContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_overClause;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitOverClause) {
            return visitor.visitOverClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PartitionByClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PARTITION(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.PARTITION, 0)!;
    }
    public BY(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.BY, 0)!;
    }
    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext | null;
    public expression(i?: number): ExpressionContext[] | ExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        }

        return this.getRuleContext(i, ExpressionContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_partitionByClause;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitPartitionByClause) {
            return visitor.visitPartitionByClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ConstantContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_constant;
    }
    public override copyFrom(ctx: ConstantContext): void {
        super.copyFrom(ctx);
    }
}
export class DatetimeContext extends ConstantContext {
    public constructor(ctx: ConstantContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public datetimeLiteral(): DatetimeLiteralContext {
        return this.getRuleContext(0, DatetimeLiteralContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitDatetime) {
            return visitor.visitDatetime(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class SignedDecimalContext extends ConstantContext {
    public constructor(ctx: ConstantContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public decimalLiteral(): DecimalLiteralContext {
        return this.getRuleContext(0, DecimalLiteralContext)!;
    }
    public sign(): SignContext | null {
        return this.getRuleContext(0, SignContext);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSignedDecimal) {
            return visitor.visitSignedDecimal(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class BooleanContext extends ConstantContext {
    public constructor(ctx: ConstantContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public booleanLiteral(): BooleanLiteralContext {
        return this.getRuleContext(0, BooleanLiteralContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitBoolean) {
            return visitor.visitBoolean(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class StringContext extends ConstantContext {
    public constructor(ctx: ConstantContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public stringLiteral(): StringLiteralContext {
        return this.getRuleContext(0, StringLiteralContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitString) {
            return visitor.visitString(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class NullContext extends ConstantContext {
    public constructor(ctx: ConstantContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public nullLiteral(): NullLiteralContext {
        return this.getRuleContext(0, NullLiteralContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitNull) {
            return visitor.visitNull(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class IntervalContext extends ConstantContext {
    public constructor(ctx: ConstantContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public intervalLiteral(): IntervalLiteralContext {
        return this.getRuleContext(0, IntervalLiteralContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitInterval) {
            return visitor.visitInterval(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class SignedRealContext extends ConstantContext {
    public constructor(ctx: ConstantContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public realLiteral(): RealLiteralContext {
        return this.getRuleContext(0, RealLiteralContext)!;
    }
    public sign(): SignContext | null {
        return this.getRuleContext(0, SignContext);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSignedReal) {
            return visitor.visitSignedReal(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DecimalLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DECIMAL_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DECIMAL_LITERAL, 0);
    }
    public ZERO_DECIMAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ZERO_DECIMAL, 0);
    }
    public ONE_DECIMAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ONE_DECIMAL, 0);
    }
    public TWO_DECIMAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TWO_DECIMAL, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_decimalLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitDecimalLiteral) {
            return visitor.visitDecimalLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NumericLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public decimalLiteral(): DecimalLiteralContext | null {
        return this.getRuleContext(0, DecimalLiteralContext);
    }
    public realLiteral(): RealLiteralContext | null {
        return this.getRuleContext(0, RealLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_numericLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitNumericLiteral) {
            return visitor.visitNumericLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class StringLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public STRING_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.STRING_LITERAL, 0);
    }
    public DOUBLE_QUOTE_ID(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DOUBLE_QUOTE_ID, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_stringLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitStringLiteral) {
            return visitor.visitStringLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BooleanLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TRUE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TRUE, 0);
    }
    public FALSE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FALSE, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_booleanLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitBooleanLiteral) {
            return visitor.visitBooleanLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RealLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public REAL_LITERAL(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.REAL_LITERAL, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_realLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRealLiteral) {
            return visitor.visitRealLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SignContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.PLUS, 0);
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINUS, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_sign;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSign) {
            return visitor.visitSign(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NullLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NULL_LITERAL(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.NULL_LITERAL, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_nullLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitNullLiteral) {
            return visitor.visitNullLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DatetimeLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public dateLiteral(): DateLiteralContext | null {
        return this.getRuleContext(0, DateLiteralContext);
    }
    public timeLiteral(): TimeLiteralContext | null {
        return this.getRuleContext(0, TimeLiteralContext);
    }
    public timestampLiteral(): TimestampLiteralContext | null {
        return this.getRuleContext(0, TimestampLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_datetimeLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitDatetimeLiteral) {
            return visitor.visitDatetimeLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DateLiteralContext extends antlr.ParserRuleContext {
    public _date?: StringLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DATE, 0);
    }
    public stringLiteral(): StringLiteralContext {
        return this.getRuleContext(0, StringLiteralContext)!;
    }
    public LEFT_BRACE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LEFT_BRACE, 0);
    }
    public RIGHT_BRACE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.RIGHT_BRACE, 0);
    }
    public D(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.D, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_dateLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitDateLiteral) {
            return visitor.visitDateLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TimeLiteralContext extends antlr.ParserRuleContext {
    public _time?: StringLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIME, 0);
    }
    public stringLiteral(): StringLiteralContext {
        return this.getRuleContext(0, StringLiteralContext)!;
    }
    public LEFT_BRACE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LEFT_BRACE, 0);
    }
    public RIGHT_BRACE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.RIGHT_BRACE, 0);
    }
    public T(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.T, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_timeLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitTimeLiteral) {
            return visitor.visitTimeLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TimestampLiteralContext extends antlr.ParserRuleContext {
    public _timestamp?: StringLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIMESTAMP, 0);
    }
    public stringLiteral(): StringLiteralContext {
        return this.getRuleContext(0, StringLiteralContext)!;
    }
    public LEFT_BRACE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LEFT_BRACE, 0);
    }
    public RIGHT_BRACE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.RIGHT_BRACE, 0);
    }
    public TS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TS, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_timestampLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitTimestampLiteral) {
            return visitor.visitTimestampLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DatetimeConstantLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public CURRENT_DATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CURRENT_DATE, 0);
    }
    public CURRENT_TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CURRENT_TIME, 0);
    }
    public CURRENT_TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CURRENT_TIMESTAMP, 0);
    }
    public LOCALTIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LOCALTIME, 0);
    }
    public LOCALTIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LOCALTIMESTAMP, 0);
    }
    public UTC_TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.UTC_TIMESTAMP, 0);
    }
    public UTC_DATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.UTC_DATE, 0);
    }
    public UTC_TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.UTC_TIME, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_datetimeConstantLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitDatetimeConstantLiteral) {
            return visitor.visitDatetimeConstantLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class IntervalLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public INTERVAL(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.INTERVAL, 0)!;
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public intervalUnit(): IntervalUnitContext {
        return this.getRuleContext(0, IntervalUnitContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_intervalLiteral;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitIntervalLiteral) {
            return visitor.visitIntervalLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class IntervalUnitContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MICROSECOND, 0);
    }
    public SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SECOND, 0);
    }
    public MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINUTE, 0);
    }
    public HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HOUR, 0);
    }
    public DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY, 0);
    }
    public WEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.WEEK, 0);
    }
    public MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MONTH, 0);
    }
    public QUARTER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.QUARTER, 0);
    }
    public YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.YEAR, 0);
    }
    public SECOND_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SECOND_MICROSECOND, 0);
    }
    public MINUTE_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINUTE_MICROSECOND, 0);
    }
    public MINUTE_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINUTE_SECOND, 0);
    }
    public HOUR_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HOUR_MICROSECOND, 0);
    }
    public HOUR_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HOUR_SECOND, 0);
    }
    public HOUR_MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HOUR_MINUTE, 0);
    }
    public DAY_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY_MICROSECOND, 0);
    }
    public DAY_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY_SECOND, 0);
    }
    public DAY_MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY_MINUTE, 0);
    }
    public DAY_HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY_HOUR, 0);
    }
    public YEAR_MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.YEAR_MONTH, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_intervalUnit;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitIntervalUnit) {
            return visitor.visitIntervalUnit(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_expression;
    }
    public override copyFrom(ctx: ExpressionContext): void {
        super.copyFrom(ctx);
    }
}
export class OrExpressionContext extends ExpressionContext {
    public _left?: ExpressionContext;
    public _right?: ExpressionContext;
    public constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public OR(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.OR, 0)!;
    }
    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext | null;
    public expression(i?: number): ExpressionContext[] | ExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        }

        return this.getRuleContext(i, ExpressionContext);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitOrExpression) {
            return visitor.visitOrExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class AndExpressionContext extends ExpressionContext {
    public _left?: ExpressionContext;
    public _right?: ExpressionContext;
    public constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public AND(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.AND, 0)!;
    }
    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext | null;
    public expression(i?: number): ExpressionContext[] | ExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        }

        return this.getRuleContext(i, ExpressionContext);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAndExpression) {
            return visitor.visitAndExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class NotExpressionContext extends ExpressionContext {
    public constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public NOT(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.NOT, 0)!;
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitNotExpression) {
            return visitor.visitNotExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class PredicateExpressionContext extends ExpressionContext {
    public constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public predicate(): PredicateContext {
        return this.getRuleContext(0, PredicateContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitPredicateExpression) {
            return visitor.visitPredicateExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PredicateContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_predicate;
    }
    public override copyFrom(ctx: PredicateContext): void {
        super.copyFrom(ctx);
    }
}
export class ExpressionAtomPredicateContext extends PredicateContext {
    public constructor(ctx: PredicateContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expressionAtom(): ExpressionAtomContext {
        return this.getRuleContext(0, ExpressionAtomContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitExpressionAtomPredicate) {
            return visitor.visitExpressionAtomPredicate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class BinaryComparisonPredicateContext extends PredicateContext {
    public _left?: PredicateContext;
    public _right?: PredicateContext;
    public constructor(ctx: PredicateContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public comparisonOperator(): ComparisonOperatorContext {
        return this.getRuleContext(0, ComparisonOperatorContext)!;
    }
    public predicate(): PredicateContext[];
    public predicate(i: number): PredicateContext | null;
    public predicate(i?: number): PredicateContext[] | PredicateContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PredicateContext);
        }

        return this.getRuleContext(i, PredicateContext);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitBinaryComparisonPredicate) {
            return visitor.visitBinaryComparisonPredicate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class InPredicateContext extends PredicateContext {
    public constructor(ctx: PredicateContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public predicate(): PredicateContext {
        return this.getRuleContext(0, PredicateContext)!;
    }
    public IN(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.IN, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public expressions(): ExpressionsContext {
        return this.getRuleContext(0, ExpressionsContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.NOT, 0);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitInPredicate) {
            return visitor.visitInPredicate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class BetweenPredicateContext extends PredicateContext {
    public constructor(ctx: PredicateContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public predicate(): PredicateContext[];
    public predicate(i: number): PredicateContext | null;
    public predicate(i?: number): PredicateContext[] | PredicateContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PredicateContext);
        }

        return this.getRuleContext(i, PredicateContext);
    }
    public BETWEEN(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.BETWEEN, 0)!;
    }
    public AND(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.AND, 0)!;
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.NOT, 0);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitBetweenPredicate) {
            return visitor.visitBetweenPredicate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class IsNullPredicateContext extends PredicateContext {
    public constructor(ctx: PredicateContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public predicate(): PredicateContext {
        return this.getRuleContext(0, PredicateContext)!;
    }
    public IS(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.IS, 0)!;
    }
    public nullNotnull(): NullNotnullContext {
        return this.getRuleContext(0, NullNotnullContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitIsNullPredicate) {
            return visitor.visitIsNullPredicate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class LikePredicateContext extends PredicateContext {
    public _left?: PredicateContext;
    public _right?: PredicateContext;
    public constructor(ctx: PredicateContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public LIKE(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LIKE, 0)!;
    }
    public predicate(): PredicateContext[];
    public predicate(i: number): PredicateContext | null;
    public predicate(i?: number): PredicateContext[] | PredicateContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PredicateContext);
        }

        return this.getRuleContext(i, PredicateContext);
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.NOT, 0);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitLikePredicate) {
            return visitor.visitLikePredicate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class RegexpPredicateContext extends PredicateContext {
    public _left?: PredicateContext;
    public _right?: PredicateContext;
    public constructor(ctx: PredicateContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public REGEXP(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.REGEXP, 0)!;
    }
    public predicate(): PredicateContext[];
    public predicate(i: number): PredicateContext | null;
    public predicate(i?: number): PredicateContext[] | PredicateContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PredicateContext);
        }

        return this.getRuleContext(i, PredicateContext);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRegexpPredicate) {
            return visitor.visitRegexpPredicate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExpressionsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext | null;
    public expression(i?: number): ExpressionContext[] | ExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        }

        return this.getRuleContext(i, ExpressionContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_expressions;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitExpressions) {
            return visitor.visitExpressions(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExpressionAtomContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_expressionAtom;
    }
    public override copyFrom(ctx: ExpressionAtomContext): void {
        super.copyFrom(ctx);
    }
}
export class ConstantExpressionAtomContext extends ExpressionAtomContext {
    public constructor(ctx: ExpressionAtomContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public constant(): ConstantContext {
        return this.getRuleContext(0, ConstantContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitConstantExpressionAtom) {
            return visitor.visitConstantExpressionAtom(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class FunctionCallExpressionAtomContext extends ExpressionAtomContext {
    public constructor(ctx: ExpressionAtomContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public functionCall(): FunctionCallContext {
        return this.getRuleContext(0, FunctionCallContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitFunctionCallExpressionAtom) {
            return visitor.visitFunctionCallExpressionAtom(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class FullColumnNameExpressionAtomContext extends ExpressionAtomContext {
    public constructor(ctx: ExpressionAtomContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public columnName(): ColumnNameContext {
        return this.getRuleContext(0, ColumnNameContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitFullColumnNameExpressionAtom) {
            return visitor.visitFullColumnNameExpressionAtom(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class NestedExpressionAtomContext extends ExpressionAtomContext {
    public constructor(ctx: ExpressionAtomContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitNestedExpressionAtom) {
            return visitor.visitNestedExpressionAtom(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class MathExpressionAtomContext extends ExpressionAtomContext {
    public _left?: ExpressionAtomContext;
    public _mathOperator?: Token | null;
    public _right?: ExpressionAtomContext;
    public constructor(ctx: ExpressionAtomContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public expressionAtom(): ExpressionAtomContext[];
    public expressionAtom(i: number): ExpressionAtomContext | null;
    public expressionAtom(i?: number): ExpressionAtomContext[] | ExpressionAtomContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionAtomContext);
        }

        return this.getRuleContext(i, ExpressionAtomContext);
    }
    public STAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.STAR, 0);
    }
    public SLASH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SLASH, 0);
    }
    public MODULE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MODULE, 0);
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.PLUS, 0);
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINUS, 0);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitMathExpressionAtom) {
            return visitor.visitMathExpressionAtom(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ComparisonOperatorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQUAL_SYMBOL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.EQUAL_SYMBOL, 0);
    }
    public GREATER_SYMBOL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.GREATER_SYMBOL, 0);
    }
    public LESS_SYMBOL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LESS_SYMBOL, 0);
    }
    public EXCLAMATION_SYMBOL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.EXCLAMATION_SYMBOL, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_comparisonOperator;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitComparisonOperator) {
            return visitor.visitComparisonOperator(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NullNotnullContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NULL_LITERAL(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.NULL_LITERAL, 0)!;
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.NOT, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_nullNotnull;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitNullNotnull) {
            return visitor.visitNullNotnull(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FunctionCallContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_functionCall;
    }
    public override copyFrom(ctx: FunctionCallContext): void {
        super.copyFrom(ctx);
    }
}
export class PositionFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public positionFunction(): PositionFunctionContext {
        return this.getRuleContext(0, PositionFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitPositionFunctionCall) {
            return visitor.visitPositionFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class SpecificFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public specificFunction(): SpecificFunctionContext {
        return this.getRuleContext(0, SpecificFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSpecificFunctionCall) {
            return visitor.visitSpecificFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ScoreRelevanceFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public scoreRelevanceFunction(): ScoreRelevanceFunctionContext {
        return this.getRuleContext(0, ScoreRelevanceFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitScoreRelevanceFunctionCall) {
            return visitor.visitScoreRelevanceFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class BucketFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public bucketFunction(): BucketFunctionContext {
        return this.getRuleContext(0, BucketFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitBucketFunctionCall) {
            return visitor.visitBucketFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class HighlightFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public highlightFunction(): HighlightFunctionContext {
        return this.getRuleContext(0, HighlightFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitHighlightFunctionCall) {
            return visitor.visitHighlightFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ExtractFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public extractFunction(): ExtractFunctionContext {
        return this.getRuleContext(0, ExtractFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitExtractFunctionCall) {
            return visitor.visitExtractFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class RelevanceFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public relevanceFunction(): RelevanceFunctionContext {
        return this.getRuleContext(0, RelevanceFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceFunctionCall) {
            return visitor.visitRelevanceFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class TimestampFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public timestampFunction(): TimestampFunctionContext {
        return this.getRuleContext(0, TimestampFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitTimestampFunctionCall) {
            return visitor.visitTimestampFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class NestedAllFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public nestedFunctionName(): NestedFunctionNameContext {
        return this.getRuleContext(0, NestedFunctionNameContext)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public allTupleFields(): AllTupleFieldsContext {
        return this.getRuleContext(0, AllTupleFieldsContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitNestedAllFunctionCall) {
            return visitor.visitNestedAllFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class FilteredAggregationFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public aggregateFunction(): AggregateFunctionContext {
        return this.getRuleContext(0, AggregateFunctionContext)!;
    }
    public filterClause(): FilterClauseContext {
        return this.getRuleContext(0, FilterClauseContext)!;
    }
    public orderByClause(): OrderByClauseContext | null {
        return this.getRuleContext(0, OrderByClauseContext);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitFilteredAggregationFunctionCall) {
            return visitor.visitFilteredAggregationFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class WindowFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public windowFunctionClause(): WindowFunctionClauseContext {
        return this.getRuleContext(0, WindowFunctionClauseContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitWindowFunctionCall) {
            return visitor.visitWindowFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class AggregateFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public aggregateFunction(): AggregateFunctionContext {
        return this.getRuleContext(0, AggregateFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAggregateFunctionCall) {
            return visitor.visitAggregateFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class GetFormatFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public getFormatFunction(): GetFormatFunctionContext {
        return this.getRuleContext(0, GetFormatFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitGetFormatFunctionCall) {
            return visitor.visitGetFormatFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ScalarFunctionCallContext extends FunctionCallContext {
    public constructor(ctx: FunctionCallContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public scalarFunctionName(): ScalarFunctionNameContext {
        return this.getRuleContext(0, ScalarFunctionNameContext)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public functionArgs(): FunctionArgsContext {
        return this.getRuleContext(0, FunctionArgsContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitScalarFunctionCall) {
            return visitor.visitScalarFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TimestampFunctionContext extends antlr.ParserRuleContext {
    public _firstArg?: FunctionArgContext;
    public _secondArg?: FunctionArgContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public timestampFunctionName(): TimestampFunctionNameContext {
        return this.getRuleContext(0, TimestampFunctionNameContext)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public simpleDateTimePart(): SimpleDateTimePartContext {
        return this.getRuleContext(0, SimpleDateTimePartContext)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public functionArg(): FunctionArgContext[];
    public functionArg(i: number): FunctionArgContext | null;
    public functionArg(i?: number): FunctionArgContext[] | FunctionArgContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FunctionArgContext);
        }

        return this.getRuleContext(i, FunctionArgContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_timestampFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitTimestampFunction) {
            return visitor.visitTimestampFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TimestampFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TIMESTAMPADD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIMESTAMPADD, 0);
    }
    public TIMESTAMPDIFF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIMESTAMPDIFF, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_timestampFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitTimestampFunctionName) {
            return visitor.visitTimestampFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GetFormatFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public GET_FORMAT(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.GET_FORMAT, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public getFormatType(): GetFormatTypeContext {
        return this.getRuleContext(0, GetFormatTypeContext)!;
    }
    public COMMA(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.COMMA, 0)!;
    }
    public functionArg(): FunctionArgContext {
        return this.getRuleContext(0, FunctionArgContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_getFormatFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitGetFormatFunction) {
            return visitor.visitGetFormatFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GetFormatTypeContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DATE, 0);
    }
    public DATETIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DATETIME, 0);
    }
    public TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIME, 0);
    }
    public TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIMESTAMP, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_getFormatType;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitGetFormatType) {
            return visitor.visitGetFormatType(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExtractFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EXTRACT(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.EXTRACT, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public datetimePart(): DatetimePartContext {
        return this.getRuleContext(0, DatetimePartContext)!;
    }
    public FROM(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.FROM, 0)!;
    }
    public functionArg(): FunctionArgContext {
        return this.getRuleContext(0, FunctionArgContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_extractFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitExtractFunction) {
            return visitor.visitExtractFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SimpleDateTimePartContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MICROSECOND, 0);
    }
    public SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SECOND, 0);
    }
    public MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINUTE, 0);
    }
    public HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HOUR, 0);
    }
    public DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY, 0);
    }
    public WEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.WEEK, 0);
    }
    public MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MONTH, 0);
    }
    public QUARTER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.QUARTER, 0);
    }
    public YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.YEAR, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_simpleDateTimePart;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSimpleDateTimePart) {
            return visitor.visitSimpleDateTimePart(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ComplexDateTimePartContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SECOND_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SECOND_MICROSECOND, 0);
    }
    public MINUTE_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINUTE_MICROSECOND, 0);
    }
    public MINUTE_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINUTE_SECOND, 0);
    }
    public HOUR_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HOUR_MICROSECOND, 0);
    }
    public HOUR_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HOUR_SECOND, 0);
    }
    public HOUR_MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HOUR_MINUTE, 0);
    }
    public DAY_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY_MICROSECOND, 0);
    }
    public DAY_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY_SECOND, 0);
    }
    public DAY_MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY_MINUTE, 0);
    }
    public DAY_HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY_HOUR, 0);
    }
    public YEAR_MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.YEAR_MONTH, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_complexDateTimePart;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitComplexDateTimePart) {
            return visitor.visitComplexDateTimePart(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DatetimePartContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public simpleDateTimePart(): SimpleDateTimePartContext | null {
        return this.getRuleContext(0, SimpleDateTimePartContext);
    }
    public complexDateTimePart(): ComplexDateTimePartContext | null {
        return this.getRuleContext(0, ComplexDateTimePartContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_datetimePart;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitDatetimePart) {
            return visitor.visitDatetimePart(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class HighlightFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public HIGHLIGHT(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.HIGHLIGHT, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public relevanceField(): RelevanceFieldContext {
        return this.getRuleContext(0, RelevanceFieldContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public highlightArg(): HighlightArgContext[];
    public highlightArg(i: number): HighlightArgContext | null;
    public highlightArg(i?: number): HighlightArgContext[] | HighlightArgContext | null {
        if (i === undefined) {
            return this.getRuleContexts(HighlightArgContext);
        }

        return this.getRuleContext(i, HighlightArgContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_highlightFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitHighlightFunction) {
            return visitor.visitHighlightFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BucketFunctionContext extends antlr.ParserRuleContext {
    public _field?: BucketArgValueContext;
    public _interval?: ConstantContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public bucketFunctionName(): BucketFunctionNameContext {
        return this.getRuleContext(0, BucketFunctionNameContext)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public FIELD(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.FIELD, 0)!;
    }
    public EQUAL_SYMBOL(): antlr.TerminalNode[];
    public EQUAL_SYMBOL(i: number): antlr.TerminalNode | null;
    public EQUAL_SYMBOL(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.EQUAL_SYMBOL);
    	} else {
    		return this.getToken(OpenSearchSQLParser.EQUAL_SYMBOL, i);
    	}
    }
    public COMMA(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.COMMA, 0)!;
    }
    public intervalArgName(): IntervalArgNameContext {
        return this.getRuleContext(0, IntervalArgNameContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public bucketArgValue(): BucketArgValueContext {
        return this.getRuleContext(0, BucketArgValueContext)!;
    }
    public constant(): ConstantContext {
        return this.getRuleContext(0, ConstantContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_bucketFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitBucketFunction) {
            return visitor.visitBucketFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class IntervalArgNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public INTERVAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.INTERVAL, 0);
    }
    public FIXED_INTERVAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FIXED_INTERVAL, 0);
    }
    public CALENDAR_INTERVAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CALENDAR_INTERVAL, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_intervalArgName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitIntervalArgName) {
            return visitor.visitIntervalArgName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PositionFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public POSITION(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.POSITION, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public functionArg(): FunctionArgContext[];
    public functionArg(i: number): FunctionArgContext | null;
    public functionArg(i?: number): FunctionArgContext[] | FunctionArgContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FunctionArgContext);
        }

        return this.getRuleContext(i, FunctionArgContext);
    }
    public IN(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.IN, 0)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_positionFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitPositionFunction) {
            return visitor.visitPositionFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class MatchQueryAltSyntaxFunctionContext extends antlr.ParserRuleContext {
    public _field?: RelevanceFieldContext;
    public _query?: RelevanceQueryContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQUAL_SYMBOL(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.EQUAL_SYMBOL, 0)!;
    }
    public MATCH_QUERY(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.MATCH_QUERY, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public relevanceField(): RelevanceFieldContext {
        return this.getRuleContext(0, RelevanceFieldContext)!;
    }
    public relevanceQuery(): RelevanceQueryContext {
        return this.getRuleContext(0, RelevanceQueryContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_matchQueryAltSyntaxFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitMatchQueryAltSyntaxFunction) {
            return visitor.visitMatchQueryAltSyntaxFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ScalarFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public mathematicalFunctionName(): MathematicalFunctionNameContext | null {
        return this.getRuleContext(0, MathematicalFunctionNameContext);
    }
    public dateTimeFunctionName(): DateTimeFunctionNameContext | null {
        return this.getRuleContext(0, DateTimeFunctionNameContext);
    }
    public textFunctionName(): TextFunctionNameContext | null {
        return this.getRuleContext(0, TextFunctionNameContext);
    }
    public flowControlFunctionName(): FlowControlFunctionNameContext | null {
        return this.getRuleContext(0, FlowControlFunctionNameContext);
    }
    public systemFunctionName(): SystemFunctionNameContext | null {
        return this.getRuleContext(0, SystemFunctionNameContext);
    }
    public nestedFunctionName(): NestedFunctionNameContext | null {
        return this.getRuleContext(0, NestedFunctionNameContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_scalarFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitScalarFunctionName) {
            return visitor.visitScalarFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BucketFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public HISTOGRAM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HISTOGRAM, 0);
    }
    public DATE_HISTOGRAM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DATE_HISTOGRAM, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_bucketFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitBucketFunctionName) {
            return visitor.visitBucketFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SpecificFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_specificFunction;
    }
    public override copyFrom(ctx: SpecificFunctionContext): void {
        super.copyFrom(ctx);
    }
}
export class CaseFunctionCallContext extends SpecificFunctionContext {
    public _elseArg?: FunctionArgContext;
    public constructor(ctx: SpecificFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public CASE(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.CASE, 0)!;
    }
    public expression(): ExpressionContext | null {
        return this.getRuleContext(0, ExpressionContext);
    }
    public END(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.END, 0)!;
    }
    public caseFuncAlternative(): CaseFuncAlternativeContext[];
    public caseFuncAlternative(i: number): CaseFuncAlternativeContext | null;
    public caseFuncAlternative(i?: number): CaseFuncAlternativeContext[] | CaseFuncAlternativeContext | null {
        if (i === undefined) {
            return this.getRuleContexts(CaseFuncAlternativeContext);
        }

        return this.getRuleContext(i, CaseFuncAlternativeContext);
    }
    public ELSE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ELSE, 0);
    }
    public functionArg(): FunctionArgContext | null {
        return this.getRuleContext(0, FunctionArgContext);
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitCaseFunctionCall) {
            return visitor.visitCaseFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class DataTypeFunctionCallContext extends SpecificFunctionContext {
    public constructor(ctx: SpecificFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public CAST(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.CAST, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public AS(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.AS, 0)!;
    }
    public convertedDataType(): ConvertedDataTypeContext {
        return this.getRuleContext(0, ConvertedDataTypeContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitDataTypeFunctionCall) {
            return visitor.visitDataTypeFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RelevanceFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public noFieldRelevanceFunction(): NoFieldRelevanceFunctionContext | null {
        return this.getRuleContext(0, NoFieldRelevanceFunctionContext);
    }
    public singleFieldRelevanceFunction(): SingleFieldRelevanceFunctionContext | null {
        return this.getRuleContext(0, SingleFieldRelevanceFunctionContext);
    }
    public multiFieldRelevanceFunction(): MultiFieldRelevanceFunctionContext | null {
        return this.getRuleContext(0, MultiFieldRelevanceFunctionContext);
    }
    public altSingleFieldRelevanceFunction(): AltSingleFieldRelevanceFunctionContext | null {
        return this.getRuleContext(0, AltSingleFieldRelevanceFunctionContext);
    }
    public altMultiFieldRelevanceFunction(): AltMultiFieldRelevanceFunctionContext | null {
        return this.getRuleContext(0, AltMultiFieldRelevanceFunctionContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_relevanceFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceFunction) {
            return visitor.visitRelevanceFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ScoreRelevanceFunctionContext extends antlr.ParserRuleContext {
    public _weight?: RelevanceFieldWeightContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public scoreRelevanceFunctionName(): ScoreRelevanceFunctionNameContext {
        return this.getRuleContext(0, ScoreRelevanceFunctionNameContext)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public relevanceFunction(): RelevanceFunctionContext {
        return this.getRuleContext(0, RelevanceFunctionContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public COMMA(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.COMMA, 0);
    }
    public relevanceFieldWeight(): RelevanceFieldWeightContext | null {
        return this.getRuleContext(0, RelevanceFieldWeightContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_scoreRelevanceFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitScoreRelevanceFunction) {
            return visitor.visitScoreRelevanceFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NoFieldRelevanceFunctionContext extends antlr.ParserRuleContext {
    public _query?: RelevanceQueryContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public noFieldRelevanceFunctionName(): NoFieldRelevanceFunctionNameContext {
        return this.getRuleContext(0, NoFieldRelevanceFunctionNameContext)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public relevanceQuery(): RelevanceQueryContext {
        return this.getRuleContext(0, RelevanceQueryContext)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public relevanceArg(): RelevanceArgContext[];
    public relevanceArg(i: number): RelevanceArgContext | null;
    public relevanceArg(i?: number): RelevanceArgContext[] | RelevanceArgContext | null {
        if (i === undefined) {
            return this.getRuleContexts(RelevanceArgContext);
        }

        return this.getRuleContext(i, RelevanceArgContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_noFieldRelevanceFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitNoFieldRelevanceFunction) {
            return visitor.visitNoFieldRelevanceFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SingleFieldRelevanceFunctionContext extends antlr.ParserRuleContext {
    public _field?: RelevanceFieldContext;
    public _query?: RelevanceQueryContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public singleFieldRelevanceFunctionName(): SingleFieldRelevanceFunctionNameContext {
        return this.getRuleContext(0, SingleFieldRelevanceFunctionNameContext)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public relevanceField(): RelevanceFieldContext {
        return this.getRuleContext(0, RelevanceFieldContext)!;
    }
    public relevanceQuery(): RelevanceQueryContext {
        return this.getRuleContext(0, RelevanceQueryContext)!;
    }
    public relevanceArg(): RelevanceArgContext[];
    public relevanceArg(i: number): RelevanceArgContext | null;
    public relevanceArg(i?: number): RelevanceArgContext[] | RelevanceArgContext | null {
        if (i === undefined) {
            return this.getRuleContexts(RelevanceArgContext);
        }

        return this.getRuleContext(i, RelevanceArgContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_singleFieldRelevanceFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSingleFieldRelevanceFunction) {
            return visitor.visitSingleFieldRelevanceFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class MultiFieldRelevanceFunctionContext extends antlr.ParserRuleContext {
    public _field?: RelevanceFieldAndWeightContext;
    public _query?: RelevanceQueryContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public multiFieldRelevanceFunctionName(): MultiFieldRelevanceFunctionNameContext {
        return this.getRuleContext(0, MultiFieldRelevanceFunctionNameContext)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public LT_SQR_PRTHS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LT_SQR_PRTHS, 0);
    }
    public RT_SQR_PRTHS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.RT_SQR_PRTHS, 0);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public relevanceFieldAndWeight(): RelevanceFieldAndWeightContext[];
    public relevanceFieldAndWeight(i: number): RelevanceFieldAndWeightContext | null;
    public relevanceFieldAndWeight(i?: number): RelevanceFieldAndWeightContext[] | RelevanceFieldAndWeightContext | null {
        if (i === undefined) {
            return this.getRuleContexts(RelevanceFieldAndWeightContext);
        }

        return this.getRuleContext(i, RelevanceFieldAndWeightContext);
    }
    public relevanceQuery(): RelevanceQueryContext | null {
        return this.getRuleContext(0, RelevanceQueryContext);
    }
    public relevanceArg(): RelevanceArgContext[];
    public relevanceArg(i: number): RelevanceArgContext | null;
    public relevanceArg(i?: number): RelevanceArgContext[] | RelevanceArgContext | null {
        if (i === undefined) {
            return this.getRuleContexts(RelevanceArgContext);
        }

        return this.getRuleContext(i, RelevanceArgContext);
    }
    public alternateMultiMatchQuery(): AlternateMultiMatchQueryContext | null {
        return this.getRuleContext(0, AlternateMultiMatchQueryContext);
    }
    public alternateMultiMatchField(): AlternateMultiMatchFieldContext | null {
        return this.getRuleContext(0, AlternateMultiMatchFieldContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_multiFieldRelevanceFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitMultiFieldRelevanceFunction) {
            return visitor.visitMultiFieldRelevanceFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AltSingleFieldRelevanceFunctionContext extends antlr.ParserRuleContext {
    public _field?: RelevanceFieldContext;
    public _altSyntaxFunctionName?: AltSingleFieldRelevanceFunctionNameContext;
    public _query?: RelevanceQueryContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQUAL_SYMBOL(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.EQUAL_SYMBOL, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public relevanceField(): RelevanceFieldContext {
        return this.getRuleContext(0, RelevanceFieldContext)!;
    }
    public altSingleFieldRelevanceFunctionName(): AltSingleFieldRelevanceFunctionNameContext {
        return this.getRuleContext(0, AltSingleFieldRelevanceFunctionNameContext)!;
    }
    public relevanceQuery(): RelevanceQueryContext {
        return this.getRuleContext(0, RelevanceQueryContext)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public relevanceArg(): RelevanceArgContext[];
    public relevanceArg(i: number): RelevanceArgContext | null;
    public relevanceArg(i?: number): RelevanceArgContext[] | RelevanceArgContext | null {
        if (i === undefined) {
            return this.getRuleContexts(RelevanceArgContext);
        }

        return this.getRuleContext(i, RelevanceArgContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_altSingleFieldRelevanceFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAltSingleFieldRelevanceFunction) {
            return visitor.visitAltSingleFieldRelevanceFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AltMultiFieldRelevanceFunctionContext extends antlr.ParserRuleContext {
    public _field?: RelevanceFieldContext;
    public _altSyntaxFunctionName?: AltMultiFieldRelevanceFunctionNameContext;
    public _query?: RelevanceQueryContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQUAL_SYMBOL(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.EQUAL_SYMBOL, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public relevanceField(): RelevanceFieldContext {
        return this.getRuleContext(0, RelevanceFieldContext)!;
    }
    public altMultiFieldRelevanceFunctionName(): AltMultiFieldRelevanceFunctionNameContext {
        return this.getRuleContext(0, AltMultiFieldRelevanceFunctionNameContext)!;
    }
    public relevanceQuery(): RelevanceQueryContext {
        return this.getRuleContext(0, RelevanceQueryContext)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public relevanceArg(): RelevanceArgContext[];
    public relevanceArg(i: number): RelevanceArgContext | null;
    public relevanceArg(i?: number): RelevanceArgContext[] | RelevanceArgContext | null {
        if (i === undefined) {
            return this.getRuleContexts(RelevanceArgContext);
        }

        return this.getRuleContext(i, RelevanceArgContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_altMultiFieldRelevanceFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAltMultiFieldRelevanceFunction) {
            return visitor.visitAltMultiFieldRelevanceFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ConvertedDataTypeContext extends antlr.ParserRuleContext {
    public _typeName?: Token | null;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DATE, 0);
    }
    public TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIME, 0);
    }
    public TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIMESTAMP, 0);
    }
    public INT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.INT, 0);
    }
    public INTEGER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.INTEGER, 0);
    }
    public DOUBLE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DOUBLE, 0);
    }
    public LONG(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LONG, 0);
    }
    public FLOAT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FLOAT, 0);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.STRING, 0);
    }
    public BOOLEAN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.BOOLEAN, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_convertedDataType;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitConvertedDataType) {
            return visitor.visitConvertedDataType(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class CaseFuncAlternativeContext extends antlr.ParserRuleContext {
    public _condition?: FunctionArgContext;
    public _consequent?: FunctionArgContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public WHEN(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.WHEN, 0)!;
    }
    public THEN(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.THEN, 0)!;
    }
    public functionArg(): FunctionArgContext[];
    public functionArg(i: number): FunctionArgContext | null;
    public functionArg(i?: number): FunctionArgContext[] | FunctionArgContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FunctionArgContext);
        }

        return this.getRuleContext(i, FunctionArgContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_caseFuncAlternative;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitCaseFuncAlternative) {
            return visitor.visitCaseFuncAlternative(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AggregateFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_aggregateFunction;
    }
    public override copyFrom(ctx: AggregateFunctionContext): void {
        super.copyFrom(ctx);
    }
}
export class DistinctCountFunctionCallContext extends AggregateFunctionContext {
    public constructor(ctx: AggregateFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public COUNT(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.COUNT, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public DISTINCT(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.DISTINCT, 0)!;
    }
    public functionArg(): FunctionArgContext {
        return this.getRuleContext(0, FunctionArgContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitDistinctCountFunctionCall) {
            return visitor.visitDistinctCountFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class PercentileApproxFunctionCallContext extends AggregateFunctionContext {
    public constructor(ctx: AggregateFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public percentileApproxFunction(): PercentileApproxFunctionContext {
        return this.getRuleContext(0, PercentileApproxFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitPercentileApproxFunctionCall) {
            return visitor.visitPercentileApproxFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class CountStarFunctionCallContext extends AggregateFunctionContext {
    public constructor(ctx: AggregateFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public COUNT(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.COUNT, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public STAR(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.STAR, 0)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitCountStarFunctionCall) {
            return visitor.visitCountStarFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class RegularAggregateFunctionCallContext extends AggregateFunctionContext {
    public _functionName?: AggregationFunctionNameContext;
    public constructor(ctx: AggregateFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public functionArg(): FunctionArgContext {
        return this.getRuleContext(0, FunctionArgContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public aggregationFunctionName(): AggregationFunctionNameContext {
        return this.getRuleContext(0, AggregationFunctionNameContext)!;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRegularAggregateFunctionCall) {
            return visitor.visitRegularAggregateFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PercentileApproxFunctionContext extends antlr.ParserRuleContext {
    public _aggField?: FunctionArgContext;
    public _percent?: NumericLiteralContext;
    public _compression?: NumericLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public PERCENTILE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.PERCENTILE, 0);
    }
    public PERCENTILE_APPROX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.PERCENTILE_APPROX, 0);
    }
    public functionArg(): FunctionArgContext {
        return this.getRuleContext(0, FunctionArgContext)!;
    }
    public numericLiteral(): NumericLiteralContext[];
    public numericLiteral(i: number): NumericLiteralContext | null;
    public numericLiteral(i?: number): NumericLiteralContext[] | NumericLiteralContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NumericLiteralContext);
        }

        return this.getRuleContext(i, NumericLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_percentileApproxFunction;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitPercentileApproxFunction) {
            return visitor.visitPercentileApproxFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FilterClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FILTER(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.FILTER, 0)!;
    }
    public LR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.LR_BRACKET, 0)!;
    }
    public WHERE(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.WHERE, 0)!;
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public RR_BRACKET(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.RR_BRACKET, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_filterClause;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitFilterClause) {
            return visitor.visitFilterClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AggregationFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public AVG(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.AVG, 0);
    }
    public COUNT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.COUNT, 0);
    }
    public SUM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SUM, 0);
    }
    public MIN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MIN, 0);
    }
    public MAX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MAX, 0);
    }
    public VAR_POP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.VAR_POP, 0);
    }
    public VAR_SAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.VAR_SAMP, 0);
    }
    public VARIANCE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.VARIANCE, 0);
    }
    public STD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.STD, 0);
    }
    public STDDEV(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.STDDEV, 0);
    }
    public STDDEV_POP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.STDDEV_POP, 0);
    }
    public STDDEV_SAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.STDDEV_SAMP, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_aggregationFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAggregationFunctionName) {
            return visitor.visitAggregationFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class MathematicalFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ABS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ABS, 0);
    }
    public CBRT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CBRT, 0);
    }
    public CEIL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CEIL, 0);
    }
    public CEILING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CEILING, 0);
    }
    public CONV(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CONV, 0);
    }
    public CRC32(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CRC32, 0);
    }
    public E(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.E, 0);
    }
    public EXP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.EXP, 0);
    }
    public EXPM1(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.EXPM1, 0);
    }
    public FLOOR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FLOOR, 0);
    }
    public LN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LN, 0);
    }
    public LOG(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LOG, 0);
    }
    public LOG10(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LOG10, 0);
    }
    public LOG2(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LOG2, 0);
    }
    public MOD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MOD, 0);
    }
    public PI(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.PI, 0);
    }
    public POW(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.POW, 0);
    }
    public POWER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.POWER, 0);
    }
    public RAND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.RAND, 0);
    }
    public RINT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.RINT, 0);
    }
    public ROUND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ROUND, 0);
    }
    public SIGN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SIGN, 0);
    }
    public SIGNUM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SIGNUM, 0);
    }
    public SQRT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SQRT, 0);
    }
    public TRUNCATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TRUNCATE, 0);
    }
    public trigonometricFunctionName(): TrigonometricFunctionNameContext | null {
        return this.getRuleContext(0, TrigonometricFunctionNameContext);
    }
    public arithmeticFunctionName(): ArithmeticFunctionNameContext | null {
        return this.getRuleContext(0, ArithmeticFunctionNameContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_mathematicalFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitMathematicalFunctionName) {
            return visitor.visitMathematicalFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TrigonometricFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ACOS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ACOS, 0);
    }
    public ASIN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ASIN, 0);
    }
    public ATAN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ATAN, 0);
    }
    public ATAN2(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ATAN2, 0);
    }
    public COS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.COS, 0);
    }
    public COSH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.COSH, 0);
    }
    public COT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.COT, 0);
    }
    public DEGREES(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DEGREES, 0);
    }
    public RADIANS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.RADIANS, 0);
    }
    public SIN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SIN, 0);
    }
    public SINH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SINH, 0);
    }
    public TAN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TAN, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_trigonometricFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitTrigonometricFunctionName) {
            return visitor.visitTrigonometricFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ArithmeticFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ADD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ADD, 0);
    }
    public SUBTRACT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SUBTRACT, 0);
    }
    public MULTIPLY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MULTIPLY, 0);
    }
    public DIVIDE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DIVIDE, 0);
    }
    public MOD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MOD, 0);
    }
    public MODULUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MODULUS, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_arithmeticFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitArithmeticFunctionName) {
            return visitor.visitArithmeticFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DateTimeFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public datetimeConstantLiteral(): DatetimeConstantLiteralContext | null {
        return this.getRuleContext(0, DatetimeConstantLiteralContext);
    }
    public ADDDATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ADDDATE, 0);
    }
    public ADDTIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ADDTIME, 0);
    }
    public CONVERT_TZ(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CONVERT_TZ, 0);
    }
    public CURDATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CURDATE, 0);
    }
    public CURTIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CURTIME, 0);
    }
    public DATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DATE, 0);
    }
    public DATE_ADD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DATE_ADD, 0);
    }
    public DATE_FORMAT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DATE_FORMAT, 0);
    }
    public DATE_SUB(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DATE_SUB, 0);
    }
    public DATEDIFF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DATEDIFF, 0);
    }
    public DATETIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DATETIME, 0);
    }
    public DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY, 0);
    }
    public DAYNAME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAYNAME, 0);
    }
    public DAYOFMONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAYOFMONTH, 0);
    }
    public DAY_OF_MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY_OF_MONTH, 0);
    }
    public DAYOFWEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAYOFWEEK, 0);
    }
    public DAYOFYEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAYOFYEAR, 0);
    }
    public DAY_OF_YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY_OF_YEAR, 0);
    }
    public DAY_OF_WEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DAY_OF_WEEK, 0);
    }
    public FROM_DAYS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FROM_DAYS, 0);
    }
    public FROM_UNIXTIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FROM_UNIXTIME, 0);
    }
    public HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HOUR, 0);
    }
    public HOUR_OF_DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HOUR_OF_DAY, 0);
    }
    public LAST_DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LAST_DAY, 0);
    }
    public MAKEDATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MAKEDATE, 0);
    }
    public MAKETIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MAKETIME, 0);
    }
    public MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MICROSECOND, 0);
    }
    public MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINUTE, 0);
    }
    public MINUTE_OF_DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINUTE_OF_DAY, 0);
    }
    public MINUTE_OF_HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINUTE_OF_HOUR, 0);
    }
    public MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MONTH, 0);
    }
    public MONTHNAME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MONTHNAME, 0);
    }
    public MONTH_OF_YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MONTH_OF_YEAR, 0);
    }
    public NOW(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.NOW, 0);
    }
    public PERIOD_ADD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.PERIOD_ADD, 0);
    }
    public PERIOD_DIFF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.PERIOD_DIFF, 0);
    }
    public QUARTER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.QUARTER, 0);
    }
    public SEC_TO_TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SEC_TO_TIME, 0);
    }
    public SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SECOND, 0);
    }
    public SECOND_OF_MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SECOND_OF_MINUTE, 0);
    }
    public SUBDATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SUBDATE, 0);
    }
    public SUBTIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SUBTIME, 0);
    }
    public SYSDATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SYSDATE, 0);
    }
    public STR_TO_DATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.STR_TO_DATE, 0);
    }
    public TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIME, 0);
    }
    public TIME_FORMAT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIME_FORMAT, 0);
    }
    public TIME_TO_SEC(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIME_TO_SEC, 0);
    }
    public TIMEDIFF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIMEDIFF, 0);
    }
    public TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIMESTAMP, 0);
    }
    public TO_DAYS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TO_DAYS, 0);
    }
    public TO_SECONDS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TO_SECONDS, 0);
    }
    public UNIX_TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.UNIX_TIMESTAMP, 0);
    }
    public WEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.WEEK, 0);
    }
    public WEEKDAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.WEEKDAY, 0);
    }
    public WEEK_OF_YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.WEEK_OF_YEAR, 0);
    }
    public WEEKOFYEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.WEEKOFYEAR, 0);
    }
    public YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.YEAR, 0);
    }
    public YEARWEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.YEARWEEK, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_dateTimeFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitDateTimeFunctionName) {
            return visitor.visitDateTimeFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TextFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SUBSTR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SUBSTR, 0);
    }
    public SUBSTRING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SUBSTRING, 0);
    }
    public TRIM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TRIM, 0);
    }
    public LTRIM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LTRIM, 0);
    }
    public RTRIM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.RTRIM, 0);
    }
    public LOWER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LOWER, 0);
    }
    public UPPER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.UPPER, 0);
    }
    public CONCAT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CONCAT, 0);
    }
    public CONCAT_WS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CONCAT_WS, 0);
    }
    public LENGTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LENGTH, 0);
    }
    public STRCMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.STRCMP, 0);
    }
    public RIGHT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.RIGHT, 0);
    }
    public LEFT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LEFT, 0);
    }
    public ASCII(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ASCII, 0);
    }
    public LOCATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LOCATE, 0);
    }
    public REPLACE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.REPLACE, 0);
    }
    public REVERSE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.REVERSE, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_textFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitTextFunctionName) {
            return visitor.visitTextFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FlowControlFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.IF, 0);
    }
    public IFNULL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.IFNULL, 0);
    }
    public NULLIF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.NULLIF, 0);
    }
    public ISNULL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ISNULL, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_flowControlFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitFlowControlFunctionName) {
            return visitor.visitFlowControlFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NoFieldRelevanceFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public QUERY(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.QUERY, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_noFieldRelevanceFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitNoFieldRelevanceFunctionName) {
            return visitor.visitNoFieldRelevanceFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SystemFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TYPEOF(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.TYPEOF, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_systemFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSystemFunctionName) {
            return visitor.visitSystemFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NestedFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NESTED(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.NESTED, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_nestedFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitNestedFunctionName) {
            return visitor.visitNestedFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ScoreRelevanceFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SCORE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SCORE, 0);
    }
    public SCOREQUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SCOREQUERY, 0);
    }
    public SCORE_QUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SCORE_QUERY, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_scoreRelevanceFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitScoreRelevanceFunctionName) {
            return visitor.visitScoreRelevanceFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SingleFieldRelevanceFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MATCH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCH, 0);
    }
    public MATCHQUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCHQUERY, 0);
    }
    public MATCH_QUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCH_QUERY, 0);
    }
    public MATCH_PHRASE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCH_PHRASE, 0);
    }
    public MATCHPHRASE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCHPHRASE, 0);
    }
    public MATCHPHRASEQUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCHPHRASEQUERY, 0);
    }
    public MATCH_BOOL_PREFIX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCH_BOOL_PREFIX, 0);
    }
    public MATCH_PHRASE_PREFIX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCH_PHRASE_PREFIX, 0);
    }
    public WILDCARD_QUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.WILDCARD_QUERY, 0);
    }
    public WILDCARDQUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.WILDCARDQUERY, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_singleFieldRelevanceFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitSingleFieldRelevanceFunctionName) {
            return visitor.visitSingleFieldRelevanceFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class MultiFieldRelevanceFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MULTI_MATCH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MULTI_MATCH, 0);
    }
    public MULTIMATCH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MULTIMATCH, 0);
    }
    public MULTIMATCHQUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MULTIMATCHQUERY, 0);
    }
    public SIMPLE_QUERY_STRING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SIMPLE_QUERY_STRING, 0);
    }
    public QUERY_STRING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.QUERY_STRING, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_multiFieldRelevanceFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitMultiFieldRelevanceFunctionName) {
            return visitor.visitMultiFieldRelevanceFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AltSingleFieldRelevanceFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MATCH_QUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCH_QUERY, 0);
    }
    public MATCHQUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCHQUERY, 0);
    }
    public MATCH_PHRASE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCH_PHRASE, 0);
    }
    public MATCHPHRASE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MATCHPHRASE, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_altSingleFieldRelevanceFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAltSingleFieldRelevanceFunctionName) {
            return visitor.visitAltSingleFieldRelevanceFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AltMultiFieldRelevanceFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MULTI_MATCH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MULTI_MATCH, 0);
    }
    public MULTIMATCH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MULTIMATCH, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_altMultiFieldRelevanceFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAltMultiFieldRelevanceFunctionName) {
            return visitor.visitAltMultiFieldRelevanceFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FunctionArgsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public functionArg(): FunctionArgContext[];
    public functionArg(i: number): FunctionArgContext | null;
    public functionArg(i?: number): FunctionArgContext[] | FunctionArgContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FunctionArgContext);
        }

        return this.getRuleContext(i, FunctionArgContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchSQLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_functionArgs;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitFunctionArgs) {
            return visitor.visitFunctionArgs(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FunctionArgContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_functionArg;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitFunctionArg) {
            return visitor.visitFunctionArg(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RelevanceArgContext extends antlr.ParserRuleContext {
    public _argName?: StringLiteralContext;
    public _argVal?: RelevanceArgValueContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public relevanceArgName(): RelevanceArgNameContext | null {
        return this.getRuleContext(0, RelevanceArgNameContext);
    }
    public EQUAL_SYMBOL(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.EQUAL_SYMBOL, 0)!;
    }
    public relevanceArgValue(): RelevanceArgValueContext {
        return this.getRuleContext(0, RelevanceArgValueContext)!;
    }
    public stringLiteral(): StringLiteralContext | null {
        return this.getRuleContext(0, StringLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_relevanceArg;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceArg) {
            return visitor.visitRelevanceArg(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class HighlightArgContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public highlightArgName(): HighlightArgNameContext {
        return this.getRuleContext(0, HighlightArgNameContext)!;
    }
    public EQUAL_SYMBOL(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.EQUAL_SYMBOL, 0)!;
    }
    public highlightArgValue(): HighlightArgValueContext {
        return this.getRuleContext(0, HighlightArgValueContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_highlightArg;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitHighlightArg) {
            return visitor.visitHighlightArg(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RelevanceArgNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ALLOW_LEADING_WILDCARD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ALLOW_LEADING_WILDCARD, 0);
    }
    public ANALYZER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ANALYZER, 0);
    }
    public ANALYZE_WILDCARD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ANALYZE_WILDCARD, 0);
    }
    public AUTO_GENERATE_SYNONYMS_PHRASE_QUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.AUTO_GENERATE_SYNONYMS_PHRASE_QUERY, 0);
    }
    public BOOST(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.BOOST, 0);
    }
    public CASE_INSENSITIVE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CASE_INSENSITIVE, 0);
    }
    public CUTOFF_FREQUENCY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CUTOFF_FREQUENCY, 0);
    }
    public DEFAULT_FIELD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DEFAULT_FIELD, 0);
    }
    public DEFAULT_OPERATOR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DEFAULT_OPERATOR, 0);
    }
    public ENABLE_POSITION_INCREMENTS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ENABLE_POSITION_INCREMENTS, 0);
    }
    public ESCAPE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ESCAPE, 0);
    }
    public FIELDS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FIELDS, 0);
    }
    public FLAGS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FLAGS, 0);
    }
    public FUZZINESS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FUZZINESS, 0);
    }
    public FUZZY_MAX_EXPANSIONS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FUZZY_MAX_EXPANSIONS, 0);
    }
    public FUZZY_PREFIX_LENGTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FUZZY_PREFIX_LENGTH, 0);
    }
    public FUZZY_REWRITE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FUZZY_REWRITE, 0);
    }
    public FUZZY_TRANSPOSITIONS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FUZZY_TRANSPOSITIONS, 0);
    }
    public LENIENT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LENIENT, 0);
    }
    public LOW_FREQ_OPERATOR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LOW_FREQ_OPERATOR, 0);
    }
    public MAX_DETERMINIZED_STATES(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MAX_DETERMINIZED_STATES, 0);
    }
    public MAX_EXPANSIONS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MAX_EXPANSIONS, 0);
    }
    public MINIMUM_SHOULD_MATCH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MINIMUM_SHOULD_MATCH, 0);
    }
    public OPERATOR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.OPERATOR, 0);
    }
    public PHRASE_SLOP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.PHRASE_SLOP, 0);
    }
    public PREFIX_LENGTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.PREFIX_LENGTH, 0);
    }
    public QUOTE_ANALYZER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.QUOTE_ANALYZER, 0);
    }
    public QUOTE_FIELD_SUFFIX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.QUOTE_FIELD_SUFFIX, 0);
    }
    public REWRITE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.REWRITE, 0);
    }
    public SLOP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SLOP, 0);
    }
    public TIE_BREAKER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIE_BREAKER, 0);
    }
    public TIME_ZONE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TIME_ZONE, 0);
    }
    public TYPE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TYPE, 0);
    }
    public ZERO_TERMS_QUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ZERO_TERMS_QUERY, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_relevanceArgName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceArgName) {
            return visitor.visitRelevanceArgName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class HighlightArgNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public HIGHLIGHT_POST_TAGS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HIGHLIGHT_POST_TAGS, 0);
    }
    public HIGHLIGHT_PRE_TAGS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.HIGHLIGHT_PRE_TAGS, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_highlightArgName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitHighlightArgName) {
            return visitor.visitHighlightArgName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RelevanceFieldAndWeightContext extends antlr.ParserRuleContext {
    public _field?: RelevanceFieldContext;
    public _weight?: RelevanceFieldWeightContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public relevanceField(): RelevanceFieldContext {
        return this.getRuleContext(0, RelevanceFieldContext)!;
    }
    public relevanceFieldWeight(): RelevanceFieldWeightContext | null {
        return this.getRuleContext(0, RelevanceFieldWeightContext);
    }
    public BIT_XOR_OP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.BIT_XOR_OP, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_relevanceFieldAndWeight;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceFieldAndWeight) {
            return visitor.visitRelevanceFieldAndWeight(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RelevanceFieldWeightContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public numericLiteral(): NumericLiteralContext {
        return this.getRuleContext(0, NumericLiteralContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_relevanceFieldWeight;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceFieldWeight) {
            return visitor.visitRelevanceFieldWeight(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RelevanceFieldContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public stringLiteral(): StringLiteralContext | null {
        return this.getRuleContext(0, StringLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_relevanceField;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceField) {
            return visitor.visitRelevanceField(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RelevanceQueryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public relevanceArgValue(): RelevanceArgValueContext {
        return this.getRuleContext(0, RelevanceArgValueContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_relevanceQuery;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceQuery) {
            return visitor.visitRelevanceQuery(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RelevanceArgValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public constant(): ConstantContext | null {
        return this.getRuleContext(0, ConstantContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_relevanceArgValue;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceArgValue) {
            return visitor.visitRelevanceArgValue(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class HighlightArgValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public stringLiteral(): StringLiteralContext {
        return this.getRuleContext(0, StringLiteralContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_highlightArgValue;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitHighlightArgValue) {
            return visitor.visitHighlightArgValue(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BucketArgValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public constant(): ConstantContext | null {
        return this.getRuleContext(0, ConstantContext);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_bucketArgValue;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitBucketArgValue) {
            return visitor.visitBucketArgValue(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AlternateMultiMatchArgNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FIELDS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FIELDS, 0);
    }
    public QUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.QUERY, 0);
    }
    public stringLiteral(): StringLiteralContext | null {
        return this.getRuleContext(0, StringLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_alternateMultiMatchArgName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAlternateMultiMatchArgName) {
            return visitor.visitAlternateMultiMatchArgName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AlternateMultiMatchQueryContext extends antlr.ParserRuleContext {
    public _argName?: AlternateMultiMatchArgNameContext;
    public _argVal?: RelevanceArgValueContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQUAL_SYMBOL(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.EQUAL_SYMBOL, 0)!;
    }
    public alternateMultiMatchArgName(): AlternateMultiMatchArgNameContext {
        return this.getRuleContext(0, AlternateMultiMatchArgNameContext)!;
    }
    public relevanceArgValue(): RelevanceArgValueContext {
        return this.getRuleContext(0, RelevanceArgValueContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_alternateMultiMatchQuery;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAlternateMultiMatchQuery) {
            return visitor.visitAlternateMultiMatchQuery(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AlternateMultiMatchFieldContext extends antlr.ParserRuleContext {
    public _argName?: AlternateMultiMatchArgNameContext;
    public _argVal?: RelevanceArgValueContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQUAL_SYMBOL(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.EQUAL_SYMBOL, 0)!;
    }
    public alternateMultiMatchArgName(): AlternateMultiMatchArgNameContext {
        return this.getRuleContext(0, AlternateMultiMatchArgNameContext)!;
    }
    public relevanceArgValue(): RelevanceArgValueContext {
        return this.getRuleContext(0, RelevanceArgValueContext)!;
    }
    public LT_SQR_PRTHS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LT_SQR_PRTHS, 0);
    }
    public RT_SQR_PRTHS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.RT_SQR_PRTHS, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_alternateMultiMatchField;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAlternateMultiMatchField) {
            return visitor.visitAlternateMultiMatchField(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TableNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_tableName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitTableName) {
            return visitor.visitTableName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ColumnNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_columnName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitColumnName) {
            return visitor.visitColumnName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AllTupleFieldsContext extends antlr.ParserRuleContext {
    public _path?: QualifiedNameContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DOT(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.DOT, 0)!;
    }
    public STAR(): antlr.TerminalNode {
        return this.getToken(OpenSearchSQLParser.STAR, 0)!;
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_allTupleFields;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAllTupleFields) {
            return visitor.visitAllTupleFields(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AliasContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ident(): IdentContext {
        return this.getRuleContext(0, IdentContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_alias;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitAlias) {
            return visitor.visitAlias(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class QualifiedNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ident(): IdentContext[];
    public ident(i: number): IdentContext | null;
    public ident(i?: number): IdentContext[] | IdentContext | null {
        if (i === undefined) {
            return this.getRuleContexts(IdentContext);
        }

        return this.getRuleContext(i, IdentContext);
    }
    public DOT(): antlr.TerminalNode[];
    public DOT(i: number): antlr.TerminalNode | null;
    public DOT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchSQLParser.DOT);
    	} else {
    		return this.getToken(OpenSearchSQLParser.DOT, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_qualifiedName;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitQualifiedName) {
            return visitor.visitQualifiedName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class IdentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ID(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.ID, 0);
    }
    public DOT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.DOT, 0);
    }
    public BACKTICK_QUOTE_ID(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.BACKTICK_QUOTE_ID, 0);
    }
    public keywordsCanBeId(): KeywordsCanBeIdContext | null {
        return this.getRuleContext(0, KeywordsCanBeIdContext);
    }
    public scalarFunctionName(): ScalarFunctionNameContext | null {
        return this.getRuleContext(0, ScalarFunctionNameContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_ident;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitIdent) {
            return visitor.visitIdent(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class KeywordsCanBeIdContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FULL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FULL, 0);
    }
    public FIELD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FIELD, 0);
    }
    public FIXED_INTERVAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FIXED_INTERVAL, 0);
    }
    public CALENDAR_INTERVAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.CALENDAR_INTERVAL, 0);
    }
    public D(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.D, 0);
    }
    public T(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.T, 0);
    }
    public TS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TS, 0);
    }
    public COUNT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.COUNT, 0);
    }
    public SUM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.SUM, 0);
    }
    public AVG(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.AVG, 0);
    }
    public MAX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MAX, 0);
    }
    public MIN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.MIN, 0);
    }
    public FIRST(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.FIRST, 0);
    }
    public LAST(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.LAST, 0);
    }
    public TYPE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchSQLParser.TYPE, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchSQLParser.RULE_keywordsCanBeId;
    }
    public override accept<Result>(visitor: OpenSearchSQLParserVisitor<Result>): Result | null {
        if (visitor.visitKeywordsCanBeId) {
            return visitor.visitKeywordsCanBeId(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
