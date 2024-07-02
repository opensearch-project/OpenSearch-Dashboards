// Generated from grammar/DQLLexer.g4 by ANTLR 4.13.1

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
    public static readonly DOT = 11;
    public static readonly PHRASE = 12;
    public static readonly NUMBER = 13;
    public static readonly IDENTIFIER = 14;
    public static readonly WS = 15;

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, null, null, null, "'>'", "'<'", "'>='", "'<='", "':'", "'('", 
        "')'", "'.'"
    ];

    public static readonly symbolicNames = [
        null, "OR", "AND", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", 
        "RPAREN", "DOT", "PHRASE", "NUMBER", "IDENTIFIER", "WS"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "OR", "AND", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", "RPAREN", 
        "DOT", "PHRASE", "NUMBER", "IDENTIFIER", "WS",
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
        4,0,15,99,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,
        6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,
        7,13,2,14,7,14,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,2,1,2,1,2,1,2,1,3,1,
        3,1,4,1,4,1,5,1,5,1,5,1,6,1,6,1,6,1,7,1,7,1,8,1,8,1,9,1,9,1,10,1,
        10,1,11,1,11,5,11,63,8,11,10,11,12,11,66,9,11,1,11,1,11,1,12,3,12,
        71,8,12,1,12,4,12,74,8,12,11,12,12,12,75,1,12,1,12,4,12,80,8,12,
        11,12,12,12,81,3,12,84,8,12,1,13,1,13,5,13,88,8,13,10,13,12,13,91,
        9,13,1,14,4,14,94,8,14,11,14,12,14,95,1,14,1,14,0,0,15,1,1,3,2,5,
        3,7,4,9,5,11,6,13,7,15,8,17,9,19,10,21,11,23,12,25,13,27,14,29,15,
        1,0,11,2,0,79,79,111,111,2,0,82,82,114,114,2,0,65,65,97,97,2,0,78,
        78,110,110,2,0,68,68,100,100,2,0,84,84,116,116,2,0,34,34,92,92,1,
        0,48,57,4,0,42,42,65,90,95,95,97,122,5,0,42,42,48,57,65,90,95,95,
        97,122,3,0,9,10,13,13,32,32,105,0,1,1,0,0,0,0,3,1,0,0,0,0,5,1,0,
        0,0,0,7,1,0,0,0,0,9,1,0,0,0,0,11,1,0,0,0,0,13,1,0,0,0,0,15,1,0,0,
        0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,1,0,0,0,0,23,1,0,0,0,0,25,1,0,0,
        0,0,27,1,0,0,0,0,29,1,0,0,0,1,31,1,0,0,0,3,34,1,0,0,0,5,38,1,0,0,
        0,7,42,1,0,0,0,9,44,1,0,0,0,11,46,1,0,0,0,13,49,1,0,0,0,15,52,1,
        0,0,0,17,54,1,0,0,0,19,56,1,0,0,0,21,58,1,0,0,0,23,60,1,0,0,0,25,
        70,1,0,0,0,27,85,1,0,0,0,29,93,1,0,0,0,31,32,7,0,0,0,32,33,7,1,0,
        0,33,2,1,0,0,0,34,35,7,2,0,0,35,36,7,3,0,0,36,37,7,4,0,0,37,4,1,
        0,0,0,38,39,7,3,0,0,39,40,7,0,0,0,40,41,7,5,0,0,41,6,1,0,0,0,42,
        43,5,62,0,0,43,8,1,0,0,0,44,45,5,60,0,0,45,10,1,0,0,0,46,47,5,62,
        0,0,47,48,5,61,0,0,48,12,1,0,0,0,49,50,5,60,0,0,50,51,5,61,0,0,51,
        14,1,0,0,0,52,53,5,58,0,0,53,16,1,0,0,0,54,55,5,40,0,0,55,18,1,0,
        0,0,56,57,5,41,0,0,57,20,1,0,0,0,58,59,5,46,0,0,59,22,1,0,0,0,60,
        64,5,34,0,0,61,63,8,6,0,0,62,61,1,0,0,0,63,66,1,0,0,0,64,62,1,0,
        0,0,64,65,1,0,0,0,65,67,1,0,0,0,66,64,1,0,0,0,67,68,5,34,0,0,68,
        24,1,0,0,0,69,71,5,45,0,0,70,69,1,0,0,0,70,71,1,0,0,0,71,73,1,0,
        0,0,72,74,7,7,0,0,73,72,1,0,0,0,74,75,1,0,0,0,75,73,1,0,0,0,75,76,
        1,0,0,0,76,83,1,0,0,0,77,79,5,46,0,0,78,80,7,7,0,0,79,78,1,0,0,0,
        80,81,1,0,0,0,81,79,1,0,0,0,81,82,1,0,0,0,82,84,1,0,0,0,83,77,1,
        0,0,0,83,84,1,0,0,0,84,26,1,0,0,0,85,89,7,8,0,0,86,88,7,9,0,0,87,
        86,1,0,0,0,88,91,1,0,0,0,89,87,1,0,0,0,89,90,1,0,0,0,90,28,1,0,0,
        0,91,89,1,0,0,0,92,94,7,10,0,0,93,92,1,0,0,0,94,95,1,0,0,0,95,93,
        1,0,0,0,95,96,1,0,0,0,96,97,1,0,0,0,97,98,6,14,0,0,98,30,1,0,0,0,
        8,0,64,70,75,81,83,89,95,1,0,1,0
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