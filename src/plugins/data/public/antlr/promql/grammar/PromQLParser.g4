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

// $antlr-format alignTrailingComments true, columnLimit 150, minEmptyLines 1, maxEmptyLinesToKeep 1, reflowComments false, useTab false
// $antlr-format allowShortRulesOnASingleLine false, allowShortBlocksOnASingleLine true, alignSemicolons hanging, alignColons hanging

parser grammar PromQLParser;

options {
    tokenVocab = PromQLLexer;
}

expression
    : vectorOperation EOF
    ;

// Binary operations are ordered by precedence

// Unary operations have the same precedence as multiplications

vectorOperation
    : <assoc = right> vectorOperation powOp vectorOperation
    | <assoc = right> vectorOperation subqueryOp
    | unaryOp vectorOperation
    | vectorOperation multOp vectorOperation
    | vectorOperation addOp vectorOperation
    | vectorOperation compareOp vectorOperation
    | vectorOperation andUnlessOp vectorOperation
    | vectorOperation orOp vectorOperation
    | vectorOperation vectorMatchOp vectorOperation
    | vectorOperation AT vectorOperation
    | vector
    ;

// Operators

unaryOp
    : (ADD | SUB)
    ;

powOp
    : POW grouping?
    ;

multOp
    : (MULT | DIV | MOD) grouping?
    ;

addOp
    : (ADD | SUB) grouping?
    ;

compareOp
    : (DEQ | NE | GT | LT | GE | LE) BOOL? grouping?
    ;

andUnlessOp
    : (AND | UNLESS) grouping?
    ;

orOp
    : OR grouping?
    ;

vectorMatchOp
    : (ON | UNLESS) grouping?
    ;

subqueryOp
    : subqueryRange offsetOp?
    ;

offsetOp
    : OFFSET duration
    ;

vector
    : function
    | aggregation
    | instantSelector
    | matrixSelector
    | offset
    | literal
    | parens
    ;

parens
    : LEFT_PAREN vectorOperation RIGHT_PAREN
    ;

// Selectors

metricName
    : METRIC_NAME
    ;

instantSelector
    : metricName (LEFT_BRACE labelMatcherList? RIGHT_BRACE)?
    | LEFT_BRACE labelMatcherList RIGHT_BRACE
    ;

labelMatcher
    : labelName labelMatcherOperator labelValue
    ;

labelValue
    : STRING
    ;

labelMatcherOperator
    : EQ
    | NE
    | RE
    | NRE
    ;

labelMatcherList
    : labelMatcher (COMMA labelMatcher)* COMMA?
    ;

matrixSelector
    : instantSelector timeRange
    ;

timeRange
    : LEFT_BRACKET duration RIGHT_BRACKET
    ;

subqueryRange
    : LEFT_BRACKET duration COLON duration? RIGHT_BRACKET
    ;

duration
    : (DURATION)+
    ;

offset
    : instantSelector OFFSET duration
    | matrixSelector OFFSET duration
    ;

// Functions

function
    : functionNames LEFT_PAREN (parameter (COMMA parameter)*)? RIGHT_PAREN
    ;

parameter
    : literal
    | vectorOperation
    ;

parameterList
    : LEFT_PAREN (parameter (COMMA parameter)*)? RIGHT_PAREN
    ;

functionNames
    : ABS
    | ABSENT
    | ABSENT_OVER_TIME
    | CEIL
    | CHANGES
    | CLAMP
    | CLAMP_MAX
    | CLAMP_MIN
    | DAY_OF_MONTH
    | DAY_OF_WEEK
    | DAY_OF_YEAR
    | DAYS_IN_MONTH
    | DELTA
    | DERIV
    | EXP
    | FLOOR
    | HISTOGRAM_COUNT
    | HISTOGRAM_SUM
    | HISTOGRAM_FRACTION
    | HISTOGRAM_QUANTILE
    | HOLT_WINTERS
    | HOUR
    | IDELTA
    | INCREASE
    | IRATE
    | LABEL_JOIN
    | LABEL_REPLACE
    | LN
    | LOG2
    | LOG10
    | MINUTE
    | MONTH
    | PREDICT_LINEAR
    | RATE
    | RESETS
    | ROUND
    | SCALAR
    | SGN
    | SORT
    | SORT_DESC
    | SQRT
    | TIME
    | TIMESTAMP
    | VECTOR
    | YEAR
    | AVG_OVER_TIME
    | MIN_OVER_TIME
    | MAX_OVER_TIME
    | SUM_OVER_TIME
    | COUNT_OVER_TIME
    | QUANTILE_OVER_TIME
    | STDDEV_OVER_TIME
    | STDVAR_OVER_TIME
    | LAST_OVER_TIME
    | PRESENT_OVER_TIME
    | ACOS
    | ACOSH
    | ASIN
    | ASINH
    | ATAN
    | ATANH
    | COS
    | COSH
    | SIN
    | SINH
    | TAN
    | TANH
    | DEG
    | PI
    | RAD
    ;

// Aggregations

aggregation
    : aggregationOperators parameterList
    | aggregationOperators (by | without) parameterList
    | aggregationOperators parameterList ( by | without)
    ;

by
    : BY labelNameList
    ;

without
    : WITHOUT labelNameList
    ;

aggregationOperators
    : SUM
    | MIN
    | MAX
    | AVG
    | GROUP
    | STDDEV
    | STDVAR
    | COUNT
    | COUNT_VALUES
    | BOTTOMK
    | TOPK
    | QUANTILE
    | LIMITK
    | LIMIT_RATIO
    ;

// Vector one-to-one/one-to-many joins
grouping
    : (on_ | ignoring) (groupLeft | groupRight)?
    ;

on_
    : ON labelNameList
    ;

ignoring
    : IGNORING labelNameList
    ;

groupLeft
    : GROUP_LEFT labelNameList?
    ;

groupRight
    : GROUP_RIGHT labelNameList?
    ;

// Label names

labelName
    : keyword
    | metricName
    | LABEL_NAME
    ;

labelNameList
    : LEFT_PAREN (labelName (COMMA labelName)*)? RIGHT_PAREN
    ;

keyword
    : AND
    | OR
    | UNLESS
    | BY
    | WITHOUT
    | ON
    | IGNORING
    | GROUP_LEFT
    | GROUP_RIGHT
    | OFFSET
    | BOOL
    | aggregationOperators
    | functionNames
    ;

literal
    : NUMBER
    | STRING
    ;