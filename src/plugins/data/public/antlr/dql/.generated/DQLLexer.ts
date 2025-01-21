// Generated from ./src/plugins/data/public/antlr/dql/grammar/DQLLexer.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";


export class DQLLexer extends antlr.Lexer {
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

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, null, null, null, "'>'", "'<'", "'>='", "'<='", "':'", "'('", 
        "')'"
    ];

    public static readonly symbolicNames = [
        null, "OR", "AND", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", 
        "RPAREN", "PHRASE", "ID", "WS"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "OR", "AND", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", "RPAREN", 
        "PHRASE", "ID", "WS",
    ];


    public constructor(input: antlr.CharStream) {
        super(input);
        this.interpreter = new antlr.LexerATNSimulator(this, DQLLexer._ATN, DQLLexer.decisionsToDFA, new antlr.PredictionContextCache());
    }

    public get grammarFileName(): string { return "DQLLexer.g4"; }

    public get literalNames(): (string | null)[] { return DQLLexer.literalNames; }
    public get symbolicNames(): (string | null)[] { return DQLLexer.symbolicNames; }
    public get ruleNames(): string[] { return DQLLexer.ruleNames; }

    public get serializedATN(): number[] { return DQLLexer._serializedATN; }

    public get channelNames(): string[] { return DQLLexer.channelNames; }

    public get modeNames(): string[] { return DQLLexer.modeNames; }

    public static readonly _serializedATN: number[] = [
        4,0,13,82,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,
        6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,1,0,
        1,0,1,0,1,1,1,1,1,1,1,1,1,2,1,2,1,2,1,2,1,3,1,3,1,4,1,4,1,5,1,5,
        1,5,1,6,1,6,1,6,1,7,1,7,1,8,1,8,1,9,1,9,1,10,1,10,5,10,57,8,10,10,
        10,12,10,60,9,10,1,10,3,10,63,8,10,1,11,4,11,66,8,11,11,11,12,11,
        67,1,11,5,11,71,8,11,10,11,12,11,74,9,11,1,12,4,12,77,8,12,11,12,
        12,12,78,1,12,1,12,0,0,13,1,1,3,2,5,3,7,4,9,5,11,6,13,7,15,8,17,
        9,19,10,21,11,23,12,25,13,1,0,10,2,0,79,79,111,111,2,0,82,82,114,
        114,2,0,65,65,97,97,2,0,78,78,110,110,2,0,68,68,100,100,2,0,84,84,
        116,116,2,0,34,34,92,92,5,0,42,42,48,57,64,90,95,95,97,122,6,0,42,
        42,46,46,48,57,65,90,95,95,97,122,3,0,9,10,13,13,32,32,86,0,1,1,
        0,0,0,0,3,1,0,0,0,0,5,1,0,0,0,0,7,1,0,0,0,0,9,1,0,0,0,0,11,1,0,0,
        0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,1,0,0,
        0,0,23,1,0,0,0,0,25,1,0,0,0,1,27,1,0,0,0,3,30,1,0,0,0,5,34,1,0,0,
        0,7,38,1,0,0,0,9,40,1,0,0,0,11,42,1,0,0,0,13,45,1,0,0,0,15,48,1,
        0,0,0,17,50,1,0,0,0,19,52,1,0,0,0,21,54,1,0,0,0,23,65,1,0,0,0,25,
        76,1,0,0,0,27,28,7,0,0,0,28,29,7,1,0,0,29,2,1,0,0,0,30,31,7,2,0,
        0,31,32,7,3,0,0,32,33,7,4,0,0,33,4,1,0,0,0,34,35,7,3,0,0,35,36,7,
        0,0,0,36,37,7,5,0,0,37,6,1,0,0,0,38,39,5,62,0,0,39,8,1,0,0,0,40,
        41,5,60,0,0,41,10,1,0,0,0,42,43,5,62,0,0,43,44,5,61,0,0,44,12,1,
        0,0,0,45,46,5,60,0,0,46,47,5,61,0,0,47,14,1,0,0,0,48,49,5,58,0,0,
        49,16,1,0,0,0,50,51,5,40,0,0,51,18,1,0,0,0,52,53,5,41,0,0,53,20,
        1,0,0,0,54,58,5,34,0,0,55,57,8,6,0,0,56,55,1,0,0,0,57,60,1,0,0,0,
        58,56,1,0,0,0,58,59,1,0,0,0,59,62,1,0,0,0,60,58,1,0,0,0,61,63,5,
        34,0,0,62,61,1,0,0,0,62,63,1,0,0,0,63,22,1,0,0,0,64,66,7,7,0,0,65,
        64,1,0,0,0,66,67,1,0,0,0,67,65,1,0,0,0,67,68,1,0,0,0,68,72,1,0,0,
        0,69,71,7,8,0,0,70,69,1,0,0,0,71,74,1,0,0,0,72,70,1,0,0,0,72,73,
        1,0,0,0,73,24,1,0,0,0,74,72,1,0,0,0,75,77,7,9,0,0,76,75,1,0,0,0,
        77,78,1,0,0,0,78,76,1,0,0,0,78,79,1,0,0,0,79,80,1,0,0,0,80,81,6,
        12,0,0,81,26,1,0,0,0,6,0,58,62,67,72,78,1,0,1,0
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!DQLLexer.__ATN) {
            DQLLexer.__ATN = new antlr.ATNDeserializer().deserialize(DQLLexer._serializedATN);
        }

        return DQLLexer.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(DQLLexer.literalNames, DQLLexer.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return DQLLexer.vocabulary;
    }

    private static readonly decisionsToDFA = DQLLexer._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}