// Generated from ./src/plugins/data/public/antlr/dql/grammar/DQLParser.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { DQLParserVisitor } from "./DQLParserVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class DQLParser extends antlr.Parser {
    public static readonly OR = 1;
    public static readonly AND = 2;
    public static readonly NOT = 3;
    public static readonly GT = 4;
    public static readonly LT = 5;
    public static readonly GE = 6;
    public static readonly LE = 7;
    public static readonly EQ = 8;
    public static readonly LPAREN = 9;
    public static readonly RPAREN = 10;
    public static readonly PHRASE = 11;
    public static readonly ID = 12;
    public static readonly WS = 13;
    public static readonly RULE_query = 0;
    public static readonly RULE_operatorExpression = 1;
    public static readonly RULE_booleanOperator = 2;
    public static readonly RULE_notExpression = 3;
    public static readonly RULE_primaryExpression = 4;
    public static readonly RULE_comparisonExpression = 5;
    public static readonly RULE_keyValueExpression = 6;
    public static readonly RULE_tokenSearch = 7;
    public static readonly RULE_groupExpression = 8;
    public static readonly RULE_groupContent = 9;
    public static readonly RULE_field = 10;
    public static readonly RULE_value = 11;
    public static readonly RULE_comparisonOperator = 12;

    public static readonly literalNames = [
        null, null, null, null, "'>'", "'<'", "'>='", "'<='", "':'", "'('", 
        "')'"
    ];

    public static readonly symbolicNames = [
        null, "OR", "AND", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", 
        "RPAREN", "PHRASE", "ID", "WS"
    ];
    public static readonly ruleNames = [
        "query", "operatorExpression", "booleanOperator", "notExpression", 
        "primaryExpression", "comparisonExpression", "keyValueExpression", 
        "tokenSearch", "groupExpression", "groupContent", "field", "value", 
        "comparisonOperator",
    ];

    public get grammarFileName(): string { return "DQLParser.g4"; }
    public get literalNames(): (string | null)[] { return DQLParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return DQLParser.symbolicNames; }
    public get ruleNames(): string[] { return DQLParser.ruleNames; }
    public get serializedATN(): number[] { return DQLParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, DQLParser._ATN, DQLParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public query(): QueryContext {
        let localContext = new QueryContext(this.context, this.state);
        this.enterRule(localContext, 0, DQLParser.RULE_query);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 26;
            this.operatorExpression();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public operatorExpression(): OperatorExpressionContext {
        let localContext = new OperatorExpressionContext(this.context, this.state);
        this.enterRule(localContext, 2, DQLParser.RULE_operatorExpression);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 28;
            this.notExpression();
            this.state = 34;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1 || _la === 2) {
                {
                {
                this.state = 29;
                this.booleanOperator();
                this.state = 30;
                this.notExpression();
                }
                }
                this.state = 36;
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
    public booleanOperator(): BooleanOperatorContext {
        let localContext = new BooleanOperatorContext(this.context, this.state);
        this.enterRule(localContext, 4, DQLParser.RULE_booleanOperator);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 37;
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
    public notExpression(): NotExpressionContext {
        let localContext = new NotExpressionContext(this.context, this.state);
        this.enterRule(localContext, 6, DQLParser.RULE_notExpression);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 40;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 3) {
                {
                this.state = 39;
                this.match(DQLParser.NOT);
                }
            }

            this.state = 42;
            this.primaryExpression();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 8, DQLParser.RULE_primaryExpression);
        try {
            this.state = 51;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 2, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 44;
                this.match(DQLParser.LPAREN);
                this.state = 45;
                this.query();
                this.state = 46;
                this.match(DQLParser.RPAREN);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 48;
                this.comparisonExpression();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 49;
                this.keyValueExpression();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 50;
                this.tokenSearch();
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
    public comparisonExpression(): ComparisonExpressionContext {
        let localContext = new ComparisonExpressionContext(this.context, this.state);
        this.enterRule(localContext, 10, DQLParser.RULE_comparisonExpression);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 53;
            this.field();
            this.state = 54;
            this.comparisonOperator();
            this.state = 55;
            this.value();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public keyValueExpression(): KeyValueExpressionContext {
        let localContext = new KeyValueExpressionContext(this.context, this.state);
        this.enterRule(localContext, 12, DQLParser.RULE_keyValueExpression);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 57;
            this.field();
            this.state = 58;
            this.match(DQLParser.EQ);
            this.state = 61;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case DQLParser.PHRASE:
            case DQLParser.ID:
                {
                this.state = 59;
                this.value();
                }
                break;
            case DQLParser.LPAREN:
                {
                this.state = 60;
                this.groupExpression();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
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
    public tokenSearch(): TokenSearchContext {
        let localContext = new TokenSearchContext(this.context, this.state);
        this.enterRule(localContext, 14, DQLParser.RULE_tokenSearch);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 63;
            this.match(DQLParser.ID);
            this.state = 67;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 12) {
                {
                {
                this.state = 64;
                this.match(DQLParser.ID);
                }
                }
                this.state = 69;
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
    public groupExpression(): GroupExpressionContext {
        let localContext = new GroupExpressionContext(this.context, this.state);
        this.enterRule(localContext, 16, DQLParser.RULE_groupExpression);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 70;
            this.match(DQLParser.LPAREN);
            this.state = 72;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 3) {
                {
                this.state = 71;
                this.match(DQLParser.NOT);
                }
            }

            this.state = 74;
            this.groupContent();
            this.state = 82;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1 || _la === 2) {
                {
                {
                this.state = 75;
                _la = this.tokenStream.LA(1);
                if(!(_la === 1 || _la === 2)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 77;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 3) {
                    {
                    this.state = 76;
                    this.match(DQLParser.NOT);
                    }
                }

                this.state = 79;
                this.groupContent();
                }
                }
                this.state = 84;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 85;
            this.match(DQLParser.RPAREN);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public groupContent(): GroupContentContext {
        let localContext = new GroupContentContext(this.context, this.state);
        this.enterRule(localContext, 18, DQLParser.RULE_groupContent);
        try {
            this.state = 89;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case DQLParser.LPAREN:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 87;
                this.groupExpression();
                }
                break;
            case DQLParser.PHRASE:
            case DQLParser.ID:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 88;
                this.value();
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
    public field(): FieldContext {
        let localContext = new FieldContext(this.context, this.state);
        this.enterRule(localContext, 20, DQLParser.RULE_field);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 91;
            this.match(DQLParser.ID);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public value(): ValueContext {
        let localContext = new ValueContext(this.context, this.state);
        this.enterRule(localContext, 22, DQLParser.RULE_value);
        try {
            this.state = 95;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case DQLParser.PHRASE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 93;
                this.match(DQLParser.PHRASE);
                }
                break;
            case DQLParser.ID:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 94;
                this.tokenSearch();
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
    public comparisonOperator(): ComparisonOperatorContext {
        let localContext = new ComparisonOperatorContext(this.context, this.state);
        this.enterRule(localContext, 24, DQLParser.RULE_comparisonOperator);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 97;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 240) !== 0))) {
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

    public static readonly _serializedATN: number[] = [
        4,1,13,100,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,1,0,1,0,
        1,1,1,1,1,1,1,1,5,1,33,8,1,10,1,12,1,36,9,1,1,2,1,2,1,3,3,3,41,8,
        3,1,3,1,3,1,4,1,4,1,4,1,4,1,4,1,4,1,4,3,4,52,8,4,1,5,1,5,1,5,1,5,
        1,6,1,6,1,6,1,6,3,6,62,8,6,1,7,1,7,5,7,66,8,7,10,7,12,7,69,9,7,1,
        8,1,8,3,8,73,8,8,1,8,1,8,1,8,3,8,78,8,8,1,8,5,8,81,8,8,10,8,12,8,
        84,9,8,1,8,1,8,1,9,1,9,3,9,90,8,9,1,10,1,10,1,11,1,11,3,11,96,8,
        11,1,12,1,12,1,12,0,0,13,0,2,4,6,8,10,12,14,16,18,20,22,24,0,2,1,
        0,1,2,1,0,4,7,98,0,26,1,0,0,0,2,28,1,0,0,0,4,37,1,0,0,0,6,40,1,0,
        0,0,8,51,1,0,0,0,10,53,1,0,0,0,12,57,1,0,0,0,14,63,1,0,0,0,16,70,
        1,0,0,0,18,89,1,0,0,0,20,91,1,0,0,0,22,95,1,0,0,0,24,97,1,0,0,0,
        26,27,3,2,1,0,27,1,1,0,0,0,28,34,3,6,3,0,29,30,3,4,2,0,30,31,3,6,
        3,0,31,33,1,0,0,0,32,29,1,0,0,0,33,36,1,0,0,0,34,32,1,0,0,0,34,35,
        1,0,0,0,35,3,1,0,0,0,36,34,1,0,0,0,37,38,7,0,0,0,38,5,1,0,0,0,39,
        41,5,3,0,0,40,39,1,0,0,0,40,41,1,0,0,0,41,42,1,0,0,0,42,43,3,8,4,
        0,43,7,1,0,0,0,44,45,5,9,0,0,45,46,3,0,0,0,46,47,5,10,0,0,47,52,
        1,0,0,0,48,52,3,10,5,0,49,52,3,12,6,0,50,52,3,14,7,0,51,44,1,0,0,
        0,51,48,1,0,0,0,51,49,1,0,0,0,51,50,1,0,0,0,52,9,1,0,0,0,53,54,3,
        20,10,0,54,55,3,24,12,0,55,56,3,22,11,0,56,11,1,0,0,0,57,58,3,20,
        10,0,58,61,5,8,0,0,59,62,3,22,11,0,60,62,3,16,8,0,61,59,1,0,0,0,
        61,60,1,0,0,0,62,13,1,0,0,0,63,67,5,12,0,0,64,66,5,12,0,0,65,64,
        1,0,0,0,66,69,1,0,0,0,67,65,1,0,0,0,67,68,1,0,0,0,68,15,1,0,0,0,
        69,67,1,0,0,0,70,72,5,9,0,0,71,73,5,3,0,0,72,71,1,0,0,0,72,73,1,
        0,0,0,73,74,1,0,0,0,74,82,3,18,9,0,75,77,7,0,0,0,76,78,5,3,0,0,77,
        76,1,0,0,0,77,78,1,0,0,0,78,79,1,0,0,0,79,81,3,18,9,0,80,75,1,0,
        0,0,81,84,1,0,0,0,82,80,1,0,0,0,82,83,1,0,0,0,83,85,1,0,0,0,84,82,
        1,0,0,0,85,86,5,10,0,0,86,17,1,0,0,0,87,90,3,16,8,0,88,90,3,22,11,
        0,89,87,1,0,0,0,89,88,1,0,0,0,90,19,1,0,0,0,91,92,5,12,0,0,92,21,
        1,0,0,0,93,96,5,11,0,0,94,96,3,14,7,0,95,93,1,0,0,0,95,94,1,0,0,
        0,96,23,1,0,0,0,97,98,7,1,0,0,98,25,1,0,0,0,10,34,40,51,61,67,72,
        77,82,89,95
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!DQLParser.__ATN) {
            DQLParser.__ATN = new antlr.ATNDeserializer().deserialize(DQLParser._serializedATN);
        }

        return DQLParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(DQLParser.literalNames, DQLParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return DQLParser.vocabulary;
    }

    private static readonly decisionsToDFA = DQLParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class QueryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public operatorExpression(): OperatorExpressionContext {
        return this.getRuleContext(0, OperatorExpressionContext)!;
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_query;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitQuery) {
            return visitor.visitQuery(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class OperatorExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public notExpression(): NotExpressionContext[];
    public notExpression(i: number): NotExpressionContext | null;
    public notExpression(i?: number): NotExpressionContext[] | NotExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(NotExpressionContext);
        }

        return this.getRuleContext(i, NotExpressionContext);
    }
    public booleanOperator(): BooleanOperatorContext[];
    public booleanOperator(i: number): BooleanOperatorContext | null;
    public booleanOperator(i?: number): BooleanOperatorContext[] | BooleanOperatorContext | null {
        if (i === undefined) {
            return this.getRuleContexts(BooleanOperatorContext);
        }

        return this.getRuleContext(i, BooleanOperatorContext);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_operatorExpression;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitOperatorExpression) {
            return visitor.visitOperatorExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BooleanOperatorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public OR(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.OR, 0);
    }
    public AND(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.AND, 0);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_booleanOperator;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitBooleanOperator) {
            return visitor.visitBooleanOperator(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NotExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public primaryExpression(): PrimaryExpressionContext {
        return this.getRuleContext(0, PrimaryExpressionContext)!;
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.NOT, 0);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_notExpression;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitNotExpression) {
            return visitor.visitNotExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class PrimaryExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LPAREN(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.LPAREN, 0);
    }
    public query(): QueryContext | null {
        return this.getRuleContext(0, QueryContext);
    }
    public RPAREN(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.RPAREN, 0);
    }
    public comparisonExpression(): ComparisonExpressionContext | null {
        return this.getRuleContext(0, ComparisonExpressionContext);
    }
    public keyValueExpression(): KeyValueExpressionContext | null {
        return this.getRuleContext(0, KeyValueExpressionContext);
    }
    public tokenSearch(): TokenSearchContext | null {
        return this.getRuleContext(0, TokenSearchContext);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_primaryExpression;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitPrimaryExpression) {
            return visitor.visitPrimaryExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ComparisonExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public field(): FieldContext {
        return this.getRuleContext(0, FieldContext)!;
    }
    public comparisonOperator(): ComparisonOperatorContext {
        return this.getRuleContext(0, ComparisonOperatorContext)!;
    }
    public value(): ValueContext {
        return this.getRuleContext(0, ValueContext)!;
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_comparisonExpression;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitComparisonExpression) {
            return visitor.visitComparisonExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class KeyValueExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public field(): FieldContext {
        return this.getRuleContext(0, FieldContext)!;
    }
    public EQ(): antlr.TerminalNode {
        return this.getToken(DQLParser.EQ, 0)!;
    }
    public value(): ValueContext | null {
        return this.getRuleContext(0, ValueContext);
    }
    public groupExpression(): GroupExpressionContext | null {
        return this.getRuleContext(0, GroupExpressionContext);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_keyValueExpression;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitKeyValueExpression) {
            return visitor.visitKeyValueExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TokenSearchContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ID(): antlr.TerminalNode[];
    public ID(i: number): antlr.TerminalNode | null;
    public ID(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(DQLParser.ID);
    	} else {
    		return this.getToken(DQLParser.ID, i);
    	}
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_tokenSearch;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitTokenSearch) {
            return visitor.visitTokenSearch(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GroupExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LPAREN(): antlr.TerminalNode {
        return this.getToken(DQLParser.LPAREN, 0)!;
    }
    public groupContent(): GroupContentContext[];
    public groupContent(i: number): GroupContentContext | null;
    public groupContent(i?: number): GroupContentContext[] | GroupContentContext | null {
        if (i === undefined) {
            return this.getRuleContexts(GroupContentContext);
        }

        return this.getRuleContext(i, GroupContentContext);
    }
    public RPAREN(): antlr.TerminalNode {
        return this.getToken(DQLParser.RPAREN, 0)!;
    }
    public NOT(): antlr.TerminalNode[];
    public NOT(i: number): antlr.TerminalNode | null;
    public NOT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(DQLParser.NOT);
    	} else {
    		return this.getToken(DQLParser.NOT, i);
    	}
    }
    public OR(): antlr.TerminalNode[];
    public OR(i: number): antlr.TerminalNode | null;
    public OR(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(DQLParser.OR);
    	} else {
    		return this.getToken(DQLParser.OR, i);
    	}
    }
    public AND(): antlr.TerminalNode[];
    public AND(i: number): antlr.TerminalNode | null;
    public AND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(DQLParser.AND);
    	} else {
    		return this.getToken(DQLParser.AND, i);
    	}
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_groupExpression;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitGroupExpression) {
            return visitor.visitGroupExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class GroupContentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public groupExpression(): GroupExpressionContext | null {
        return this.getRuleContext(0, GroupExpressionContext);
    }
    public value(): ValueContext | null {
        return this.getRuleContext(0, ValueContext);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_groupContent;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitGroupContent) {
            return visitor.visitGroupContent(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FieldContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ID(): antlr.TerminalNode {
        return this.getToken(DQLParser.ID, 0)!;
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_field;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitField) {
            return visitor.visitField(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PHRASE(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.PHRASE, 0);
    }
    public tokenSearch(): TokenSearchContext | null {
        return this.getRuleContext(0, TokenSearchContext);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_value;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitValue) {
            return visitor.visitValue(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ComparisonOperatorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public GT(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.GT, 0);
    }
    public LT(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.LT, 0);
    }
    public GE(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.GE, 0);
    }
    public LE(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.LE, 0);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_comparisonOperator;
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitComparisonOperator) {
            return visitor.visitComparisonOperator(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
