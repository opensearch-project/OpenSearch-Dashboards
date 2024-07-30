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
		OR=1, AND=2, NOT=3, GT=4, LT=5, GE=6, LE=7, EQ=8, LPAREN=9, RPAREN=10, 
		PHRASE=11, ID=12, WS=13;
	public static String[] channelNames = {
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN"
	};

	public static String[] modeNames = {
		"DEFAULT_MODE"
	};

	private static String[] makeRuleNames() {
		return new String[] {
			"OR", "AND", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", "RPAREN", 
			"PHRASE", "ID", "WS"
		};
	}
	public static final String[] ruleNames = makeRuleNames();

	private static String[] makeLiteralNames() {
		return new String[] {
			null, null, null, null, "'>'", "'<'", "'>='", "'<='", "':'", "'('", "')'"
		};
	}
	private static final String[] _LITERAL_NAMES = makeLiteralNames();
	private static String[] makeSymbolicNames() {
		return new String[] {
			null, "OR", "AND", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", "RPAREN", 
			"PHRASE", "ID", "WS"
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
		"\u0004\u0000\rN\u0006\uffff\uffff\u0002\u0000\u0007\u0000\u0002\u0001"+
		"\u0007\u0001\u0002\u0002\u0007\u0002\u0002\u0003\u0007\u0003\u0002\u0004"+
		"\u0007\u0004\u0002\u0005\u0007\u0005\u0002\u0006\u0007\u0006\u0002\u0007"+
		"\u0007\u0007\u0002\b\u0007\b\u0002\t\u0007\t\u0002\n\u0007\n\u0002\u000b"+
		"\u0007\u000b\u0002\f\u0007\f\u0001\u0000\u0001\u0000\u0001\u0000\u0001"+
		"\u0001\u0001\u0001\u0001\u0001\u0001\u0001\u0001\u0002\u0001\u0002\u0001"+
		"\u0002\u0001\u0002\u0001\u0003\u0001\u0003\u0001\u0004\u0001\u0004\u0001"+
		"\u0005\u0001\u0005\u0001\u0005\u0001\u0006\u0001\u0006\u0001\u0006\u0001"+
		"\u0007\u0001\u0007\u0001\b\u0001\b\u0001\t\u0001\t\u0001\n\u0001\n\u0005"+
		"\n9\b\n\n\n\f\n<\t\n\u0001\n\u0003\n?\b\n\u0001\u000b\u0001\u000b\u0005"+
		"\u000bC\b\u000b\n\u000b\f\u000bF\t\u000b\u0001\f\u0004\fI\b\f\u000b\f"+
		"\f\fJ\u0001\f\u0001\f\u0000\u0000\r\u0001\u0001\u0003\u0002\u0005\u0003"+
		"\u0007\u0004\t\u0005\u000b\u0006\r\u0007\u000f\b\u0011\t\u0013\n\u0015"+
		"\u000b\u0017\f\u0019\r\u0001\u0000\n\u0002\u0000OOoo\u0002\u0000RRrr\u0002"+
		"\u0000AAaa\u0002\u0000NNnn\u0002\u0000DDdd\u0002\u0000TTtt\u0002\u0000"+
		"\"\"\\\\\u0005\u0000**09AZ__az\u0006\u0000**..09AZ__az\u0003\u0000\t\n"+
		"\r\r  Q\u0000\u0001\u0001\u0000\u0000\u0000\u0000\u0003\u0001\u0000\u0000"+
		"\u0000\u0000\u0005\u0001\u0000\u0000\u0000\u0000\u0007\u0001\u0000\u0000"+
		"\u0000\u0000\t\u0001\u0000\u0000\u0000\u0000\u000b\u0001\u0000\u0000\u0000"+
		"\u0000\r\u0001\u0000\u0000\u0000\u0000\u000f\u0001\u0000\u0000\u0000\u0000"+
		"\u0011\u0001\u0000\u0000\u0000\u0000\u0013\u0001\u0000\u0000\u0000\u0000"+
		"\u0015\u0001\u0000\u0000\u0000\u0000\u0017\u0001\u0000\u0000\u0000\u0000"+
		"\u0019\u0001\u0000\u0000\u0000\u0001\u001b\u0001\u0000\u0000\u0000\u0003"+
		"\u001e\u0001\u0000\u0000\u0000\u0005\"\u0001\u0000\u0000\u0000\u0007&"+
		"\u0001\u0000\u0000\u0000\t(\u0001\u0000\u0000\u0000\u000b*\u0001\u0000"+
		"\u0000\u0000\r-\u0001\u0000\u0000\u0000\u000f0\u0001\u0000\u0000\u0000"+
		"\u00112\u0001\u0000\u0000\u0000\u00134\u0001\u0000\u0000\u0000\u00156"+
		"\u0001\u0000\u0000\u0000\u0017@\u0001\u0000\u0000\u0000\u0019H\u0001\u0000"+
		"\u0000\u0000\u001b\u001c\u0007\u0000\u0000\u0000\u001c\u001d\u0007\u0001"+
		"\u0000\u0000\u001d\u0002\u0001\u0000\u0000\u0000\u001e\u001f\u0007\u0002"+
		"\u0000\u0000\u001f \u0007\u0003\u0000\u0000 !\u0007\u0004\u0000\u0000"+
		"!\u0004\u0001\u0000\u0000\u0000\"#\u0007\u0003\u0000\u0000#$\u0007\u0000"+
		"\u0000\u0000$%\u0007\u0005\u0000\u0000%\u0006\u0001\u0000\u0000\u0000"+
		"&\'\u0005>\u0000\u0000\'\b\u0001\u0000\u0000\u0000()\u0005<\u0000\u0000"+
		")\n\u0001\u0000\u0000\u0000*+\u0005>\u0000\u0000+,\u0005=\u0000\u0000"+
		",\f\u0001\u0000\u0000\u0000-.\u0005<\u0000\u0000./\u0005=\u0000\u0000"+
		"/\u000e\u0001\u0000\u0000\u000001\u0005:\u0000\u00001\u0010\u0001\u0000"+
		"\u0000\u000023\u0005(\u0000\u00003\u0012\u0001\u0000\u0000\u000045\u0005"+
		")\u0000\u00005\u0014\u0001\u0000\u0000\u00006:\u0005\"\u0000\u000079\b"+
		"\u0006\u0000\u000087\u0001\u0000\u0000\u00009<\u0001\u0000\u0000\u0000"+
		":8\u0001\u0000\u0000\u0000:;\u0001\u0000\u0000\u0000;>\u0001\u0000\u0000"+
		"\u0000<:\u0001\u0000\u0000\u0000=?\u0005\"\u0000\u0000>=\u0001\u0000\u0000"+
		"\u0000>?\u0001\u0000\u0000\u0000?\u0016\u0001\u0000\u0000\u0000@D\u0007"+
		"\u0007\u0000\u0000AC\u0007\b\u0000\u0000BA\u0001\u0000\u0000\u0000CF\u0001"+
		"\u0000\u0000\u0000DB\u0001\u0000\u0000\u0000DE\u0001\u0000\u0000\u0000"+
		"E\u0018\u0001\u0000\u0000\u0000FD\u0001\u0000\u0000\u0000GI\u0007\t\u0000"+
		"\u0000HG\u0001\u0000\u0000\u0000IJ\u0001\u0000\u0000\u0000JH\u0001\u0000"+
		"\u0000\u0000JK\u0001\u0000\u0000\u0000KL\u0001\u0000\u0000\u0000LM\u0006"+
		"\f\u0000\u0000M\u001a\u0001\u0000\u0000\u0000\u0005\u0000:>DJ\u0001\u0000"+
		"\u0001\u0000";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}