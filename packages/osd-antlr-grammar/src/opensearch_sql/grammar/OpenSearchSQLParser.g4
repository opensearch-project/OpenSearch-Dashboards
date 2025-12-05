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

parser grammar OpenSearchSQLParser;


options { tokenVocab = OpenSearchSQLLexer; }
// Top Level Description

//    Root rule

root
   : sqlStatement? SEMI? EOF
   ;

// Only SELECT
sqlStatement
   : dmlStatement
   | adminStatement
   ;

dmlStatement
   : selectStatement
   ;

// Data Manipulation Language

// Primary DML Statements
selectStatement
   : querySpecification # simpleSelect
   ;

adminStatement
   : showStatement
   | describeStatement
   ;

showStatement
   : SHOW TABLES tableFilter
   ;

describeStatement
   : DESCRIBE TABLES tableFilter columnFilter?
   ;

columnFilter
   : COLUMNS LIKE showDescribePattern
   ;

tableFilter
   : LIKE showDescribePattern
   ;

showDescribePattern
   : oldID=compatibleID | stringLiteral
   ;

compatibleID
   : (MODULE | ID)+?
   ;


// Select Statement's Details
querySpecification
   : selectClause fromClause? limitClause?
   ;

selectClause
   : SELECT selectSpec? selectElements
   ;

selectSpec
   : (ALL | DISTINCT)
   ;

selectElements
   : (star = STAR | selectElement) (COMMA selectElement)*
   ;

selectElement
   : expression (AS? alias)?
   ;

fromClause
   : FROM relation (whereClause)? (groupByClause)? (havingClause)? (orderByClause)? // Place it under FROM for now but actually not necessary ex. A UNION B ORDER BY
   
   ;

relation
   : tableName (AS? alias)?                                         # tableAsRelation
   | LR_BRACKET subquery = querySpecification RR_BRACKET AS? alias  # subqueryAsRelation
   ;

whereClause
   : WHERE expression
   ;

groupByClause
   : GROUP BY groupByElements
   ;

groupByElements
   : groupByElement (COMMA groupByElement)*
   ;

groupByElement
   : expression
   ;

havingClause
   : HAVING expression
   ;

orderByClause
   : ORDER BY orderByElement (COMMA orderByElement)*
   ;

orderByElement
   : expression order = (ASC | DESC)? (NULLS (FIRST | LAST))?
   ;

limitClause
   : LIMIT (offset = decimalLiteral COMMA)? limit = decimalLiteral
   | LIMIT limit = decimalLiteral OFFSET offset = decimalLiteral
   ;

//  Window Function's Details
windowFunctionClause
   : function = windowFunction overClause
   ;

windowFunction
   : functionName = (ROW_NUMBER | RANK | DENSE_RANK) LR_BRACKET functionArgs? RR_BRACKET    # scalarWindowFunction
   | aggregateFunction                                                                      # aggregateWindowFunction
   ;

overClause
   : OVER LR_BRACKET partitionByClause? orderByClause? RR_BRACKET
   ;

partitionByClause
   : PARTITION BY expression (COMMA expression)*
   ;

// Literals
constant
   : stringLiteral          # string
   | sign? decimalLiteral   # signedDecimal
   | sign? realLiteral      # signedReal
   | booleanLiteral         # boolean
   | datetimeLiteral        # datetime
   | intervalLiteral        # interval
   | nullLiteral            # null
   // Doesn't support the following types for now
   //| BIT_STRING
   //| NOT? nullLiteral=(NULL_LITERAL | NULL_SPEC_LITERAL)
   ;

decimalLiteral
   : DECIMAL_LITERAL
   | ZERO_DECIMAL
   | ONE_DECIMAL
   | TWO_DECIMAL
   ;

numericLiteral
   : decimalLiteral
   | realLiteral
   ;

stringLiteral
   : STRING_LITERAL
   | DOUBLE_QUOTE_ID
   ;

booleanLiteral
   : TRUE
   | FALSE
   ;

realLiteral
   : REAL_LITERAL
   ;

sign
   : PLUS
   | MINUS
   ;

nullLiteral
   : NULL_LITERAL
   ;

// Date and Time Literal, follow ANSI 92
datetimeLiteral
   : dateLiteral
   | timeLiteral
   | timestampLiteral
   ;

dateLiteral
   : DATE date = stringLiteral
   | LEFT_BRACE (DATE | D) date = stringLiteral RIGHT_BRACE
   ;

timeLiteral
   : TIME time = stringLiteral
   | LEFT_BRACE (TIME | T) time = stringLiteral RIGHT_BRACE
   ;

timestampLiteral
   : TIMESTAMP timestamp = stringLiteral
   | LEFT_BRACE (TIMESTAMP | TS) timestamp = stringLiteral RIGHT_BRACE
   ;

// Actually, these constants are shortcuts to the corresponding functions
datetimeConstantLiteral
   : CURRENT_DATE
   | CURRENT_TIME
   | CURRENT_TIMESTAMP
   | LOCALTIME
   | LOCALTIMESTAMP
   | UTC_TIMESTAMP
   | UTC_DATE
   | UTC_TIME
   ;

intervalLiteral
   : INTERVAL expression intervalUnit
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

// predicates

// Simplified approach for expression
expression
   : NOT expression                             # notExpression
   | left = expression AND right = expression   # andExpression
   | left = expression OR right = expression    # orExpression
   | predicate                                  # predicateExpression
   ;

predicate
   : expressionAtom                                         # expressionAtomPredicate
   | left = predicate comparisonOperator right = predicate  # binaryComparisonPredicate
   | predicate IS nullNotnull                               # isNullPredicate
   | predicate NOT? BETWEEN predicate AND predicate         # betweenPredicate
   | left = predicate NOT? LIKE right = predicate           # likePredicate
   | left = predicate REGEXP right = predicate              # regexpPredicate
   | predicate NOT? IN '(' expressions ')'                  # inPredicate
   ;

expressions
   : expression (',' expression)*
   ;

expressionAtom
   : constant                                                                               # constantExpressionAtom
   | columnName                                                                             # fullColumnNameExpressionAtom
   | functionCall                                                                           # functionCallExpressionAtom
   | LR_BRACKET expression RR_BRACKET                                                       # nestedExpressionAtom
   | left = expressionAtom mathOperator = (STAR | SLASH | MODULE) right = expressionAtom    # mathExpressionAtom
   | left = expressionAtom mathOperator = (PLUS | MINUS) right = expressionAtom             # mathExpressionAtom
   ;

comparisonOperator
   : '='
   | '>'
   | '<'
   | '<' '='
   | '>' '='
   | '<' '>'
   | '!' '='
   ;

nullNotnull
   : NOT? NULL_LITERAL
   ;

functionCall
   : nestedFunctionName LR_BRACKET allTupleFields RR_BRACKET    # nestedAllFunctionCall
   | scalarFunctionName LR_BRACKET functionArgs RR_BRACKET      # scalarFunctionCall
   | specificFunction                                           # specificFunctionCall
   | windowFunctionClause                                       # windowFunctionCall
   | aggregateFunction                                          # aggregateFunctionCall
   | aggregateFunction (orderByClause)? filterClause            # filteredAggregationFunctionCall
   | scoreRelevanceFunction                                     # scoreRelevanceFunctionCall
   | relevanceFunction                                          # relevanceFunctionCall
   | highlightFunction                                          # highlightFunctionCall
   | positionFunction                                           # positionFunctionCall
   | extractFunction                                            # extractFunctionCall
   | getFormatFunction                                          # getFormatFunctionCall
   | timestampFunction                                          # timestampFunctionCall
   ;

timestampFunction
   : timestampFunctionName LR_BRACKET simpleDateTimePart COMMA firstArg = functionArg COMMA secondArg = functionArg RR_BRACKET
   ;

timestampFunctionName
   : TIMESTAMPADD
   | TIMESTAMPDIFF
   ;

getFormatFunction
   : GET_FORMAT LR_BRACKET getFormatType COMMA functionArg RR_BRACKET
   ;

getFormatType
   : DATE
   | DATETIME
   | TIME
   | TIMESTAMP
   ;

extractFunction
   : EXTRACT LR_BRACKET datetimePart FROM functionArg RR_BRACKET
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

highlightFunction
   : HIGHLIGHT LR_BRACKET relevanceField (COMMA highlightArg)* RR_BRACKET
   ;

positionFunction
   : POSITION LR_BRACKET functionArg IN functionArg RR_BRACKET
   ;

matchQueryAltSyntaxFunction
   : field = relevanceField EQUAL_SYMBOL MATCH_QUERY LR_BRACKET query = relevanceQuery RR_BRACKET
   ;

scalarFunctionName
   : mathematicalFunctionName
   | dateTimeFunctionName
   | textFunctionName
   | flowControlFunctionName
   | systemFunctionName
   | nestedFunctionName
   ;

specificFunction
   : CASE expression caseFuncAlternative+ (ELSE elseArg = functionArg)? END     # caseFunctionCall
   | CASE caseFuncAlternative+ (ELSE elseArg = functionArg)? END                # caseFunctionCall
   | CAST '(' expression AS convertedDataType ')'                               # dataTypeFunctionCall
   ;

relevanceFunction
   : noFieldRelevanceFunction
   | singleFieldRelevanceFunction
   | multiFieldRelevanceFunction
   | altSingleFieldRelevanceFunction
   | altMultiFieldRelevanceFunction
   ;

scoreRelevanceFunction
   : scoreRelevanceFunctionName LR_BRACKET relevanceFunction (COMMA weight = relevanceFieldWeight)? RR_BRACKET
   ;

noFieldRelevanceFunction
   : noFieldRelevanceFunctionName LR_BRACKET query = relevanceQuery (COMMA relevanceArg)* RR_BRACKET
   ;

// Field is a single column
singleFieldRelevanceFunction
   : singleFieldRelevanceFunctionName LR_BRACKET field = relevanceField COMMA query = relevanceQuery (COMMA relevanceArg)* RR_BRACKET
   ;

// Field is a list of columns
multiFieldRelevanceFunction
   : multiFieldRelevanceFunctionName LR_BRACKET LT_SQR_PRTHS field = relevanceFieldAndWeight (COMMA field = relevanceFieldAndWeight)* RT_SQR_PRTHS COMMA query = relevanceQuery (COMMA relevanceArg)* RR_BRACKET
   | multiFieldRelevanceFunctionName LR_BRACKET alternateMultiMatchQuery COMMA alternateMultiMatchField (COMMA relevanceArg)* RR_BRACKET
   ;

altSingleFieldRelevanceFunction
   : field = relevanceField EQUAL_SYMBOL altSyntaxFunctionName = altSingleFieldRelevanceFunctionName LR_BRACKET query = relevanceQuery (COMMA relevanceArg)* RR_BRACKET
   ;

altMultiFieldRelevanceFunction
   : field = relevanceField EQUAL_SYMBOL altSyntaxFunctionName = altMultiFieldRelevanceFunctionName LR_BRACKET query = relevanceQuery (COMMA relevanceArg)* RR_BRACKET
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
   ;

caseFuncAlternative
   : WHEN condition = functionArg THEN consequent = functionArg
   ;

aggregateFunction
   : functionName = aggregationFunctionName LR_BRACKET functionArg RR_BRACKET   # regularAggregateFunctionCall
   | COUNT LR_BRACKET STAR RR_BRACKET                                           # countStarFunctionCall
   | COUNT LR_BRACKET DISTINCT functionArg RR_BRACKET                           # distinctCountFunctionCall
   | percentileApproxFunction                                                   # percentileApproxFunctionCall
   ;

percentileApproxFunction
   : (PERCENTILE | PERCENTILE_APPROX) LR_BRACKET aggField = functionArg
       COMMA percent = numericLiteral (COMMA compression = numericLiteral)? RR_BRACKET
   ;

filterClause
   : FILTER LR_BRACKET WHERE expression RR_BRACKET
   ;

aggregationFunctionName
   : AVG
   | COUNT
   | SUM
   | MIN
   | MAX
   | VAR_POP
   | VAR_SAMP
   | VARIANCE
   | STD
   | STDDEV
   | STDDEV_POP
   | STDDEV_SAMP
   ;

mathematicalFunctionName
   : ABS
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
   | LOG10
   | LOG2
   | MOD
   | PI
   | POW
   | POWER
   | RAND
   | RINT
   | ROUND
   | SIGN
   | SIGNUM
   | SQRT
   | TRUNCATE
   | trigonometricFunctionName
   | arithmeticFunctionName
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

arithmeticFunctionName
   : ADD
   | SUBTRACT
   | MULTIPLY
   | DIVIDE
   | MOD
   | MODULUS
   ;

dateTimeFunctionName
   : datetimeConstantLiteral
   | ADDDATE
   | ADDTIME
   | CONVERT_TZ
   | CURDATE
   | CURTIME
   | DATE
   | DATE_ADD
   | DATE_FORMAT
   | DATE_SUB
   | DATEDIFF
   | DATETIME
   | DAY
   | DAYNAME
   | DAYOFMONTH
   | DAY_OF_MONTH
   | DAYOFWEEK
   | DAYOFYEAR
   | DAY_OF_YEAR
   | DAY_OF_WEEK
   | FROM_DAYS
   | FROM_UNIXTIME
   | HOUR
   | HOUR_OF_DAY
   | LAST_DAY
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
   | SEC_TO_TIME
   | SECOND
   | SECOND_OF_MINUTE
   | SUBDATE
   | SUBTIME
   | SYSDATE
   | STR_TO_DATE
   | TIME
   | TIME_FORMAT
   | TIME_TO_SEC
   | TIMEDIFF
   | TIMESTAMP
   | TO_DAYS
   | TO_SECONDS
   | UNIX_TIMESTAMP
   | WEEK
   | WEEKDAY
   | WEEK_OF_YEAR
   | WEEKOFYEAR
   | YEAR
   | YEARWEEK
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
   | SUBSTR
   | LENGTH
   | STRCMP
   | RIGHT
   | LEFT
   | ASCII
   | LOCATE
   | REPLACE
   | REVERSE
   ;

flowControlFunctionName
   : IF
   | IFNULL
   | NULLIF
   | ISNULL
   ;

noFieldRelevanceFunctionName
   : QUERY
   ;

systemFunctionName
   : TYPEOF
   ;

nestedFunctionName
   : NESTED
   ;

scoreRelevanceFunctionName
   : SCORE
   | SCOREQUERY
   | SCORE_QUERY
   ;

singleFieldRelevanceFunctionName
   : MATCH
   | MATCHQUERY
   | MATCH_QUERY
   | MATCH_PHRASE
   | MATCHPHRASE
   | MATCHPHRASEQUERY
   | MATCH_BOOL_PREFIX
   | MATCH_PHRASE_PREFIX
   | WILDCARD_QUERY
   | WILDCARDQUERY
   ;

multiFieldRelevanceFunctionName
   : MULTI_MATCH
   | MULTIMATCH
   | MULTIMATCHQUERY
   | SIMPLE_QUERY_STRING
   | QUERY_STRING
   ;

altSingleFieldRelevanceFunctionName
   : MATCH_QUERY
   | MATCHQUERY
   | MATCH_PHRASE
   | MATCHPHRASE
   ;

altMultiFieldRelevanceFunctionName
   : MULTI_MATCH
   | MULTIMATCH
   ;

functionArgs
   : (functionArg (COMMA functionArg)*)?
   ;

functionArg
   : expression
   ;

relevanceArg
   : relevanceArgName EQUAL_SYMBOL relevanceArgValue
   | argName = stringLiteral EQUAL_SYMBOL argVal = relevanceArgValue
   ;

highlightArg
   : highlightArgName EQUAL_SYMBOL highlightArgValue
   ;

relevanceArgName
   : ALLOW_LEADING_WILDCARD
   | ANALYZER
   | ANALYZE_WILDCARD
   | AUTO_GENERATE_SYNONYMS_PHRASE_QUERY
   | BOOST
   | CASE_INSENSITIVE
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

highlightArgName
   : HIGHLIGHT_POST_TAGS
   | HIGHLIGHT_PRE_TAGS
   ;

relevanceFieldAndWeight
   : field = relevanceField
   | field = relevanceField weight = relevanceFieldWeight
   | field = relevanceField BIT_XOR_OP weight = relevanceFieldWeight
   ;

relevanceFieldWeight
   : numericLiteral
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
   | constant
   ;

highlightArgValue
   : stringLiteral
   ;

alternateMultiMatchArgName
   : FIELDS
   | QUERY
   | stringLiteral
   ;

alternateMultiMatchQuery
   : argName = alternateMultiMatchArgName EQUAL_SYMBOL argVal = relevanceArgValue
   ;

alternateMultiMatchField
   : argName = alternateMultiMatchArgName EQUAL_SYMBOL argVal = relevanceArgValue
   | argName = alternateMultiMatchArgName EQUAL_SYMBOL LT_SQR_PRTHS argVal = relevanceArgValue RT_SQR_PRTHS
   ;

// Identifiers
tableName
   : qualifiedName
   ;

columnName
   : qualifiedName
   ;

allTupleFields
   : path = qualifiedName DOT STAR
   ;

alias
   : ident
   ;

qualifiedName
   : ident (DOT ident)*
   ;

ident
   : DOT? ID
   | BACKTICK_QUOTE_ID
   | keywordsCanBeId
   | scalarFunctionName
   ;

keywordsCanBeId
   : FULL
   | FIELD
   | D
   | T
   | TS // OD SQL and ODBC special
   | COUNT
   | SUM
   | AVG
   | MAX
   | MIN
   | FIRST
   | LAST
   | TYPE // TODO: Type is keyword required by relevancy function. Remove this when relevancy functions moved out
   ;