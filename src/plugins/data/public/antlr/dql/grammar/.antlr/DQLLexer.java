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
		PHRASE=11, NUMBER=12, IDENTIFIER=13, WS=14;
	public static String[] channelNames = {
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN"
	};

	public static String[] modeNames = {
		"DEFAULT_MODE"
	};

	private static String[] makeRuleNames() {
		return new String[] {
			"OR", "AND", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", "RPAREN", 
			"PHRASE", "NUMBER", "IDENTIFIER", "WS"
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
			"PHRASE", "NUMBER", "IDENTIFIER", "WS"
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
		"\u0004\u0000\u000e_\u0006\uffff\uffff\u0002\u0000\u0007\u0000\u0002\u0001"+
		"\u0007\u0001\u0002\u0002\u0007\u0002\u0002\u0003\u0007\u0003\u0002\u0004"+
		"\u0007\u0004\u0002\u0005\u0007\u0005\u0002\u0006\u0007\u0006\u0002\u0007"+
		"\u0007\u0007\u0002\b\u0007\b\u0002\t\u0007\t\u0002\n\u0007\n\u0002\u000b"+
		"\u0007\u000b\u0002\f\u0007\f\u0002\r\u0007\r\u0001\u0000\u0001\u0000\u0001"+
		"\u0000\u0001\u0001\u0001\u0001\u0001\u0001\u0001\u0001\u0001\u0002\u0001"+
		"\u0002\u0001\u0002\u0001\u0002\u0001\u0003\u0001\u0003\u0001\u0004\u0001"+
		"\u0004\u0001\u0005\u0001\u0005\u0001\u0005\u0001\u0006\u0001\u0006\u0001"+
		"\u0006\u0001\u0007\u0001\u0007\u0001\b\u0001\b\u0001\t\u0001\t\u0001\n"+
		"\u0001\n\u0005\n;\b\n\n\n\f\n>\t\n\u0001\n\u0001\n\u0001\u000b\u0003\u000b"+
		"C\b\u000b\u0001\u000b\u0004\u000bF\b\u000b\u000b\u000b\f\u000bG\u0001"+
		"\u000b\u0001\u000b\u0004\u000bL\b\u000b\u000b\u000b\f\u000bM\u0003\u000b"+
		"P\b\u000b\u0001\f\u0001\f\u0005\fT\b\f\n\f\f\fW\t\f\u0001\r\u0004\rZ\b"+
		"\r\u000b\r\f\r[\u0001\r\u0001\r\u0000\u0000\u000e\u0001\u0001\u0003\u0002"+
		"\u0005\u0003\u0007\u0004\t\u0005\u000b\u0006\r\u0007\u000f\b\u0011\t\u0013"+
		"\n\u0015\u000b\u0017\f\u0019\r\u001b\u000e\u0001\u0000\u000b\u0002\u0000"+
		"OOoo\u0002\u0000RRrr\u0002\u0000AAaa\u0002\u0000NNnn\u0002\u0000DDdd\u0002"+
		"\u0000TTtt\u0002\u0000\"\"\\\\\u0001\u000009\u0004\u0000**AZ__az\u0006"+
		"\u0000**..09AZ__az\u0003\u0000\t\n\r\r  e\u0000\u0001\u0001\u0000\u0000"+
		"\u0000\u0000\u0003\u0001\u0000\u0000\u0000\u0000\u0005\u0001\u0000\u0000"+
		"\u0000\u0000\u0007\u0001\u0000\u0000\u0000\u0000\t\u0001\u0000\u0000\u0000"+
		"\u0000\u000b\u0001\u0000\u0000\u0000\u0000\r\u0001\u0000\u0000\u0000\u0000"+
		"\u000f\u0001\u0000\u0000\u0000\u0000\u0011\u0001\u0000\u0000\u0000\u0000"+
		"\u0013\u0001\u0000\u0000\u0000\u0000\u0015\u0001\u0000\u0000\u0000\u0000"+
		"\u0017\u0001\u0000\u0000\u0000\u0000\u0019\u0001\u0000\u0000\u0000\u0000"+
		"\u001b\u0001\u0000\u0000\u0000\u0001\u001d\u0001\u0000\u0000\u0000\u0003"+
		" \u0001\u0000\u0000\u0000\u0005$\u0001\u0000\u0000\u0000\u0007(\u0001"+
		"\u0000\u0000\u0000\t*\u0001\u0000\u0000\u0000\u000b,\u0001\u0000\u0000"+
		"\u0000\r/\u0001\u0000\u0000\u0000\u000f2\u0001\u0000\u0000\u0000\u0011"+
		"4\u0001\u0000\u0000\u0000\u00136\u0001\u0000\u0000\u0000\u00158\u0001"+
		"\u0000\u0000\u0000\u0017B\u0001\u0000\u0000\u0000\u0019Q\u0001\u0000\u0000"+
		"\u0000\u001bY\u0001\u0000\u0000\u0000\u001d\u001e\u0007\u0000\u0000\u0000"+
		"\u001e\u001f\u0007\u0001\u0000\u0000\u001f\u0002\u0001\u0000\u0000\u0000"+
		" !\u0007\u0002\u0000\u0000!\"\u0007\u0003\u0000\u0000\"#\u0007\u0004\u0000"+
		"\u0000#\u0004\u0001\u0000\u0000\u0000$%\u0007\u0003\u0000\u0000%&\u0007"+
		"\u0000\u0000\u0000&\'\u0007\u0005\u0000\u0000\'\u0006\u0001\u0000\u0000"+
		"\u0000()\u0005>\u0000\u0000)\b\u0001\u0000\u0000\u0000*+\u0005<\u0000"+
		"\u0000+\n\u0001\u0000\u0000\u0000,-\u0005>\u0000\u0000-.\u0005=\u0000"+
		"\u0000.\f\u0001\u0000\u0000\u0000/0\u0005<\u0000\u000001\u0005=\u0000"+
		"\u00001\u000e\u0001\u0000\u0000\u000023\u0005:\u0000\u00003\u0010\u0001"+
		"\u0000\u0000\u000045\u0005(\u0000\u00005\u0012\u0001\u0000\u0000\u0000"+
		"67\u0005)\u0000\u00007\u0014\u0001\u0000\u0000\u00008<\u0005\"\u0000\u0000"+
		"9;\b\u0006\u0000\u0000:9\u0001\u0000\u0000\u0000;>\u0001\u0000\u0000\u0000"+
		"<:\u0001\u0000\u0000\u0000<=\u0001\u0000\u0000\u0000=?\u0001\u0000\u0000"+
		"\u0000><\u0001\u0000\u0000\u0000?@\u0005\"\u0000\u0000@\u0016\u0001\u0000"+
		"\u0000\u0000AC\u0005-\u0000\u0000BA\u0001\u0000\u0000\u0000BC\u0001\u0000"+
		"\u0000\u0000CE\u0001\u0000\u0000\u0000DF\u0007\u0007\u0000\u0000ED\u0001"+
		"\u0000\u0000\u0000FG\u0001\u0000\u0000\u0000GE\u0001\u0000\u0000\u0000"+
		"GH\u0001\u0000\u0000\u0000HO\u0001\u0000\u0000\u0000IK\u0005.\u0000\u0000"+
		"JL\u0007\u0007\u0000\u0000KJ\u0001\u0000\u0000\u0000LM\u0001\u0000\u0000"+
		"\u0000MK\u0001\u0000\u0000\u0000MN\u0001\u0000\u0000\u0000NP\u0001\u0000"+
		"\u0000\u0000OI\u0001\u0000\u0000\u0000OP\u0001\u0000\u0000\u0000P\u0018"+
		"\u0001\u0000\u0000\u0000QU\u0007\b\u0000\u0000RT\u0007\t\u0000\u0000S"+
		"R\u0001\u0000\u0000\u0000TW\u0001\u0000\u0000\u0000US\u0001\u0000\u0000"+
		"\u0000UV\u0001\u0000\u0000\u0000V\u001a\u0001\u0000\u0000\u0000WU\u0001"+
		"\u0000\u0000\u0000XZ\u0007\n\u0000\u0000YX\u0001\u0000\u0000\u0000Z[\u0001"+
		"\u0000\u0000\u0000[Y\u0001\u0000\u0000\u0000[\\\u0001\u0000\u0000\u0000"+
		"\\]\u0001\u0000\u0000\u0000]^\u0006\r\u0000\u0000^\u001c\u0001\u0000\u0000"+
		"\u0000\b\u0000<BGMOU[\u0001\u0000\u0001\u0000";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}