// Generated from /Users/paulstn/Documents/opensearch-2.15.0/OpenSearch-Dashboards/src/plugins/data/public/antlr/dql/grammar/DQLParser.g4 by ANTLR 4.13.1
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.misc.*;
import org.antlr.v4.runtime.tree.*;
import java.util.List;
import java.util.Iterator;
import java.util.ArrayList;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast", "CheckReturnValue"})
public class DQLParser extends Parser {
	static { RuntimeMetaData.checkVersion("4.13.1", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		OR=1, AND=2, NOT=3, GT=4, LT=5, GE=6, LE=7, EQ=8, LPAREN=9, RPAREN=10, 
		DOT=11, PHRASE=12, NUMBER=13, IDENTIFIER=14, WS=15;
	public static final int
		RULE_query = 0, RULE_orExpression = 1, RULE_andExpression = 2, RULE_notExpression = 3, 
		RULE_primaryExpression = 4, RULE_comparisonExpression = 5, RULE_fieldExpression = 6, 
		RULE_termSearch = 7, RULE_groupExpression = 8, RULE_groupContent = 9, 
		RULE_field = 10, RULE_rangeValue = 11, RULE_value = 12, RULE_comparisonOperator = 13;
	private static String[] makeRuleNames() {
		return new String[] {
			"query", "orExpression", "andExpression", "notExpression", "primaryExpression", 
			"comparisonExpression", "fieldExpression", "termSearch", "groupExpression", 
			"groupContent", "field", "rangeValue", "value", "comparisonOperator"
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
			null, "OR", "AND", "NOT", "GT", "LT", "GE", "LE", "EQ", "LPAREN", "RPAREN", 
			"DOT", "PHRASE", "NUMBER", "IDENTIFIER", "WS"
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

	@Override
	public String getGrammarFileName() { return "DQLParser.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public ATN getATN() { return _ATN; }

	public DQLParser(TokenStream input) {
		super(input);
		_interp = new ParserATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}

	@SuppressWarnings("CheckReturnValue")
	public static class QueryContext extends ParserRuleContext {
		public OrExpressionContext orExpression() {
			return getRuleContext(OrExpressionContext.class,0);
		}
		public QueryContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_query; }
	}

	public final QueryContext query() throws RecognitionException {
		QueryContext _localctx = new QueryContext(_ctx, getState());
		enterRule(_localctx, 0, RULE_query);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(28);
			orExpression();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class OrExpressionContext extends ParserRuleContext {
		public List<AndExpressionContext> andExpression() {
			return getRuleContexts(AndExpressionContext.class);
		}
		public AndExpressionContext andExpression(int i) {
			return getRuleContext(AndExpressionContext.class,i);
		}
		public List<TerminalNode> OR() { return getTokens(DQLParser.OR); }
		public TerminalNode OR(int i) {
			return getToken(DQLParser.OR, i);
		}
		public OrExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_orExpression; }
	}

	public final OrExpressionContext orExpression() throws RecognitionException {
		OrExpressionContext _localctx = new OrExpressionContext(_ctx, getState());
		enterRule(_localctx, 2, RULE_orExpression);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(30);
			andExpression();
			setState(35);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==OR) {
				{
				{
				setState(31);
				match(OR);
				setState(32);
				andExpression();
				}
				}
				setState(37);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class AndExpressionContext extends ParserRuleContext {
		public List<NotExpressionContext> notExpression() {
			return getRuleContexts(NotExpressionContext.class);
		}
		public NotExpressionContext notExpression(int i) {
			return getRuleContext(NotExpressionContext.class,i);
		}
		public List<TerminalNode> AND() { return getTokens(DQLParser.AND); }
		public TerminalNode AND(int i) {
			return getToken(DQLParser.AND, i);
		}
		public AndExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_andExpression; }
	}

	public final AndExpressionContext andExpression() throws RecognitionException {
		AndExpressionContext _localctx = new AndExpressionContext(_ctx, getState());
		enterRule(_localctx, 4, RULE_andExpression);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(38);
			notExpression();
			setState(43);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==AND) {
				{
				{
				setState(39);
				match(AND);
				setState(40);
				notExpression();
				}
				}
				setState(45);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class NotExpressionContext extends ParserRuleContext {
		public TerminalNode NOT() { return getToken(DQLParser.NOT, 0); }
		public NotExpressionContext notExpression() {
			return getRuleContext(NotExpressionContext.class,0);
		}
		public PrimaryExpressionContext primaryExpression() {
			return getRuleContext(PrimaryExpressionContext.class,0);
		}
		public NotExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_notExpression; }
	}

	public final NotExpressionContext notExpression() throws RecognitionException {
		NotExpressionContext _localctx = new NotExpressionContext(_ctx, getState());
		enterRule(_localctx, 6, RULE_notExpression);
		try {
			setState(49);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case NOT:
				enterOuterAlt(_localctx, 1);
				{
				setState(46);
				match(NOT);
				setState(47);
				notExpression();
				}
				break;
			case LPAREN:
			case IDENTIFIER:
				enterOuterAlt(_localctx, 2);
				{
				setState(48);
				primaryExpression();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class PrimaryExpressionContext extends ParserRuleContext {
		public TerminalNode LPAREN() { return getToken(DQLParser.LPAREN, 0); }
		public QueryContext query() {
			return getRuleContext(QueryContext.class,0);
		}
		public TerminalNode RPAREN() { return getToken(DQLParser.RPAREN, 0); }
		public ComparisonExpressionContext comparisonExpression() {
			return getRuleContext(ComparisonExpressionContext.class,0);
		}
		public FieldExpressionContext fieldExpression() {
			return getRuleContext(FieldExpressionContext.class,0);
		}
		public TermSearchContext termSearch() {
			return getRuleContext(TermSearchContext.class,0);
		}
		public PrimaryExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_primaryExpression; }
	}

	public final PrimaryExpressionContext primaryExpression() throws RecognitionException {
		PrimaryExpressionContext _localctx = new PrimaryExpressionContext(_ctx, getState());
		enterRule(_localctx, 8, RULE_primaryExpression);
		try {
			setState(58);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,3,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(51);
				match(LPAREN);
				setState(52);
				query();
				setState(53);
				match(RPAREN);
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(55);
				comparisonExpression();
				}
				break;
			case 3:
				enterOuterAlt(_localctx, 3);
				{
				setState(56);
				fieldExpression();
				}
				break;
			case 4:
				enterOuterAlt(_localctx, 4);
				{
				setState(57);
				termSearch();
				}
				break;
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ComparisonExpressionContext extends ParserRuleContext {
		public FieldContext field() {
			return getRuleContext(FieldContext.class,0);
		}
		public ComparisonOperatorContext comparisonOperator() {
			return getRuleContext(ComparisonOperatorContext.class,0);
		}
		public RangeValueContext rangeValue() {
			return getRuleContext(RangeValueContext.class,0);
		}
		public ComparisonExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_comparisonExpression; }
	}

	public final ComparisonExpressionContext comparisonExpression() throws RecognitionException {
		ComparisonExpressionContext _localctx = new ComparisonExpressionContext(_ctx, getState());
		enterRule(_localctx, 10, RULE_comparisonExpression);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(60);
			field();
			setState(61);
			comparisonOperator();
			setState(62);
			rangeValue();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class FieldExpressionContext extends ParserRuleContext {
		public FieldContext field() {
			return getRuleContext(FieldContext.class,0);
		}
		public TerminalNode EQ() { return getToken(DQLParser.EQ, 0); }
		public ValueContext value() {
			return getRuleContext(ValueContext.class,0);
		}
		public GroupExpressionContext groupExpression() {
			return getRuleContext(GroupExpressionContext.class,0);
		}
		public FieldExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_fieldExpression; }
	}

	public final FieldExpressionContext fieldExpression() throws RecognitionException {
		FieldExpressionContext _localctx = new FieldExpressionContext(_ctx, getState());
		enterRule(_localctx, 12, RULE_fieldExpression);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(64);
			field();
			setState(65);
			match(EQ);
			setState(68);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case PHRASE:
			case NUMBER:
			case IDENTIFIER:
				{
				setState(66);
				value();
				}
				break;
			case LPAREN:
				{
				setState(67);
				groupExpression();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class TermSearchContext extends ParserRuleContext {
		public TerminalNode IDENTIFIER() { return getToken(DQLParser.IDENTIFIER, 0); }
		public TermSearchContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_termSearch; }
	}

	public final TermSearchContext termSearch() throws RecognitionException {
		TermSearchContext _localctx = new TermSearchContext(_ctx, getState());
		enterRule(_localctx, 14, RULE_termSearch);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(70);
			match(IDENTIFIER);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class GroupExpressionContext extends ParserRuleContext {
		public TerminalNode LPAREN() { return getToken(DQLParser.LPAREN, 0); }
		public List<GroupContentContext> groupContent() {
			return getRuleContexts(GroupContentContext.class);
		}
		public GroupContentContext groupContent(int i) {
			return getRuleContext(GroupContentContext.class,i);
		}
		public TerminalNode RPAREN() { return getToken(DQLParser.RPAREN, 0); }
		public List<TerminalNode> OR() { return getTokens(DQLParser.OR); }
		public TerminalNode OR(int i) {
			return getToken(DQLParser.OR, i);
		}
		public List<TerminalNode> AND() { return getTokens(DQLParser.AND); }
		public TerminalNode AND(int i) {
			return getToken(DQLParser.AND, i);
		}
		public List<TerminalNode> NOT() { return getTokens(DQLParser.NOT); }
		public TerminalNode NOT(int i) {
			return getToken(DQLParser.NOT, i);
		}
		public GroupExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_groupExpression; }
	}

	public final GroupExpressionContext groupExpression() throws RecognitionException {
		GroupExpressionContext _localctx = new GroupExpressionContext(_ctx, getState());
		enterRule(_localctx, 16, RULE_groupExpression);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(72);
			match(LPAREN);
			setState(73);
			groupContent();
			setState(81);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==OR || _la==AND) {
				{
				{
				setState(74);
				_la = _input.LA(1);
				if ( !(_la==OR || _la==AND) ) {
				_errHandler.recoverInline(this);
				}
				else {
					if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
					_errHandler.reportMatch(this);
					consume();
				}
				{
				setState(76);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==NOT) {
					{
					setState(75);
					match(NOT);
					}
				}

				}
				setState(78);
				groupContent();
				}
				}
				setState(83);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(84);
			match(RPAREN);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class GroupContentContext extends ParserRuleContext {
		public GroupExpressionContext groupExpression() {
			return getRuleContext(GroupExpressionContext.class,0);
		}
		public ValueContext value() {
			return getRuleContext(ValueContext.class,0);
		}
		public GroupContentContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_groupContent; }
	}

	public final GroupContentContext groupContent() throws RecognitionException {
		GroupContentContext _localctx = new GroupContentContext(_ctx, getState());
		enterRule(_localctx, 18, RULE_groupContent);
		try {
			setState(88);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case LPAREN:
				enterOuterAlt(_localctx, 1);
				{
				setState(86);
				groupExpression();
				}
				break;
			case PHRASE:
			case NUMBER:
			case IDENTIFIER:
				enterOuterAlt(_localctx, 2);
				{
				setState(87);
				value();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class FieldContext extends ParserRuleContext {
		public TerminalNode IDENTIFIER() { return getToken(DQLParser.IDENTIFIER, 0); }
		public FieldContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_field; }
	}

	public final FieldContext field() throws RecognitionException {
		FieldContext _localctx = new FieldContext(_ctx, getState());
		enterRule(_localctx, 20, RULE_field);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(90);
			match(IDENTIFIER);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class RangeValueContext extends ParserRuleContext {
		public TerminalNode NUMBER() { return getToken(DQLParser.NUMBER, 0); }
		public TerminalNode PHRASE() { return getToken(DQLParser.PHRASE, 0); }
		public RangeValueContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_rangeValue; }
	}

	public final RangeValueContext rangeValue() throws RecognitionException {
		RangeValueContext _localctx = new RangeValueContext(_ctx, getState());
		enterRule(_localctx, 22, RULE_rangeValue);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(92);
			_la = _input.LA(1);
			if ( !(_la==PHRASE || _la==NUMBER) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ValueContext extends ParserRuleContext {
		public TerminalNode PHRASE() { return getToken(DQLParser.PHRASE, 0); }
		public TerminalNode NUMBER() { return getToken(DQLParser.NUMBER, 0); }
		public TermSearchContext termSearch() {
			return getRuleContext(TermSearchContext.class,0);
		}
		public ValueContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_value; }
	}

	public final ValueContext value() throws RecognitionException {
		ValueContext _localctx = new ValueContext(_ctx, getState());
		enterRule(_localctx, 24, RULE_value);
		try {
			setState(97);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case PHRASE:
				enterOuterAlt(_localctx, 1);
				{
				setState(94);
				match(PHRASE);
				}
				break;
			case NUMBER:
				enterOuterAlt(_localctx, 2);
				{
				setState(95);
				match(NUMBER);
				}
				break;
			case IDENTIFIER:
				enterOuterAlt(_localctx, 3);
				{
				setState(96);
				termSearch();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ComparisonOperatorContext extends ParserRuleContext {
		public TerminalNode GT() { return getToken(DQLParser.GT, 0); }
		public TerminalNode LT() { return getToken(DQLParser.LT, 0); }
		public TerminalNode GE() { return getToken(DQLParser.GE, 0); }
		public TerminalNode LE() { return getToken(DQLParser.LE, 0); }
		public ComparisonOperatorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_comparisonOperator; }
	}

	public final ComparisonOperatorContext comparisonOperator() throws RecognitionException {
		ComparisonOperatorContext _localctx = new ComparisonOperatorContext(_ctx, getState());
		enterRule(_localctx, 26, RULE_comparisonOperator);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(99);
			_la = _input.LA(1);
			if ( !((((_la) & ~0x3f) == 0 && ((1L << _la) & 240L) != 0)) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static final String _serializedATN =
		"\u0004\u0001\u000ff\u0002\u0000\u0007\u0000\u0002\u0001\u0007\u0001\u0002"+
		"\u0002\u0007\u0002\u0002\u0003\u0007\u0003\u0002\u0004\u0007\u0004\u0002"+
		"\u0005\u0007\u0005\u0002\u0006\u0007\u0006\u0002\u0007\u0007\u0007\u0002"+
		"\b\u0007\b\u0002\t\u0007\t\u0002\n\u0007\n\u0002\u000b\u0007\u000b\u0002"+
		"\f\u0007\f\u0002\r\u0007\r\u0001\u0000\u0001\u0000\u0001\u0001\u0001\u0001"+
		"\u0001\u0001\u0005\u0001\"\b\u0001\n\u0001\f\u0001%\t\u0001\u0001\u0002"+
		"\u0001\u0002\u0001\u0002\u0005\u0002*\b\u0002\n\u0002\f\u0002-\t\u0002"+
		"\u0001\u0003\u0001\u0003\u0001\u0003\u0003\u00032\b\u0003\u0001\u0004"+
		"\u0001\u0004\u0001\u0004\u0001\u0004\u0001\u0004\u0001\u0004\u0001\u0004"+
		"\u0003\u0004;\b\u0004\u0001\u0005\u0001\u0005\u0001\u0005\u0001\u0005"+
		"\u0001\u0006\u0001\u0006\u0001\u0006\u0001\u0006\u0003\u0006E\b\u0006"+
		"\u0001\u0007\u0001\u0007\u0001\b\u0001\b\u0001\b\u0001\b\u0003\bM\b\b"+
		"\u0001\b\u0005\bP\b\b\n\b\f\bS\t\b\u0001\b\u0001\b\u0001\t\u0001\t\u0003"+
		"\tY\b\t\u0001\n\u0001\n\u0001\u000b\u0001\u000b\u0001\f\u0001\f\u0001"+
		"\f\u0003\fb\b\f\u0001\r\u0001\r\u0001\r\u0000\u0000\u000e\u0000\u0002"+
		"\u0004\u0006\b\n\f\u000e\u0010\u0012\u0014\u0016\u0018\u001a\u0000\u0003"+
		"\u0001\u0000\u0001\u0002\u0001\u0000\f\r\u0001\u0000\u0004\u0007c\u0000"+
		"\u001c\u0001\u0000\u0000\u0000\u0002\u001e\u0001\u0000\u0000\u0000\u0004"+
		"&\u0001\u0000\u0000\u0000\u00061\u0001\u0000\u0000\u0000\b:\u0001\u0000"+
		"\u0000\u0000\n<\u0001\u0000\u0000\u0000\f@\u0001\u0000\u0000\u0000\u000e"+
		"F\u0001\u0000\u0000\u0000\u0010H\u0001\u0000\u0000\u0000\u0012X\u0001"+
		"\u0000\u0000\u0000\u0014Z\u0001\u0000\u0000\u0000\u0016\\\u0001\u0000"+
		"\u0000\u0000\u0018a\u0001\u0000\u0000\u0000\u001ac\u0001\u0000\u0000\u0000"+
		"\u001c\u001d\u0003\u0002\u0001\u0000\u001d\u0001\u0001\u0000\u0000\u0000"+
		"\u001e#\u0003\u0004\u0002\u0000\u001f \u0005\u0001\u0000\u0000 \"\u0003"+
		"\u0004\u0002\u0000!\u001f\u0001\u0000\u0000\u0000\"%\u0001\u0000\u0000"+
		"\u0000#!\u0001\u0000\u0000\u0000#$\u0001\u0000\u0000\u0000$\u0003\u0001"+
		"\u0000\u0000\u0000%#\u0001\u0000\u0000\u0000&+\u0003\u0006\u0003\u0000"+
		"\'(\u0005\u0002\u0000\u0000(*\u0003\u0006\u0003\u0000)\'\u0001\u0000\u0000"+
		"\u0000*-\u0001\u0000\u0000\u0000+)\u0001\u0000\u0000\u0000+,\u0001\u0000"+
		"\u0000\u0000,\u0005\u0001\u0000\u0000\u0000-+\u0001\u0000\u0000\u0000"+
		"./\u0005\u0003\u0000\u0000/2\u0003\u0006\u0003\u000002\u0003\b\u0004\u0000"+
		"1.\u0001\u0000\u0000\u000010\u0001\u0000\u0000\u00002\u0007\u0001\u0000"+
		"\u0000\u000034\u0005\t\u0000\u000045\u0003\u0000\u0000\u000056\u0005\n"+
		"\u0000\u00006;\u0001\u0000\u0000\u00007;\u0003\n\u0005\u00008;\u0003\f"+
		"\u0006\u00009;\u0003\u000e\u0007\u0000:3\u0001\u0000\u0000\u0000:7\u0001"+
		"\u0000\u0000\u0000:8\u0001\u0000\u0000\u0000:9\u0001\u0000\u0000\u0000"+
		";\t\u0001\u0000\u0000\u0000<=\u0003\u0014\n\u0000=>\u0003\u001a\r\u0000"+
		">?\u0003\u0016\u000b\u0000?\u000b\u0001\u0000\u0000\u0000@A\u0003\u0014"+
		"\n\u0000AD\u0005\b\u0000\u0000BE\u0003\u0018\f\u0000CE\u0003\u0010\b\u0000"+
		"DB\u0001\u0000\u0000\u0000DC\u0001\u0000\u0000\u0000E\r\u0001\u0000\u0000"+
		"\u0000FG\u0005\u000e\u0000\u0000G\u000f\u0001\u0000\u0000\u0000HI\u0005"+
		"\t\u0000\u0000IQ\u0003\u0012\t\u0000JL\u0007\u0000\u0000\u0000KM\u0005"+
		"\u0003\u0000\u0000LK\u0001\u0000\u0000\u0000LM\u0001\u0000\u0000\u0000"+
		"MN\u0001\u0000\u0000\u0000NP\u0003\u0012\t\u0000OJ\u0001\u0000\u0000\u0000"+
		"PS\u0001\u0000\u0000\u0000QO\u0001\u0000\u0000\u0000QR\u0001\u0000\u0000"+
		"\u0000RT\u0001\u0000\u0000\u0000SQ\u0001\u0000\u0000\u0000TU\u0005\n\u0000"+
		"\u0000U\u0011\u0001\u0000\u0000\u0000VY\u0003\u0010\b\u0000WY\u0003\u0018"+
		"\f\u0000XV\u0001\u0000\u0000\u0000XW\u0001\u0000\u0000\u0000Y\u0013\u0001"+
		"\u0000\u0000\u0000Z[\u0005\u000e\u0000\u0000[\u0015\u0001\u0000\u0000"+
		"\u0000\\]\u0007\u0001\u0000\u0000]\u0017\u0001\u0000\u0000\u0000^b\u0005"+
		"\f\u0000\u0000_b\u0005\r\u0000\u0000`b\u0003\u000e\u0007\u0000a^\u0001"+
		"\u0000\u0000\u0000a_\u0001\u0000\u0000\u0000a`\u0001\u0000\u0000\u0000"+
		"b\u0019\u0001\u0000\u0000\u0000cd\u0007\u0002\u0000\u0000d\u001b\u0001"+
		"\u0000\u0000\u0000\t#+1:DLQXa";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}