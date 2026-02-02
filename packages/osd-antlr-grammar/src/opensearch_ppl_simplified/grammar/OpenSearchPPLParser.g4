/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */


parser grammar OpenSearchPPLParser;


options { tokenVocab = OpenSearchPPLLexer; }

root
   : pplStatement? EOF
   ;

// statement
pplStatement
   : explainStatement
   | queryStatement
   ;

queryStatement
   : pplCommands (PIPE commands)*
   ;

explainStatement
    : EXPLAIN (explainMode)? queryStatement
    ;

explainMode
    : SIMPLE
    | STANDARD
    | COST
    | EXTENDED
    ;

subSearch
   : searchCommand (PIPE commands)*
   ;

// commands
pplCommands
   : describeCommand
   | showDataSourcesCommand
   | searchCommand
   ;

commands
   : whereCommand
   | fieldsCommand
   | tableCommand
   | joinCommand
   | renameCommand
   | statsCommand
   | eventstatsCommand
   | dedupCommand
   | sortCommand
   | evalCommand
   | headCommand
   | binCommand
   | topCommand
   | rareCommand
   | grokCommand
   | parseCommand
   | spathCommand
   | patternsCommand
   | lookupCommand
   | kmeansCommand
   | adCommand
   | mlCommand
   | fillnullCommand
   | trendlineCommand
   | appendcolCommand
   | appendCommand
   | expandCommand
   | flattenCommand
   | reverseCommand
   | regexCommand
   | timechartCommand
   | rexCommand
   ;

commandName
   : SEARCH
   | DESCRIBE
   | SHOW
   | WHERE
   | FIELDS
   | TABLE
   | JOIN
   | RENAME
   | STATS
   | EVENTSTATS
   | DEDUP
   | SORT
   | EVAL
   | HEAD
   | BIN
   | TOP
   | RARE
   | GROK
   | PARSE
   | PATTERNS
   | LOOKUP
   | KMEANS
   | AD
   | ML
   | FILLNULL
   | EXPAND
   | FLATTEN
   | TRENDLINE
   | TIMECHART
   | EXPLAIN
   | REVERSE
   | REGEX
   | APPEND
   | REX
   ;

searchCommand
   : (SEARCH)? (searchExpression)* fromClause? (searchExpression)*     # searchFrom
   ;

searchExpression
 : LT_PRTHS searchExpression RT_PRTHS                 # groupedExpression
 | NOT searchExpression                               # notExpression
 | searchExpression OR searchExpression               # orExpression
 | searchExpression AND searchExpression              # andExpression
 | searchTerm                                         # termExpression
 ;

searchTerm
 : searchFieldComparison                                   # searchComparisonTerm
 | searchFieldInList                                       # searchInListTerm
 | searchLiteral                                           # searchLiteralTerm
 ;

// Unified search literal for both free text and field comparisons
searchLiteral
   : numericLiteral
   | booleanLiteral
   | ID
   | stringLiteral
   | searchableKeyWord
   ;

searchFieldComparison
 : fieldExpression searchComparisonOperator searchLiteral          # searchFieldCompare
 ;

searchFieldInList
 : fieldExpression IN LT_PRTHS searchLiteralList RT_PRTHS          # searchFieldInValues
 ;

searchLiteralList
 : searchLiteral (COMMA searchLiteral)*          # searchLiterals
 ;

searchComparisonOperator
 : EQUAL                                             # equals
 | NOT_EQUAL                                         # notEquals
 | LESS                                              # lessThan
 | NOT_GREATER                                       # lessOrEqual
 | GREATER                                           # greaterThan
 | NOT_LESS                                          # greaterOrEqual
 ;


describeCommand
   : DESCRIBE tableSourceClause
   ;

showDataSourcesCommand
   : SHOW DATASOURCES
   ;

whereCommand
   : WHERE logicalExpression
   ;

fieldsCommand
   : FIELDS fieldsCommandBody
   ;

// Table command - alias for fields command
tableCommand
   : TABLE fieldsCommandBody
   ;

fieldsCommandBody
   : (PLUS | MINUS)? wcFieldList
   ;

// Wildcard field list supporting both comma-separated and space-separated fields
wcFieldList
   : selectFieldExpression (COMMA? selectFieldExpression)*
   ;

renameCommand
   : RENAME renameClasue (COMMA? renameClasue)*
   ;

statsCommand
   : STATS statsArgs statsAggTerm (COMMA statsAggTerm)* (statsByClause)? (dedupSplitArg)?
   ;

statsArgs
   : (partitionsArg | allnumArg | delimArg | bucketNullableArg)*
   ;

partitionsArg
   : PARTITIONS EQUAL partitions = integerLiteral
   ;

allnumArg
   : ALLNUM EQUAL allnum = booleanLiteral
   ;

delimArg
   : DELIM EQUAL delim = stringLiteral
   ;

bucketNullableArg
   : BUCKET_NULLABLE EQUAL bucket_nullable = booleanLiteral
   ;

dedupSplitArg
   : DEDUP_SPLITVALUES EQUAL dedupsplit = booleanLiteral
   ;

eventstatsCommand
   : EVENTSTATS eventstatsAggTerm (COMMA eventstatsAggTerm)* (statsByClause)?
   ;

dedupCommand
   : DEDUP (number = integerLiteral)? fieldList (KEEPEMPTY EQUAL keepempty = booleanLiteral)? (CONSECUTIVE EQUAL consecutive = booleanLiteral)?
   ;

sortCommand
   : SORT (count = integerLiteral)? sortbyClause (ASC | A | DESC | D)?
   ;

reverseCommand
   : REVERSE
   ;

timechartCommand
   : TIMECHART timechartParameter* statsFunction (BY fieldExpression)?
   ;

timechartParameter
   : (spanClause | SPAN EQUAL spanLiteral)
   | timechartArg
   ;

timechartArg
   : LIMIT EQUAL integerLiteral
   | USEOTHER EQUAL (booleanLiteral | ident)
   ;

spanLiteral
   : integerLiteral timespanUnit
   | stringLiteral
   ;

evalCommand
   : EVAL evalClause (COMMA evalClause)*
   ;

headCommand
   : HEAD (number = integerLiteral)? (FROM from = integerLiteral)?
   ;

binCommand
   : BIN fieldExpression binOption* (AS alias = qualifiedName)?
   ;

binOption
   : SPAN EQUAL span = spanValue
   | BINS EQUAL bins = integerLiteral
   | MINSPAN EQUAL minspan = literalValue (minspanUnit = timespanUnit)?
   | ALIGNTIME EQUAL aligntime = aligntimeValue
   | START EQUAL start = numericLiteral
   | END EQUAL end = numericLiteral
   ;

aligntimeValue
   : EARLIEST
   | LATEST
   | literalValue
   ;

spanValue
   : literalValue (timespanUnit)?           # numericSpanValue
   | logSpanValue                           # logBasedSpanValue
   | ident timespanUnit                     # extendedTimeSpanValue
   | ident                                  # identifierSpanValue
   ;

logSpanValue
   : LOG_WITH_BASE                                                   # logWithBaseSpan
   ;

topCommand
   : TOP (number = integerLiteral)? (COUNTFIELD EQUAL countfield = stringLiteral)? (SHOWCOUNT EQUAL showcount = booleanLiteral)? fieldList (byClause)?
   ;

rareCommand
   : RARE (number = integerLiteral)? (COUNTFIELD EQUAL countfield = stringLiteral)? (SHOWCOUNT EQUAL showcount = booleanLiteral)? fieldList (byClause)?
   ;

grokCommand
   : GROK (source_field = expression) (pattern = stringLiteral)
   ;

parseCommand
   : PARSE (source_field = expression) (pattern = stringLiteral)
   ;

spathCommand
   : SPATH spathParameter*
   ;

spathParameter
   : (INPUT EQUAL input = expression)
   | (OUTPUT EQUAL output = expression)
   | ((PATH EQUAL)? path = indexablePath)
   ;

indexablePath
   : pathElement (DOT pathElement)*
   ;

pathElement
   : ident pathArrayAccess?
   ;

pathArrayAccess
   : LT_CURLY (INTEGER_LITERAL)? RT_CURLY
   ;
regexCommand
    : REGEX regexExpr
    ;

regexExpr
    : field=qualifiedName operator=(EQUAL | NOT_EQUAL) pattern=stringLiteral
    ;

rexCommand
    : REX rexExpr
    ;

rexExpr
    : FIELD EQUAL field=qualifiedName (rexOption)* pattern=stringLiteral (rexOption)*
    ;

rexOption
    : MAX_MATCH EQUAL maxMatch=integerLiteral
    | MODE EQUAL (EXTRACT | SED)
    | OFFSET_FIELD EQUAL offsetField=qualifiedName
    ;
patternsMethod
   : PUNCT
   | REGEX
   ;

patternsCommand
   : PATTERNS (source_field = expression) (statsByClause)? (METHOD EQUAL method = patternMethod)? (MODE EQUAL pattern_mode = patternMode)? (MAX_SAMPLE_COUNT EQUAL max_sample_count = integerLiteral)? (BUFFER_LIMIT EQUAL buffer_limit = integerLiteral)? (NEW_FIELD EQUAL new_field = stringLiteral)? (patternsParameter)*
   ;

patternsParameter
   : (PATTERN EQUAL pattern = stringLiteral)
   | (VARIABLE_COUNT_THRESHOLD EQUAL variable_count_threshold = integerLiteral)
   | (FREQUENCY_THRESHOLD_PERCENTAGE EQUAL frequency_threshold_percentage = decimalLiteral)
   ;

patternMethod
   : SIMPLE_PATTERN
   | BRAIN
   ;

patternMode
   : LABEL
   | AGGREGATION
   ;

// lookup
lookupCommand
   : LOOKUP tableSource lookupMappingList ((APPEND | REPLACE) outputCandidateList)?
   ;

lookupMappingList
   : lookupPair (COMMA lookupPair)*
   ;

outputCandidateList
   : lookupPair (COMMA lookupPair)*
   ;

 // The lookup pair will generate a K-V pair.
 // The format is Key -> Alias(outputFieldName, inputField), Value -> outputField. For example:
 // 1. When lookupPair is "name AS cName", the key will be Alias(cName, Field(name)), the value will be Field(cName)
 // 2. When lookupPair is "dept", the key is Alias(dept, Field(dept)), value is Field(dept)
lookupPair
   : inputField = fieldExpression (AS outputField = fieldExpression)?
   ;

fillnullCommand
   : FILLNULL fillNullWith
   | FILLNULL fillNullUsing
   ;

fillNullWith
   : WITH replacement = valueExpression (IN fieldList)?
   ;

fillNullUsing
   : USING replacementPair (COMMA replacementPair)*
   ;

replacementPair
   : fieldExpression EQUAL replacement = valueExpression
   ;

trendlineCommand
   : TRENDLINE (SORT sortField)? trendlineClause (trendlineClause)*
   ;

trendlineClause
   : trendlineType LT_PRTHS numberOfDataPoints = integerLiteral COMMA field = fieldExpression RT_PRTHS (AS alias = qualifiedName)?
   ;

trendlineType
   : SMA
   | WMA
   ;

expandCommand
    : EXPAND fieldExpression (AS alias = qualifiedName)?
    ;

flattenCommand
   : FLATTEN fieldExpression (AS aliases = identifierSeq)?
   ;

appendcolCommand
   : APPENDCOL (OVERRIDE EQUAL override = booleanLiteral)? LT_SQR_PRTHS commands (PIPE commands)* RT_SQR_PRTHS
   ;

appendCommand
   : APPEND LT_SQR_PRTHS searchCommand? (PIPE commands)* RT_SQR_PRTHS
   ;

kmeansCommand
   : KMEANS (kmeansParameter)*
   ;

kmeansParameter
   : (CENTROIDS EQUAL centroids = integerLiteral)
   | (ITERATIONS EQUAL iterations = integerLiteral)
   | (DISTANCE_TYPE EQUAL distance_type = stringLiteral)
   ;

adCommand
   : AD (adParameter)*
   ;

adParameter
   : (NUMBER_OF_TREES EQUAL number_of_trees = integerLiteral)
   | (SHINGLE_SIZE EQUAL shingle_size = integerLiteral)
   | (SAMPLE_SIZE EQUAL sample_size = integerLiteral)
   | (OUTPUT_AFTER EQUAL output_after = integerLiteral)
   | (TIME_DECAY EQUAL time_decay = decimalLiteral)
   | (ANOMALY_RATE EQUAL anomaly_rate = decimalLiteral)
   | (CATEGORY_FIELD EQUAL category_field = stringLiteral)
   | (TIME_FIELD EQUAL time_field = stringLiteral)
   | (DATE_FORMAT EQUAL date_format = stringLiteral)
   | (TIME_ZONE EQUAL time_zone = stringLiteral)
   | (TRAINING_DATA_SIZE EQUAL training_data_size = integerLiteral)
   | (ANOMALY_SCORE_THRESHOLD EQUAL anomaly_score_threshold = decimalLiteral)
   ;

mlCommand
   : ML (mlArg)*
   ;

mlArg
   : (argName = ident EQUAL argValue = literalValue)
   ;

// clauses
fromClause
   : SOURCE EQUAL tableOrSubqueryClause
   | INDEX EQUAL tableOrSubqueryClause
   | SOURCE EQUAL tableFunction
   | INDEX EQUAL tableFunction
   | SOURCE EQUAL dynamicSourceClause
   | INDEX EQUAL dynamicSourceClause
   ;

tableOrSubqueryClause
   : LT_SQR_PRTHS subSearch RT_SQR_PRTHS (AS alias = qualifiedName)?
   | tableSourceClause
   ;

tableSourceClause
   : tableSource (COMMA tableSource)* (AS alias = qualifiedName)?
   ;

dynamicSourceClause
   : LT_SQR_PRTHS sourceReferences (COMMA sourceFilterArgs)? RT_SQR_PRTHS
   ;

sourceReferences
   : sourceReference (COMMA sourceReference)*
   ;

sourceReference
   : (CLUSTER)? wcQualifiedName
   ;

sourceFilterArgs
   : sourceFilterArg (COMMA sourceFilterArg)*
   ;

sourceFilterArg
   : ident EQUAL literalValue
   | ident IN valueList
   ;

// join
joinCommand
   : JOIN (joinOption)* (fieldList)? right = tableOrSubqueryClause
   | sqlLikeJoinType? JOIN (joinOption)* sideAlias joinHintList? joinCriteria right = tableOrSubqueryClause
   ;

sqlLikeJoinType
   : INNER
   | CROSS
   | (LEFT OUTER? | OUTER)
   | RIGHT OUTER?
   | FULL OUTER?
   | LEFT? SEMI
   | LEFT? ANTI
   ;

joinType
   : INNER
   | CROSS
   | OUTER
   | LEFT
   | RIGHT
   | FULL
   | SEMI
   | ANTI
   ;

sideAlias
   : (LEFT EQUAL leftAlias = qualifiedName)? COMMA? (RIGHT EQUAL rightAlias = qualifiedName)?
   ;

joinCriteria
   : (ON | WHERE) logicalExpression
   ;

joinHintList
   : hintPair (COMMA? hintPair)*
   ;

hintPair
   : leftHintKey = LEFT_HINT DOT ID EQUAL leftHintValue = ident             #leftHint
   | rightHintKey = RIGHT_HINT DOT ID EQUAL rightHintValue = ident          #rightHint
   ;

joinOption
   : OVERWRITE EQUAL booleanLiteral                     # overwriteOption
   | TYPE EQUAL joinType                                # typeOption
   | MAX EQUAL integerLiteral                           # maxOption
   ;

renameClasue
   : orignalField = renameFieldExpression AS renamedField = renameFieldExpression
   ;

byClause
   : BY fieldList
   ;

statsByClause
   : BY fieldList
   | BY bySpanClause
   | BY bySpanClause COMMA fieldList
   | BY fieldList COMMA bySpanClause
   ;

bySpanClause
   : spanClause (AS alias = qualifiedName)?
   ;

spanClause
   : SPAN LT_PRTHS fieldExpression COMMA value = literalValue (unit = timespanUnit)? RT_PRTHS
   ;

sortbyClause
   : sortField (COMMA sortField)*
   ;

evalClause
   : fieldExpression EQUAL logicalExpression
   ;

eventstatsAggTerm
   : windowFunction (AS alias = wcFieldExpression)?
   ;

windowFunction
   : windowFunctionName LT_PRTHS functionArgs RT_PRTHS
   ;

windowFunctionName
   : statsFunctionName
   | scalarWindowFunctionName
   ;

scalarWindowFunctionName
   : ROW_NUMBER
   | RANK
   | DENSE_RANK
   | PERCENT_RANK
   | CUME_DIST
   | FIRST
   | LAST
   | NTH
   | NTILE
   | DISTINCT_COUNT
   | DC
   ;

// aggregation terms
statsAggTerm
   : statsFunction (AS alias = wcFieldExpression)?
   ;

// aggregation functions
statsFunction
   : (COUNT | C) LT_PRTHS evalExpression RT_PRTHS               # countEvalFunctionCall
   | (COUNT | C) (LT_PRTHS RT_PRTHS)?                           # countAllFunctionCall
   | PERCENTILE_SHORTCUT LT_PRTHS valueExpression RT_PRTHS      # percentileShortcutFunctionCall
   | (DISTINCT_COUNT | DC | DISTINCT_COUNT_APPROX) LT_PRTHS valueExpression RT_PRTHS    # distinctCountFunctionCall
   | takeAggFunction                                            # takeAggFunctionCall
   | percentileApproxFunction                                   # percentileApproxFunctionCall
   | statsFunctionName LT_PRTHS functionArgs RT_PRTHS           # statsFunctionCall
   ;

statsFunctionName
   : AVG
   | COUNT
   | SUM
   | MIN
   | MAX
   | VAR_SAMP
   | VAR_POP
   | STDDEV_SAMP
   | STDDEV_POP
   | PERCENTILE
   | PERCENTILE_APPROX
   | MEDIAN
   | LIST
   | FIRST
   | EARLIEST
   | LATEST
   | LAST
   ;

takeAggFunction
   : TAKE LT_PRTHS fieldExpression (COMMA size = integerLiteral)? RT_PRTHS
   ;

percentileApproxFunction
   : (PERCENTILE | PERCENTILE_APPROX) LT_PRTHS aggField = valueExpression
       COMMA percent = numericLiteral (COMMA compression = numericLiteral)? RT_PRTHS
   ;

numericLiteral
    : integerLiteral
    | decimalLiteral
    | doubleLiteral
    | floatLiteral
    ;

// predicates
logicalExpression
   : NOT logicalExpression                                      # logicalNot
   | left = logicalExpression AND right = logicalExpression     # logicalAnd
   | left = logicalExpression XOR right = logicalExpression     # logicalXor
   | left = logicalExpression OR right = logicalExpression      # logicalOr
   | expression                                                 # logicalExpr
   ;

expression
   : valueExpression                                            # valueExpr
   | relevanceExpression                                        # relevanceExpr
   | left = expression comparisonOperator right = expression    # compareExpr
   | expression NOT? IN valueList                               # inExpr
   | expression NOT? BETWEEN expression AND expression          # between
   ;

valueExpression
   : left = valueExpression binaryOperator = (STAR | DIVIDE | MODULE) right = valueExpression                   # binaryArithmetic
   | left = valueExpression binaryOperator = (PLUS | MINUS) right = valueExpression                             # binaryArithmetic
   | literalValue                                                                                               # literalValueExpr
   | functionCall                                                                                               # functionCallExpr
   | lambda                                                                                                     # lambdaExpr
   | LT_SQR_PRTHS subSearch RT_SQR_PRTHS                                                                        # scalarSubqueryExpr
   | valueExpression NOT? IN LT_SQR_PRTHS subSearch RT_SQR_PRTHS                                                # inSubqueryExpr
   | LT_PRTHS valueExpression (COMMA valueExpression)* RT_PRTHS NOT? IN LT_SQR_PRTHS subSearch RT_SQR_PRTHS     # inSubqueryExpr
   | EXISTS LT_SQR_PRTHS subSearch RT_SQR_PRTHS                                                                 # existsSubqueryExpr
   | fieldExpression                                                                                            # fieldExpr
   | LT_PRTHS logicalExpression RT_PRTHS                                                                        # nestedValueExpr
   ;

evalExpression
    : EVAL LT_PRTHS logicalExpression RT_PRTHS
    ;

functionCall
   : evalFunctionCall
   | dataTypeFunctionCall
   | positionFunctionCall
   | caseFunctionCall
   | timestampFunctionCall
   | extractFunctionCall
   | getFormatFunctionCall
   ;

positionFunctionCall
   : positionFunctionName LT_PRTHS functionArg IN functionArg RT_PRTHS
   ;

caseFunctionCall
   : CASE LT_PRTHS logicalExpression COMMA valueExpression (COMMA logicalExpression COMMA valueExpression)* (ELSE valueExpression)? RT_PRTHS
   ;

relevanceExpression
   : singleFieldRelevanceFunction
   | multiFieldRelevanceFunction
   ;

// Field is a single column
singleFieldRelevanceFunction
   : singleFieldRelevanceFunctionName LT_PRTHS field = relevanceField COMMA query = relevanceQuery (COMMA relevanceArg)* RT_PRTHS
   ;

// Field is a list of columns
multiFieldRelevanceFunction
   : multiFieldRelevanceFunctionName LT_PRTHS (LT_SQR_PRTHS field = relevanceFieldAndWeight (COMMA field = relevanceFieldAndWeight)* RT_SQR_PRTHS COMMA)? query = relevanceQuery (COMMA relevanceArg)* RT_PRTHS
   ;

// tables
tableSource
   : tableQualifiedName
   | ID_DATE_SUFFIX
   ;

tableFunction
   : qualifiedName LT_PRTHS namedFunctionArgs RT_PRTHS
   ;

// fields
fieldList
   : fieldExpression ((COMMA)? fieldExpression)*
   ;

sortField
   : (PLUS | MINUS)? sortFieldExpression
   ;

sortFieldExpression
   : fieldExpression
   | AUTO LT_PRTHS fieldExpression RT_PRTHS
   | STR LT_PRTHS fieldExpression RT_PRTHS
   | IP LT_PRTHS fieldExpression RT_PRTHS
   | NUM LT_PRTHS fieldExpression RT_PRTHS
   ;

fieldExpression
   : qualifiedName
   ;

wcFieldExpression
   : wcQualifiedName
   ;

selectFieldExpression
   : wcQualifiedName
   | STAR
   ;

renameFieldExpression
   : wcQualifiedName
   | STAR
   ;

// functions
evalFunctionCall
   : evalFunctionName LT_PRTHS functionArgs RT_PRTHS
   ;

// cast function
dataTypeFunctionCall
   : CAST LT_PRTHS logicalExpression AS convertedDataType RT_PRTHS
   ;

convertedDataType
   : typeName = DATE
   | typeName = TIME
   | typeName = TIMESTAMP
   | typeName = INT
   | typeName = INTEGER
   | typeName = DOUBLE
   | typeName = LONG
   | typeName = FLOAT
   | typeName = STRING
   | typeName = BOOLEAN
   | typeName = IP
   | typeName = JSON
   ;

evalFunctionName
   : mathematicalFunctionName
   | dateTimeFunctionName
   | textFunctionName
   | conditionFunctionName
   | flowControlFunctionName
   | systemFunctionName
   | positionFunctionName
   | cryptographicFunctionName
   | jsonFunctionName
   | geoipFunctionName
   | collectionFunctionName
   ;

functionArgs
   : (functionArg (COMMA functionArg)*)?
   ;

namedFunctionArgs
   : (namedFunctionArg (COMMA namedFunctionArg)*)?
   ;

functionArg
   : functionArgExpression
   ;

namedFunctionArg
   : (ident EQUAL)? functionArgExpression
   ;

functionArgExpression
   : lambda
   | logicalExpression
   ;

lambda
   : ident ARROW logicalExpression
   | LT_PRTHS ident (COMMA ident)+ RT_PRTHS ARROW logicalExpression
   ;

relevanceArg
   : relevanceArgName EQUAL relevanceArgValue
   ;

relevanceArgName
   : ALLOW_LEADING_WILDCARD
   | ANALYZER
   | ANALYZE_WILDCARD
   | AUTO_GENERATE_SYNONYMS_PHRASE_QUERY
   | BOOST
   | CUTOFF_FREQUENCY
   | DEFAULT_FIELD
   | DEFAULT_OPERATOR
   | ENABLE_POSITION_INCREMENTS
   | ESCAPE
   | FIELDS
   | FLAGS
   | FUZZINESS
   | FUZZY_MAX_EXPANSIONS
   | FUZZY_PREFIX_LENGTH
   | FUZZY_REWRITE
   | FUZZY_TRANSPOSITIONS
   | LENIENT
   | LOW_FREQ_OPERATOR
   | MAX_DETERMINIZED_STATES
   | MAX_EXPANSIONS
   | MINIMUM_SHOULD_MATCH
   | OPERATOR
   | PHRASE_SLOP
   | PREFIX_LENGTH
   | QUOTE_ANALYZER
   | QUOTE_FIELD_SUFFIX
   | REWRITE
   | SLOP
   | TIE_BREAKER
   | TIME_ZONE
   | TYPE
   | ZERO_TERMS_QUERY
   ;

relevanceFieldAndWeight
   : field = relevanceField
   | field = relevanceField weight = relevanceFieldWeight
   | field = relevanceField BIT_XOR_OP weight = relevanceFieldWeight
   ;

relevanceFieldWeight
   : integerLiteral
   | decimalLiteral
   | doubleLiteral
   | floatLiteral
   ;

relevanceField
   : qualifiedName
   | stringLiteral
   ;

relevanceQuery
   : relevanceArgValue
   ;

relevanceArgValue
   : qualifiedName
   | literalValue
   ;

mathematicalFunctionName
   : ABS
   | PLUS_FUCTION
   | MINUS_FUCTION
   | STAR_FUNCTION
   | DIVIDE_FUNCTION
   | CBRT
   | CEIL
   | CEILING
   | CONV
   | CRC32
   | E
   | EXP
   | EXPM1
   | FLOOR
   | LN
   | LOG
   | LOG_WITH_BASE
   | MOD
   | MODULUS
   | PI
   | POW
   | POWER
   | RAND
   | ROUND
   | SIGN
   | SQRT
   | TRUNCATE
   | RINT
   | SIGNUM
   | SUM
   | AVG
   | trigonometricFunctionName
   ;

geoipFunctionName
   : GEOIP
   ;

collectionFunctionName
    : ARRAY
    | ARRAY_LENGTH
    | MVJOIN
    | FORALL
    | EXISTS
    | FILTER
    | TRANSFORM
    | REDUCE
    ;


trigonometricFunctionName
   : ACOS
   | ASIN
   | ATAN
   | ATAN2
   | COS
   | COSH
   | COT
   | DEGREES
   | RADIANS
   | SIN
   | SINH
   | TAN
   ;

jsonFunctionName
   : JSON
   | JSON_OBJECT
   | JSON_ARRAY
   | JSON_ARRAY_LENGTH
   | JSON_EXTRACT
   | JSON_KEYS
   | JSON_SET
   | JSON_DELETE
   | JSON_APPEND
   | JSON_EXTEND
   ;

cryptographicFunctionName
   : MD5
   | SHA1
   | SHA2
   ;

dateTimeFunctionName
   : ADDDATE
   | ADDTIME
   | CONVERT_TZ
   | CURDATE
   | CURRENT_DATE
   | CURRENT_TIME
   | CURRENT_TIMESTAMP
   | CURTIME
   | DATE
   | DATEDIFF
   | DATETIME
   | DATE_ADD
   | DATE_FORMAT
   | DATE_SUB
   | DAY
   | DAYNAME
   | DAYOFMONTH
   | DAYOFWEEK
   | DAYOFYEAR
   | DAY_OF_MONTH
   | DAY_OF_WEEK
   | DAY_OF_YEAR
   | FROM_DAYS
   | FROM_UNIXTIME
   | HOUR
   | HOUR_OF_DAY
   | LAST_DAY
   | LOCALTIME
   | LOCALTIMESTAMP
   | MAKEDATE
   | MAKETIME
   | MICROSECOND
   | MINUTE
   | MINUTE_OF_DAY
   | MINUTE_OF_HOUR
   | MONTH
   | MONTHNAME
   | MONTH_OF_YEAR
   | NOW
   | PERIOD_ADD
   | PERIOD_DIFF
   | QUARTER
   | SECOND
   | SECOND_OF_MINUTE
   | SEC_TO_TIME
   | STR_TO_DATE
   | SUBDATE
   | SUBTIME
   | SYSDATE
   | TIME
   | TIMEDIFF
   | TIMESTAMP
   | TIME_FORMAT
   | TIME_TO_SEC
   | TO_DAYS
   | TO_SECONDS
   | UNIX_TIMESTAMP
   | UTC_DATE
   | UTC_TIME
   | UTC_TIMESTAMP
   | WEEK
   | WEEKDAY
   | WEEK_OF_YEAR
   | YEAR
   | YEARWEEK
   | STRFTIME
   ;

getFormatFunctionCall
   : GET_FORMAT LT_PRTHS getFormatType COMMA functionArg RT_PRTHS
   ;

getFormatType
   : DATE
   | DATETIME
   | TIME
   | TIMESTAMP
   ;

extractFunctionCall
   : EXTRACT LT_PRTHS datetimePart FROM functionArg RT_PRTHS
   ;

simpleDateTimePart
   : MICROSECOND
   | SECOND
   | MINUTE
   | HOUR
   | DAY
   | WEEK
   | MONTH
   | QUARTER
   | YEAR
   ;

complexDateTimePart
   : SECOND_MICROSECOND
   | MINUTE_MICROSECOND
   | MINUTE_SECOND
   | HOUR_MICROSECOND
   | HOUR_SECOND
   | HOUR_MINUTE
   | DAY_MICROSECOND
   | DAY_SECOND
   | DAY_MINUTE
   | DAY_HOUR
   | YEAR_MONTH
   ;

datetimePart
   : simpleDateTimePart
   | complexDateTimePart
   ;

timestampFunctionCall
   : timestampFunctionName LT_PRTHS simpleDateTimePart COMMA firstArg = functionArg COMMA secondArg = functionArg RT_PRTHS
   ;

timestampFunctionName
   : TIMESTAMPADD
   | TIMESTAMPDIFF
   ;

// condition function return boolean value
conditionFunctionName
   : LIKE
   | ISNULL
   | ISNOTNULL
   | CIDRMATCH
   | REGEX_MATCH
   | JSON_VALID
   | ISPRESENT
   | ISEMPTY
   | ISBLANK
   | EARLIEST
   | LATEST
   ;

// flow control function return non-boolean value
flowControlFunctionName
   : IF
   | IFNULL
   | NULLIF
   | COALESCE
   ;

systemFunctionName
   : TYPEOF
   ;

textFunctionName
   : SUBSTR
   | SUBSTRING
   | TRIM
   | LTRIM
   | RTRIM
   | LOWER
   | UPPER
   | CONCAT
   | CONCAT_WS
   | LENGTH
   | STRCMP
   | RIGHT
   | LEFT
   | ASCII
   | LOCATE
   | REPLACE
   | REVERSE
   ;

positionFunctionName
   : POSITION
   ;

// operators
 comparisonOperator
   : EQUAL
   | DOUBLE_EQUAL
   | NOT_EQUAL
   | LESS
   | NOT_LESS
   | GREATER
   | NOT_GREATER
   | REGEXP
   | LIKE
   ;

singleFieldRelevanceFunctionName
   : MATCH
   | MATCH_PHRASE
   | MATCH_BOOL_PREFIX
   | MATCH_PHRASE_PREFIX
   ;

multiFieldRelevanceFunctionName
   : SIMPLE_QUERY_STRING
   | MULTI_MATCH
   | QUERY_STRING
   ;

// literals and values
literalValue
   : intervalLiteral
   | stringLiteral
   | integerLiteral
   | decimalLiteral
   | doubleLiteral
   | floatLiteral
   | booleanLiteral
   | datetimeLiteral //#datetime
   ;

intervalLiteral
   : INTERVAL valueExpression intervalUnit
   ;

stringLiteral
   : DQUOTA_STRING
   | SQUOTA_STRING
   ;

integerLiteral
   : (PLUS | MINUS)? INTEGER_LITERAL
   ;

decimalLiteral
   : (PLUS | MINUS)? DECIMAL_LITERAL
   ;

doubleLiteral
   : (PLUS | MINUS)? DOUBLE_LITERAL
   ;

floatLiteral
   : (PLUS | MINUS)? FLOAT_LITERAL
   ;

booleanLiteral
   : TRUE
   | FALSE
   ;

// Date and Time Literal, follow ANSI 92
datetimeLiteral
   : dateLiteral
   | timeLiteral
   | timestampLiteral
   ;

dateLiteral
   : DATE date = stringLiteral
   ;

timeLiteral
   : TIME time = stringLiteral
   ;

timestampLiteral
   : TIMESTAMP timestamp = stringLiteral
   ;

intervalUnit
   : MICROSECOND
   | SECOND
   | MINUTE
   | HOUR
   | DAY
   | WEEK
   | MONTH
   | QUARTER
   | YEAR
   | SECOND_MICROSECOND
   | MINUTE_MICROSECOND
   | MINUTE_SECOND
   | HOUR_MICROSECOND
   | HOUR_SECOND
   | HOUR_MINUTE
   | DAY_MICROSECOND
   | DAY_SECOND
   | DAY_MINUTE
   | DAY_HOUR
   | YEAR_MONTH
   ;

timespanUnit
   : MS
   | S
   | M
   | H
   | D
   | W
   | Q
   | Y
   | MILLISECOND
   | SECOND
   | MINUTE
   | HOUR
   | DAY
   | WEEK
   | MONTH
   | QUARTER
   | YEAR
   | SEC
   | SECS  
   | SECONDS
   | MINS
   | MINUTES
   | HR
   | HRS
   | HOURS
   | DAYS
   | MON
   | MONTHS
   | US
   | CS
   | DS
   ;

valueList
   : LT_PRTHS literalValue (COMMA literalValue)* RT_PRTHS
   ;

qualifiedName
   : ident (DOT ident)* # identsAsQualifiedName
   ;

tableQualifiedName
   : tableIdent (DOT ident)* # identsAsTableQualifiedName
   ;

wcQualifiedName
   : wildcard (DOT wildcard)* # identsAsWildcardQualifiedName
   ;

identifierSeq
   : qualifiedName (COMMA qualifiedName)* # identsAsQualifiedNameSeq
   | LT_PRTHS qualifiedName (COMMA qualifiedName)* RT_PRTHS # identsAsQualifiedNameSeq
   ;

ident
   : (DOT)? ID
   | BACKTICK ident BACKTICK
   | BQUOTA_STRING
   | keywordsCanBeId
   | STAR // Temporary fix for https://github.com/opensearch-project/sql/issues/4444
   ;

tableIdent
   : (CLUSTER)? ident
   ;

wildcard
   : ident (MODULE ident)* (MODULE)?
   | SINGLE_QUOTE wildcard SINGLE_QUOTE
   | DOUBLE_QUOTE wildcard DOUBLE_QUOTE
   | BACKTICK wildcard BACKTICK
   ;

keywordsCanBeId
   : searchableKeyWord
   | IN
   ;

searchableKeyWord
   : D // OD SQL and ODBC special
   | timespanUnit
   | SPAN
   | evalFunctionName
   | jsonFunctionName
   | relevanceArgName
   | intervalUnit
   | trendlineType
   | singleFieldRelevanceFunctionName
   | multiFieldRelevanceFunctionName
   | commandName
   | collectionFunctionName
   | REGEX
   | explainMode
   | REGEXP
   // commands assist keywords
   | CASE
   | ELSE
   | ARROW
   | BETWEEN
   | EXISTS
   | SOURCE
   | INDEX
   | A
   | ASC
   | DESC
   | DATASOURCES
   | FROM
   | PATTERN
   | NEW_FIELD
   | METHOD
   | VARIABLE_COUNT_THRESHOLD
   | FREQUENCY_THRESHOLD_PERCENTAGE
   | MAX_SAMPLE_COUNT
   | BUFFER_LIMIT
   | WITH
   | REGEX
   | PUNCT
   | USING
   | CAST
   | GET_FORMAT
   | EXTRACT
   | INTERVAL
   | PLUS
   | MINUS
   | OVERRIDE
   // SORT FIELD KEYWORDS
   | AUTO
   | STR
   | IP
   | NUM
   // ARGUMENT KEYWORDS
   | KEEPEMPTY
   | CONSECUTIVE
   | DEDUP_SPLITVALUES
   | PARTITIONS
   | ALLNUM
   | DELIM
   | BUCKET_NULLABLE
   | CENTROIDS
   | ITERATIONS
   | DISTANCE_TYPE
   | NUMBER_OF_TREES
   | SHINGLE_SIZE
   | SAMPLE_SIZE
   | OUTPUT_AFTER
   | TIME_DECAY
   | ANOMALY_RATE
   | CATEGORY_FIELD
   | TIME_FIELD
   | TIME_ZONE
   | TRAINING_DATA_SIZE
   | ANOMALY_SCORE_THRESHOLD
   | COUNTFIELD
   | SHOWCOUNT
   | PATH
   | INPUT
   | OUTPUT

   // AGGREGATIONS AND WINDOW
   | statsFunctionName
   | windowFunctionName
   | DISTINCT_COUNT
   | DISTINCT_COUNT_APPROX
   | ESTDC
   | ESTDC_ERROR
   | MEAN
   | MEDIAN
   | MODE
   | RANGE
   | STDEV
   | STDEVP
   | SUMSQ
   | VAR_SAMP
   | VAR_POP
   | TAKE
   | LIST
   | VALUES
   | PER_DAY
   | PER_HOUR
   | PER_MINUTE
   | PER_SECOND
   | RATE
   | SPARKLINE
   | C
   | DC
   // JOIN TYPE
   | OUTER
   | INNER
   | CROSS
   | LEFT
   | RIGHT
   | FULL
   | SEMI
   | ANTI
   | LEFT_HINT
   | RIGHT_HINT
   | PERCENTILE_SHORTCUT
   ;