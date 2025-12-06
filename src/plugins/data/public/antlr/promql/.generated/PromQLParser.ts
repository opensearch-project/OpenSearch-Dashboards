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
    public static readonly LIMITK = 41;
    public static readonly LIMIT_RATIO = 42;
    public static readonly ABS = 43;
    public static readonly ABSENT = 44;
    public static readonly ABSENT_OVER_TIME = 45;
    public static readonly CEIL = 46;
    public static readonly CHANGES = 47;
    public static readonly CLAMP = 48;
    public static readonly CLAMP_MAX = 49;
    public static readonly CLAMP_MIN = 50;
    public static readonly DAY_OF_MONTH = 51;
    public static readonly DAY_OF_WEEK = 52;
    public static readonly DAY_OF_YEAR = 53;
    public static readonly DAYS_IN_MONTH = 54;
    public static readonly DELTA = 55;
    public static readonly DERIV = 56;
    public static readonly EXP = 57;
    public static readonly FLOOR = 58;
    public static readonly HISTOGRAM_COUNT = 59;
    public static readonly HISTOGRAM_SUM = 60;
    public static readonly HISTOGRAM_FRACTION = 61;
    public static readonly HISTOGRAM_QUANTILE = 62;
    public static readonly HOLT_WINTERS = 63;
    public static readonly HOUR = 64;
    public static readonly IDELTA = 65;
    public static readonly INCREASE = 66;
    public static readonly IRATE = 67;
    public static readonly LABEL_JOIN = 68;
    public static readonly LABEL_REPLACE = 69;
    public static readonly LN = 70;
    public static readonly LOG2 = 71;
    public static readonly LOG10 = 72;
    public static readonly MINUTE = 73;
    public static readonly MONTH = 74;
    public static readonly PREDICT_LINEAR = 75;
    public static readonly RATE = 76;
    public static readonly RESETS = 77;
    public static readonly ROUND = 78;
    public static readonly SCALAR = 79;
    public static readonly SGN = 80;
    public static readonly SORT = 81;
    public static readonly SORT_DESC = 82;
    public static readonly SQRT = 83;
    public static readonly TIME = 84;
    public static readonly TIMESTAMP = 85;
    public static readonly VECTOR = 86;
    public static readonly YEAR = 87;
    public static readonly AVG_OVER_TIME = 88;
    public static readonly MIN_OVER_TIME = 89;
    public static readonly MAX_OVER_TIME = 90;
    public static readonly SUM_OVER_TIME = 91;
    public static readonly COUNT_OVER_TIME = 92;
    public static readonly QUANTILE_OVER_TIME = 93;
    public static readonly STDDEV_OVER_TIME = 94;
    public static readonly STDVAR_OVER_TIME = 95;
    public static readonly LAST_OVER_TIME = 96;
    public static readonly PRESENT_OVER_TIME = 97;
    public static readonly ACOS = 98;
    public static readonly ACOSH = 99;
    public static readonly ASIN = 100;
    public static readonly ASINH = 101;
    public static readonly ATAN = 102;
    public static readonly ATANH = 103;
    public static readonly COS = 104;
    public static readonly COSH = 105;
    public static readonly SIN = 106;
    public static readonly SINH = 107;
    public static readonly TAN = 108;
    public static readonly TANH = 109;
    public static readonly DEG = 110;
    public static readonly PI = 111;
    public static readonly RAD = 112;
    public static readonly LEFT_BRACE = 113;
    public static readonly RIGHT_BRACE = 114;
    public static readonly LEFT_PAREN = 115;
    public static readonly RIGHT_PAREN = 116;
    public static readonly LEFT_BRACKET = 117;
    public static readonly RIGHT_BRACKET = 118;
    public static readonly COMMA = 119;
    public static readonly COLON = 120;
    public static readonly AT = 121;
    public static readonly DURATION = 122;
    public static readonly METRIC_NAME = 123;
    public static readonly LABEL_NAME = 124;
    public static readonly WS = 125;
    public static readonly SL_COMMENT = 126;
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
    public static readonly RULE_metricName = 14;
    public static readonly RULE_instantSelector = 15;
    public static readonly RULE_labelMatcher = 16;
    public static readonly RULE_labelValue = 17;
    public static readonly RULE_labelMatcherOperator = 18;
    public static readonly RULE_labelMatcherList = 19;
    public static readonly RULE_matrixSelector = 20;
    public static readonly RULE_timeRange = 21;
    public static readonly RULE_subqueryRange = 22;
    public static readonly RULE_duration = 23;
    public static readonly RULE_offset = 24;
    public static readonly RULE_function = 25;
    public static readonly RULE_parameter = 26;
    public static readonly RULE_parameterList = 27;
    public static readonly RULE_functionNames = 28;
    public static readonly RULE_aggregation = 29;
    public static readonly RULE_by = 30;
    public static readonly RULE_without = 31;
    public static readonly RULE_aggregationOperators = 32;
    public static readonly RULE_grouping = 33;
    public static readonly RULE_on_ = 34;
    public static readonly RULE_ignoring = 35;
    public static readonly RULE_groupLeft = 36;
    public static readonly RULE_groupRight = 37;
    public static readonly RULE_labelName = 38;
    public static readonly RULE_labelNameList = 39;
    public static readonly RULE_keyword = 40;
    public static readonly RULE_literal = 41;

    public static readonly literalNames = [
        null, null, null, "'+'", "'-'", "'*'", "'/'", "'%'", "'^'", "'and'", 
        "'or'", "'unless'", "'='", "'=='", "'!='", "'>'", "'<'", "'>='", 
        "'<='", "'=~'", "'!~'", "'by'", "'without'", "'on'", "'ignoring'", 
        "'group_left'", "'group_right'", "'offset'", "'bool'", "'sum'", 
        "'min'", "'max'", "'avg'", "'group'", "'stddev'", "'stdvar'", "'count'", 
        "'count_values'", "'bottomk'", "'topk'", "'quantile'", "'limitk'", 
        "'limit_ratio'", "'abs'", "'absent'", "'absent_over_time'", "'ceil'", 
        "'changes'", "'clamp'", "'clamp_max'", "'clamp_min'", "'day_of_month'", 
        "'day_of_week'", "'day_of_year'", "'days_in_month'", "'delta'", 
        "'deriv'", "'exp'", "'floor'", "'histogram_count'", "'histogram_sum'", 
        "'histogram_fraction'", "'histogram_quantile'", "'holt_winters'", 
        "'hour'", "'idelta'", "'increase'", "'irate'", "'label_join'", "'label_replace'", 
        "'ln'", "'log2'", "'log10'", "'minute'", "'month'", "'predict_linear'", 
        "'rate'", "'resets'", "'round'", "'scalar'", "'sgn'", "'sort'", 
        "'sort_desc'", "'sqrt'", "'time'", "'timestamp'", "'vector'", "'year'", 
        "'avg_over_time'", "'min_over_time'", "'max_over_time'", "'sum_over_time'", 
        "'count_over_time'", "'quantile_over_time'", "'stddev_over_time'", 
        "'stdvar_over_time'", "'last_over_time'", "'present_over_time'", 
        "'acos'", "'acosh'", "'asin'", "'asinh'", "'atan'", "'atanh'", "'cos'", 
        "'cosh'", "'sin'", "'sinh'", "'tan'", "'tanh'", "'deg'", "'pi'", 
        "'rad'", "'{'", "'}'", "'('", "')'", "'['", "']'", "','", "':'", 
        "'@'"
    ];

    public static readonly symbolicNames = [
        null, "NUMBER", "STRING", "ADD", "SUB", "MULT", "DIV", "MOD", "POW", 
        "AND", "OR", "UNLESS", "EQ", "DEQ", "NE", "GT", "LT", "GE", "LE", 
        "RE", "NRE", "BY", "WITHOUT", "ON", "IGNORING", "GROUP_LEFT", "GROUP_RIGHT", 
        "OFFSET", "BOOL", "SUM", "MIN", "MAX", "AVG", "GROUP", "STDDEV", 
        "STDVAR", "COUNT", "COUNT_VALUES", "BOTTOMK", "TOPK", "QUANTILE", 
        "LIMITK", "LIMIT_RATIO", "ABS", "ABSENT", "ABSENT_OVER_TIME", "CEIL", 
        "CHANGES", "CLAMP", "CLAMP_MAX", "CLAMP_MIN", "DAY_OF_MONTH", "DAY_OF_WEEK", 
        "DAY_OF_YEAR", "DAYS_IN_MONTH", "DELTA", "DERIV", "EXP", "FLOOR", 
        "HISTOGRAM_COUNT", "HISTOGRAM_SUM", "HISTOGRAM_FRACTION", "HISTOGRAM_QUANTILE", 
        "HOLT_WINTERS", "HOUR", "IDELTA", "INCREASE", "IRATE", "LABEL_JOIN", 
        "LABEL_REPLACE", "LN", "LOG2", "LOG10", "MINUTE", "MONTH", "PREDICT_LINEAR", 
        "RATE", "RESETS", "ROUND", "SCALAR", "SGN", "SORT", "SORT_DESC", 
        "SQRT", "TIME", "TIMESTAMP", "VECTOR", "YEAR", "AVG_OVER_TIME", 
        "MIN_OVER_TIME", "MAX_OVER_TIME", "SUM_OVER_TIME", "COUNT_OVER_TIME", 
        "QUANTILE_OVER_TIME", "STDDEV_OVER_TIME", "STDVAR_OVER_TIME", "LAST_OVER_TIME", 
        "PRESENT_OVER_TIME", "ACOS", "ACOSH", "ASIN", "ASINH", "ATAN", "ATANH", 
        "COS", "COSH", "SIN", "SINH", "TAN", "TANH", "DEG", "PI", "RAD", 
        "LEFT_BRACE", "RIGHT_BRACE", "LEFT_PAREN", "RIGHT_PAREN", "LEFT_BRACKET", 
        "RIGHT_BRACKET", "COMMA", "COLON", "AT", "DURATION", "METRIC_NAME", 
        "LABEL_NAME", "WS", "SL_COMMENT"
    ];
    public static readonly ruleNames = [
        "expression", "vectorOperation", "unaryOp", "powOp", "multOp", "addOp", 
        "compareOp", "andUnlessOp", "orOp", "vectorMatchOp", "subqueryOp", 
        "offsetOp", "vector", "parens", "metricName", "instantSelector", 
        "labelMatcher", "labelValue", "labelMatcherOperator", "labelMatcherList", 
        "matrixSelector", "timeRange", "subqueryRange", "duration", "offset", 
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
            this.state = 84;
            this.vectorOperation(0);
            this.state = 85;
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
            this.state = 92;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.ADD:
            case PromQLParser.SUB:
                {
                this.state = 88;
                this.unaryOp();
                this.state = 89;
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
            case PromQLParser.LIMITK:
            case PromQLParser.LIMIT_RATIO:
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
                this.state = 91;
                this.vector();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.context!.stop = this.tokenStream.LT(-1);
            this.state = 129;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 2, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    if (this.parseListeners != null) {
                        this.triggerExitRuleEvent();
                    }
                    previousContext = localContext;
                    {
                    this.state = 127;
                    this.errorHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this.tokenStream, 1, this.context) ) {
                    case 1:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 94;
                        if (!(this.precpred(this.context, 11))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 11)");
                        }
                        this.state = 95;
                        this.powOp();
                        this.state = 96;
                        this.vectorOperation(11);
                        }
                        break;
                    case 2:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 98;
                        if (!(this.precpred(this.context, 8))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 8)");
                        }
                        this.state = 99;
                        this.multOp();
                        this.state = 100;
                        this.vectorOperation(9);
                        }
                        break;
                    case 3:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 102;
                        if (!(this.precpred(this.context, 7))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 7)");
                        }
                        this.state = 103;
                        this.addOp();
                        this.state = 104;
                        this.vectorOperation(8);
                        }
                        break;
                    case 4:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 106;
                        if (!(this.precpred(this.context, 6))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 6)");
                        }
                        this.state = 107;
                        this.compareOp();
                        this.state = 108;
                        this.vectorOperation(7);
                        }
                        break;
                    case 5:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 110;
                        if (!(this.precpred(this.context, 5))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 5)");
                        }
                        this.state = 111;
                        this.andUnlessOp();
                        this.state = 112;
                        this.vectorOperation(6);
                        }
                        break;
                    case 6:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 114;
                        if (!(this.precpred(this.context, 4))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 4)");
                        }
                        this.state = 115;
                        this.orOp();
                        this.state = 116;
                        this.vectorOperation(5);
                        }
                        break;
                    case 7:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 118;
                        if (!(this.precpred(this.context, 3))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 3)");
                        }
                        this.state = 119;
                        this.vectorMatchOp();
                        this.state = 120;
                        this.vectorOperation(4);
                        }
                        break;
                    case 8:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 122;
                        if (!(this.precpred(this.context, 2))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 2)");
                        }
                        this.state = 123;
                        this.match(PromQLParser.AT);
                        this.state = 124;
                        this.vectorOperation(3);
                        }
                        break;
                    case 9:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 125;
                        if (!(this.precpred(this.context, 10))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 10)");
                        }
                        this.state = 126;
                        this.subqueryOp();
                        }
                        break;
                    }
                    }
                }
                this.state = 131;
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
            this.state = 132;
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
            this.state = 134;
            this.match(PromQLParser.POW);
            this.state = 136;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 135;
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
            this.state = 138;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 224) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 140;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 139;
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
            this.state = 142;
            _la = this.tokenStream.LA(1);
            if(!(_la === 3 || _la === 4)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 144;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 143;
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
            this.state = 146;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 516096) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 148;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 28) {
                {
                this.state = 147;
                this.match(PromQLParser.BOOL);
                }
            }

            this.state = 151;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 150;
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
            this.state = 153;
            _la = this.tokenStream.LA(1);
            if(!(_la === 9 || _la === 11)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 155;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 154;
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
            this.state = 157;
            this.match(PromQLParser.OR);
            this.state = 159;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 158;
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
            this.state = 161;
            _la = this.tokenStream.LA(1);
            if(!(_la === 11 || _la === 23)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 163;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 162;
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
            this.state = 165;
            this.subqueryRange();
            this.state = 167;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 11, this.context) ) {
            case 1:
                {
                this.state = 166;
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
            this.state = 169;
            this.match(PromQLParser.OFFSET);
            this.state = 170;
            this.duration();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
            this.state = 179;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 12, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 172;
                this.function_();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 173;
                this.aggregation();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 174;
                this.instantSelector();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 175;
                this.matrixSelector();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 176;
                this.offset();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 177;
                this.literal();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 178;
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
            this.state = 181;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 182;
            this.vectorOperation(0);
            this.state = 183;
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
    public metricName(): MetricNameContext {
        let localContext = new MetricNameContext(this.context, this.state);
        this.enterRule(localContext, 28, PromQLParser.RULE_metricName);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 185;
            this.match(PromQLParser.METRIC_NAME);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 30, PromQLParser.RULE_instantSelector);
        let _la: number;
        try {
            this.state = 199;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.METRIC_NAME:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 187;
                this.metricName();
                this.state = 193;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 14, this.context) ) {
                case 1:
                    {
                    this.state = 188;
                    this.match(PromQLParser.LEFT_BRACE);
                    this.state = 190;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                    if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4292873728) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 402784255) !== 0)) {
                        {
                        this.state = 189;
                        this.labelMatcherList();
                        }
                    }

                    this.state = 192;
                    this.match(PromQLParser.RIGHT_BRACE);
                    }
                    break;
                }
                }
                break;
            case PromQLParser.LEFT_BRACE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 195;
                this.match(PromQLParser.LEFT_BRACE);
                this.state = 196;
                this.labelMatcherList();
                this.state = 197;
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
        this.enterRule(localContext, 32, PromQLParser.RULE_labelMatcher);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 201;
            this.labelName();
            this.state = 202;
            this.labelMatcherOperator();
            this.state = 203;
            this.labelValue();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public labelValue(): LabelValueContext {
        let localContext = new LabelValueContext(this.context, this.state);
        this.enterRule(localContext, 34, PromQLParser.RULE_labelValue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 205;
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
        this.enterRule(localContext, 36, PromQLParser.RULE_labelMatcherOperator);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 207;
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
        this.enterRule(localContext, 38, PromQLParser.RULE_labelMatcherList);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 209;
            this.labelMatcher();
            this.state = 214;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 16, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 210;
                    this.match(PromQLParser.COMMA);
                    this.state = 211;
                    this.labelMatcher();
                    }
                    }
                }
                this.state = 216;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 16, this.context);
            }
            this.state = 218;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 119) {
                {
                this.state = 217;
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
        this.enterRule(localContext, 40, PromQLParser.RULE_matrixSelector);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 220;
            this.instantSelector();
            this.state = 221;
            this.timeRange();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public timeRange(): TimeRangeContext {
        let localContext = new TimeRangeContext(this.context, this.state);
        this.enterRule(localContext, 42, PromQLParser.RULE_timeRange);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 223;
            this.match(PromQLParser.LEFT_BRACKET);
            this.state = 224;
            this.duration();
            this.state = 225;
            this.match(PromQLParser.RIGHT_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public subqueryRange(): SubqueryRangeContext {
        let localContext = new SubqueryRangeContext(this.context, this.state);
        this.enterRule(localContext, 44, PromQLParser.RULE_subqueryRange);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 227;
            this.match(PromQLParser.LEFT_BRACKET);
            this.state = 228;
            this.duration();
            this.state = 229;
            this.match(PromQLParser.COLON);
            this.state = 231;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 122) {
                {
                this.state = 230;
                this.duration();
                }
            }

            this.state = 233;
            this.match(PromQLParser.RIGHT_BRACKET);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public duration(): DurationContext {
        let localContext = new DurationContext(this.context, this.state);
        this.enterRule(localContext, 46, PromQLParser.RULE_duration);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 236;
            this.errorHandler.sync(this);
            alternative = 1;
            do {
                switch (alternative) {
                case 1:
                    {
                    {
                    this.state = 235;
                    this.match(PromQLParser.DURATION);
                    }
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                this.state = 238;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 19, this.context);
            } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 48, PromQLParser.RULE_offset);
        try {
            this.state = 248;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 20, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 240;
                this.instantSelector();
                this.state = 241;
                this.match(PromQLParser.OFFSET);
                this.state = 242;
                this.duration();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 244;
                this.matrixSelector();
                this.state = 245;
                this.match(PromQLParser.OFFSET);
                this.state = 246;
                this.duration();
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
        this.enterRule(localContext, 50, PromQLParser.RULE_function);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 250;
            this.functionNames();
            this.state = 251;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 260;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3758096414) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 135004159) !== 0)) {
                {
                this.state = 252;
                this.parameter();
                this.state = 257;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 119) {
                    {
                    {
                    this.state = 253;
                    this.match(PromQLParser.COMMA);
                    this.state = 254;
                    this.parameter();
                    }
                    }
                    this.state = 259;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 262;
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
        this.enterRule(localContext, 52, PromQLParser.RULE_parameter);
        try {
            this.state = 266;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 23, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 264;
                this.literal();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 265;
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
        this.enterRule(localContext, 54, PromQLParser.RULE_parameterList);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 268;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 277;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3758096414) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 135004159) !== 0)) {
                {
                this.state = 269;
                this.parameter();
                this.state = 274;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 119) {
                    {
                    {
                    this.state = 270;
                    this.match(PromQLParser.COMMA);
                    this.state = 271;
                    this.parameter();
                    }
                    }
                    this.state = 276;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 279;
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
        this.enterRule(localContext, 56, PromQLParser.RULE_functionNames);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 281;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 4294967295) !== 0) || ((((_la - 75)) & ~0x1F) === 0 && ((1 << (_la - 75)) & 4294967295) !== 0) || ((((_la - 107)) & ~0x1F) === 0 && ((1 << (_la - 107)) & 63) !== 0))) {
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
        this.enterRule(localContext, 58, PromQLParser.RULE_aggregation);
        try {
            this.state = 299;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 28, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 283;
                this.aggregationOperators();
                this.state = 284;
                this.parameterList();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 286;
                this.aggregationOperators();
                this.state = 289;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PromQLParser.BY:
                    {
                    this.state = 287;
                    this.by();
                    }
                    break;
                case PromQLParser.WITHOUT:
                    {
                    this.state = 288;
                    this.without();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                this.state = 291;
                this.parameterList();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 293;
                this.aggregationOperators();
                this.state = 294;
                this.parameterList();
                this.state = 297;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PromQLParser.BY:
                    {
                    this.state = 295;
                    this.by();
                    }
                    break;
                case PromQLParser.WITHOUT:
                    {
                    this.state = 296;
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
        this.enterRule(localContext, 60, PromQLParser.RULE_by);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 301;
            this.match(PromQLParser.BY);
            this.state = 302;
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
        this.enterRule(localContext, 62, PromQLParser.RULE_without);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 304;
            this.match(PromQLParser.WITHOUT);
            this.state = 305;
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
        this.enterRule(localContext, 64, PromQLParser.RULE_aggregationOperators);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 307;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 29)) & ~0x1F) === 0 && ((1 << (_la - 29)) & 16383) !== 0))) {
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
        this.enterRule(localContext, 66, PromQLParser.RULE_grouping);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 311;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.ON:
                {
                this.state = 309;
                this.on_();
                }
                break;
            case PromQLParser.IGNORING:
                {
                this.state = 310;
                this.ignoring();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 315;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.GROUP_LEFT:
                {
                this.state = 313;
                this.groupLeft();
                }
                break;
            case PromQLParser.GROUP_RIGHT:
                {
                this.state = 314;
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
            case PromQLParser.LIMITK:
            case PromQLParser.LIMIT_RATIO:
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
        this.enterRule(localContext, 68, PromQLParser.RULE_on_);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 317;
            this.match(PromQLParser.ON);
            this.state = 318;
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
        this.enterRule(localContext, 70, PromQLParser.RULE_ignoring);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 320;
            this.match(PromQLParser.IGNORING);
            this.state = 321;
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
        this.enterRule(localContext, 72, PromQLParser.RULE_groupLeft);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 323;
            this.match(PromQLParser.GROUP_LEFT);
            this.state = 325;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 31, this.context) ) {
            case 1:
                {
                this.state = 324;
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
        this.enterRule(localContext, 74, PromQLParser.RULE_groupRight);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 327;
            this.match(PromQLParser.GROUP_RIGHT);
            this.state = 329;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 32, this.context) ) {
            case 1:
                {
                this.state = 328;
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
        this.enterRule(localContext, 76, PromQLParser.RULE_labelName);
        try {
            this.state = 334;
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
            case PromQLParser.LIMITK:
            case PromQLParser.LIMIT_RATIO:
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
                this.state = 331;
                this.keyword();
                }
                break;
            case PromQLParser.METRIC_NAME:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 332;
                this.metricName();
                }
                break;
            case PromQLParser.LABEL_NAME:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 333;
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
        this.enterRule(localContext, 78, PromQLParser.RULE_labelNameList);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 336;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 345;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4292873728) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 402784255) !== 0)) {
                {
                this.state = 337;
                this.labelName();
                this.state = 342;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 119) {
                    {
                    {
                    this.state = 338;
                    this.match(PromQLParser.COMMA);
                    this.state = 339;
                    this.labelName();
                    }
                    }
                    this.state = 344;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 347;
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
        this.enterRule(localContext, 80, PromQLParser.RULE_keyword);
        try {
            this.state = 362;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.AND:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 349;
                this.match(PromQLParser.AND);
                }
                break;
            case PromQLParser.OR:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 350;
                this.match(PromQLParser.OR);
                }
                break;
            case PromQLParser.UNLESS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 351;
                this.match(PromQLParser.UNLESS);
                }
                break;
            case PromQLParser.BY:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 352;
                this.match(PromQLParser.BY);
                }
                break;
            case PromQLParser.WITHOUT:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 353;
                this.match(PromQLParser.WITHOUT);
                }
                break;
            case PromQLParser.ON:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 354;
                this.match(PromQLParser.ON);
                }
                break;
            case PromQLParser.IGNORING:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 355;
                this.match(PromQLParser.IGNORING);
                }
                break;
            case PromQLParser.GROUP_LEFT:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 356;
                this.match(PromQLParser.GROUP_LEFT);
                }
                break;
            case PromQLParser.GROUP_RIGHT:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 357;
                this.match(PromQLParser.GROUP_RIGHT);
                }
                break;
            case PromQLParser.OFFSET:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 358;
                this.match(PromQLParser.OFFSET);
                }
                break;
            case PromQLParser.BOOL:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 359;
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
            case PromQLParser.LIMITK:
            case PromQLParser.LIMIT_RATIO:
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 360;
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
                this.state = 361;
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
        this.enterRule(localContext, 82, PromQLParser.RULE_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 364;
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
        4,1,126,367,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,
        7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,
        13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,
        20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,
        26,2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,
        33,7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,
        39,2,40,7,40,2,41,7,41,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,3,1,93,8,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,5,1,128,8,1,10,1,12,1,131,9,1,1,2,1,2,1,3,1,3,3,3,137,8,3,
        1,4,1,4,3,4,141,8,4,1,5,1,5,3,5,145,8,5,1,6,1,6,3,6,149,8,6,1,6,
        3,6,152,8,6,1,7,1,7,3,7,156,8,7,1,8,1,8,3,8,160,8,8,1,9,1,9,3,9,
        164,8,9,1,10,1,10,3,10,168,8,10,1,11,1,11,1,11,1,12,1,12,1,12,1,
        12,1,12,1,12,1,12,3,12,180,8,12,1,13,1,13,1,13,1,13,1,14,1,14,1,
        15,1,15,1,15,3,15,191,8,15,1,15,3,15,194,8,15,1,15,1,15,1,15,1,15,
        3,15,200,8,15,1,16,1,16,1,16,1,16,1,17,1,17,1,18,1,18,1,19,1,19,
        1,19,5,19,213,8,19,10,19,12,19,216,9,19,1,19,3,19,219,8,19,1,20,
        1,20,1,20,1,21,1,21,1,21,1,21,1,22,1,22,1,22,1,22,3,22,232,8,22,
        1,22,1,22,1,23,4,23,237,8,23,11,23,12,23,238,1,24,1,24,1,24,1,24,
        1,24,1,24,1,24,1,24,3,24,249,8,24,1,25,1,25,1,25,1,25,1,25,5,25,
        256,8,25,10,25,12,25,259,9,25,3,25,261,8,25,1,25,1,25,1,26,1,26,
        3,26,267,8,26,1,27,1,27,1,27,1,27,5,27,273,8,27,10,27,12,27,276,
        9,27,3,27,278,8,27,1,27,1,27,1,28,1,28,1,29,1,29,1,29,1,29,1,29,
        1,29,3,29,290,8,29,1,29,1,29,1,29,1,29,1,29,1,29,3,29,298,8,29,3,
        29,300,8,29,1,30,1,30,1,30,1,31,1,31,1,31,1,32,1,32,1,33,1,33,3,
        33,312,8,33,1,33,1,33,3,33,316,8,33,1,34,1,34,1,34,1,35,1,35,1,35,
        1,36,1,36,3,36,326,8,36,1,37,1,37,3,37,330,8,37,1,38,1,38,1,38,3,
        38,335,8,38,1,39,1,39,1,39,1,39,5,39,341,8,39,10,39,12,39,344,9,
        39,3,39,346,8,39,1,39,1,39,1,40,1,40,1,40,1,40,1,40,1,40,1,40,1,
        40,1,40,1,40,1,40,1,40,1,40,3,40,363,8,40,1,41,1,41,1,41,0,1,2,42,
        0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,
        46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,0,9,1,0,
        3,4,1,0,5,7,1,0,13,18,2,0,9,9,11,11,2,0,11,11,23,23,3,0,12,12,14,
        14,19,20,1,0,43,112,1,0,29,42,1,0,1,2,387,0,84,1,0,0,0,2,92,1,0,
        0,0,4,132,1,0,0,0,6,134,1,0,0,0,8,138,1,0,0,0,10,142,1,0,0,0,12,
        146,1,0,0,0,14,153,1,0,0,0,16,157,1,0,0,0,18,161,1,0,0,0,20,165,
        1,0,0,0,22,169,1,0,0,0,24,179,1,0,0,0,26,181,1,0,0,0,28,185,1,0,
        0,0,30,199,1,0,0,0,32,201,1,0,0,0,34,205,1,0,0,0,36,207,1,0,0,0,
        38,209,1,0,0,0,40,220,1,0,0,0,42,223,1,0,0,0,44,227,1,0,0,0,46,236,
        1,0,0,0,48,248,1,0,0,0,50,250,1,0,0,0,52,266,1,0,0,0,54,268,1,0,
        0,0,56,281,1,0,0,0,58,299,1,0,0,0,60,301,1,0,0,0,62,304,1,0,0,0,
        64,307,1,0,0,0,66,311,1,0,0,0,68,317,1,0,0,0,70,320,1,0,0,0,72,323,
        1,0,0,0,74,327,1,0,0,0,76,334,1,0,0,0,78,336,1,0,0,0,80,362,1,0,
        0,0,82,364,1,0,0,0,84,85,3,2,1,0,85,86,5,0,0,1,86,1,1,0,0,0,87,88,
        6,1,-1,0,88,89,3,4,2,0,89,90,3,2,1,9,90,93,1,0,0,0,91,93,3,24,12,
        0,92,87,1,0,0,0,92,91,1,0,0,0,93,129,1,0,0,0,94,95,10,11,0,0,95,
        96,3,6,3,0,96,97,3,2,1,11,97,128,1,0,0,0,98,99,10,8,0,0,99,100,3,
        8,4,0,100,101,3,2,1,9,101,128,1,0,0,0,102,103,10,7,0,0,103,104,3,
        10,5,0,104,105,3,2,1,8,105,128,1,0,0,0,106,107,10,6,0,0,107,108,
        3,12,6,0,108,109,3,2,1,7,109,128,1,0,0,0,110,111,10,5,0,0,111,112,
        3,14,7,0,112,113,3,2,1,6,113,128,1,0,0,0,114,115,10,4,0,0,115,116,
        3,16,8,0,116,117,3,2,1,5,117,128,1,0,0,0,118,119,10,3,0,0,119,120,
        3,18,9,0,120,121,3,2,1,4,121,128,1,0,0,0,122,123,10,2,0,0,123,124,
        5,121,0,0,124,128,3,2,1,3,125,126,10,10,0,0,126,128,3,20,10,0,127,
        94,1,0,0,0,127,98,1,0,0,0,127,102,1,0,0,0,127,106,1,0,0,0,127,110,
        1,0,0,0,127,114,1,0,0,0,127,118,1,0,0,0,127,122,1,0,0,0,127,125,
        1,0,0,0,128,131,1,0,0,0,129,127,1,0,0,0,129,130,1,0,0,0,130,3,1,
        0,0,0,131,129,1,0,0,0,132,133,7,0,0,0,133,5,1,0,0,0,134,136,5,8,
        0,0,135,137,3,66,33,0,136,135,1,0,0,0,136,137,1,0,0,0,137,7,1,0,
        0,0,138,140,7,1,0,0,139,141,3,66,33,0,140,139,1,0,0,0,140,141,1,
        0,0,0,141,9,1,0,0,0,142,144,7,0,0,0,143,145,3,66,33,0,144,143,1,
        0,0,0,144,145,1,0,0,0,145,11,1,0,0,0,146,148,7,2,0,0,147,149,5,28,
        0,0,148,147,1,0,0,0,148,149,1,0,0,0,149,151,1,0,0,0,150,152,3,66,
        33,0,151,150,1,0,0,0,151,152,1,0,0,0,152,13,1,0,0,0,153,155,7,3,
        0,0,154,156,3,66,33,0,155,154,1,0,0,0,155,156,1,0,0,0,156,15,1,0,
        0,0,157,159,5,10,0,0,158,160,3,66,33,0,159,158,1,0,0,0,159,160,1,
        0,0,0,160,17,1,0,0,0,161,163,7,4,0,0,162,164,3,66,33,0,163,162,1,
        0,0,0,163,164,1,0,0,0,164,19,1,0,0,0,165,167,3,44,22,0,166,168,3,
        22,11,0,167,166,1,0,0,0,167,168,1,0,0,0,168,21,1,0,0,0,169,170,5,
        27,0,0,170,171,3,46,23,0,171,23,1,0,0,0,172,180,3,50,25,0,173,180,
        3,58,29,0,174,180,3,30,15,0,175,180,3,40,20,0,176,180,3,48,24,0,
        177,180,3,82,41,0,178,180,3,26,13,0,179,172,1,0,0,0,179,173,1,0,
        0,0,179,174,1,0,0,0,179,175,1,0,0,0,179,176,1,0,0,0,179,177,1,0,
        0,0,179,178,1,0,0,0,180,25,1,0,0,0,181,182,5,115,0,0,182,183,3,2,
        1,0,183,184,5,116,0,0,184,27,1,0,0,0,185,186,5,123,0,0,186,29,1,
        0,0,0,187,193,3,28,14,0,188,190,5,113,0,0,189,191,3,38,19,0,190,
        189,1,0,0,0,190,191,1,0,0,0,191,192,1,0,0,0,192,194,5,114,0,0,193,
        188,1,0,0,0,193,194,1,0,0,0,194,200,1,0,0,0,195,196,5,113,0,0,196,
        197,3,38,19,0,197,198,5,114,0,0,198,200,1,0,0,0,199,187,1,0,0,0,
        199,195,1,0,0,0,200,31,1,0,0,0,201,202,3,76,38,0,202,203,3,36,18,
        0,203,204,3,34,17,0,204,33,1,0,0,0,205,206,5,2,0,0,206,35,1,0,0,
        0,207,208,7,5,0,0,208,37,1,0,0,0,209,214,3,32,16,0,210,211,5,119,
        0,0,211,213,3,32,16,0,212,210,1,0,0,0,213,216,1,0,0,0,214,212,1,
        0,0,0,214,215,1,0,0,0,215,218,1,0,0,0,216,214,1,0,0,0,217,219,5,
        119,0,0,218,217,1,0,0,0,218,219,1,0,0,0,219,39,1,0,0,0,220,221,3,
        30,15,0,221,222,3,42,21,0,222,41,1,0,0,0,223,224,5,117,0,0,224,225,
        3,46,23,0,225,226,5,118,0,0,226,43,1,0,0,0,227,228,5,117,0,0,228,
        229,3,46,23,0,229,231,5,120,0,0,230,232,3,46,23,0,231,230,1,0,0,
        0,231,232,1,0,0,0,232,233,1,0,0,0,233,234,5,118,0,0,234,45,1,0,0,
        0,235,237,5,122,0,0,236,235,1,0,0,0,237,238,1,0,0,0,238,236,1,0,
        0,0,238,239,1,0,0,0,239,47,1,0,0,0,240,241,3,30,15,0,241,242,5,27,
        0,0,242,243,3,46,23,0,243,249,1,0,0,0,244,245,3,40,20,0,245,246,
        5,27,0,0,246,247,3,46,23,0,247,249,1,0,0,0,248,240,1,0,0,0,248,244,
        1,0,0,0,249,49,1,0,0,0,250,251,3,56,28,0,251,260,5,115,0,0,252,257,
        3,52,26,0,253,254,5,119,0,0,254,256,3,52,26,0,255,253,1,0,0,0,256,
        259,1,0,0,0,257,255,1,0,0,0,257,258,1,0,0,0,258,261,1,0,0,0,259,
        257,1,0,0,0,260,252,1,0,0,0,260,261,1,0,0,0,261,262,1,0,0,0,262,
        263,5,116,0,0,263,51,1,0,0,0,264,267,3,82,41,0,265,267,3,2,1,0,266,
        264,1,0,0,0,266,265,1,0,0,0,267,53,1,0,0,0,268,277,5,115,0,0,269,
        274,3,52,26,0,270,271,5,119,0,0,271,273,3,52,26,0,272,270,1,0,0,
        0,273,276,1,0,0,0,274,272,1,0,0,0,274,275,1,0,0,0,275,278,1,0,0,
        0,276,274,1,0,0,0,277,269,1,0,0,0,277,278,1,0,0,0,278,279,1,0,0,
        0,279,280,5,116,0,0,280,55,1,0,0,0,281,282,7,6,0,0,282,57,1,0,0,
        0,283,284,3,64,32,0,284,285,3,54,27,0,285,300,1,0,0,0,286,289,3,
        64,32,0,287,290,3,60,30,0,288,290,3,62,31,0,289,287,1,0,0,0,289,
        288,1,0,0,0,290,291,1,0,0,0,291,292,3,54,27,0,292,300,1,0,0,0,293,
        294,3,64,32,0,294,297,3,54,27,0,295,298,3,60,30,0,296,298,3,62,31,
        0,297,295,1,0,0,0,297,296,1,0,0,0,298,300,1,0,0,0,299,283,1,0,0,
        0,299,286,1,0,0,0,299,293,1,0,0,0,300,59,1,0,0,0,301,302,5,21,0,
        0,302,303,3,78,39,0,303,61,1,0,0,0,304,305,5,22,0,0,305,306,3,78,
        39,0,306,63,1,0,0,0,307,308,7,7,0,0,308,65,1,0,0,0,309,312,3,68,
        34,0,310,312,3,70,35,0,311,309,1,0,0,0,311,310,1,0,0,0,312,315,1,
        0,0,0,313,316,3,72,36,0,314,316,3,74,37,0,315,313,1,0,0,0,315,314,
        1,0,0,0,315,316,1,0,0,0,316,67,1,0,0,0,317,318,5,23,0,0,318,319,
        3,78,39,0,319,69,1,0,0,0,320,321,5,24,0,0,321,322,3,78,39,0,322,
        71,1,0,0,0,323,325,5,25,0,0,324,326,3,78,39,0,325,324,1,0,0,0,325,
        326,1,0,0,0,326,73,1,0,0,0,327,329,5,26,0,0,328,330,3,78,39,0,329,
        328,1,0,0,0,329,330,1,0,0,0,330,75,1,0,0,0,331,335,3,80,40,0,332,
        335,3,28,14,0,333,335,5,124,0,0,334,331,1,0,0,0,334,332,1,0,0,0,
        334,333,1,0,0,0,335,77,1,0,0,0,336,345,5,115,0,0,337,342,3,76,38,
        0,338,339,5,119,0,0,339,341,3,76,38,0,340,338,1,0,0,0,341,344,1,
        0,0,0,342,340,1,0,0,0,342,343,1,0,0,0,343,346,1,0,0,0,344,342,1,
        0,0,0,345,337,1,0,0,0,345,346,1,0,0,0,346,347,1,0,0,0,347,348,5,
        116,0,0,348,79,1,0,0,0,349,363,5,9,0,0,350,363,5,10,0,0,351,363,
        5,11,0,0,352,363,5,21,0,0,353,363,5,22,0,0,354,363,5,23,0,0,355,
        363,5,24,0,0,356,363,5,25,0,0,357,363,5,26,0,0,358,363,5,27,0,0,
        359,363,5,28,0,0,360,363,3,64,32,0,361,363,3,56,28,0,362,349,1,0,
        0,0,362,350,1,0,0,0,362,351,1,0,0,0,362,352,1,0,0,0,362,353,1,0,
        0,0,362,354,1,0,0,0,362,355,1,0,0,0,362,356,1,0,0,0,362,357,1,0,
        0,0,362,358,1,0,0,0,362,359,1,0,0,0,362,360,1,0,0,0,362,361,1,0,
        0,0,363,81,1,0,0,0,364,365,7,8,0,0,365,83,1,0,0,0,37,92,127,129,
        136,140,144,148,151,155,159,163,167,179,190,193,199,214,218,231,
        238,248,257,260,266,274,277,289,297,299,311,315,325,329,334,342,
        345,362
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
    public subqueryRange(): SubqueryRangeContext {
        return this.getRuleContext(0, SubqueryRangeContext)!;
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
    public duration(): DurationContext {
        return this.getRuleContext(0, DurationContext)!;
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


export class MetricNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public METRIC_NAME(): antlr.TerminalNode {
        return this.getToken(PromQLParser.METRIC_NAME, 0)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_metricName;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitMetricName) {
            return visitor.visitMetricName(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class InstantSelectorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public metricName(): MetricNameContext | null {
        return this.getRuleContext(0, MetricNameContext);
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
    public labelValue(): LabelValueContext {
        return this.getRuleContext(0, LabelValueContext)!;
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


export class LabelValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(PromQLParser.STRING, 0)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_labelValue;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitLabelValue) {
            return visitor.visitLabelValue(this);
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
    public timeRange(): TimeRangeContext {
        return this.getRuleContext(0, TimeRangeContext)!;
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


export class TimeRangeContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LEFT_BRACKET(): antlr.TerminalNode {
        return this.getToken(PromQLParser.LEFT_BRACKET, 0)!;
    }
    public duration(): DurationContext {
        return this.getRuleContext(0, DurationContext)!;
    }
    public RIGHT_BRACKET(): antlr.TerminalNode {
        return this.getToken(PromQLParser.RIGHT_BRACKET, 0)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_timeRange;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitTimeRange) {
            return visitor.visitTimeRange(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SubqueryRangeContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LEFT_BRACKET(): antlr.TerminalNode {
        return this.getToken(PromQLParser.LEFT_BRACKET, 0)!;
    }
    public duration(): DurationContext[];
    public duration(i: number): DurationContext | null;
    public duration(i?: number): DurationContext[] | DurationContext | null {
        if (i === undefined) {
            return this.getRuleContexts(DurationContext);
        }

        return this.getRuleContext(i, DurationContext);
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(PromQLParser.COLON, 0)!;
    }
    public RIGHT_BRACKET(): antlr.TerminalNode {
        return this.getToken(PromQLParser.RIGHT_BRACKET, 0)!;
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_subqueryRange;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitSubqueryRange) {
            return visitor.visitSubqueryRange(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DurationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DURATION(): antlr.TerminalNode[];
    public DURATION(i: number): antlr.TerminalNode | null;
    public DURATION(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PromQLParser.DURATION);
    	} else {
    		return this.getToken(PromQLParser.DURATION, i);
    	}
    }
    public override get ruleIndex(): number {
        return PromQLParser.RULE_duration;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitDuration) {
            return visitor.visitDuration(this);
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
    public duration(): DurationContext {
        return this.getRuleContext(0, DurationContext)!;
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
    public LIMITK(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LIMITK, 0);
    }
    public LIMIT_RATIO(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.LIMIT_RATIO, 0);
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
    public metricName(): MetricNameContext | null {
        return this.getRuleContext(0, MetricNameContext);
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
