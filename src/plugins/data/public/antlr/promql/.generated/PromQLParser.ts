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
    public static readonly AGGREGATION_OPERATOR = 29;
    public static readonly FUNCTION = 30;
    public static readonly LEFT_BRACE = 31;
    public static readonly RIGHT_BRACE = 32;
    public static readonly LEFT_PAREN = 33;
    public static readonly RIGHT_PAREN = 34;
    public static readonly LEFT_BRACKET = 35;
    public static readonly RIGHT_BRACKET = 36;
    public static readonly COMMA = 37;
    public static readonly AT = 38;
    public static readonly SUBQUERY_RANGE = 39;
    public static readonly TIME_RANGE = 40;
    public static readonly DURATION = 41;
    public static readonly METRIC_NAME = 42;
    public static readonly LABEL_NAME = 43;
    public static readonly WS = 44;
    public static readonly SL_COMMENT = 45;
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
    public static readonly RULE_function_ = 20;
    public static readonly RULE_parameter = 21;
    public static readonly RULE_parameterList = 22;
    public static readonly RULE_aggregation = 23;
    public static readonly RULE_by = 24;
    public static readonly RULE_without = 25;
    public static readonly RULE_grouping = 26;
    public static readonly RULE_on_ = 27;
    public static readonly RULE_ignoring = 28;
    public static readonly RULE_groupLeft = 29;
    public static readonly RULE_groupRight = 30;
    public static readonly RULE_labelName = 31;
    public static readonly RULE_labelNameList = 32;
    public static readonly RULE_keyword = 33;
    public static readonly RULE_literal = 34;

    public static readonly literalNames = [
        null, null, null, "'+'", "'-'", "'*'", "'/'", "'%'", "'^'", "'and'", 
        "'or'", "'unless'", "'='", "'=='", "'!='", "'>'", "'<'", "'>='", 
        "'<='", "'=~'", "'!~'", "'by'", "'without'", "'on'", "'ignoring'", 
        "'group_left'", "'group_right'", "'offset'", "'bool'", null, null, 
        "'{'", "'}'", "'('", "')'", "'['", "']'", "','", "'@'"
    ];

    public static readonly symbolicNames = [
        null, "NUMBER", "STRING", "ADD", "SUB", "MULT", "DIV", "MOD", "POW", 
        "AND", "OR", "UNLESS", "EQ", "DEQ", "NE", "GT", "LT", "GE", "LE", 
        "RE", "NRE", "BY", "WITHOUT", "ON", "IGNORING", "GROUP_LEFT", "GROUP_RIGHT", 
        "OFFSET", "BOOL", "AGGREGATION_OPERATOR", "FUNCTION", "LEFT_BRACE", 
        "RIGHT_BRACE", "LEFT_PAREN", "RIGHT_PAREN", "LEFT_BRACKET", "RIGHT_BRACKET", 
        "COMMA", "AT", "SUBQUERY_RANGE", "TIME_RANGE", "DURATION", "METRIC_NAME", 
        "LABEL_NAME", "WS", "SL_COMMENT"
    ];
    public static readonly ruleNames = [
        "expression", "vectorOperation", "unaryOp", "powOp", "multOp", "addOp", 
        "compareOp", "andUnlessOp", "orOp", "vectorMatchOp", "subqueryOp", 
        "offsetOp", "vector", "parens", "instantSelector", "labelMatcher", 
        "labelMatcherOperator", "labelMatcherList", "matrixSelector", "offset", 
        "function_", "parameter", "parameterList", "aggregation", "by", 
        "without", "grouping", "on_", "ignoring", "groupLeft", "groupRight", 
        "labelName", "labelNameList", "keyword", "literal",
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
            this.state = 70;
            this.vectorOperation(0);
            this.state = 71;
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
            this.state = 78;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.ADD:
            case PromQLParser.SUB:
                {
                this.state = 74;
                this.unaryOp();
                this.state = 75;
                this.vectorOperation(9);
                }
                break;
            case PromQLParser.NUMBER:
            case PromQLParser.STRING:
            case PromQLParser.AGGREGATION_OPERATOR:
            case PromQLParser.FUNCTION:
            case PromQLParser.LEFT_BRACE:
            case PromQLParser.LEFT_PAREN:
            case PromQLParser.METRIC_NAME:
                {
                this.state = 77;
                this.vector();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.context!.stop = this.tokenStream.LT(-1);
            this.state = 115;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 2, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    if (this.parseListeners != null) {
                        this.triggerExitRuleEvent();
                    }
                    previousContext = localContext;
                    {
                    this.state = 113;
                    this.errorHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this.tokenStream, 1, this.context) ) {
                    case 1:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 80;
                        if (!(this.precpred(this.context, 11))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 11)");
                        }
                        this.state = 81;
                        this.powOp();
                        this.state = 82;
                        this.vectorOperation(11);
                        }
                        break;
                    case 2:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 84;
                        if (!(this.precpred(this.context, 8))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 8)");
                        }
                        this.state = 85;
                        this.multOp();
                        this.state = 86;
                        this.vectorOperation(9);
                        }
                        break;
                    case 3:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 88;
                        if (!(this.precpred(this.context, 7))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 7)");
                        }
                        this.state = 89;
                        this.addOp();
                        this.state = 90;
                        this.vectorOperation(8);
                        }
                        break;
                    case 4:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 92;
                        if (!(this.precpred(this.context, 6))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 6)");
                        }
                        this.state = 93;
                        this.compareOp();
                        this.state = 94;
                        this.vectorOperation(7);
                        }
                        break;
                    case 5:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 96;
                        if (!(this.precpred(this.context, 5))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 5)");
                        }
                        this.state = 97;
                        this.andUnlessOp();
                        this.state = 98;
                        this.vectorOperation(6);
                        }
                        break;
                    case 6:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 100;
                        if (!(this.precpred(this.context, 4))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 4)");
                        }
                        this.state = 101;
                        this.orOp();
                        this.state = 102;
                        this.vectorOperation(5);
                        }
                        break;
                    case 7:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 104;
                        if (!(this.precpred(this.context, 3))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 3)");
                        }
                        this.state = 105;
                        this.vectorMatchOp();
                        this.state = 106;
                        this.vectorOperation(4);
                        }
                        break;
                    case 8:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 108;
                        if (!(this.precpred(this.context, 2))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 2)");
                        }
                        this.state = 109;
                        this.match(PromQLParser.AT);
                        this.state = 110;
                        this.vectorOperation(3);
                        }
                        break;
                    case 9:
                        {
                        localContext = new VectorOperationContext(parentContext, parentState);
                        this.pushNewRecursionContext(localContext, _startState, PromQLParser.RULE_vectorOperation);
                        this.state = 111;
                        if (!(this.precpred(this.context, 10))) {
                            throw this.createFailedPredicateException("this.precpred(this.context, 10)");
                        }
                        this.state = 112;
                        this.subqueryOp();
                        }
                        break;
                    }
                    }
                }
                this.state = 117;
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
            this.state = 118;
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
            this.state = 120;
            this.match(PromQLParser.POW);
            this.state = 122;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 121;
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
            this.state = 124;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 224) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
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
    public addOp(): AddOpContext {
        let localContext = new AddOpContext(this.context, this.state);
        this.enterRule(localContext, 10, PromQLParser.RULE_addOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 128;
            _la = this.tokenStream.LA(1);
            if(!(_la === 3 || _la === 4)) {
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
    public compareOp(): CompareOpContext {
        let localContext = new CompareOpContext(this.context, this.state);
        this.enterRule(localContext, 12, PromQLParser.RULE_compareOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 132;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 516096) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 134;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 28) {
                {
                this.state = 133;
                this.match(PromQLParser.BOOL);
                }
            }

            this.state = 137;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 23 || _la === 24) {
                {
                this.state = 136;
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
            this.state = 139;
            _la = this.tokenStream.LA(1);
            if(!(_la === 9 || _la === 11)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
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
    public orOp(): OrOpContext {
        let localContext = new OrOpContext(this.context, this.state);
        this.enterRule(localContext, 16, PromQLParser.RULE_orOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 143;
            this.match(PromQLParser.OR);
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
    public vectorMatchOp(): VectorMatchOpContext {
        let localContext = new VectorMatchOpContext(this.context, this.state);
        this.enterRule(localContext, 18, PromQLParser.RULE_vectorMatchOp);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 147;
            _la = this.tokenStream.LA(1);
            if(!(_la === 11 || _la === 23)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
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
    public subqueryOp(): SubqueryOpContext {
        let localContext = new SubqueryOpContext(this.context, this.state);
        this.enterRule(localContext, 20, PromQLParser.RULE_subqueryOp);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 151;
            this.match(PromQLParser.SUBQUERY_RANGE);
            this.state = 153;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 11, this.context) ) {
            case 1:
                {
                this.state = 152;
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
            this.state = 155;
            this.match(PromQLParser.OFFSET);
            this.state = 156;
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
            this.state = 165;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 12, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 158;
                this.function_();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 159;
                this.aggregation();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 160;
                this.instantSelector();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 161;
                this.matrixSelector();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 162;
                this.offset();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 163;
                this.literal();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 164;
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
            this.state = 167;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 168;
            this.vectorOperation(0);
            this.state = 169;
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
            this.state = 183;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.METRIC_NAME:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 171;
                this.match(PromQLParser.METRIC_NAME);
                this.state = 177;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 14, this.context) ) {
                case 1:
                    {
                    this.state = 172;
                    this.match(PromQLParser.LEFT_BRACE);
                    this.state = 174;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                    if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 2145390080) !== 0) || _la === 42 || _la === 43) {
                        {
                        this.state = 173;
                        this.labelMatcherList();
                        }
                    }

                    this.state = 176;
                    this.match(PromQLParser.RIGHT_BRACE);
                    }
                    break;
                }
                }
                break;
            case PromQLParser.LEFT_BRACE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 179;
                this.match(PromQLParser.LEFT_BRACE);
                this.state = 180;
                this.labelMatcherList();
                this.state = 181;
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
            this.state = 185;
            this.labelName();
            this.state = 186;
            this.labelMatcherOperator();
            this.state = 187;
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
            this.state = 189;
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
            this.state = 191;
            this.labelMatcher();
            this.state = 196;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 16, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 192;
                    this.match(PromQLParser.COMMA);
                    this.state = 193;
                    this.labelMatcher();
                    }
                    }
                }
                this.state = 198;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 16, this.context);
            }
            this.state = 200;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 37) {
                {
                this.state = 199;
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
            this.state = 202;
            this.instantSelector();
            this.state = 203;
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
            this.state = 213;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 18, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 205;
                this.instantSelector();
                this.state = 206;
                this.match(PromQLParser.OFFSET);
                this.state = 207;
                this.match(PromQLParser.DURATION);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 209;
                this.matrixSelector();
                this.state = 210;
                this.match(PromQLParser.OFFSET);
                this.state = 211;
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
    public function_(): Function_Context {
        let localContext = new Function_Context(this.context, this.state);
        this.enterRule(localContext, 40, PromQLParser.RULE_function_);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 215;
            this.match(PromQLParser.FUNCTION);
            this.state = 216;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 225;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3758096414) !== 0) || _la === 33 || _la === 42) {
                {
                this.state = 217;
                this.parameter();
                this.state = 222;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 37) {
                    {
                    {
                    this.state = 218;
                    this.match(PromQLParser.COMMA);
                    this.state = 219;
                    this.parameter();
                    }
                    }
                    this.state = 224;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 227;
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
            this.state = 231;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 21, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 229;
                this.literal();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 230;
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
            this.state = 233;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 242;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3758096414) !== 0) || _la === 33 || _la === 42) {
                {
                this.state = 234;
                this.parameter();
                this.state = 239;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 37) {
                    {
                    {
                    this.state = 235;
                    this.match(PromQLParser.COMMA);
                    this.state = 236;
                    this.parameter();
                    }
                    }
                    this.state = 241;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 244;
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
    public aggregation(): AggregationContext {
        let localContext = new AggregationContext(this.context, this.state);
        this.enterRule(localContext, 46, PromQLParser.RULE_aggregation);
        try {
            this.state = 261;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 26, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 246;
                this.match(PromQLParser.AGGREGATION_OPERATOR);
                this.state = 247;
                this.parameterList();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 248;
                this.match(PromQLParser.AGGREGATION_OPERATOR);
                this.state = 251;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PromQLParser.BY:
                    {
                    this.state = 249;
                    this.by();
                    }
                    break;
                case PromQLParser.WITHOUT:
                    {
                    this.state = 250;
                    this.without();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                this.state = 253;
                this.parameterList();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 255;
                this.match(PromQLParser.AGGREGATION_OPERATOR);
                this.state = 256;
                this.parameterList();
                this.state = 259;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PromQLParser.BY:
                    {
                    this.state = 257;
                    this.by();
                    }
                    break;
                case PromQLParser.WITHOUT:
                    {
                    this.state = 258;
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
        this.enterRule(localContext, 48, PromQLParser.RULE_by);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 263;
            this.match(PromQLParser.BY);
            this.state = 264;
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
        this.enterRule(localContext, 50, PromQLParser.RULE_without);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 266;
            this.match(PromQLParser.WITHOUT);
            this.state = 267;
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
    public grouping(): GroupingContext {
        let localContext = new GroupingContext(this.context, this.state);
        this.enterRule(localContext, 52, PromQLParser.RULE_grouping);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 271;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.ON:
                {
                this.state = 269;
                this.on_();
                }
                break;
            case PromQLParser.IGNORING:
                {
                this.state = 270;
                this.ignoring();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 275;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PromQLParser.GROUP_LEFT:
                {
                this.state = 273;
                this.groupLeft();
                }
                break;
            case PromQLParser.GROUP_RIGHT:
                {
                this.state = 274;
                this.groupRight();
                }
                break;
            case PromQLParser.NUMBER:
            case PromQLParser.STRING:
            case PromQLParser.ADD:
            case PromQLParser.SUB:
            case PromQLParser.AGGREGATION_OPERATOR:
            case PromQLParser.FUNCTION:
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
        this.enterRule(localContext, 54, PromQLParser.RULE_on_);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 277;
            this.match(PromQLParser.ON);
            this.state = 278;
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
        this.enterRule(localContext, 56, PromQLParser.RULE_ignoring);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 280;
            this.match(PromQLParser.IGNORING);
            this.state = 281;
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
        this.enterRule(localContext, 58, PromQLParser.RULE_groupLeft);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 283;
            this.match(PromQLParser.GROUP_LEFT);
            this.state = 285;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 29, this.context) ) {
            case 1:
                {
                this.state = 284;
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
        this.enterRule(localContext, 60, PromQLParser.RULE_groupRight);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 287;
            this.match(PromQLParser.GROUP_RIGHT);
            this.state = 289;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 30, this.context) ) {
            case 1:
                {
                this.state = 288;
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
        this.enterRule(localContext, 62, PromQLParser.RULE_labelName);
        try {
            this.state = 294;
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
            case PromQLParser.AGGREGATION_OPERATOR:
            case PromQLParser.FUNCTION:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 291;
                this.keyword();
                }
                break;
            case PromQLParser.METRIC_NAME:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 292;
                this.match(PromQLParser.METRIC_NAME);
                }
                break;
            case PromQLParser.LABEL_NAME:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 293;
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
        this.enterRule(localContext, 64, PromQLParser.RULE_labelNameList);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 296;
            this.match(PromQLParser.LEFT_PAREN);
            this.state = 305;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 2145390080) !== 0) || _la === 42 || _la === 43) {
                {
                this.state = 297;
                this.labelName();
                this.state = 302;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 37) {
                    {
                    {
                    this.state = 298;
                    this.match(PromQLParser.COMMA);
                    this.state = 299;
                    this.labelName();
                    }
                    }
                    this.state = 304;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 307;
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
        this.enterRule(localContext, 66, PromQLParser.RULE_keyword);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 309;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 2145390080) !== 0))) {
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
    public literal(): LiteralContext {
        let localContext = new LiteralContext(this.context, this.state);
        this.enterRule(localContext, 68, PromQLParser.RULE_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 311;
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
        4,1,45,314,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,33,
        7,33,2,34,7,34,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,3,1,79,8,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
        1,114,8,1,10,1,12,1,117,9,1,1,2,1,2,1,3,1,3,3,3,123,8,3,1,4,1,4,
        3,4,127,8,4,1,5,1,5,3,5,131,8,5,1,6,1,6,3,6,135,8,6,1,6,3,6,138,
        8,6,1,7,1,7,3,7,142,8,7,1,8,1,8,3,8,146,8,8,1,9,1,9,3,9,150,8,9,
        1,10,1,10,3,10,154,8,10,1,11,1,11,1,11,1,12,1,12,1,12,1,12,1,12,
        1,12,1,12,3,12,166,8,12,1,13,1,13,1,13,1,13,1,14,1,14,1,14,3,14,
        175,8,14,1,14,3,14,178,8,14,1,14,1,14,1,14,1,14,3,14,184,8,14,1,
        15,1,15,1,15,1,15,1,16,1,16,1,17,1,17,1,17,5,17,195,8,17,10,17,12,
        17,198,9,17,1,17,3,17,201,8,17,1,18,1,18,1,18,1,19,1,19,1,19,1,19,
        1,19,1,19,1,19,1,19,3,19,214,8,19,1,20,1,20,1,20,1,20,1,20,5,20,
        221,8,20,10,20,12,20,224,9,20,3,20,226,8,20,1,20,1,20,1,21,1,21,
        3,21,232,8,21,1,22,1,22,1,22,1,22,5,22,238,8,22,10,22,12,22,241,
        9,22,3,22,243,8,22,1,22,1,22,1,23,1,23,1,23,1,23,1,23,3,23,252,8,
        23,1,23,1,23,1,23,1,23,1,23,1,23,3,23,260,8,23,3,23,262,8,23,1,24,
        1,24,1,24,1,25,1,25,1,25,1,26,1,26,3,26,272,8,26,1,26,1,26,3,26,
        276,8,26,1,27,1,27,1,27,1,28,1,28,1,28,1,29,1,29,3,29,286,8,29,1,
        30,1,30,3,30,290,8,30,1,31,1,31,1,31,3,31,295,8,31,1,32,1,32,1,32,
        1,32,5,32,301,8,32,10,32,12,32,304,9,32,3,32,306,8,32,1,32,1,32,
        1,33,1,33,1,34,1,34,1,34,0,1,2,35,0,2,4,6,8,10,12,14,16,18,20,22,
        24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,
        68,0,8,1,0,3,4,1,0,5,7,1,0,13,18,2,0,9,9,11,11,2,0,11,11,23,23,3,
        0,12,12,14,14,19,20,2,0,9,11,21,30,1,0,1,2,327,0,70,1,0,0,0,2,78,
        1,0,0,0,4,118,1,0,0,0,6,120,1,0,0,0,8,124,1,0,0,0,10,128,1,0,0,0,
        12,132,1,0,0,0,14,139,1,0,0,0,16,143,1,0,0,0,18,147,1,0,0,0,20,151,
        1,0,0,0,22,155,1,0,0,0,24,165,1,0,0,0,26,167,1,0,0,0,28,183,1,0,
        0,0,30,185,1,0,0,0,32,189,1,0,0,0,34,191,1,0,0,0,36,202,1,0,0,0,
        38,213,1,0,0,0,40,215,1,0,0,0,42,231,1,0,0,0,44,233,1,0,0,0,46,261,
        1,0,0,0,48,263,1,0,0,0,50,266,1,0,0,0,52,271,1,0,0,0,54,277,1,0,
        0,0,56,280,1,0,0,0,58,283,1,0,0,0,60,287,1,0,0,0,62,294,1,0,0,0,
        64,296,1,0,0,0,66,309,1,0,0,0,68,311,1,0,0,0,70,71,3,2,1,0,71,72,
        5,0,0,1,72,1,1,0,0,0,73,74,6,1,-1,0,74,75,3,4,2,0,75,76,3,2,1,9,
        76,79,1,0,0,0,77,79,3,24,12,0,78,73,1,0,0,0,78,77,1,0,0,0,79,115,
        1,0,0,0,80,81,10,11,0,0,81,82,3,6,3,0,82,83,3,2,1,11,83,114,1,0,
        0,0,84,85,10,8,0,0,85,86,3,8,4,0,86,87,3,2,1,9,87,114,1,0,0,0,88,
        89,10,7,0,0,89,90,3,10,5,0,90,91,3,2,1,8,91,114,1,0,0,0,92,93,10,
        6,0,0,93,94,3,12,6,0,94,95,3,2,1,7,95,114,1,0,0,0,96,97,10,5,0,0,
        97,98,3,14,7,0,98,99,3,2,1,6,99,114,1,0,0,0,100,101,10,4,0,0,101,
        102,3,16,8,0,102,103,3,2,1,5,103,114,1,0,0,0,104,105,10,3,0,0,105,
        106,3,18,9,0,106,107,3,2,1,4,107,114,1,0,0,0,108,109,10,2,0,0,109,
        110,5,38,0,0,110,114,3,2,1,3,111,112,10,10,0,0,112,114,3,20,10,0,
        113,80,1,0,0,0,113,84,1,0,0,0,113,88,1,0,0,0,113,92,1,0,0,0,113,
        96,1,0,0,0,113,100,1,0,0,0,113,104,1,0,0,0,113,108,1,0,0,0,113,111,
        1,0,0,0,114,117,1,0,0,0,115,113,1,0,0,0,115,116,1,0,0,0,116,3,1,
        0,0,0,117,115,1,0,0,0,118,119,7,0,0,0,119,5,1,0,0,0,120,122,5,8,
        0,0,121,123,3,52,26,0,122,121,1,0,0,0,122,123,1,0,0,0,123,7,1,0,
        0,0,124,126,7,1,0,0,125,127,3,52,26,0,126,125,1,0,0,0,126,127,1,
        0,0,0,127,9,1,0,0,0,128,130,7,0,0,0,129,131,3,52,26,0,130,129,1,
        0,0,0,130,131,1,0,0,0,131,11,1,0,0,0,132,134,7,2,0,0,133,135,5,28,
        0,0,134,133,1,0,0,0,134,135,1,0,0,0,135,137,1,0,0,0,136,138,3,52,
        26,0,137,136,1,0,0,0,137,138,1,0,0,0,138,13,1,0,0,0,139,141,7,3,
        0,0,140,142,3,52,26,0,141,140,1,0,0,0,141,142,1,0,0,0,142,15,1,0,
        0,0,143,145,5,10,0,0,144,146,3,52,26,0,145,144,1,0,0,0,145,146,1,
        0,0,0,146,17,1,0,0,0,147,149,7,4,0,0,148,150,3,52,26,0,149,148,1,
        0,0,0,149,150,1,0,0,0,150,19,1,0,0,0,151,153,5,39,0,0,152,154,3,
        22,11,0,153,152,1,0,0,0,153,154,1,0,0,0,154,21,1,0,0,0,155,156,5,
        27,0,0,156,157,5,41,0,0,157,23,1,0,0,0,158,166,3,40,20,0,159,166,
        3,46,23,0,160,166,3,28,14,0,161,166,3,36,18,0,162,166,3,38,19,0,
        163,166,3,68,34,0,164,166,3,26,13,0,165,158,1,0,0,0,165,159,1,0,
        0,0,165,160,1,0,0,0,165,161,1,0,0,0,165,162,1,0,0,0,165,163,1,0,
        0,0,165,164,1,0,0,0,166,25,1,0,0,0,167,168,5,33,0,0,168,169,3,2,
        1,0,169,170,5,34,0,0,170,27,1,0,0,0,171,177,5,42,0,0,172,174,5,31,
        0,0,173,175,3,34,17,0,174,173,1,0,0,0,174,175,1,0,0,0,175,176,1,
        0,0,0,176,178,5,32,0,0,177,172,1,0,0,0,177,178,1,0,0,0,178,184,1,
        0,0,0,179,180,5,31,0,0,180,181,3,34,17,0,181,182,5,32,0,0,182,184,
        1,0,0,0,183,171,1,0,0,0,183,179,1,0,0,0,184,29,1,0,0,0,185,186,3,
        62,31,0,186,187,3,32,16,0,187,188,5,2,0,0,188,31,1,0,0,0,189,190,
        7,5,0,0,190,33,1,0,0,0,191,196,3,30,15,0,192,193,5,37,0,0,193,195,
        3,30,15,0,194,192,1,0,0,0,195,198,1,0,0,0,196,194,1,0,0,0,196,197,
        1,0,0,0,197,200,1,0,0,0,198,196,1,0,0,0,199,201,5,37,0,0,200,199,
        1,0,0,0,200,201,1,0,0,0,201,35,1,0,0,0,202,203,3,28,14,0,203,204,
        5,40,0,0,204,37,1,0,0,0,205,206,3,28,14,0,206,207,5,27,0,0,207,208,
        5,41,0,0,208,214,1,0,0,0,209,210,3,36,18,0,210,211,5,27,0,0,211,
        212,5,41,0,0,212,214,1,0,0,0,213,205,1,0,0,0,213,209,1,0,0,0,214,
        39,1,0,0,0,215,216,5,30,0,0,216,225,5,33,0,0,217,222,3,42,21,0,218,
        219,5,37,0,0,219,221,3,42,21,0,220,218,1,0,0,0,221,224,1,0,0,0,222,
        220,1,0,0,0,222,223,1,0,0,0,223,226,1,0,0,0,224,222,1,0,0,0,225,
        217,1,0,0,0,225,226,1,0,0,0,226,227,1,0,0,0,227,228,5,34,0,0,228,
        41,1,0,0,0,229,232,3,68,34,0,230,232,3,2,1,0,231,229,1,0,0,0,231,
        230,1,0,0,0,232,43,1,0,0,0,233,242,5,33,0,0,234,239,3,42,21,0,235,
        236,5,37,0,0,236,238,3,42,21,0,237,235,1,0,0,0,238,241,1,0,0,0,239,
        237,1,0,0,0,239,240,1,0,0,0,240,243,1,0,0,0,241,239,1,0,0,0,242,
        234,1,0,0,0,242,243,1,0,0,0,243,244,1,0,0,0,244,245,5,34,0,0,245,
        45,1,0,0,0,246,247,5,29,0,0,247,262,3,44,22,0,248,251,5,29,0,0,249,
        252,3,48,24,0,250,252,3,50,25,0,251,249,1,0,0,0,251,250,1,0,0,0,
        252,253,1,0,0,0,253,254,3,44,22,0,254,262,1,0,0,0,255,256,5,29,0,
        0,256,259,3,44,22,0,257,260,3,48,24,0,258,260,3,50,25,0,259,257,
        1,0,0,0,259,258,1,0,0,0,260,262,1,0,0,0,261,246,1,0,0,0,261,248,
        1,0,0,0,261,255,1,0,0,0,262,47,1,0,0,0,263,264,5,21,0,0,264,265,
        3,64,32,0,265,49,1,0,0,0,266,267,5,22,0,0,267,268,3,64,32,0,268,
        51,1,0,0,0,269,272,3,54,27,0,270,272,3,56,28,0,271,269,1,0,0,0,271,
        270,1,0,0,0,272,275,1,0,0,0,273,276,3,58,29,0,274,276,3,60,30,0,
        275,273,1,0,0,0,275,274,1,0,0,0,275,276,1,0,0,0,276,53,1,0,0,0,277,
        278,5,23,0,0,278,279,3,64,32,0,279,55,1,0,0,0,280,281,5,24,0,0,281,
        282,3,64,32,0,282,57,1,0,0,0,283,285,5,25,0,0,284,286,3,64,32,0,
        285,284,1,0,0,0,285,286,1,0,0,0,286,59,1,0,0,0,287,289,5,26,0,0,
        288,290,3,64,32,0,289,288,1,0,0,0,289,290,1,0,0,0,290,61,1,0,0,0,
        291,295,3,66,33,0,292,295,5,42,0,0,293,295,5,43,0,0,294,291,1,0,
        0,0,294,292,1,0,0,0,294,293,1,0,0,0,295,63,1,0,0,0,296,305,5,33,
        0,0,297,302,3,62,31,0,298,299,5,37,0,0,299,301,3,62,31,0,300,298,
        1,0,0,0,301,304,1,0,0,0,302,300,1,0,0,0,302,303,1,0,0,0,303,306,
        1,0,0,0,304,302,1,0,0,0,305,297,1,0,0,0,305,306,1,0,0,0,306,307,
        1,0,0,0,307,308,5,34,0,0,308,65,1,0,0,0,309,310,7,6,0,0,310,67,1,
        0,0,0,311,312,7,7,0,0,312,69,1,0,0,0,34,78,113,115,122,126,130,134,
        137,141,145,149,153,165,174,177,183,196,200,213,222,225,231,239,
        242,251,259,261,271,275,285,289,294,302,305
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
    public function_(): Function_Context | null {
        return this.getRuleContext(0, Function_Context);
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


export class Function_Context extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FUNCTION(): antlr.TerminalNode {
        return this.getToken(PromQLParser.FUNCTION, 0)!;
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
        return PromQLParser.RULE_function_;
    }
    public override accept<Result>(visitor: PromQLParserVisitor<Result>): Result | null {
        if (visitor.visitFunction_) {
            return visitor.visitFunction_(this);
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


export class AggregationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public AGGREGATION_OPERATOR(): antlr.TerminalNode {
        return this.getToken(PromQLParser.AGGREGATION_OPERATOR, 0)!;
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
    public AGGREGATION_OPERATOR(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.AGGREGATION_OPERATOR, 0);
    }
    public FUNCTION(): antlr.TerminalNode | null {
        return this.getToken(PromQLParser.FUNCTION, 0);
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
