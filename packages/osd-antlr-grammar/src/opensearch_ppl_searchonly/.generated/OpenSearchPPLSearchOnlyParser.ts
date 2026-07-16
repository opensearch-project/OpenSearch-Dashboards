// Generated from ./src/opensearch_ppl_searchonly/grammar/OpenSearchPPLSearchOnlyParser.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { OpenSearchPPLSearchOnlyParserVisitor } from "./OpenSearchPPLSearchOnlyParserVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class OpenSearchPPLSearchOnlyParser extends antlr.Parser {
    public static readonly AND = 1;
    public static readonly OR = 2;
    public static readonly NOT = 3;
    public static readonly IN = 4;
    public static readonly NEQ = 5;
    public static readonly GE = 6;
    public static readonly LE = 7;
    public static readonly EQ = 8;
    public static readonly GT = 9;
    public static readonly LT = 10;
    public static readonly LPAREN = 11;
    public static readonly RPAREN = 12;
    public static readonly COMMA = 13;
    public static readonly PHRASE = 14;
    public static readonly BACKTICK = 15;
    public static readonly TERM = 16;
    public static readonly WS = 17;
    public static readonly RULE_searchExpression = 0;
    public static readonly RULE_andExpression = 1;
    public static readonly RULE_orExpression = 2;
    public static readonly RULE_notExpression = 3;
    public static readonly RULE_primaryExpression = 4;
    public static readonly RULE_comparisonExpression = 5;
    public static readonly RULE_inExpression = 6;
    public static readonly RULE_comparisonOperator = 7;
    public static readonly RULE_field = 8;
    public static readonly RULE_value = 9;
    public static readonly RULE_term = 10;

    public static readonly literalNames = [
        null, null, null, null, null, "'!='", "'>='", "'<='", "'='", "'>'", 
        "'<'", "'('", "')'", "','"
    ];

    public static readonly symbolicNames = [
        null, "AND", "OR", "NOT", "IN", "NEQ", "GE", "LE", "EQ", "GT", "LT", 
        "LPAREN", "RPAREN", "COMMA", "PHRASE", "BACKTICK", "TERM", "WS"
    ];
    public static readonly ruleNames = [
        "searchExpression", "andExpression", "orExpression", "notExpression", 
        "primaryExpression", "comparisonExpression", "inExpression", "comparisonOperator", 
        "field", "value", "term",
    ];

    public get grammarFileName(): string { return "OpenSearchPPLSearchOnlyParser.g4"; }
    public get literalNames(): (string | null)[] { return OpenSearchPPLSearchOnlyParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return OpenSearchPPLSearchOnlyParser.symbolicNames; }
    public get ruleNames(): string[] { return OpenSearchPPLSearchOnlyParser.ruleNames; }
    public get serializedATN(): number[] { return OpenSearchPPLSearchOnlyParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, OpenSearchPPLSearchOnlyParser._ATN, OpenSearchPPLSearchOnlyParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public searchExpression(): SearchExpressionContext {
        let localContext = new SearchExpressionContext(this.context, this.state);
        this.enterRule(localContext, 0, OpenSearchPPLSearchOnlyParser.RULE_searchExpression);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 22;
            this.andExpression();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 2, OpenSearchPPLSearchOnlyParser.RULE_andExpression);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 24;
            this.orExpression();
            this.state = 31;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 116746) !== 0)) {
                {
                {
                this.state = 26;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 1) {
                    {
                    this.state = 25;
                    this.match(OpenSearchPPLSearchOnlyParser.AND);
                    }
                }

                this.state = 28;
                this.orExpression();
                }
                }
                this.state = 33;
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
    public orExpression(): OrExpressionContext {
        let localContext = new OrExpressionContext(this.context, this.state);
        this.enterRule(localContext, 4, OpenSearchPPLSearchOnlyParser.RULE_orExpression);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 34;
            this.notExpression();
            this.state = 39;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 2) {
                {
                {
                this.state = 35;
                this.match(OpenSearchPPLSearchOnlyParser.OR);
                this.state = 36;
                this.notExpression();
                }
                }
                this.state = 41;
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
        this.enterRule(localContext, 6, OpenSearchPPLSearchOnlyParser.RULE_notExpression);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 43;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 3) {
                {
                this.state = 42;
                this.match(OpenSearchPPLSearchOnlyParser.NOT);
                }
            }

            this.state = 45;
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
        this.enterRule(localContext, 8, OpenSearchPPLSearchOnlyParser.RULE_primaryExpression);
        try {
            this.state = 54;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 4, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 47;
                this.match(OpenSearchPPLSearchOnlyParser.LPAREN);
                this.state = 48;
                this.andExpression();
                this.state = 49;
                this.match(OpenSearchPPLSearchOnlyParser.RPAREN);
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 51;
                this.comparisonExpression();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 52;
                this.inExpression();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 53;
                this.term();
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
        this.enterRule(localContext, 10, OpenSearchPPLSearchOnlyParser.RULE_comparisonExpression);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 56;
            this.field();
            this.state = 57;
            this.comparisonOperator();
            this.state = 58;
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
    public inExpression(): InExpressionContext {
        let localContext = new InExpressionContext(this.context, this.state);
        this.enterRule(localContext, 12, OpenSearchPPLSearchOnlyParser.RULE_inExpression);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 60;
            this.field();
            this.state = 61;
            this.match(OpenSearchPPLSearchOnlyParser.IN);
            this.state = 62;
            this.match(OpenSearchPPLSearchOnlyParser.LPAREN);
            this.state = 63;
            this.value();
            this.state = 68;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 13) {
                {
                {
                this.state = 64;
                this.match(OpenSearchPPLSearchOnlyParser.COMMA);
                this.state = 65;
                this.value();
                }
                }
                this.state = 70;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 71;
            this.match(OpenSearchPPLSearchOnlyParser.RPAREN);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 14, OpenSearchPPLSearchOnlyParser.RULE_comparisonOperator);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 73;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 2016) !== 0))) {
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
    public field(): FieldContext {
        let localContext = new FieldContext(this.context, this.state);
        this.enterRule(localContext, 16, OpenSearchPPLSearchOnlyParser.RULE_field);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 75;
            _la = this.tokenStream.LA(1);
            if(!(_la === 15 || _la === 16)) {
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
        this.enterRule(localContext, 18, OpenSearchPPLSearchOnlyParser.RULE_value);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 77;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 114688) !== 0))) {
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
    public term(): TermContext {
        let localContext = new TermContext(this.context, this.state);
        this.enterRule(localContext, 20, OpenSearchPPLSearchOnlyParser.RULE_term);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 79;
            _la = this.tokenStream.LA(1);
            if(!(_la === 14 || _la === 16)) {
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
        4,1,17,82,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,1,0,1,0,1,1,1,1,3,1,27,8,1,1,
        1,5,1,30,8,1,10,1,12,1,33,9,1,1,2,1,2,1,2,5,2,38,8,2,10,2,12,2,41,
        9,2,1,3,3,3,44,8,3,1,3,1,3,1,4,1,4,1,4,1,4,1,4,1,4,1,4,3,4,55,8,
        4,1,5,1,5,1,5,1,5,1,6,1,6,1,6,1,6,1,6,1,6,5,6,67,8,6,10,6,12,6,70,
        9,6,1,6,1,6,1,7,1,7,1,8,1,8,1,9,1,9,1,10,1,10,1,10,0,0,11,0,2,4,
        6,8,10,12,14,16,18,20,0,4,1,0,5,10,1,0,15,16,1,0,14,16,2,0,14,14,
        16,16,78,0,22,1,0,0,0,2,24,1,0,0,0,4,34,1,0,0,0,6,43,1,0,0,0,8,54,
        1,0,0,0,10,56,1,0,0,0,12,60,1,0,0,0,14,73,1,0,0,0,16,75,1,0,0,0,
        18,77,1,0,0,0,20,79,1,0,0,0,22,23,3,2,1,0,23,1,1,0,0,0,24,31,3,4,
        2,0,25,27,5,1,0,0,26,25,1,0,0,0,26,27,1,0,0,0,27,28,1,0,0,0,28,30,
        3,4,2,0,29,26,1,0,0,0,30,33,1,0,0,0,31,29,1,0,0,0,31,32,1,0,0,0,
        32,3,1,0,0,0,33,31,1,0,0,0,34,39,3,6,3,0,35,36,5,2,0,0,36,38,3,6,
        3,0,37,35,1,0,0,0,38,41,1,0,0,0,39,37,1,0,0,0,39,40,1,0,0,0,40,5,
        1,0,0,0,41,39,1,0,0,0,42,44,5,3,0,0,43,42,1,0,0,0,43,44,1,0,0,0,
        44,45,1,0,0,0,45,46,3,8,4,0,46,7,1,0,0,0,47,48,5,11,0,0,48,49,3,
        2,1,0,49,50,5,12,0,0,50,55,1,0,0,0,51,55,3,10,5,0,52,55,3,12,6,0,
        53,55,3,20,10,0,54,47,1,0,0,0,54,51,1,0,0,0,54,52,1,0,0,0,54,53,
        1,0,0,0,55,9,1,0,0,0,56,57,3,16,8,0,57,58,3,14,7,0,58,59,3,18,9,
        0,59,11,1,0,0,0,60,61,3,16,8,0,61,62,5,4,0,0,62,63,5,11,0,0,63,68,
        3,18,9,0,64,65,5,13,0,0,65,67,3,18,9,0,66,64,1,0,0,0,67,70,1,0,0,
        0,68,66,1,0,0,0,68,69,1,0,0,0,69,71,1,0,0,0,70,68,1,0,0,0,71,72,
        5,12,0,0,72,13,1,0,0,0,73,74,7,0,0,0,74,15,1,0,0,0,75,76,7,1,0,0,
        76,17,1,0,0,0,77,78,7,2,0,0,78,19,1,0,0,0,79,80,7,3,0,0,80,21,1,
        0,0,0,6,26,31,39,43,54,68
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!OpenSearchPPLSearchOnlyParser.__ATN) {
            OpenSearchPPLSearchOnlyParser.__ATN = new antlr.ATNDeserializer().deserialize(OpenSearchPPLSearchOnlyParser._serializedATN);
        }

        return OpenSearchPPLSearchOnlyParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(OpenSearchPPLSearchOnlyParser.literalNames, OpenSearchPPLSearchOnlyParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return OpenSearchPPLSearchOnlyParser.vocabulary;
    }

    private static readonly decisionsToDFA = OpenSearchPPLSearchOnlyParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class SearchExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public andExpression(): AndExpressionContext {
        return this.getRuleContext(0, AndExpressionContext)!;
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLSearchOnlyParser.RULE_searchExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLSearchOnlyParserVisitor<Result>): Result | null {
        if (visitor.visitSearchExpression) {
            return visitor.visitSearchExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AndExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public orExpression(): OrExpressionContext[];
    public orExpression(i: number): OrExpressionContext | null;
    public orExpression(i?: number): OrExpressionContext[] | OrExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(OrExpressionContext);
        }

        return this.getRuleContext(i, OrExpressionContext);
    }
    public AND(): antlr.TerminalNode[];
    public AND(i: number): antlr.TerminalNode | null;
    public AND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLSearchOnlyParser.AND);
    	} else {
    		return this.getToken(OpenSearchPPLSearchOnlyParser.AND, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLSearchOnlyParser.RULE_andExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLSearchOnlyParserVisitor<Result>): Result | null {
        if (visitor.visitAndExpression) {
            return visitor.visitAndExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class OrExpressionContext extends antlr.ParserRuleContext {
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
    public OR(): antlr.TerminalNode[];
    public OR(i: number): antlr.TerminalNode | null;
    public OR(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLSearchOnlyParser.OR);
    	} else {
    		return this.getToken(OpenSearchPPLSearchOnlyParser.OR, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLSearchOnlyParser.RULE_orExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLSearchOnlyParserVisitor<Result>): Result | null {
        if (visitor.visitOrExpression) {
            return visitor.visitOrExpression(this);
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
        return this.getToken(OpenSearchPPLSearchOnlyParser.NOT, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLSearchOnlyParser.RULE_notExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLSearchOnlyParserVisitor<Result>): Result | null {
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
        return this.getToken(OpenSearchPPLSearchOnlyParser.LPAREN, 0);
    }
    public andExpression(): AndExpressionContext | null {
        return this.getRuleContext(0, AndExpressionContext);
    }
    public RPAREN(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.RPAREN, 0);
    }
    public comparisonExpression(): ComparisonExpressionContext | null {
        return this.getRuleContext(0, ComparisonExpressionContext);
    }
    public inExpression(): InExpressionContext | null {
        return this.getRuleContext(0, InExpressionContext);
    }
    public term(): TermContext | null {
        return this.getRuleContext(0, TermContext);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLSearchOnlyParser.RULE_primaryExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLSearchOnlyParserVisitor<Result>): Result | null {
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
        return OpenSearchPPLSearchOnlyParser.RULE_comparisonExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLSearchOnlyParserVisitor<Result>): Result | null {
        if (visitor.visitComparisonExpression) {
            return visitor.visitComparisonExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class InExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public field(): FieldContext {
        return this.getRuleContext(0, FieldContext)!;
    }
    public IN(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLSearchOnlyParser.IN, 0)!;
    }
    public LPAREN(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLSearchOnlyParser.LPAREN, 0)!;
    }
    public value(): ValueContext[];
    public value(i: number): ValueContext | null;
    public value(i?: number): ValueContext[] | ValueContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ValueContext);
        }

        return this.getRuleContext(i, ValueContext);
    }
    public RPAREN(): antlr.TerminalNode {
        return this.getToken(OpenSearchPPLSearchOnlyParser.RPAREN, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(OpenSearchPPLSearchOnlyParser.COMMA);
    	} else {
    		return this.getToken(OpenSearchPPLSearchOnlyParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLSearchOnlyParser.RULE_inExpression;
    }
    public override accept<Result>(visitor: OpenSearchPPLSearchOnlyParserVisitor<Result>): Result | null {
        if (visitor.visitInExpression) {
            return visitor.visitInExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ComparisonOperatorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EQ(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.EQ, 0);
    }
    public NEQ(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.NEQ, 0);
    }
    public GT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.GT, 0);
    }
    public GE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.GE, 0);
    }
    public LT(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.LT, 0);
    }
    public LE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.LE, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLSearchOnlyParser.RULE_comparisonOperator;
    }
    public override accept<Result>(visitor: OpenSearchPPLSearchOnlyParserVisitor<Result>): Result | null {
        if (visitor.visitComparisonOperator) {
            return visitor.visitComparisonOperator(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FieldContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TERM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.TERM, 0);
    }
    public BACKTICK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.BACKTICK, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLSearchOnlyParser.RULE_field;
    }
    public override accept<Result>(visitor: OpenSearchPPLSearchOnlyParserVisitor<Result>): Result | null {
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
        return this.getToken(OpenSearchPPLSearchOnlyParser.PHRASE, 0);
    }
    public TERM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.TERM, 0);
    }
    public BACKTICK(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.BACKTICK, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLSearchOnlyParser.RULE_value;
    }
    public override accept<Result>(visitor: OpenSearchPPLSearchOnlyParserVisitor<Result>): Result | null {
        if (visitor.visitValue) {
            return visitor.visitValue(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TermContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PHRASE(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.PHRASE, 0);
    }
    public TERM(): antlr.TerminalNode | null {
        return this.getToken(OpenSearchPPLSearchOnlyParser.TERM, 0);
    }
    public override get ruleIndex(): number {
        return OpenSearchPPLSearchOnlyParser.RULE_term;
    }
    public override accept<Result>(visitor: OpenSearchPPLSearchOnlyParserVisitor<Result>): Result | null {
        if (visitor.visitTerm) {
            return visitor.visitTerm(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
