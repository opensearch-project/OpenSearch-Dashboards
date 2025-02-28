// Generated from ./src/plugins/data/public/antlr/promql/grammar/PromQLParser.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { PromQLParserVisitor } from "./PromQLParserVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class PromQLParser extends antlr.Parser {
    public static readonly NUMBER = 1;
    public static readonly STRING = 2;
    public static readonly ADD = 3;
    public static readonly SUB = 4;
    public static readonly MULT = 5;
    public static readonly DIV = 6;
    public static readonly MOD = 7;
    public static readonly POW = 8;
    public static readonly AND = 9;
    public static readonly OR = 10;
    public static readonly UNLESS = 11;
    public static readonly EQ = 12;
    public static readonly DEQ = 13;
    public static readonly NE = 14;
    public static readonly GT = 15;
    public static readonly LT = 16;
    public static readonly GE = 17;
    public static readonly LE = 18;
    public static readonly RE = 19;
    public static readonly NRE = 20;
    public static readonly BY = 21;
    public static readonly WITHOUT = 22;
    public static readonly ON = 23;
    public static readonly IGNORING = 24;
    public static readonly GROUP_LEFT = 25;
    public static readonly GROUP_RIGHT = 26;
    public static readonly OFFSET = 27;
    public static readonly BOOL = 28;
    public static readonly SUM = 29;
    public static readonly MIN = 30;
    public static readonly MAX = 31;
    public static readonly AVG = 32;
    public static readonly GROUP = 33;
    public static readonly STDDEV = 34;
    public static readonly STDVAR = 35;
    public static readonly COUNT = 36;
    public static readonly COUNT_VALUES = 37;
    public static readonly BOTTOMK = 38;
    public static readonly TOPK = 39;
    public static readonly QUANTILE = 40;
    public static readonly ABS = 41;
    public static readonly ABSENT = 42;
    public static readonly ABSENT_OVER_TIME = 43;
    public static readonly CEIL = 44;
    public static readonly CHANGES = 45;
    public static readonly CLAMP = 46;
    public static readonly CLAMP_MAX = 47;
    public static readonly CLAMP_MIN = 48;
    public static readonly DAY_OF_MONTH = 49;
    public static readonly DAY_OF_WEEK = 50;
    public static readonly DAY_OF_YEAR = 51;
    public static readonly DAYS_IN_MONTH = 52;
    public static readonly DELTA = 53;
    public static readonly DERIV = 54;
    public static readonly EXP = 55;
    public static readonly FLOOR = 56;
    public static readonly HISTOGRAM_COUNT = 57;
    public static readonly HISTOGRAM_SUM = 58;
    public static readonly HISTOGRAM_FRACTION = 59;
    public static readonly HISTOGRAM_QUANTILE = 60;
    public static readonly HOLT_WINTERS = 61;
    public static readonly HOUR = 62;
    public static readonly IDELTA = 63;
    public static readonly INCREASE = 64;
    public static readonly IRATE = 65;
    public static readonly LABEL_JOIN = 66;
    public static readonly LABEL_REPLACE = 67;
    public static readonly LN = 68;
    public static readonly LOG2 = 69;
    public static readonly LOG10 = 70;
    public static readonly MINUTE = 71;
    public static readonly MONTH = 72;
    public static readonly PREDICT_LINEAR = 73;
    public static readonly RATE = 74;
    public static readonly RESETS = 75;
    public static readonly ROUND = 76;
    public static readonly SCALAR = 77;
    public static readonly SGN = 78;
    public static readonly SORT = 79;
    public static readonly SORT_DESC = 80;
    public static readonly SQRT = 81;
    public static readonly TIME = 82;
    public static readonly TIMESTAMP = 83;
    public static readonly VECTOR = 84;
    public static readonly YEAR = 85;
    public static readonly AVG_OVER_TIME = 86;
    public static readonly MIN_OVER_TIME = 87;
    public static readonly MAX_OVER_TIME = 88;
    public static readonly SUM_OVER_TIME = 89;
    public static readonly COUNT_OVER_TIME = 90;
    public static readonly QUANTILE_OVER_TIME = 91;
    public static readonly STDDEV_OVER_TIME = 92;
    public static readonly STDVAR_OVER_TIME = 93;
    public static readonly LAST_OVER_TIME = 94;
    public static readonly PRESENT_OVER_TIME = 95;
    public static readonly ACOS = 96;
    public static readonly ACOSH = 97;
    public static readonly ASIN = 98;
    public static readonly ASINH = 99;
    public static readonly ATAN = 100;
    public static readonly ATANH = 101;
    public static readonly COS = 102;
    public static readonly COSH = 103;
    public static readonly SIN = 104;
    public static readonly SINH = 105;
    public static readonly TAN = 106;
    public static readonly TANH = 107;
    public static readonly DEG = 108;
    public static readonly PI = 109;
    public static readonly RAD = 110;
    public static readonly LEFT_BRACE = 111;
    public static readonly RIGHT_BRACE = 112;
    public static readonly LEFT_PAREN = 113;
    public static readonly RIGHT_PAREN = 114;
    public static readonly LEFT_BRACKET = 115;
    public static readonly RIGHT_BRACKET = 116;
    public static readonly COMMA = 117;
    public static readonly AT = 118;
    public static readonly SUBQUERY_RANGE = 119;
    public static readonly TIME_RANGE = 120;
    public static readonly DURATION = 121;
    public static readonly METRIC_NAME = 122;
    public static readonly LABEL_NAME = 123;
    public static readonly WS = 124;
    public static readonly SL_COMMENT = 125;
    public static readonly RULE_expression = 0;
    public static readonly RULE_vectorOperation = 1;
    public static readonly RULE_unaryOp = 2;
    public static readonly RULE_powOp = 3;
    public static readonly RULE_multOp = 4;
    public static readonly RULE_addOp = 5;
    public static readonly RULE_compareOp = 6;
    public static readonly RULE_andUnlessOp = 7;
    public static readonly RULE_orOp = 8;
    public static readonly RULE_vectorMatchOp = 9;
    public static readonly RULE_subqueryOp = 10;
    public static readonly RULE_offsetOp = 11;
    public static readonly RULE_vector = 12;
    public static readonly RULE_parens = 13;
    public static readonly RULE_instantSelector = 14;
    public static readonly RULE_labelMatcher = 15;
    public static readonly RULE_labelMatcherOperator = 16;
    public static readonly RULE_labelMatcherList = 17;
    public static readonly RULE_matrixSelector = 18;
    public static readonly RULE_offset = 19;
    public static readonly RULE_function = 20;
    public static readonly RULE_parameter = 21;
    public static readonly RULE_parameterList = 22;
    public static readonly RULE_functionNames = 23;
    public static readonly RULE_aggregation = 24;
    public static readonly RULE_by = 25;
    public static readonly RULE_without = 26;
    public static readonly RULE_aggregationOperators = 27;
    public static readonly RULE_grouping = 28;
    public static readonly RULE_on_ = 29;
    public static readonly RULE_ignoring = 30;
    public static readonly RULE_groupLeft = 31;
    public static readonly RULE_groupRight = 32;
    public static readonly RULE_labelName = 33;
    public static readonly RULE_labelNameList = 34;
    public static readonly RULE_keyword = 35;
    public static readonly RULE_literal = 36;

    public static readonly literalNames = [
        null, null, null, "'+'", "'-'", "'*'", "'/'", "'%'", "'^'", "'and'", 
        "'or'", "'unless'", "'='", "'=='", "'!='", "'>'", "'<'", "'>='", 
        "'<='", "'=~'", "'!~'", "'by'", "'without'", "'on'", "'ignoring'", 
        "'group_left'", "'group_right'", "'offset'", "'bool'", "'sum'", 
        "'min'", "'max'", "'avg'", "'group'", "'stddev'", "'stdvar'", "'count'", 
        "'count_values'", "'bottomk'", "'topk'", "'quantile'", "'abs'", 
        "'absent'", "'absent_over_time'", "'ceil'", "'changes'", "'clamp'", 
        "'clamp_max'", "'clamp_min'", "'day_of_month'", "'day_of_week'", 
        "'day_of_year'", "'days_in_month'", "'delta'", "'deriv'", "'exp'", 
        "'floor'", "'histogram_count'", "'histogram_sum'", "'histogram_fraction'", 
        "'histogram_quantile'", "'holt_winters'", "'hour'", "'idelta'", 
        "'increase'", "'irate'", "'label_join'", "'label_replace'", "'ln'", 
        "'log2'", "'log10'", "'minute'", "'month'", "'predict_linear'", 
        "'rate'", "'resets'", "'round'", "'scalar'", "'sgn'", "'sort'", 
        "'sort_desc'", "'sqrt'", "'time'", "'timestamp'", "'vector'", "'year'", 
        "'avg_over_time'", "'min_over_time'", "'max_over_time'", "'sum_over_time'", 
        "'count_over_time'", "'quantile_over_time'", "'stddev_over_time'", 
        "'stdvar_over_time'", "'last_over_time'", "'present_over_time'", 
        "'acos'", "'acosh'", "'asin'", "'asinh'", "'atan'", "'atanh'", "'cos'", 
        "'cosh'", "'sin'", "'sinh'", "'tan'", "'tanh'", "'deg'", "'pi'", 
        "'rad'", "'{'", "'}'", "'('", "')'", "'['", "']'", "','", "'@'"
    ];

    public static readonly symbolicNames = [
        null, "NUMBER", "STRING", "ADD", "SUB", "MULT", "DIV", "MOD", "POW", 
        "AND", "OR", "UNLESS", "EQ", "DEQ", "NE", "GT", "LT", "GE", "LE", 
        "RE", "NRE", "BY", "WITHOUT", "ON", "IGNORING", "GROUP_LEFT", "GROUP_RIGHT", 
        "OFFSET", "BOOL", "SUM", "MIN", "MAX", "AVG", "GROUP", "STDDEV", 
        "STDVAR", "COUNT", "COUNT_VALUES", "BOTTOMK", "TOPK", "QUANTILE", 
        "ABS", "ABSENT", "ABSENT_OVER_TIME", "CEIL", "CHANGES", "CLAMP", 
        "CLAMP_MAX", "CLAMP_MIN", "DAY_OF_MONTH", "DAY_OF_WEEK", "DAY_OF_YEAR", 
        "DAYS_IN_MONTH", "DELTA", "DERIV", "EXP", "FLOOR", "HISTOGRAM_COUNT", 
        "HISTOGRAM_SUM", "HISTOGRAM_FRACTION", "HISTOGRAM_QUANTILE", "HOLT_WINTERS", 
        "HOUR", "IDELTA", "INCREASE", "IRATE", "LABEL_JOIN", "LABEL_REPLACE", 
        "LN", "LOG2", "LOG10", "MINUTE", "MONTH", "PREDICT_LINEAR", "RATE", 
        "RESETS", "ROUND", "SCALAR", "SGN", "SORT", "SORT_DESC", "SQRT", 
        "TIME", "TIMESTAMP", "VECTOR", "YEAR", "AVG_OVER_TIME", "MIN_OVER_TIME", 
        "MAX_OVER_TIME", "SUM_OVER_TIME", "COUNT_OVER_TIME", "QUANTILE_OVER_TIME", 
        "STDDEV_OVER_TIME", "STDVAR_OVER_TIME", "LAST_OVER_TIME", "PRESENT_OVER_TIME", 
        "ACOS", "ACOSH", "ASIN", "ASINH", "ATAN", "ATANH", "COS", "COSH", 
        "SIN", "SINH", "TAN", "TANH", "DEG", "PI", "RAD", "LEFT_BRACE", 
        "RIGHT_BRACE", "LEFT_PAREN", "RIGHT_PAREN", "LEFT_BRACKET", "RIGHT_BRACKET", 
        "COMMA", "AT", "SUBQUERY_RANGE", "TIME_RANGE", "DURATION", "METRIC_NAME", 
        "LABEL_NAME", "WS", "SL_COMMENT"
    ];
    public static readonly ruleNames = [
        "expression", "vectorOperation", "unaryOp", "powOp", "multOp", "addOp", 
        "compareOp", "andUnlessOp", "orOp", "vectorMatchOp", "subqueryOp", 
        "offsetOp", "vector", "parens", "instantSelector", "labelMatcher", 
        "labelMatcherOperator", "labelMatcherList", "matrixSelector", "offset", 
        "function", "parameter", "parameterList", "functionNames", "aggregation", 
        "by", "without", "aggregationOperators", "grouping", "on_", "ignoring", 
        "groupLeft", "groupRight", "labelName", "labelNameList", "keyword", 
        "literal",
    ];

    public get grammarFileName(): string { return "PromQLParser.g4"; }
    public get literalNames(): (string | null)[] { return PromQLParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return PromQLParser.symbolicNames; }
    public get ruleNames(): string[] { return PromQLParser.ruleNames; }
    public get serializedATN(): number[] { return PromQLParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, PromQLParser._ATN, PromQLParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public expression(): ExpressionContext {
        let localContext = new ExpressionContext(this.context, this.state);
        this.enterRule(localContext, 0, PromQLParser.RULE_expression);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 74;
            this.vectorOperation(0);
            this.state = 75;
            this.match(PromQLParser.EOF);
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

    public vectorOperation(): VectorOperationContext;
    public vectorOperation(_p: number): VectorOperationContext;
    public vectorOperation(_p?: number): VectorOperationContext {
        if (_p === undefined) {
            _p = 0;
        }

        let parentContext = this.context;
        let parentState = this.state;
        let localContext = new VectorOperationContext(this.context, parentState);
        let previousContext = localContext;
        let _startState = 2;
        this.enterRecursionRule(localContext, 2, PromQLParser.RULE_vectorOperation, _p);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 82;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.ADD:
            case PromQLParser.SUB:
                {
                this.state = 78;
                this.unaryOp();
                this.state = 79;
                this.vectorOperation(9);
                }
                break;
            case PromQLParser.NUMBER:
            case PromQLParser.STRING:
            case PromQLParser.SUM:
            case PromQLParser.MIN:
            case PromQLParser.MAX:
            case PromQLParser.AVG:
            case PromQLParser.GROUP:
            case PromQLParser.STDDEV:
            case PromQLParser.STDVAR:
            case PromQLParser.COUNT:
            case PromQLParser.COUNT_VALUES:
            case PromQLParser.BOTTOMK:
            case PromQLParser.TOPK:
            case PromQLParser.QUANTILE:
            case PromQLParser.ABS:
            case PromQLParser.ABSENT:
            case PromQLParser.ABSENT_OVER_TIME:
            case PromQLParser.CEIL:
            case PromQLParser.CHANGES:
            case PromQLParser.CLAMP:
            case PromQLParser.CLAMP_MAX:
            case PromQLParser.CLAMP_MIN:
            case PromQLParser.DAY_OF_MONTH:
            case PromQLParser.DAY_OF_WEEK:
            case PromQLParser.DAY_OF_YEAR:
            case PromQLParser.DAYS_IN_MONTH:
            case PromQLParser.DELTA:
            case PromQLParser.DERIV:
            case PromQLParser.EXP:
            case PromQLParser.FLOOR:
            case PromQLParser.HISTOGRAM_COUNT:
            case PromQLParser.HISTOGRAM_SUM:
            case PromQLParser.HISTOGRAM_FRACTION:
            case PromQLParser.HISTOGRAM_QUANTILE:
            case PromQLParser.HOLT_WINTERS:
            case PromQLParser.HOUR:
            case PromQLParser.IDELTA:
            case PromQLParser.INCREASE:
            case PromQLParser.IRATE:
            case PromQLParser.LABEL_JOIN:
            case PromQLParser.LABEL_REPLACE:
            case PromQLParser.LN:
            case PromQLParser.LOG2:
            case PromQLParser.LOG10:
            case PromQLParser.MINUTE:
            case PromQLParser.MONTH:
            case PromQLParser.PREDICT_LINEAR:
            case PromQLParser.RATE:
            case PromQLParser.RESETS:
            case PromQLParser.ROUND:
            case PromQLParser.SCALAR:
            case PromQLParser.SGN:
            case PromQLParser.SORT:
            case PromQLParser.SORT_DESC:
            case PromQLParser.SQRT:
            case PromQLParser.TIME:
            case PromQLParser.TIMESTAMP:
            case PromQLParser.VECTOR:
            case PromQLParser.YEAR:
            case PromQLParser.AVG_OVER_TIME:
            case PromQLParser.MIN_OVER_TIME:
            case PromQLParser.MAX_OVER_TIME:
            case PromQLParser.SUM_OVER_TIME:
            case PromQLParser.COUNT_OVER_TIME:
            case PromQLParser.QUANTILE_OVER_TIME:
            case PromQLParser.STDDEV_OVER_TIME:
            case PromQLParser.STDVAR_OVER_TIME:
            case PromQLParser.LAST_OVER_TIME:
            case PromQLParser.PRESENT_OVER_TIME:
            case PromQLParser.ACOS:
            case PromQLParser.ACOSH:
            case PromQLParser.ASIN:
            case PromQLParser.ASINH:
            case PromQLParser.ATAN:
            case PromQLParser.ATANH:
            case PromQLParser.COS:
            case PromQLParser.COSH:
            case PromQLParser.SIN:
            case PromQLParser.SINH:
            case PromQLParser.TAN:
            case PromQLParser.TANH:
            case PromQLParser.DEG:
            case PromQLParser.PI:
            case PromQLParser.RAD:
            case PromQLParser.LEFT_BRACE:
            case PromQLParser.LEFT_PAREN:
            case PromQLParser.METRIC_NAME:
                {
                this.state = 81;
                this.vector();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.context!.stop = this.tokenStream.LT(-1);
            this.state = 119;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 2, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    if (this.parseListeners != null) {
                        this.triggerExitRuleEvent();
                    }
                    previousContext = localContext;
                    {
                    this.state = 117;
                    this.errorHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this.tokenStream, 1, this.context) ) {
                    case 1:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 84;
                        if (!(this.precpred(this.context, 11))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 11)");
                        }
                        this.state = 85;
                        this.powOp();
                        this.state = 86;
                        this.vectorOperation(11);
                        }
                        break;
                    case 2:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 88;
                        if (!(this.precpred(this.context, 8))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 8)");
                        }
                        this.state = 89;
                        this.multOp();
                        this.state = 90;
                        this.vectorOperation(9);
                        }
                        break;
                    case 3:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 92;
                        if (!(this.precpred(this.context, 7))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 7)");
                        }
                        this.state = 93;
                        this.addOp();
                        this.state = 94;
                        this.vectorOperation(8);
                        }
                        break;
                    case 4:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 96;
                        if (!(this.precpred(this.context, 6))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 6)");
                        }
                        this.state = 97;
                        this.compareOp();
                        this.state = 98;
                        this.vectorOperation(7);
                        }
                        break;
                    case 5:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 100;
                        if (!(this.precpred(this.context, 5))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 5)");
                        }
                        this.state = 101;
                        this.andUnlessOp();
                        this.state = 102;
                        this.vectorOperation(6);
                        }
                        break;
                    case 6:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 104;
                        if (!(this.precpred(this.context, 4))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 4)");
                        }
                        this.state = 105;
                        this.orOp();
                        this.state = 106;
                        this.vectorOperation(5);
                        }
                        break;
                    case 7:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 108;
                        if (!(this.precpred(this.context, 3))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 3)");
                        }
                        this.state = 109;
                        this.vectorMatchOp();
                        this.state = 110;
                        this.vectorOperation(4);
                        }
                        break;
                    case 8:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 112;
                        if (!(this.precpred(this.context, 2))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 2)");
                        }
                        this.state = 113;
                        this.match(PromQLParser.AT);
                        this.state = 114;
                        this.vectorOperation(3);
                        }
                        break;
                    case 9:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 115;
                        if (!(this.precpred(this.context, 10))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 10)");
                        }
                        this.state = 116;
                        this.subqueryOp();
                        }
                        break;
                    }
                    }
                }
                this.state = 121;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 2, this.context);
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
    public unaryOp(): UnaryOpContext {
        let localContext = new UnaryOpContext(this.context, this.state);
        this.enterRule(localContext, 4, PromQLParser.RULE_unaryOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 122;
            _la = this.tokenStream.LA(1);
            if(!(_la === 3 || _la === 4)) {
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
    public powOp(): PowOpContext {
        let localContext = new PowOpContext(this.context, this.state);
        this.enterRule(localContext, 6, PromQLParser.RULE_powOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 124;
            this.match(PromQLParser.POW);
            this.state = 126;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 125;
                this.grouping();
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
    public multOp(): MultOpContext {
        let localContext = new MultOpContext(this.context, this.state);
        this.enterRule(localContext, 8, PromQLParser.RULE_multOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 128;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 224) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 130;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 129;
                this.grouping();
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
    public addOp(): AddOpContext {
        let localContext = new AddOpContext(this.context, this.state);
        this.enterRule(localContext, 10, PromQLParser.RULE_addOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 132;
            _la = this.tokenStream.LA(1);
            if(!(_la === 3 || _la === 4)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 134;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 133;
                this.grouping();
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
    public compareOp(): CompareOpContext {
        let localContext = new CompareOpContext(this.context, this.state);
        this.enterRule(localContext, 12, PromQLParser.RULE_compareOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 136;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 516096) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 138;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 28) {
                {
                this.state = 137;
                this.match(PromQLParser.BOOL);
                }
            }

            this.state = 141;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 140;
                this.grouping();
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
    public andUnlessOp(): AndUnlessOpContext {
        let localContext = new AndUnlessOpContext(this.context, this.state);
        this.enterRule(localContext, 14, PromQLParser.RULE_andUnlessOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 143;
            _la = this.tokenStream.LA(1);
            if(!(_la === 9 || _la === 11)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 145;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 144;
                this.grouping();
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
    public orOp(): OrOpContext {
        let localContext = new OrOpContext(this.context, this.state);
        this.enterRule(localContext, 16, PromQLParser.RULE_orOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 147;
            this.match(PromQLParser.OR);
            this.state = 149;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 148;
                this.grouping();
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
    public vectorMatchOp(): VectorMatchOpContext {
        let localContext = new VectorMatchOpContext(this.context, this.state);
        this.enterRule(localContext, 18, PromQLParser.RULE_vectorMatchOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 151;
            _la = this.tokenStream.LA(1);
            if(!(_la === 11 || _la === 23)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 153;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 152;
                this.grouping();
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
    public subqueryOp(): SubqueryOpContext {
        let localContext = new SubqueryOpContext(this.context, this.state);
        this.enterRule(localContext, 20, PromQLParser.RULE_subqueryOp);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 155;
            this.match(PromQLParser.SUBQUERY_RANGE);
            this.state = 157;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 11, this.context) ) {
            case 1:
                {
                this.state = 156;
                this.offsetOp();
                }
                break;
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
    public offsetOp(): OffsetOpContext {
        let localContext = new OffsetOpContext(this.context, this.state);
        this.enterRule(localContext, 22, PromQLParser.RULE_offsetOp);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 159;
            this.match(PromQLParser.OFFSET);
            this.state = 160;
            this.match(PromQLParser.DURATION);
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
    public vector(): VectorContext {
        let localContext = new VectorContext(this.context, this.state);
        this.enterRule(localContext, 24, PromQLParser.RULE_vector);
        try {
            this.state = 169;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 12, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 162;
                this.function_();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 163;
                this.aggregation();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 164;
                this.instantSelector();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 165;
                this.matrixSelector();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 166;
                this.offset();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 167;
                this.literal();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 168;
                this.parens();
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
    public parens(): ParensContext {
        let localContext = new ParensContext(this.context, this.state);
        this.enterRule(localContext, 26, PromQLParser.RULE_parens);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 171;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 172;
            this.vectorOperation(0);
            this.state = 173;
            this.match(PromQLParser.RIGHT_PAREN);
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
    public instantSelector(): InstantSelectorContext {
        let localContext = new InstantSelectorContext(this.context, this.state);
        this.enterRule(localContext, 28, PromQLParser.RULE_instantSelector);
        let _la: number;
        try {
            this.state = 187;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.METRIC_NAME:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 175;
                this.match(PromQLParser.METRIC_NAME);
                this.state = 181;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 14, this.context) ) {
                case 1:
                    {
                    this.state = 176;
                    this.match(PromQLParser.LEFT_BRACE);
                    this.state = 178;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                    if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4292873728) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 201359359) !== 0)) {
                        {
                        this.state = 177;
                        this.labelMatcherList();
                        }
                    }

                    this.state = 180;
                    this.match(PromQLParser.RIGHT_BRACE);
                    }
                    break;
                }
                }
                break;
            case PromQLParser.LEFT_BRACE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 183;
                this.match(PromQLParser.LEFT_BRACE);
                this.state = 184;
                this.labelMatcherList();
                this.state = 185;
                this.match(PromQLParser.RIGHT_BRACE);
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
    public labelMatcher(): LabelMatcherContext {
        let localContext = new LabelMatcherContext(this.context, this.state);
        this.enterRule(localContext, 30, PromQLParser.RULE_labelMatcher);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 189;
            this.labelName();
            this.state = 190;
            this.labelMatcherOperator();
            this.state = 191;
            this.match(PromQLParser.STRING);
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
    public labelMatcherOperator(): LabelMatcherOperatorContext {
        let localContext = new LabelMatcherOperatorContext(this.context, this.state);
        this.enterRule(localContext, 32, PromQLParser.RULE_labelMatcherOperator);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 193;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 1593344) !== 0))) {
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
    public labelMatcherList(): LabelMatcherListContext {
        let localContext = new LabelMatcherListContext(this.context, this.state);
        this.enterRule(localContext, 34, PromQLParser.RULE_labelMatcherList);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 195;
            this.labelMatcher();
            this.state = 200;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 16, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 196;
                    this.match(PromQLParser.COMMA);
                    this.state = 197;
                    this.labelMatcher();
                    }
                    }
                }
                this.state = 202;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 16, this.context);
            }
            this.state = 204;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 117) {
                {
                this.state = 203;
                this.match(PromQLParser.COMMA);
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
    public matrixSelector(): MatrixSelectorContext {
        let localContext = new MatrixSelectorContext(this.context, this.state);
        this.enterRule(localContext, 36, PromQLParser.RULE_matrixSelector);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 206;
            this.instantSelector();
            this.state = 207;
            this.match(PromQLParser.TIME_RANGE);
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
    public offset(): OffsetContext {
        let localContext = new OffsetContext(this.context, this.state);
        this.enterRule(localContext, 38, PromQLParser.RULE_offset);
        try {
            this.state = 217;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 18, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 209;
                this.instantSelector();
                this.state = 210;
                this.match(PromQLParser.OFFSET);
                this.state = 211;
                this.match(PromQLParser.DURATION);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 213;
                this.matrixSelector();
                this.state = 214;
                this.match(PromQLParser.OFFSET);
                this.state = 215;
                this.match(PromQLParser.DURATION);
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
    public function_(): FunctionContext {
        let localContext = new FunctionContext(this.context, this.state);
        this.enterRule(localContext, 40, PromQLParser.RULE_function);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 219;
            this.functionNames();
            this.state = 220;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 229;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3758096414) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 67305471) !== 0)) {
                {
                this.state = 221;
                this.parameter();
                this.state = 226;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 117) {
                    {
                    {
                    this.state = 222;
                    this.match(PromQLParser.COMMA);
                    this.state = 223;
                    this.parameter();
                    }
                    }
                    this.state = 228;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 231;
            this.match(PromQLParser.RIGHT_PAREN);
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
    public parameter(): ParameterContext {
        let localContext = new ParameterContext(this.context, this.state);
        this.enterRule(localContext, 42, PromQLParser.RULE_parameter);
        try {
            this.state = 235;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 21, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 233;
                this.literal();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 234;
                this.vectorOperation(0);
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
    public parameterList(): ParameterListContext {
        let localContext = new ParameterListContext(this.context, this.state);
        this.enterRule(localContext, 44, PromQLParser.RULE_parameterList);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 237;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 246;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3758096414) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 67305471) !== 0)) {
                {
                this.state = 238;
                this.parameter();
                this.state = 243;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 117) {
                    {
                    {
                    this.state = 239;
                    this.match(PromQLParser.COMMA);
                    this.state = 240;
                    this.parameter();
                    }
                    }
                    this.state = 245;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 248;
            this.match(PromQLParser.RIGHT_PAREN);
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
    public functionNames(): FunctionNamesContext {
        let localContext = new FunctionNamesContext(this.context, this.state);
        this.enterRule(localContext, 46, PromQLParser.RULE_functionNames);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 250;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 41)) & ~0x1F) === 0 && ((1 << (_la - 41)) & 4294967295) !== 0) || ((((_la - 73)) & ~0x1F) === 0 && ((1 << (_la - 73)) & 4294967295) !== 0) || ((((_la - 105)) & ~0x1F) === 0 && ((1 << (_la - 105)) & 63) !== 0))) {
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
    public aggregation(): AggregationContext {
        let localContext = new AggregationContext(this.context, this.state);
        this.enterRule(localContext, 48, PromQLParser.RULE_aggregation);
        try {
            this.state = 268;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 26, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 252;
                this.aggregationOperators();
                this.state = 253;
                this.parameterList();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 255;
                this.aggregationOperators();
                this.state = 258;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PromQLParser.BY:
                    {
                    this.state = 256;
                    this.by();
                    }
                    break;
                case PromQLParser.WITHOUT:
                    {
                    this.state = 257;
                    this.without();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                this.state = 260;
                this.parameterList();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 262;
                this.aggregationOperators();
                this.state = 263;
                this.parameterList();
                this.state = 266;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PromQLParser.BY:
                    {
                    this.state = 264;
                    this.by();
                    }
                    break;
                case PromQLParser.WITHOUT:
                    {
                    this.state = 265;
                    this.without();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
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
    public by(): ByContext {
        let localContext = new ByContext(this.context, this.state);
        this.enterRule(localContext, 50, PromQLParser.RULE_by);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 270;
            this.match(PromQLParser.BY);
            this.state = 271;
            this.labelNameList();
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
    public without(): WithoutContext {
        let localContext = new WithoutContext(this.context, this.state);
        this.enterRule(localContext, 52, PromQLParser.RULE_without);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 273;
            this.match(PromQLParser.WITHOUT);
            this.state = 274;
            this.labelNameList();
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
    public aggregationOperators(): AggregationOperatorsContext {
        let localContext = new AggregationOperatorsContext(this.context, this.state);
        this.enterRule(localContext, 54, PromQLParser.RULE_aggregationOperators);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 276;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 29)) & ~0x1F) === 0 && ((1 << (_la - 29)) & 4095) !== 0))) {
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
    public grouping(): GroupingContext {
        let localContext = new GroupingContext(this.context, this.state);
        this.enterRule(localContext, 56, PromQLParser.RULE_grouping);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 280;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.ON:
                {
                this.state = 278;
                this.on_();
                }
                break;
            case PromQLParser.IGNORING:
                {
                this.state = 279;
                this.ignoring();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 284;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.GROUP_LEFT:
                {
                this.state = 282;
                this.groupLeft();
                }
                break;
            case PromQLParser.GROUP_RIGHT:
                {
                this.state = 283;
                this.groupRight();
                }
                break;
            case PromQLParser.NUMBER:
            case PromQLParser.STRING:
            case PromQLParser.ADD:
            case PromQLParser.SUB:
            case PromQLParser.SUM:
            case PromQLParser.MIN:
            case PromQLParser.MAX:
            case PromQLParser.AVG:
            case PromQLParser.GROUP:
            case PromQLParser.STDDEV:
            case PromQLParser.STDVAR:
            case PromQLParser.COUNT:
            case PromQLParser.COUNT_VALUES:
            case PromQLParser.BOTTOMK:
            case PromQLParser.TOPK:
            case PromQLParser.QUANTILE:
            case PromQLParser.ABS:
            case PromQLParser.ABSENT:
            case PromQLParser.ABSENT_OVER_TIME:
            case PromQLParser.CEIL:
            case PromQLParser.CHANGES:
            case PromQLParser.CLAMP:
            case PromQLParser.CLAMP_MAX:
            case PromQLParser.CLAMP_MIN:
            case PromQLParser.DAY_OF_MONTH:
            case PromQLParser.DAY_OF_WEEK:
            case PromQLParser.DAY_OF_YEAR:
            case PromQLParser.DAYS_IN_MONTH:
            case PromQLParser.DELTA:
            case PromQLParser.DERIV:
            case PromQLParser.EXP:
            case PromQLParser.FLOOR:
            case PromQLParser.HISTOGRAM_COUNT:
            case PromQLParser.HISTOGRAM_SUM:
            case PromQLParser.HISTOGRAM_FRACTION:
            case PromQLParser.HISTOGRAM_QUANTILE:
            case PromQLParser.HOLT_WINTERS:
            case PromQLParser.HOUR:
            case PromQLParser.IDELTA:
            case PromQLParser.INCREASE:
            case PromQLParser.IRATE:
            case PromQLParser.LABEL_JOIN:
            case PromQLParser.LABEL_REPLACE:
            case PromQLParser.LN:
            case PromQLParser.LOG2:
            case PromQLParser.LOG10:
            case PromQLParser.MINUTE:
            case PromQLParser.MONTH:
            case PromQLParser.PREDICT_LINEAR:
            case PromQLParser.RATE:
            case PromQLParser.RESETS:
            case PromQLParser.ROUND:
            case PromQLParser.SCALAR:
            case PromQLParser.SGN:
            case PromQLParser.SORT:
            case PromQLParser.SORT_DESC:
            case PromQLParser.SQRT:
            case PromQLParser.TIME:
            case PromQLParser.TIMESTAMP:
            case PromQLParser.VECTOR:
            case PromQLParser.YEAR:
            case PromQLParser.AVG_OVER_TIME:
            case PromQLParser.MIN_OVER_TIME:
            case PromQLParser.MAX_OVER_TIME:
            case PromQLParser.SUM_OVER_TIME:
            case PromQLParser.COUNT_OVER_TIME:
            case PromQLParser.QUANTILE_OVER_TIME:
            case PromQLParser.STDDEV_OVER_TIME:
            case PromQLParser.STDVAR_OVER_TIME:
            case PromQLParser.LAST_OVER_TIME:
            case PromQLParser.PRESENT_OVER_TIME:
            case PromQLParser.ACOS:
            case PromQLParser.ACOSH:
            case PromQLParser.ASIN:
            case PromQLParser.ASINH:
            case PromQLParser.ATAN:
            case PromQLParser.ATANH:
            case PromQLParser.COS:
            case PromQLParser.COSH:
            case PromQLParser.SIN:
            case PromQLParser.SINH:
            case PromQLParser.TAN:
            case PromQLParser.TANH:
            case PromQLParser.DEG:
            case PromQLParser.PI:
            case PromQLParser.RAD:
            case PromQLParser.LEFT_BRACE:
            case PromQLParser.LEFT_PAREN:
            case PromQLParser.METRIC_NAME:
                break;
            default:
                break;
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
    public on_(): On_Context {
        let localContext = new On_Context(this.context, this.state);
        this.enterRule(localContext, 58, PromQLParser.RULE_on_);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 286;
            this.match(PromQLParser.ON);
            this.state = 287;
            this.labelNameList();
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
    public ignoring(): IgnoringContext {
        let localContext = new IgnoringContext(this.context, this.state);
        this.enterRule(localContext, 60, PromQLParser.RULE_ignoring);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 289;
            this.match(PromQLParser.IGNORING);
            this.state = 290;
            this.labelNameList();
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
    public groupLeft(): GroupLeftContext {
        let localContext = new GroupLeftContext(this.context, this.state);
        this.enterRule(localContext, 62, PromQLParser.RULE_groupLeft);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 292;
            this.match(PromQLParser.GROUP_LEFT);
            this.state = 294;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 29, this.context) ) {
            case 1:
                {
                this.state = 293;
                this.labelNameList();
                }
                break;
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
    public groupRight(): GroupRightContext {
        let localContext = new GroupRightContext(this.context, this.state);
        this.enterRule(localContext, 64, PromQLParser.RULE_groupRight);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 296;
            this.match(PromQLParser.GROUP_RIGHT);
            this.state = 298;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 30, this.context) ) {
            case 1:
                {
                this.state = 297;
                this.labelNameList();
                }
                break;
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
    public labelName(): LabelNameContext {
        let localContext = new LabelNameContext(this.context, this.state);
        this.enterRule(localContext, 66, PromQLParser.RULE_labelName);
        try {
            this.state = 303;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.AND:
            case PromQLParser.OR:
            case PromQLParser.UNLESS:
            case PromQLParser.BY:
            case PromQLParser.WITHOUT:
            case PromQLParser.ON:
            case PromQLParser.IGNORING:
            case PromQLParser.GROUP_LEFT:
            case PromQLParser.GROUP_RIGHT:
            case PromQLParser.OFFSET:
            case PromQLParser.BOOL:
            case PromQLParser.SUM:
            case PromQLParser.MIN:
            case PromQLParser.MAX:
            case PromQLParser.AVG:
            case PromQLParser.GROUP:
            case PromQLParser.STDDEV:
            case PromQLParser.STDVAR:
            case PromQLParser.COUNT:
            case PromQLParser.COUNT_VALUES:
            case PromQLParser.BOTTOMK:
            case PromQLParser.TOPK:
            case PromQLParser.QUANTILE:
            case PromQLParser.ABS:
            case PromQLParser.ABSENT:
            case PromQLParser.ABSENT_OVER_TIME:
            case PromQLParser.CEIL:
            case PromQLParser.CHANGES:
            case PromQLParser.CLAMP:
            case PromQLParser.CLAMP_MAX:
            case PromQLParser.CLAMP_MIN:
            case PromQLParser.DAY_OF_MONTH:
            case PromQLParser.DAY_OF_WEEK:
            case PromQLParser.DAY_OF_YEAR:
            case PromQLParser.DAYS_IN_MONTH:
            case PromQLParser.DELTA:
            case PromQLParser.DERIV:
            case PromQLParser.EXP:
            case PromQLParser.FLOOR:
            case PromQLParser.HISTOGRAM_COUNT:
            case PromQLParser.HISTOGRAM_SUM:
            case PromQLParser.HISTOGRAM_FRACTION:
            case PromQLParser.HISTOGRAM_QUANTILE:
            case PromQLParser.HOLT_WINTERS:
            case PromQLParser.HOUR:
            case PromQLParser.IDELTA:
            case PromQLParser.INCREASE:
            case PromQLParser.IRATE:
            case PromQLParser.LABEL_JOIN:
            case PromQLParser.LABEL_REPLACE:
            case PromQLParser.LN:
            case PromQLParser.LOG2:
            case PromQLParser.LOG10:
            case PromQLParser.MINUTE:
            case PromQLParser.MONTH:
            case PromQLParser.PREDICT_LINEAR:
            case PromQLParser.RATE:
            case PromQLParser.RESETS:
            case PromQLParser.ROUND:
            case PromQLParser.SCALAR:
            case PromQLParser.SGN:
            case PromQLParser.SORT:
            case PromQLParser.SORT_DESC:
            case PromQLParser.SQRT:
            case PromQLParser.TIME:
            case PromQLParser.TIMESTAMP:
            case PromQLParser.VECTOR:
            case PromQLParser.YEAR:
            case PromQLParser.AVG_OVER_TIME:
            case PromQLParser.MIN_OVER_TIME:
            case PromQLParser.MAX_OVER_TIME:
            case PromQLParser.SUM_OVER_TIME:
            case PromQLParser.COUNT_OVER_TIME:
            case PromQLParser.QUANTILE_OVER_TIME:
            case PromQLParser.STDDEV_OVER_TIME:
            case PromQLParser.STDVAR_OVER_TIME:
            case PromQLParser.LAST_OVER_TIME:
            case PromQLParser.PRESENT_OVER_TIME:
            case PromQLParser.ACOS:
            case PromQLParser.ACOSH:
            case PromQLParser.ASIN:
            case PromQLParser.ASINH:
            case PromQLParser.ATAN:
            case PromQLParser.ATANH:
            case PromQLParser.COS:
            case PromQLParser.COSH:
            case PromQLParser.SIN:
            case PromQLParser.SINH:
            case PromQLParser.TAN:
            case PromQLParser.TANH:
            case PromQLParser.DEG:
            case PromQLParser.PI:
            case PromQLParser.RAD:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 300;
                this.keyword();
                }
                break;
            case PromQLParser.METRIC_NAME:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 301;
                this.match(PromQLParser.METRIC_NAME);
                }
                break;
            case PromQLParser.LABEL_NAME:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 302;
                this.match(PromQLParser.LABEL_NAME);
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
    public labelNameList(): LabelNameListContext {
        let localContext = new LabelNameListContext(this.context, this.state);
        this.enterRule(localContext, 68, PromQLParser.RULE_labelNameList);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 305;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 314;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4292873728) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 201359359) !== 0)) {
                {
                this.state = 306;
                this.labelName();
                this.state = 311;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 117) {
                    {
                    {
                    this.state = 307;
                    this.match(PromQLParser.COMMA);
                    this.state = 308;
                    this.labelName();
                    }
                    }
                    this.state = 313;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 316;
            this.match(PromQLParser.RIGHT_PAREN);
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
    public keyword(): KeywordContext {
        let localContext = new KeywordContext(this.context, this.state);
        this.enterRule(localContext, 70, PromQLParser.RULE_keyword);
        try {
            this.state = 331;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.AND:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 318;
                this.match(PromQLParser.AND);
                }
                break;
            case PromQLParser.OR:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 319;
                this.match(PromQLParser.OR);
                }
                break;
            case PromQLParser.UNLESS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 320;
                this.match(PromQLParser.UNLESS);
                }
                break;
            case PromQLParser.BY:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 321;
                this.match(PromQLParser.BY);
                }
                break;
            case PromQLParser.WITHOUT:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 322;
                this.match(PromQLParser.WITHOUT);
                }
                break;
            case PromQLParser.ON:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 323;
                this.match(PromQLParser.ON);
                }
                break;
            case PromQLParser.IGNORING:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 324;
                this.match(PromQLParser.IGNORING);
                }
                break;
            case PromQLParser.GROUP_LEFT:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 325;
                this.match(PromQLParser.GROUP_LEFT);
                }
                break;
            case PromQLParser.GROUP_RIGHT:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 326;
                this.match(PromQLParser.GROUP_RIGHT);
                }
                break;
            case PromQLParser.OFFSET:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 327;
                this.match(PromQLParser.OFFSET);
                }
                break;
            case PromQLParser.BOOL:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 328;
                this.match(PromQLParser.BOOL);
                }
                break;
            case PromQLParser.SUM:
            case PromQLParser.MIN:
            case PromQLParser.MAX:
            case PromQLParser.AVG:
            case PromQLParser.GROUP:
            case PromQLParser.STDDEV:
            case PromQLParser.STDVAR:
            case PromQLParser.COUNT:
            case PromQLParser.COUNT_VALUES:
            case PromQLParser.BOTTOMK:
            case PromQLParser.TOPK:
            case PromQLParser.QUANTILE:
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 329;
                this.aggregationOperators();
                }
                break;
            case PromQLParser.ABS:
            case PromQLParser.ABSENT:
            case PromQLParser.ABSENT_OVER_TIME:
            case PromQLParser.CEIL:
            case PromQLParser.CHANGES:
            case PromQLParser.CLAMP:
            case PromQLParser.CLAMP_MAX:
            case PromQLParser.CLAMP_MIN:
            case PromQLParser.DAY_OF_MONTH:
            case PromQLParser.DAY_OF_WEEK:
            case PromQLParser.DAY_OF_YEAR:
            case PromQLParser.DAYS_IN_MONTH:
            case PromQLParser.DELTA:
            case PromQLParser.DERIV:
            case PromQLParser.EXP:
            case PromQLParser.FLOOR:
            case PromQLParser.HISTOGRAM_COUNT:
            case PromQLParser.HISTOGRAM_SUM:
            case PromQLParser.HISTOGRAM_FRACTION:
            case PromQLParser.HISTOGRAM_QUANTILE:
            case PromQLParser.HOLT_WINTERS:
            case PromQLParser.HOUR:
            case PromQLParser.IDELTA:
            case PromQLParser.INCREASE:
            case PromQLParser.IRATE:
            case PromQLParser.LABEL_JOIN:
            case PromQLParser.LABEL_REPLACE:
            case PromQLParser.LN:
            case PromQLParser.LOG2:
            case PromQLParser.LOG10:
            case PromQLParser.MINUTE:
            case PromQLParser.MONTH:
            case PromQLParser.PREDICT_LINEAR:
            case PromQLParser.RATE:
            case PromQLParser.RESETS:
            case PromQLParser.ROUND:
            case PromQLParser.SCALAR:
            case PromQLParser.SGN:
            case PromQLParser.SORT:
            case PromQLParser.SORT_DESC:
            case PromQLParser.SQRT:
            case PromQLParser.TIME:
            case PromQLParser.TIMESTAMP:
            case PromQLParser.VECTOR:
            case PromQLParser.YEAR:
            case PromQLParser.AVG_OVER_TIME:
            case PromQLParser.MIN_OVER_TIME:
            case PromQLParser.MAX_OVER_TIME:
            case PromQLParser.SUM_OVER_TIME:
            case PromQLParser.COUNT_OVER_TIME:
            case PromQLParser.QUANTILE_OVER_TIME:
            case PromQLParser.STDDEV_OVER_TIME:
            case PromQLParser.STDVAR_OVER_TIME:
            case PromQLParser.LAST_OVER_TIME:
            case PromQLParser.PRESENT_OVER_TIME:
            case PromQLParser.ACOS:
            case PromQLParser.ACOSH:
            case PromQLParser.ASIN:
            case PromQLParser.ASINH:
            case PromQLParser.ATAN:
            case PromQLParser.ATANH:
            case PromQLParser.COS:
            case PromQLParser.COSH:
            case PromQLParser.SIN:
            case PromQLParser.SINH:
            case PromQLParser.TAN:
            case PromQLParser.TANH:
            case PromQLParser.DEG:
            case PromQLParser.PI:
            case PromQLParser.RAD:
                this.enterOuterAlt(localContext, 13);
                {
                this.state = 330;
                this.functionNames();
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
    public literal(): LiteralContext {
        let localContext = new LiteralContext(this.context, this.state);
        this.enterRule(localContext, 72, PromQLParser.RULE_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 333;
            _la = this.tokenStream.LA(1);
            if(!(_la === 1 || _la === 2)) {
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
        case 1:
            return this.vectorOperation_sempred(localContext as VectorOperationContext, predIndex);
        }
        return true;
    }
    private vectorOperation_sempred(localContext: VectorOperationContext | null, predIndex: number): boolean {
        switch (predIndex) {
        case 0:
            return this.precpred(this.context, 11);
        case 1:
            return this.precpred(this.context, 8);
        case 2:
            return this.precpred(this.context, 7);
        case 3:
            return this.precpred(this.context, 6);
        case 4:
            return this.precpred(this.context, 5);
        case 5:
            return this.precpred(this.context, 4);
        case 6:
            return this.precpred(this.context, 3);
        case 7:
            return this.precpred(this.context, 2);
        case 8:
            return this.precpred(this.context, 10);
        }
        return true;
    }

    public static readonly _serializedATN: number[] = [
        4,1,125,336,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,
        7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,
        13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,
        20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,
        26,2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,
        33,7,33,2,34,7,34,2,35,7,35,2,36,7,36,1,0,1,0,1,0,1,1,1,1,1,1,1,
        1,1,1,3,1,83,8,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,5,1,118,8,1,10,1,12,1,121,9,1,1,2,1,2,1,3,1,
        3,3,3,127,8,3,1,4,1,4,3,4,131,8,4,1,5,1,5,3,5,135,8,5,1,6,1,6,3,
        6,139,8,6,1,6,3,6,142,8,6,1,7,1,7,3,7,146,8,7,1,8,1,8,3,8,150,8,
        8,1,9,1,9,3,9,154,8,9,1,10,1,10,3,10,158,8,10,1,11,1,11,1,11,1,12,
        1,12,1,12,1,12,1,12,1,12,1,12,3,12,170,8,12,1,13,1,13,1,13,1,13,
        1,14,1,14,1,14,3,14,179,8,14,1,14,3,14,182,8,14,1,14,1,14,1,14,1,
        14,3,14,188,8,14,1,15,1,15,1,15,1,15,1,16,1,16,1,17,1,17,1,17,5,
        17,199,8,17,10,17,12,17,202,9,17,1,17,3,17,205,8,17,1,18,1,18,1,
        18,1,19,1,19,1,19,1,19,1,19,1,19,1,19,1,19,3,19,218,8,19,1,20,1,
        20,1,20,1,20,1,20,5,20,225,8,20,10,20,12,20,228,9,20,3,20,230,8,
        20,1,20,1,20,1,21,1,21,3,21,236,8,21,1,22,1,22,1,22,1,22,5,22,242,
        8,22,10,22,12,22,245,9,22,3,22,247,8,22,1,22,1,22,1,23,1,23,1,24,
        1,24,1,24,1,24,1,24,1,24,3,24,259,8,24,1,24,1,24,1,24,1,24,1,24,
        1,24,3,24,267,8,24,3,24,269,8,24,1,25,1,25,1,25,1,26,1,26,1,26,1,
        27,1,27,1,28,1,28,3,28,281,8,28,1,28,1,28,3,28,285,8,28,1,29,1,29,
        1,29,1,30,1,30,1,30,1,31,1,31,3,31,295,8,31,1,32,1,32,3,32,299,8,
        32,1,33,1,33,1,33,3,33,304,8,33,1,34,1,34,1,34,1,34,5,34,310,8,34,
        10,34,12,34,313,9,34,3,34,315,8,34,1,34,1,34,1,35,1,35,1,35,1,35,
        1,35,1,35,1,35,1,35,1,35,1,35,1,35,1,35,1,35,3,35,332,8,35,1,36,
        1,36,1,36,0,1,2,37,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,
        34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,0,9,
        1,0,3,4,1,0,5,7,1,0,13,18,2,0,9,9,11,11,2,0,11,11,23,23,3,0,12,12,
        14,14,19,20,1,0,41,110,1,0,29,40,1,0,1,2,359,0,74,1,0,0,0,2,82,1,
        0,0,0,4,122,1,0,0,0,6,124,1,0,0,0,8,128,1,0,0,0,10,132,1,0,0,0,12,
        136,1,0,0,0,14,143,1,0,0,0,16,147,1,0,0,0,18,151,1,0,0,0,20,155,
        1,0,0,0,22,159,1,0,0,0,24,169,1,0,0,0,26,171,1,0,0,0,28,187,1,0,
        0,0,30,189,1,0,0,0,32,193,1,0,0,0,34,195,1,0,0,0,36,206,1,0,0,0,
        38,217,1,0,0,0,40,219,1,0,0,0,42,235,1,0,0,0,44,237,1,0,0,0,46,250,
        1,0,0,0,48,268,1,0,0,0,50,270,1,0,0,0,52,273,1,0,0,0,54,276,1,0,
        0,0,56,280,1,0,0,0,58,286,1,0,0,0,60,289,1,0,0,0,62,292,1,0,0,0,
        64,296,1,0,0,0,66,303,1,0,0,0,68,305,1,0,0,0,70,331,1,0,0,0,72,333,
        1,0,0,0,74,75,3,2,1,0,75,76,5,0,0,1,76,1,1,0,0,0,77,78,6,1,-1,0,
        78,79,3,4,2,0,79,80,3,2,1,9,80,83,1,0,0,0,81,83,3,24,12,0,82,77,
        1,0,0,0,82,81,1,0,0,0,83,119,1,0,0,0,84,85,10,11,0,0,85,86,3,6,3,
        0,86,87,3,2,1,11,87,118,1,0,0,0,88,89,10,8,0,0,89,90,3,8,4,0,90,
        91,3,2,1,9,91,118,1,0,0,0,92,93,10,7,0,0,93,94,3,10,5,0,94,95,3,
        2,1,8,95,118,1,0,0,0,96,97,10,6,0,0,97,98,3,12,6,0,98,99,3,2,1,7,
        99,118,1,0,0,0,100,101,10,5,0,0,101,102,3,14,7,0,102,103,3,2,1,6,
        103,118,1,0,0,0,104,105,10,4,0,0,105,106,3,16,8,0,106,107,3,2,1,
        5,107,118,1,0,0,0,108,109,10,3,0,0,109,110,3,18,9,0,110,111,3,2,
        1,4,111,118,1,0,0,0,112,113,10,2,0,0,113,114,5,118,0,0,114,118,3,
        2,1,3,115,116,10,10,0,0,116,118,3,20,10,0,117,84,1,0,0,0,117,88,
        1,0,0,0,117,92,1,0,0,0,117,96,1,0,0,0,117,100,1,0,0,0,117,104,1,
        0,0,0,117,108,1,0,0,0,117,112,1,0,0,0,117,115,1,0,0,0,118,121,1,
        0,0,0,119,117,1,0,0,0,119,120,1,0,0,0,120,3,1,0,0,0,121,119,1,0,
        0,0,122,123,7,0,0,0,123,5,1,0,0,0,124,126,5,8,0,0,125,127,3,56,28,
        0,126,125,1,0,0,0,126,127,1,0,0,0,127,7,1,0,0,0,128,130,7,1,0,0,
        129,131,3,56,28,0,130,129,1,0,0,0,130,131,1,0,0,0,131,9,1,0,0,0,
        132,134,7,0,0,0,133,135,3,56,28,0,134,133,1,0,0,0,134,135,1,0,0,
        0,135,11,1,0,0,0,136,138,7,2,0,0,137,139,5,28,0,0,138,137,1,0,0,
        0,138,139,1,0,0,0,139,141,1,0,0,0,140,142,3,56,28,0,141,140,1,0,
        0,0,141,142,1,0,0,0,142,13,1,0,0,0,143,145,7,3,0,0,144,146,3,56,
        28,0,145,144,1,0,0,0,145,146,1,0,0,0,146,15,1,0,0,0,147,149,5,10,
        0,0,148,150,3,56,28,0,149,148,1,0,0,0,149,150,1,0,0,0,150,17,1,0,
        0,0,151,153,7,4,0,0,152,154,3,56,28,0,153,152,1,0,0,0,153,154,1,
        0,0,0,154,19,1,0,0,0,155,157,5,119,0,0,156,158,3,22,11,0,157,156,
        1,0,0,0,157,158,1,0,0,0,158,21,1,0,0,0,159,160,5,27,0,0,160,161,
        5,121,0,0,161,23,1,0,0,0,162,170,3,40,20,0,163,170,3,48,24,0,164,
        170,3,28,14,0,165,170,3,36,18,0,166,170,3,38,19,0,167,170,3,72,36,
        0,168,170,3,26,13,0,169,162,1,0,0,0,169,163,1,0,0,0,169,164,1,0,
        0,0,169,165,1,0,0,0,169,166,1,0,0,0,169,167,1,0,0,0,169,168,1,0,
        0,0,170,25,1,0,0,0,171,172,5,113,0,0,172,173,3,2,1,0,173,174,5,114,
        0,0,174,27,1,0,0,0,175,181,5,122,0,0,176,178,5,111,0,0,177,179,3,
        34,17,0,178,177,1,0,0,0,178,179,1,0,0,0,179,180,1,0,0,0,180,182,
        5,112,0,0,181,176,1,0,0,0,181,182,1,0,0,0,182,188,1,0,0,0,183,184,
        5,111,0,0,184,185,3,34,17,0,185,186,5,112,0,0,186,188,1,0,0,0,187,
        175,1,0,0,0,187,183,1,0,0,0,188,29,1,0,0,0,189,190,3,66,33,0,190,
        191,3,32,16,0,191,192,5,2,0,0,192,31,1,0,0,0,193,194,7,5,0,0,194,
        33,1,0,0,0,195,200,3,30,15,0,196,197,5,117,0,0,197,199,3,30,15,0,
        198,196,1,0,0,0,199,202,1,0,0,0,200,198,1,0,0,0,200,201,1,0,0,0,
        201,204,1,0,0,0,202,200,1,0,0,0,203,205,5,117,0,0,204,203,1,0,0,
        0,204,205,1,0,0,0,205,35,1,0,0,0,206,207,3,28,14,0,207,208,5,120,
        0,0,208,37,1,0,0,0,209,210,3,28,14,0,210,211,5,27,0,0,211,212,5,
        121,0,0,212,218,1,0,0,0,213,214,3,36,18,0,214,215,5,27,0,0,215,216,
        5,121,0,0,216,218,1,0,0,0,217,209,1,0,0,0,217,213,1,0,0,0,218,39,
        1,0,0,0,219,220,3,46,23,0,220,229,5,113,0,0,221,226,3,42,21,0,222,
        223,5,117,0,0,223,225,3,42,21,0,224,222,1,0,0,0,225,228,1,0,0,0,
        226,224,1,0,0,0,226,227,1,0,0,0,227,230,1,0,0,0,228,226,1,0,0,0,
        229,221,1,0,0,0,229,230,1,0,0,0,230,231,1,0,0,0,231,232,5,114,0,
        0,232,41,1,0,0,0,233,236,3,72,36,0,234,236,3,2,1,0,235,233,1,0,0,
        0,235,234,1,0,0,0,236,43,1,0,0,0,237,246,5,113,0,0,238,243,3,42,
        21,0,239,240,5,117,0,0,240,242,3,42,21,0,241,239,1,0,0,0,242,245,
        1,0,0,0,243,241,1,0,0,0,243,244,1,0,0,0,244,247,1,0,0,0,245,243,
        1,0,0,0,246,238,1,0,0,0,246,247,1,0,0,0,247,248,1,0,0,0,248,249,
        5,114,0,0,249,45,1,0,0,0,250,251,7,6,0,0,251,47,1,0,0,0,252,253,
        3,54,27,0,253,254,3,44,22,0,254,269,1,0,0,0,255,258,3,54,27,0,256,
        259,3,50,25,0,257,259,3,52,26,0,258,256,1,0,0,0,258,257,1,0,0,0,
        259,260,1,0,0,0,260,261,3,44,22,0,261,269,1,0,0,0,262,263,3,54,27,
        0,263,266,3,44,22,0,264,267,3,50,25,0,265,267,3,52,26,0,266,264,
        1,0,0,0,266,265,1,0,0,0,267,269,1,0,0,0,268,252,1,0,0,0,268,255,
        1,0,0,0,268,262,1,0,0,0,269,49,1,0,0,0,270,271,5,21,0,0,271,272,
        3,68,34,0,272,51,1,0,0,0,273,274,5,22,0,0,274,275,3,68,34,0,275,
        53,1,0,0,0,276,277,7,7,0,0,277,55,1,0,0,0,278,281,3,58,29,0,279,
        281,3,60,30,0,280,278,1,0,0,0,280,279,1,0,0,0,281,284,1,0,0,0,282,
        285,3,62,31,0,283,285,3,64,32,0,284,282,1,0,0,0,284,283,1,0,0,0,
        284,285,1,0,0,0,285,57,1,0,0,0,286,287,5,23,0,0,287,288,3,68,34,
        0,288,59,1,0,0,0,289,290,5,24,0,0,290,291,3,68,34,0,291,61,1,0,0,
        0,292,294,5,25,0,0,293,295,3,68,34,0,294,293,1,0,0,0,294,295,1,0,
        0,0,295,63,1,0,0,0,296,298,5,26,0,0,297,299,3,68,34,0,298,297,1,
        0,0,0,298,299,1,0,0,0,299,65,1,0,0,0,300,304,3,70,35,0,301,304,5,
        122,0,0,302,304,5,123,0,0,303,300,1,0,0,0,303,301,1,0,0,0,303,302,
        1,0,0,0,304,67,1,0,0,0,305,314,5,113,0,0,306,311,3,66,33,0,307,308,
        5,117,0,0,308,310,3,66,33,0,309,307,1,0,0,0,310,313,1,0,0,0,311,
        309,1,0,0,0,311,312,1,0,0,0,312,315,1,0,0,0,313,311,1,0,0,0,314,
        306,1,0,0,0,314,315,1,0,0,0,315,316,1,0,0,0,316,317,5,114,0,0,317,
        69,1,0,0,0,318,332,5,9,0,0,319,332,5,10,0,0,320,332,5,11,0,0,321,
        332,5,21,0,0,322,332,5,22,0,0,323,332,5,23,0,0,324,332,5,24,0,0,
        325,332,5,25,0,0,326,332,5,26,0,0,327,332,5,27,0,0,328,332,5,28,
        0,0,329,332,3,54,27,0,330,332,3,46,23,0,331,318,1,0,0,0,331,319,
        1,0,0,0,331,320,1,0,0,0,331,321,1,0,0,0,331,322,1,0,0,0,331,323,
        1,0,0,0,331,324,1,0,0,0,331,325,1,0,0,0,331,326,1,0,0,0,331,327,
        1,0,0,0,331,328,1,0,0,0,331,329,1,0,0,0,331,330,1,0,0,0,332,71,1,
        0,0,0,333,334,7,8,0,0,334,73,1,0,0,0,35,82,117,119,126,130,134,138,
        141,145,149,153,157,169,178,181,187,200,204,217,226,229,235,243,
        246,258,266,268,280,284,294,298,303,311,314,331
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!PromQLParser.__ATN) {
            PromQLParser.__ATN = new antlr.ATNDeserializer().deserialize(PromQLParser._serializedATN);
        }

        return PromQLParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(PromQLParser.literalNames, PromQLParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return PromQLParser.vocabulary;
    }

    private static readonly decisionsToDFA = PromQLParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class ExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public vectorOperation(): VectorOperationContext {
        return this.getRuleContext(0, VectorOperationContext)!;
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(PromQLParser.EOF, 0)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_expression;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitExpression) {
            return visitor.visitExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class VectorOperationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public unaryOp(): UnaryOpContext | null {
        return this.getRuleContext(0, UnaryOpContext);
    }
    public vectorOperation(): VectorOperationContext[];
    public vectorOperation(i: number): VectorOperationContext | null;
    public vectorOperation(i?: number): VectorOperationContext[] | VectorOperationContext | null {
        if (i === undefined) {
            return this.getRuleContexts(VectorOperationContext);
        }

        return this.getRuleContext(i, VectorOperationContext);
    }
    public vector(): VectorContext | null {
        return this.getRuleContext(0, VectorContext);
    }
    public powOp(): PowOpContext | null {
        return this.getRuleContext(0, PowOpContext);
    }
    public multOp(): MultOpContext | null {
        return this.getRuleContext(0, MultOpContext);
    }
    public addOp(): AddOpContext | null {
        return this.getRuleContext(0, AddOpContext);
    }
    public compareOp(): CompareOpContext | null {
        return this.getRuleContext(0, CompareOpContext);
    }
    public andUnlessOp(): AndUnlessOpContext | null {
        return this.getRuleContext(0, AndUnlessOpContext);
    }
    public orOp(): OrOpContext | null {
        return this.getRuleContext(0, OrOpContext);
    }
    public vectorMatchOp(): VectorMatchOpContext | null {
        return this.getRuleContext(0, VectorMatchOpContext);
    }
    public AT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.AT, 0);
    }
    public subqueryOp(): SubqueryOpContext | null {
        return this.getRuleContext(0, SubqueryOpContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_vectorOperation;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitVectorOperation) {
            return visitor.visitVectorOperation(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class UnaryOpContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ADD(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ADD, 0);
    }
    public SUB(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.SUB, 0);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_unaryOp;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitUnaryOp) {
            return visitor.visitUnaryOp(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PowOpContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public POW(): antlr.TerminalNode {
        return this.getToken(PromQLParser.POW, 0)!;
    }
    public grouping(): GroupingContext | null {
        return this.getRuleContext(0, GroupingContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_powOp;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitPowOp) {
            return visitor.visitPowOp(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class MultOpContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public MULT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.MULT, 0);
    }
    public DIV(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.DIV, 0);
    }
    public MOD(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.MOD, 0);
    }
    public grouping(): GroupingContext | null {
        return this.getRuleContext(0, GroupingContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_multOp;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitMultOp) {
            return visitor.visitMultOp(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AddOpContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ADD(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ADD, 0);
    }
    public SUB(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.SUB, 0);
    }
    public grouping(): GroupingContext | null {
        return this.getRuleContext(0, GroupingContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_addOp;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitAddOp) {
            return visitor.visitAddOp(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class CompareOpContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DEQ(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.DEQ, 0);
    }
    public NE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.NE, 0);
    }
    public GT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.GT, 0);
    }
    public LT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LT, 0);
    }
    public GE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.GE, 0);
    }
    public LE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LE, 0);
    }
    public BOOL(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.BOOL, 0);
    }
    public grouping(): GroupingContext | null {
        return this.getRuleContext(0, GroupingContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_compareOp;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitCompareOp) {
            return visitor.visitCompareOp(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AndUnlessOpContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public AND(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.AND, 0);
    }
    public UNLESS(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.UNLESS, 0);
    }
    public grouping(): GroupingContext | null {
        return this.getRuleContext(0, GroupingContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_andUnlessOp;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitAndUnlessOp) {
            return visitor.visitAndUnlessOp(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class OrOpContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public OR(): antlr.TerminalNode {
        return this.getToken(PromQLParser.OR, 0)!;
    }
    public grouping(): GroupingContext | null {
        return this.getRuleContext(0, GroupingContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_orOp;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitOrOp) {
            return visitor.visitOrOp(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class VectorMatchOpContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ON(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ON, 0);
    }
    public UNLESS(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.UNLESS, 0);
    }
    public grouping(): GroupingContext | null {
        return this.getRuleContext(0, GroupingContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_vectorMatchOp;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitVectorMatchOp) {
            return visitor.visitVectorMatchOp(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SubqueryOpContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SUBQUERY_RANGE(): antlr.TerminalNode {
        return this.getToken(PromQLParser.SUBQUERY_RANGE, 0)!;
    }
    public offsetOp(): OffsetOpContext | null {
        return this.getRuleContext(0, OffsetOpContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_subqueryOp;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitSubqueryOp) {
            return visitor.visitSubqueryOp(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class OffsetOpContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public OFFSET(): antlr.TerminalNode {
        return this.getToken(PromQLParser.OFFSET, 0)!;
    }
    public DURATION(): antlr.TerminalNode {
        return this.getToken(PromQLParser.DURATION, 0)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_offsetOp;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitOffsetOp) {
            return visitor.visitOffsetOp(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class VectorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public function(): FunctionContext | null {
        return this.getRuleContext(0, FunctionContext);
    }
    public aggregation(): AggregationContext | null {
        return this.getRuleContext(0, AggregationContext);
    }
    public instantSelector(): InstantSelectorContext | null {
        return this.getRuleContext(0, InstantSelectorContext);
    }
    public matrixSelector(): MatrixSelectorContext | null {
        return this.getRuleContext(0, MatrixSelectorContext);
    }
    public offset(): OffsetContext | null {
        return this.getRuleContext(0, OffsetContext);
    }
    public literal(): LiteralContext | null {
        return this.getRuleContext(0, LiteralContext);
    }
    public parens(): ParensContext | null {
        return this.getRuleContext(0, ParensContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_vector;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitVector) {
            return visitor.visitVector(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ParensContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LEFT_PAREN(): antlr.TerminalNode {
        return this.getToken(PromQLParser.LEFT_PAREN, 0)!;
    }
    public vectorOperation(): VectorOperationContext {
        return this.getRuleContext(0, VectorOperationContext)!;
    }
    public RIGHT_PAREN(): antlr.TerminalNode {
        return this.getToken(PromQLParser.RIGHT_PAREN, 0)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_parens;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitParens) {
            return visitor.visitParens(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class InstantSelectorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public METRIC_NAME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.METRIC_NAME, 0);
    }
    public LEFT_BRACE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LEFT_BRACE, 0);
    }
    public RIGHT_BRACE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.RIGHT_BRACE, 0);
    }
    public labelMatcherList(): LabelMatcherListContext | null {
        return this.getRuleContext(0, LabelMatcherListContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_instantSelector;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitInstantSelector) {
            return visitor.visitInstantSelector(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LabelMatcherContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public labelName(): LabelNameContext {
        return this.getRuleContext(0, LabelNameContext)!;
    }
    public labelMatcherOperator(): LabelMatcherOperatorContext {
        return this.getRuleContext(0, LabelMatcherOperatorContext)!;
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(PromQLParser.STRING, 0)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_labelMatcher;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitLabelMatcher) {
            return visitor.visitLabelMatcher(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LabelMatcherOperatorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQ(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.EQ, 0);
    }
    public NE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.NE, 0);
    }
    public RE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.RE, 0);
    }
    public NRE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.NRE, 0);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_labelMatcherOperator;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitLabelMatcherOperator) {
            return visitor.visitLabelMatcherOperator(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LabelMatcherListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public labelMatcher(): LabelMatcherContext[];
    public labelMatcher(i: number): LabelMatcherContext | null;
    public labelMatcher(i?: number): LabelMatcherContext[] | LabelMatcherContext | null {
        if (i === undefined) {
            return this.getRuleContexts(LabelMatcherContext);
        }

        return this.getRuleContext(i, LabelMatcherContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PromQLParser.COMMA);
    	} else {
    		return this.getToken(PromQLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_labelMatcherList;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitLabelMatcherList) {
            return visitor.visitLabelMatcherList(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class MatrixSelectorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public instantSelector(): InstantSelectorContext {
        return this.getRuleContext(0, InstantSelectorContext)!;
    }
    public TIME_RANGE(): antlr.TerminalNode {
        return this.getToken(PromQLParser.TIME_RANGE, 0)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_matrixSelector;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitMatrixSelector) {
            return visitor.visitMatrixSelector(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class OffsetContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public instantSelector(): InstantSelectorContext | null {
        return this.getRuleContext(0, InstantSelectorContext);
    }
    public OFFSET(): antlr.TerminalNode {
        return this.getToken(PromQLParser.OFFSET, 0)!;
    }
    public DURATION(): antlr.TerminalNode {
        return this.getToken(PromQLParser.DURATION, 0)!;
    }
    public matrixSelector(): MatrixSelectorContext | null {
        return this.getRuleContext(0, MatrixSelectorContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_offset;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitOffset) {
            return visitor.visitOffset(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public functionNames(): FunctionNamesContext {
        return this.getRuleContext(0, FunctionNamesContext)!;
    }
    public LEFT_PAREN(): antlr.TerminalNode {
        return this.getToken(PromQLParser.LEFT_PAREN, 0)!;
    }
    public RIGHT_PAREN(): antlr.TerminalNode {
        return this.getToken(PromQLParser.RIGHT_PAREN, 0)!;
    }
    public parameter(): ParameterContext[];
    public parameter(i: number): ParameterContext | null;
    public parameter(i?: number): ParameterContext[] | ParameterContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ParameterContext);
        }

        return this.getRuleContext(i, ParameterContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PromQLParser.COMMA);
    	} else {
    		return this.getToken(PromQLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_function;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitFunction) {
            return visitor.visitFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ParameterContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public literal(): LiteralContext | null {
        return this.getRuleContext(0, LiteralContext);
    }
    public vectorOperation(): VectorOperationContext | null {
        return this.getRuleContext(0, VectorOperationContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_parameter;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitParameter) {
            return visitor.visitParameter(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ParameterListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LEFT_PAREN(): antlr.TerminalNode {
        return this.getToken(PromQLParser.LEFT_PAREN, 0)!;
    }
    public RIGHT_PAREN(): antlr.TerminalNode {
        return this.getToken(PromQLParser.RIGHT_PAREN, 0)!;
    }
    public parameter(): ParameterContext[];
    public parameter(i: number): ParameterContext | null;
    public parameter(i?: number): ParameterContext[] | ParameterContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ParameterContext);
        }

        return this.getRuleContext(i, ParameterContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PromQLParser.COMMA);
    	} else {
    		return this.getToken(PromQLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_parameterList;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitParameterList) {
            return visitor.visitParameterList(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FunctionNamesContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ABS(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ABS, 0);
    }
    public ABSENT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ABSENT, 0);
    }
    public ABSENT_OVER_TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ABSENT_OVER_TIME, 0);
    }
    public CEIL(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.CEIL, 0);
    }
    public CHANGES(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.CHANGES, 0);
    }
    public CLAMP(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.CLAMP, 0);
    }
    public CLAMP_MAX(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.CLAMP_MAX, 0);
    }
    public CLAMP_MIN(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.CLAMP_MIN, 0);
    }
    public DAY_OF_MONTH(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.DAY_OF_MONTH, 0);
    }
    public DAY_OF_WEEK(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.DAY_OF_WEEK, 0);
    }
    public DAY_OF_YEAR(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.DAY_OF_YEAR, 0);
    }
    public DAYS_IN_MONTH(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.DAYS_IN_MONTH, 0);
    }
    public DELTA(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.DELTA, 0);
    }
    public DERIV(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.DERIV, 0);
    }
    public EXP(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.EXP, 0);
    }
    public FLOOR(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.FLOOR, 0);
    }
    public HISTOGRAM_COUNT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.HISTOGRAM_COUNT, 0);
    }
    public HISTOGRAM_SUM(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.HISTOGRAM_SUM, 0);
    }
    public HISTOGRAM_FRACTION(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.HISTOGRAM_FRACTION, 0);
    }
    public HISTOGRAM_QUANTILE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.HISTOGRAM_QUANTILE, 0);
    }
    public HOLT_WINTERS(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.HOLT_WINTERS, 0);
    }
    public HOUR(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.HOUR, 0);
    }
    public IDELTA(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.IDELTA, 0);
    }
    public INCREASE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.INCREASE, 0);
    }
    public IRATE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.IRATE, 0);
    }
    public LABEL_JOIN(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LABEL_JOIN, 0);
    }
    public LABEL_REPLACE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LABEL_REPLACE, 0);
    }
    public LN(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LN, 0);
    }
    public LOG2(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LOG2, 0);
    }
    public LOG10(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LOG10, 0);
    }
    public MINUTE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.MINUTE, 0);
    }
    public MONTH(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.MONTH, 0);
    }
    public PREDICT_LINEAR(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.PREDICT_LINEAR, 0);
    }
    public RATE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.RATE, 0);
    }
    public RESETS(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.RESETS, 0);
    }
    public ROUND(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ROUND, 0);
    }
    public SCALAR(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.SCALAR, 0);
    }
    public SGN(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.SGN, 0);
    }
    public SORT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.SORT, 0);
    }
    public SORT_DESC(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.SORT_DESC, 0);
    }
    public SQRT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.SQRT, 0);
    }
    public TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.TIME, 0);
    }
    public TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.TIMESTAMP, 0);
    }
    public VECTOR(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.VECTOR, 0);
    }
    public YEAR(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.YEAR, 0);
    }
    public AVG_OVER_TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.AVG_OVER_TIME, 0);
    }
    public MIN_OVER_TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.MIN_OVER_TIME, 0);
    }
    public MAX_OVER_TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.MAX_OVER_TIME, 0);
    }
    public SUM_OVER_TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.SUM_OVER_TIME, 0);
    }
    public COUNT_OVER_TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.COUNT_OVER_TIME, 0);
    }
    public QUANTILE_OVER_TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.QUANTILE_OVER_TIME, 0);
    }
    public STDDEV_OVER_TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.STDDEV_OVER_TIME, 0);
    }
    public STDVAR_OVER_TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.STDVAR_OVER_TIME, 0);
    }
    public LAST_OVER_TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LAST_OVER_TIME, 0);
    }
    public PRESENT_OVER_TIME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.PRESENT_OVER_TIME, 0);
    }
    public ACOS(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ACOS, 0);
    }
    public ACOSH(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ACOSH, 0);
    }
    public ASIN(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ASIN, 0);
    }
    public ASINH(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ASINH, 0);
    }
    public ATAN(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ATAN, 0);
    }
    public ATANH(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ATANH, 0);
    }
    public COS(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.COS, 0);
    }
    public COSH(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.COSH, 0);
    }
    public SIN(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.SIN, 0);
    }
    public SINH(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.SINH, 0);
    }
    public TAN(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.TAN, 0);
    }
    public TANH(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.TANH, 0);
    }
    public DEG(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.DEG, 0);
    }
    public PI(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.PI, 0);
    }
    public RAD(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.RAD, 0);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_functionNames;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitFunctionNames) {
            return visitor.visitFunctionNames(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AggregationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public aggregationOperators(): AggregationOperatorsContext {
        return this.getRuleContext(0, AggregationOperatorsContext)!;
    }
    public parameterList(): ParameterListContext {
        return this.getRuleContext(0, ParameterListContext)!;
    }
    public by(): ByContext | null {
        return this.getRuleContext(0, ByContext);
    }
    public without(): WithoutContext | null {
        return this.getRuleContext(0, WithoutContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_aggregation;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitAggregation) {
            return visitor.visitAggregation(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ByContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BY(): antlr.TerminalNode {
        return this.getToken(PromQLParser.BY, 0)!;
    }
    public labelNameList(): LabelNameListContext {
        return this.getRuleContext(0, LabelNameListContext)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_by;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitBy) {
            return visitor.visitBy(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class WithoutContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public WITHOUT(): antlr.TerminalNode {
        return this.getToken(PromQLParser.WITHOUT, 0)!;
    }
    public labelNameList(): LabelNameListContext {
        return this.getRuleContext(0, LabelNameListContext)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_without;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitWithout) {
            return visitor.visitWithout(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AggregationOperatorsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SUM(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.SUM, 0);
    }
    public MIN(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.MIN, 0);
    }
    public MAX(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.MAX, 0);
    }
    public AVG(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.AVG, 0);
    }
    public GROUP(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.GROUP, 0);
    }
    public STDDEV(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.STDDEV, 0);
    }
    public STDVAR(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.STDVAR, 0);
    }
    public COUNT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.COUNT, 0);
    }
    public COUNT_VALUES(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.COUNT_VALUES, 0);
    }
    public BOTTOMK(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.BOTTOMK, 0);
    }
    public TOPK(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.TOPK, 0);
    }
    public QUANTILE(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.QUANTILE, 0);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_aggregationOperators;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitAggregationOperators) {
            return visitor.visitAggregationOperators(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GroupingContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public on_(): On_Context | null {
        return this.getRuleContext(0, On_Context);
    }
    public ignoring(): IgnoringContext | null {
        return this.getRuleContext(0, IgnoringContext);
    }
    public groupLeft(): GroupLeftContext | null {
        return this.getRuleContext(0, GroupLeftContext);
    }
    public groupRight(): GroupRightContext | null {
        return this.getRuleContext(0, GroupRightContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_grouping;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitGrouping) {
            return visitor.visitGrouping(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class On_Context extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ON(): antlr.TerminalNode {
        return this.getToken(PromQLParser.ON, 0)!;
    }
    public labelNameList(): LabelNameListContext {
        return this.getRuleContext(0, LabelNameListContext)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_on_;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitOn_) {
            return visitor.visitOn_(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class IgnoringContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IGNORING(): antlr.TerminalNode {
        return this.getToken(PromQLParser.IGNORING, 0)!;
    }
    public labelNameList(): LabelNameListContext {
        return this.getRuleContext(0, LabelNameListContext)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_ignoring;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitIgnoring) {
            return visitor.visitIgnoring(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GroupLeftContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public GROUP_LEFT(): antlr.TerminalNode {
        return this.getToken(PromQLParser.GROUP_LEFT, 0)!;
    }
    public labelNameList(): LabelNameListContext | null {
        return this.getRuleContext(0, LabelNameListContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_groupLeft;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitGroupLeft) {
            return visitor.visitGroupLeft(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GroupRightContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public GROUP_RIGHT(): antlr.TerminalNode {
        return this.getToken(PromQLParser.GROUP_RIGHT, 0)!;
    }
    public labelNameList(): LabelNameListContext | null {
        return this.getRuleContext(0, LabelNameListContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_groupRight;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitGroupRight) {
            return visitor.visitGroupRight(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LabelNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public keyword(): KeywordContext | null {
        return this.getRuleContext(0, KeywordContext);
    }
    public METRIC_NAME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.METRIC_NAME, 0);
    }
    public LABEL_NAME(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LABEL_NAME, 0);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_labelName;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitLabelName) {
            return visitor.visitLabelName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LabelNameListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LEFT_PAREN(): antlr.TerminalNode {
        return this.getToken(PromQLParser.LEFT_PAREN, 0)!;
    }
    public RIGHT_PAREN(): antlr.TerminalNode {
        return this.getToken(PromQLParser.RIGHT_PAREN, 0)!;
    }
    public labelName(): LabelNameContext[];
    public labelName(i: number): LabelNameContext | null;
    public labelName(i?: number): LabelNameContext[] | LabelNameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(LabelNameContext);
        }

        return this.getRuleContext(i, LabelNameContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PromQLParser.COMMA);
    	} else {
    		return this.getToken(PromQLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_labelNameList;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitLabelNameList) {
            return visitor.visitLabelNameList(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class KeywordContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public AND(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.AND, 0);
    }
    public OR(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.OR, 0);
    }
    public UNLESS(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.UNLESS, 0);
    }
    public BY(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.BY, 0);
    }
    public WITHOUT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.WITHOUT, 0);
    }
    public ON(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.ON, 0);
    }
    public IGNORING(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.IGNORING, 0);
    }
    public GROUP_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.GROUP_LEFT, 0);
    }
    public GROUP_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.GROUP_RIGHT, 0);
    }
    public OFFSET(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.OFFSET, 0);
    }
    public BOOL(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.BOOL, 0);
    }
    public aggregationOperators(): AggregationOperatorsContext | null {
        return this.getRuleContext(0, AggregationOperatorsContext);
    }
    public functionNames(): FunctionNamesContext | null {
        return this.getRuleContext(0, FunctionNamesContext);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_keyword;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitKeyword) {
            return visitor.visitKeyword(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.NUMBER, 0);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.STRING, 0);
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_literal;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitLiteral) {
            return visitor.visitLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
