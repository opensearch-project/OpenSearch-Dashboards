// Generated from grammar/DQLParser.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { DQLParserListener } from "./DQLParserListener.js";
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
    public static readonly DOT = 11;
    public static readonly PHRASE = 12;
    public static readonly NUMBER = 13;
    public static readonly IDENTIFIER = 14;
    public static readonly WS = 15;
    public static readonly RULE_query = 0;
    public static readonly RULE_orExpression = 1;
    public static readonly RULE_andExpression = 2;
    public static readonly RULE_notExpression = 3;
    public static readonly RULE_primaryExpression = 4;
    public static readonly RULE_comparisonExpression = 5;
    public static readonly RULE_fieldExpression = 6;
    public static readonly RULE_termSearch = 7;
    public static readonly RULE_groupExpression = 8;
    public static readonly RULE_groupContent = 9;
    public static readonly RULE_field = 10;
    public static readonly RULE_rangeValue = 11;
    public static readonly RULE_value = 12;
    public static readonly RULE_comparisonOperator = 13;

    public static readonly literalNames = [
        null, null, null, null, "'>'", "'<'", "'>='", "'<='", "':'", "'('", 
        "')'", "'.'"
    ];

    public static readonly symbolicNames = [
        null, "OR", "AND", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", 
        "RPAREN", "DOT", "PHRASE", "NUMBER", "IDENTIFIER", "WS"
    ];
    public static readonly ruleNames = [
        "query", "orExpression", "andExpression", "notExpression", "primaryExpression", 
        "comparisonExpression", "fieldExpression", "termSearch", "groupExpression", 
        "groupContent", "field", "rangeValue", "value", "comparisonOperator",
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
            this.state = 28;
            this.orExpression();
            this.state = 29;
            this.match(DQLParser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public orExpression(): OrExpressionContext {
        let localContext = new OrExpressionContext(this.context, this.state);
        this.enterRule(localContext, 2, DQLParser.RULE_orExpression);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 31;
            this.andExpression();
            this.state = 36;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1) {
                {
                {
                this.state = 32;
                this.match(DQLParser.OR);
                this.state = 33;
                this.andExpression();
                }
                }
                this.state = 38;
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
    public andExpression(): AndExpressionContext {
        let localContext = new AndExpressionContext(this.context, this.state);
        this.enterRule(localContext, 4, DQLParser.RULE_andExpression);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 39;
            this.notExpression();
            this.state = 44;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 2) {
                {
                {
                this.state = 40;
                this.match(DQLParser.AND);
                this.state = 41;
                this.notExpression();
                }
                }
                this.state = 46;
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
    public notExpression(): NotExpressionContext {
        let localContext = new NotExpressionContext(this.context, this.state);
        this.enterRule(localContext, 6, DQLParser.RULE_notExpression);
        try {
            this.state = 50;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case DQLParser.NOT:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 47;
                this.match(DQLParser.NOT);
                this.state = 48;
                this.notExpression();
                }
                break;
            case DQLParser.LPAREN:
            case DQLParser.IDENTIFIER:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 49;
                this.primaryExpression();
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
    public primaryExpression(): PrimaryExpressionContext {
        let localContext = new PrimaryExpressionContext(this.context, this.state);
        this.enterRule(localContext, 8, DQLParser.RULE_primaryExpression);
        try {
            this.state = 59;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 52;
                this.match(DQLParser.LPAREN);
                this.state = 53;
                this.query();
                this.state = 54;
                this.match(DQLParser.RPAREN);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 56;
                this.comparisonExpression();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 57;
                this.fieldExpression();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 58;
                this.termSearch();
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
            this.state = 61;
            this.field();
            this.state = 62;
            this.comparisonOperator();
            this.state = 63;
            this.rangeValue();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 12, DQLParser.RULE_fieldExpression);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 65;
            this.field();
            this.state = 66;
            this.match(DQLParser.EQ);
            this.state = 67;
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
    public termSearch(): TermSearchContext {
        let localContext = new TermSearchContext(this.context, this.state);
        this.enterRule(localContext, 14, DQLParser.RULE_termSearch);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 69;
            this.match(DQLParser.IDENTIFIER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
            this.state = 71;
            this.match(DQLParser.LPAREN);
            this.state = 72;
            this.groupContent();
            this.state = 80;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 1 || _la === 2) {
                {
                {
                this.state = 73;
                _la = this.tokenStream.LA(1);
                if(!(_la === 1 || _la === 2)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                {
                this.state = 75;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 3) {
                    {
                    this.state = 74;
                    this.match(DQLParser.NOT);
                    }
                }

                }
                this.state = 77;
                this.groupContent();
                }
                }
                this.state = 82;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 83;
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
            this.state = 87;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case DQLParser.LPAREN:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 85;
                this.groupExpression();
                }
                break;
            case DQLParser.IDENTIFIER:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 86;
                this.termSearch();
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
            this.state = 89;
            this.match(DQLParser.IDENTIFIER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public rangeValue(): RangeValueContext {
        let localContext = new RangeValueContext(this.context, this.state);
        this.enterRule(localContext, 22, DQLParser.RULE_rangeValue);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 91;
            _la = this.tokenStream.LA(1);
            if(!(_la === 12 || _la === 13)) {
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
    public value(): ValueContext {
        let localContext = new ValueContext(this.context, this.state);
        this.enterRule(localContext, 24, DQLParser.RULE_value);
        try {
            this.state = 97;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case DQLParser.PHRASE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 93;
                this.match(DQLParser.PHRASE);
                }
                break;
            case DQLParser.NUMBER:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 94;
                this.match(DQLParser.NUMBER);
                }
                break;
            case DQLParser.IDENTIFIER:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 95;
                this.termSearch();
                }
                break;
            case DQLParser.LPAREN:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 96;
                this.groupExpression();
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
        this.enterRule(localContext, 26, DQLParser.RULE_comparisonOperator);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 99;
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
        4,1,15,102,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        1,0,1,0,1,0,1,1,1,1,1,1,5,1,35,8,1,10,1,12,1,38,9,1,1,2,1,2,1,2,
        5,2,43,8,2,10,2,12,2,46,9,2,1,3,1,3,1,3,3,3,51,8,3,1,4,1,4,1,4,1,
        4,1,4,1,4,1,4,3,4,60,8,4,1,5,1,5,1,5,1,5,1,6,1,6,1,6,1,6,1,7,1,7,
        1,8,1,8,1,8,1,8,3,8,76,8,8,1,8,5,8,79,8,8,10,8,12,8,82,9,8,1,8,1,
        8,1,9,1,9,3,9,88,8,9,1,10,1,10,1,11,1,11,1,12,1,12,1,12,1,12,3,12,
        98,8,12,1,13,1,13,1,13,0,0,14,0,2,4,6,8,10,12,14,16,18,20,22,24,
        26,0,3,1,0,1,2,1,0,12,13,1,0,4,7,99,0,28,1,0,0,0,2,31,1,0,0,0,4,
        39,1,0,0,0,6,50,1,0,0,0,8,59,1,0,0,0,10,61,1,0,0,0,12,65,1,0,0,0,
        14,69,1,0,0,0,16,71,1,0,0,0,18,87,1,0,0,0,20,89,1,0,0,0,22,91,1,
        0,0,0,24,97,1,0,0,0,26,99,1,0,0,0,28,29,3,2,1,0,29,30,5,0,0,1,30,
        1,1,0,0,0,31,36,3,4,2,0,32,33,5,1,0,0,33,35,3,4,2,0,34,32,1,0,0,
        0,35,38,1,0,0,0,36,34,1,0,0,0,36,37,1,0,0,0,37,3,1,0,0,0,38,36,1,
        0,0,0,39,44,3,6,3,0,40,41,5,2,0,0,41,43,3,6,3,0,42,40,1,0,0,0,43,
        46,1,0,0,0,44,42,1,0,0,0,44,45,1,0,0,0,45,5,1,0,0,0,46,44,1,0,0,
        0,47,48,5,3,0,0,48,51,3,6,3,0,49,51,3,8,4,0,50,47,1,0,0,0,50,49,
        1,0,0,0,51,7,1,0,0,0,52,53,5,9,0,0,53,54,3,0,0,0,54,55,5,10,0,0,
        55,60,1,0,0,0,56,60,3,10,5,0,57,60,3,12,6,0,58,60,3,14,7,0,59,52,
        1,0,0,0,59,56,1,0,0,0,59,57,1,0,0,0,59,58,1,0,0,0,60,9,1,0,0,0,61,
        62,3,20,10,0,62,63,3,26,13,0,63,64,3,22,11,0,64,11,1,0,0,0,65,66,
        3,20,10,0,66,67,5,8,0,0,67,68,3,24,12,0,68,13,1,0,0,0,69,70,5,14,
        0,0,70,15,1,0,0,0,71,72,5,9,0,0,72,80,3,18,9,0,73,75,7,0,0,0,74,
        76,5,3,0,0,75,74,1,0,0,0,75,76,1,0,0,0,76,77,1,0,0,0,77,79,3,18,
        9,0,78,73,1,0,0,0,79,82,1,0,0,0,80,78,1,0,0,0,80,81,1,0,0,0,81,83,
        1,0,0,0,82,80,1,0,0,0,83,84,5,10,0,0,84,17,1,0,0,0,85,88,3,16,8,
        0,86,88,3,14,7,0,87,85,1,0,0,0,87,86,1,0,0,0,88,19,1,0,0,0,89,90,
        5,14,0,0,90,21,1,0,0,0,91,92,7,1,0,0,92,23,1,0,0,0,93,98,5,12,0,
        0,94,98,5,13,0,0,95,98,3,14,7,0,96,98,3,16,8,0,97,93,1,0,0,0,97,
        94,1,0,0,0,97,95,1,0,0,0,97,96,1,0,0,0,98,25,1,0,0,0,99,100,7,2,
        0,0,100,27,1,0,0,0,8,36,44,50,59,75,80,87,97
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
    public orExpression(): OrExpressionContext {
        return this.getRuleContext(0, OrExpressionContext)!;
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(DQLParser.EOF, 0)!;
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_query;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterQuery) {
             listener.enterQuery(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitQuery) {
             listener.exitQuery(this);
        }
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitQuery) {
            return visitor.visitQuery(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class OrExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public andExpression(): AndExpressionContext[];
    public andExpression(i: number): AndExpressionContext | null;
    public andExpression(i?: number): AndExpressionContext[] | AndExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(AndExpressionContext);
        }

        return this.getRuleContext(i, AndExpressionContext);
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
    public override get ruleIndex(): number {
        return DQLParser.RULE_orExpression;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterOrExpression) {
             listener.enterOrExpression(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitOrExpression) {
             listener.exitOrExpression(this);
        }
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitOrExpression) {
            return visitor.visitOrExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AndExpressionContext extends antlr.ParserRuleContext {
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
        return DQLParser.RULE_andExpression;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterAndExpression) {
             listener.enterAndExpression(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitAndExpression) {
             listener.exitAndExpression(this);
        }
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitAndExpression) {
            return visitor.visitAndExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class NotExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.NOT, 0);
    }
    public notExpression(): NotExpressionContext | null {
        return this.getRuleContext(0, NotExpressionContext);
    }
    public primaryExpression(): PrimaryExpressionContext | null {
        return this.getRuleContext(0, PrimaryExpressionContext);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_notExpression;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterNotExpression) {
             listener.enterNotExpression(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitNotExpression) {
             listener.exitNotExpression(this);
        }
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
    public fieldExpression(): FieldExpressionContext | null {
        return this.getRuleContext(0, FieldExpressionContext);
    }
    public termSearch(): TermSearchContext | null {
        return this.getRuleContext(0, TermSearchContext);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_primaryExpression;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterPrimaryExpression) {
             listener.enterPrimaryExpression(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitPrimaryExpression) {
             listener.exitPrimaryExpression(this);
        }
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
    public rangeValue(): RangeValueContext {
        return this.getRuleContext(0, RangeValueContext)!;
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_comparisonExpression;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterComparisonExpression) {
             listener.enterComparisonExpression(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitComparisonExpression) {
             listener.exitComparisonExpression(this);
        }
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitComparisonExpression) {
            return visitor.visitComparisonExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FieldExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public field(): FieldContext {
        return this.getRuleContext(0, FieldContext)!;
    }
    public EQ(): antlr.TerminalNode {
        return this.getToken(DQLParser.EQ, 0)!;
    }
    public value(): ValueContext {
        return this.getRuleContext(0, ValueContext)!;
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_fieldExpression;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterFieldExpression) {
             listener.enterFieldExpression(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitFieldExpression) {
             listener.exitFieldExpression(this);
        }
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitFieldExpression) {
            return visitor.visitFieldExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TermSearchContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(DQLParser.IDENTIFIER, 0)!;
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_termSearch;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterTermSearch) {
             listener.enterTermSearch(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitTermSearch) {
             listener.exitTermSearch(this);
        }
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitTermSearch) {
            return visitor.visitTermSearch(this);
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
    public NOT(): antlr.TerminalNode[];
    public NOT(i: number): antlr.TerminalNode | null;
    public NOT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(DQLParser.NOT);
    	} else {
    		return this.getToken(DQLParser.NOT, i);
    	}
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_groupExpression;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterGroupExpression) {
             listener.enterGroupExpression(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitGroupExpression) {
             listener.exitGroupExpression(this);
        }
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
    public termSearch(): TermSearchContext | null {
        return this.getRuleContext(0, TermSearchContext);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_groupContent;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterGroupContent) {
             listener.enterGroupContent(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitGroupContent) {
             listener.exitGroupContent(this);
        }
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
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(DQLParser.IDENTIFIER, 0)!;
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_field;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterField) {
             listener.enterField(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitField) {
             listener.exitField(this);
        }
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitField) {
            return visitor.visitField(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RangeValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.NUMBER, 0);
    }
    public PHRASE(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.PHRASE, 0);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_rangeValue;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterRangeValue) {
             listener.enterRangeValue(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitRangeValue) {
             listener.exitRangeValue(this);
        }
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitRangeValue) {
            return visitor.visitRangeValue(this);
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
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(DQLParser.NUMBER, 0);
    }
    public termSearch(): TermSearchContext | null {
        return this.getRuleContext(0, TermSearchContext);
    }
    public groupExpression(): GroupExpressionContext | null {
        return this.getRuleContext(0, GroupExpressionContext);
    }
    public override get ruleIndex(): number {
        return DQLParser.RULE_value;
    }
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterValue) {
             listener.enterValue(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitValue) {
             listener.exitValue(this);
        }
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
    public override enterRule(listener: DQLParserListener): void {
        if(listener.enterComparisonOperator) {
             listener.enterComparisonOperator(this);
        }
    }
    public override exitRule(listener: DQLParserListener): void {
        if(listener.exitComparisonOperator) {
             listener.exitComparisonOperator(this);
        }
    }
    public override accept<Result>(visitor: DQLParserVisitor<Result>): Result | null {
        if (visitor.visitComparisonOperator) {
            return visitor.visitComparisonOperator(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
