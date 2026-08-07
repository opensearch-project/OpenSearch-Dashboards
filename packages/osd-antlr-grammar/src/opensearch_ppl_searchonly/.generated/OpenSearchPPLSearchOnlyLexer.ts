// Generated from ./src/opensearch_ppl_searchonly/grammar/OpenSearchPPLSearchOnlyLexer.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";


export class OpenSearchPPLSearchOnlyLexer extends antlr.Lexer {
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

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, null, null, null, null, "'!='", "'>='", "'<='", "'='", "'>'", 
        "'<'", "'('", "')'", "','"
    ];

    public static readonly symbolicNames = [
        null, "AND", "OR", "NOT", "IN", "NEQ", "GE", "LE", "EQ", "GT", "LT", 
        "LPAREN", "RPAREN", "COMMA", "PHRASE", "BACKTICK", "TERM", "WS"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "AND", "OR", "NOT", "IN", "NEQ", "GE", "LE", "EQ", "GT", "LT", "LPAREN", 
        "RPAREN", "COMMA", "PHRASE", "BACKTICK", "TERM", "WS",
    ];


    public constructor(input: antlr.CharStream) {
        super(input);
        this.interpreter = new antlr.LexerATNSimulator(this, OpenSearchPPLSearchOnlyLexer._ATN, OpenSearchPPLSearchOnlyLexer.decisionsToDFA, new antlr.PredictionContextCache());
    }

    public get grammarFileName(): string { return "OpenSearchPPLSearchOnlyLexer.g4"; }

    public get literalNames(): (string | null)[] { return OpenSearchPPLSearchOnlyLexer.literalNames; }
    public get symbolicNames(): (string | null)[] { return OpenSearchPPLSearchOnlyLexer.symbolicNames; }
    public get ruleNames(): string[] { return OpenSearchPPLSearchOnlyLexer.ruleNames; }

    public get serializedATN(): number[] { return OpenSearchPPLSearchOnlyLexer._serializedATN; }

    public get channelNames(): string[] { return OpenSearchPPLSearchOnlyLexer.channelNames; }

    public get modeNames(): string[] { return OpenSearchPPLSearchOnlyLexer.modeNames; }

    public static readonly _serializedATN: number[] = [
        4,0,17,120,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,
        13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,1,0,1,0,1,0,1,0,1,1,1,1,1,
        1,1,2,1,2,1,2,1,2,1,3,1,3,1,3,1,4,1,4,1,4,1,5,1,5,1,5,1,6,1,6,1,
        6,1,7,1,7,1,8,1,8,1,9,1,9,1,10,1,10,1,11,1,11,1,12,1,12,1,13,1,13,
        1,13,1,13,5,13,75,8,13,10,13,12,13,78,9,13,1,13,3,13,81,8,13,1,13,
        1,13,1,13,1,13,5,13,87,8,13,10,13,12,13,90,9,13,1,13,3,13,93,8,13,
        3,13,95,8,13,1,14,1,14,1,14,1,14,5,14,101,8,14,10,14,12,14,104,9,
        14,1,14,3,14,107,8,14,1,15,4,15,110,8,15,11,15,12,15,111,1,16,4,
        16,115,8,16,11,16,12,16,116,1,16,1,16,0,0,17,1,1,3,2,5,3,7,4,9,5,
        11,6,13,7,15,8,17,9,19,10,21,11,23,12,25,13,27,14,29,15,31,16,33,
        17,1,0,12,2,0,65,65,97,97,2,0,78,78,110,110,2,0,68,68,100,100,2,
        0,79,79,111,111,2,0,82,82,114,114,2,0,84,84,116,116,2,0,73,73,105,
        105,2,0,34,34,92,92,2,0,39,39,92,92,2,0,92,92,96,96,7,0,9,10,13,
        13,32,34,39,41,44,44,60,62,96,96,3,0,9,10,13,13,32,32,131,0,1,1,
        0,0,0,0,3,1,0,0,0,0,5,1,0,0,0,0,7,1,0,0,0,0,9,1,0,0,0,0,11,1,0,0,
        0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,1,0,0,
        0,0,23,1,0,0,0,0,25,1,0,0,0,0,27,1,0,0,0,0,29,1,0,0,0,0,31,1,0,0,
        0,0,33,1,0,0,0,1,35,1,0,0,0,3,39,1,0,0,0,5,42,1,0,0,0,7,46,1,0,0,
        0,9,49,1,0,0,0,11,52,1,0,0,0,13,55,1,0,0,0,15,58,1,0,0,0,17,60,1,
        0,0,0,19,62,1,0,0,0,21,64,1,0,0,0,23,66,1,0,0,0,25,68,1,0,0,0,27,
        94,1,0,0,0,29,96,1,0,0,0,31,109,1,0,0,0,33,114,1,0,0,0,35,36,7,0,
        0,0,36,37,7,1,0,0,37,38,7,2,0,0,38,2,1,0,0,0,39,40,7,3,0,0,40,41,
        7,4,0,0,41,4,1,0,0,0,42,43,7,1,0,0,43,44,7,3,0,0,44,45,7,5,0,0,45,
        6,1,0,0,0,46,47,7,6,0,0,47,48,7,1,0,0,48,8,1,0,0,0,49,50,5,33,0,
        0,50,51,5,61,0,0,51,10,1,0,0,0,52,53,5,62,0,0,53,54,5,61,0,0,54,
        12,1,0,0,0,55,56,5,60,0,0,56,57,5,61,0,0,57,14,1,0,0,0,58,59,5,61,
        0,0,59,16,1,0,0,0,60,61,5,62,0,0,61,18,1,0,0,0,62,63,5,60,0,0,63,
        20,1,0,0,0,64,65,5,40,0,0,65,22,1,0,0,0,66,67,5,41,0,0,67,24,1,0,
        0,0,68,69,5,44,0,0,69,26,1,0,0,0,70,76,5,34,0,0,71,72,5,92,0,0,72,
        75,9,0,0,0,73,75,8,7,0,0,74,71,1,0,0,0,74,73,1,0,0,0,75,78,1,0,0,
        0,76,74,1,0,0,0,76,77,1,0,0,0,77,80,1,0,0,0,78,76,1,0,0,0,79,81,
        5,34,0,0,80,79,1,0,0,0,80,81,1,0,0,0,81,95,1,0,0,0,82,88,5,39,0,
        0,83,84,5,92,0,0,84,87,9,0,0,0,85,87,8,8,0,0,86,83,1,0,0,0,86,85,
        1,0,0,0,87,90,1,0,0,0,88,86,1,0,0,0,88,89,1,0,0,0,89,92,1,0,0,0,
        90,88,1,0,0,0,91,93,5,39,0,0,92,91,1,0,0,0,92,93,1,0,0,0,93,95,1,
        0,0,0,94,70,1,0,0,0,94,82,1,0,0,0,95,28,1,0,0,0,96,102,5,96,0,0,
        97,98,5,92,0,0,98,101,9,0,0,0,99,101,8,9,0,0,100,97,1,0,0,0,100,
        99,1,0,0,0,101,104,1,0,0,0,102,100,1,0,0,0,102,103,1,0,0,0,103,106,
        1,0,0,0,104,102,1,0,0,0,105,107,5,96,0,0,106,105,1,0,0,0,106,107,
        1,0,0,0,107,30,1,0,0,0,108,110,8,10,0,0,109,108,1,0,0,0,110,111,
        1,0,0,0,111,109,1,0,0,0,111,112,1,0,0,0,112,32,1,0,0,0,113,115,7,
        11,0,0,114,113,1,0,0,0,115,116,1,0,0,0,116,114,1,0,0,0,116,117,1,
        0,0,0,117,118,1,0,0,0,118,119,6,16,0,0,119,34,1,0,0,0,13,0,74,76,
        80,86,88,92,94,100,102,106,111,116,1,0,1,0
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!OpenSearchPPLSearchOnlyLexer.__ATN) {
            OpenSearchPPLSearchOnlyLexer.__ATN = new antlr.ATNDeserializer().deserialize(OpenSearchPPLSearchOnlyLexer._serializedATN);
        }

        return OpenSearchPPLSearchOnlyLexer.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(OpenSearchPPLSearchOnlyLexer.literalNames, OpenSearchPPLSearchOnlyLexer.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return OpenSearchPPLSearchOnlyLexer.vocabulary;
    }

    private static readonly decisionsToDFA = OpenSearchPPLSearchOnlyLexer._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}