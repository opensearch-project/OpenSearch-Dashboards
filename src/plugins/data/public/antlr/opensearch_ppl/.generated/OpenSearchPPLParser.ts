// Generated from ./src/plugins/data/public/antlr/opensearch_ppl/grammar/OpenSearchPPLParser.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { OpenSearchPPLParserVisitor } from "./OpenSearchPPLParserVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class OpenSearchPPLParser extends antlr.Parser {
    public static readonly SPACE = 1;
    public static readonly SEARCH = 2;
    public static readonly DESCRIBE = 3;
    public static readonly SHOW = 4;
    public static readonly FROM = 5;
    public static readonly WHERE = 6;
    public static readonly FIELDS = 7;
    public static readonly RENAME = 8;
    public static readonly STATS = 9;
    public static readonly DEDUP = 10;
    public static readonly SORT = 11;
    public static readonly EVAL = 12;
    public static readonly HEAD = 13;
    public static readonly TOP = 14;
    public static readonly RARE = 15;
    public static readonly PARSE = 16;
    public static readonly METHOD = 17;
    public static readonly REGEX = 18;
    public static readonly PUNCT = 19;
    public static readonly GROK = 20;
    public static readonly PATTERN = 21;
    public static readonly PATTERNS = 22;
    public static readonly NEW_FIELD = 23;
    public static readonly KMEANS = 24;
    public static readonly AD = 25;
    public static readonly ML = 26;
    public static readonly AS = 27;
    public static readonly BY = 28;
    public static readonly SOURCE = 29;
    public static readonly INDEX = 30;
    public static readonly D = 31;
    public static readonly DESC = 32;
    public static readonly DATASOURCES = 33;
    public static readonly SORTBY = 34;
    public static readonly AUTO = 35;
    public static readonly STR = 36;
    public static readonly IP = 37;
    public static readonly NUM = 38;
    public static readonly KEEPEMPTY = 39;
    public static readonly CONSECUTIVE = 40;
    public static readonly DEDUP_SPLITVALUES = 41;
    public static readonly PARTITIONS = 42;
    public static readonly ALLNUM = 43;
    public static readonly DELIM = 44;
    public static readonly CENTROIDS = 45;
    public static readonly ITERATIONS = 46;
    public static readonly DISTANCE_TYPE = 47;
    public static readonly NUMBER_OF_TREES = 48;
    public static readonly SHINGLE_SIZE = 49;
    public static readonly SAMPLE_SIZE = 50;
    public static readonly OUTPUT_AFTER = 51;
    public static readonly TIME_DECAY = 52;
    public static readonly ANOMALY_RATE = 53;
    public static readonly CATEGORY_FIELD = 54;
    public static readonly TIME_FIELD = 55;
    public static readonly TIME_ZONE = 56;
    public static readonly TRAINING_DATA_SIZE = 57;
    public static readonly ANOMALY_SCORE_THRESHOLD = 58;
    public static readonly CASE = 59;
    public static readonly IN = 60;
    public static readonly NOT = 61;
    public static readonly OR = 62;
    public static readonly AND = 63;
    public static readonly XOR = 64;
    public static readonly TRUE = 65;
    public static readonly FALSE = 66;
    public static readonly REGEXP = 67;
    public static readonly CONVERT_TZ = 68;
    public static readonly DATETIME = 69;
    public static readonly DAY = 70;
    public static readonly DAY_HOUR = 71;
    public static readonly DAY_MICROSECOND = 72;
    public static readonly DAY_MINUTE = 73;
    public static readonly DAY_OF_YEAR = 74;
    public static readonly DAY_SECOND = 75;
    public static readonly HOUR = 76;
    public static readonly HOUR_MICROSECOND = 77;
    public static readonly HOUR_MINUTE = 78;
    public static readonly HOUR_OF_DAY = 79;
    public static readonly HOUR_SECOND = 80;
    public static readonly INTERVAL = 81;
    public static readonly MICROSECOND = 82;
    public static readonly MILLISECOND = 83;
    public static readonly MINUTE = 84;
    public static readonly MINUTE_MICROSECOND = 85;
    public static readonly MINUTE_OF_DAY = 86;
    public static readonly MINUTE_OF_HOUR = 87;
    public static readonly MINUTE_SECOND = 88;
    public static readonly MONTH = 89;
    public static readonly MONTH_OF_YEAR = 90;
    public static readonly QUARTER = 91;
    public static readonly SECOND = 92;
    public static readonly SECOND_MICROSECOND = 93;
    public static readonly SECOND_OF_MINUTE = 94;
    public static readonly WEEK = 95;
    public static readonly WEEK_OF_YEAR = 96;
    public static readonly YEAR = 97;
    public static readonly YEAR_MONTH = 98;
    public static readonly DATAMODEL = 99;
    public static readonly LOOKUP = 100;
    public static readonly SAVEDSEARCH = 101;
    public static readonly INT = 102;
    public static readonly INTEGER = 103;
    public static readonly DOUBLE = 104;
    public static readonly LONG = 105;
    public static readonly FLOAT = 106;
    public static readonly STRING = 107;
    public static readonly BOOLEAN = 108;
    public static readonly PIPE = 109;
    public static readonly COMMA = 110;
    public static readonly DOT = 111;
    public static readonly EQUAL = 112;
    public static readonly GREATER = 113;
    public static readonly LESS = 114;
    public static readonly NOT_GREATER = 115;
    public static readonly NOT_LESS = 116;
    public static readonly NOT_EQUAL = 117;
    public static readonly PLUS = 118;
    public static readonly MINUS = 119;
    public static readonly STAR = 120;
    public static readonly DIVIDE = 121;
    public static readonly MODULE = 122;
    public static readonly EXCLAMATION_SYMBOL = 123;
    public static readonly COLON = 124;
    public static readonly LT_PRTHS = 125;
    public static readonly RT_PRTHS = 126;
    public static readonly LT_SQR_PRTHS = 127;
    public static readonly RT_SQR_PRTHS = 128;
    public static readonly SINGLE_QUOTE = 129;
    public static readonly DOUBLE_QUOTE = 130;
    public static readonly BACKTICK = 131;
    public static readonly BIT_NOT_OP = 132;
    public static readonly BIT_AND_OP = 133;
    public static readonly BIT_XOR_OP = 134;
    public static readonly AVG = 135;
    public static readonly COUNT = 136;
    public static readonly DISTINCT_COUNT = 137;
    public static readonly ESTDC = 138;
    public static readonly ESTDC_ERROR = 139;
    public static readonly MAX = 140;
    public static readonly MEAN = 141;
    public static readonly MEDIAN = 142;
    public static readonly MIN = 143;
    public static readonly MODE = 144;
    public static readonly RANGE = 145;
    public static readonly STDEV = 146;
    public static readonly STDEVP = 147;
    public static readonly SUM = 148;
    public static readonly SUMSQ = 149;
    public static readonly VAR_SAMP = 150;
    public static readonly VAR_POP = 151;
    public static readonly STDDEV_SAMP = 152;
    public static readonly STDDEV_POP = 153;
    public static readonly PERCENTILE = 154;
    public static readonly TAKE = 155;
    public static readonly FIRST = 156;
    public static readonly LAST = 157;
    public static readonly LIST = 158;
    public static readonly VALUES = 159;
    public static readonly EARLIEST = 160;
    public static readonly EARLIEST_TIME = 161;
    public static readonly LATEST = 162;
    public static readonly LATEST_TIME = 163;
    public static readonly PER_DAY = 164;
    public static readonly PER_HOUR = 165;
    public static readonly PER_MINUTE = 166;
    public static readonly PER_SECOND = 167;
    public static readonly RATE = 168;
    public static readonly SPARKLINE = 169;
    public static readonly C = 170;
    public static readonly DC = 171;
    public static readonly ABS = 172;
    public static readonly CBRT = 173;
    public static readonly CEIL = 174;
    public static readonly CEILING = 175;
    public static readonly CONV = 176;
    public static readonly CRC32 = 177;
    public static readonly E = 178;
    public static readonly EXP = 179;
    public static readonly FLOOR = 180;
    public static readonly LN = 181;
    public static readonly LOG = 182;
    public static readonly LOG10 = 183;
    public static readonly LOG2 = 184;
    public static readonly MOD = 185;
    public static readonly PI = 186;
    public static readonly POSITION = 187;
    public static readonly POW = 188;
    public static readonly POWER = 189;
    public static readonly RAND = 190;
    public static readonly ROUND = 191;
    public static readonly SIGN = 192;
    public static readonly SQRT = 193;
    public static readonly TRUNCATE = 194;
    public static readonly ACOS = 195;
    public static readonly ASIN = 196;
    public static readonly ATAN = 197;
    public static readonly ATAN2 = 198;
    public static readonly COS = 199;
    public static readonly COT = 200;
    public static readonly DEGREES = 201;
    public static readonly RADIANS = 202;
    public static readonly SIN = 203;
    public static readonly TAN = 204;
    public static readonly ADDDATE = 205;
    public static readonly ADDTIME = 206;
    public static readonly CURDATE = 207;
    public static readonly CURRENT_DATE = 208;
    public static readonly CURRENT_TIME = 209;
    public static readonly CURRENT_TIMESTAMP = 210;
    public static readonly CURTIME = 211;
    public static readonly DATE = 212;
    public static readonly DATEDIFF = 213;
    public static readonly DATE_ADD = 214;
    public static readonly DATE_FORMAT = 215;
    public static readonly DATE_SUB = 216;
    public static readonly DAYNAME = 217;
    public static readonly DAYOFMONTH = 218;
    public static readonly DAYOFWEEK = 219;
    public static readonly DAYOFYEAR = 220;
    public static readonly DAY_OF_MONTH = 221;
    public static readonly DAY_OF_WEEK = 222;
    public static readonly EXTRACT = 223;
    public static readonly FROM_DAYS = 224;
    public static readonly FROM_UNIXTIME = 225;
    public static readonly GET_FORMAT = 226;
    public static readonly LAST_DAY = 227;
    public static readonly LOCALTIME = 228;
    public static readonly LOCALTIMESTAMP = 229;
    public static readonly MAKEDATE = 230;
    public static readonly MAKETIME = 231;
    public static readonly MONTHNAME = 232;
    public static readonly NOW = 233;
    public static readonly PERIOD_ADD = 234;
    public static readonly PERIOD_DIFF = 235;
    public static readonly SEC_TO_TIME = 236;
    public static readonly STR_TO_DATE = 237;
    public static readonly SUBDATE = 238;
    public static readonly SUBTIME = 239;
    public static readonly SYSDATE = 240;
    public static readonly TIME = 241;
    public static readonly TIMEDIFF = 242;
    public static readonly TIMESTAMP = 243;
    public static readonly TIMESTAMPADD = 244;
    public static readonly TIMESTAMPDIFF = 245;
    public static readonly TIME_FORMAT = 246;
    public static readonly TIME_TO_SEC = 247;
    public static readonly TO_DAYS = 248;
    public static readonly TO_SECONDS = 249;
    public static readonly UNIX_TIMESTAMP = 250;
    public static readonly UTC_DATE = 251;
    public static readonly UTC_TIME = 252;
    public static readonly UTC_TIMESTAMP = 253;
    public static readonly WEEKDAY = 254;
    public static readonly YEARWEEK = 255;
    public static readonly SUBSTR = 256;
    public static readonly SUBSTRING = 257;
    public static readonly LTRIM = 258;
    public static readonly RTRIM = 259;
    public static readonly TRIM = 260;
    public static readonly TO = 261;
    public static readonly LOWER = 262;
    public static readonly UPPER = 263;
    public static readonly CONCAT = 264;
    public static readonly CONCAT_WS = 265;
    public static readonly LENGTH = 266;
    public static readonly STRCMP = 267;
    public static readonly RIGHT = 268;
    public static readonly LEFT = 269;
    public static readonly ASCII = 270;
    public static readonly LOCATE = 271;
    public static readonly REPLACE = 272;
    public static readonly REVERSE = 273;
    public static readonly CAST = 274;
    public static readonly LIKE = 275;
    public static readonly ISNULL = 276;
    public static readonly ISNOTNULL = 277;
    public static readonly IFNULL = 278;
    public static readonly NULLIF = 279;
    public static readonly IF = 280;
    public static readonly TYPEOF = 281;
    public static readonly MATCH = 282;
    public static readonly MATCH_PHRASE = 283;
    public static readonly MATCH_PHRASE_PREFIX = 284;
    public static readonly MATCH_BOOL_PREFIX = 285;
    public static readonly SIMPLE_QUERY_STRING = 286;
    public static readonly MULTI_MATCH = 287;
    public static readonly QUERY_STRING = 288;
    public static readonly ALLOW_LEADING_WILDCARD = 289;
    public static readonly ANALYZE_WILDCARD = 290;
    public static readonly ANALYZER = 291;
    public static readonly AUTO_GENERATE_SYNONYMS_PHRASE_QUERY = 292;
    public static readonly BOOST = 293;
    public static readonly CUTOFF_FREQUENCY = 294;
    public static readonly DEFAULT_FIELD = 295;
    public static readonly DEFAULT_OPERATOR = 296;
    public static readonly ENABLE_POSITION_INCREMENTS = 297;
    public static readonly ESCAPE = 298;
    public static readonly FLAGS = 299;
    public static readonly FUZZY_MAX_EXPANSIONS = 300;
    public static readonly FUZZY_PREFIX_LENGTH = 301;
    public static readonly FUZZY_TRANSPOSITIONS = 302;
    public static readonly FUZZY_REWRITE = 303;
    public static readonly FUZZINESS = 304;
    public static readonly LENIENT = 305;
    public static readonly LOW_FREQ_OPERATOR = 306;
    public static readonly MAX_DETERMINIZED_STATES = 307;
    public static readonly MAX_EXPANSIONS = 308;
    public static readonly MINIMUM_SHOULD_MATCH = 309;
    public static readonly OPERATOR = 310;
    public static readonly PHRASE_SLOP = 311;
    public static readonly PREFIX_LENGTH = 312;
    public static readonly QUOTE_ANALYZER = 313;
    public static readonly QUOTE_FIELD_SUFFIX = 314;
    public static readonly REWRITE = 315;
    public static readonly SLOP = 316;
    public static readonly TIE_BREAKER = 317;
    public static readonly TYPE = 318;
    public static readonly ZERO_TERMS_QUERY = 319;
    public static readonly SPAN = 320;
    public static readonly MS = 321;
    public static readonly S = 322;
    public static readonly M = 323;
    public static readonly H = 324;
    public static readonly W = 325;
    public static readonly Q = 326;
    public static readonly Y = 327;
    public static readonly ID = 328;
    public static readonly CLUSTER = 329;
    public static readonly INTEGER_LITERAL = 330;
    public static readonly DECIMAL_LITERAL = 331;
    public static readonly ID_DATE_SUFFIX = 332;
    public static readonly DQUOTA_STRING = 333;
    public static readonly SQUOTA_STRING = 334;
    public static readonly BQUOTA_STRING = 335;
    public static readonly ERROR_RECOGNITION = 336;
    public static readonly RULE_root = 0;
    public static readonly RULE_pplStatement = 1;
    public static readonly RULE_dmlStatement = 2;
    public static readonly RULE_queryStatement = 3;
    public static readonly RULE_pplCommands = 4;
    public static readonly RULE_commands = 5;
    public static readonly RULE_searchCommand = 6;
    public static readonly RULE_describeCommand = 7;
    public static readonly RULE_showDataSourcesCommand = 8;
    public static readonly RULE_whereCommand = 9;
    public static readonly RULE_fieldsCommand = 10;
    public static readonly RULE_renameCommand = 11;
    public static readonly RULE_statsCommand = 12;
    public static readonly RULE_dedupCommand = 13;
    public static readonly RULE_sortCommand = 14;
    public static readonly RULE_evalCommand = 15;
    public static readonly RULE_headCommand = 16;
    public static readonly RULE_topCommand = 17;
    public static readonly RULE_rareCommand = 18;
    public static readonly RULE_grokCommand = 19;
    public static readonly RULE_parseCommand = 20;
    public static readonly RULE_patternsCommand = 21;
    public static readonly RULE_patternsParameter = 22;
    public static readonly RULE_patternsMethod = 23;
    public static readonly RULE_kmeansCommand = 24;
    public static readonly RULE_kmeansParameter = 25;
    public static readonly RULE_adCommand = 26;
    public static readonly RULE_adParameter = 27;
    public static readonly RULE_mlCommand = 28;
    public static readonly RULE_mlArg = 29;
    public static readonly RULE_fromClause = 30;
    public static readonly RULE_tableSourceClause = 31;
    public static readonly RULE_renameClasue = 32;
    public static readonly RULE_byClause = 33;
    public static readonly RULE_statsByClause = 34;
    public static readonly RULE_bySpanClause = 35;
    public static readonly RULE_spanClause = 36;
    public static readonly RULE_sortbyClause = 37;
    public static readonly RULE_evalClause = 38;
    public static readonly RULE_statsAggTerm = 39;
    public static readonly RULE_statsFunction = 40;
    public static readonly RULE_statsFunctionName = 41;
    public static readonly RULE_takeAggFunction = 42;
    public static readonly RULE_percentileAggFunction = 43;
    public static readonly RULE_expression = 44;
    public static readonly RULE_logicalExpression = 45;
    public static readonly RULE_comparisonExpression = 46;
    public static readonly RULE_valueExpression = 47;
    public static readonly RULE_primaryExpression = 48;
    public static readonly RULE_positionFunction = 49;
    public static readonly RULE_booleanExpression = 50;
    public static readonly RULE_relevanceExpression = 51;
    public static readonly RULE_singleFieldRelevanceFunction = 52;
    public static readonly RULE_multiFieldRelevanceFunction = 53;
    public static readonly RULE_tableSource = 54;
    public static readonly RULE_tableFunction = 55;
    public static readonly RULE_fieldList = 56;
    public static readonly RULE_wcFieldList = 57;
    public static readonly RULE_sortField = 58;
    public static readonly RULE_sortFieldExpression = 59;
    public static readonly RULE_fieldExpression = 60;
    public static readonly RULE_wcFieldExpression = 61;
    public static readonly RULE_evalFunctionCall = 62;
    public static readonly RULE_dataTypeFunctionCall = 63;
    public static readonly RULE_booleanFunctionCall = 64;
    public static readonly RULE_convertedDataType = 65;
    public static readonly RULE_evalFunctionName = 66;
    public static readonly RULE_functionArgs = 67;
    public static readonly RULE_functionArg = 68;
    public static readonly RULE_relevanceArg = 69;
    public static readonly RULE_relevanceArgName = 70;
    public static readonly RULE_relevanceFieldAndWeight = 71;
    public static readonly RULE_relevanceFieldWeight = 72;
    public static readonly RULE_relevanceField = 73;
    public static readonly RULE_relevanceQuery = 74;
    public static readonly RULE_relevanceArgValue = 75;
    public static readonly RULE_mathematicalFunctionName = 76;
    public static readonly RULE_trigonometricFunctionName = 77;
    public static readonly RULE_dateTimeFunctionName = 78;
    public static readonly RULE_getFormatFunction = 79;
    public static readonly RULE_getFormatType = 80;
    public static readonly RULE_extractFunction = 81;
    public static readonly RULE_simpleDateTimePart = 82;
    public static readonly RULE_complexDateTimePart = 83;
    public static readonly RULE_datetimePart = 84;
    public static readonly RULE_timestampFunction = 85;
    public static readonly RULE_timestampFunctionName = 86;
    public static readonly RULE_conditionFunctionBase = 87;
    public static readonly RULE_systemFunctionName = 88;
    public static readonly RULE_textFunctionName = 89;
    public static readonly RULE_positionFunctionName = 90;
    public static readonly RULE_comparisonOperator = 91;
    public static readonly RULE_singleFieldRelevanceFunctionName = 92;
    public static readonly RULE_multiFieldRelevanceFunctionName = 93;
    public static readonly RULE_literalValue = 94;
    public static readonly RULE_intervalLiteral = 95;
    public static readonly RULE_stringLiteral = 96;
    public static readonly RULE_integerLiteral = 97;
    public static readonly RULE_decimalLiteral = 98;
    public static readonly RULE_booleanLiteral = 99;
    public static readonly RULE_datetimeLiteral = 100;
    public static readonly RULE_dateLiteral = 101;
    public static readonly RULE_timeLiteral = 102;
    public static readonly RULE_timestampLiteral = 103;
    public static readonly RULE_intervalUnit = 104;
    public static readonly RULE_timespanUnit = 105;
    public static readonly RULE_valueList = 106;
    public static readonly RULE_qualifiedName = 107;
    public static readonly RULE_tableQualifiedName = 108;
    public static readonly RULE_wcQualifiedName = 109;
    public static readonly RULE_ident = 110;
    public static readonly RULE_tableIdent = 111;
    public static readonly RULE_wildcard = 112;
    public static readonly RULE_keywordsCanBeId = 113;

    public static readonly literalNames = [
        null, null, "'SEARCH'", "'DESCRIBE'", "'SHOW'", "'FROM'", "'WHERE'", 
        "'FIELDS'", "'RENAME'", "'STATS'", "'DEDUP'", "'SORT'", "'EVAL'", 
        "'HEAD'", "'TOP'", "'RARE'", "'PARSE'", "'METHOD'", "'REGEX'", "'PUNCT'", 
        "'GROK'", "'PATTERN'", "'PATTERNS'", "'NEW_FIELD'", "'KMEANS'", 
        "'AD'", "'ML'", "'AS'", "'BY'", "'SOURCE'", "'INDEX'", "'D'", "'DESC'", 
        "'DATASOURCES'", "'SORTBY'", "'AUTO'", "'STR'", "'IP'", "'NUM'", 
        "'KEEPEMPTY'", "'CONSECUTIVE'", "'DEDUP_SPLITVALUES'", "'PARTITIONS'", 
        "'ALLNUM'", "'DELIM'", "'CENTROIDS'", "'ITERATIONS'", "'DISTANCE_TYPE'", 
        "'NUMBER_OF_TREES'", "'SHINGLE_SIZE'", "'SAMPLE_SIZE'", "'OUTPUT_AFTER'", 
        "'TIME_DECAY'", "'ANOMALY_RATE'", "'CATEGORY_FIELD'", "'TIME_FIELD'", 
        "'TIME_ZONE'", "'TRAINING_DATA_SIZE'", "'ANOMALY_SCORE_THRESHOLD'", 
        "'CASE'", "'IN'", "'NOT'", "'OR'", "'AND'", "'XOR'", "'TRUE'", "'FALSE'", 
        "'REGEXP'", "'CONVERT_TZ'", "'DATETIME'", "'DAY'", "'DAY_HOUR'", 
        "'DAY_MICROSECOND'", "'DAY_MINUTE'", "'DAY_OF_YEAR'", "'DAY_SECOND'", 
        "'HOUR'", "'HOUR_MICROSECOND'", "'HOUR_MINUTE'", "'HOUR_OF_DAY'", 
        "'HOUR_SECOND'", "'INTERVAL'", "'MICROSECOND'", "'MILLISECOND'", 
        "'MINUTE'", "'MINUTE_MICROSECOND'", "'MINUTE_OF_DAY'", "'MINUTE_OF_HOUR'", 
        "'MINUTE_SECOND'", "'MONTH'", "'MONTH_OF_YEAR'", "'QUARTER'", "'SECOND'", 
        "'SECOND_MICROSECOND'", "'SECOND_OF_MINUTE'", "'WEEK'", "'WEEK_OF_YEAR'", 
        "'YEAR'", "'YEAR_MONTH'", "'DATAMODEL'", "'LOOKUP'", "'SAVEDSEARCH'", 
        "'INT'", "'INTEGER'", "'DOUBLE'", "'LONG'", "'FLOAT'", "'STRING'", 
        "'BOOLEAN'", "'|'", "','", "'.'", "'='", "'>'", "'<'", null, null, 
        null, "'+'", "'-'", "'*'", "'/'", "'%'", "'!'", "':'", "'('", "')'", 
        "'['", "']'", "'''", "'\"'", "'`'", "'~'", "'&'", "'^'", "'AVG'", 
        "'COUNT'", "'DISTINCT_COUNT'", "'ESTDC'", "'ESTDC_ERROR'", "'MAX'", 
        "'MEAN'", "'MEDIAN'", "'MIN'", "'MODE'", "'RANGE'", "'STDEV'", "'STDEVP'", 
        "'SUM'", "'SUMSQ'", "'VAR_SAMP'", "'VAR_POP'", "'STDDEV_SAMP'", 
        "'STDDEV_POP'", "'PERCENTILE'", "'TAKE'", "'FIRST'", "'LAST'", "'LIST'", 
        "'VALUES'", "'EARLIEST'", "'EARLIEST_TIME'", "'LATEST'", "'LATEST_TIME'", 
        "'PER_DAY'", "'PER_HOUR'", "'PER_MINUTE'", "'PER_SECOND'", "'RATE'", 
        "'SPARKLINE'", "'C'", "'DC'", "'ABS'", "'CBRT'", "'CEIL'", "'CEILING'", 
        "'CONV'", "'CRC32'", "'E'", "'EXP'", "'FLOOR'", "'LN'", "'LOG'", 
        "'LOG10'", "'LOG2'", "'MOD'", "'PI'", "'POSITION'", "'POW'", "'POWER'", 
        "'RAND'", "'ROUND'", "'SIGN'", "'SQRT'", "'TRUNCATE'", "'ACOS'", 
        "'ASIN'", "'ATAN'", "'ATAN2'", "'COS'", "'COT'", "'DEGREES'", "'RADIANS'", 
        "'SIN'", "'TAN'", "'ADDDATE'", "'ADDTIME'", "'CURDATE'", "'CURRENT_DATE'", 
        "'CURRENT_TIME'", "'CURRENT_TIMESTAMP'", "'CURTIME'", "'DATE'", 
        "'DATEDIFF'", "'DATE_ADD'", "'DATE_FORMAT'", "'DATE_SUB'", "'DAYNAME'", 
        "'DAYOFMONTH'", "'DAYOFWEEK'", "'DAYOFYEAR'", "'DAY_OF_MONTH'", 
        "'DAY_OF_WEEK'", "'EXTRACT'", "'FROM_DAYS'", "'FROM_UNIXTIME'", 
        "'GET_FORMAT'", "'LAST_DAY'", "'LOCALTIME'", "'LOCALTIMESTAMP'", 
        "'MAKEDATE'", "'MAKETIME'", "'MONTHNAME'", "'NOW'", "'PERIOD_ADD'", 
        "'PERIOD_DIFF'", "'SEC_TO_TIME'", "'STR_TO_DATE'", "'SUBDATE'", 
        "'SUBTIME'", "'SYSDATE'", "'TIME'", "'TIMEDIFF'", "'TIMESTAMP'", 
        "'TIMESTAMPADD'", "'TIMESTAMPDIFF'", "'TIME_FORMAT'", "'TIME_TO_SEC'", 
        "'TO_DAYS'", "'TO_SECONDS'", "'UNIX_TIMESTAMP'", "'UTC_DATE'", "'UTC_TIME'", 
        "'UTC_TIMESTAMP'", "'WEEKDAY'", "'YEARWEEK'", "'SUBSTR'", "'SUBSTRING'", 
        "'LTRIM'", "'RTRIM'", "'TRIM'", "'TO'", "'LOWER'", "'UPPER'", "'CONCAT'", 
        "'CONCAT_WS'", "'LENGTH'", "'STRCMP'", "'RIGHT'", "'LEFT'", "'ASCII'", 
        "'LOCATE'", "'REPLACE'", "'REVERSE'", "'CAST'", "'LIKE'", "'ISNULL'", 
        "'ISNOTNULL'", "'IFNULL'", "'NULLIF'", "'IF'", "'TYPEOF'", "'MATCH'", 
        "'MATCH_PHRASE'", "'MATCH_PHRASE_PREFIX'", "'MATCH_BOOL_PREFIX'", 
        "'SIMPLE_QUERY_STRING'", "'MULTI_MATCH'", "'QUERY_STRING'", "'ALLOW_LEADING_WILDCARD'", 
        "'ANALYZE_WILDCARD'", "'ANALYZER'", "'AUTO_GENERATE_SYNONYMS_PHRASE_QUERY'", 
        "'BOOST'", "'CUTOFF_FREQUENCY'", "'DEFAULT_FIELD'", "'DEFAULT_OPERATOR'", 
        "'ENABLE_POSITION_INCREMENTS'", "'ESCAPE'", "'FLAGS'", "'FUZZY_MAX_EXPANSIONS'", 
        "'FUZZY_PREFIX_LENGTH'", "'FUZZY_TRANSPOSITIONS'", "'FUZZY_REWRITE'", 
        "'FUZZINESS'", "'LENIENT'", "'LOW_FREQ_OPERATOR'", "'MAX_DETERMINIZED_STATES'", 
        "'MAX_EXPANSIONS'", "'MINIMUM_SHOULD_MATCH'", "'OPERATOR'", "'PHRASE_SLOP'", 
        "'PREFIX_LENGTH'", "'QUOTE_ANALYZER'", "'QUOTE_FIELD_SUFFIX'", "'REWRITE'", 
        "'SLOP'", "'TIE_BREAKER'", "'TYPE'", "'ZERO_TERMS_QUERY'", "'SPAN'", 
        "'MS'", "'S'", "'M'", "'H'", "'W'", "'Q'", "'Y'"
    ];

    public static readonly symbolicNames = [
        null, "SPACE", "SEARCH", "DESCRIBE", "SHOW", "FROM", "WHERE", "FIELDS", 
        "RENAME", "STATS", "DEDUP", "SORT", "EVAL", "HEAD", "TOP", "RARE", 
        "PARSE", "METHOD", "REGEX", "PUNCT", "GROK", "PATTERN", "PATTERNS", 
        "NEW_FIELD", "KMEANS", "AD", "ML", "AS", "BY", "SOURCE", "INDEX", 
        "D", "DESC", "DATASOURCES", "SORTBY", "AUTO", "STR", "IP", "NUM", 
        "KEEPEMPTY", "CONSECUTIVE", "DEDUP_SPLITVALUES", "PARTITIONS", "ALLNUM", 
        "DELIM", "CENTROIDS", "ITERATIONS", "DISTANCE_TYPE", "NUMBER_OF_TREES", 
        "SHINGLE_SIZE", "SAMPLE_SIZE", "OUTPUT_AFTER", "TIME_DECAY", "ANOMALY_RATE", 
        "CATEGORY_FIELD", "TIME_FIELD", "TIME_ZONE", "TRAINING_DATA_SIZE", 
        "ANOMALY_SCORE_THRESHOLD", "CASE", "IN", "NOT", "OR", "AND", "XOR", 
        "TRUE", "FALSE", "REGEXP", "CONVERT_TZ", "DATETIME", "DAY", "DAY_HOUR", 
        "DAY_MICROSECOND", "DAY_MINUTE", "DAY_OF_YEAR", "DAY_SECOND", "HOUR", 
        "HOUR_MICROSECOND", "HOUR_MINUTE", "HOUR_OF_DAY", "HOUR_SECOND", 
        "INTERVAL", "MICROSECOND", "MILLISECOND", "MINUTE", "MINUTE_MICROSECOND", 
        "MINUTE_OF_DAY", "MINUTE_OF_HOUR", "MINUTE_SECOND", "MONTH", "MONTH_OF_YEAR", 
        "QUARTER", "SECOND", "SECOND_MICROSECOND", "SECOND_OF_MINUTE", "WEEK", 
        "WEEK_OF_YEAR", "YEAR", "YEAR_MONTH", "DATAMODEL", "LOOKUP", "SAVEDSEARCH", 
        "INT", "INTEGER", "DOUBLE", "LONG", "FLOAT", "STRING", "BOOLEAN", 
        "PIPE", "COMMA", "DOT", "EQUAL", "GREATER", "LESS", "NOT_GREATER", 
        "NOT_LESS", "NOT_EQUAL", "PLUS", "MINUS", "STAR", "DIVIDE", "MODULE", 
        "EXCLAMATION_SYMBOL", "COLON", "LT_PRTHS", "RT_PRTHS", "LT_SQR_PRTHS", 
        "RT_SQR_PRTHS", "SINGLE_QUOTE", "DOUBLE_QUOTE", "BACKTICK", "BIT_NOT_OP", 
        "BIT_AND_OP", "BIT_XOR_OP", "AVG", "COUNT", "DISTINCT_COUNT", "ESTDC", 
        "ESTDC_ERROR", "MAX", "MEAN", "MEDIAN", "MIN", "MODE", "RANGE", 
        "STDEV", "STDEVP", "SUM", "SUMSQ", "VAR_SAMP", "VAR_POP", "STDDEV_SAMP", 
        "STDDEV_POP", "PERCENTILE", "TAKE", "FIRST", "LAST", "LIST", "VALUES", 
        "EARLIEST", "EARLIEST_TIME", "LATEST", "LATEST_TIME", "PER_DAY", 
        "PER_HOUR", "PER_MINUTE", "PER_SECOND", "RATE", "SPARKLINE", "C", 
        "DC", "ABS", "CBRT", "CEIL", "CEILING", "CONV", "CRC32", "E", "EXP", 
        "FLOOR", "LN", "LOG", "LOG10", "LOG2", "MOD", "PI", "POSITION", 
        "POW", "POWER", "RAND", "ROUND", "SIGN", "SQRT", "TRUNCATE", "ACOS", 
        "ASIN", "ATAN", "ATAN2", "COS", "COT", "DEGREES", "RADIANS", "SIN", 
        "TAN", "ADDDATE", "ADDTIME", "CURDATE", "CURRENT_DATE", "CURRENT_TIME", 
        "CURRENT_TIMESTAMP", "CURTIME", "DATE", "DATEDIFF", "DATE_ADD", 
        "DATE_FORMAT", "DATE_SUB", "DAYNAME", "DAYOFMONTH", "DAYOFWEEK", 
        "DAYOFYEAR", "DAY_OF_MONTH", "DAY_OF_WEEK", "EXTRACT", "FROM_DAYS", 
        "FROM_UNIXTIME", "GET_FORMAT", "LAST_DAY", "LOCALTIME", "LOCALTIMESTAMP", 
        "MAKEDATE", "MAKETIME", "MONTHNAME", "NOW", "PERIOD_ADD", "PERIOD_DIFF", 
        "SEC_TO_TIME", "STR_TO_DATE", "SUBDATE", "SUBTIME", "SYSDATE", "TIME", 
        "TIMEDIFF", "TIMESTAMP", "TIMESTAMPADD", "TIMESTAMPDIFF", "TIME_FORMAT", 
        "TIME_TO_SEC", "TO_DAYS", "TO_SECONDS", "UNIX_TIMESTAMP", "UTC_DATE", 
        "UTC_TIME", "UTC_TIMESTAMP", "WEEKDAY", "YEARWEEK", "SUBSTR", "SUBSTRING", 
        "LTRIM", "RTRIM", "TRIM", "TO", "LOWER", "UPPER", "CONCAT", "CONCAT_WS", 
        "LENGTH", "STRCMP", "RIGHT", "LEFT", "ASCII", "LOCATE", "REPLACE", 
        "REVERSE", "CAST", "LIKE", "ISNULL", "ISNOTNULL", "IFNULL", "NULLIF", 
        "IF", "TYPEOF", "MATCH", "MATCH_PHRASE", "MATCH_PHRASE_PREFIX", 
        "MATCH_BOOL_PREFIX", "SIMPLE_QUERY_STRING", "MULTI_MATCH", "QUERY_STRING", 
        "ALLOW_LEADING_WILDCARD", "ANALYZE_WILDCARD", "ANALYZER", "AUTO_GENERATE_SYNONYMS_PHRASE_QUERY", 
        "BOOST", "CUTOFF_FREQUENCY", "DEFAULT_FIELD", "DEFAULT_OPERATOR", 
        "ENABLE_POSITION_INCREMENTS", "ESCAPE", "FLAGS", "FUZZY_MAX_EXPANSIONS", 
        "FUZZY_PREFIX_LENGTH", "FUZZY_TRANSPOSITIONS", "FUZZY_REWRITE", 
        "FUZZINESS", "LENIENT", "LOW_FREQ_OPERATOR", "MAX_DETERMINIZED_STATES", 
        "MAX_EXPANSIONS", "MINIMUM_SHOULD_MATCH", "OPERATOR", "PHRASE_SLOP", 
        "PREFIX_LENGTH", "QUOTE_ANALYZER", "QUOTE_FIELD_SUFFIX", "REWRITE", 
        "SLOP", "TIE_BREAKER", "TYPE", "ZERO_TERMS_QUERY", "SPAN", "MS", 
        "S", "M", "H", "W", "Q", "Y", "ID", "CLUSTER", "INTEGER_LITERAL", 
        "DECIMAL_LITERAL", "ID_DATE_SUFFIX", "DQUOTA_STRING", "SQUOTA_STRING", 
        "BQUOTA_STRING", "ERROR_RECOGNITION"
    ];
    public static readonly ruleNames = [
        "root", "pplStatement", "dmlStatement", "queryStatement", "pplCommands", 
        "commands", "searchCommand", "describeCommand", "showDataSourcesCommand", 
        "whereCommand", "fieldsCommand", "renameCommand", "statsCommand", 
        "dedupCommand", "sortCommand", "evalCommand", "headCommand", "topCommand", 
        "rareCommand", "grokCommand", "parseCommand", "patternsCommand", 
        "patternsParameter", "patternsMethod", "kmeansCommand", "kmeansParameter", 
        "adCommand", "adParameter", "mlCommand", "mlArg", "fromClause", 
        "tableSourceClause", "renameClasue", "byClause", "statsByClause", 
        "bySpanClause", "spanClause", "sortbyClause", "evalClause", "statsAggTerm", 
        "statsFunction", "statsFunctionName", "takeAggFunction", "percentileAggFunction", 
        "expression", "logicalExpression", "comparisonExpression", "valueExpression", 
        "primaryExpression", "positionFunction", "booleanExpression", "relevanceExpression", 
        "singleFieldRelevanceFunction", "multiFieldRelevanceFunction", "tableSource", 
        "tableFunction", "fieldList", "wcFieldList", "sortField", "sortFieldExpression", 
        "fieldExpression", "wcFieldExpression", "evalFunctionCall", "dataTypeFunctionCall", 
        "booleanFunctionCall", "convertedDataType", "evalFunctionName", 
        "functionArgs", "functionArg", "relevanceArg", "relevanceArgName", 
        "relevanceFieldAndWeight", "relevanceFieldWeight", "relevanceField", 
        "relevanceQuery", "relevanceArgValue", "mathematicalFunctionName", 
        "trigonometricFunctionName", "dateTimeFunctionName", "getFormatFunction", 
        "getFormatType", "extractFunction", "simpleDateTimePart", "complexDateTimePart", 
        "datetimePart", "timestampFunction", "timestampFunctionName", "conditionFunctionBase", 
        "systemFunctionName", "textFunctionName", "positionFunctionName", 
        "comparisonOperator", "singleFieldRelevanceFunctionName", "multiFieldRelevanceFunctionName", 
        "literalValue", "intervalLiteral", "stringLiteral", "integerLiteral", 
        "decimalLiteral", "booleanLiteral", "datetimeLiteral", "dateLiteral", 
        "timeLiteral", "timestampLiteral", "intervalUnit", "timespanUnit", 
        "valueList", "qualifiedName", "tableQualifiedName", "wcQualifiedName", 
        "ident", "tableIdent", "wildcard", "keywordsCanBeId",
    ];

    public get grammarFileName(): string { return "OpenSearchPPLParser.g4"; }
    public get literalNames(): (string | null)[] { return OpenSearchPPLParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return OpenSearchPPLParser.symbolicNames; }
    public get ruleNames(): string[] { return OpenSearchPPLParser.ruleNames; }
    public get serializedATN(): number[] { return OpenSearchPPLParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, OpenSearchPPLParser._ATN, OpenSearchPPLParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public root(): RootContext {
        let localContext = new RootContext(this.context, this.state);
        this.enterRule(localContext, 0, OpenSearchPPLParser.RULE_root);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 229;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1610612764) !== 0)) {
                {
                this.state = 228;
                this.pplStatement();
                }
            }

            this.state = 231;
            this.match(OpenSearchPPLParser.EOF);
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
    public pplStatement(): PplStatementContext {
        let localContext = new PplStatementContext(this.context, this.state);
        this.enterRule(localContext, 2, OpenSearchPPLParser.RULE_pplStatement);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 233;
            this.dmlStatement();
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
        this.enterRule(localContext, 4, OpenSearchPPLParser.RULE_dmlStatement);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 235;
            this.queryStatement();
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
    public queryStatement(): QueryStatementContext {
        let localContext = new QueryStatementContext(this.context, this.state);
        this.enterRule(localContext, 6, OpenSearchPPLParser.RULE_queryStatement);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 237;
            this.pplCommands();
            this.state = 242;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 109) {
                {
                {
                this.state = 238;
                this.match(OpenSearchPPLParser.PIPE);
                this.state = 239;
                this.commands();
                }
                }
                this.state = 244;
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
    public pplCommands(): PplCommandsContext {
        let localContext = new PplCommandsContext(this.context, this.state);
        this.enterRule(localContext, 8, OpenSearchPPLParser.RULE_pplCommands);
        try {
            this.state = 248;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.SEARCH:
            case OpenSearchPPLParser.SOURCE:
            case OpenSearchPPLParser.INDEX:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 245;
                this.searchCommand();
                }
                break;
            case OpenSearchPPLParser.DESCRIBE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 246;
                this.describeCommand();
                }
                break;
            case OpenSearchPPLParser.SHOW:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 247;
                this.showDataSourcesCommand();
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
    public commands(): CommandsContext {
        let localContext = new CommandsContext(this.context, this.state);
        this.enterRule(localContext, 10, OpenSearchPPLParser.RULE_commands);
        try {
            this.state = 266;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.WHERE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 250;
                this.whereCommand();
                }
                break;
            case OpenSearchPPLParser.FIELDS:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 251;
                this.fieldsCommand();
                }
                break;
            case OpenSearchPPLParser.RENAME:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 252;
                this.renameCommand();
                }
                break;
            case OpenSearchPPLParser.STATS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 253;
                this.statsCommand();
                }
                break;
            case OpenSearchPPLParser.DEDUP:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 254;
                this.dedupCommand();
                }
                break;
            case OpenSearchPPLParser.SORT:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 255;
                this.sortCommand();
                }
                break;
            case OpenSearchPPLParser.EVAL:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 256;
                this.evalCommand();
                }
                break;
            case OpenSearchPPLParser.HEAD:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 257;
                this.headCommand();
                }
                break;
            case OpenSearchPPLParser.TOP:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 258;
                this.topCommand();
                }
                break;
            case OpenSearchPPLParser.RARE:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 259;
                this.rareCommand();
                }
                break;
            case OpenSearchPPLParser.GROK:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 260;
                this.grokCommand();
                }
                break;
            case OpenSearchPPLParser.PARSE:
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 261;
                this.parseCommand();
                }
                break;
            case OpenSearchPPLParser.PATTERNS:
                this.enterOuterAlt(localContext, 13);
                {
                this.state = 262;
                this.patternsCommand();
                }
                break;
            case OpenSearchPPLParser.KMEANS:
                this.enterOuterAlt(localContext, 14);
                {
                this.state = 263;
                this.kmeansCommand();
                }
                break;
            case OpenSearchPPLParser.AD:
                this.enterOuterAlt(localContext, 15);
                {
                this.state = 264;
                this.adCommand();
                }
                break;
            case OpenSearchPPLParser.ML:
                this.enterOuterAlt(localContext, 16);
                {
                this.state = 265;
                this.mlCommand();
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
    public searchCommand(): SearchCommandContext {
        let localContext = new SearchCommandContext(this.context, this.state);
        this.enterRule(localContext, 12, OpenSearchPPLParser.RULE_searchCommand);
        let _la: number;
        try {
            localContext = new SearchFromContext(localContext);
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 269;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 2) {
                {
                this.state = 268;
                this.match(OpenSearchPPLParser.SEARCH);
                }
            }

            this.state = 271;
            this.fromClause();
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
    public describeCommand(): DescribeCommandContext {
        let localContext = new DescribeCommandContext(this.context, this.state);
        this.enterRule(localContext, 14, OpenSearchPPLParser.RULE_describeCommand);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 273;
            this.match(OpenSearchPPLParser.DESCRIBE);
            this.state = 274;
            this.tableSourceClause();
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
    public showDataSourcesCommand(): ShowDataSourcesCommandContext {
        let localContext = new ShowDataSourcesCommandContext(this.context, this.state);
        this.enterRule(localContext, 16, OpenSearchPPLParser.RULE_showDataSourcesCommand);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 276;
            this.match(OpenSearchPPLParser.SHOW);
            this.state = 277;
            this.match(OpenSearchPPLParser.DATASOURCES);
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
    public whereCommand(): WhereCommandContext {
        let localContext = new WhereCommandContext(this.context, this.state);
        this.enterRule(localContext, 18, OpenSearchPPLParser.RULE_whereCommand);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 279;
            this.match(OpenSearchPPLParser.WHERE);
            this.state = 280;
            this.logicalExpression(0);
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
    public fieldsCommand(): FieldsCommandContext {
        let localContext = new FieldsCommandContext(this.context, this.state);
        this.enterRule(localContext, 20, OpenSearchPPLParser.RULE_fieldsCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 282;
            this.match(OpenSearchPPLParser.FIELDS);
            this.state = 284;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 118 || _la === 119) {
                {
                this.state = 283;
                _la = this.tokenStream.LA(1);
                if(!(_la === 118 || _la === 119)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
            }

            this.state = 286;
            this.fieldList();
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
    public renameCommand(): RenameCommandContext {
        let localContext = new RenameCommandContext(this.context, this.state);
        this.enterRule(localContext, 22, OpenSearchPPLParser.RULE_renameCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 288;
            this.match(OpenSearchPPLParser.RENAME);
            this.state = 289;
            this.renameClasue();
            this.state = 294;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 110) {
                {
                {
                this.state = 290;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 291;
                this.renameClasue();
                }
                }
                this.state = 296;
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
    public statsCommand(): StatsCommandContext {
        let localContext = new StatsCommandContext(this.context, this.state);
        this.enterRule(localContext, 24, OpenSearchPPLParser.RULE_statsCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 297;
            this.match(OpenSearchPPLParser.STATS);
            this.state = 301;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 42) {
                {
                this.state = 298;
                this.match(OpenSearchPPLParser.PARTITIONS);
                this.state = 299;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 300;
                localContext._partitions = this.integerLiteral();
                }
            }

            this.state = 306;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 43) {
                {
                this.state = 303;
                this.match(OpenSearchPPLParser.ALLNUM);
                this.state = 304;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 305;
                localContext._allnum = this.booleanLiteral();
                }
            }

            this.state = 311;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 44) {
                {
                this.state = 308;
                this.match(OpenSearchPPLParser.DELIM);
                this.state = 309;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 310;
                localContext._delim = this.stringLiteral();
                }
            }

            this.state = 313;
            this.statsAggTerm();
            this.state = 318;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 110) {
                {
                {
                this.state = 314;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 315;
                this.statsAggTerm();
                }
                }
                this.state = 320;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 322;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 28) {
                {
                this.state = 321;
                this.statsByClause();
                }
            }

            this.state = 327;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 41) {
                {
                this.state = 324;
                this.match(OpenSearchPPLParser.DEDUP_SPLITVALUES);
                this.state = 325;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 326;
                localContext._dedupsplit = this.booleanLiteral();
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
    public dedupCommand(): DedupCommandContext {
        let localContext = new DedupCommandContext(this.context, this.state);
        this.enterRule(localContext, 26, OpenSearchPPLParser.RULE_dedupCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 329;
            this.match(OpenSearchPPLParser.DEDUP);
            this.state = 331;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 118 || _la === 119 || _la === 330) {
                {
                this.state = 330;
                localContext._number_ = this.integerLiteral();
                }
            }

            this.state = 333;
            this.fieldList();
            this.state = 337;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 39) {
                {
                this.state = 334;
                this.match(OpenSearchPPLParser.KEEPEMPTY);
                this.state = 335;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 336;
                localContext._keepempty = this.booleanLiteral();
                }
            }

            this.state = 342;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 40) {
                {
                this.state = 339;
                this.match(OpenSearchPPLParser.CONSECUTIVE);
                this.state = 340;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 341;
                localContext._consecutive = this.booleanLiteral();
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
    public sortCommand(): SortCommandContext {
        let localContext = new SortCommandContext(this.context, this.state);
        this.enterRule(localContext, 28, OpenSearchPPLParser.RULE_sortCommand);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 344;
            this.match(OpenSearchPPLParser.SORT);
            this.state = 345;
            this.sortbyClause();
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
    public evalCommand(): EvalCommandContext {
        let localContext = new EvalCommandContext(this.context, this.state);
        this.enterRule(localContext, 30, OpenSearchPPLParser.RULE_evalCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 347;
            this.match(OpenSearchPPLParser.EVAL);
            this.state = 348;
            this.evalClause();
            this.state = 353;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 110) {
                {
                {
                this.state = 349;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 350;
                this.evalClause();
                }
                }
                this.state = 355;
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
    public headCommand(): HeadCommandContext {
        let localContext = new HeadCommandContext(this.context, this.state);
        this.enterRule(localContext, 32, OpenSearchPPLParser.RULE_headCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 356;
            this.match(OpenSearchPPLParser.HEAD);
            this.state = 358;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 118 || _la === 119 || _la === 330) {
                {
                this.state = 357;
                localContext._number_ = this.integerLiteral();
                }
            }

            this.state = 362;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 5) {
                {
                this.state = 360;
                this.match(OpenSearchPPLParser.FROM);
                this.state = 361;
                localContext._from_ = this.integerLiteral();
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
    public topCommand(): TopCommandContext {
        let localContext = new TopCommandContext(this.context, this.state);
        this.enterRule(localContext, 34, OpenSearchPPLParser.RULE_topCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 364;
            this.match(OpenSearchPPLParser.TOP);
            this.state = 366;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 118 || _la === 119 || _la === 330) {
                {
                this.state = 365;
                localContext._number_ = this.integerLiteral();
                }
            }

            this.state = 368;
            this.fieldList();
            this.state = 370;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 28) {
                {
                this.state = 369;
                this.byClause();
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
    public rareCommand(): RareCommandContext {
        let localContext = new RareCommandContext(this.context, this.state);
        this.enterRule(localContext, 36, OpenSearchPPLParser.RULE_rareCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 372;
            this.match(OpenSearchPPLParser.RARE);
            this.state = 373;
            this.fieldList();
            this.state = 375;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 28) {
                {
                this.state = 374;
                this.byClause();
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
    public grokCommand(): GrokCommandContext {
        let localContext = new GrokCommandContext(this.context, this.state);
        this.enterRule(localContext, 38, OpenSearchPPLParser.RULE_grokCommand);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 377;
            this.match(OpenSearchPPLParser.GROK);
            {
            this.state = 378;
            localContext._source_field = this.expression();
            }
            {
            this.state = 379;
            localContext._pattern = this.stringLiteral();
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
    public parseCommand(): ParseCommandContext {
        let localContext = new ParseCommandContext(this.context, this.state);
        this.enterRule(localContext, 40, OpenSearchPPLParser.RULE_parseCommand);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 381;
            this.match(OpenSearchPPLParser.PARSE);
            {
            this.state = 382;
            localContext._source_field = this.expression();
            }
            {
            this.state = 383;
            localContext._pattern = this.stringLiteral();
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
    public patternsCommand(): PatternsCommandContext {
        let localContext = new PatternsCommandContext(this.context, this.state);
        this.enterRule(localContext, 42, OpenSearchPPLParser.RULE_patternsCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 385;
            this.match(OpenSearchPPLParser.PATTERNS);
            this.state = 389;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 21 || _la === 23) {
                {
                {
                this.state = 386;
                this.patternsParameter();
                }
                }
                this.state = 391;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            {
            this.state = 392;
            localContext._source_field = this.expression();
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
    public patternsParameter(): PatternsParameterContext {
        let localContext = new PatternsParameterContext(this.context, this.state);
        this.enterRule(localContext, 44, OpenSearchPPLParser.RULE_patternsParameter);
        try {
            this.state = 400;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.NEW_FIELD:
                this.enterOuterAlt(localContext, 1);
                {
                {
                this.state = 394;
                this.match(OpenSearchPPLParser.NEW_FIELD);
                this.state = 395;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 396;
                localContext._new_field = this.stringLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.PATTERN:
                this.enterOuterAlt(localContext, 2);
                {
                {
                this.state = 397;
                this.match(OpenSearchPPLParser.PATTERN);
                this.state = 398;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 399;
                localContext._pattern = this.stringLiteral();
                }
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
    public patternsMethod(): PatternsMethodContext {
        let localContext = new PatternsMethodContext(this.context, this.state);
        this.enterRule(localContext, 46, OpenSearchPPLParser.RULE_patternsMethod);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 402;
            _la = this.tokenStream.LA(1);
            if(!(_la === 18 || _la === 19)) {
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
    public kmeansCommand(): KmeansCommandContext {
        let localContext = new KmeansCommandContext(this.context, this.state);
        this.enterRule(localContext, 48, OpenSearchPPLParser.RULE_kmeansCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 404;
            this.match(OpenSearchPPLParser.KMEANS);
            this.state = 408;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 45)) & ~0x1F) === 0 && ((1 << (_la - 45)) & 7) !== 0)) {
                {
                {
                this.state = 405;
                this.kmeansParameter();
                }
                }
                this.state = 410;
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
    public kmeansParameter(): KmeansParameterContext {
        let localContext = new KmeansParameterContext(this.context, this.state);
        this.enterRule(localContext, 50, OpenSearchPPLParser.RULE_kmeansParameter);
        try {
            this.state = 420;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.CENTROIDS:
                this.enterOuterAlt(localContext, 1);
                {
                {
                this.state = 411;
                this.match(OpenSearchPPLParser.CENTROIDS);
                this.state = 412;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 413;
                localContext._centroids = this.integerLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.ITERATIONS:
                this.enterOuterAlt(localContext, 2);
                {
                {
                this.state = 414;
                this.match(OpenSearchPPLParser.ITERATIONS);
                this.state = 415;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 416;
                localContext._iterations = this.integerLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.DISTANCE_TYPE:
                this.enterOuterAlt(localContext, 3);
                {
                {
                this.state = 417;
                this.match(OpenSearchPPLParser.DISTANCE_TYPE);
                this.state = 418;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 419;
                localContext._distance_type = this.stringLiteral();
                }
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
    public adCommand(): AdCommandContext {
        let localContext = new AdCommandContext(this.context, this.state);
        this.enterRule(localContext, 52, OpenSearchPPLParser.RULE_adCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 422;
            this.match(OpenSearchPPLParser.AD);
            this.state = 426;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 48)) & ~0x1F) === 0 && ((1 << (_la - 48)) & 2047) !== 0) || _la === 215) {
                {
                {
                this.state = 423;
                this.adParameter();
                }
                }
                this.state = 428;
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
    public adParameter(): AdParameterContext {
        let localContext = new AdParameterContext(this.context, this.state);
        this.enterRule(localContext, 54, OpenSearchPPLParser.RULE_adParameter);
        try {
            this.state = 465;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.NUMBER_OF_TREES:
                this.enterOuterAlt(localContext, 1);
                {
                {
                this.state = 429;
                this.match(OpenSearchPPLParser.NUMBER_OF_TREES);
                this.state = 430;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 431;
                localContext._number_of_trees = this.integerLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.SHINGLE_SIZE:
                this.enterOuterAlt(localContext, 2);
                {
                {
                this.state = 432;
                this.match(OpenSearchPPLParser.SHINGLE_SIZE);
                this.state = 433;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 434;
                localContext._shingle_size = this.integerLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.SAMPLE_SIZE:
                this.enterOuterAlt(localContext, 3);
                {
                {
                this.state = 435;
                this.match(OpenSearchPPLParser.SAMPLE_SIZE);
                this.state = 436;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 437;
                localContext._sample_size = this.integerLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.OUTPUT_AFTER:
                this.enterOuterAlt(localContext, 4);
                {
                {
                this.state = 438;
                this.match(OpenSearchPPLParser.OUTPUT_AFTER);
                this.state = 439;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 440;
                localContext._output_after = this.integerLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.TIME_DECAY:
                this.enterOuterAlt(localContext, 5);
                {
                {
                this.state = 441;
                this.match(OpenSearchPPLParser.TIME_DECAY);
                this.state = 442;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 443;
                localContext._time_decay = this.decimalLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.ANOMALY_RATE:
                this.enterOuterAlt(localContext, 6);
                {
                {
                this.state = 444;
                this.match(OpenSearchPPLParser.ANOMALY_RATE);
                this.state = 445;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 446;
                localContext._anomaly_rate = this.decimalLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.CATEGORY_FIELD:
                this.enterOuterAlt(localContext, 7);
                {
                {
                this.state = 447;
                this.match(OpenSearchPPLParser.CATEGORY_FIELD);
                this.state = 448;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 449;
                localContext._category_field = this.stringLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.TIME_FIELD:
                this.enterOuterAlt(localContext, 8);
                {
                {
                this.state = 450;
                this.match(OpenSearchPPLParser.TIME_FIELD);
                this.state = 451;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 452;
                localContext._time_field = this.stringLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.DATE_FORMAT:
                this.enterOuterAlt(localContext, 9);
                {
                {
                this.state = 453;
                this.match(OpenSearchPPLParser.DATE_FORMAT);
                this.state = 454;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 455;
                localContext._date_format = this.stringLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.TIME_ZONE:
                this.enterOuterAlt(localContext, 10);
                {
                {
                this.state = 456;
                this.match(OpenSearchPPLParser.TIME_ZONE);
                this.state = 457;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 458;
                localContext._time_zone = this.stringLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.TRAINING_DATA_SIZE:
                this.enterOuterAlt(localContext, 11);
                {
                {
                this.state = 459;
                this.match(OpenSearchPPLParser.TRAINING_DATA_SIZE);
                this.state = 460;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 461;
                localContext._training_data_size = this.integerLiteral();
                }
                }
                break;
            case OpenSearchPPLParser.ANOMALY_SCORE_THRESHOLD:
                this.enterOuterAlt(localContext, 12);
                {
                {
                this.state = 462;
                this.match(OpenSearchPPLParser.ANOMALY_SCORE_THRESHOLD);
                this.state = 463;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 464;
                localContext._anomaly_score_threshold = this.decimalLiteral();
                }
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
    public mlCommand(): MlCommandContext {
        let localContext = new MlCommandContext(this.context, this.state);
        this.enterRule(localContext, 56, OpenSearchPPLParser.RULE_mlCommand);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 467;
            this.match(OpenSearchPPLParser.ML);
            this.state = 471;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3892314108) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 134217719) !== 0) || ((((_la - 68)) & ~0x1F) === 0 && ((1 << (_la - 68)) & 2147475455) !== 0) || ((((_la - 111)) & ~0x1F) === 0 && ((1 << (_la - 111)) & 4279238657) !== 0) || ((((_la - 143)) & ~0x1F) === 0 && ((1 << (_la - 143)) & 4294967295) !== 0) || ((((_la - 175)) & ~0x1F) === 0 && ((1 << (_la - 175)) & 4294967295) !== 0) || ((((_la - 207)) & ~0x1F) === 0 && ((1 << (_la - 207)) & 4294377471) !== 0) || ((((_la - 239)) & ~0x1F) === 0 && ((1 << (_la - 239)) & 4290772895) !== 0) || ((((_la - 271)) & ~0x1F) === 0 && ((1 << (_la - 271)) & 4294707191) !== 0) || ((((_la - 303)) & ~0x1F) === 0 && ((1 << (_la - 303)) & 67108863) !== 0) || _la === 335) {
                {
                {
                this.state = 468;
                this.mlArg();
                }
                }
                this.state = 473;
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
    public mlArg(): MlArgContext {
        let localContext = new MlArgContext(this.context, this.state);
        this.enterRule(localContext, 58, OpenSearchPPLParser.RULE_mlArg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            {
            this.state = 474;
            localContext._argName = this.ident();
            this.state = 475;
            this.match(OpenSearchPPLParser.EQUAL);
            this.state = 476;
            localContext._argValue = this.literalValue();
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
        this.enterRule(localContext, 60, OpenSearchPPLParser.RULE_fromClause);
        try {
            this.state = 484;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.SOURCE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 478;
                this.match(OpenSearchPPLParser.SOURCE);
                this.state = 479;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 480;
                this.tableSourceClause();
                }
                break;
            case OpenSearchPPLParser.INDEX:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 481;
                this.match(OpenSearchPPLParser.INDEX);
                this.state = 482;
                this.match(OpenSearchPPLParser.EQUAL);
                this.state = 483;
                this.tableSourceClause();
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
    public tableSourceClause(): TableSourceClauseContext {
        let localContext = new TableSourceClauseContext(this.context, this.state);
        this.enterRule(localContext, 62, OpenSearchPPLParser.RULE_tableSourceClause);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 486;
            this.tableSource();
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
    public renameClasue(): RenameClasueContext {
        let localContext = new RenameClasueContext(this.context, this.state);
        this.enterRule(localContext, 64, OpenSearchPPLParser.RULE_renameClasue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 488;
            localContext._orignalField = this.wcFieldExpression();
            this.state = 489;
            this.match(OpenSearchPPLParser.AS);
            this.state = 490;
            localContext._renamedField = this.wcFieldExpression();
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
    public byClause(): ByClauseContext {
        let localContext = new ByClauseContext(this.context, this.state);
        this.enterRule(localContext, 66, OpenSearchPPLParser.RULE_byClause);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 492;
            this.match(OpenSearchPPLParser.BY);
            this.state = 493;
            this.fieldList();
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
    public statsByClause(): StatsByClauseContext {
        let localContext = new StatsByClauseContext(this.context, this.state);
        this.enterRule(localContext, 68, OpenSearchPPLParser.RULE_statsByClause);
        try {
            this.state = 504;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 30, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 495;
                this.match(OpenSearchPPLParser.BY);
                this.state = 496;
                this.fieldList();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 497;
                this.match(OpenSearchPPLParser.BY);
                this.state = 498;
                this.bySpanClause();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 499;
                this.match(OpenSearchPPLParser.BY);
                this.state = 500;
                this.bySpanClause();
                this.state = 501;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 502;
                this.fieldList();
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
    public bySpanClause(): BySpanClauseContext {
        let localContext = new BySpanClauseContext(this.context, this.state);
        this.enterRule(localContext, 70, OpenSearchPPLParser.RULE_bySpanClause);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 506;
            this.spanClause();
            this.state = 509;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 27) {
                {
                this.state = 507;
                this.match(OpenSearchPPLParser.AS);
                this.state = 508;
                localContext._alias = this.qualifiedName();
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
    public spanClause(): SpanClauseContext {
        let localContext = new SpanClauseContext(this.context, this.state);
        this.enterRule(localContext, 72, OpenSearchPPLParser.RULE_spanClause);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 511;
            this.match(OpenSearchPPLParser.SPAN);
            this.state = 512;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 513;
            this.fieldExpression();
            this.state = 514;
            this.match(OpenSearchPPLParser.COMMA);
            this.state = 515;
            localContext._value = this.literalValue();
            this.state = 517;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 31 || ((((_la - 70)) & ~0x1F) === 0 && ((1 << (_la - 70)) & 174612545) !== 0) || ((((_la - 321)) & ~0x1F) === 0 && ((1 << (_la - 321)) & 127) !== 0)) {
                {
                this.state = 516;
                localContext._unit = this.timespanUnit();
                }
            }

            this.state = 519;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
    public sortbyClause(): SortbyClauseContext {
        let localContext = new SortbyClauseContext(this.context, this.state);
        this.enterRule(localContext, 74, OpenSearchPPLParser.RULE_sortbyClause);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 521;
            this.sortField();
            this.state = 526;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 110) {
                {
                {
                this.state = 522;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 523;
                this.sortField();
                }
                }
                this.state = 528;
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
    public evalClause(): EvalClauseContext {
        let localContext = new EvalClauseContext(this.context, this.state);
        this.enterRule(localContext, 76, OpenSearchPPLParser.RULE_evalClause);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 529;
            this.fieldExpression();
            this.state = 530;
            this.match(OpenSearchPPLParser.EQUAL);
            this.state = 531;
            this.expression();
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
    public statsAggTerm(): StatsAggTermContext {
        let localContext = new StatsAggTermContext(this.context, this.state);
        this.enterRule(localContext, 78, OpenSearchPPLParser.RULE_statsAggTerm);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 533;
            this.statsFunction();
            this.state = 536;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 27) {
                {
                this.state = 534;
                this.match(OpenSearchPPLParser.AS);
                this.state = 535;
                localContext._alias = this.wcFieldExpression();
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
    public statsFunction(): StatsFunctionContext {
        let localContext = new StatsFunctionContext(this.context, this.state);
        this.enterRule(localContext, 80, OpenSearchPPLParser.RULE_statsFunction);
        let _la: number;
        try {
            this.state = 553;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 35, this.context) ) {
            case 1:
                localContext = new StatsFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 538;
                this.statsFunctionName();
                this.state = 539;
                this.match(OpenSearchPPLParser.LT_PRTHS);
                this.state = 540;
                this.valueExpression();
                this.state = 541;
                this.match(OpenSearchPPLParser.RT_PRTHS);
                }
                break;
            case 2:
                localContext = new CountAllFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 543;
                this.match(OpenSearchPPLParser.COUNT);
                this.state = 544;
                this.match(OpenSearchPPLParser.LT_PRTHS);
                this.state = 545;
                this.match(OpenSearchPPLParser.RT_PRTHS);
                }
                break;
            case 3:
                localContext = new DistinctCountFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 546;
                _la = this.tokenStream.LA(1);
                if(!(_la === 137 || _la === 171)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 547;
                this.match(OpenSearchPPLParser.LT_PRTHS);
                this.state = 548;
                this.valueExpression();
                this.state = 549;
                this.match(OpenSearchPPLParser.RT_PRTHS);
                }
                break;
            case 4:
                localContext = new PercentileAggFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 551;
                this.percentileAggFunction();
                }
                break;
            case 5:
                localContext = new TakeAggFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 552;
                this.takeAggFunction();
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
    public statsFunctionName(): StatsFunctionNameContext {
        let localContext = new StatsFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 82, OpenSearchPPLParser.RULE_statsFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 555;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 135)) & ~0x1F) === 0 && ((1 << (_la - 135)) & 500003) !== 0))) {
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
    public takeAggFunction(): TakeAggFunctionContext {
        let localContext = new TakeAggFunctionContext(this.context, this.state);
        this.enterRule(localContext, 84, OpenSearchPPLParser.RULE_takeAggFunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 557;
            this.match(OpenSearchPPLParser.TAKE);
            this.state = 558;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 559;
            this.fieldExpression();
            this.state = 562;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 110) {
                {
                this.state = 560;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 561;
                localContext._size = this.integerLiteral();
                }
            }

            this.state = 564;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
    public percentileAggFunction(): PercentileAggFunctionContext {
        let localContext = new PercentileAggFunctionContext(this.context, this.state);
        this.enterRule(localContext, 86, OpenSearchPPLParser.RULE_percentileAggFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 566;
            this.match(OpenSearchPPLParser.PERCENTILE);
            this.state = 567;
            this.match(OpenSearchPPLParser.LESS);
            this.state = 568;
            localContext._value = this.integerLiteral();
            this.state = 569;
            this.match(OpenSearchPPLParser.GREATER);
            this.state = 570;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 571;
            localContext._aggField = this.fieldExpression();
            this.state = 572;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
    public expression(): ExpressionContext {
        let localContext = new ExpressionContext(this.context, this.state);
        this.enterRule(localContext, 88, OpenSearchPPLParser.RULE_expression);
        try {
            this.state = 577;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 37, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 574;
                this.logicalExpression(0);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 575;
                this.comparisonExpression();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 576;
                this.valueExpression();
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

    public logicalExpression(): LogicalExpressionContext;
    public logicalExpression(_p: number): LogicalExpressionContext;
    public logicalExpression(_p?: number): LogicalExpressionContext {
        if (_p === undefined) {
            _p = 0;
        }

        let parentContext = this.context;
        let parentState = this.state;
        let localContext = new LogicalExpressionContext(this.context, parentState);
        let previousContext = localContext;
        let _startState = 90;
        this.enterRecursionRule(localContext, 90, OpenSearchPPLParser.RULE_logicalExpression, _p);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 585;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 38, this.context) ) {
            case 1:
                {
                localContext = new ComparsionContext(localContext);
                this.context = localContext;
                previousContext = localContext;

                this.state = 580;
                this.comparisonExpression();
                }
                break;
            case 2:
                {
                localContext = new LogicalNotContext(localContext);
                this.context = localContext;
                previousContext = localContext;
                this.state = 581;
                this.match(OpenSearchPPLParser.NOT);
                this.state = 582;
                this.logicalExpression(6);
                }
                break;
            case 3:
                {
                localContext = new BooleanExprContext(localContext);
                this.context = localContext;
                previousContext = localContext;
                this.state = 583;
                this.booleanExpression();
                }
                break;
            case 4:
                {
                localContext = new RelevanceExprContext(localContext);
                this.context = localContext;
                previousContext = localContext;
                this.state = 584;
                this.relevanceExpression();
                }
                break;
            }
            this.context!.stop = this.tokenStream.LT(-1);
            this.state = 600;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 41, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    if (this.parseListeners != null) {
                        this.triggerExitRuleEvent();
                    }
                    previousContext = localContext;
                    {
                    this.state = 598;
                    this.errorHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this.tokenStream, 40, this.context) ) {
                    case 1:
                        {
                        localContext = new LogicalOrContext(new LogicalExpressionContext(parentContext, parentState));
                        (localContext as LogicalOrContext)._left = previousContext;
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchPPLParser.RULE_logicalExpression);
                        this.state = 587;
                        if (!(this.precpred(this.context, 5))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 5)");
                        }
                        this.state = 588;
                        this.match(OpenSearchPPLParser.OR);
                        this.state = 589;
                        (localContext as LogicalOrContext)._right = this.logicalExpression(6);
                        }
                        break;
                    case 2:
                        {
                        localContext = new LogicalAndContext(new LogicalExpressionContext(parentContext, parentState));
                        (localContext as LogicalAndContext)._left = previousContext;
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchPPLParser.RULE_logicalExpression);
                        this.state = 590;
                        if (!(this.precpred(this.context, 4))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 4)");
                        }
                        this.state = 592;
                        this.errorHandler.sync(this);
                        _la = this.tokenStream.LA(1);
                        if (_la === 63) {
                            {
                            this.state = 591;
                            this.match(OpenSearchPPLParser.AND);
                            }
                        }

                        this.state = 594;
                        (localContext as LogicalAndContext)._right = this.logicalExpression(5);
                        }
                        break;
                    case 3:
                        {
                        localContext = new LogicalXorContext(new LogicalExpressionContext(parentContext, parentState));
                        (localContext as LogicalXorContext)._left = previousContext;
                        this.pushNewRecursionContext(localContext, _startState, OpenSearchPPLParser.RULE_logicalExpression);
                        this.state = 595;
                        if (!(this.precpred(this.context, 3))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 3)");
                        }
                        this.state = 596;
                        this.match(OpenSearchPPLParser.XOR);
                        this.state = 597;
                        (localContext as LogicalXorContext)._right = this.logicalExpression(4);
                        }
                        break;
                    }
                    }
                }
                this.state = 602;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 41, this.context);
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
    public comparisonExpression(): ComparisonExpressionContext {
        let localContext = new ComparisonExpressionContext(this.context, this.state);
        this.enterRule(localContext, 92, OpenSearchPPLParser.RULE_comparisonExpression);
        try {
            this.state = 611;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 42, this.context) ) {
            case 1:
                localContext = new CompareExprContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 603;
                (localContext as CompareExprContext)._left = this.valueExpression();
                this.state = 604;
                this.comparisonOperator();
                this.state = 605;
                (localContext as CompareExprContext)._right = this.valueExpression();
                }
                break;
            case 2:
                localContext = new InExprContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 607;
                this.valueExpression();
                this.state = 608;
                this.match(OpenSearchPPLParser.IN);
                this.state = 609;
                this.valueList();
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
    public valueExpression(): ValueExpressionContext {
        let localContext = new ValueExpressionContext(this.context, this.state);
        this.enterRule(localContext, 94, OpenSearchPPLParser.RULE_valueExpression);
        try {
            this.state = 622;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 43, this.context) ) {
            case 1:
                localContext = new ValueExpressionDefaultContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 613;
                this.primaryExpression();
                }
                break;
            case 2:
                localContext = new PositionFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 614;
                this.positionFunction();
                }
                break;
            case 3:
                localContext = new ExtractFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 615;
                this.extractFunction();
                }
                break;
            case 4:
                localContext = new GetFormatFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 616;
                this.getFormatFunction();
                }
                break;
            case 5:
                localContext = new TimestampFunctionCallContext(localContext);
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 617;
                this.timestampFunction();
                }
                break;
            case 6:
                localContext = new ParentheticValueExprContext(localContext);
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 618;
                this.match(OpenSearchPPLParser.LT_PRTHS);
                this.state = 619;
                this.valueExpression();
                this.state = 620;
                this.match(OpenSearchPPLParser.RT_PRTHS);
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
    public primaryExpression(): PrimaryExpressionContext {
        let localContext = new PrimaryExpressionContext(this.context, this.state);
        this.enterRule(localContext, 96, OpenSearchPPLParser.RULE_primaryExpression);
        try {
            this.state = 628;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 44, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 624;
                this.evalFunctionCall();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 625;
                this.dataTypeFunctionCall();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 626;
                this.fieldExpression();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 627;
                this.literalValue();
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
    public positionFunction(): PositionFunctionContext {
        let localContext = new PositionFunctionContext(this.context, this.state);
        this.enterRule(localContext, 98, OpenSearchPPLParser.RULE_positionFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 630;
            this.positionFunctionName();
            this.state = 631;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 632;
            this.functionArg();
            this.state = 633;
            this.match(OpenSearchPPLParser.IN);
            this.state = 634;
            this.functionArg();
            this.state = 635;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
    public booleanExpression(): BooleanExpressionContext {
        let localContext = new BooleanExpressionContext(this.context, this.state);
        this.enterRule(localContext, 100, OpenSearchPPLParser.RULE_booleanExpression);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 637;
            this.booleanFunctionCall();
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
    public relevanceExpression(): RelevanceExpressionContext {
        let localContext = new RelevanceExpressionContext(this.context, this.state);
        this.enterRule(localContext, 102, OpenSearchPPLParser.RULE_relevanceExpression);
        try {
            this.state = 641;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.MATCH:
            case OpenSearchPPLParser.MATCH_PHRASE:
            case OpenSearchPPLParser.MATCH_PHRASE_PREFIX:
            case OpenSearchPPLParser.MATCH_BOOL_PREFIX:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 639;
                this.singleFieldRelevanceFunction();
                }
                break;
            case OpenSearchPPLParser.SIMPLE_QUERY_STRING:
            case OpenSearchPPLParser.MULTI_MATCH:
            case OpenSearchPPLParser.QUERY_STRING:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 640;
                this.multiFieldRelevanceFunction();
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
    public singleFieldRelevanceFunction(): SingleFieldRelevanceFunctionContext {
        let localContext = new SingleFieldRelevanceFunctionContext(this.context, this.state);
        this.enterRule(localContext, 104, OpenSearchPPLParser.RULE_singleFieldRelevanceFunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 643;
            this.singleFieldRelevanceFunctionName();
            this.state = 644;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 645;
            localContext._field = this.relevanceField();
            this.state = 646;
            this.match(OpenSearchPPLParser.COMMA);
            this.state = 647;
            localContext._query = this.relevanceQuery();
            this.state = 652;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 110) {
                {
                {
                this.state = 648;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 649;
                this.relevanceArg();
                }
                }
                this.state = 654;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 655;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
        this.enterRule(localContext, 106, OpenSearchPPLParser.RULE_multiFieldRelevanceFunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 657;
            this.multiFieldRelevanceFunctionName();
            this.state = 658;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 659;
            this.match(OpenSearchPPLParser.LT_SQR_PRTHS);
            this.state = 660;
            localContext._field = this.relevanceFieldAndWeight();
            this.state = 665;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 110) {
                {
                {
                this.state = 661;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 662;
                localContext._field = this.relevanceFieldAndWeight();
                }
                }
                this.state = 667;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 668;
            this.match(OpenSearchPPLParser.RT_SQR_PRTHS);
            this.state = 669;
            this.match(OpenSearchPPLParser.COMMA);
            this.state = 670;
            localContext._query = this.relevanceQuery();
            this.state = 675;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 110) {
                {
                {
                this.state = 671;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 672;
                this.relevanceArg();
                }
                }
                this.state = 677;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 678;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
    public tableSource(): TableSourceContext {
        let localContext = new TableSourceContext(this.context, this.state);
        this.enterRule(localContext, 108, OpenSearchPPLParser.RULE_tableSource);
        try {
            this.state = 682;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.SEARCH:
            case OpenSearchPPLParser.DESCRIBE:
            case OpenSearchPPLParser.SHOW:
            case OpenSearchPPLParser.FROM:
            case OpenSearchPPLParser.WHERE:
            case OpenSearchPPLParser.FIELDS:
            case OpenSearchPPLParser.RENAME:
            case OpenSearchPPLParser.STATS:
            case OpenSearchPPLParser.DEDUP:
            case OpenSearchPPLParser.SORT:
            case OpenSearchPPLParser.EVAL:
            case OpenSearchPPLParser.HEAD:
            case OpenSearchPPLParser.TOP:
            case OpenSearchPPLParser.RARE:
            case OpenSearchPPLParser.PARSE:
            case OpenSearchPPLParser.METHOD:
            case OpenSearchPPLParser.REGEX:
            case OpenSearchPPLParser.PUNCT:
            case OpenSearchPPLParser.GROK:
            case OpenSearchPPLParser.PATTERN:
            case OpenSearchPPLParser.PATTERNS:
            case OpenSearchPPLParser.NEW_FIELD:
            case OpenSearchPPLParser.KMEANS:
            case OpenSearchPPLParser.AD:
            case OpenSearchPPLParser.ML:
            case OpenSearchPPLParser.SOURCE:
            case OpenSearchPPLParser.INDEX:
            case OpenSearchPPLParser.D:
            case OpenSearchPPLParser.DESC:
            case OpenSearchPPLParser.DATASOURCES:
            case OpenSearchPPLParser.SORTBY:
            case OpenSearchPPLParser.STR:
            case OpenSearchPPLParser.IP:
            case OpenSearchPPLParser.NUM:
            case OpenSearchPPLParser.KEEPEMPTY:
            case OpenSearchPPLParser.CONSECUTIVE:
            case OpenSearchPPLParser.DEDUP_SPLITVALUES:
            case OpenSearchPPLParser.PARTITIONS:
            case OpenSearchPPLParser.ALLNUM:
            case OpenSearchPPLParser.DELIM:
            case OpenSearchPPLParser.CENTROIDS:
            case OpenSearchPPLParser.ITERATIONS:
            case OpenSearchPPLParser.DISTANCE_TYPE:
            case OpenSearchPPLParser.NUMBER_OF_TREES:
            case OpenSearchPPLParser.SHINGLE_SIZE:
            case OpenSearchPPLParser.SAMPLE_SIZE:
            case OpenSearchPPLParser.OUTPUT_AFTER:
            case OpenSearchPPLParser.TIME_DECAY:
            case OpenSearchPPLParser.ANOMALY_RATE:
            case OpenSearchPPLParser.CATEGORY_FIELD:
            case OpenSearchPPLParser.TIME_FIELD:
            case OpenSearchPPLParser.TIME_ZONE:
            case OpenSearchPPLParser.TRAINING_DATA_SIZE:
            case OpenSearchPPLParser.ANOMALY_SCORE_THRESHOLD:
            case OpenSearchPPLParser.CONVERT_TZ:
            case OpenSearchPPLParser.DATETIME:
            case OpenSearchPPLParser.DAY:
            case OpenSearchPPLParser.DAY_HOUR:
            case OpenSearchPPLParser.DAY_MICROSECOND:
            case OpenSearchPPLParser.DAY_MINUTE:
            case OpenSearchPPLParser.DAY_OF_YEAR:
            case OpenSearchPPLParser.DAY_SECOND:
            case OpenSearchPPLParser.HOUR:
            case OpenSearchPPLParser.HOUR_MICROSECOND:
            case OpenSearchPPLParser.HOUR_MINUTE:
            case OpenSearchPPLParser.HOUR_OF_DAY:
            case OpenSearchPPLParser.HOUR_SECOND:
            case OpenSearchPPLParser.MICROSECOND:
            case OpenSearchPPLParser.MILLISECOND:
            case OpenSearchPPLParser.MINUTE:
            case OpenSearchPPLParser.MINUTE_MICROSECOND:
            case OpenSearchPPLParser.MINUTE_OF_DAY:
            case OpenSearchPPLParser.MINUTE_OF_HOUR:
            case OpenSearchPPLParser.MINUTE_SECOND:
            case OpenSearchPPLParser.MONTH:
            case OpenSearchPPLParser.MONTH_OF_YEAR:
            case OpenSearchPPLParser.QUARTER:
            case OpenSearchPPLParser.SECOND:
            case OpenSearchPPLParser.SECOND_MICROSECOND:
            case OpenSearchPPLParser.SECOND_OF_MINUTE:
            case OpenSearchPPLParser.WEEK:
            case OpenSearchPPLParser.WEEK_OF_YEAR:
            case OpenSearchPPLParser.YEAR:
            case OpenSearchPPLParser.YEAR_MONTH:
            case OpenSearchPPLParser.DOT:
            case OpenSearchPPLParser.BACKTICK:
            case OpenSearchPPLParser.AVG:
            case OpenSearchPPLParser.COUNT:
            case OpenSearchPPLParser.DISTINCT_COUNT:
            case OpenSearchPPLParser.ESTDC:
            case OpenSearchPPLParser.ESTDC_ERROR:
            case OpenSearchPPLParser.MAX:
            case OpenSearchPPLParser.MEAN:
            case OpenSearchPPLParser.MEDIAN:
            case OpenSearchPPLParser.MIN:
            case OpenSearchPPLParser.MODE:
            case OpenSearchPPLParser.RANGE:
            case OpenSearchPPLParser.STDEV:
            case OpenSearchPPLParser.STDEVP:
            case OpenSearchPPLParser.SUM:
            case OpenSearchPPLParser.SUMSQ:
            case OpenSearchPPLParser.VAR_SAMP:
            case OpenSearchPPLParser.VAR_POP:
            case OpenSearchPPLParser.STDDEV_SAMP:
            case OpenSearchPPLParser.STDDEV_POP:
            case OpenSearchPPLParser.PERCENTILE:
            case OpenSearchPPLParser.TAKE:
            case OpenSearchPPLParser.FIRST:
            case OpenSearchPPLParser.LAST:
            case OpenSearchPPLParser.LIST:
            case OpenSearchPPLParser.VALUES:
            case OpenSearchPPLParser.EARLIEST:
            case OpenSearchPPLParser.EARLIEST_TIME:
            case OpenSearchPPLParser.LATEST:
            case OpenSearchPPLParser.LATEST_TIME:
            case OpenSearchPPLParser.PER_DAY:
            case OpenSearchPPLParser.PER_HOUR:
            case OpenSearchPPLParser.PER_MINUTE:
            case OpenSearchPPLParser.PER_SECOND:
            case OpenSearchPPLParser.RATE:
            case OpenSearchPPLParser.SPARKLINE:
            case OpenSearchPPLParser.C:
            case OpenSearchPPLParser.DC:
            case OpenSearchPPLParser.ABS:
            case OpenSearchPPLParser.CBRT:
            case OpenSearchPPLParser.CEIL:
            case OpenSearchPPLParser.CEILING:
            case OpenSearchPPLParser.CONV:
            case OpenSearchPPLParser.CRC32:
            case OpenSearchPPLParser.E:
            case OpenSearchPPLParser.EXP:
            case OpenSearchPPLParser.FLOOR:
            case OpenSearchPPLParser.LN:
            case OpenSearchPPLParser.LOG:
            case OpenSearchPPLParser.LOG10:
            case OpenSearchPPLParser.LOG2:
            case OpenSearchPPLParser.MOD:
            case OpenSearchPPLParser.PI:
            case OpenSearchPPLParser.POSITION:
            case OpenSearchPPLParser.POW:
            case OpenSearchPPLParser.POWER:
            case OpenSearchPPLParser.RAND:
            case OpenSearchPPLParser.ROUND:
            case OpenSearchPPLParser.SIGN:
            case OpenSearchPPLParser.SQRT:
            case OpenSearchPPLParser.TRUNCATE:
            case OpenSearchPPLParser.ACOS:
            case OpenSearchPPLParser.ASIN:
            case OpenSearchPPLParser.ATAN:
            case OpenSearchPPLParser.ATAN2:
            case OpenSearchPPLParser.COS:
            case OpenSearchPPLParser.COT:
            case OpenSearchPPLParser.DEGREES:
            case OpenSearchPPLParser.RADIANS:
            case OpenSearchPPLParser.SIN:
            case OpenSearchPPLParser.TAN:
            case OpenSearchPPLParser.ADDDATE:
            case OpenSearchPPLParser.ADDTIME:
            case OpenSearchPPLParser.CURDATE:
            case OpenSearchPPLParser.CURRENT_DATE:
            case OpenSearchPPLParser.CURRENT_TIME:
            case OpenSearchPPLParser.CURRENT_TIMESTAMP:
            case OpenSearchPPLParser.CURTIME:
            case OpenSearchPPLParser.DATE:
            case OpenSearchPPLParser.DATEDIFF:
            case OpenSearchPPLParser.DATE_ADD:
            case OpenSearchPPLParser.DATE_FORMAT:
            case OpenSearchPPLParser.DATE_SUB:
            case OpenSearchPPLParser.DAYNAME:
            case OpenSearchPPLParser.DAYOFMONTH:
            case OpenSearchPPLParser.DAYOFWEEK:
            case OpenSearchPPLParser.DAYOFYEAR:
            case OpenSearchPPLParser.DAY_OF_MONTH:
            case OpenSearchPPLParser.DAY_OF_WEEK:
            case OpenSearchPPLParser.FROM_DAYS:
            case OpenSearchPPLParser.FROM_UNIXTIME:
            case OpenSearchPPLParser.LAST_DAY:
            case OpenSearchPPLParser.LOCALTIME:
            case OpenSearchPPLParser.LOCALTIMESTAMP:
            case OpenSearchPPLParser.MAKEDATE:
            case OpenSearchPPLParser.MAKETIME:
            case OpenSearchPPLParser.MONTHNAME:
            case OpenSearchPPLParser.NOW:
            case OpenSearchPPLParser.PERIOD_ADD:
            case OpenSearchPPLParser.PERIOD_DIFF:
            case OpenSearchPPLParser.SEC_TO_TIME:
            case OpenSearchPPLParser.STR_TO_DATE:
            case OpenSearchPPLParser.SUBDATE:
            case OpenSearchPPLParser.SUBTIME:
            case OpenSearchPPLParser.SYSDATE:
            case OpenSearchPPLParser.TIME:
            case OpenSearchPPLParser.TIMEDIFF:
            case OpenSearchPPLParser.TIMESTAMP:
            case OpenSearchPPLParser.TIME_FORMAT:
            case OpenSearchPPLParser.TIME_TO_SEC:
            case OpenSearchPPLParser.TO_DAYS:
            case OpenSearchPPLParser.TO_SECONDS:
            case OpenSearchPPLParser.UNIX_TIMESTAMP:
            case OpenSearchPPLParser.UTC_DATE:
            case OpenSearchPPLParser.UTC_TIME:
            case OpenSearchPPLParser.UTC_TIMESTAMP:
            case OpenSearchPPLParser.WEEKDAY:
            case OpenSearchPPLParser.YEARWEEK:
            case OpenSearchPPLParser.SUBSTR:
            case OpenSearchPPLParser.SUBSTRING:
            case OpenSearchPPLParser.LTRIM:
            case OpenSearchPPLParser.RTRIM:
            case OpenSearchPPLParser.TRIM:
            case OpenSearchPPLParser.LOWER:
            case OpenSearchPPLParser.UPPER:
            case OpenSearchPPLParser.CONCAT:
            case OpenSearchPPLParser.CONCAT_WS:
            case OpenSearchPPLParser.LENGTH:
            case OpenSearchPPLParser.STRCMP:
            case OpenSearchPPLParser.RIGHT:
            case OpenSearchPPLParser.LEFT:
            case OpenSearchPPLParser.ASCII:
            case OpenSearchPPLParser.LOCATE:
            case OpenSearchPPLParser.REPLACE:
            case OpenSearchPPLParser.REVERSE:
            case OpenSearchPPLParser.LIKE:
            case OpenSearchPPLParser.ISNULL:
            case OpenSearchPPLParser.ISNOTNULL:
            case OpenSearchPPLParser.IFNULL:
            case OpenSearchPPLParser.NULLIF:
            case OpenSearchPPLParser.IF:
            case OpenSearchPPLParser.TYPEOF:
            case OpenSearchPPLParser.ALLOW_LEADING_WILDCARD:
            case OpenSearchPPLParser.ANALYZE_WILDCARD:
            case OpenSearchPPLParser.ANALYZER:
            case OpenSearchPPLParser.AUTO_GENERATE_SYNONYMS_PHRASE_QUERY:
            case OpenSearchPPLParser.BOOST:
            case OpenSearchPPLParser.CUTOFF_FREQUENCY:
            case OpenSearchPPLParser.DEFAULT_FIELD:
            case OpenSearchPPLParser.DEFAULT_OPERATOR:
            case OpenSearchPPLParser.ENABLE_POSITION_INCREMENTS:
            case OpenSearchPPLParser.ESCAPE:
            case OpenSearchPPLParser.FLAGS:
            case OpenSearchPPLParser.FUZZY_MAX_EXPANSIONS:
            case OpenSearchPPLParser.FUZZY_PREFIX_LENGTH:
            case OpenSearchPPLParser.FUZZY_TRANSPOSITIONS:
            case OpenSearchPPLParser.FUZZY_REWRITE:
            case OpenSearchPPLParser.FUZZINESS:
            case OpenSearchPPLParser.LENIENT:
            case OpenSearchPPLParser.LOW_FREQ_OPERATOR:
            case OpenSearchPPLParser.MAX_DETERMINIZED_STATES:
            case OpenSearchPPLParser.MAX_EXPANSIONS:
            case OpenSearchPPLParser.MINIMUM_SHOULD_MATCH:
            case OpenSearchPPLParser.OPERATOR:
            case OpenSearchPPLParser.PHRASE_SLOP:
            case OpenSearchPPLParser.PREFIX_LENGTH:
            case OpenSearchPPLParser.QUOTE_ANALYZER:
            case OpenSearchPPLParser.QUOTE_FIELD_SUFFIX:
            case OpenSearchPPLParser.REWRITE:
            case OpenSearchPPLParser.SLOP:
            case OpenSearchPPLParser.TIE_BREAKER:
            case OpenSearchPPLParser.TYPE:
            case OpenSearchPPLParser.ZERO_TERMS_QUERY:
            case OpenSearchPPLParser.SPAN:
            case OpenSearchPPLParser.MS:
            case OpenSearchPPLParser.S:
            case OpenSearchPPLParser.M:
            case OpenSearchPPLParser.H:
            case OpenSearchPPLParser.W:
            case OpenSearchPPLParser.Q:
            case OpenSearchPPLParser.Y:
            case OpenSearchPPLParser.ID:
            case OpenSearchPPLParser.CLUSTER:
            case OpenSearchPPLParser.BQUOTA_STRING:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 680;
                this.tableQualifiedName();
                }
                break;
            case OpenSearchPPLParser.ID_DATE_SUFFIX:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 681;
                this.match(OpenSearchPPLParser.ID_DATE_SUFFIX);
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
    public tableFunction(): TableFunctionContext {
        let localContext = new TableFunctionContext(this.context, this.state);
        this.enterRule(localContext, 110, OpenSearchPPLParser.RULE_tableFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 684;
            this.qualifiedName();
            this.state = 685;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 686;
            this.functionArgs();
            this.state = 687;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
    public fieldList(): FieldListContext {
        let localContext = new FieldListContext(this.context, this.state);
        this.enterRule(localContext, 112, OpenSearchPPLParser.RULE_fieldList);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 689;
            this.fieldExpression();
            this.state = 694;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 110) {
                {
                {
                this.state = 690;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 691;
                this.fieldExpression();
                }
                }
                this.state = 696;
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
    public wcFieldList(): WcFieldListContext {
        let localContext = new WcFieldListContext(this.context, this.state);
        this.enterRule(localContext, 114, OpenSearchPPLParser.RULE_wcFieldList);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 697;
            this.wcFieldExpression();
            this.state = 702;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 110) {
                {
                {
                this.state = 698;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 699;
                this.wcFieldExpression();
                }
                }
                this.state = 704;
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
    public sortField(): SortFieldContext {
        let localContext = new SortFieldContext(this.context, this.state);
        this.enterRule(localContext, 116, OpenSearchPPLParser.RULE_sortField);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 706;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 118 || _la === 119) {
                {
                this.state = 705;
                _la = this.tokenStream.LA(1);
                if(!(_la === 118 || _la === 119)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
            }

            this.state = 708;
            this.sortFieldExpression();
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
    public sortFieldExpression(): SortFieldExpressionContext {
        let localContext = new SortFieldExpressionContext(this.context, this.state);
        this.enterRule(localContext, 118, OpenSearchPPLParser.RULE_sortFieldExpression);
        try {
            this.state = 731;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 710;
                this.fieldExpression();
                }
                break;
            case OpenSearchPPLParser.AUTO:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 711;
                this.match(OpenSearchPPLParser.AUTO);
                this.state = 712;
                this.match(OpenSearchPPLParser.LT_PRTHS);
                this.state = 713;
                this.fieldExpression();
                this.state = 714;
                this.match(OpenSearchPPLParser.RT_PRTHS);
                }
                break;
            case OpenSearchPPLParser.STR:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 716;
                this.match(OpenSearchPPLParser.STR);
                this.state = 717;
                this.match(OpenSearchPPLParser.LT_PRTHS);
                this.state = 718;
                this.fieldExpression();
                this.state = 719;
                this.match(OpenSearchPPLParser.RT_PRTHS);
                }
                break;
            case OpenSearchPPLParser.IP:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 721;
                this.match(OpenSearchPPLParser.IP);
                this.state = 722;
                this.match(OpenSearchPPLParser.LT_PRTHS);
                this.state = 723;
                this.fieldExpression();
                this.state = 724;
                this.match(OpenSearchPPLParser.RT_PRTHS);
                }
                break;
            case OpenSearchPPLParser.NUM:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 726;
                this.match(OpenSearchPPLParser.NUM);
                this.state = 727;
                this.match(OpenSearchPPLParser.LT_PRTHS);
                this.state = 728;
                this.fieldExpression();
                this.state = 729;
                this.match(OpenSearchPPLParser.RT_PRTHS);
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
    public fieldExpression(): FieldExpressionContext {
        let localContext = new FieldExpressionContext(this.context, this.state);
        this.enterRule(localContext, 120, OpenSearchPPLParser.RULE_fieldExpression);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 733;
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
    public wcFieldExpression(): WcFieldExpressionContext {
        let localContext = new WcFieldExpressionContext(this.context, this.state);
        this.enterRule(localContext, 122, OpenSearchPPLParser.RULE_wcFieldExpression);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 735;
            this.wcQualifiedName();
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
    public evalFunctionCall(): EvalFunctionCallContext {
        let localContext = new EvalFunctionCallContext(this.context, this.state);
        this.enterRule(localContext, 124, OpenSearchPPLParser.RULE_evalFunctionCall);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 737;
            this.evalFunctionName();
            this.state = 738;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 739;
            this.functionArgs();
            this.state = 740;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
    public dataTypeFunctionCall(): DataTypeFunctionCallContext {
        let localContext = new DataTypeFunctionCallContext(this.context, this.state);
        this.enterRule(localContext, 126, OpenSearchPPLParser.RULE_dataTypeFunctionCall);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 742;
            this.match(OpenSearchPPLParser.CAST);
            this.state = 743;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 744;
            this.expression();
            this.state = 745;
            this.match(OpenSearchPPLParser.AS);
            this.state = 746;
            this.convertedDataType();
            this.state = 747;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
    public booleanFunctionCall(): BooleanFunctionCallContext {
        let localContext = new BooleanFunctionCallContext(this.context, this.state);
        this.enterRule(localContext, 128, OpenSearchPPLParser.RULE_booleanFunctionCall);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 749;
            this.conditionFunctionBase();
            this.state = 750;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 751;
            this.functionArgs();
            this.state = 752;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
        this.enterRule(localContext, 130, OpenSearchPPLParser.RULE_convertedDataType);
        try {
            this.state = 764;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.DATE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 754;
                localContext._typeName = this.match(OpenSearchPPLParser.DATE);
                }
                break;
            case OpenSearchPPLParser.TIME:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 755;
                localContext._typeName = this.match(OpenSearchPPLParser.TIME);
                }
                break;
            case OpenSearchPPLParser.TIMESTAMP:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 756;
                localContext._typeName = this.match(OpenSearchPPLParser.TIMESTAMP);
                }
                break;
            case OpenSearchPPLParser.INT:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 757;
                localContext._typeName = this.match(OpenSearchPPLParser.INT);
                }
                break;
            case OpenSearchPPLParser.INTEGER:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 758;
                localContext._typeName = this.match(OpenSearchPPLParser.INTEGER);
                }
                break;
            case OpenSearchPPLParser.DOUBLE:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 759;
                localContext._typeName = this.match(OpenSearchPPLParser.DOUBLE);
                }
                break;
            case OpenSearchPPLParser.LONG:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 760;
                localContext._typeName = this.match(OpenSearchPPLParser.LONG);
                }
                break;
            case OpenSearchPPLParser.FLOAT:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 761;
                localContext._typeName = this.match(OpenSearchPPLParser.FLOAT);
                }
                break;
            case OpenSearchPPLParser.STRING:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 762;
                localContext._typeName = this.match(OpenSearchPPLParser.STRING);
                }
                break;
            case OpenSearchPPLParser.BOOLEAN:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 763;
                localContext._typeName = this.match(OpenSearchPPLParser.BOOLEAN);
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
    public evalFunctionName(): EvalFunctionNameContext {
        let localContext = new EvalFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 132, OpenSearchPPLParser.RULE_evalFunctionName);
        try {
            this.state = 772;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.ABS:
            case OpenSearchPPLParser.CBRT:
            case OpenSearchPPLParser.CEIL:
            case OpenSearchPPLParser.CEILING:
            case OpenSearchPPLParser.CONV:
            case OpenSearchPPLParser.CRC32:
            case OpenSearchPPLParser.E:
            case OpenSearchPPLParser.EXP:
            case OpenSearchPPLParser.FLOOR:
            case OpenSearchPPLParser.LN:
            case OpenSearchPPLParser.LOG:
            case OpenSearchPPLParser.LOG10:
            case OpenSearchPPLParser.LOG2:
            case OpenSearchPPLParser.MOD:
            case OpenSearchPPLParser.PI:
            case OpenSearchPPLParser.POW:
            case OpenSearchPPLParser.POWER:
            case OpenSearchPPLParser.RAND:
            case OpenSearchPPLParser.ROUND:
            case OpenSearchPPLParser.SIGN:
            case OpenSearchPPLParser.SQRT:
            case OpenSearchPPLParser.TRUNCATE:
            case OpenSearchPPLParser.ACOS:
            case OpenSearchPPLParser.ASIN:
            case OpenSearchPPLParser.ATAN:
            case OpenSearchPPLParser.ATAN2:
            case OpenSearchPPLParser.COS:
            case OpenSearchPPLParser.COT:
            case OpenSearchPPLParser.DEGREES:
            case OpenSearchPPLParser.RADIANS:
            case OpenSearchPPLParser.SIN:
            case OpenSearchPPLParser.TAN:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 766;
                this.mathematicalFunctionName();
                }
                break;
            case OpenSearchPPLParser.CONVERT_TZ:
            case OpenSearchPPLParser.DATETIME:
            case OpenSearchPPLParser.DAY:
            case OpenSearchPPLParser.DAY_OF_YEAR:
            case OpenSearchPPLParser.HOUR:
            case OpenSearchPPLParser.HOUR_OF_DAY:
            case OpenSearchPPLParser.MICROSECOND:
            case OpenSearchPPLParser.MINUTE:
            case OpenSearchPPLParser.MINUTE_OF_DAY:
            case OpenSearchPPLParser.MINUTE_OF_HOUR:
            case OpenSearchPPLParser.MONTH:
            case OpenSearchPPLParser.MONTH_OF_YEAR:
            case OpenSearchPPLParser.QUARTER:
            case OpenSearchPPLParser.SECOND:
            case OpenSearchPPLParser.SECOND_OF_MINUTE:
            case OpenSearchPPLParser.WEEK:
            case OpenSearchPPLParser.WEEK_OF_YEAR:
            case OpenSearchPPLParser.YEAR:
            case OpenSearchPPLParser.ADDDATE:
            case OpenSearchPPLParser.ADDTIME:
            case OpenSearchPPLParser.CURDATE:
            case OpenSearchPPLParser.CURRENT_DATE:
            case OpenSearchPPLParser.CURRENT_TIME:
            case OpenSearchPPLParser.CURRENT_TIMESTAMP:
            case OpenSearchPPLParser.CURTIME:
            case OpenSearchPPLParser.DATE:
            case OpenSearchPPLParser.DATEDIFF:
            case OpenSearchPPLParser.DATE_ADD:
            case OpenSearchPPLParser.DATE_FORMAT:
            case OpenSearchPPLParser.DATE_SUB:
            case OpenSearchPPLParser.DAYNAME:
            case OpenSearchPPLParser.DAYOFMONTH:
            case OpenSearchPPLParser.DAYOFWEEK:
            case OpenSearchPPLParser.DAYOFYEAR:
            case OpenSearchPPLParser.DAY_OF_MONTH:
            case OpenSearchPPLParser.DAY_OF_WEEK:
            case OpenSearchPPLParser.FROM_DAYS:
            case OpenSearchPPLParser.FROM_UNIXTIME:
            case OpenSearchPPLParser.LAST_DAY:
            case OpenSearchPPLParser.LOCALTIME:
            case OpenSearchPPLParser.LOCALTIMESTAMP:
            case OpenSearchPPLParser.MAKEDATE:
            case OpenSearchPPLParser.MAKETIME:
            case OpenSearchPPLParser.MONTHNAME:
            case OpenSearchPPLParser.NOW:
            case OpenSearchPPLParser.PERIOD_ADD:
            case OpenSearchPPLParser.PERIOD_DIFF:
            case OpenSearchPPLParser.SEC_TO_TIME:
            case OpenSearchPPLParser.STR_TO_DATE:
            case OpenSearchPPLParser.SUBDATE:
            case OpenSearchPPLParser.SUBTIME:
            case OpenSearchPPLParser.SYSDATE:
            case OpenSearchPPLParser.TIME:
            case OpenSearchPPLParser.TIMEDIFF:
            case OpenSearchPPLParser.TIMESTAMP:
            case OpenSearchPPLParser.TIME_FORMAT:
            case OpenSearchPPLParser.TIME_TO_SEC:
            case OpenSearchPPLParser.TO_DAYS:
            case OpenSearchPPLParser.TO_SECONDS:
            case OpenSearchPPLParser.UNIX_TIMESTAMP:
            case OpenSearchPPLParser.UTC_DATE:
            case OpenSearchPPLParser.UTC_TIME:
            case OpenSearchPPLParser.UTC_TIMESTAMP:
            case OpenSearchPPLParser.WEEKDAY:
            case OpenSearchPPLParser.YEARWEEK:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 767;
                this.dateTimeFunctionName();
                }
                break;
            case OpenSearchPPLParser.SUBSTR:
            case OpenSearchPPLParser.SUBSTRING:
            case OpenSearchPPLParser.LTRIM:
            case OpenSearchPPLParser.RTRIM:
            case OpenSearchPPLParser.TRIM:
            case OpenSearchPPLParser.LOWER:
            case OpenSearchPPLParser.UPPER:
            case OpenSearchPPLParser.CONCAT:
            case OpenSearchPPLParser.CONCAT_WS:
            case OpenSearchPPLParser.LENGTH:
            case OpenSearchPPLParser.STRCMP:
            case OpenSearchPPLParser.RIGHT:
            case OpenSearchPPLParser.LEFT:
            case OpenSearchPPLParser.ASCII:
            case OpenSearchPPLParser.LOCATE:
            case OpenSearchPPLParser.REPLACE:
            case OpenSearchPPLParser.REVERSE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 768;
                this.textFunctionName();
                }
                break;
            case OpenSearchPPLParser.LIKE:
            case OpenSearchPPLParser.ISNULL:
            case OpenSearchPPLParser.ISNOTNULL:
            case OpenSearchPPLParser.IFNULL:
            case OpenSearchPPLParser.NULLIF:
            case OpenSearchPPLParser.IF:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 769;
                this.conditionFunctionBase();
                }
                break;
            case OpenSearchPPLParser.TYPEOF:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 770;
                this.systemFunctionName();
                }
                break;
            case OpenSearchPPLParser.POSITION:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 771;
                this.positionFunctionName();
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
    public functionArgs(): FunctionArgsContext {
        let localContext = new FunctionArgsContext(this.context, this.state);
        this.enterRule(localContext, 134, OpenSearchPPLParser.RULE_functionArgs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 782;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3892314108) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 134217719) !== 0) || ((((_la - 65)) & ~0x1F) === 0 && ((1 << (_la - 65)) & 4294967291) !== 0) || ((((_la - 97)) & ~0x1F) === 0 && ((1 << (_la - 97)) & 274743299) !== 0) || ((((_la - 131)) & ~0x1F) === 0 && ((1 << (_la - 131)) & 4294967281) !== 0) || ((((_la - 163)) & ~0x1F) === 0 && ((1 << (_la - 163)) & 4294967295) !== 0) || ((((_la - 195)) & ~0x1F) === 0 && ((1 << (_la - 195)) & 4294967295) !== 0) || ((((_la - 227)) & ~0x1F) === 0 && ((1 << (_la - 227)) & 4294967295) !== 0) || ((((_la - 259)) & ~0x1F) === 0 && ((1 << (_la - 259)) & 3229614075) !== 0) || ((((_la - 291)) & ~0x1F) === 0 && ((1 << (_la - 291)) & 4294967295) !== 0) || ((((_la - 323)) & ~0x1F) === 0 && ((1 << (_la - 323)) & 7615) !== 0)) {
                {
                this.state = 774;
                this.functionArg();
                this.state = 779;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 110) {
                    {
                    {
                    this.state = 775;
                    this.match(OpenSearchPPLParser.COMMA);
                    this.state = 776;
                    this.functionArg();
                    }
                    }
                    this.state = 781;
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
        this.enterRule(localContext, 136, OpenSearchPPLParser.RULE_functionArg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 787;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 58, this.context) ) {
            case 1:
                {
                this.state = 784;
                this.ident();
                this.state = 785;
                this.match(OpenSearchPPLParser.EQUAL);
                }
                break;
            }
            this.state = 789;
            this.valueExpression();
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
        this.enterRule(localContext, 138, OpenSearchPPLParser.RULE_relevanceArg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 791;
            this.relevanceArgName();
            this.state = 792;
            this.match(OpenSearchPPLParser.EQUAL);
            this.state = 793;
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
    public relevanceArgName(): RelevanceArgNameContext {
        let localContext = new RelevanceArgNameContext(this.context, this.state);
        this.enterRule(localContext, 140, OpenSearchPPLParser.RULE_relevanceArgName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 795;
            _la = this.tokenStream.LA(1);
            if(!(_la === 7 || _la === 56 || ((((_la - 289)) & ~0x1F) === 0 && ((1 << (_la - 289)) & 2147483647) !== 0))) {
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
        this.enterRule(localContext, 142, OpenSearchPPLParser.RULE_relevanceFieldAndWeight);
        try {
            this.state = 805;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 59, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 797;
                localContext._field = this.relevanceField();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 798;
                localContext._field = this.relevanceField();
                this.state = 799;
                localContext._weight = this.relevanceFieldWeight();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 801;
                localContext._field = this.relevanceField();
                this.state = 802;
                this.match(OpenSearchPPLParser.BIT_XOR_OP);
                this.state = 803;
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
        this.enterRule(localContext, 144, OpenSearchPPLParser.RULE_relevanceFieldWeight);
        try {
            this.state = 809;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 60, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 807;
                this.integerLiteral();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 808;
                this.decimalLiteral();
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
    public relevanceField(): RelevanceFieldContext {
        let localContext = new RelevanceFieldContext(this.context, this.state);
        this.enterRule(localContext, 146, OpenSearchPPLParser.RULE_relevanceField);
        try {
            this.state = 813;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 811;
                this.qualifiedName();
                }
                break;
            case OpenSearchPPLParser.DQUOTA_STRING:
            case OpenSearchPPLParser.SQUOTA_STRING:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 812;
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
        this.enterRule(localContext, 148, OpenSearchPPLParser.RULE_relevanceQuery);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 815;
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
        this.enterRule(localContext, 150, OpenSearchPPLParser.RULE_relevanceArgValue);
        try {
            this.state = 819;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 817;
                this.qualifiedName();
                }
                break;
            case OpenSearchPPLParser.TRUE:
            case OpenSearchPPLParser.FALSE:
            case OpenSearchPPLParser.INTERVAL:
            case OpenSearchPPLParser.PLUS:
            case OpenSearchPPLParser.MINUS:
            case OpenSearchPPLParser.DATE:
            case OpenSearchPPLParser.TIME:
            case OpenSearchPPLParser.TIMESTAMP:
            case OpenSearchPPLParser.INTEGER_LITERAL:
            case OpenSearchPPLParser.DECIMAL_LITERAL:
            case OpenSearchPPLParser.DQUOTA_STRING:
            case OpenSearchPPLParser.SQUOTA_STRING:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 818;
                this.literalValue();
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
    public mathematicalFunctionName(): MathematicalFunctionNameContext {
        let localContext = new MathematicalFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 152, OpenSearchPPLParser.RULE_mathematicalFunctionName);
        try {
            this.state = 844;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.ABS:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 821;
                this.match(OpenSearchPPLParser.ABS);
                }
                break;
            case OpenSearchPPLParser.CBRT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 822;
                this.match(OpenSearchPPLParser.CBRT);
                }
                break;
            case OpenSearchPPLParser.CEIL:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 823;
                this.match(OpenSearchPPLParser.CEIL);
                }
                break;
            case OpenSearchPPLParser.CEILING:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 824;
                this.match(OpenSearchPPLParser.CEILING);
                }
                break;
            case OpenSearchPPLParser.CONV:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 825;
                this.match(OpenSearchPPLParser.CONV);
                }
                break;
            case OpenSearchPPLParser.CRC32:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 826;
                this.match(OpenSearchPPLParser.CRC32);
                }
                break;
            case OpenSearchPPLParser.E:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 827;
                this.match(OpenSearchPPLParser.E);
                }
                break;
            case OpenSearchPPLParser.EXP:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 828;
                this.match(OpenSearchPPLParser.EXP);
                }
                break;
            case OpenSearchPPLParser.FLOOR:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 829;
                this.match(OpenSearchPPLParser.FLOOR);
                }
                break;
            case OpenSearchPPLParser.LN:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 830;
                this.match(OpenSearchPPLParser.LN);
                }
                break;
            case OpenSearchPPLParser.LOG:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 831;
                this.match(OpenSearchPPLParser.LOG);
                }
                break;
            case OpenSearchPPLParser.LOG10:
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 832;
                this.match(OpenSearchPPLParser.LOG10);
                }
                break;
            case OpenSearchPPLParser.LOG2:
                this.enterOuterAlt(localContext, 13);
                {
                this.state = 833;
                this.match(OpenSearchPPLParser.LOG2);
                }
                break;
            case OpenSearchPPLParser.MOD:
                this.enterOuterAlt(localContext, 14);
                {
                this.state = 834;
                this.match(OpenSearchPPLParser.MOD);
                }
                break;
            case OpenSearchPPLParser.PI:
                this.enterOuterAlt(localContext, 15);
                {
                this.state = 835;
                this.match(OpenSearchPPLParser.PI);
                }
                break;
            case OpenSearchPPLParser.POW:
                this.enterOuterAlt(localContext, 16);
                {
                this.state = 836;
                this.match(OpenSearchPPLParser.POW);
                }
                break;
            case OpenSearchPPLParser.POWER:
                this.enterOuterAlt(localContext, 17);
                {
                this.state = 837;
                this.match(OpenSearchPPLParser.POWER);
                }
                break;
            case OpenSearchPPLParser.RAND:
                this.enterOuterAlt(localContext, 18);
                {
                this.state = 838;
                this.match(OpenSearchPPLParser.RAND);
                }
                break;
            case OpenSearchPPLParser.ROUND:
                this.enterOuterAlt(localContext, 19);
                {
                this.state = 839;
                this.match(OpenSearchPPLParser.ROUND);
                }
                break;
            case OpenSearchPPLParser.SIGN:
                this.enterOuterAlt(localContext, 20);
                {
                this.state = 840;
                this.match(OpenSearchPPLParser.SIGN);
                }
                break;
            case OpenSearchPPLParser.SQRT:
                this.enterOuterAlt(localContext, 21);
                {
                this.state = 841;
                this.match(OpenSearchPPLParser.SQRT);
                }
                break;
            case OpenSearchPPLParser.TRUNCATE:
                this.enterOuterAlt(localContext, 22);
                {
                this.state = 842;
                this.match(OpenSearchPPLParser.TRUNCATE);
                }
                break;
            case OpenSearchPPLParser.ACOS:
            case OpenSearchPPLParser.ASIN:
            case OpenSearchPPLParser.ATAN:
            case OpenSearchPPLParser.ATAN2:
            case OpenSearchPPLParser.COS:
            case OpenSearchPPLParser.COT:
            case OpenSearchPPLParser.DEGREES:
            case OpenSearchPPLParser.RADIANS:
            case OpenSearchPPLParser.SIN:
            case OpenSearchPPLParser.TAN:
                this.enterOuterAlt(localContext, 23);
                {
                this.state = 843;
                this.trigonometricFunctionName();
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
    public trigonometricFunctionName(): TrigonometricFunctionNameContext {
        let localContext = new TrigonometricFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 154, OpenSearchPPLParser.RULE_trigonometricFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 846;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 195)) & ~0x1F) === 0 && ((1 << (_la - 195)) & 1023) !== 0))) {
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
        this.enterRule(localContext, 156, OpenSearchPPLParser.RULE_dateTimeFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 848;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 68)) & ~0x1F) === 0 && ((1 << (_la - 68)) & 1038960967) !== 0) || ((((_la - 205)) & ~0x1F) === 0 && ((1 << (_la - 205)) & 4292607999) !== 0) || ((((_la - 237)) & ~0x1F) === 0 && ((1 << (_la - 237)) & 523903) !== 0))) {
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
        this.enterRule(localContext, 158, OpenSearchPPLParser.RULE_getFormatFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 850;
            this.match(OpenSearchPPLParser.GET_FORMAT);
            this.state = 851;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 852;
            this.getFormatType();
            this.state = 853;
            this.match(OpenSearchPPLParser.COMMA);
            this.state = 854;
            this.functionArg();
            this.state = 855;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
        this.enterRule(localContext, 160, OpenSearchPPLParser.RULE_getFormatType);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 857;
            _la = this.tokenStream.LA(1);
            if(!(_la === 69 || ((((_la - 212)) & ~0x1F) === 0 && ((1 << (_la - 212)) & 2684354561) !== 0))) {
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
        this.enterRule(localContext, 162, OpenSearchPPLParser.RULE_extractFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 859;
            this.match(OpenSearchPPLParser.EXTRACT);
            this.state = 860;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 861;
            this.datetimePart();
            this.state = 862;
            this.match(OpenSearchPPLParser.FROM);
            this.state = 863;
            this.functionArg();
            this.state = 864;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
        this.enterRule(localContext, 164, OpenSearchPPLParser.RULE_simpleDateTimePart);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 866;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 70)) & ~0x1F) === 0 && ((1 << (_la - 70)) & 174608449) !== 0))) {
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
        this.enterRule(localContext, 166, OpenSearchPPLParser.RULE_complexDateTimePart);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 868;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 71)) & ~0x1F) === 0 && ((1 << (_la - 71)) & 138560215) !== 0))) {
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
        this.enterRule(localContext, 168, OpenSearchPPLParser.RULE_datetimePart);
        try {
            this.state = 872;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.DAY:
            case OpenSearchPPLParser.HOUR:
            case OpenSearchPPLParser.MICROSECOND:
            case OpenSearchPPLParser.MINUTE:
            case OpenSearchPPLParser.MONTH:
            case OpenSearchPPLParser.QUARTER:
            case OpenSearchPPLParser.SECOND:
            case OpenSearchPPLParser.WEEK:
            case OpenSearchPPLParser.YEAR:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 870;
                this.simpleDateTimePart();
                }
                break;
            case OpenSearchPPLParser.DAY_HOUR:
            case OpenSearchPPLParser.DAY_MICROSECOND:
            case OpenSearchPPLParser.DAY_MINUTE:
            case OpenSearchPPLParser.DAY_SECOND:
            case OpenSearchPPLParser.HOUR_MICROSECOND:
            case OpenSearchPPLParser.HOUR_MINUTE:
            case OpenSearchPPLParser.HOUR_SECOND:
            case OpenSearchPPLParser.MINUTE_MICROSECOND:
            case OpenSearchPPLParser.MINUTE_SECOND:
            case OpenSearchPPLParser.SECOND_MICROSECOND:
            case OpenSearchPPLParser.YEAR_MONTH:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 871;
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
    public timestampFunction(): TimestampFunctionContext {
        let localContext = new TimestampFunctionContext(this.context, this.state);
        this.enterRule(localContext, 170, OpenSearchPPLParser.RULE_timestampFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 874;
            this.timestampFunctionName();
            this.state = 875;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 876;
            this.simpleDateTimePart();
            this.state = 877;
            this.match(OpenSearchPPLParser.COMMA);
            this.state = 878;
            localContext._firstArg = this.functionArg();
            this.state = 879;
            this.match(OpenSearchPPLParser.COMMA);
            this.state = 880;
            localContext._secondArg = this.functionArg();
            this.state = 881;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
        this.enterRule(localContext, 172, OpenSearchPPLParser.RULE_timestampFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 883;
            _la = this.tokenStream.LA(1);
            if(!(_la === 244 || _la === 245)) {
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
    public conditionFunctionBase(): ConditionFunctionBaseContext {
        let localContext = new ConditionFunctionBaseContext(this.context, this.state);
        this.enterRule(localContext, 174, OpenSearchPPLParser.RULE_conditionFunctionBase);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 885;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 275)) & ~0x1F) === 0 && ((1 << (_la - 275)) & 63) !== 0))) {
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
    public systemFunctionName(): SystemFunctionNameContext {
        let localContext = new SystemFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 176, OpenSearchPPLParser.RULE_systemFunctionName);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 887;
            this.match(OpenSearchPPLParser.TYPEOF);
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
        this.enterRule(localContext, 178, OpenSearchPPLParser.RULE_textFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 889;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 256)) & ~0x1F) === 0 && ((1 << (_la - 256)) & 262111) !== 0))) {
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
    public positionFunctionName(): PositionFunctionNameContext {
        let localContext = new PositionFunctionNameContext(this.context, this.state);
        this.enterRule(localContext, 180, OpenSearchPPLParser.RULE_positionFunctionName);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 891;
            this.match(OpenSearchPPLParser.POSITION);
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
    public comparisonOperator(): ComparisonOperatorContext {
        let localContext = new ComparisonOperatorContext(this.context, this.state);
        this.enterRule(localContext, 182, OpenSearchPPLParser.RULE_comparisonOperator);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 893;
            _la = this.tokenStream.LA(1);
            if(!(_la === 67 || ((((_la - 112)) & ~0x1F) === 0 && ((1 << (_la - 112)) & 63) !== 0))) {
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
        this.enterRule(localContext, 184, OpenSearchPPLParser.RULE_singleFieldRelevanceFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 895;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 282)) & ~0x1F) === 0 && ((1 << (_la - 282)) & 15) !== 0))) {
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
        this.enterRule(localContext, 186, OpenSearchPPLParser.RULE_multiFieldRelevanceFunctionName);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 897;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 286)) & ~0x1F) === 0 && ((1 << (_la - 286)) & 7) !== 0))) {
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
    public literalValue(): LiteralValueContext {
        let localContext = new LiteralValueContext(this.context, this.state);
        this.enterRule(localContext, 188, OpenSearchPPLParser.RULE_literalValue);
        try {
            this.state = 905;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 65, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 899;
                this.intervalLiteral();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 900;
                this.stringLiteral();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 901;
                this.integerLiteral();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 902;
                this.decimalLiteral();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 903;
                this.booleanLiteral();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 904;
                this.datetimeLiteral();
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
    public intervalLiteral(): IntervalLiteralContext {
        let localContext = new IntervalLiteralContext(this.context, this.state);
        this.enterRule(localContext, 190, OpenSearchPPLParser.RULE_intervalLiteral);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 907;
            this.match(OpenSearchPPLParser.INTERVAL);
            this.state = 908;
            this.valueExpression();
            this.state = 909;
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
    public stringLiteral(): StringLiteralContext {
        let localContext = new StringLiteralContext(this.context, this.state);
        this.enterRule(localContext, 192, OpenSearchPPLParser.RULE_stringLiteral);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 911;
            _la = this.tokenStream.LA(1);
            if(!(_la === 333 || _la === 334)) {
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
    public integerLiteral(): IntegerLiteralContext {
        let localContext = new IntegerLiteralContext(this.context, this.state);
        this.enterRule(localContext, 194, OpenSearchPPLParser.RULE_integerLiteral);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 914;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 118 || _la === 119) {
                {
                this.state = 913;
                _la = this.tokenStream.LA(1);
                if(!(_la === 118 || _la === 119)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
            }

            this.state = 916;
            this.match(OpenSearchPPLParser.INTEGER_LITERAL);
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
        this.enterRule(localContext, 196, OpenSearchPPLParser.RULE_decimalLiteral);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 919;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 118 || _la === 119) {
                {
                this.state = 918;
                _la = this.tokenStream.LA(1);
                if(!(_la === 118 || _la === 119)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
            }

            this.state = 921;
            this.match(OpenSearchPPLParser.DECIMAL_LITERAL);
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
        this.enterRule(localContext, 198, OpenSearchPPLParser.RULE_booleanLiteral);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 923;
            _la = this.tokenStream.LA(1);
            if(!(_la === 65 || _la === 66)) {
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
    public datetimeLiteral(): DatetimeLiteralContext {
        let localContext = new DatetimeLiteralContext(this.context, this.state);
        this.enterRule(localContext, 200, OpenSearchPPLParser.RULE_datetimeLiteral);
        try {
            this.state = 928;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.DATE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 925;
                this.dateLiteral();
                }
                break;
            case OpenSearchPPLParser.TIME:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 926;
                this.timeLiteral();
                }
                break;
            case OpenSearchPPLParser.TIMESTAMP:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 927;
                this.timestampLiteral();
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
    public dateLiteral(): DateLiteralContext {
        let localContext = new DateLiteralContext(this.context, this.state);
        this.enterRule(localContext, 202, OpenSearchPPLParser.RULE_dateLiteral);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 930;
            this.match(OpenSearchPPLParser.DATE);
            this.state = 931;
            localContext._date = this.stringLiteral();
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
        this.enterRule(localContext, 204, OpenSearchPPLParser.RULE_timeLiteral);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 933;
            this.match(OpenSearchPPLParser.TIME);
            this.state = 934;
            localContext._time = this.stringLiteral();
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
        this.enterRule(localContext, 206, OpenSearchPPLParser.RULE_timestampLiteral);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 936;
            this.match(OpenSearchPPLParser.TIMESTAMP);
            this.state = 937;
            localContext._timestamp = this.stringLiteral();
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
        this.enterRule(localContext, 208, OpenSearchPPLParser.RULE_intervalUnit);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 939;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 70)) & ~0x1F) === 0 && ((1 << (_la - 70)) & 451728879) !== 0))) {
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
    public timespanUnit(): TimespanUnitContext {
        let localContext = new TimespanUnitContext(this.context, this.state);
        this.enterRule(localContext, 210, OpenSearchPPLParser.RULE_timespanUnit);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 941;
            _la = this.tokenStream.LA(1);
            if(!(_la === 31 || ((((_la - 70)) & ~0x1F) === 0 && ((1 << (_la - 70)) & 174612545) !== 0) || ((((_la - 321)) & ~0x1F) === 0 && ((1 << (_la - 321)) & 127) !== 0))) {
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
    public valueList(): ValueListContext {
        let localContext = new ValueListContext(this.context, this.state);
        this.enterRule(localContext, 212, OpenSearchPPLParser.RULE_valueList);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 943;
            this.match(OpenSearchPPLParser.LT_PRTHS);
            this.state = 944;
            this.literalValue();
            this.state = 949;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 110) {
                {
                {
                this.state = 945;
                this.match(OpenSearchPPLParser.COMMA);
                this.state = 946;
                this.literalValue();
                }
                }
                this.state = 951;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 952;
            this.match(OpenSearchPPLParser.RT_PRTHS);
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
        this.enterRule(localContext, 214, OpenSearchPPLParser.RULE_qualifiedName);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 954;
            this.match(OpenSearchPPLParser.ID);
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
    public tableQualifiedName(): TableQualifiedNameContext {
        let localContext = new TableQualifiedNameContext(this.context, this.state);
        this.enterRule(localContext, 216, OpenSearchPPLParser.RULE_tableQualifiedName);
        let _la: number;
        try {
            localContext = new IdentsAsTableQualifiedNameContext(localContext);
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 956;
            this.tableIdent();
            this.state = 961;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 111) {
                {
                {
                this.state = 957;
                this.match(OpenSearchPPLParser.DOT);
                this.state = 958;
                this.ident();
                }
                }
                this.state = 963;
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
    public wcQualifiedName(): WcQualifiedNameContext {
        let localContext = new WcQualifiedNameContext(this.context, this.state);
        this.enterRule(localContext, 218, OpenSearchPPLParser.RULE_wcQualifiedName);
        let _la: number;
        try {
            localContext = new IdentsAsWildcardQualifiedNameContext(localContext);
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 964;
            this.wildcard();
            this.state = 969;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 111) {
                {
                {
                this.state = 965;
                this.match(OpenSearchPPLParser.DOT);
                this.state = 966;
                this.wildcard();
                }
                }
                this.state = 971;
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
    public ident(): IdentContext {
        let localContext = new IdentContext(this.context, this.state);
        this.enterRule(localContext, 220, OpenSearchPPLParser.RULE_ident);
        let _la: number;
        try {
            this.state = 982;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case OpenSearchPPLParser.DOT:
            case OpenSearchPPLParser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 973;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 111) {
                    {
                    this.state = 972;
                    this.match(OpenSearchPPLParser.DOT);
                    }
                }

                this.state = 975;
                this.match(OpenSearchPPLParser.ID);
                }
                break;
            case OpenSearchPPLParser.BACKTICK:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 976;
                this.match(OpenSearchPPLParser.BACKTICK);
                this.state = 977;
                this.ident();
                this.state = 978;
                this.match(OpenSearchPPLParser.BACKTICK);
                }
                break;
            case OpenSearchPPLParser.BQUOTA_STRING:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 980;
                this.match(OpenSearchPPLParser.BQUOTA_STRING);
                }
                break;
            case OpenSearchPPLParser.SEARCH:
            case OpenSearchPPLParser.DESCRIBE:
            case OpenSearchPPLParser.SHOW:
            case OpenSearchPPLParser.FROM:
            case OpenSearchPPLParser.WHERE:
            case OpenSearchPPLParser.FIELDS:
            case OpenSearchPPLParser.RENAME:
            case OpenSearchPPLParser.STATS:
            case OpenSearchPPLParser.DEDUP:
            case OpenSearchPPLParser.SORT:
            case OpenSearchPPLParser.EVAL:
            case OpenSearchPPLParser.HEAD:
            case OpenSearchPPLParser.TOP:
            case OpenSearchPPLParser.RARE:
            case OpenSearchPPLParser.PARSE:
            case OpenSearchPPLParser.METHOD:
            case OpenSearchPPLParser.REGEX:
            case OpenSearchPPLParser.PUNCT:
            case OpenSearchPPLParser.GROK:
            case OpenSearchPPLParser.PATTERN:
            case OpenSearchPPLParser.PATTERNS:
            case OpenSearchPPLParser.NEW_FIELD:
            case OpenSearchPPLParser.KMEANS:
            case OpenSearchPPLParser.AD:
            case OpenSearchPPLParser.ML:
            case OpenSearchPPLParser.SOURCE:
            case OpenSearchPPLParser.INDEX:
            case OpenSearchPPLParser.D:
            case OpenSearchPPLParser.DESC:
            case OpenSearchPPLParser.DATASOURCES:
            case OpenSearchPPLParser.SORTBY:
            case OpenSearchPPLParser.STR:
            case OpenSearchPPLParser.IP:
            case OpenSearchPPLParser.NUM:
            case OpenSearchPPLParser.KEEPEMPTY:
            case OpenSearchPPLParser.CONSECUTIVE:
            case OpenSearchPPLParser.DEDUP_SPLITVALUES:
            case OpenSearchPPLParser.PARTITIONS:
            case OpenSearchPPLParser.ALLNUM:
            case OpenSearchPPLParser.DELIM:
            case OpenSearchPPLParser.CENTROIDS:
            case OpenSearchPPLParser.ITERATIONS:
            case OpenSearchPPLParser.DISTANCE_TYPE:
            case OpenSearchPPLParser.NUMBER_OF_TREES:
            case OpenSearchPPLParser.SHINGLE_SIZE:
            case OpenSearchPPLParser.SAMPLE_SIZE:
            case OpenSearchPPLParser.OUTPUT_AFTER:
            case OpenSearchPPLParser.TIME_DECAY:
            case OpenSearchPPLParser.ANOMALY_RATE:
            case OpenSearchPPLParser.CATEGORY_FIELD:
            case OpenSearchPPLParser.TIME_FIELD:
            case OpenSearchPPLParser.TIME_ZONE:
            case OpenSearchPPLParser.TRAINING_DATA_SIZE:
            case OpenSearchPPLParser.ANOMALY_SCORE_THRESHOLD:
            case OpenSearchPPLParser.CONVERT_TZ:
            case OpenSearchPPLParser.DATETIME:
            case OpenSearchPPLParser.DAY:
            case OpenSearchPPLParser.DAY_HOUR:
            case OpenSearchPPLParser.DAY_MICROSECOND:
            case OpenSearchPPLParser.DAY_MINUTE:
            case OpenSearchPPLParser.DAY_OF_YEAR:
            case OpenSearchPPLParser.DAY_SECOND:
            case OpenSearchPPLParser.HOUR:
            case OpenSearchPPLParser.HOUR_MICROSECOND:
            case OpenSearchPPLParser.HOUR_MINUTE:
            case OpenSearchPPLParser.HOUR_OF_DAY:
            case OpenSearchPPLParser.HOUR_SECOND:
            case OpenSearchPPLParser.MICROSECOND:
            case OpenSearchPPLParser.MILLISECOND:
            case OpenSearchPPLParser.MINUTE:
            case OpenSearchPPLParser.MINUTE_MICROSECOND:
            case OpenSearchPPLParser.MINUTE_OF_DAY:
            case OpenSearchPPLParser.MINUTE_OF_HOUR:
            case OpenSearchPPLParser.MINUTE_SECOND:
            case OpenSearchPPLParser.MONTH:
            case OpenSearchPPLParser.MONTH_OF_YEAR:
            case OpenSearchPPLParser.QUARTER:
            case OpenSearchPPLParser.SECOND:
            case OpenSearchPPLParser.SECOND_MICROSECOND:
            case OpenSearchPPLParser.SECOND_OF_MINUTE:
            case OpenSearchPPLParser.WEEK:
            case OpenSearchPPLParser.WEEK_OF_YEAR:
            case OpenSearchPPLParser.YEAR:
            case OpenSearchPPLParser.YEAR_MONTH:
            case OpenSearchPPLParser.AVG:
            case OpenSearchPPLParser.COUNT:
            case OpenSearchPPLParser.DISTINCT_COUNT:
            case OpenSearchPPLParser.ESTDC:
            case OpenSearchPPLParser.ESTDC_ERROR:
            case OpenSearchPPLParser.MAX:
            case OpenSearchPPLParser.MEAN:
            case OpenSearchPPLParser.MEDIAN:
            case OpenSearchPPLParser.MIN:
            case OpenSearchPPLParser.MODE:
            case OpenSearchPPLParser.RANGE:
            case OpenSearchPPLParser.STDEV:
            case OpenSearchPPLParser.STDEVP:
            case OpenSearchPPLParser.SUM:
            case OpenSearchPPLParser.SUMSQ:
            case OpenSearchPPLParser.VAR_SAMP:
            case OpenSearchPPLParser.VAR_POP:
            case OpenSearchPPLParser.STDDEV_SAMP:
            case OpenSearchPPLParser.STDDEV_POP:
            case OpenSearchPPLParser.PERCENTILE:
            case OpenSearchPPLParser.TAKE:
            case OpenSearchPPLParser.FIRST:
            case OpenSearchPPLParser.LAST:
            case OpenSearchPPLParser.LIST:
            case OpenSearchPPLParser.VALUES:
            case OpenSearchPPLParser.EARLIEST:
            case OpenSearchPPLParser.EARLIEST_TIME:
            case OpenSearchPPLParser.LATEST:
            case OpenSearchPPLParser.LATEST_TIME:
            case OpenSearchPPLParser.PER_DAY:
            case OpenSearchPPLParser.PER_HOUR:
            case OpenSearchPPLParser.PER_MINUTE:
            case OpenSearchPPLParser.PER_SECOND:
            case OpenSearchPPLParser.RATE:
            case OpenSearchPPLParser.SPARKLINE:
            case OpenSearchPPLParser.C:
            case OpenSearchPPLParser.DC:
            case OpenSearchPPLParser.ABS:
            case OpenSearchPPLParser.CBRT:
            case OpenSearchPPLParser.CEIL:
            case OpenSearchPPLParser.CEILING:
            case OpenSearchPPLParser.CONV:
            case OpenSearchPPLParser.CRC32:
            case OpenSearchPPLParser.E:
            case OpenSearchPPLParser.EXP:
            case OpenSearchPPLParser.FLOOR:
            case OpenSearchPPLParser.LN:
            case OpenSearchPPLParser.LOG:
            case OpenSearchPPLParser.LOG10:
            case OpenSearchPPLParser.LOG2:
            case OpenSearchPPLParser.MOD:
            case OpenSearchPPLParser.PI:
            case OpenSearchPPLParser.POSITION:
            case OpenSearchPPLParser.POW:
            case OpenSearchPPLParser.POWER:
            case OpenSearchPPLParser.RAND:
            case OpenSearchPPLParser.ROUND:
            case OpenSearchPPLParser.SIGN:
            case OpenSearchPPLParser.SQRT:
            case OpenSearchPPLParser.TRUNCATE:
            case OpenSearchPPLParser.ACOS:
            case OpenSearchPPLParser.ASIN:
            case OpenSearchPPLParser.ATAN:
            case OpenSearchPPLParser.ATAN2:
            case OpenSearchPPLParser.COS:
            case OpenSearchPPLParser.COT:
            case OpenSearchPPLParser.DEGREES:
            case OpenSearchPPLParser.RADIANS:
            case OpenSearchPPLParser.SIN:
            case OpenSearchPPLParser.TAN:
            case OpenSearchPPLParser.ADDDATE:
            case OpenSearchPPLParser.ADDTIME:
            case OpenSearchPPLParser.CURDATE:
            case OpenSearchPPLParser.CURRENT_DATE:
            case OpenSearchPPLParser.CURRENT_TIME:
            case OpenSearchPPLParser.CURRENT_TIMESTAMP:
            case OpenSearchPPLParser.CURTIME:
            case OpenSearchPPLParser.DATE:
            case OpenSearchPPLParser.DATEDIFF:
            case OpenSearchPPLParser.DATE_ADD:
            case OpenSearchPPLParser.DATE_FORMAT:
            case OpenSearchPPLParser.DATE_SUB:
            case OpenSearchPPLParser.DAYNAME:
            case OpenSearchPPLParser.DAYOFMONTH:
            case OpenSearchPPLParser.DAYOFWEEK:
            case OpenSearchPPLParser.DAYOFYEAR:
            case OpenSearchPPLParser.DAY_OF_MONTH:
            case OpenSearchPPLParser.DAY_OF_WEEK:
            case OpenSearchPPLParser.FROM_DAYS:
            case OpenSearchPPLParser.FROM_UNIXTIME:
            case OpenSearchPPLParser.LAST_DAY:
            case OpenSearchPPLParser.LOCALTIME:
            case OpenSearchPPLParser.LOCALTIMESTAMP:
            case OpenSearchPPLParser.MAKEDATE:
            case OpenSearchPPLParser.MAKETIME:
            case OpenSearchPPLParser.MONTHNAME:
            case OpenSearchPPLParser.NOW:
            case OpenSearchPPLParser.PERIOD_ADD:
            case OpenSearchPPLParser.PERIOD_DIFF:
            case OpenSearchPPLParser.SEC_TO_TIME:
            case OpenSearchPPLParser.STR_TO_DATE:
            case OpenSearchPPLParser.SUBDATE:
            case OpenSearchPPLParser.SUBTIME:
            case OpenSearchPPLParser.SYSDATE:
            case OpenSearchPPLParser.TIME:
            case OpenSearchPPLParser.TIMEDIFF:
            case OpenSearchPPLParser.TIMESTAMP:
            case OpenSearchPPLParser.TIME_FORMAT:
            case OpenSearchPPLParser.TIME_TO_SEC:
            case OpenSearchPPLParser.TO_DAYS:
            case OpenSearchPPLParser.TO_SECONDS:
            case OpenSearchPPLParser.UNIX_TIMESTAMP:
            case OpenSearchPPLParser.UTC_DATE:
            case OpenSearchPPLParser.UTC_TIME:
            case OpenSearchPPLParser.UTC_TIMESTAMP:
            case OpenSearchPPLParser.WEEKDAY:
            case OpenSearchPPLParser.YEARWEEK:
            case OpenSearchPPLParser.SUBSTR:
            case OpenSearchPPLParser.SUBSTRING:
            case OpenSearchPPLParser.LTRIM:
            case OpenSearchPPLParser.RTRIM:
            case OpenSearchPPLParser.TRIM:
            case OpenSearchPPLParser.LOWER:
            case OpenSearchPPLParser.UPPER:
            case OpenSearchPPLParser.CONCAT:
            case OpenSearchPPLParser.CONCAT_WS:
            case OpenSearchPPLParser.LENGTH:
            case OpenSearchPPLParser.STRCMP:
            case OpenSearchPPLParser.RIGHT:
            case OpenSearchPPLParser.LEFT:
            case OpenSearchPPLParser.ASCII:
            case OpenSearchPPLParser.LOCATE:
            case OpenSearchPPLParser.REPLACE:
            case OpenSearchPPLParser.REVERSE:
            case OpenSearchPPLParser.LIKE:
            case OpenSearchPPLParser.ISNULL:
            case OpenSearchPPLParser.ISNOTNULL:
            case OpenSearchPPLParser.IFNULL:
            case OpenSearchPPLParser.NULLIF:
            case OpenSearchPPLParser.IF:
            case OpenSearchPPLParser.TYPEOF:
            case OpenSearchPPLParser.ALLOW_LEADING_WILDCARD:
            case OpenSearchPPLParser.ANALYZE_WILDCARD:
            case OpenSearchPPLParser.ANALYZER:
            case OpenSearchPPLParser.AUTO_GENERATE_SYNONYMS_PHRASE_QUERY:
            case OpenSearchPPLParser.BOOST:
            case OpenSearchPPLParser.CUTOFF_FREQUENCY:
            case OpenSearchPPLParser.DEFAULT_FIELD:
            case OpenSearchPPLParser.DEFAULT_OPERATOR:
            case OpenSearchPPLParser.ENABLE_POSITION_INCREMENTS:
            case OpenSearchPPLParser.ESCAPE:
            case OpenSearchPPLParser.FLAGS:
            case OpenSearchPPLParser.FUZZY_MAX_EXPANSIONS:
            case OpenSearchPPLParser.FUZZY_PREFIX_LENGTH:
            case OpenSearchPPLParser.FUZZY_TRANSPOSITIONS:
            case OpenSearchPPLParser.FUZZY_REWRITE:
            case OpenSearchPPLParser.FUZZINESS:
            case OpenSearchPPLParser.LENIENT:
            case OpenSearchPPLParser.LOW_FREQ_OPERATOR:
            case OpenSearchPPLParser.MAX_DETERMINIZED_STATES:
            case OpenSearchPPLParser.MAX_EXPANSIONS:
            case OpenSearchPPLParser.MINIMUM_SHOULD_MATCH:
            case OpenSearchPPLParser.OPERATOR:
            case OpenSearchPPLParser.PHRASE_SLOP:
            case OpenSearchPPLParser.PREFIX_LENGTH:
            case OpenSearchPPLParser.QUOTE_ANALYZER:
            case OpenSearchPPLParser.QUOTE_FIELD_SUFFIX:
            case OpenSearchPPLParser.REWRITE:
            case OpenSearchPPLParser.SLOP:
            case OpenSearchPPLParser.TIE_BREAKER:
            case OpenSearchPPLParser.TYPE:
            case OpenSearchPPLParser.ZERO_TERMS_QUERY:
            case OpenSearchPPLParser.SPAN:
            case OpenSearchPPLParser.MS:
            case OpenSearchPPLParser.S:
            case OpenSearchPPLParser.M:
            case OpenSearchPPLParser.H:
            case OpenSearchPPLParser.W:
            case OpenSearchPPLParser.Q:
            case OpenSearchPPLParser.Y:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 981;
                this.keywordsCanBeId();
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
    public tableIdent(): TableIdentContext {
        let localContext = new TableIdentContext(this.context, this.state);
        this.enterRule(localContext, 222, OpenSearchPPLParser.RULE_tableIdent);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 985;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 329) {
                {
                this.state = 984;
                this.match(OpenSearchPPLParser.CLUSTER);
                }
            }

            this.state = 987;
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
    public wildcard(): WildcardContext {
        let localContext = new WildcardContext(this.context, this.state);
        this.enterRule(localContext, 224, OpenSearchPPLParser.RULE_wildcard);
        let _la: number;
        try {
            let alternative: number;
            this.state = 1012;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 77, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 989;
                this.ident();
                this.state = 994;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 75, this.context);
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                        {
                        this.state = 990;
                        this.match(OpenSearchPPLParser.MODULE);
                        this.state = 991;
                        this.ident();
                        }
                        }
                    }
                    this.state = 996;
                    this.errorHandler.sync(this);
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 75, this.context);
                }
                this.state = 998;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 122) {
                    {
                    this.state = 997;
                    this.match(OpenSearchPPLParser.MODULE);
                    }
                }

                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 1000;
                this.match(OpenSearchPPLParser.SINGLE_QUOTE);
                this.state = 1001;
                this.wildcard();
                this.state = 1002;
                this.match(OpenSearchPPLParser.SINGLE_QUOTE);
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 1004;
                this.match(OpenSearchPPLParser.DOUBLE_QUOTE);
                this.state = 1005;
                this.wildcard();
                this.state = 1006;
                this.match(OpenSearchPPLParser.DOUBLE_QUOTE);
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 1008;
                this.match(OpenSearchPPLParser.BACKTICK);
                this.state = 1009;
                this.wildcard();
                this.state = 1010;
                this.match(OpenSearchPPLParser.BACKTICK);
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
    public keywordsCanBeId(): KeywordsCanBeIdContext {
        let localContext = new KeywordsCanBeIdContext(this.context, this.state);
        this.enterRule(localContext, 226, OpenSearchPPLParser.RULE_keywordsCanBeId);
        try {
            this.state = 1114;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 78, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 1014;
                this.match(OpenSearchPPLParser.D);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 1015;
                this.timespanUnit();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 1016;
                this.match(OpenSearchPPLParser.SPAN);
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 1017;
                this.evalFunctionName();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 1018;
                this.relevanceArgName();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 1019;
                this.intervalUnit();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 1020;
                this.dateTimeFunctionName();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 1021;
                this.textFunctionName();
                }
                break;
            case 9:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 1022;
                this.mathematicalFunctionName();
                }
                break;
            case 10:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 1023;
                this.positionFunctionName();
                }
                break;
            case 11:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 1024;
                this.match(OpenSearchPPLParser.SEARCH);
                }
                break;
            case 12:
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 1025;
                this.match(OpenSearchPPLParser.DESCRIBE);
                }
                break;
            case 13:
                this.enterOuterAlt(localContext, 13);
                {
                this.state = 1026;
                this.match(OpenSearchPPLParser.SHOW);
                }
                break;
            case 14:
                this.enterOuterAlt(localContext, 14);
                {
                this.state = 1027;
                this.match(OpenSearchPPLParser.FROM);
                }
                break;
            case 15:
                this.enterOuterAlt(localContext, 15);
                {
                this.state = 1028;
                this.match(OpenSearchPPLParser.WHERE);
                }
                break;
            case 16:
                this.enterOuterAlt(localContext, 16);
                {
                this.state = 1029;
                this.match(OpenSearchPPLParser.FIELDS);
                }
                break;
            case 17:
                this.enterOuterAlt(localContext, 17);
                {
                this.state = 1030;
                this.match(OpenSearchPPLParser.RENAME);
                }
                break;
            case 18:
                this.enterOuterAlt(localContext, 18);
                {
                this.state = 1031;
                this.match(OpenSearchPPLParser.STATS);
                }
                break;
            case 19:
                this.enterOuterAlt(localContext, 19);
                {
                this.state = 1032;
                this.match(OpenSearchPPLParser.DEDUP);
                }
                break;
            case 20:
                this.enterOuterAlt(localContext, 20);
                {
                this.state = 1033;
                this.match(OpenSearchPPLParser.SORT);
                }
                break;
            case 21:
                this.enterOuterAlt(localContext, 21);
                {
                this.state = 1034;
                this.match(OpenSearchPPLParser.EVAL);
                }
                break;
            case 22:
                this.enterOuterAlt(localContext, 22);
                {
                this.state = 1035;
                this.match(OpenSearchPPLParser.HEAD);
                }
                break;
            case 23:
                this.enterOuterAlt(localContext, 23);
                {
                this.state = 1036;
                this.match(OpenSearchPPLParser.TOP);
                }
                break;
            case 24:
                this.enterOuterAlt(localContext, 24);
                {
                this.state = 1037;
                this.match(OpenSearchPPLParser.RARE);
                }
                break;
            case 25:
                this.enterOuterAlt(localContext, 25);
                {
                this.state = 1038;
                this.match(OpenSearchPPLParser.PARSE);
                }
                break;
            case 26:
                this.enterOuterAlt(localContext, 26);
                {
                this.state = 1039;
                this.match(OpenSearchPPLParser.METHOD);
                }
                break;
            case 27:
                this.enterOuterAlt(localContext, 27);
                {
                this.state = 1040;
                this.match(OpenSearchPPLParser.REGEX);
                }
                break;
            case 28:
                this.enterOuterAlt(localContext, 28);
                {
                this.state = 1041;
                this.match(OpenSearchPPLParser.PUNCT);
                }
                break;
            case 29:
                this.enterOuterAlt(localContext, 29);
                {
                this.state = 1042;
                this.match(OpenSearchPPLParser.GROK);
                }
                break;
            case 30:
                this.enterOuterAlt(localContext, 30);
                {
                this.state = 1043;
                this.match(OpenSearchPPLParser.PATTERN);
                }
                break;
            case 31:
                this.enterOuterAlt(localContext, 31);
                {
                this.state = 1044;
                this.match(OpenSearchPPLParser.PATTERNS);
                }
                break;
            case 32:
                this.enterOuterAlt(localContext, 32);
                {
                this.state = 1045;
                this.match(OpenSearchPPLParser.NEW_FIELD);
                }
                break;
            case 33:
                this.enterOuterAlt(localContext, 33);
                {
                this.state = 1046;
                this.match(OpenSearchPPLParser.KMEANS);
                }
                break;
            case 34:
                this.enterOuterAlt(localContext, 34);
                {
                this.state = 1047;
                this.match(OpenSearchPPLParser.AD);
                }
                break;
            case 35:
                this.enterOuterAlt(localContext, 35);
                {
                this.state = 1048;
                this.match(OpenSearchPPLParser.ML);
                }
                break;
            case 36:
                this.enterOuterAlt(localContext, 36);
                {
                this.state = 1049;
                this.match(OpenSearchPPLParser.SOURCE);
                }
                break;
            case 37:
                this.enterOuterAlt(localContext, 37);
                {
                this.state = 1050;
                this.match(OpenSearchPPLParser.INDEX);
                }
                break;
            case 38:
                this.enterOuterAlt(localContext, 38);
                {
                this.state = 1051;
                this.match(OpenSearchPPLParser.DESC);
                }
                break;
            case 39:
                this.enterOuterAlt(localContext, 39);
                {
                this.state = 1052;
                this.match(OpenSearchPPLParser.DATASOURCES);
                }
                break;
            case 40:
                this.enterOuterAlt(localContext, 40);
                {
                this.state = 1053;
                this.match(OpenSearchPPLParser.SORTBY);
                }
                break;
            case 41:
                this.enterOuterAlt(localContext, 41);
                {
                this.state = 1054;
                this.match(OpenSearchPPLParser.STR);
                }
                break;
            case 42:
                this.enterOuterAlt(localContext, 42);
                {
                this.state = 1055;
                this.match(OpenSearchPPLParser.IP);
                }
                break;
            case 43:
                this.enterOuterAlt(localContext, 43);
                {
                this.state = 1056;
                this.match(OpenSearchPPLParser.NUM);
                }
                break;
            case 44:
                this.enterOuterAlt(localContext, 44);
                {
                this.state = 1057;
                this.match(OpenSearchPPLParser.KEEPEMPTY);
                }
                break;
            case 45:
                this.enterOuterAlt(localContext, 45);
                {
                this.state = 1058;
                this.match(OpenSearchPPLParser.CONSECUTIVE);
                }
                break;
            case 46:
                this.enterOuterAlt(localContext, 46);
                {
                this.state = 1059;
                this.match(OpenSearchPPLParser.DEDUP_SPLITVALUES);
                }
                break;
            case 47:
                this.enterOuterAlt(localContext, 47);
                {
                this.state = 1060;
                this.match(OpenSearchPPLParser.PARTITIONS);
                }
                break;
            case 48:
                this.enterOuterAlt(localContext, 48);
                {
                this.state = 1061;
                this.match(OpenSearchPPLParser.ALLNUM);
                }
                break;
            case 49:
                this.enterOuterAlt(localContext, 49);
                {
                this.state = 1062;
                this.match(OpenSearchPPLParser.DELIM);
                }
                break;
            case 50:
                this.enterOuterAlt(localContext, 50);
                {
                this.state = 1063;
                this.match(OpenSearchPPLParser.CENTROIDS);
                }
                break;
            case 51:
                this.enterOuterAlt(localContext, 51);
                {
                this.state = 1064;
                this.match(OpenSearchPPLParser.ITERATIONS);
                }
                break;
            case 52:
                this.enterOuterAlt(localContext, 52);
                {
                this.state = 1065;
                this.match(OpenSearchPPLParser.DISTANCE_TYPE);
                }
                break;
            case 53:
                this.enterOuterAlt(localContext, 53);
                {
                this.state = 1066;
                this.match(OpenSearchPPLParser.NUMBER_OF_TREES);
                }
                break;
            case 54:
                this.enterOuterAlt(localContext, 54);
                {
                this.state = 1067;
                this.match(OpenSearchPPLParser.SHINGLE_SIZE);
                }
                break;
            case 55:
                this.enterOuterAlt(localContext, 55);
                {
                this.state = 1068;
                this.match(OpenSearchPPLParser.SAMPLE_SIZE);
                }
                break;
            case 56:
                this.enterOuterAlt(localContext, 56);
                {
                this.state = 1069;
                this.match(OpenSearchPPLParser.OUTPUT_AFTER);
                }
                break;
            case 57:
                this.enterOuterAlt(localContext, 57);
                {
                this.state = 1070;
                this.match(OpenSearchPPLParser.TIME_DECAY);
                }
                break;
            case 58:
                this.enterOuterAlt(localContext, 58);
                {
                this.state = 1071;
                this.match(OpenSearchPPLParser.ANOMALY_RATE);
                }
                break;
            case 59:
                this.enterOuterAlt(localContext, 59);
                {
                this.state = 1072;
                this.match(OpenSearchPPLParser.CATEGORY_FIELD);
                }
                break;
            case 60:
                this.enterOuterAlt(localContext, 60);
                {
                this.state = 1073;
                this.match(OpenSearchPPLParser.TIME_FIELD);
                }
                break;
            case 61:
                this.enterOuterAlt(localContext, 61);
                {
                this.state = 1074;
                this.match(OpenSearchPPLParser.TIME_ZONE);
                }
                break;
            case 62:
                this.enterOuterAlt(localContext, 62);
                {
                this.state = 1075;
                this.match(OpenSearchPPLParser.TRAINING_DATA_SIZE);
                }
                break;
            case 63:
                this.enterOuterAlt(localContext, 63);
                {
                this.state = 1076;
                this.match(OpenSearchPPLParser.ANOMALY_SCORE_THRESHOLD);
                }
                break;
            case 64:
                this.enterOuterAlt(localContext, 64);
                {
                this.state = 1077;
                this.match(OpenSearchPPLParser.AVG);
                }
                break;
            case 65:
                this.enterOuterAlt(localContext, 65);
                {
                this.state = 1078;
                this.match(OpenSearchPPLParser.COUNT);
                }
                break;
            case 66:
                this.enterOuterAlt(localContext, 66);
                {
                this.state = 1079;
                this.match(OpenSearchPPLParser.DISTINCT_COUNT);
                }
                break;
            case 67:
                this.enterOuterAlt(localContext, 67);
                {
                this.state = 1080;
                this.match(OpenSearchPPLParser.ESTDC);
                }
                break;
            case 68:
                this.enterOuterAlt(localContext, 68);
                {
                this.state = 1081;
                this.match(OpenSearchPPLParser.ESTDC_ERROR);
                }
                break;
            case 69:
                this.enterOuterAlt(localContext, 69);
                {
                this.state = 1082;
                this.match(OpenSearchPPLParser.MAX);
                }
                break;
            case 70:
                this.enterOuterAlt(localContext, 70);
                {
                this.state = 1083;
                this.match(OpenSearchPPLParser.MEAN);
                }
                break;
            case 71:
                this.enterOuterAlt(localContext, 71);
                {
                this.state = 1084;
                this.match(OpenSearchPPLParser.MEDIAN);
                }
                break;
            case 72:
                this.enterOuterAlt(localContext, 72);
                {
                this.state = 1085;
                this.match(OpenSearchPPLParser.MIN);
                }
                break;
            case 73:
                this.enterOuterAlt(localContext, 73);
                {
                this.state = 1086;
                this.match(OpenSearchPPLParser.MODE);
                }
                break;
            case 74:
                this.enterOuterAlt(localContext, 74);
                {
                this.state = 1087;
                this.match(OpenSearchPPLParser.RANGE);
                }
                break;
            case 75:
                this.enterOuterAlt(localContext, 75);
                {
                this.state = 1088;
                this.match(OpenSearchPPLParser.STDEV);
                }
                break;
            case 76:
                this.enterOuterAlt(localContext, 76);
                {
                this.state = 1089;
                this.match(OpenSearchPPLParser.STDEVP);
                }
                break;
            case 77:
                this.enterOuterAlt(localContext, 77);
                {
                this.state = 1090;
                this.match(OpenSearchPPLParser.SUM);
                }
                break;
            case 78:
                this.enterOuterAlt(localContext, 78);
                {
                this.state = 1091;
                this.match(OpenSearchPPLParser.SUMSQ);
                }
                break;
            case 79:
                this.enterOuterAlt(localContext, 79);
                {
                this.state = 1092;
                this.match(OpenSearchPPLParser.VAR_SAMP);
                }
                break;
            case 80:
                this.enterOuterAlt(localContext, 80);
                {
                this.state = 1093;
                this.match(OpenSearchPPLParser.VAR_POP);
                }
                break;
            case 81:
                this.enterOuterAlt(localContext, 81);
                {
                this.state = 1094;
                this.match(OpenSearchPPLParser.STDDEV_SAMP);
                }
                break;
            case 82:
                this.enterOuterAlt(localContext, 82);
                {
                this.state = 1095;
                this.match(OpenSearchPPLParser.STDDEV_POP);
                }
                break;
            case 83:
                this.enterOuterAlt(localContext, 83);
                {
                this.state = 1096;
                this.match(OpenSearchPPLParser.PERCENTILE);
                }
                break;
            case 84:
                this.enterOuterAlt(localContext, 84);
                {
                this.state = 1097;
                this.match(OpenSearchPPLParser.TAKE);
                }
                break;
            case 85:
                this.enterOuterAlt(localContext, 85);
                {
                this.state = 1098;
                this.match(OpenSearchPPLParser.FIRST);
                }
                break;
            case 86:
                this.enterOuterAlt(localContext, 86);
                {
                this.state = 1099;
                this.match(OpenSearchPPLParser.LAST);
                }
                break;
            case 87:
                this.enterOuterAlt(localContext, 87);
                {
                this.state = 1100;
                this.match(OpenSearchPPLParser.LIST);
                }
                break;
            case 88:
                this.enterOuterAlt(localContext, 88);
                {
                this.state = 1101;
                this.match(OpenSearchPPLParser.VALUES);
                }
                break;
            case 89:
                this.enterOuterAlt(localContext, 89);
                {
                this.state = 1102;
                this.match(OpenSearchPPLParser.EARLIEST);
                }
                break;
            case 90:
                this.enterOuterAlt(localContext, 90);
                {
                this.state = 1103;
                this.match(OpenSearchPPLParser.EARLIEST_TIME);
                }
                break;
            case 91:
                this.enterOuterAlt(localContext, 91);
                {
                this.state = 1104;
                this.match(OpenSearchPPLParser.LATEST);
                }
                break;
            case 92:
                this.enterOuterAlt(localContext, 92);
                {
                this.state = 1105;
                this.match(OpenSearchPPLParser.LATEST_TIME);
                }
                break;
            case 93:
                this.enterOuterAlt(localContext, 93);
                {
                this.state = 1106;
                this.match(OpenSearchPPLParser.PER_DAY);
                }
                break;
            case 94:
                this.enterOuterAlt(localContext, 94);
                {
                this.state = 1107;
                this.match(OpenSearchPPLParser.PER_HOUR);
                }
                break;
            case 95:
                this.enterOuterAlt(localContext, 95);
                {
                this.state = 1108;
                this.match(OpenSearchPPLParser.PER_MINUTE);
                }
                break;
            case 96:
                this.enterOuterAlt(localContext, 96);
                {
                this.state = 1109;
                this.match(OpenSearchPPLParser.PER_SECOND);
                }
                break;
            case 97:
                this.enterOuterAlt(localContext, 97);
                {
                this.state = 1110;
                this.match(OpenSearchPPLParser.RATE);
                }
                break;
            case 98:
                this.enterOuterAlt(localContext, 98);
                {
                this.state = 1111;
                this.match(OpenSearchPPLParser.SPARKLINE);
                }
                break;
            case 99:
                this.enterOuterAlt(localContext, 99);
                {
                this.state = 1112;
                this.match(OpenSearchPPLParser.C);
                }
                break;
            case 100:
                this.enterOuterAlt(localContext, 100);
                {
                this.state = 1113;
                this.match(OpenSearchPPLParser.DC);
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

    public override sempred(localContext: antlr.ParserRuleContext | null, ruleIndex: number, predIndex: number): boolean {
        switch (ruleIndex) {
        case 45:
            return this.logicalExpression_sempred(localContext as LogicalExpressionContext, predIndex);
        }
        return true;
    }
    private logicalExpression_sempred(localContext: LogicalExpressionContext | null, predIndex: number): boolean {
        switch (predIndex) {
        case 0:
            return this.precpred(this.context, 5);
        case 1:
            return this.precpred(this.context, 4);
        case 2:
            return this.precpred(this.context, 3);
        }
        return true;
    }

    public static readonly _serializedATN: number[] = [
        4,1,336,1117,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,
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
        7,109,2,110,7,110,2,111,7,111,2,112,7,112,2,113,7,113,1,0,3,0,230,
        8,0,1,0,1,0,1,1,1,1,1,2,1,2,1,3,1,3,1,3,5,3,241,8,3,10,3,12,3,244,
        9,3,1,4,1,4,1,4,3,4,249,8,4,1,5,1,5,1,5,1,5,1,5,1,5,1,5,1,5,1,5,
        1,5,1,5,1,5,1,5,1,5,1,5,1,5,3,5,267,8,5,1,6,3,6,270,8,6,1,6,1,6,
        1,7,1,7,1,7,1,8,1,8,1,8,1,9,1,9,1,9,1,10,1,10,3,10,285,8,10,1,10,
        1,10,1,11,1,11,1,11,1,11,5,11,293,8,11,10,11,12,11,296,9,11,1,12,
        1,12,1,12,1,12,3,12,302,8,12,1,12,1,12,1,12,3,12,307,8,12,1,12,1,
        12,1,12,3,12,312,8,12,1,12,1,12,1,12,5,12,317,8,12,10,12,12,12,320,
        9,12,1,12,3,12,323,8,12,1,12,1,12,1,12,3,12,328,8,12,1,13,1,13,3,
        13,332,8,13,1,13,1,13,1,13,1,13,3,13,338,8,13,1,13,1,13,1,13,3,13,
        343,8,13,1,14,1,14,1,14,1,15,1,15,1,15,1,15,5,15,352,8,15,10,15,
        12,15,355,9,15,1,16,1,16,3,16,359,8,16,1,16,1,16,3,16,363,8,16,1,
        17,1,17,3,17,367,8,17,1,17,1,17,3,17,371,8,17,1,18,1,18,1,18,3,18,
        376,8,18,1,19,1,19,1,19,1,19,1,20,1,20,1,20,1,20,1,21,1,21,5,21,
        388,8,21,10,21,12,21,391,9,21,1,21,1,21,1,22,1,22,1,22,1,22,1,22,
        1,22,3,22,401,8,22,1,23,1,23,1,24,1,24,5,24,407,8,24,10,24,12,24,
        410,9,24,1,25,1,25,1,25,1,25,1,25,1,25,1,25,1,25,1,25,3,25,421,8,
        25,1,26,1,26,5,26,425,8,26,10,26,12,26,428,9,26,1,27,1,27,1,27,1,
        27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,
        27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,
        27,1,27,1,27,1,27,1,27,1,27,1,27,3,27,466,8,27,1,28,1,28,5,28,470,
        8,28,10,28,12,28,473,9,28,1,29,1,29,1,29,1,29,1,30,1,30,1,30,1,30,
        1,30,1,30,3,30,485,8,30,1,31,1,31,1,32,1,32,1,32,1,32,1,33,1,33,
        1,33,1,34,1,34,1,34,1,34,1,34,1,34,1,34,1,34,1,34,3,34,505,8,34,
        1,35,1,35,1,35,3,35,510,8,35,1,36,1,36,1,36,1,36,1,36,1,36,3,36,
        518,8,36,1,36,1,36,1,37,1,37,1,37,5,37,525,8,37,10,37,12,37,528,
        9,37,1,38,1,38,1,38,1,38,1,39,1,39,1,39,3,39,537,8,39,1,40,1,40,
        1,40,1,40,1,40,1,40,1,40,1,40,1,40,1,40,1,40,1,40,1,40,1,40,1,40,
        3,40,554,8,40,1,41,1,41,1,42,1,42,1,42,1,42,1,42,3,42,563,8,42,1,
        42,1,42,1,43,1,43,1,43,1,43,1,43,1,43,1,43,1,43,1,44,1,44,1,44,3,
        44,578,8,44,1,45,1,45,1,45,1,45,1,45,1,45,3,45,586,8,45,1,45,1,45,
        1,45,1,45,1,45,3,45,593,8,45,1,45,1,45,1,45,1,45,5,45,599,8,45,10,
        45,12,45,602,9,45,1,46,1,46,1,46,1,46,1,46,1,46,1,46,1,46,3,46,612,
        8,46,1,47,1,47,1,47,1,47,1,47,1,47,1,47,1,47,1,47,3,47,623,8,47,
        1,48,1,48,1,48,1,48,3,48,629,8,48,1,49,1,49,1,49,1,49,1,49,1,49,
        1,49,1,50,1,50,1,51,1,51,3,51,642,8,51,1,52,1,52,1,52,1,52,1,52,
        1,52,1,52,5,52,651,8,52,10,52,12,52,654,9,52,1,52,1,52,1,53,1,53,
        1,53,1,53,1,53,1,53,5,53,664,8,53,10,53,12,53,667,9,53,1,53,1,53,
        1,53,1,53,1,53,5,53,674,8,53,10,53,12,53,677,9,53,1,53,1,53,1,54,
        1,54,3,54,683,8,54,1,55,1,55,1,55,1,55,1,55,1,56,1,56,1,56,5,56,
        693,8,56,10,56,12,56,696,9,56,1,57,1,57,1,57,5,57,701,8,57,10,57,
        12,57,704,9,57,1,58,3,58,707,8,58,1,58,1,58,1,59,1,59,1,59,1,59,
        1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,1,59,
        1,59,1,59,1,59,1,59,3,59,732,8,59,1,60,1,60,1,61,1,61,1,62,1,62,
        1,62,1,62,1,62,1,63,1,63,1,63,1,63,1,63,1,63,1,63,1,64,1,64,1,64,
        1,64,1,64,1,65,1,65,1,65,1,65,1,65,1,65,1,65,1,65,1,65,1,65,3,65,
        765,8,65,1,66,1,66,1,66,1,66,1,66,1,66,3,66,773,8,66,1,67,1,67,1,
        67,5,67,778,8,67,10,67,12,67,781,9,67,3,67,783,8,67,1,68,1,68,1,
        68,3,68,788,8,68,1,68,1,68,1,69,1,69,1,69,1,69,1,70,1,70,1,71,1,
        71,1,71,1,71,1,71,1,71,1,71,1,71,3,71,806,8,71,1,72,1,72,3,72,810,
        8,72,1,73,1,73,3,73,814,8,73,1,74,1,74,1,75,1,75,3,75,820,8,75,1,
        76,1,76,1,76,1,76,1,76,1,76,1,76,1,76,1,76,1,76,1,76,1,76,1,76,1,
        76,1,76,1,76,1,76,1,76,1,76,1,76,1,76,1,76,1,76,3,76,845,8,76,1,
        77,1,77,1,78,1,78,1,79,1,79,1,79,1,79,1,79,1,79,1,79,1,80,1,80,1,
        81,1,81,1,81,1,81,1,81,1,81,1,81,1,82,1,82,1,83,1,83,1,84,1,84,3,
        84,873,8,84,1,85,1,85,1,85,1,85,1,85,1,85,1,85,1,85,1,85,1,86,1,
        86,1,87,1,87,1,88,1,88,1,89,1,89,1,90,1,90,1,91,1,91,1,92,1,92,1,
        93,1,93,1,94,1,94,1,94,1,94,1,94,1,94,3,94,906,8,94,1,95,1,95,1,
        95,1,95,1,96,1,96,1,97,3,97,915,8,97,1,97,1,97,1,98,3,98,920,8,98,
        1,98,1,98,1,99,1,99,1,100,1,100,1,100,3,100,929,8,100,1,101,1,101,
        1,101,1,102,1,102,1,102,1,103,1,103,1,103,1,104,1,104,1,105,1,105,
        1,106,1,106,1,106,1,106,5,106,948,8,106,10,106,12,106,951,9,106,
        1,106,1,106,1,107,1,107,1,108,1,108,1,108,5,108,960,8,108,10,108,
        12,108,963,9,108,1,109,1,109,1,109,5,109,968,8,109,10,109,12,109,
        971,9,109,1,110,3,110,974,8,110,1,110,1,110,1,110,1,110,1,110,1,
        110,1,110,3,110,983,8,110,1,111,3,111,986,8,111,1,111,1,111,1,112,
        1,112,1,112,5,112,993,8,112,10,112,12,112,996,9,112,1,112,3,112,
        999,8,112,1,112,1,112,1,112,1,112,1,112,1,112,1,112,1,112,1,112,
        1,112,1,112,1,112,3,112,1013,8,112,1,113,1,113,1,113,1,113,1,113,
        1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,
        1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,
        1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,
        1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,
        1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,
        1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,
        1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,
        1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,1,113,
        1,113,1,113,1,113,1,113,1,113,1,113,1,113,3,113,1115,8,113,1,113,
        0,1,90,114,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,
        40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,
        84,86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,118,
        120,122,124,126,128,130,132,134,136,138,140,142,144,146,148,150,
        152,154,156,158,160,162,164,166,168,170,172,174,176,178,180,182,
        184,186,188,190,192,194,196,198,200,202,204,206,208,210,212,214,
        216,218,220,222,224,226,0,20,1,0,118,119,1,0,18,19,2,0,137,137,171,
        171,5,0,135,136,140,140,143,143,148,148,150,153,3,0,7,7,56,56,289,
        319,1,0,195,204,13,0,68,70,74,74,76,76,79,79,82,82,84,84,86,87,89,
        92,94,97,205,222,224,225,227,243,246,255,4,0,69,69,212,212,241,241,
        243,243,8,0,70,70,76,76,82,82,84,84,89,89,91,92,95,95,97,97,8,0,
        71,73,75,75,77,78,80,80,85,85,88,88,93,93,98,98,1,0,244,245,1,0,
        275,280,2,0,256,260,262,273,2,0,67,67,112,117,1,0,282,285,1,0,286,
        288,1,0,333,334,1,0,65,66,9,0,70,73,75,78,80,80,82,82,84,85,88,89,
        91,93,95,95,97,98,9,0,31,31,70,70,76,76,83,84,89,89,91,92,95,95,
        97,97,321,327,1265,0,229,1,0,0,0,2,233,1,0,0,0,4,235,1,0,0,0,6,237,
        1,0,0,0,8,248,1,0,0,0,10,266,1,0,0,0,12,269,1,0,0,0,14,273,1,0,0,
        0,16,276,1,0,0,0,18,279,1,0,0,0,20,282,1,0,0,0,22,288,1,0,0,0,24,
        297,1,0,0,0,26,329,1,0,0,0,28,344,1,0,0,0,30,347,1,0,0,0,32,356,
        1,0,0,0,34,364,1,0,0,0,36,372,1,0,0,0,38,377,1,0,0,0,40,381,1,0,
        0,0,42,385,1,0,0,0,44,400,1,0,0,0,46,402,1,0,0,0,48,404,1,0,0,0,
        50,420,1,0,0,0,52,422,1,0,0,0,54,465,1,0,0,0,56,467,1,0,0,0,58,474,
        1,0,0,0,60,484,1,0,0,0,62,486,1,0,0,0,64,488,1,0,0,0,66,492,1,0,
        0,0,68,504,1,0,0,0,70,506,1,0,0,0,72,511,1,0,0,0,74,521,1,0,0,0,
        76,529,1,0,0,0,78,533,1,0,0,0,80,553,1,0,0,0,82,555,1,0,0,0,84,557,
        1,0,0,0,86,566,1,0,0,0,88,577,1,0,0,0,90,585,1,0,0,0,92,611,1,0,
        0,0,94,622,1,0,0,0,96,628,1,0,0,0,98,630,1,0,0,0,100,637,1,0,0,0,
        102,641,1,0,0,0,104,643,1,0,0,0,106,657,1,0,0,0,108,682,1,0,0,0,
        110,684,1,0,0,0,112,689,1,0,0,0,114,697,1,0,0,0,116,706,1,0,0,0,
        118,731,1,0,0,0,120,733,1,0,0,0,122,735,1,0,0,0,124,737,1,0,0,0,
        126,742,1,0,0,0,128,749,1,0,0,0,130,764,1,0,0,0,132,772,1,0,0,0,
        134,782,1,0,0,0,136,787,1,0,0,0,138,791,1,0,0,0,140,795,1,0,0,0,
        142,805,1,0,0,0,144,809,1,0,0,0,146,813,1,0,0,0,148,815,1,0,0,0,
        150,819,1,0,0,0,152,844,1,0,0,0,154,846,1,0,0,0,156,848,1,0,0,0,
        158,850,1,0,0,0,160,857,1,0,0,0,162,859,1,0,0,0,164,866,1,0,0,0,
        166,868,1,0,0,0,168,872,1,0,0,0,170,874,1,0,0,0,172,883,1,0,0,0,
        174,885,1,0,0,0,176,887,1,0,0,0,178,889,1,0,0,0,180,891,1,0,0,0,
        182,893,1,0,0,0,184,895,1,0,0,0,186,897,1,0,0,0,188,905,1,0,0,0,
        190,907,1,0,0,0,192,911,1,0,0,0,194,914,1,0,0,0,196,919,1,0,0,0,
        198,923,1,0,0,0,200,928,1,0,0,0,202,930,1,0,0,0,204,933,1,0,0,0,
        206,936,1,0,0,0,208,939,1,0,0,0,210,941,1,0,0,0,212,943,1,0,0,0,
        214,954,1,0,0,0,216,956,1,0,0,0,218,964,1,0,0,0,220,982,1,0,0,0,
        222,985,1,0,0,0,224,1012,1,0,0,0,226,1114,1,0,0,0,228,230,3,2,1,
        0,229,228,1,0,0,0,229,230,1,0,0,0,230,231,1,0,0,0,231,232,5,0,0,
        1,232,1,1,0,0,0,233,234,3,4,2,0,234,3,1,0,0,0,235,236,3,6,3,0,236,
        5,1,0,0,0,237,242,3,8,4,0,238,239,5,109,0,0,239,241,3,10,5,0,240,
        238,1,0,0,0,241,244,1,0,0,0,242,240,1,0,0,0,242,243,1,0,0,0,243,
        7,1,0,0,0,244,242,1,0,0,0,245,249,3,12,6,0,246,249,3,14,7,0,247,
        249,3,16,8,0,248,245,1,0,0,0,248,246,1,0,0,0,248,247,1,0,0,0,249,
        9,1,0,0,0,250,267,3,18,9,0,251,267,3,20,10,0,252,267,3,22,11,0,253,
        267,3,24,12,0,254,267,3,26,13,0,255,267,3,28,14,0,256,267,3,30,15,
        0,257,267,3,32,16,0,258,267,3,34,17,0,259,267,3,36,18,0,260,267,
        3,38,19,0,261,267,3,40,20,0,262,267,3,42,21,0,263,267,3,48,24,0,
        264,267,3,52,26,0,265,267,3,56,28,0,266,250,1,0,0,0,266,251,1,0,
        0,0,266,252,1,0,0,0,266,253,1,0,0,0,266,254,1,0,0,0,266,255,1,0,
        0,0,266,256,1,0,0,0,266,257,1,0,0,0,266,258,1,0,0,0,266,259,1,0,
        0,0,266,260,1,0,0,0,266,261,1,0,0,0,266,262,1,0,0,0,266,263,1,0,
        0,0,266,264,1,0,0,0,266,265,1,0,0,0,267,11,1,0,0,0,268,270,5,2,0,
        0,269,268,1,0,0,0,269,270,1,0,0,0,270,271,1,0,0,0,271,272,3,60,30,
        0,272,13,1,0,0,0,273,274,5,3,0,0,274,275,3,62,31,0,275,15,1,0,0,
        0,276,277,5,4,0,0,277,278,5,33,0,0,278,17,1,0,0,0,279,280,5,6,0,
        0,280,281,3,90,45,0,281,19,1,0,0,0,282,284,5,7,0,0,283,285,7,0,0,
        0,284,283,1,0,0,0,284,285,1,0,0,0,285,286,1,0,0,0,286,287,3,112,
        56,0,287,21,1,0,0,0,288,289,5,8,0,0,289,294,3,64,32,0,290,291,5,
        110,0,0,291,293,3,64,32,0,292,290,1,0,0,0,293,296,1,0,0,0,294,292,
        1,0,0,0,294,295,1,0,0,0,295,23,1,0,0,0,296,294,1,0,0,0,297,301,5,
        9,0,0,298,299,5,42,0,0,299,300,5,112,0,0,300,302,3,194,97,0,301,
        298,1,0,0,0,301,302,1,0,0,0,302,306,1,0,0,0,303,304,5,43,0,0,304,
        305,5,112,0,0,305,307,3,198,99,0,306,303,1,0,0,0,306,307,1,0,0,0,
        307,311,1,0,0,0,308,309,5,44,0,0,309,310,5,112,0,0,310,312,3,192,
        96,0,311,308,1,0,0,0,311,312,1,0,0,0,312,313,1,0,0,0,313,318,3,78,
        39,0,314,315,5,110,0,0,315,317,3,78,39,0,316,314,1,0,0,0,317,320,
        1,0,0,0,318,316,1,0,0,0,318,319,1,0,0,0,319,322,1,0,0,0,320,318,
        1,0,0,0,321,323,3,68,34,0,322,321,1,0,0,0,322,323,1,0,0,0,323,327,
        1,0,0,0,324,325,5,41,0,0,325,326,5,112,0,0,326,328,3,198,99,0,327,
        324,1,0,0,0,327,328,1,0,0,0,328,25,1,0,0,0,329,331,5,10,0,0,330,
        332,3,194,97,0,331,330,1,0,0,0,331,332,1,0,0,0,332,333,1,0,0,0,333,
        337,3,112,56,0,334,335,5,39,0,0,335,336,5,112,0,0,336,338,3,198,
        99,0,337,334,1,0,0,0,337,338,1,0,0,0,338,342,1,0,0,0,339,340,5,40,
        0,0,340,341,5,112,0,0,341,343,3,198,99,0,342,339,1,0,0,0,342,343,
        1,0,0,0,343,27,1,0,0,0,344,345,5,11,0,0,345,346,3,74,37,0,346,29,
        1,0,0,0,347,348,5,12,0,0,348,353,3,76,38,0,349,350,5,110,0,0,350,
        352,3,76,38,0,351,349,1,0,0,0,352,355,1,0,0,0,353,351,1,0,0,0,353,
        354,1,0,0,0,354,31,1,0,0,0,355,353,1,0,0,0,356,358,5,13,0,0,357,
        359,3,194,97,0,358,357,1,0,0,0,358,359,1,0,0,0,359,362,1,0,0,0,360,
        361,5,5,0,0,361,363,3,194,97,0,362,360,1,0,0,0,362,363,1,0,0,0,363,
        33,1,0,0,0,364,366,5,14,0,0,365,367,3,194,97,0,366,365,1,0,0,0,366,
        367,1,0,0,0,367,368,1,0,0,0,368,370,3,112,56,0,369,371,3,66,33,0,
        370,369,1,0,0,0,370,371,1,0,0,0,371,35,1,0,0,0,372,373,5,15,0,0,
        373,375,3,112,56,0,374,376,3,66,33,0,375,374,1,0,0,0,375,376,1,0,
        0,0,376,37,1,0,0,0,377,378,5,20,0,0,378,379,3,88,44,0,379,380,3,
        192,96,0,380,39,1,0,0,0,381,382,5,16,0,0,382,383,3,88,44,0,383,384,
        3,192,96,0,384,41,1,0,0,0,385,389,5,22,0,0,386,388,3,44,22,0,387,
        386,1,0,0,0,388,391,1,0,0,0,389,387,1,0,0,0,389,390,1,0,0,0,390,
        392,1,0,0,0,391,389,1,0,0,0,392,393,3,88,44,0,393,43,1,0,0,0,394,
        395,5,23,0,0,395,396,5,112,0,0,396,401,3,192,96,0,397,398,5,21,0,
        0,398,399,5,112,0,0,399,401,3,192,96,0,400,394,1,0,0,0,400,397,1,
        0,0,0,401,45,1,0,0,0,402,403,7,1,0,0,403,47,1,0,0,0,404,408,5,24,
        0,0,405,407,3,50,25,0,406,405,1,0,0,0,407,410,1,0,0,0,408,406,1,
        0,0,0,408,409,1,0,0,0,409,49,1,0,0,0,410,408,1,0,0,0,411,412,5,45,
        0,0,412,413,5,112,0,0,413,421,3,194,97,0,414,415,5,46,0,0,415,416,
        5,112,0,0,416,421,3,194,97,0,417,418,5,47,0,0,418,419,5,112,0,0,
        419,421,3,192,96,0,420,411,1,0,0,0,420,414,1,0,0,0,420,417,1,0,0,
        0,421,51,1,0,0,0,422,426,5,25,0,0,423,425,3,54,27,0,424,423,1,0,
        0,0,425,428,1,0,0,0,426,424,1,0,0,0,426,427,1,0,0,0,427,53,1,0,0,
        0,428,426,1,0,0,0,429,430,5,48,0,0,430,431,5,112,0,0,431,466,3,194,
        97,0,432,433,5,49,0,0,433,434,5,112,0,0,434,466,3,194,97,0,435,436,
        5,50,0,0,436,437,5,112,0,0,437,466,3,194,97,0,438,439,5,51,0,0,439,
        440,5,112,0,0,440,466,3,194,97,0,441,442,5,52,0,0,442,443,5,112,
        0,0,443,466,3,196,98,0,444,445,5,53,0,0,445,446,5,112,0,0,446,466,
        3,196,98,0,447,448,5,54,0,0,448,449,5,112,0,0,449,466,3,192,96,0,
        450,451,5,55,0,0,451,452,5,112,0,0,452,466,3,192,96,0,453,454,5,
        215,0,0,454,455,5,112,0,0,455,466,3,192,96,0,456,457,5,56,0,0,457,
        458,5,112,0,0,458,466,3,192,96,0,459,460,5,57,0,0,460,461,5,112,
        0,0,461,466,3,194,97,0,462,463,5,58,0,0,463,464,5,112,0,0,464,466,
        3,196,98,0,465,429,1,0,0,0,465,432,1,0,0,0,465,435,1,0,0,0,465,438,
        1,0,0,0,465,441,1,0,0,0,465,444,1,0,0,0,465,447,1,0,0,0,465,450,
        1,0,0,0,465,453,1,0,0,0,465,456,1,0,0,0,465,459,1,0,0,0,465,462,
        1,0,0,0,466,55,1,0,0,0,467,471,5,26,0,0,468,470,3,58,29,0,469,468,
        1,0,0,0,470,473,1,0,0,0,471,469,1,0,0,0,471,472,1,0,0,0,472,57,1,
        0,0,0,473,471,1,0,0,0,474,475,3,220,110,0,475,476,5,112,0,0,476,
        477,3,188,94,0,477,59,1,0,0,0,478,479,5,29,0,0,479,480,5,112,0,0,
        480,485,3,62,31,0,481,482,5,30,0,0,482,483,5,112,0,0,483,485,3,62,
        31,0,484,478,1,0,0,0,484,481,1,0,0,0,485,61,1,0,0,0,486,487,3,108,
        54,0,487,63,1,0,0,0,488,489,3,122,61,0,489,490,5,27,0,0,490,491,
        3,122,61,0,491,65,1,0,0,0,492,493,5,28,0,0,493,494,3,112,56,0,494,
        67,1,0,0,0,495,496,5,28,0,0,496,505,3,112,56,0,497,498,5,28,0,0,
        498,505,3,70,35,0,499,500,5,28,0,0,500,501,3,70,35,0,501,502,5,110,
        0,0,502,503,3,112,56,0,503,505,1,0,0,0,504,495,1,0,0,0,504,497,1,
        0,0,0,504,499,1,0,0,0,505,69,1,0,0,0,506,509,3,72,36,0,507,508,5,
        27,0,0,508,510,3,214,107,0,509,507,1,0,0,0,509,510,1,0,0,0,510,71,
        1,0,0,0,511,512,5,320,0,0,512,513,5,125,0,0,513,514,3,120,60,0,514,
        515,5,110,0,0,515,517,3,188,94,0,516,518,3,210,105,0,517,516,1,0,
        0,0,517,518,1,0,0,0,518,519,1,0,0,0,519,520,5,126,0,0,520,73,1,0,
        0,0,521,526,3,116,58,0,522,523,5,110,0,0,523,525,3,116,58,0,524,
        522,1,0,0,0,525,528,1,0,0,0,526,524,1,0,0,0,526,527,1,0,0,0,527,
        75,1,0,0,0,528,526,1,0,0,0,529,530,3,120,60,0,530,531,5,112,0,0,
        531,532,3,88,44,0,532,77,1,0,0,0,533,536,3,80,40,0,534,535,5,27,
        0,0,535,537,3,122,61,0,536,534,1,0,0,0,536,537,1,0,0,0,537,79,1,
        0,0,0,538,539,3,82,41,0,539,540,5,125,0,0,540,541,3,94,47,0,541,
        542,5,126,0,0,542,554,1,0,0,0,543,544,5,136,0,0,544,545,5,125,0,
        0,545,554,5,126,0,0,546,547,7,2,0,0,547,548,5,125,0,0,548,549,3,
        94,47,0,549,550,5,126,0,0,550,554,1,0,0,0,551,554,3,86,43,0,552,
        554,3,84,42,0,553,538,1,0,0,0,553,543,1,0,0,0,553,546,1,0,0,0,553,
        551,1,0,0,0,553,552,1,0,0,0,554,81,1,0,0,0,555,556,7,3,0,0,556,83,
        1,0,0,0,557,558,5,155,0,0,558,559,5,125,0,0,559,562,3,120,60,0,560,
        561,5,110,0,0,561,563,3,194,97,0,562,560,1,0,0,0,562,563,1,0,0,0,
        563,564,1,0,0,0,564,565,5,126,0,0,565,85,1,0,0,0,566,567,5,154,0,
        0,567,568,5,114,0,0,568,569,3,194,97,0,569,570,5,113,0,0,570,571,
        5,125,0,0,571,572,3,120,60,0,572,573,5,126,0,0,573,87,1,0,0,0,574,
        578,3,90,45,0,575,578,3,92,46,0,576,578,3,94,47,0,577,574,1,0,0,
        0,577,575,1,0,0,0,577,576,1,0,0,0,578,89,1,0,0,0,579,580,6,45,-1,
        0,580,586,3,92,46,0,581,582,5,61,0,0,582,586,3,90,45,6,583,586,3,
        100,50,0,584,586,3,102,51,0,585,579,1,0,0,0,585,581,1,0,0,0,585,
        583,1,0,0,0,585,584,1,0,0,0,586,600,1,0,0,0,587,588,10,5,0,0,588,
        589,5,62,0,0,589,599,3,90,45,6,590,592,10,4,0,0,591,593,5,63,0,0,
        592,591,1,0,0,0,592,593,1,0,0,0,593,594,1,0,0,0,594,599,3,90,45,
        5,595,596,10,3,0,0,596,597,5,64,0,0,597,599,3,90,45,4,598,587,1,
        0,0,0,598,590,1,0,0,0,598,595,1,0,0,0,599,602,1,0,0,0,600,598,1,
        0,0,0,600,601,1,0,0,0,601,91,1,0,0,0,602,600,1,0,0,0,603,604,3,94,
        47,0,604,605,3,182,91,0,605,606,3,94,47,0,606,612,1,0,0,0,607,608,
        3,94,47,0,608,609,5,60,0,0,609,610,3,212,106,0,610,612,1,0,0,0,611,
        603,1,0,0,0,611,607,1,0,0,0,612,93,1,0,0,0,613,623,3,96,48,0,614,
        623,3,98,49,0,615,623,3,162,81,0,616,623,3,158,79,0,617,623,3,170,
        85,0,618,619,5,125,0,0,619,620,3,94,47,0,620,621,5,126,0,0,621,623,
        1,0,0,0,622,613,1,0,0,0,622,614,1,0,0,0,622,615,1,0,0,0,622,616,
        1,0,0,0,622,617,1,0,0,0,622,618,1,0,0,0,623,95,1,0,0,0,624,629,3,
        124,62,0,625,629,3,126,63,0,626,629,3,120,60,0,627,629,3,188,94,
        0,628,624,1,0,0,0,628,625,1,0,0,0,628,626,1,0,0,0,628,627,1,0,0,
        0,629,97,1,0,0,0,630,631,3,180,90,0,631,632,5,125,0,0,632,633,3,
        136,68,0,633,634,5,60,0,0,634,635,3,136,68,0,635,636,5,126,0,0,636,
        99,1,0,0,0,637,638,3,128,64,0,638,101,1,0,0,0,639,642,3,104,52,0,
        640,642,3,106,53,0,641,639,1,0,0,0,641,640,1,0,0,0,642,103,1,0,0,
        0,643,644,3,184,92,0,644,645,5,125,0,0,645,646,3,146,73,0,646,647,
        5,110,0,0,647,652,3,148,74,0,648,649,5,110,0,0,649,651,3,138,69,
        0,650,648,1,0,0,0,651,654,1,0,0,0,652,650,1,0,0,0,652,653,1,0,0,
        0,653,655,1,0,0,0,654,652,1,0,0,0,655,656,5,126,0,0,656,105,1,0,
        0,0,657,658,3,186,93,0,658,659,5,125,0,0,659,660,5,127,0,0,660,665,
        3,142,71,0,661,662,5,110,0,0,662,664,3,142,71,0,663,661,1,0,0,0,
        664,667,1,0,0,0,665,663,1,0,0,0,665,666,1,0,0,0,666,668,1,0,0,0,
        667,665,1,0,0,0,668,669,5,128,0,0,669,670,5,110,0,0,670,675,3,148,
        74,0,671,672,5,110,0,0,672,674,3,138,69,0,673,671,1,0,0,0,674,677,
        1,0,0,0,675,673,1,0,0,0,675,676,1,0,0,0,676,678,1,0,0,0,677,675,
        1,0,0,0,678,679,5,126,0,0,679,107,1,0,0,0,680,683,3,216,108,0,681,
        683,5,332,0,0,682,680,1,0,0,0,682,681,1,0,0,0,683,109,1,0,0,0,684,
        685,3,214,107,0,685,686,5,125,0,0,686,687,3,134,67,0,687,688,5,126,
        0,0,688,111,1,0,0,0,689,694,3,120,60,0,690,691,5,110,0,0,691,693,
        3,120,60,0,692,690,1,0,0,0,693,696,1,0,0,0,694,692,1,0,0,0,694,695,
        1,0,0,0,695,113,1,0,0,0,696,694,1,0,0,0,697,702,3,122,61,0,698,699,
        5,110,0,0,699,701,3,122,61,0,700,698,1,0,0,0,701,704,1,0,0,0,702,
        700,1,0,0,0,702,703,1,0,0,0,703,115,1,0,0,0,704,702,1,0,0,0,705,
        707,7,0,0,0,706,705,1,0,0,0,706,707,1,0,0,0,707,708,1,0,0,0,708,
        709,3,118,59,0,709,117,1,0,0,0,710,732,3,120,60,0,711,712,5,35,0,
        0,712,713,5,125,0,0,713,714,3,120,60,0,714,715,5,126,0,0,715,732,
        1,0,0,0,716,717,5,36,0,0,717,718,5,125,0,0,718,719,3,120,60,0,719,
        720,5,126,0,0,720,732,1,0,0,0,721,722,5,37,0,0,722,723,5,125,0,0,
        723,724,3,120,60,0,724,725,5,126,0,0,725,732,1,0,0,0,726,727,5,38,
        0,0,727,728,5,125,0,0,728,729,3,120,60,0,729,730,5,126,0,0,730,732,
        1,0,0,0,731,710,1,0,0,0,731,711,1,0,0,0,731,716,1,0,0,0,731,721,
        1,0,0,0,731,726,1,0,0,0,732,119,1,0,0,0,733,734,3,214,107,0,734,
        121,1,0,0,0,735,736,3,218,109,0,736,123,1,0,0,0,737,738,3,132,66,
        0,738,739,5,125,0,0,739,740,3,134,67,0,740,741,5,126,0,0,741,125,
        1,0,0,0,742,743,5,274,0,0,743,744,5,125,0,0,744,745,3,88,44,0,745,
        746,5,27,0,0,746,747,3,130,65,0,747,748,5,126,0,0,748,127,1,0,0,
        0,749,750,3,174,87,0,750,751,5,125,0,0,751,752,3,134,67,0,752,753,
        5,126,0,0,753,129,1,0,0,0,754,765,5,212,0,0,755,765,5,241,0,0,756,
        765,5,243,0,0,757,765,5,102,0,0,758,765,5,103,0,0,759,765,5,104,
        0,0,760,765,5,105,0,0,761,765,5,106,0,0,762,765,5,107,0,0,763,765,
        5,108,0,0,764,754,1,0,0,0,764,755,1,0,0,0,764,756,1,0,0,0,764,757,
        1,0,0,0,764,758,1,0,0,0,764,759,1,0,0,0,764,760,1,0,0,0,764,761,
        1,0,0,0,764,762,1,0,0,0,764,763,1,0,0,0,765,131,1,0,0,0,766,773,
        3,152,76,0,767,773,3,156,78,0,768,773,3,178,89,0,769,773,3,174,87,
        0,770,773,3,176,88,0,771,773,3,180,90,0,772,766,1,0,0,0,772,767,
        1,0,0,0,772,768,1,0,0,0,772,769,1,0,0,0,772,770,1,0,0,0,772,771,
        1,0,0,0,773,133,1,0,0,0,774,779,3,136,68,0,775,776,5,110,0,0,776,
        778,3,136,68,0,777,775,1,0,0,0,778,781,1,0,0,0,779,777,1,0,0,0,779,
        780,1,0,0,0,780,783,1,0,0,0,781,779,1,0,0,0,782,774,1,0,0,0,782,
        783,1,0,0,0,783,135,1,0,0,0,784,785,3,220,110,0,785,786,5,112,0,
        0,786,788,1,0,0,0,787,784,1,0,0,0,787,788,1,0,0,0,788,789,1,0,0,
        0,789,790,3,94,47,0,790,137,1,0,0,0,791,792,3,140,70,0,792,793,5,
        112,0,0,793,794,3,150,75,0,794,139,1,0,0,0,795,796,7,4,0,0,796,141,
        1,0,0,0,797,806,3,146,73,0,798,799,3,146,73,0,799,800,3,144,72,0,
        800,806,1,0,0,0,801,802,3,146,73,0,802,803,5,134,0,0,803,804,3,144,
        72,0,804,806,1,0,0,0,805,797,1,0,0,0,805,798,1,0,0,0,805,801,1,0,
        0,0,806,143,1,0,0,0,807,810,3,194,97,0,808,810,3,196,98,0,809,807,
        1,0,0,0,809,808,1,0,0,0,810,145,1,0,0,0,811,814,3,214,107,0,812,
        814,3,192,96,0,813,811,1,0,0,0,813,812,1,0,0,0,814,147,1,0,0,0,815,
        816,3,150,75,0,816,149,1,0,0,0,817,820,3,214,107,0,818,820,3,188,
        94,0,819,817,1,0,0,0,819,818,1,0,0,0,820,151,1,0,0,0,821,845,5,172,
        0,0,822,845,5,173,0,0,823,845,5,174,0,0,824,845,5,175,0,0,825,845,
        5,176,0,0,826,845,5,177,0,0,827,845,5,178,0,0,828,845,5,179,0,0,
        829,845,5,180,0,0,830,845,5,181,0,0,831,845,5,182,0,0,832,845,5,
        183,0,0,833,845,5,184,0,0,834,845,5,185,0,0,835,845,5,186,0,0,836,
        845,5,188,0,0,837,845,5,189,0,0,838,845,5,190,0,0,839,845,5,191,
        0,0,840,845,5,192,0,0,841,845,5,193,0,0,842,845,5,194,0,0,843,845,
        3,154,77,0,844,821,1,0,0,0,844,822,1,0,0,0,844,823,1,0,0,0,844,824,
        1,0,0,0,844,825,1,0,0,0,844,826,1,0,0,0,844,827,1,0,0,0,844,828,
        1,0,0,0,844,829,1,0,0,0,844,830,1,0,0,0,844,831,1,0,0,0,844,832,
        1,0,0,0,844,833,1,0,0,0,844,834,1,0,0,0,844,835,1,0,0,0,844,836,
        1,0,0,0,844,837,1,0,0,0,844,838,1,0,0,0,844,839,1,0,0,0,844,840,
        1,0,0,0,844,841,1,0,0,0,844,842,1,0,0,0,844,843,1,0,0,0,845,153,
        1,0,0,0,846,847,7,5,0,0,847,155,1,0,0,0,848,849,7,6,0,0,849,157,
        1,0,0,0,850,851,5,226,0,0,851,852,5,125,0,0,852,853,3,160,80,0,853,
        854,5,110,0,0,854,855,3,136,68,0,855,856,5,126,0,0,856,159,1,0,0,
        0,857,858,7,7,0,0,858,161,1,0,0,0,859,860,5,223,0,0,860,861,5,125,
        0,0,861,862,3,168,84,0,862,863,5,5,0,0,863,864,3,136,68,0,864,865,
        5,126,0,0,865,163,1,0,0,0,866,867,7,8,0,0,867,165,1,0,0,0,868,869,
        7,9,0,0,869,167,1,0,0,0,870,873,3,164,82,0,871,873,3,166,83,0,872,
        870,1,0,0,0,872,871,1,0,0,0,873,169,1,0,0,0,874,875,3,172,86,0,875,
        876,5,125,0,0,876,877,3,164,82,0,877,878,5,110,0,0,878,879,3,136,
        68,0,879,880,5,110,0,0,880,881,3,136,68,0,881,882,5,126,0,0,882,
        171,1,0,0,0,883,884,7,10,0,0,884,173,1,0,0,0,885,886,7,11,0,0,886,
        175,1,0,0,0,887,888,5,281,0,0,888,177,1,0,0,0,889,890,7,12,0,0,890,
        179,1,0,0,0,891,892,5,187,0,0,892,181,1,0,0,0,893,894,7,13,0,0,894,
        183,1,0,0,0,895,896,7,14,0,0,896,185,1,0,0,0,897,898,7,15,0,0,898,
        187,1,0,0,0,899,906,3,190,95,0,900,906,3,192,96,0,901,906,3,194,
        97,0,902,906,3,196,98,0,903,906,3,198,99,0,904,906,3,200,100,0,905,
        899,1,0,0,0,905,900,1,0,0,0,905,901,1,0,0,0,905,902,1,0,0,0,905,
        903,1,0,0,0,905,904,1,0,0,0,906,189,1,0,0,0,907,908,5,81,0,0,908,
        909,3,94,47,0,909,910,3,208,104,0,910,191,1,0,0,0,911,912,7,16,0,
        0,912,193,1,0,0,0,913,915,7,0,0,0,914,913,1,0,0,0,914,915,1,0,0,
        0,915,916,1,0,0,0,916,917,5,330,0,0,917,195,1,0,0,0,918,920,7,0,
        0,0,919,918,1,0,0,0,919,920,1,0,0,0,920,921,1,0,0,0,921,922,5,331,
        0,0,922,197,1,0,0,0,923,924,7,17,0,0,924,199,1,0,0,0,925,929,3,202,
        101,0,926,929,3,204,102,0,927,929,3,206,103,0,928,925,1,0,0,0,928,
        926,1,0,0,0,928,927,1,0,0,0,929,201,1,0,0,0,930,931,5,212,0,0,931,
        932,3,192,96,0,932,203,1,0,0,0,933,934,5,241,0,0,934,935,3,192,96,
        0,935,205,1,0,0,0,936,937,5,243,0,0,937,938,3,192,96,0,938,207,1,
        0,0,0,939,940,7,18,0,0,940,209,1,0,0,0,941,942,7,19,0,0,942,211,
        1,0,0,0,943,944,5,125,0,0,944,949,3,188,94,0,945,946,5,110,0,0,946,
        948,3,188,94,0,947,945,1,0,0,0,948,951,1,0,0,0,949,947,1,0,0,0,949,
        950,1,0,0,0,950,952,1,0,0,0,951,949,1,0,0,0,952,953,5,126,0,0,953,
        213,1,0,0,0,954,955,5,328,0,0,955,215,1,0,0,0,956,961,3,222,111,
        0,957,958,5,111,0,0,958,960,3,220,110,0,959,957,1,0,0,0,960,963,
        1,0,0,0,961,959,1,0,0,0,961,962,1,0,0,0,962,217,1,0,0,0,963,961,
        1,0,0,0,964,969,3,224,112,0,965,966,5,111,0,0,966,968,3,224,112,
        0,967,965,1,0,0,0,968,971,1,0,0,0,969,967,1,0,0,0,969,970,1,0,0,
        0,970,219,1,0,0,0,971,969,1,0,0,0,972,974,5,111,0,0,973,972,1,0,
        0,0,973,974,1,0,0,0,974,975,1,0,0,0,975,983,5,328,0,0,976,977,5,
        131,0,0,977,978,3,220,110,0,978,979,5,131,0,0,979,983,1,0,0,0,980,
        983,5,335,0,0,981,983,3,226,113,0,982,973,1,0,0,0,982,976,1,0,0,
        0,982,980,1,0,0,0,982,981,1,0,0,0,983,221,1,0,0,0,984,986,5,329,
        0,0,985,984,1,0,0,0,985,986,1,0,0,0,986,987,1,0,0,0,987,988,3,220,
        110,0,988,223,1,0,0,0,989,994,3,220,110,0,990,991,5,122,0,0,991,
        993,3,220,110,0,992,990,1,0,0,0,993,996,1,0,0,0,994,992,1,0,0,0,
        994,995,1,0,0,0,995,998,1,0,0,0,996,994,1,0,0,0,997,999,5,122,0,
        0,998,997,1,0,0,0,998,999,1,0,0,0,999,1013,1,0,0,0,1000,1001,5,129,
        0,0,1001,1002,3,224,112,0,1002,1003,5,129,0,0,1003,1013,1,0,0,0,
        1004,1005,5,130,0,0,1005,1006,3,224,112,0,1006,1007,5,130,0,0,1007,
        1013,1,0,0,0,1008,1009,5,131,0,0,1009,1010,3,224,112,0,1010,1011,
        5,131,0,0,1011,1013,1,0,0,0,1012,989,1,0,0,0,1012,1000,1,0,0,0,1012,
        1004,1,0,0,0,1012,1008,1,0,0,0,1013,225,1,0,0,0,1014,1115,5,31,0,
        0,1015,1115,3,210,105,0,1016,1115,5,320,0,0,1017,1115,3,132,66,0,
        1018,1115,3,140,70,0,1019,1115,3,208,104,0,1020,1115,3,156,78,0,
        1021,1115,3,178,89,0,1022,1115,3,152,76,0,1023,1115,3,180,90,0,1024,
        1115,5,2,0,0,1025,1115,5,3,0,0,1026,1115,5,4,0,0,1027,1115,5,5,0,
        0,1028,1115,5,6,0,0,1029,1115,5,7,0,0,1030,1115,5,8,0,0,1031,1115,
        5,9,0,0,1032,1115,5,10,0,0,1033,1115,5,11,0,0,1034,1115,5,12,0,0,
        1035,1115,5,13,0,0,1036,1115,5,14,0,0,1037,1115,5,15,0,0,1038,1115,
        5,16,0,0,1039,1115,5,17,0,0,1040,1115,5,18,0,0,1041,1115,5,19,0,
        0,1042,1115,5,20,0,0,1043,1115,5,21,0,0,1044,1115,5,22,0,0,1045,
        1115,5,23,0,0,1046,1115,5,24,0,0,1047,1115,5,25,0,0,1048,1115,5,
        26,0,0,1049,1115,5,29,0,0,1050,1115,5,30,0,0,1051,1115,5,32,0,0,
        1052,1115,5,33,0,0,1053,1115,5,34,0,0,1054,1115,5,36,0,0,1055,1115,
        5,37,0,0,1056,1115,5,38,0,0,1057,1115,5,39,0,0,1058,1115,5,40,0,
        0,1059,1115,5,41,0,0,1060,1115,5,42,0,0,1061,1115,5,43,0,0,1062,
        1115,5,44,0,0,1063,1115,5,45,0,0,1064,1115,5,46,0,0,1065,1115,5,
        47,0,0,1066,1115,5,48,0,0,1067,1115,5,49,0,0,1068,1115,5,50,0,0,
        1069,1115,5,51,0,0,1070,1115,5,52,0,0,1071,1115,5,53,0,0,1072,1115,
        5,54,0,0,1073,1115,5,55,0,0,1074,1115,5,56,0,0,1075,1115,5,57,0,
        0,1076,1115,5,58,0,0,1077,1115,5,135,0,0,1078,1115,5,136,0,0,1079,
        1115,5,137,0,0,1080,1115,5,138,0,0,1081,1115,5,139,0,0,1082,1115,
        5,140,0,0,1083,1115,5,141,0,0,1084,1115,5,142,0,0,1085,1115,5,143,
        0,0,1086,1115,5,144,0,0,1087,1115,5,145,0,0,1088,1115,5,146,0,0,
        1089,1115,5,147,0,0,1090,1115,5,148,0,0,1091,1115,5,149,0,0,1092,
        1115,5,150,0,0,1093,1115,5,151,0,0,1094,1115,5,152,0,0,1095,1115,
        5,153,0,0,1096,1115,5,154,0,0,1097,1115,5,155,0,0,1098,1115,5,156,
        0,0,1099,1115,5,157,0,0,1100,1115,5,158,0,0,1101,1115,5,159,0,0,
        1102,1115,5,160,0,0,1103,1115,5,161,0,0,1104,1115,5,162,0,0,1105,
        1115,5,163,0,0,1106,1115,5,164,0,0,1107,1115,5,165,0,0,1108,1115,
        5,166,0,0,1109,1115,5,167,0,0,1110,1115,5,168,0,0,1111,1115,5,169,
        0,0,1112,1115,5,170,0,0,1113,1115,5,171,0,0,1114,1014,1,0,0,0,1114,
        1015,1,0,0,0,1114,1016,1,0,0,0,1114,1017,1,0,0,0,1114,1018,1,0,0,
        0,1114,1019,1,0,0,0,1114,1020,1,0,0,0,1114,1021,1,0,0,0,1114,1022,
        1,0,0,0,1114,1023,1,0,0,0,1114,1024,1,0,0,0,1114,1025,1,0,0,0,1114,
        1026,1,0,0,0,1114,1027,1,0,0,0,1114,1028,1,0,0,0,1114,1029,1,0,0,
        0,1114,1030,1,0,0,0,1114,1031,1,0,0,0,1114,1032,1,0,0,0,1114,1033,
        1,0,0,0,1114,1034,1,0,0,0,1114,1035,1,0,0,0,1114,1036,1,0,0,0,1114,
        1037,1,0,0,0,1114,1038,1,0,0,0,1114,1039,1,0,0,0,1114,1040,1,0,0,
        0,1114,1041,1,0,0,0,1114,1042,1,0,0,0,1114,1043,1,0,0,0,1114,1044,
        1,0,0,0,1114,1045,1,0,0,0,1114,1046,1,0,0,0,1114,1047,1,0,0,0,1114,
        1048,1,0,0,0,1114,1049,1,0,0,0,1114,1050,1,0,0,0,1114,1051,1,0,0,
        0,1114,1052,1,0,0,0,1114,1053,1,0,0,0,1114,1054,1,0,0,0,1114,1055,
        1,0,0,0,1114,1056,1,0,0,0,1114,1057,1,0,0,0,1114,1058,1,0,0,0,1114,
        1059,1,0,0,0,1114,1060,1,0,0,0,1114,1061,1,0,0,0,1114,1062,1,0,0,
        0,1114,1063,1,0,0,0,1114,1064,1,0,0,0,1114,1065,1,0,0,0,1114,1066,
        1,0,0,0,1114,1067,1,0,0,0,1114,1068,1,0,0,0,1114,1069,1,0,0,0,1114,
        1070,1,0,0,0,1114,1071,1,0,0,0,1114,1072,1,0,0,0,1114,1073,1,0,0,
        0,1114,1074,1,0,0,0,1114,1075,1,0,0,0,1114,1076,1,0,0,0,1114,1077,
        1,0,0,0,1114,1078,1,0,0,0,1114,1079,1,0,0,0,1114,1080,1,0,0,0,1114,
        1081,1,0,0,0,1114,1082,1,0,0,0,1114,1083,1,0,0,0,1114,1084,1,0,0,
        0,1114,1085,1,0,0,0,1114,1086,1,0,0,0,1114,1087,1,0,0,0,1114,1088,
        1,0,0,0,1114,1089,1,0,0,0,1114,1090,1,0,0,0,1114,1091,1,0,0,0,1114,
        1092,1,0,0,0,1114,1093,1,0,0,0,1114,1094,1,0,0,0,1114,1095,1,0,0,
        0,1114,1096,1,0,0,0,1114,1097,1,0,0,0,1114,1098,1,0,0,0,1114,1099,
        1,0,0,0,1114,1100,1,0,0,0,1114,1101,1,0,0,0,1114,1102,1,0,0,0,1114,
        1103,1,0,0,0,1114,1104,1,0,0,0,1114,1105,1,0,0,0,1114,1106,1,0,0,
        0,1114,1107,1,0,0,0,1114,1108,1,0,0,0,1114,1109,1,0,0,0,1114,1110,
        1,0,0,0,1114,1111,1,0,0,0,1114,1112,1,0,0,0,1114,1113,1,0,0,0,1115,
        227,1,0,0,0,79,229,242,248,266,269,284,294,301,306,311,318,322,327,
        331,337,342,353,358,362,366,370,375,389,400,408,420,426,465,471,
        484,504,509,517,526,536,553,562,577,585,592,598,600,611,622,628,
        641,652,665,675,682,694,702,706,731,764,772,779,782,787,805,809,
        813,819,844,872,905,914,919,928,949,961,969,973,982,985,994,998,
        1012,1114
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!OpenSearchPPLParser.__ATN) {
            OpenSearchPPLParser.__ATN = new antlr.ATNDeserializer().deserialize(OpenSearchPPLParser._serializedATN);
        }

        return OpenSearchPPLParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(OpenSearchPPLParser.literalNames, OpenSearchPPLParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return OpenSearchPPLParser.vocabulary;
    }

    private static readonly decisionsToDFA = OpenSearchPPLParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class RootContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.EOF, 0)!;
    }
    public pplStatement(): PplStatementContext | null {
        return this.getRuleContext(0, PplStatementContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_root;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitRoot) {
            return visitor.visitRoot(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PplStatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public dmlStatement(): DmlStatementContext {
        return this.getRuleContext(0, DmlStatementContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_pplStatement;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitPplStatement) {
            return visitor.visitPplStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DmlStatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public queryStatement(): QueryStatementContext {
        return this.getRuleContext(0, QueryStatementContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_dmlStatement;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitDmlStatement) {
            return visitor.visitDmlStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class QueryStatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public pplCommands(): PplCommandsContext {
        return this.getRuleContext(0, PplCommandsContext)!;
    }
    public PIPE(): antlr.TerminalNode[];
    public PIPE(i: number): antlr.TerminalNode | null;
    public PIPE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.PIPE);
    	} else {
    		return this.getToken(OpenSearchPPLParser.PIPE, i);
    	}
    }
    public commands(): CommandsContext[];
    public commands(i: number): CommandsContext | null;
    public commands(i?: number): CommandsContext[] | CommandsContext | null {
        if (i === undefined) {
            return this.getRuleContexts(CommandsContext);
        }

        return this.getRuleContext(i, CommandsContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_queryStatement;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitQueryStatement) {
            return visitor.visitQueryStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PplCommandsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public searchCommand(): SearchCommandContext | null {
        return this.getRuleContext(0, SearchCommandContext);
    }
    public describeCommand(): DescribeCommandContext | null {
        return this.getRuleContext(0, DescribeCommandContext);
    }
    public showDataSourcesCommand(): ShowDataSourcesCommandContext | null {
        return this.getRuleContext(0, ShowDataSourcesCommandContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_pplCommands;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitPplCommands) {
            return visitor.visitPplCommands(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class CommandsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public whereCommand(): WhereCommandContext | null {
        return this.getRuleContext(0, WhereCommandContext);
    }
    public fieldsCommand(): FieldsCommandContext | null {
        return this.getRuleContext(0, FieldsCommandContext);
    }
    public renameCommand(): RenameCommandContext | null {
        return this.getRuleContext(0, RenameCommandContext);
    }
    public statsCommand(): StatsCommandContext | null {
        return this.getRuleContext(0, StatsCommandContext);
    }
    public dedupCommand(): DedupCommandContext | null {
        return this.getRuleContext(0, DedupCommandContext);
    }
    public sortCommand(): SortCommandContext | null {
        return this.getRuleContext(0, SortCommandContext);
    }
    public evalCommand(): EvalCommandContext | null {
        return this.getRuleContext(0, EvalCommandContext);
    }
    public headCommand(): HeadCommandContext | null {
        return this.getRuleContext(0, HeadCommandContext);
    }
    public topCommand(): TopCommandContext | null {
        return this.getRuleContext(0, TopCommandContext);
    }
    public rareCommand(): RareCommandContext | null {
        return this.getRuleContext(0, RareCommandContext);
    }
    public grokCommand(): GrokCommandContext | null {
        return this.getRuleContext(0, GrokCommandContext);
    }
    public parseCommand(): ParseCommandContext | null {
        return this.getRuleContext(0, ParseCommandContext);
    }
    public patternsCommand(): PatternsCommandContext | null {
        return this.getRuleContext(0, PatternsCommandContext);
    }
    public kmeansCommand(): KmeansCommandContext | null {
        return this.getRuleContext(0, KmeansCommandContext);
    }
    public adCommand(): AdCommandContext | null {
        return this.getRuleContext(0, AdCommandContext);
    }
    public mlCommand(): MlCommandContext | null {
        return this.getRuleContext(0, MlCommandContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_commands;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitCommands) {
            return visitor.visitCommands(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SearchCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_searchCommand;
    }
    public override copyFrom(ctx: SearchCommandContext): void {
        super.copyFrom(ctx);
    }
}
export class SearchFromContext extends SearchCommandContext {
    public constructor(ctx: SearchCommandContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public fromClause(): FromClauseContext {
        return this.getRuleContext(0, FromClauseContext)!;
    }
    public SEARCH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SEARCH, 0);
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitSearchFrom) {
            return visitor.visitSearchFrom(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DescribeCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DESCRIBE(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.DESCRIBE, 0)!;
    }
    public tableSourceClause(): TableSourceClauseContext {
        return this.getRuleContext(0, TableSourceClauseContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_describeCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitDescribeCommand) {
            return visitor.visitDescribeCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ShowDataSourcesCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SHOW(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.SHOW, 0)!;
    }
    public DATASOURCES(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.DATASOURCES, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_showDataSourcesCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitShowDataSourcesCommand) {
            return visitor.visitShowDataSourcesCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class WhereCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public WHERE(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.WHERE, 0)!;
    }
    public logicalExpression(): LogicalExpressionContext {
        return this.getRuleContext(0, LogicalExpressionContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_whereCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitWhereCommand) {
            return visitor.visitWhereCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FieldsCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FIELDS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.FIELDS, 0)!;
    }
    public fieldList(): FieldListContext {
        return this.getRuleContext(0, FieldListContext)!;
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PLUS, 0);
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUS, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_fieldsCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitFieldsCommand) {
            return visitor.visitFieldsCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RenameCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public RENAME(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RENAME, 0)!;
    }
    public renameClasue(): RenameClasueContext[];
    public renameClasue(i: number): RenameClasueContext | null;
    public renameClasue(i?: number): RenameClasueContext[] | RenameClasueContext | null {
        if (i === undefined) {
            return this.getRuleContexts(RenameClasueContext);
        }

        return this.getRuleContext(i, RenameClasueContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_renameCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitRenameCommand) {
            return visitor.visitRenameCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class StatsCommandContext extends antlr.ParserRuleContext {
    public _partitions?: IntegerLiteralContext;
    public _allnum?: BooleanLiteralContext;
    public _delim?: StringLiteralContext;
    public _dedupsplit?: BooleanLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public STATS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.STATS, 0)!;
    }
    public statsAggTerm(): StatsAggTermContext[];
    public statsAggTerm(i: number): StatsAggTermContext | null;
    public statsAggTerm(i?: number): StatsAggTermContext[] | StatsAggTermContext | null {
        if (i === undefined) {
            return this.getRuleContexts(StatsAggTermContext);
        }

        return this.getRuleContext(i, StatsAggTermContext);
    }
    public PARTITIONS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PARTITIONS, 0);
    }
    public EQUAL(): antlr.TerminalNode[];
    public EQUAL(i: number): antlr.TerminalNode | null;
    public EQUAL(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.EQUAL);
    	} else {
    		return this.getToken(OpenSearchPPLParser.EQUAL, i);
    	}
    }
    public ALLNUM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ALLNUM, 0);
    }
    public DELIM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DELIM, 0);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLParser.COMMA, i);
    	}
    }
    public statsByClause(): StatsByClauseContext | null {
        return this.getRuleContext(0, StatsByClauseContext);
    }
    public DEDUP_SPLITVALUES(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DEDUP_SPLITVALUES, 0);
    }
    public integerLiteral(): IntegerLiteralContext | null {
        return this.getRuleContext(0, IntegerLiteralContext);
    }
    public booleanLiteral(): BooleanLiteralContext[];
    public booleanLiteral(i: number): BooleanLiteralContext | null;
    public booleanLiteral(i?: number): BooleanLiteralContext[] | BooleanLiteralContext | null {
        if (i === undefined) {
            return this.getRuleContexts(BooleanLiteralContext);
        }

        return this.getRuleContext(i, BooleanLiteralContext);
    }
    public stringLiteral(): StringLiteralContext | null {
        return this.getRuleContext(0, StringLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_statsCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitStatsCommand) {
            return visitor.visitStatsCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DedupCommandContext extends antlr.ParserRuleContext {
    public _number_?: IntegerLiteralContext;
    public _keepempty?: BooleanLiteralContext;
    public _consecutive?: BooleanLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DEDUP(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.DEDUP, 0)!;
    }
    public fieldList(): FieldListContext {
        return this.getRuleContext(0, FieldListContext)!;
    }
    public KEEPEMPTY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.KEEPEMPTY, 0);
    }
    public EQUAL(): antlr.TerminalNode[];
    public EQUAL(i: number): antlr.TerminalNode | null;
    public EQUAL(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.EQUAL);
    	} else {
    		return this.getToken(OpenSearchPPLParser.EQUAL, i);
    	}
    }
    public CONSECUTIVE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CONSECUTIVE, 0);
    }
    public integerLiteral(): IntegerLiteralContext | null {
        return this.getRuleContext(0, IntegerLiteralContext);
    }
    public booleanLiteral(): BooleanLiteralContext[];
    public booleanLiteral(i: number): BooleanLiteralContext | null;
    public booleanLiteral(i?: number): BooleanLiteralContext[] | BooleanLiteralContext | null {
        if (i === undefined) {
            return this.getRuleContexts(BooleanLiteralContext);
        }

        return this.getRuleContext(i, BooleanLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_dedupCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitDedupCommand) {
            return visitor.visitDedupCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SortCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SORT(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.SORT, 0)!;
    }
    public sortbyClause(): SortbyClauseContext {
        return this.getRuleContext(0, SortbyClauseContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_sortCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitSortCommand) {
            return visitor.visitSortCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EvalCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EVAL(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.EVAL, 0)!;
    }
    public evalClause(): EvalClauseContext[];
    public evalClause(i: number): EvalClauseContext | null;
    public evalClause(i?: number): EvalClauseContext[] | EvalClauseContext | null {
        if (i === undefined) {
            return this.getRuleContexts(EvalClauseContext);
        }

        return this.getRuleContext(i, EvalClauseContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_evalCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitEvalCommand) {
            return visitor.visitEvalCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class HeadCommandContext extends antlr.ParserRuleContext {
    public _number_?: IntegerLiteralContext;
    public _from_?: IntegerLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public HEAD(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.HEAD, 0)!;
    }
    public FROM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FROM, 0);
    }
    public integerLiteral(): IntegerLiteralContext[];
    public integerLiteral(i: number): IntegerLiteralContext | null;
    public integerLiteral(i?: number): IntegerLiteralContext[] | IntegerLiteralContext | null {
        if (i === undefined) {
            return this.getRuleContexts(IntegerLiteralContext);
        }

        return this.getRuleContext(i, IntegerLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_headCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitHeadCommand) {
            return visitor.visitHeadCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TopCommandContext extends antlr.ParserRuleContext {
    public _number_?: IntegerLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TOP(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.TOP, 0)!;
    }
    public fieldList(): FieldListContext {
        return this.getRuleContext(0, FieldListContext)!;
    }
    public byClause(): ByClauseContext | null {
        return this.getRuleContext(0, ByClauseContext);
    }
    public integerLiteral(): IntegerLiteralContext | null {
        return this.getRuleContext(0, IntegerLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_topCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTopCommand) {
            return visitor.visitTopCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RareCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public RARE(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RARE, 0)!;
    }
    public fieldList(): FieldListContext {
        return this.getRuleContext(0, FieldListContext)!;
    }
    public byClause(): ByClauseContext | null {
        return this.getRuleContext(0, ByClauseContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_rareCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitRareCommand) {
            return visitor.visitRareCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GrokCommandContext extends antlr.ParserRuleContext {
    public _source_field?: ExpressionContext;
    public _pattern?: StringLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public GROK(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.GROK, 0)!;
    }
    public expression(): ExpressionContext | null {
        return this.getRuleContext(0, ExpressionContext);
    }
    public stringLiteral(): StringLiteralContext | null {
        return this.getRuleContext(0, StringLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_grokCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitGrokCommand) {
            return visitor.visitGrokCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ParseCommandContext extends antlr.ParserRuleContext {
    public _source_field?: ExpressionContext;
    public _pattern?: StringLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PARSE(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.PARSE, 0)!;
    }
    public expression(): ExpressionContext | null {
        return this.getRuleContext(0, ExpressionContext);
    }
    public stringLiteral(): StringLiteralContext | null {
        return this.getRuleContext(0, StringLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_parseCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitParseCommand) {
            return visitor.visitParseCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PatternsCommandContext extends antlr.ParserRuleContext {
    public _source_field?: ExpressionContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PATTERNS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.PATTERNS, 0)!;
    }
    public patternsParameter(): PatternsParameterContext[];
    public patternsParameter(i: number): PatternsParameterContext | null;
    public patternsParameter(i?: number): PatternsParameterContext[] | PatternsParameterContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PatternsParameterContext);
        }

        return this.getRuleContext(i, PatternsParameterContext);
    }
    public expression(): ExpressionContext | null {
        return this.getRuleContext(0, ExpressionContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_patternsCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitPatternsCommand) {
            return visitor.visitPatternsCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PatternsParameterContext extends antlr.ParserRuleContext {
    public _new_field?: StringLiteralContext;
    public _pattern?: StringLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NEW_FIELD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.NEW_FIELD, 0);
    }
    public EQUAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.EQUAL, 0);
    }
    public stringLiteral(): StringLiteralContext | null {
        return this.getRuleContext(0, StringLiteralContext);
    }
    public PATTERN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PATTERN, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_patternsParameter;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitPatternsParameter) {
            return visitor.visitPatternsParameter(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PatternsMethodContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PUNCT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PUNCT, 0);
    }
    public REGEX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.REGEX, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_patternsMethod;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitPatternsMethod) {
            return visitor.visitPatternsMethod(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class KmeansCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public KMEANS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.KMEANS, 0)!;
    }
    public kmeansParameter(): KmeansParameterContext[];
    public kmeansParameter(i: number): KmeansParameterContext | null;
    public kmeansParameter(i?: number): KmeansParameterContext[] | KmeansParameterContext | null {
        if (i === undefined) {
            return this.getRuleContexts(KmeansParameterContext);
        }

        return this.getRuleContext(i, KmeansParameterContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_kmeansCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitKmeansCommand) {
            return visitor.visitKmeansCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class KmeansParameterContext extends antlr.ParserRuleContext {
    public _centroids?: IntegerLiteralContext;
    public _iterations?: IntegerLiteralContext;
    public _distance_type?: StringLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public CENTROIDS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CENTROIDS, 0);
    }
    public EQUAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.EQUAL, 0);
    }
    public integerLiteral(): IntegerLiteralContext | null {
        return this.getRuleContext(0, IntegerLiteralContext);
    }
    public ITERATIONS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ITERATIONS, 0);
    }
    public DISTANCE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DISTANCE_TYPE, 0);
    }
    public stringLiteral(): StringLiteralContext | null {
        return this.getRuleContext(0, StringLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_kmeansParameter;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitKmeansParameter) {
            return visitor.visitKmeansParameter(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AdCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public AD(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.AD, 0)!;
    }
    public adParameter(): AdParameterContext[];
    public adParameter(i: number): AdParameterContext | null;
    public adParameter(i?: number): AdParameterContext[] | AdParameterContext | null {
        if (i === undefined) {
            return this.getRuleContexts(AdParameterContext);
        }

        return this.getRuleContext(i, AdParameterContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_adCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitAdCommand) {
            return visitor.visitAdCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AdParameterContext extends antlr.ParserRuleContext {
    public _number_of_trees?: IntegerLiteralContext;
    public _shingle_size?: IntegerLiteralContext;
    public _sample_size?: IntegerLiteralContext;
    public _output_after?: IntegerLiteralContext;
    public _time_decay?: DecimalLiteralContext;
    public _anomaly_rate?: DecimalLiteralContext;
    public _category_field?: StringLiteralContext;
    public _time_field?: StringLiteralContext;
    public _date_format?: StringLiteralContext;
    public _time_zone?: StringLiteralContext;
    public _training_data_size?: IntegerLiteralContext;
    public _anomaly_score_threshold?: DecimalLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NUMBER_OF_TREES(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.NUMBER_OF_TREES, 0);
    }
    public EQUAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.EQUAL, 0);
    }
    public integerLiteral(): IntegerLiteralContext | null {
        return this.getRuleContext(0, IntegerLiteralContext);
    }
    public SHINGLE_SIZE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SHINGLE_SIZE, 0);
    }
    public SAMPLE_SIZE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SAMPLE_SIZE, 0);
    }
    public OUTPUT_AFTER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.OUTPUT_AFTER, 0);
    }
    public TIME_DECAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME_DECAY, 0);
    }
    public decimalLiteral(): DecimalLiteralContext | null {
        return this.getRuleContext(0, DecimalLiteralContext);
    }
    public ANOMALY_RATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ANOMALY_RATE, 0);
    }
    public CATEGORY_FIELD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CATEGORY_FIELD, 0);
    }
    public stringLiteral(): StringLiteralContext | null {
        return this.getRuleContext(0, StringLiteralContext);
    }
    public TIME_FIELD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME_FIELD, 0);
    }
    public DATE_FORMAT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DATE_FORMAT, 0);
    }
    public TIME_ZONE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME_ZONE, 0);
    }
    public TRAINING_DATA_SIZE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TRAINING_DATA_SIZE, 0);
    }
    public ANOMALY_SCORE_THRESHOLD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ANOMALY_SCORE_THRESHOLD, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_adParameter;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitAdParameter) {
            return visitor.visitAdParameter(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class MlCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ML(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.ML, 0)!;
    }
    public mlArg(): MlArgContext[];
    public mlArg(i: number): MlArgContext | null;
    public mlArg(i?: number): MlArgContext[] | MlArgContext | null {
        if (i === undefined) {
            return this.getRuleContexts(MlArgContext);
        }

        return this.getRuleContext(i, MlArgContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_mlCommand;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitMlCommand) {
            return visitor.visitMlCommand(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class MlArgContext extends antlr.ParserRuleContext {
    public _argName?: IdentContext;
    public _argValue?: LiteralValueContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQUAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.EQUAL, 0);
    }
    public ident(): IdentContext | null {
        return this.getRuleContext(0, IdentContext);
    }
    public literalValue(): LiteralValueContext | null {
        return this.getRuleContext(0, LiteralValueContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_mlArg;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitMlArg) {
            return visitor.visitMlArg(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FromClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SOURCE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SOURCE, 0);
    }
    public EQUAL(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.EQUAL, 0)!;
    }
    public tableSourceClause(): TableSourceClauseContext {
        return this.getRuleContext(0, TableSourceClauseContext)!;
    }
    public INDEX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.INDEX, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_fromClause;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitFromClause) {
            return visitor.visitFromClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TableSourceClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public tableSource(): TableSourceContext {
        return this.getRuleContext(0, TableSourceContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_tableSourceClause;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTableSourceClause) {
            return visitor.visitTableSourceClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RenameClasueContext extends antlr.ParserRuleContext {
    public _orignalField?: WcFieldExpressionContext;
    public _renamedField?: WcFieldExpressionContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public AS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.AS, 0)!;
    }
    public wcFieldExpression(): WcFieldExpressionContext[];
    public wcFieldExpression(i: number): WcFieldExpressionContext | null;
    public wcFieldExpression(i?: number): WcFieldExpressionContext[] | WcFieldExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(WcFieldExpressionContext);
        }

        return this.getRuleContext(i, WcFieldExpressionContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_renameClasue;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitRenameClasue) {
            return visitor.visitRenameClasue(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ByClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BY(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.BY, 0)!;
    }
    public fieldList(): FieldListContext {
        return this.getRuleContext(0, FieldListContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_byClause;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitByClause) {
            return visitor.visitByClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class StatsByClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BY(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.BY, 0)!;
    }
    public fieldList(): FieldListContext | null {
        return this.getRuleContext(0, FieldListContext);
    }
    public bySpanClause(): BySpanClauseContext | null {
        return this.getRuleContext(0, BySpanClauseContext);
    }
    public COMMA(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.COMMA, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_statsByClause;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitStatsByClause) {
            return visitor.visitStatsByClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BySpanClauseContext extends antlr.ParserRuleContext {
    public _alias?: QualifiedNameContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public spanClause(): SpanClauseContext {
        return this.getRuleContext(0, SpanClauseContext)!;
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.AS, 0);
    }
    public qualifiedName(): QualifiedNameContext | null {
        return this.getRuleContext(0, QualifiedNameContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_bySpanClause;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitBySpanClause) {
            return visitor.visitBySpanClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SpanClauseContext extends antlr.ParserRuleContext {
    public _value?: LiteralValueContext;
    public _unit?: TimespanUnitContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SPAN(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.SPAN, 0)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public fieldExpression(): FieldExpressionContext {
        return this.getRuleContext(0, FieldExpressionContext)!;
    }
    public COMMA(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.COMMA, 0)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public literalValue(): LiteralValueContext {
        return this.getRuleContext(0, LiteralValueContext)!;
    }
    public timespanUnit(): TimespanUnitContext | null {
        return this.getRuleContext(0, TimespanUnitContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_spanClause;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitSpanClause) {
            return visitor.visitSpanClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SortbyClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public sortField(): SortFieldContext[];
    public sortField(i: number): SortFieldContext | null;
    public sortField(i?: number): SortFieldContext[] | SortFieldContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SortFieldContext);
        }

        return this.getRuleContext(i, SortFieldContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_sortbyClause;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitSortbyClause) {
            return visitor.visitSortbyClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EvalClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public fieldExpression(): FieldExpressionContext {
        return this.getRuleContext(0, FieldExpressionContext)!;
    }
    public EQUAL(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.EQUAL, 0)!;
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_evalClause;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitEvalClause) {
            return visitor.visitEvalClause(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class StatsAggTermContext extends antlr.ParserRuleContext {
    public _alias?: WcFieldExpressionContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public statsFunction(): StatsFunctionContext {
        return this.getRuleContext(0, StatsFunctionContext)!;
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.AS, 0);
    }
    public wcFieldExpression(): WcFieldExpressionContext | null {
        return this.getRuleContext(0, WcFieldExpressionContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_statsAggTerm;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitStatsAggTerm) {
            return visitor.visitStatsAggTerm(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class StatsFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_statsFunction;
    }
    public override copyFrom(ctx: StatsFunctionContext): void {
        super.copyFrom(ctx);
    }
}
export class DistinctCountFunctionCallContext extends StatsFunctionContext {
    public constructor(ctx: StatsFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public valueExpression(): ValueExpressionContext {
        return this.getRuleContext(0, ValueExpressionContext)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public DISTINCT_COUNT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DISTINCT_COUNT, 0);
    }
    public DC(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DC, 0);
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitDistinctCountFunctionCall) {
            return visitor.visitDistinctCountFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class StatsFunctionCallContext extends StatsFunctionContext {
    public constructor(ctx: StatsFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public statsFunctionName(): StatsFunctionNameContext {
        return this.getRuleContext(0, StatsFunctionNameContext)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public valueExpression(): ValueExpressionContext {
        return this.getRuleContext(0, ValueExpressionContext)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitStatsFunctionCall) {
            return visitor.visitStatsFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class CountAllFunctionCallContext extends StatsFunctionContext {
    public constructor(ctx: StatsFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public COUNT(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.COUNT, 0)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitCountAllFunctionCall) {
            return visitor.visitCountAllFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class PercentileAggFunctionCallContext extends StatsFunctionContext {
    public constructor(ctx: StatsFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public percentileAggFunction(): PercentileAggFunctionContext {
        return this.getRuleContext(0, PercentileAggFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitPercentileAggFunctionCall) {
            return visitor.visitPercentileAggFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class TakeAggFunctionCallContext extends StatsFunctionContext {
    public constructor(ctx: StatsFunctionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public takeAggFunction(): TakeAggFunctionContext {
        return this.getRuleContext(0, TakeAggFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTakeAggFunctionCall) {
            return visitor.visitTakeAggFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class StatsFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public AVG(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.AVG, 0);
    }
    public COUNT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.COUNT, 0);
    }
    public SUM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SUM, 0);
    }
    public MIN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MIN, 0);
    }
    public MAX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MAX, 0);
    }
    public VAR_SAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.VAR_SAMP, 0);
    }
    public VAR_POP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.VAR_POP, 0);
    }
    public STDDEV_SAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STDDEV_SAMP, 0);
    }
    public STDDEV_POP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STDDEV_POP, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_statsFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitStatsFunctionName) {
            return visitor.visitStatsFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TakeAggFunctionContext extends antlr.ParserRuleContext {
    public _size?: IntegerLiteralContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TAKE(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.TAKE, 0)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public fieldExpression(): FieldExpressionContext {
        return this.getRuleContext(0, FieldExpressionContext)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public COMMA(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.COMMA, 0);
    }
    public integerLiteral(): IntegerLiteralContext | null {
        return this.getRuleContext(0, IntegerLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_takeAggFunction;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTakeAggFunction) {
            return visitor.visitTakeAggFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PercentileAggFunctionContext extends antlr.ParserRuleContext {
    public _value?: IntegerLiteralContext;
    public _aggField?: FieldExpressionContext;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PERCENTILE(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.PERCENTILE, 0)!;
    }
    public LESS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LESS, 0)!;
    }
    public GREATER(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.GREATER, 0)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public integerLiteral(): IntegerLiteralContext {
        return this.getRuleContext(0, IntegerLiteralContext)!;
    }
    public fieldExpression(): FieldExpressionContext {
        return this.getRuleContext(0, FieldExpressionContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_percentileAggFunction;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitPercentileAggFunction) {
            return visitor.visitPercentileAggFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public logicalExpression(): LogicalExpressionContext | null {
        return this.getRuleContext(0, LogicalExpressionContext);
    }
    public comparisonExpression(): ComparisonExpressionContext | null {
        return this.getRuleContext(0, ComparisonExpressionContext);
    }
    public valueExpression(): ValueExpressionContext | null {
        return this.getRuleContext(0, ValueExpressionContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_expression;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitExpression) {
            return visitor.visitExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LogicalExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_logicalExpression;
    }
    public override copyFrom(ctx: LogicalExpressionContext): void {
        super.copyFrom(ctx);
    }
}
export class RelevanceExprContext extends LogicalExpressionContext {
    public constructor(ctx: LogicalExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public relevanceExpression(): RelevanceExpressionContext {
        return this.getRuleContext(0, RelevanceExpressionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceExpr) {
            return visitor.visitRelevanceExpr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class LogicalNotContext extends LogicalExpressionContext {
    public constructor(ctx: LogicalExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public NOT(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.NOT, 0)!;
    }
    public logicalExpression(): LogicalExpressionContext {
        return this.getRuleContext(0, LogicalExpressionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitLogicalNot) {
            return visitor.visitLogicalNot(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class BooleanExprContext extends LogicalExpressionContext {
    public constructor(ctx: LogicalExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public booleanExpression(): BooleanExpressionContext {
        return this.getRuleContext(0, BooleanExpressionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitBooleanExpr) {
            return visitor.visitBooleanExpr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class LogicalAndContext extends LogicalExpressionContext {
    public _left?: LogicalExpressionContext;
    public _right?: LogicalExpressionContext;
    public constructor(ctx: LogicalExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public logicalExpression(): LogicalExpressionContext[];
    public logicalExpression(i: number): LogicalExpressionContext | null;
    public logicalExpression(i?: number): LogicalExpressionContext[] | LogicalExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(LogicalExpressionContext);
        }

        return this.getRuleContext(i, LogicalExpressionContext);
    }
    public AND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.AND, 0);
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitLogicalAnd) {
            return visitor.visitLogicalAnd(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ComparsionContext extends LogicalExpressionContext {
    public constructor(ctx: LogicalExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public comparisonExpression(): ComparisonExpressionContext {
        return this.getRuleContext(0, ComparisonExpressionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitComparsion) {
            return visitor.visitComparsion(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class LogicalXorContext extends LogicalExpressionContext {
    public _left?: LogicalExpressionContext;
    public _right?: LogicalExpressionContext;
    public constructor(ctx: LogicalExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public XOR(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.XOR, 0)!;
    }
    public logicalExpression(): LogicalExpressionContext[];
    public logicalExpression(i: number): LogicalExpressionContext | null;
    public logicalExpression(i?: number): LogicalExpressionContext[] | LogicalExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(LogicalExpressionContext);
        }

        return this.getRuleContext(i, LogicalExpressionContext);
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitLogicalXor) {
            return visitor.visitLogicalXor(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class LogicalOrContext extends LogicalExpressionContext {
    public _left?: LogicalExpressionContext;
    public _right?: LogicalExpressionContext;
    public constructor(ctx: LogicalExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public OR(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.OR, 0)!;
    }
    public logicalExpression(): LogicalExpressionContext[];
    public logicalExpression(i: number): LogicalExpressionContext | null;
    public logicalExpression(i?: number): LogicalExpressionContext[] | LogicalExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(LogicalExpressionContext);
        }

        return this.getRuleContext(i, LogicalExpressionContext);
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitLogicalOr) {
            return visitor.visitLogicalOr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ComparisonExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_comparisonExpression;
    }
    public override copyFrom(ctx: ComparisonExpressionContext): void {
        super.copyFrom(ctx);
    }
}
export class InExprContext extends ComparisonExpressionContext {
    public constructor(ctx: ComparisonExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public valueExpression(): ValueExpressionContext {
        return this.getRuleContext(0, ValueExpressionContext)!;
    }
    public IN(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.IN, 0)!;
    }
    public valueList(): ValueListContext {
        return this.getRuleContext(0, ValueListContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitInExpr) {
            return visitor.visitInExpr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class CompareExprContext extends ComparisonExpressionContext {
    public _left?: ValueExpressionContext;
    public _right?: ValueExpressionContext;
    public constructor(ctx: ComparisonExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public comparisonOperator(): ComparisonOperatorContext {
        return this.getRuleContext(0, ComparisonOperatorContext)!;
    }
    public valueExpression(): ValueExpressionContext[];
    public valueExpression(i: number): ValueExpressionContext | null;
    public valueExpression(i?: number): ValueExpressionContext[] | ValueExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ValueExpressionContext);
        }

        return this.getRuleContext(i, ValueExpressionContext);
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitCompareExpr) {
            return visitor.visitCompareExpr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ValueExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_valueExpression;
    }
    public override copyFrom(ctx: ValueExpressionContext): void {
        super.copyFrom(ctx);
    }
}
export class PositionFunctionCallContext extends ValueExpressionContext {
    public constructor(ctx: ValueExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public positionFunction(): PositionFunctionContext {
        return this.getRuleContext(0, PositionFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitPositionFunctionCall) {
            return visitor.visitPositionFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ValueExpressionDefaultContext extends ValueExpressionContext {
    public constructor(ctx: ValueExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public primaryExpression(): PrimaryExpressionContext {
        return this.getRuleContext(0, PrimaryExpressionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitValueExpressionDefault) {
            return visitor.visitValueExpressionDefault(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ParentheticValueExprContext extends ValueExpressionContext {
    public constructor(ctx: ValueExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public valueExpression(): ValueExpressionContext {
        return this.getRuleContext(0, ValueExpressionContext)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitParentheticValueExpr) {
            return visitor.visitParentheticValueExpr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class GetFormatFunctionCallContext extends ValueExpressionContext {
    public constructor(ctx: ValueExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public getFormatFunction(): GetFormatFunctionContext {
        return this.getRuleContext(0, GetFormatFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitGetFormatFunctionCall) {
            return visitor.visitGetFormatFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class ExtractFunctionCallContext extends ValueExpressionContext {
    public constructor(ctx: ValueExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public extractFunction(): ExtractFunctionContext {
        return this.getRuleContext(0, ExtractFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitExtractFunctionCall) {
            return visitor.visitExtractFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
export class TimestampFunctionCallContext extends ValueExpressionContext {
    public constructor(ctx: ValueExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public timestampFunction(): TimestampFunctionContext {
        return this.getRuleContext(0, TimestampFunctionContext)!;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTimestampFunctionCall) {
            return visitor.visitTimestampFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PrimaryExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public evalFunctionCall(): EvalFunctionCallContext | null {
        return this.getRuleContext(0, EvalFunctionCallContext);
    }
    public dataTypeFunctionCall(): DataTypeFunctionCallContext | null {
        return this.getRuleContext(0, DataTypeFunctionCallContext);
    }
    public fieldExpression(): FieldExpressionContext | null {
        return this.getRuleContext(0, FieldExpressionContext);
    }
    public literalValue(): LiteralValueContext | null {
        return this.getRuleContext(0, LiteralValueContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_primaryExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitPrimaryExpression) {
            return visitor.visitPrimaryExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PositionFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public positionFunctionName(): PositionFunctionNameContext {
        return this.getRuleContext(0, PositionFunctionNameContext)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
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
        return this.getToken(OpenSearchPPLParser.IN, 0)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_positionFunction;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitPositionFunction) {
            return visitor.visitPositionFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BooleanExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public booleanFunctionCall(): BooleanFunctionCallContext {
        return this.getRuleContext(0, BooleanFunctionCallContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_booleanExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitBooleanExpression) {
            return visitor.visitBooleanExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RelevanceExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public singleFieldRelevanceFunction(): SingleFieldRelevanceFunctionContext | null {
        return this.getRuleContext(0, SingleFieldRelevanceFunctionContext);
    }
    public multiFieldRelevanceFunction(): MultiFieldRelevanceFunctionContext | null {
        return this.getRuleContext(0, MultiFieldRelevanceFunctionContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_relevanceExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceExpression) {
            return visitor.visitRelevanceExpression(this);
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
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLParser.COMMA, i);
    	}
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
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
        return OpenSearchPPLParser.RULE_singleFieldRelevanceFunction;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public LT_SQR_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_SQR_PRTHS, 0)!;
    }
    public RT_SQR_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_SQR_PRTHS, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLParser.COMMA, i);
    	}
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public relevanceFieldAndWeight(): RelevanceFieldAndWeightContext[];
    public relevanceFieldAndWeight(i: number): RelevanceFieldAndWeightContext | null;
    public relevanceFieldAndWeight(i?: number): RelevanceFieldAndWeightContext[] | RelevanceFieldAndWeightContext | null {
        if (i === undefined) {
            return this.getRuleContexts(RelevanceFieldAndWeightContext);
        }

        return this.getRuleContext(i, RelevanceFieldAndWeightContext);
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
        return OpenSearchPPLParser.RULE_multiFieldRelevanceFunction;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitMultiFieldRelevanceFunction) {
            return visitor.visitMultiFieldRelevanceFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TableSourceContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public tableQualifiedName(): TableQualifiedNameContext | null {
        return this.getRuleContext(0, TableQualifiedNameContext);
    }
    public ID_DATE_SUFFIX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ID_DATE_SUFFIX, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_tableSource;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTableSource) {
            return visitor.visitTableSource(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TableFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public functionArgs(): FunctionArgsContext {
        return this.getRuleContext(0, FunctionArgsContext)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_tableFunction;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTableFunction) {
            return visitor.visitTableFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FieldListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public fieldExpression(): FieldExpressionContext[];
    public fieldExpression(i: number): FieldExpressionContext | null;
    public fieldExpression(i?: number): FieldExpressionContext[] | FieldExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FieldExpressionContext);
        }

        return this.getRuleContext(i, FieldExpressionContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_fieldList;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitFieldList) {
            return visitor.visitFieldList(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class WcFieldListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public wcFieldExpression(): WcFieldExpressionContext[];
    public wcFieldExpression(i: number): WcFieldExpressionContext | null;
    public wcFieldExpression(i?: number): WcFieldExpressionContext[] | WcFieldExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(WcFieldExpressionContext);
        }

        return this.getRuleContext(i, WcFieldExpressionContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_wcFieldList;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitWcFieldList) {
            return visitor.visitWcFieldList(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SortFieldContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public sortFieldExpression(): SortFieldExpressionContext {
        return this.getRuleContext(0, SortFieldExpressionContext)!;
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PLUS, 0);
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUS, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_sortField;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitSortField) {
            return visitor.visitSortField(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SortFieldExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public fieldExpression(): FieldExpressionContext {
        return this.getRuleContext(0, FieldExpressionContext)!;
    }
    public AUTO(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.AUTO, 0);
    }
    public LT_PRTHS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0);
    }
    public RT_PRTHS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0);
    }
    public STR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STR, 0);
    }
    public IP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.IP, 0);
    }
    public NUM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.NUM, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_sortFieldExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitSortFieldExpression) {
            return visitor.visitSortFieldExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FieldExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_fieldExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitFieldExpression) {
            return visitor.visitFieldExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class WcFieldExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public wcQualifiedName(): WcQualifiedNameContext {
        return this.getRuleContext(0, WcQualifiedNameContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_wcFieldExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitWcFieldExpression) {
            return visitor.visitWcFieldExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EvalFunctionCallContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public evalFunctionName(): EvalFunctionNameContext {
        return this.getRuleContext(0, EvalFunctionNameContext)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public functionArgs(): FunctionArgsContext {
        return this.getRuleContext(0, FunctionArgsContext)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_evalFunctionCall;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitEvalFunctionCall) {
            return visitor.visitEvalFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DataTypeFunctionCallContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public CAST(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.CAST, 0)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
    }
    public AS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.AS, 0)!;
    }
    public convertedDataType(): ConvertedDataTypeContext {
        return this.getRuleContext(0, ConvertedDataTypeContext)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_dataTypeFunctionCall;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitDataTypeFunctionCall) {
            return visitor.visitDataTypeFunctionCall(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BooleanFunctionCallContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public conditionFunctionBase(): ConditionFunctionBaseContext {
        return this.getRuleContext(0, ConditionFunctionBaseContext)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public functionArgs(): FunctionArgsContext {
        return this.getRuleContext(0, FunctionArgsContext)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_booleanFunctionCall;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitBooleanFunctionCall) {
            return visitor.visitBooleanFunctionCall(this);
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
        return this.getToken(OpenSearchPPLParser.DATE, 0);
    }
    public TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME, 0);
    }
    public TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIMESTAMP, 0);
    }
    public INT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.INT, 0);
    }
    public INTEGER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.INTEGER, 0);
    }
    public DOUBLE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DOUBLE, 0);
    }
    public LONG(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LONG, 0);
    }
    public FLOAT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FLOAT, 0);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STRING, 0);
    }
    public BOOLEAN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.BOOLEAN, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_convertedDataType;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitConvertedDataType) {
            return visitor.visitConvertedDataType(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EvalFunctionNameContext extends antlr.ParserRuleContext {
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
    public conditionFunctionBase(): ConditionFunctionBaseContext | null {
        return this.getRuleContext(0, ConditionFunctionBaseContext);
    }
    public systemFunctionName(): SystemFunctionNameContext | null {
        return this.getRuleContext(0, SystemFunctionNameContext);
    }
    public positionFunctionName(): PositionFunctionNameContext | null {
        return this.getRuleContext(0, PositionFunctionNameContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_evalFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitEvalFunctionName) {
            return visitor.visitEvalFunctionName(this);
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
    		return this.getTokens(OpenSearchPPLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_functionArgs;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
    public valueExpression(): ValueExpressionContext {
        return this.getRuleContext(0, ValueExpressionContext)!;
    }
    public ident(): IdentContext | null {
        return this.getRuleContext(0, IdentContext);
    }
    public EQUAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.EQUAL, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_functionArg;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitFunctionArg) {
            return visitor.visitFunctionArg(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RelevanceArgContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public relevanceArgName(): RelevanceArgNameContext {
        return this.getRuleContext(0, RelevanceArgNameContext)!;
    }
    public EQUAL(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.EQUAL, 0)!;
    }
    public relevanceArgValue(): RelevanceArgValueContext {
        return this.getRuleContext(0, RelevanceArgValueContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_relevanceArg;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceArg) {
            return visitor.visitRelevanceArg(this);
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
        return this.getToken(OpenSearchPPLParser.ALLOW_LEADING_WILDCARD, 0);
    }
    public ANALYZER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ANALYZER, 0);
    }
    public ANALYZE_WILDCARD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ANALYZE_WILDCARD, 0);
    }
    public AUTO_GENERATE_SYNONYMS_PHRASE_QUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.AUTO_GENERATE_SYNONYMS_PHRASE_QUERY, 0);
    }
    public BOOST(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.BOOST, 0);
    }
    public CUTOFF_FREQUENCY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CUTOFF_FREQUENCY, 0);
    }
    public DEFAULT_FIELD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DEFAULT_FIELD, 0);
    }
    public DEFAULT_OPERATOR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DEFAULT_OPERATOR, 0);
    }
    public ENABLE_POSITION_INCREMENTS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ENABLE_POSITION_INCREMENTS, 0);
    }
    public ESCAPE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ESCAPE, 0);
    }
    public FIELDS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FIELDS, 0);
    }
    public FLAGS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FLAGS, 0);
    }
    public FUZZINESS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FUZZINESS, 0);
    }
    public FUZZY_MAX_EXPANSIONS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FUZZY_MAX_EXPANSIONS, 0);
    }
    public FUZZY_PREFIX_LENGTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FUZZY_PREFIX_LENGTH, 0);
    }
    public FUZZY_REWRITE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FUZZY_REWRITE, 0);
    }
    public FUZZY_TRANSPOSITIONS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FUZZY_TRANSPOSITIONS, 0);
    }
    public LENIENT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LENIENT, 0);
    }
    public LOW_FREQ_OPERATOR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LOW_FREQ_OPERATOR, 0);
    }
    public MAX_DETERMINIZED_STATES(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MAX_DETERMINIZED_STATES, 0);
    }
    public MAX_EXPANSIONS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MAX_EXPANSIONS, 0);
    }
    public MINIMUM_SHOULD_MATCH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINIMUM_SHOULD_MATCH, 0);
    }
    public OPERATOR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.OPERATOR, 0);
    }
    public PHRASE_SLOP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PHRASE_SLOP, 0);
    }
    public PREFIX_LENGTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PREFIX_LENGTH, 0);
    }
    public QUOTE_ANALYZER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.QUOTE_ANALYZER, 0);
    }
    public QUOTE_FIELD_SUFFIX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.QUOTE_FIELD_SUFFIX, 0);
    }
    public REWRITE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.REWRITE, 0);
    }
    public SLOP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SLOP, 0);
    }
    public TIE_BREAKER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIE_BREAKER, 0);
    }
    public TIME_ZONE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME_ZONE, 0);
    }
    public TYPE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TYPE, 0);
    }
    public ZERO_TERMS_QUERY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ZERO_TERMS_QUERY, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_relevanceArgName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceArgName) {
            return visitor.visitRelevanceArgName(this);
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
        return this.getToken(OpenSearchPPLParser.BIT_XOR_OP, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_relevanceFieldAndWeight;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
    public integerLiteral(): IntegerLiteralContext | null {
        return this.getRuleContext(0, IntegerLiteralContext);
    }
    public decimalLiteral(): DecimalLiteralContext | null {
        return this.getRuleContext(0, DecimalLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_relevanceFieldWeight;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
        return OpenSearchPPLParser.RULE_relevanceField;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
        return OpenSearchPPLParser.RULE_relevanceQuery;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
    public literalValue(): LiteralValueContext | null {
        return this.getRuleContext(0, LiteralValueContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_relevanceArgValue;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitRelevanceArgValue) {
            return visitor.visitRelevanceArgValue(this);
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
        return this.getToken(OpenSearchPPLParser.ABS, 0);
    }
    public CBRT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CBRT, 0);
    }
    public CEIL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CEIL, 0);
    }
    public CEILING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CEILING, 0);
    }
    public CONV(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CONV, 0);
    }
    public CRC32(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CRC32, 0);
    }
    public E(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.E, 0);
    }
    public EXP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.EXP, 0);
    }
    public FLOOR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FLOOR, 0);
    }
    public LN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LN, 0);
    }
    public LOG(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LOG, 0);
    }
    public LOG10(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LOG10, 0);
    }
    public LOG2(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LOG2, 0);
    }
    public MOD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MOD, 0);
    }
    public PI(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PI, 0);
    }
    public POW(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.POW, 0);
    }
    public POWER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.POWER, 0);
    }
    public RAND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.RAND, 0);
    }
    public ROUND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ROUND, 0);
    }
    public SIGN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SIGN, 0);
    }
    public SQRT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SQRT, 0);
    }
    public TRUNCATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TRUNCATE, 0);
    }
    public trigonometricFunctionName(): TrigonometricFunctionNameContext | null {
        return this.getRuleContext(0, TrigonometricFunctionNameContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_mathematicalFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
        return this.getToken(OpenSearchPPLParser.ACOS, 0);
    }
    public ASIN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ASIN, 0);
    }
    public ATAN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ATAN, 0);
    }
    public ATAN2(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ATAN2, 0);
    }
    public COS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.COS, 0);
    }
    public COT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.COT, 0);
    }
    public DEGREES(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DEGREES, 0);
    }
    public RADIANS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.RADIANS, 0);
    }
    public SIN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SIN, 0);
    }
    public TAN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TAN, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_trigonometricFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTrigonometricFunctionName) {
            return visitor.visitTrigonometricFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DateTimeFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ADDDATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ADDDATE, 0);
    }
    public ADDTIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ADDTIME, 0);
    }
    public CONVERT_TZ(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CONVERT_TZ, 0);
    }
    public CURDATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CURDATE, 0);
    }
    public CURRENT_DATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CURRENT_DATE, 0);
    }
    public CURRENT_TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CURRENT_TIME, 0);
    }
    public CURRENT_TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CURRENT_TIMESTAMP, 0);
    }
    public CURTIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CURTIME, 0);
    }
    public DATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DATE, 0);
    }
    public DATEDIFF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DATEDIFF, 0);
    }
    public DATETIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DATETIME, 0);
    }
    public DATE_ADD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DATE_ADD, 0);
    }
    public DATE_FORMAT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DATE_FORMAT, 0);
    }
    public DATE_SUB(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DATE_SUB, 0);
    }
    public DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY, 0);
    }
    public DAYNAME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAYNAME, 0);
    }
    public DAYOFMONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAYOFMONTH, 0);
    }
    public DAYOFWEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAYOFWEEK, 0);
    }
    public DAYOFYEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAYOFYEAR, 0);
    }
    public DAY_OF_MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY_OF_MONTH, 0);
    }
    public DAY_OF_WEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY_OF_WEEK, 0);
    }
    public DAY_OF_YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY_OF_YEAR, 0);
    }
    public FROM_DAYS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FROM_DAYS, 0);
    }
    public FROM_UNIXTIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FROM_UNIXTIME, 0);
    }
    public HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HOUR, 0);
    }
    public HOUR_OF_DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HOUR_OF_DAY, 0);
    }
    public LAST_DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LAST_DAY, 0);
    }
    public LOCALTIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LOCALTIME, 0);
    }
    public LOCALTIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LOCALTIMESTAMP, 0);
    }
    public MAKEDATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MAKEDATE, 0);
    }
    public MAKETIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MAKETIME, 0);
    }
    public MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MICROSECOND, 0);
    }
    public MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUTE, 0);
    }
    public MINUTE_OF_DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUTE_OF_DAY, 0);
    }
    public MINUTE_OF_HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUTE_OF_HOUR, 0);
    }
    public MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MONTH, 0);
    }
    public MONTHNAME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MONTHNAME, 0);
    }
    public MONTH_OF_YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MONTH_OF_YEAR, 0);
    }
    public NOW(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.NOW, 0);
    }
    public PERIOD_ADD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PERIOD_ADD, 0);
    }
    public PERIOD_DIFF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PERIOD_DIFF, 0);
    }
    public QUARTER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.QUARTER, 0);
    }
    public SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SECOND, 0);
    }
    public SECOND_OF_MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SECOND_OF_MINUTE, 0);
    }
    public SEC_TO_TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SEC_TO_TIME, 0);
    }
    public STR_TO_DATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STR_TO_DATE, 0);
    }
    public SUBDATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SUBDATE, 0);
    }
    public SUBTIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SUBTIME, 0);
    }
    public SYSDATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SYSDATE, 0);
    }
    public TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME, 0);
    }
    public TIMEDIFF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIMEDIFF, 0);
    }
    public TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIMESTAMP, 0);
    }
    public TIME_FORMAT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME_FORMAT, 0);
    }
    public TIME_TO_SEC(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME_TO_SEC, 0);
    }
    public TO_DAYS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TO_DAYS, 0);
    }
    public TO_SECONDS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TO_SECONDS, 0);
    }
    public UNIX_TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.UNIX_TIMESTAMP, 0);
    }
    public UTC_DATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.UTC_DATE, 0);
    }
    public UTC_TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.UTC_TIME, 0);
    }
    public UTC_TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.UTC_TIMESTAMP, 0);
    }
    public WEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.WEEK, 0);
    }
    public WEEKDAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.WEEKDAY, 0);
    }
    public WEEK_OF_YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.WEEK_OF_YEAR, 0);
    }
    public YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.YEAR, 0);
    }
    public YEARWEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.YEARWEEK, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_dateTimeFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitDateTimeFunctionName) {
            return visitor.visitDateTimeFunctionName(this);
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
        return this.getToken(OpenSearchPPLParser.GET_FORMAT, 0)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public getFormatType(): GetFormatTypeContext {
        return this.getRuleContext(0, GetFormatTypeContext)!;
    }
    public COMMA(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.COMMA, 0)!;
    }
    public functionArg(): FunctionArgContext {
        return this.getRuleContext(0, FunctionArgContext)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_getFormatFunction;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
        return this.getToken(OpenSearchPPLParser.DATE, 0);
    }
    public DATETIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DATETIME, 0);
    }
    public TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME, 0);
    }
    public TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIMESTAMP, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_getFormatType;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
        return this.getToken(OpenSearchPPLParser.EXTRACT, 0)!;
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public datetimePart(): DatetimePartContext {
        return this.getRuleContext(0, DatetimePartContext)!;
    }
    public FROM(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.FROM, 0)!;
    }
    public functionArg(): FunctionArgContext {
        return this.getRuleContext(0, FunctionArgContext)!;
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_extractFunction;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
        return this.getToken(OpenSearchPPLParser.MICROSECOND, 0);
    }
    public SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SECOND, 0);
    }
    public MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUTE, 0);
    }
    public HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HOUR, 0);
    }
    public DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY, 0);
    }
    public WEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.WEEK, 0);
    }
    public MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MONTH, 0);
    }
    public QUARTER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.QUARTER, 0);
    }
    public YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.YEAR, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_simpleDateTimePart;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
        return this.getToken(OpenSearchPPLParser.SECOND_MICROSECOND, 0);
    }
    public MINUTE_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUTE_MICROSECOND, 0);
    }
    public MINUTE_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUTE_SECOND, 0);
    }
    public HOUR_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HOUR_MICROSECOND, 0);
    }
    public HOUR_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HOUR_SECOND, 0);
    }
    public HOUR_MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HOUR_MINUTE, 0);
    }
    public DAY_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY_MICROSECOND, 0);
    }
    public DAY_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY_SECOND, 0);
    }
    public DAY_MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY_MINUTE, 0);
    }
    public DAY_HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY_HOUR, 0);
    }
    public YEAR_MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.YEAR_MONTH, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_complexDateTimePart;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
        return OpenSearchPPLParser.RULE_datetimePart;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitDatetimePart) {
            return visitor.visitDatetimePart(this);
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
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public simpleDateTimePart(): SimpleDateTimePartContext {
        return this.getRuleContext(0, SimpleDateTimePartContext)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLParser.COMMA, i);
    	}
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
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
        return OpenSearchPPLParser.RULE_timestampFunction;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
        return this.getToken(OpenSearchPPLParser.TIMESTAMPADD, 0);
    }
    public TIMESTAMPDIFF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIMESTAMPDIFF, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_timestampFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTimestampFunctionName) {
            return visitor.visitTimestampFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ConditionFunctionBaseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LIKE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LIKE, 0);
    }
    public IF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.IF, 0);
    }
    public ISNULL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ISNULL, 0);
    }
    public ISNOTNULL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ISNOTNULL, 0);
    }
    public IFNULL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.IFNULL, 0);
    }
    public NULLIF(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.NULLIF, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_conditionFunctionBase;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitConditionFunctionBase) {
            return visitor.visitConditionFunctionBase(this);
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
        return this.getToken(OpenSearchPPLParser.TYPEOF, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_systemFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitSystemFunctionName) {
            return visitor.visitSystemFunctionName(this);
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
        return this.getToken(OpenSearchPPLParser.SUBSTR, 0);
    }
    public SUBSTRING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SUBSTRING, 0);
    }
    public TRIM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TRIM, 0);
    }
    public LTRIM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LTRIM, 0);
    }
    public RTRIM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.RTRIM, 0);
    }
    public LOWER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LOWER, 0);
    }
    public UPPER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.UPPER, 0);
    }
    public CONCAT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CONCAT, 0);
    }
    public CONCAT_WS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CONCAT_WS, 0);
    }
    public LENGTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LENGTH, 0);
    }
    public STRCMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STRCMP, 0);
    }
    public RIGHT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.RIGHT, 0);
    }
    public LEFT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LEFT, 0);
    }
    public ASCII(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ASCII, 0);
    }
    public LOCATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LOCATE, 0);
    }
    public REPLACE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.REPLACE, 0);
    }
    public REVERSE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.REVERSE, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_textFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTextFunctionName) {
            return visitor.visitTextFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PositionFunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public POSITION(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.POSITION, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_positionFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitPositionFunctionName) {
            return visitor.visitPositionFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ComparisonOperatorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQUAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.EQUAL, 0);
    }
    public NOT_EQUAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.NOT_EQUAL, 0);
    }
    public LESS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LESS, 0);
    }
    public NOT_LESS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.NOT_LESS, 0);
    }
    public GREATER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.GREATER, 0);
    }
    public NOT_GREATER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.NOT_GREATER, 0);
    }
    public REGEXP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.REGEXP, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_comparisonOperator;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitComparisonOperator) {
            return visitor.visitComparisonOperator(this);
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
        return this.getToken(OpenSearchPPLParser.MATCH, 0);
    }
    public MATCH_PHRASE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MATCH_PHRASE, 0);
    }
    public MATCH_BOOL_PREFIX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MATCH_BOOL_PREFIX, 0);
    }
    public MATCH_PHRASE_PREFIX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MATCH_PHRASE_PREFIX, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_singleFieldRelevanceFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
    public SIMPLE_QUERY_STRING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SIMPLE_QUERY_STRING, 0);
    }
    public MULTI_MATCH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MULTI_MATCH, 0);
    }
    public QUERY_STRING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.QUERY_STRING, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_multiFieldRelevanceFunctionName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitMultiFieldRelevanceFunctionName) {
            return visitor.visitMultiFieldRelevanceFunctionName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LiteralValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public intervalLiteral(): IntervalLiteralContext | null {
        return this.getRuleContext(0, IntervalLiteralContext);
    }
    public stringLiteral(): StringLiteralContext | null {
        return this.getRuleContext(0, StringLiteralContext);
    }
    public integerLiteral(): IntegerLiteralContext | null {
        return this.getRuleContext(0, IntegerLiteralContext);
    }
    public decimalLiteral(): DecimalLiteralContext | null {
        return this.getRuleContext(0, DecimalLiteralContext);
    }
    public booleanLiteral(): BooleanLiteralContext | null {
        return this.getRuleContext(0, BooleanLiteralContext);
    }
    public datetimeLiteral(): DatetimeLiteralContext | null {
        return this.getRuleContext(0, DatetimeLiteralContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_literalValue;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitLiteralValue) {
            return visitor.visitLiteralValue(this);
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
        return this.getToken(OpenSearchPPLParser.INTERVAL, 0)!;
    }
    public valueExpression(): ValueExpressionContext {
        return this.getRuleContext(0, ValueExpressionContext)!;
    }
    public intervalUnit(): IntervalUnitContext {
        return this.getRuleContext(0, IntervalUnitContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_intervalLiteral;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitIntervalLiteral) {
            return visitor.visitIntervalLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class StringLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DQUOTA_STRING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DQUOTA_STRING, 0);
    }
    public SQUOTA_STRING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SQUOTA_STRING, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_stringLiteral;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitStringLiteral) {
            return visitor.visitStringLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class IntegerLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public INTEGER_LITERAL(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.INTEGER_LITERAL, 0)!;
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PLUS, 0);
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUS, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_integerLiteral;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitIntegerLiteral) {
            return visitor.visitIntegerLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DecimalLiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DECIMAL_LITERAL(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.DECIMAL_LITERAL, 0)!;
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PLUS, 0);
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUS, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_decimalLiteral;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitDecimalLiteral) {
            return visitor.visitDecimalLiteral(this);
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
        return this.getToken(OpenSearchPPLParser.TRUE, 0);
    }
    public FALSE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FALSE, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_booleanLiteral;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitBooleanLiteral) {
            return visitor.visitBooleanLiteral(this);
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
        return OpenSearchPPLParser.RULE_datetimeLiteral;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
    public DATE(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.DATE, 0)!;
    }
    public stringLiteral(): StringLiteralContext {
        return this.getRuleContext(0, StringLiteralContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_dateLiteral;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
    public TIME(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.TIME, 0)!;
    }
    public stringLiteral(): StringLiteralContext {
        return this.getRuleContext(0, StringLiteralContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_timeLiteral;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
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
    public TIMESTAMP(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.TIMESTAMP, 0)!;
    }
    public stringLiteral(): StringLiteralContext {
        return this.getRuleContext(0, StringLiteralContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_timestampLiteral;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTimestampLiteral) {
            return visitor.visitTimestampLiteral(this);
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
        return this.getToken(OpenSearchPPLParser.MICROSECOND, 0);
    }
    public SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SECOND, 0);
    }
    public MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUTE, 0);
    }
    public HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HOUR, 0);
    }
    public DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY, 0);
    }
    public WEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.WEEK, 0);
    }
    public MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MONTH, 0);
    }
    public QUARTER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.QUARTER, 0);
    }
    public YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.YEAR, 0);
    }
    public SECOND_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SECOND_MICROSECOND, 0);
    }
    public MINUTE_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUTE_MICROSECOND, 0);
    }
    public MINUTE_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUTE_SECOND, 0);
    }
    public HOUR_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HOUR_MICROSECOND, 0);
    }
    public HOUR_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HOUR_SECOND, 0);
    }
    public HOUR_MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HOUR_MINUTE, 0);
    }
    public DAY_MICROSECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY_MICROSECOND, 0);
    }
    public DAY_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY_SECOND, 0);
    }
    public DAY_MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY_MINUTE, 0);
    }
    public DAY_HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY_HOUR, 0);
    }
    public YEAR_MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.YEAR_MONTH, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_intervalUnit;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitIntervalUnit) {
            return visitor.visitIntervalUnit(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TimespanUnitContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MS, 0);
    }
    public S(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.S, 0);
    }
    public M(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.M, 0);
    }
    public H(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.H, 0);
    }
    public D(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.D, 0);
    }
    public W(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.W, 0);
    }
    public Q(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.Q, 0);
    }
    public Y(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.Y, 0);
    }
    public MILLISECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MILLISECOND, 0);
    }
    public SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SECOND, 0);
    }
    public MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MINUTE, 0);
    }
    public HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HOUR, 0);
    }
    public DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DAY, 0);
    }
    public WEEK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.WEEK, 0);
    }
    public MONTH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MONTH, 0);
    }
    public QUARTER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.QUARTER, 0);
    }
    public YEAR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.YEAR, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_timespanUnit;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTimespanUnit) {
            return visitor.visitTimespanUnit(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ValueListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.LT_PRTHS, 0)!;
    }
    public literalValue(): LiteralValueContext[];
    public literalValue(i: number): LiteralValueContext | null;
    public literalValue(i?: number): LiteralValueContext[] | LiteralValueContext | null {
        if (i === undefined) {
            return this.getRuleContexts(LiteralValueContext);
        }

        return this.getRuleContext(i, LiteralValueContext);
    }
    public RT_PRTHS(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.RT_PRTHS, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_valueList;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitValueList) {
            return visitor.visitValueList(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class QualifiedNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ID(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLParser.ID, 0)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_qualifiedName;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitQualifiedName) {
            return visitor.visitQualifiedName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TableQualifiedNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_tableQualifiedName;
    }
    public override copyFrom(ctx: TableQualifiedNameContext): void {
        super.copyFrom(ctx);
    }
}
export class IdentsAsTableQualifiedNameContext extends TableQualifiedNameContext {
    public constructor(ctx: TableQualifiedNameContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public tableIdent(): TableIdentContext {
        return this.getRuleContext(0, TableIdentContext)!;
    }
    public DOT(): antlr.TerminalNode[];
    public DOT(i: number): antlr.TerminalNode | null;
    public DOT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.DOT);
    	} else {
    		return this.getToken(OpenSearchPPLParser.DOT, i);
    	}
    }
    public ident(): IdentContext[];
    public ident(i: number): IdentContext | null;
    public ident(i?: number): IdentContext[] | IdentContext | null {
        if (i === undefined) {
            return this.getRuleContexts(IdentContext);
        }

        return this.getRuleContext(i, IdentContext);
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitIdentsAsTableQualifiedName) {
            return visitor.visitIdentsAsTableQualifiedName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class WcQualifiedNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_wcQualifiedName;
    }
    public override copyFrom(ctx: WcQualifiedNameContext): void {
        super.copyFrom(ctx);
    }
}
export class IdentsAsWildcardQualifiedNameContext extends WcQualifiedNameContext {
    public constructor(ctx: WcQualifiedNameContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public wildcard(): WildcardContext[];
    public wildcard(i: number): WildcardContext | null;
    public wildcard(i?: number): WildcardContext[] | WildcardContext | null {
        if (i === undefined) {
            return this.getRuleContexts(WildcardContext);
        }

        return this.getRuleContext(i, WildcardContext);
    }
    public DOT(): antlr.TerminalNode[];
    public DOT(i: number): antlr.TerminalNode | null;
    public DOT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.DOT);
    	} else {
    		return this.getToken(OpenSearchPPLParser.DOT, i);
    	}
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitIdentsAsWildcardQualifiedName) {
            return visitor.visitIdentsAsWildcardQualifiedName(this);
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
        return this.getToken(OpenSearchPPLParser.ID, 0);
    }
    public DOT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DOT, 0);
    }
    public BACKTICK(): antlr.TerminalNode[];
    public BACKTICK(i: number): antlr.TerminalNode | null;
    public BACKTICK(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.BACKTICK);
    	} else {
    		return this.getToken(OpenSearchPPLParser.BACKTICK, i);
    	}
    }
    public ident(): IdentContext | null {
        return this.getRuleContext(0, IdentContext);
    }
    public BQUOTA_STRING(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.BQUOTA_STRING, 0);
    }
    public keywordsCanBeId(): KeywordsCanBeIdContext | null {
        return this.getRuleContext(0, KeywordsCanBeIdContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_ident;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitIdent) {
            return visitor.visitIdent(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TableIdentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ident(): IdentContext {
        return this.getRuleContext(0, IdentContext)!;
    }
    public CLUSTER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CLUSTER, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_tableIdent;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitTableIdent) {
            return visitor.visitTableIdent(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class WildcardContext extends antlr.ParserRuleContext {
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
    public MODULE(): antlr.TerminalNode[];
    public MODULE(i: number): antlr.TerminalNode | null;
    public MODULE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.MODULE);
    	} else {
    		return this.getToken(OpenSearchPPLParser.MODULE, i);
    	}
    }
    public SINGLE_QUOTE(): antlr.TerminalNode[];
    public SINGLE_QUOTE(i: number): antlr.TerminalNode | null;
    public SINGLE_QUOTE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.SINGLE_QUOTE);
    	} else {
    		return this.getToken(OpenSearchPPLParser.SINGLE_QUOTE, i);
    	}
    }
    public wildcard(): WildcardContext | null {
        return this.getRuleContext(0, WildcardContext);
    }
    public DOUBLE_QUOTE(): antlr.TerminalNode[];
    public DOUBLE_QUOTE(i: number): antlr.TerminalNode | null;
    public DOUBLE_QUOTE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.DOUBLE_QUOTE);
    	} else {
    		return this.getToken(OpenSearchPPLParser.DOUBLE_QUOTE, i);
    	}
    }
    public BACKTICK(): antlr.TerminalNode[];
    public BACKTICK(i: number): antlr.TerminalNode | null;
    public BACKTICK(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLParser.BACKTICK);
    	} else {
    		return this.getToken(OpenSearchPPLParser.BACKTICK, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_wildcard;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitWildcard) {
            return visitor.visitWildcard(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class KeywordsCanBeIdContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public D(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.D, 0);
    }
    public timespanUnit(): TimespanUnitContext | null {
        return this.getRuleContext(0, TimespanUnitContext);
    }
    public SPAN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SPAN, 0);
    }
    public evalFunctionName(): EvalFunctionNameContext | null {
        return this.getRuleContext(0, EvalFunctionNameContext);
    }
    public relevanceArgName(): RelevanceArgNameContext | null {
        return this.getRuleContext(0, RelevanceArgNameContext);
    }
    public intervalUnit(): IntervalUnitContext | null {
        return this.getRuleContext(0, IntervalUnitContext);
    }
    public dateTimeFunctionName(): DateTimeFunctionNameContext | null {
        return this.getRuleContext(0, DateTimeFunctionNameContext);
    }
    public textFunctionName(): TextFunctionNameContext | null {
        return this.getRuleContext(0, TextFunctionNameContext);
    }
    public mathematicalFunctionName(): MathematicalFunctionNameContext | null {
        return this.getRuleContext(0, MathematicalFunctionNameContext);
    }
    public positionFunctionName(): PositionFunctionNameContext | null {
        return this.getRuleContext(0, PositionFunctionNameContext);
    }
    public SEARCH(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SEARCH, 0);
    }
    public DESCRIBE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DESCRIBE, 0);
    }
    public SHOW(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SHOW, 0);
    }
    public FROM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FROM, 0);
    }
    public WHERE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.WHERE, 0);
    }
    public FIELDS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FIELDS, 0);
    }
    public RENAME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.RENAME, 0);
    }
    public STATS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STATS, 0);
    }
    public DEDUP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DEDUP, 0);
    }
    public SORT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SORT, 0);
    }
    public EVAL(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.EVAL, 0);
    }
    public HEAD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.HEAD, 0);
    }
    public TOP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TOP, 0);
    }
    public RARE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.RARE, 0);
    }
    public PARSE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PARSE, 0);
    }
    public METHOD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.METHOD, 0);
    }
    public REGEX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.REGEX, 0);
    }
    public PUNCT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PUNCT, 0);
    }
    public GROK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.GROK, 0);
    }
    public PATTERN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PATTERN, 0);
    }
    public PATTERNS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PATTERNS, 0);
    }
    public NEW_FIELD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.NEW_FIELD, 0);
    }
    public KMEANS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.KMEANS, 0);
    }
    public AD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.AD, 0);
    }
    public ML(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ML, 0);
    }
    public SOURCE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SOURCE, 0);
    }
    public INDEX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.INDEX, 0);
    }
    public DESC(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DESC, 0);
    }
    public DATASOURCES(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DATASOURCES, 0);
    }
    public SORTBY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SORTBY, 0);
    }
    public STR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STR, 0);
    }
    public IP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.IP, 0);
    }
    public NUM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.NUM, 0);
    }
    public KEEPEMPTY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.KEEPEMPTY, 0);
    }
    public CONSECUTIVE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CONSECUTIVE, 0);
    }
    public DEDUP_SPLITVALUES(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DEDUP_SPLITVALUES, 0);
    }
    public PARTITIONS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PARTITIONS, 0);
    }
    public ALLNUM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ALLNUM, 0);
    }
    public DELIM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DELIM, 0);
    }
    public CENTROIDS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CENTROIDS, 0);
    }
    public ITERATIONS(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ITERATIONS, 0);
    }
    public DISTANCE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DISTANCE_TYPE, 0);
    }
    public NUMBER_OF_TREES(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.NUMBER_OF_TREES, 0);
    }
    public SHINGLE_SIZE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SHINGLE_SIZE, 0);
    }
    public SAMPLE_SIZE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SAMPLE_SIZE, 0);
    }
    public OUTPUT_AFTER(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.OUTPUT_AFTER, 0);
    }
    public TIME_DECAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME_DECAY, 0);
    }
    public ANOMALY_RATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ANOMALY_RATE, 0);
    }
    public CATEGORY_FIELD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.CATEGORY_FIELD, 0);
    }
    public TIME_FIELD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME_FIELD, 0);
    }
    public TIME_ZONE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TIME_ZONE, 0);
    }
    public TRAINING_DATA_SIZE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TRAINING_DATA_SIZE, 0);
    }
    public ANOMALY_SCORE_THRESHOLD(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ANOMALY_SCORE_THRESHOLD, 0);
    }
    public AVG(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.AVG, 0);
    }
    public COUNT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.COUNT, 0);
    }
    public DISTINCT_COUNT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DISTINCT_COUNT, 0);
    }
    public ESTDC(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ESTDC, 0);
    }
    public ESTDC_ERROR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.ESTDC_ERROR, 0);
    }
    public MAX(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MAX, 0);
    }
    public MEAN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MEAN, 0);
    }
    public MEDIAN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MEDIAN, 0);
    }
    public MIN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MIN, 0);
    }
    public MODE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.MODE, 0);
    }
    public RANGE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.RANGE, 0);
    }
    public STDEV(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STDEV, 0);
    }
    public STDEVP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STDEVP, 0);
    }
    public SUM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SUM, 0);
    }
    public SUMSQ(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SUMSQ, 0);
    }
    public VAR_SAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.VAR_SAMP, 0);
    }
    public VAR_POP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.VAR_POP, 0);
    }
    public STDDEV_SAMP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STDDEV_SAMP, 0);
    }
    public STDDEV_POP(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.STDDEV_POP, 0);
    }
    public PERCENTILE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PERCENTILE, 0);
    }
    public TAKE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.TAKE, 0);
    }
    public FIRST(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.FIRST, 0);
    }
    public LAST(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LAST, 0);
    }
    public LIST(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LIST, 0);
    }
    public VALUES(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.VALUES, 0);
    }
    public EARLIEST(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.EARLIEST, 0);
    }
    public EARLIEST_TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.EARLIEST_TIME, 0);
    }
    public LATEST(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LATEST, 0);
    }
    public LATEST_TIME(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.LATEST_TIME, 0);
    }
    public PER_DAY(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PER_DAY, 0);
    }
    public PER_HOUR(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PER_HOUR, 0);
    }
    public PER_MINUTE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PER_MINUTE, 0);
    }
    public PER_SECOND(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.PER_SECOND, 0);
    }
    public RATE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.RATE, 0);
    }
    public SPARKLINE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.SPARKLINE, 0);
    }
    public C(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.C, 0);
    }
    public DC(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLParser.DC, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLParser.RULE_keywordsCanBeId;
    }
    public override accept<Result>(visitor: OpenSearchPPLParserVisitor<Result>): Result | null {
        if (visitor.visitKeywordsCanBeId) {
            return visitor.visitKeywordsCanBeId(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
