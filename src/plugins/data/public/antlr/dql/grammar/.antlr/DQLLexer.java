// Generated from /Users/paulstn/Documents/opensearch-2.15.0/OpenSearch-Dashboards/src/plugins/data/public/antlr/dql/grammar/DQLLexer.g4 by ANTLR 4.13.1
import org.antlr.v4.runtime.Lexer;
import org.antlr.v4.runtime.CharStream;
import org.antlr.v4.runtime.Token;
import org.antlr.v4.runtime.TokenStream;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.misc.*;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast", "CheckReturnValue", "this-escape"})
public class DQLLexer extends Lexer {
	static { RuntimeMetaData.checkVersion("4.13.1", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		AND=1, OR=2, NOT=3, GT=4, LT=5, GE=6, LE=7, EQ=8, LPAREN=9, RPAREN=10, 
		DOT=11, PHRASE=12, NUMBER=13, DATESTRING=14, IDENTIFIER=15, WS=16;
	public static String[] channelNames = {
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN"
	};

	public static String[] modeNames = {
		"DEFAULT_MODE"
	};

	private static String[] makeRuleNames() {
		return new String[] {
			"AND", "OR", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", "RPAREN", 
			"DOT", "PHRASE", "NUMBER", "DATESTRING", "IDENTIFIER", "WS", "ESC"
		};
	}
	public static final String[] ruleNames = makeRuleNames();

	private static String[] makeLiteralNames() {
		return new String[] {
			null, null, null, null, "'>'", "'<'", "'>='", "'<='", "':'", "'('", "')'", 
			"'.'"
		};
	}
	private static final String[] _LITERAL_NAMES = makeLiteralNames();
	private static String[] makeSymbolicNames() {
		return new String[] {
			null, "AND", "OR", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", "RPAREN", 
			"DOT", "PHRASE", "NUMBER", "DATESTRING", "IDENTIFIER", "WS"
		};
	}
	private static final String[] _SYMBOLIC_NAMES = makeSymbolicNames();
	public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);

	/**
	 * @deprecated Use {@link #VOCABULARY} instead.
	 */
	@Deprecated
	public static final String[] tokenNames;
	static {
		tokenNames = new String[_SYMBOLIC_NAMES.length];
		for (int i = 0; i < tokenNames.length; i++) {
			tokenNames[i] = VOCABULARY.getLiteralName(i);
			if (tokenNames[i] == null) {
				tokenNames[i] = VOCABULARY.getSymbolicName(i);
			}

			if (tokenNames[i] == null) {
				tokenNames[i] = "<INVALID>";
			}
		}
	}

	@Override
	@Deprecated
	public String[] getTokenNames() {
		return tokenNames;
	}

	@Override

	public Vocabulary getVocabulary() {
		return VOCABULARY;
	}


	public DQLLexer(CharStream input) {
		super(input);
		_interp = new LexerATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}

	@Override
	public String getGrammarFileName() { return "DQLLexer.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public String[] getChannelNames() { return channelNames; }

	@Override
	public String[] getModeNames() { return modeNames; }

	@Override
	public ATN getATN() { return _ATN; }

	public static final String _serializedATN =
		"\u0004\u0000\u0010x\u0006\uffff\uffff\u0002\u0000\u0007\u0000\u0002\u0001"+
		"\u0007\u0001\u0002\u0002\u0007\u0002\u0002\u0003\u0007\u0003\u0002\u0004"+
		"\u0007\u0004\u0002\u0005\u0007\u0005\u0002\u0006\u0007\u0006\u0002\u0007"+
		"\u0007\u0007\u0002\b\u0007\b\u0002\t\u0007\t\u0002\n\u0007\n\u0002\u000b"+
		"\u0007\u000b\u0002\f\u0007\f\u0002\r\u0007\r\u0002\u000e\u0007\u000e\u0002"+
		"\u000f\u0007\u000f\u0002\u0010\u0007\u0010\u0001\u0000\u0001\u0000\u0001"+
		"\u0000\u0001\u0000\u0001\u0001\u0001\u0001\u0001\u0001\u0001\u0002\u0001"+
		"\u0002\u0001\u0002\u0001\u0002\u0001\u0003\u0001\u0003\u0001\u0004\u0001"+
		"\u0004\u0001\u0005\u0001\u0005\u0001\u0005\u0001\u0006\u0001\u0006\u0001"+
		"\u0006\u0001\u0007\u0001\u0007\u0001\b\u0001\b\u0001\t\u0001\t\u0001\n"+
		"\u0001\n\u0001\u000b\u0001\u000b\u0001\u000b\u0005\u000bD\b\u000b\n\u000b"+
		"\f\u000bG\t\u000b\u0001\u000b\u0001\u000b\u0001\f\u0003\fL\b\f\u0001\f"+
		"\u0004\fO\b\f\u000b\f\f\fP\u0001\f\u0001\f\u0004\fU\b\f\u000b\f\f\fV\u0003"+
		"\fY\b\f\u0001\r\u0001\r\u0001\r\u0001\r\u0001\r\u0001\r\u0001\r\u0001"+
		"\r\u0001\r\u0001\r\u0001\r\u0001\r\u0001\r\u0001\u000e\u0001\u000e\u0005"+
		"\u000ej\b\u000e\n\u000e\f\u000em\t\u000e\u0001\u000f\u0004\u000fp\b\u000f"+
		"\u000b\u000f\f\u000fq\u0001\u000f\u0001\u000f\u0001\u0010\u0001\u0010"+
		"\u0001\u0010\u0000\u0000\u0011\u0001\u0001\u0003\u0002\u0005\u0003\u0007"+
		"\u0004\t\u0005\u000b\u0006\r\u0007\u000f\b\u0011\t\u0013\n\u0015\u000b"+
		"\u0017\f\u0019\r\u001b\u000e\u001d\u000f\u001f\u0010!\u0000\u0001\u0000"+
		"\u000b\u0002\u0000AAaa\u0002\u0000NNnn\u0002\u0000DDdd\u0002\u0000OOo"+
		"o\u0002\u0000RRrr\u0002\u0000TTtt\u0002\u0000\"\"\\\\\u0001\u000009\u0004"+
		"\u0000**AZ__az\u0005\u0000**09AZ__az\u0003\u0000\t\n\r\r  ~\u0000\u0001"+
		"\u0001\u0000\u0000\u0000\u0000\u0003\u0001\u0000\u0000\u0000\u0000\u0005"+
		"\u0001\u0000\u0000\u0000\u0000\u0007\u0001\u0000\u0000\u0000\u0000\t\u0001"+
		"\u0000\u0000\u0000\u0000\u000b\u0001\u0000\u0000\u0000\u0000\r\u0001\u0000"+
		"\u0000\u0000\u0000\u000f\u0001\u0000\u0000\u0000\u0000\u0011\u0001\u0000"+
		"\u0000\u0000\u0000\u0013\u0001\u0000\u0000\u0000\u0000\u0015\u0001\u0000"+
		"\u0000\u0000\u0000\u0017\u0001\u0000\u0000\u0000\u0000\u0019\u0001\u0000"+
		"\u0000\u0000\u0000\u001b\u0001\u0000\u0000\u0000\u0000\u001d\u0001\u0000"+
		"\u0000\u0000\u0000\u001f\u0001\u0000\u0000\u0000\u0001#\u0001\u0000\u0000"+
		"\u0000\u0003\'\u0001\u0000\u0000\u0000\u0005*\u0001\u0000\u0000\u0000"+
		"\u0007.\u0001\u0000\u0000\u0000\t0\u0001\u0000\u0000\u0000\u000b2\u0001"+
		"\u0000\u0000\u0000\r5\u0001\u0000\u0000\u0000\u000f8\u0001\u0000\u0000"+
		"\u0000\u0011:\u0001\u0000\u0000\u0000\u0013<\u0001\u0000\u0000\u0000\u0015"+
		">\u0001\u0000\u0000\u0000\u0017@\u0001\u0000\u0000\u0000\u0019K\u0001"+
		"\u0000\u0000\u0000\u001bZ\u0001\u0000\u0000\u0000\u001dg\u0001\u0000\u0000"+
		"\u0000\u001fo\u0001\u0000\u0000\u0000!u\u0001\u0000\u0000\u0000#$\u0007"+
		"\u0000\u0000\u0000$%\u0007\u0001\u0000\u0000%&\u0007\u0002\u0000\u0000"+
		"&\u0002\u0001\u0000\u0000\u0000\'(\u0007\u0003\u0000\u0000()\u0007\u0004"+
		"\u0000\u0000)\u0004\u0001\u0000\u0000\u0000*+\u0007\u0001\u0000\u0000"+
		"+,\u0007\u0003\u0000\u0000,-\u0007\u0005\u0000\u0000-\u0006\u0001\u0000"+
		"\u0000\u0000./\u0005>\u0000\u0000/\b\u0001\u0000\u0000\u000001\u0005<"+
		"\u0000\u00001\n\u0001\u0000\u0000\u000023\u0005>\u0000\u000034\u0005="+
		"\u0000\u00004\f\u0001\u0000\u0000\u000056\u0005<\u0000\u000067\u0005="+
		"\u0000\u00007\u000e\u0001\u0000\u0000\u000089\u0005:\u0000\u00009\u0010"+
		"\u0001\u0000\u0000\u0000:;\u0005(\u0000\u0000;\u0012\u0001\u0000\u0000"+
		"\u0000<=\u0005)\u0000\u0000=\u0014\u0001\u0000\u0000\u0000>?\u0005.\u0000"+
		"\u0000?\u0016\u0001\u0000\u0000\u0000@E\u0005\"\u0000\u0000AD\u0003!\u0010"+
		"\u0000BD\b\u0006\u0000\u0000CA\u0001\u0000\u0000\u0000CB\u0001\u0000\u0000"+
		"\u0000DG\u0001\u0000\u0000\u0000EC\u0001\u0000\u0000\u0000EF\u0001\u0000"+
		"\u0000\u0000FH\u0001\u0000\u0000\u0000GE\u0001\u0000\u0000\u0000HI\u0005"+
		"\"\u0000\u0000I\u0018\u0001\u0000\u0000\u0000JL\u0005-\u0000\u0000KJ\u0001"+
		"\u0000\u0000\u0000KL\u0001\u0000\u0000\u0000LN\u0001\u0000\u0000\u0000"+
		"MO\u0007\u0007\u0000\u0000NM\u0001\u0000\u0000\u0000OP\u0001\u0000\u0000"+
		"\u0000PN\u0001\u0000\u0000\u0000PQ\u0001\u0000\u0000\u0000QX\u0001\u0000"+
		"\u0000\u0000RT\u0005.\u0000\u0000SU\u0007\u0007\u0000\u0000TS\u0001\u0000"+
		"\u0000\u0000UV\u0001\u0000\u0000\u0000VT\u0001\u0000\u0000\u0000VW\u0001"+
		"\u0000\u0000\u0000WY\u0001\u0000\u0000\u0000XR\u0001\u0000\u0000\u0000"+
		"XY\u0001\u0000\u0000\u0000Y\u001a\u0001\u0000\u0000\u0000Z[\u0005\"\u0000"+
		"\u0000[\\\u0007\u0007\u0000\u0000\\]\u0007\u0007\u0000\u0000]^\u0007\u0007"+
		"\u0000\u0000^_\u0007\u0007\u0000\u0000_`\u0005-\u0000\u0000`a\u0007\u0007"+
		"\u0000\u0000ab\u0007\u0007\u0000\u0000bc\u0005-\u0000\u0000cd\u0007\u0007"+
		"\u0000\u0000de\u0007\u0007\u0000\u0000ef\u0005\"\u0000\u0000f\u001c\u0001"+
		"\u0000\u0000\u0000gk\u0007\b\u0000\u0000hj\u0007\t\u0000\u0000ih\u0001"+
		"\u0000\u0000\u0000jm\u0001\u0000\u0000\u0000ki\u0001\u0000\u0000\u0000"+
		"kl\u0001\u0000\u0000\u0000l\u001e\u0001\u0000\u0000\u0000mk\u0001\u0000"+
		"\u0000\u0000np\u0007\n\u0000\u0000on\u0001\u0000\u0000\u0000pq\u0001\u0000"+
		"\u0000\u0000qo\u0001\u0000\u0000\u0000qr\u0001\u0000\u0000\u0000rs\u0001"+
		"\u0000\u0000\u0000st\u0006\u000f\u0000\u0000t \u0001\u0000\u0000\u0000"+
		"uv\u0005\\\u0000\u0000vw\t\u0000\u0000\u0000w\"\u0001\u0000\u0000\u0000"+
		"\t\u0000CEKPVXkq\u0001\u0006\u0000\u0000";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}