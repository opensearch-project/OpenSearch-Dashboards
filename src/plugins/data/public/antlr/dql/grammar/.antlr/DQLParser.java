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
		PHRASE=11, NUMBER=12, IDENTIFIER=13, WS=14;
	public static final int
		RULE_query = 0, RULE_operatorExpression = 1, RULE_orExpression = 2, RULE_orTerm = 3, 
		RULE_andExpression = 4, RULE_primaryExpression = 5, RULE_comparisonExpression = 6, 
		RULE_fieldExpression = 7, RULE_termSearch = 8, RULE_groupExpression = 9, 
		RULE_groupContent = 10, RULE_field = 11, RULE_rangeValue = 12, RULE_value = 13, 
		RULE_comparisonOperator = 14;
	private static String[] makeRuleNames() {
		return new String[] {
			"query", "operatorExpression", "orExpression", "orTerm", "andExpression", 
			"primaryExpression", "comparisonExpression", "fieldExpression", "termSearch", 
			"groupExpression", "groupContent", "field", "rangeValue", "value", "comparisonOperator"
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
		public PrimaryExpressionContext primaryExpression() {
			return getRuleContext(PrimaryExpressionContext.class,0);
		}
		public OperatorExpressionContext operatorExpression() {
			return getRuleContext(OperatorExpressionContext.class,0);
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
			setState(32);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,0,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(30);
				primaryExpression();
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(31);
				operatorExpression();
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
	public static class OperatorExpressionContext extends ParserRuleContext {
		public AndExpressionContext andExpression() {
			return getRuleContext(AndExpressionContext.class,0);
		}
		public OrExpressionContext orExpression() {
			return getRuleContext(OrExpressionContext.class,0);
		}
		public OperatorExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_operatorExpression; }
	}

	public final OperatorExpressionContext operatorExpression() throws RecognitionException {
		OperatorExpressionContext _localctx = new OperatorExpressionContext(_ctx, getState());
		enterRule(_localctx, 2, RULE_operatorExpression);
		try {
			setState(36);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,1,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(34);
				andExpression();
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(35);
				orExpression();
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
	public static class OrExpressionContext extends ParserRuleContext {
		public List<OrTermContext> orTerm() {
			return getRuleContexts(OrTermContext.class);
		}
		public OrTermContext orTerm(int i) {
			return getRuleContext(OrTermContext.class,i);
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
		enterRule(_localctx, 4, RULE_orExpression);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(38);
			orTerm();
			setState(43);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==OR) {
				{
				{
				setState(39);
				match(OR);
				setState(40);
				orTerm();
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
	public static class OrTermContext extends ParserRuleContext {
		public PrimaryExpressionContext primaryExpression() {
			return getRuleContext(PrimaryExpressionContext.class,0);
		}
		public AndExpressionContext andExpression() {
			return getRuleContext(AndExpressionContext.class,0);
		}
		public OrTermContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_orTerm; }
	}

	public final OrTermContext orTerm() throws RecognitionException {
		OrTermContext _localctx = new OrTermContext(_ctx, getState());
		enterRule(_localctx, 6, RULE_orTerm);
		try {
			setState(48);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,3,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(46);
				primaryExpression();
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(47);
				andExpression();
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
	public static class AndExpressionContext extends ParserRuleContext {
		public List<PrimaryExpressionContext> primaryExpression() {
			return getRuleContexts(PrimaryExpressionContext.class);
		}
		public PrimaryExpressionContext primaryExpression(int i) {
			return getRuleContext(PrimaryExpressionContext.class,i);
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
		enterRule(_localctx, 8, RULE_andExpression);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(50);
			primaryExpression();
			setState(55);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==AND) {
				{
				{
				setState(51);
				match(AND);
				setState(52);
				primaryExpression();
				}
				}
				setState(57);
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
	public static class PrimaryExpressionContext extends ParserRuleContext {
		public TerminalNode LPAREN() { return getToken(DQLParser.LPAREN, 0); }
		public QueryContext query() {
			return getRuleContext(QueryContext.class,0);
		}
		public TerminalNode RPAREN() { return getToken(DQLParser.RPAREN, 0); }
		public TerminalNode NOT() { return getToken(DQLParser.NOT, 0); }
		public PrimaryExpressionContext primaryExpression() {
			return getRuleContext(PrimaryExpressionContext.class,0);
		}
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
		enterRule(_localctx, 10, RULE_primaryExpression);
		try {
			setState(67);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,5,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(58);
				match(LPAREN);
				setState(59);
				query();
				setState(60);
				match(RPAREN);
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(62);
				match(NOT);
				setState(63);
				primaryExpression();
				}
				break;
			case 3:
				enterOuterAlt(_localctx, 3);
				{
				setState(64);
				comparisonExpression();
				}
				break;
			case 4:
				enterOuterAlt(_localctx, 4);
				{
				setState(65);
				fieldExpression();
				}
				break;
			case 5:
				enterOuterAlt(_localctx, 5);
				{
				setState(66);
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
		enterRule(_localctx, 12, RULE_comparisonExpression);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(69);
			field();
			setState(70);
			comparisonOperator();
			setState(71);
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
		enterRule(_localctx, 14, RULE_fieldExpression);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(73);
			field();
			setState(74);
			match(EQ);
			setState(77);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case PHRASE:
			case NUMBER:
			case IDENTIFIER:
				{
				setState(75);
				value();
				}
				break;
			case LPAREN:
				{
				setState(76);
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
		public List<TerminalNode> IDENTIFIER() { return getTokens(DQLParser.IDENTIFIER); }
		public TerminalNode IDENTIFIER(int i) {
			return getToken(DQLParser.IDENTIFIER, i);
		}
		public TermSearchContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_termSearch; }
	}

	public final TermSearchContext termSearch() throws RecognitionException {
		TermSearchContext _localctx = new TermSearchContext(_ctx, getState());
		enterRule(_localctx, 16, RULE_termSearch);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(79);
			match(IDENTIFIER);
			setState(83);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==IDENTIFIER) {
				{
				{
				setState(80);
				match(IDENTIFIER);
				}
				}
				setState(85);
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
		enterRule(_localctx, 18, RULE_groupExpression);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(86);
			match(LPAREN);
			setState(87);
			groupContent();
			setState(95);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==OR || _la==AND) {
				{
				{
				setState(88);
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
				setState(90);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==NOT) {
					{
					setState(89);
					match(NOT);
					}
				}

				}
				setState(92);
				groupContent();
				}
				}
				setState(97);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(98);
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
		enterRule(_localctx, 20, RULE_groupContent);
		try {
			setState(102);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case LPAREN:
				enterOuterAlt(_localctx, 1);
				{
				setState(100);
				groupExpression();
				}
				break;
			case PHRASE:
			case NUMBER:
			case IDENTIFIER:
				enterOuterAlt(_localctx, 2);
				{
				setState(101);
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
		enterRule(_localctx, 22, RULE_field);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(104);
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
		enterRule(_localctx, 24, RULE_rangeValue);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(106);
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
		enterRule(_localctx, 26, RULE_value);
		try {
			setState(111);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case PHRASE:
				enterOuterAlt(_localctx, 1);
				{
				setState(108);
				match(PHRASE);
				}
				break;
			case NUMBER:
				enterOuterAlt(_localctx, 2);
				{
				setState(109);
				match(NUMBER);
				}
				break;
			case IDENTIFIER:
				enterOuterAlt(_localctx, 3);
				{
				setState(110);
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
		enterRule(_localctx, 28, RULE_comparisonOperator);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(113);
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
		"\u0004\u0001\u000et\u0002\u0000\u0007\u0000\u0002\u0001\u0007\u0001\u0002"+
		"\u0002\u0007\u0002\u0002\u0003\u0007\u0003\u0002\u0004\u0007\u0004\u0002"+
		"\u0005\u0007\u0005\u0002\u0006\u0007\u0006\u0002\u0007\u0007\u0007\u0002"+
		"\b\u0007\b\u0002\t\u0007\t\u0002\n\u0007\n\u0002\u000b\u0007\u000b\u0002"+
		"\f\u0007\f\u0002\r\u0007\r\u0002\u000e\u0007\u000e\u0001\u0000\u0001\u0000"+
		"\u0003\u0000!\b\u0000\u0001\u0001\u0001\u0001\u0003\u0001%\b\u0001\u0001"+
		"\u0002\u0001\u0002\u0001\u0002\u0005\u0002*\b\u0002\n\u0002\f\u0002-\t"+
		"\u0002\u0001\u0003\u0001\u0003\u0003\u00031\b\u0003\u0001\u0004\u0001"+
		"\u0004\u0001\u0004\u0005\u00046\b\u0004\n\u0004\f\u00049\t\u0004\u0001"+
		"\u0005\u0001\u0005\u0001\u0005\u0001\u0005\u0001\u0005\u0001\u0005\u0001"+
		"\u0005\u0001\u0005\u0001\u0005\u0003\u0005D\b\u0005\u0001\u0006\u0001"+
		"\u0006\u0001\u0006\u0001\u0006\u0001\u0007\u0001\u0007\u0001\u0007\u0001"+
		"\u0007\u0003\u0007N\b\u0007\u0001\b\u0001\b\u0005\bR\b\b\n\b\f\bU\t\b"+
		"\u0001\t\u0001\t\u0001\t\u0001\t\u0003\t[\b\t\u0001\t\u0005\t^\b\t\n\t"+
		"\f\ta\t\t\u0001\t\u0001\t\u0001\n\u0001\n\u0003\ng\b\n\u0001\u000b\u0001"+
		"\u000b\u0001\f\u0001\f\u0001\r\u0001\r\u0001\r\u0003\rp\b\r\u0001\u000e"+
		"\u0001\u000e\u0001\u000e\u0000\u0000\u000f\u0000\u0002\u0004\u0006\b\n"+
		"\f\u000e\u0010\u0012\u0014\u0016\u0018\u001a\u001c\u0000\u0003\u0001\u0000"+
		"\u0001\u0002\u0001\u0000\u000b\f\u0001\u0000\u0004\u0007t\u0000 \u0001"+
		"\u0000\u0000\u0000\u0002$\u0001\u0000\u0000\u0000\u0004&\u0001\u0000\u0000"+
		"\u0000\u00060\u0001\u0000\u0000\u0000\b2\u0001\u0000\u0000\u0000\nC\u0001"+
		"\u0000\u0000\u0000\fE\u0001\u0000\u0000\u0000\u000eI\u0001\u0000\u0000"+
		"\u0000\u0010O\u0001\u0000\u0000\u0000\u0012V\u0001\u0000\u0000\u0000\u0014"+
		"f\u0001\u0000\u0000\u0000\u0016h\u0001\u0000\u0000\u0000\u0018j\u0001"+
		"\u0000\u0000\u0000\u001ao\u0001\u0000\u0000\u0000\u001cq\u0001\u0000\u0000"+
		"\u0000\u001e!\u0003\n\u0005\u0000\u001f!\u0003\u0002\u0001\u0000 \u001e"+
		"\u0001\u0000\u0000\u0000 \u001f\u0001\u0000\u0000\u0000!\u0001\u0001\u0000"+
		"\u0000\u0000\"%\u0003\b\u0004\u0000#%\u0003\u0004\u0002\u0000$\"\u0001"+
		"\u0000\u0000\u0000$#\u0001\u0000\u0000\u0000%\u0003\u0001\u0000\u0000"+
		"\u0000&+\u0003\u0006\u0003\u0000\'(\u0005\u0001\u0000\u0000(*\u0003\u0006"+
		"\u0003\u0000)\'\u0001\u0000\u0000\u0000*-\u0001\u0000\u0000\u0000+)\u0001"+
		"\u0000\u0000\u0000+,\u0001\u0000\u0000\u0000,\u0005\u0001\u0000\u0000"+
		"\u0000-+\u0001\u0000\u0000\u0000.1\u0003\n\u0005\u0000/1\u0003\b\u0004"+
		"\u00000.\u0001\u0000\u0000\u00000/\u0001\u0000\u0000\u00001\u0007\u0001"+
		"\u0000\u0000\u000027\u0003\n\u0005\u000034\u0005\u0002\u0000\u000046\u0003"+
		"\n\u0005\u000053\u0001\u0000\u0000\u000069\u0001\u0000\u0000\u000075\u0001"+
		"\u0000\u0000\u000078\u0001\u0000\u0000\u00008\t\u0001\u0000\u0000\u0000"+
		"97\u0001\u0000\u0000\u0000:;\u0005\t\u0000\u0000;<\u0003\u0000\u0000\u0000"+
		"<=\u0005\n\u0000\u0000=D\u0001\u0000\u0000\u0000>?\u0005\u0003\u0000\u0000"+
		"?D\u0003\n\u0005\u0000@D\u0003\f\u0006\u0000AD\u0003\u000e\u0007\u0000"+
		"BD\u0003\u0010\b\u0000C:\u0001\u0000\u0000\u0000C>\u0001\u0000\u0000\u0000"+
		"C@\u0001\u0000\u0000\u0000CA\u0001\u0000\u0000\u0000CB\u0001\u0000\u0000"+
		"\u0000D\u000b\u0001\u0000\u0000\u0000EF\u0003\u0016\u000b\u0000FG\u0003"+
		"\u001c\u000e\u0000GH\u0003\u0018\f\u0000H\r\u0001\u0000\u0000\u0000IJ"+
		"\u0003\u0016\u000b\u0000JM\u0005\b\u0000\u0000KN\u0003\u001a\r\u0000L"+
		"N\u0003\u0012\t\u0000MK\u0001\u0000\u0000\u0000ML\u0001\u0000\u0000\u0000"+
		"N\u000f\u0001\u0000\u0000\u0000OS\u0005\r\u0000\u0000PR\u0005\r\u0000"+
		"\u0000QP\u0001\u0000\u0000\u0000RU\u0001\u0000\u0000\u0000SQ\u0001\u0000"+
		"\u0000\u0000ST\u0001\u0000\u0000\u0000T\u0011\u0001\u0000\u0000\u0000"+
		"US\u0001\u0000\u0000\u0000VW\u0005\t\u0000\u0000W_\u0003\u0014\n\u0000"+
		"XZ\u0007\u0000\u0000\u0000Y[\u0005\u0003\u0000\u0000ZY\u0001\u0000\u0000"+
		"\u0000Z[\u0001\u0000\u0000\u0000[\\\u0001\u0000\u0000\u0000\\^\u0003\u0014"+
		"\n\u0000]X\u0001\u0000\u0000\u0000^a\u0001\u0000\u0000\u0000_]\u0001\u0000"+
		"\u0000\u0000_`\u0001\u0000\u0000\u0000`b\u0001\u0000\u0000\u0000a_\u0001"+
		"\u0000\u0000\u0000bc\u0005\n\u0000\u0000c\u0013\u0001\u0000\u0000\u0000"+
		"dg\u0003\u0012\t\u0000eg\u0003\u001a\r\u0000fd\u0001\u0000\u0000\u0000"+
		"fe\u0001\u0000\u0000\u0000g\u0015\u0001\u0000\u0000\u0000hi\u0005\r\u0000"+
		"\u0000i\u0017\u0001\u0000\u0000\u0000jk\u0007\u0001\u0000\u0000k\u0019"+
		"\u0001\u0000\u0000\u0000lp\u0005\u000b\u0000\u0000mp\u0005\f\u0000\u0000"+
		"np\u0003\u0010\b\u0000ol\u0001\u0000\u0000\u0000om\u0001\u0000\u0000\u0000"+
		"on\u0001\u0000\u0000\u0000p\u001b\u0001\u0000\u0000\u0000qr\u0007\u0002"+
		"\u0000\u0000r\u001d\u0001\u0000\u0000\u0000\f $+07CMSZ_fo";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}