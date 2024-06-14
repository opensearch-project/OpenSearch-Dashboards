// Generated from /home/ubuntu/ws/OpenSearch-Dashboards/src/plugins/data/public/antlr/opensearch_sql/grammar/OpenSearchSQLParser.g4 by ANTLR 4.13.1
import org.antlr.v4.runtime.tree.ParseTreeListener;

/**
 * This interface defines a complete listener for a parse tree produced by
 * {@link OpenSearchSQLParser}.
 */
public interface OpenSearchSQLParserListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#root}.
	 * @param ctx the parse tree
	 */
	void enterRoot(OpenSearchSQLParser.RootContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#root}.
	 * @param ctx the parse tree
	 */
	void exitRoot(OpenSearchSQLParser.RootContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#sqlStatement}.
	 * @param ctx the parse tree
	 */
	void enterSqlStatement(OpenSearchSQLParser.SqlStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#sqlStatement}.
	 * @param ctx the parse tree
	 */
	void exitSqlStatement(OpenSearchSQLParser.SqlStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#dmlStatement}.
	 * @param ctx the parse tree
	 */
	void enterDmlStatement(OpenSearchSQLParser.DmlStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#dmlStatement}.
	 * @param ctx the parse tree
	 */
	void exitDmlStatement(OpenSearchSQLParser.DmlStatementContext ctx);
	/**
	 * Enter a parse tree produced by the {@code simpleSelect}
	 * labeled alternative in {@link OpenSearchSQLParser#selectStatement}.
	 * @param ctx the parse tree
	 */
	void enterSimpleSelect(OpenSearchSQLParser.SimpleSelectContext ctx);
	/**
	 * Exit a parse tree produced by the {@code simpleSelect}
	 * labeled alternative in {@link OpenSearchSQLParser#selectStatement}.
	 * @param ctx the parse tree
	 */
	void exitSimpleSelect(OpenSearchSQLParser.SimpleSelectContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#adminStatement}.
	 * @param ctx the parse tree
	 */
	void enterAdminStatement(OpenSearchSQLParser.AdminStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#adminStatement}.
	 * @param ctx the parse tree
	 */
	void exitAdminStatement(OpenSearchSQLParser.AdminStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#showStatement}.
	 * @param ctx the parse tree
	 */
	void enterShowStatement(OpenSearchSQLParser.ShowStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#showStatement}.
	 * @param ctx the parse tree
	 */
	void exitShowStatement(OpenSearchSQLParser.ShowStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#describeStatement}.
	 * @param ctx the parse tree
	 */
	void enterDescribeStatement(OpenSearchSQLParser.DescribeStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#describeStatement}.
	 * @param ctx the parse tree
	 */
	void exitDescribeStatement(OpenSearchSQLParser.DescribeStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#columnFilter}.
	 * @param ctx the parse tree
	 */
	void enterColumnFilter(OpenSearchSQLParser.ColumnFilterContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#columnFilter}.
	 * @param ctx the parse tree
	 */
	void exitColumnFilter(OpenSearchSQLParser.ColumnFilterContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#tableFilter}.
	 * @param ctx the parse tree
	 */
	void enterTableFilter(OpenSearchSQLParser.TableFilterContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#tableFilter}.
	 * @param ctx the parse tree
	 */
	void exitTableFilter(OpenSearchSQLParser.TableFilterContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#showDescribePattern}.
	 * @param ctx the parse tree
	 */
	void enterShowDescribePattern(OpenSearchSQLParser.ShowDescribePatternContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#showDescribePattern}.
	 * @param ctx the parse tree
	 */
	void exitShowDescribePattern(OpenSearchSQLParser.ShowDescribePatternContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#querySpecification}.
	 * @param ctx the parse tree
	 */
	void enterQuerySpecification(OpenSearchSQLParser.QuerySpecificationContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#querySpecification}.
	 * @param ctx the parse tree
	 */
	void exitQuerySpecification(OpenSearchSQLParser.QuerySpecificationContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#selectClause}.
	 * @param ctx the parse tree
	 */
	void enterSelectClause(OpenSearchSQLParser.SelectClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#selectClause}.
	 * @param ctx the parse tree
	 */
	void exitSelectClause(OpenSearchSQLParser.SelectClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#selectSpec}.
	 * @param ctx the parse tree
	 */
	void enterSelectSpec(OpenSearchSQLParser.SelectSpecContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#selectSpec}.
	 * @param ctx the parse tree
	 */
	void exitSelectSpec(OpenSearchSQLParser.SelectSpecContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#selectElements}.
	 * @param ctx the parse tree
	 */
	void enterSelectElements(OpenSearchSQLParser.SelectElementsContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#selectElements}.
	 * @param ctx the parse tree
	 */
	void exitSelectElements(OpenSearchSQLParser.SelectElementsContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#selectElement}.
	 * @param ctx the parse tree
	 */
	void enterSelectElement(OpenSearchSQLParser.SelectElementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#selectElement}.
	 * @param ctx the parse tree
	 */
	void exitSelectElement(OpenSearchSQLParser.SelectElementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#fromClause}.
	 * @param ctx the parse tree
	 */
	void enterFromClause(OpenSearchSQLParser.FromClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#fromClause}.
	 * @param ctx the parse tree
	 */
	void exitFromClause(OpenSearchSQLParser.FromClauseContext ctx);
	/**
	 * Enter a parse tree produced by the {@code tableAsRelation}
	 * labeled alternative in {@link OpenSearchSQLParser#relation}.
	 * @param ctx the parse tree
	 */
	void enterTableAsRelation(OpenSearchSQLParser.TableAsRelationContext ctx);
	/**
	 * Exit a parse tree produced by the {@code tableAsRelation}
	 * labeled alternative in {@link OpenSearchSQLParser#relation}.
	 * @param ctx the parse tree
	 */
	void exitTableAsRelation(OpenSearchSQLParser.TableAsRelationContext ctx);
	/**
	 * Enter a parse tree produced by the {@code subqueryAsRelation}
	 * labeled alternative in {@link OpenSearchSQLParser#relation}.
	 * @param ctx the parse tree
	 */
	void enterSubqueryAsRelation(OpenSearchSQLParser.SubqueryAsRelationContext ctx);
	/**
	 * Exit a parse tree produced by the {@code subqueryAsRelation}
	 * labeled alternative in {@link OpenSearchSQLParser#relation}.
	 * @param ctx the parse tree
	 */
	void exitSubqueryAsRelation(OpenSearchSQLParser.SubqueryAsRelationContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#whereClause}.
	 * @param ctx the parse tree
	 */
	void enterWhereClause(OpenSearchSQLParser.WhereClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#whereClause}.
	 * @param ctx the parse tree
	 */
	void exitWhereClause(OpenSearchSQLParser.WhereClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#groupByClause}.
	 * @param ctx the parse tree
	 */
	void enterGroupByClause(OpenSearchSQLParser.GroupByClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#groupByClause}.
	 * @param ctx the parse tree
	 */
	void exitGroupByClause(OpenSearchSQLParser.GroupByClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#groupByElements}.
	 * @param ctx the parse tree
	 */
	void enterGroupByElements(OpenSearchSQLParser.GroupByElementsContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#groupByElements}.
	 * @param ctx the parse tree
	 */
	void exitGroupByElements(OpenSearchSQLParser.GroupByElementsContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#groupByElement}.
	 * @param ctx the parse tree
	 */
	void enterGroupByElement(OpenSearchSQLParser.GroupByElementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#groupByElement}.
	 * @param ctx the parse tree
	 */
	void exitGroupByElement(OpenSearchSQLParser.GroupByElementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#havingClause}.
	 * @param ctx the parse tree
	 */
	void enterHavingClause(OpenSearchSQLParser.HavingClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#havingClause}.
	 * @param ctx the parse tree
	 */
	void exitHavingClause(OpenSearchSQLParser.HavingClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#orderByClause}.
	 * @param ctx the parse tree
	 */
	void enterOrderByClause(OpenSearchSQLParser.OrderByClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#orderByClause}.
	 * @param ctx the parse tree
	 */
	void exitOrderByClause(OpenSearchSQLParser.OrderByClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#orderByElement}.
	 * @param ctx the parse tree
	 */
	void enterOrderByElement(OpenSearchSQLParser.OrderByElementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#orderByElement}.
	 * @param ctx the parse tree
	 */
	void exitOrderByElement(OpenSearchSQLParser.OrderByElementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#limitClause}.
	 * @param ctx the parse tree
	 */
	void enterLimitClause(OpenSearchSQLParser.LimitClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#limitClause}.
	 * @param ctx the parse tree
	 */
	void exitLimitClause(OpenSearchSQLParser.LimitClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#windowFunctionClause}.
	 * @param ctx the parse tree
	 */
	void enterWindowFunctionClause(OpenSearchSQLParser.WindowFunctionClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#windowFunctionClause}.
	 * @param ctx the parse tree
	 */
	void exitWindowFunctionClause(OpenSearchSQLParser.WindowFunctionClauseContext ctx);
	/**
	 * Enter a parse tree produced by the {@code scalarWindowFunction}
	 * labeled alternative in {@link OpenSearchSQLParser#windowFunction}.
	 * @param ctx the parse tree
	 */
	void enterScalarWindowFunction(OpenSearchSQLParser.ScalarWindowFunctionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code scalarWindowFunction}
	 * labeled alternative in {@link OpenSearchSQLParser#windowFunction}.
	 * @param ctx the parse tree
	 */
	void exitScalarWindowFunction(OpenSearchSQLParser.ScalarWindowFunctionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code aggregateWindowFunction}
	 * labeled alternative in {@link OpenSearchSQLParser#windowFunction}.
	 * @param ctx the parse tree
	 */
	void enterAggregateWindowFunction(OpenSearchSQLParser.AggregateWindowFunctionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code aggregateWindowFunction}
	 * labeled alternative in {@link OpenSearchSQLParser#windowFunction}.
	 * @param ctx the parse tree
	 */
	void exitAggregateWindowFunction(OpenSearchSQLParser.AggregateWindowFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#overClause}.
	 * @param ctx the parse tree
	 */
	void enterOverClause(OpenSearchSQLParser.OverClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#overClause}.
	 * @param ctx the parse tree
	 */
	void exitOverClause(OpenSearchSQLParser.OverClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#partitionByClause}.
	 * @param ctx the parse tree
	 */
	void enterPartitionByClause(OpenSearchSQLParser.PartitionByClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#partitionByClause}.
	 * @param ctx the parse tree
	 */
	void exitPartitionByClause(OpenSearchSQLParser.PartitionByClauseContext ctx);
	/**
	 * Enter a parse tree produced by the {@code string}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void enterString(OpenSearchSQLParser.StringContext ctx);
	/**
	 * Exit a parse tree produced by the {@code string}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void exitString(OpenSearchSQLParser.StringContext ctx);
	/**
	 * Enter a parse tree produced by the {@code signedDecimal}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void enterSignedDecimal(OpenSearchSQLParser.SignedDecimalContext ctx);
	/**
	 * Exit a parse tree produced by the {@code signedDecimal}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void exitSignedDecimal(OpenSearchSQLParser.SignedDecimalContext ctx);
	/**
	 * Enter a parse tree produced by the {@code signedReal}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void enterSignedReal(OpenSearchSQLParser.SignedRealContext ctx);
	/**
	 * Exit a parse tree produced by the {@code signedReal}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void exitSignedReal(OpenSearchSQLParser.SignedRealContext ctx);
	/**
	 * Enter a parse tree produced by the {@code boolean}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void enterBoolean(OpenSearchSQLParser.BooleanContext ctx);
	/**
	 * Exit a parse tree produced by the {@code boolean}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void exitBoolean(OpenSearchSQLParser.BooleanContext ctx);
	/**
	 * Enter a parse tree produced by the {@code datetime}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void enterDatetime(OpenSearchSQLParser.DatetimeContext ctx);
	/**
	 * Exit a parse tree produced by the {@code datetime}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void exitDatetime(OpenSearchSQLParser.DatetimeContext ctx);
	/**
	 * Enter a parse tree produced by the {@code interval}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void enterInterval(OpenSearchSQLParser.IntervalContext ctx);
	/**
	 * Exit a parse tree produced by the {@code interval}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void exitInterval(OpenSearchSQLParser.IntervalContext ctx);
	/**
	 * Enter a parse tree produced by the {@code null}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void enterNull(OpenSearchSQLParser.NullContext ctx);
	/**
	 * Exit a parse tree produced by the {@code null}
	 * labeled alternative in {@link OpenSearchSQLParser#constant}.
	 * @param ctx the parse tree
	 */
	void exitNull(OpenSearchSQLParser.NullContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#decimalLiteral}.
	 * @param ctx the parse tree
	 */
	void enterDecimalLiteral(OpenSearchSQLParser.DecimalLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#decimalLiteral}.
	 * @param ctx the parse tree
	 */
	void exitDecimalLiteral(OpenSearchSQLParser.DecimalLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#stringLiteral}.
	 * @param ctx the parse tree
	 */
	void enterStringLiteral(OpenSearchSQLParser.StringLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#stringLiteral}.
	 * @param ctx the parse tree
	 */
	void exitStringLiteral(OpenSearchSQLParser.StringLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#booleanLiteral}.
	 * @param ctx the parse tree
	 */
	void enterBooleanLiteral(OpenSearchSQLParser.BooleanLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#booleanLiteral}.
	 * @param ctx the parse tree
	 */
	void exitBooleanLiteral(OpenSearchSQLParser.BooleanLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#realLiteral}.
	 * @param ctx the parse tree
	 */
	void enterRealLiteral(OpenSearchSQLParser.RealLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#realLiteral}.
	 * @param ctx the parse tree
	 */
	void exitRealLiteral(OpenSearchSQLParser.RealLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#sign}.
	 * @param ctx the parse tree
	 */
	void enterSign(OpenSearchSQLParser.SignContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#sign}.
	 * @param ctx the parse tree
	 */
	void exitSign(OpenSearchSQLParser.SignContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#nullLiteral}.
	 * @param ctx the parse tree
	 */
	void enterNullLiteral(OpenSearchSQLParser.NullLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#nullLiteral}.
	 * @param ctx the parse tree
	 */
	void exitNullLiteral(OpenSearchSQLParser.NullLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#datetimeLiteral}.
	 * @param ctx the parse tree
	 */
	void enterDatetimeLiteral(OpenSearchSQLParser.DatetimeLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#datetimeLiteral}.
	 * @param ctx the parse tree
	 */
	void exitDatetimeLiteral(OpenSearchSQLParser.DatetimeLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#dateLiteral}.
	 * @param ctx the parse tree
	 */
	void enterDateLiteral(OpenSearchSQLParser.DateLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#dateLiteral}.
	 * @param ctx the parse tree
	 */
	void exitDateLiteral(OpenSearchSQLParser.DateLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#timeLiteral}.
	 * @param ctx the parse tree
	 */
	void enterTimeLiteral(OpenSearchSQLParser.TimeLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#timeLiteral}.
	 * @param ctx the parse tree
	 */
	void exitTimeLiteral(OpenSearchSQLParser.TimeLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#timestampLiteral}.
	 * @param ctx the parse tree
	 */
	void enterTimestampLiteral(OpenSearchSQLParser.TimestampLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#timestampLiteral}.
	 * @param ctx the parse tree
	 */
	void exitTimestampLiteral(OpenSearchSQLParser.TimestampLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#datetimeConstantLiteral}.
	 * @param ctx the parse tree
	 */
	void enterDatetimeConstantLiteral(OpenSearchSQLParser.DatetimeConstantLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#datetimeConstantLiteral}.
	 * @param ctx the parse tree
	 */
	void exitDatetimeConstantLiteral(OpenSearchSQLParser.DatetimeConstantLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#intervalLiteral}.
	 * @param ctx the parse tree
	 */
	void enterIntervalLiteral(OpenSearchSQLParser.IntervalLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#intervalLiteral}.
	 * @param ctx the parse tree
	 */
	void exitIntervalLiteral(OpenSearchSQLParser.IntervalLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#intervalUnit}.
	 * @param ctx the parse tree
	 */
	void enterIntervalUnit(OpenSearchSQLParser.IntervalUnitContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#intervalUnit}.
	 * @param ctx the parse tree
	 */
	void exitIntervalUnit(OpenSearchSQLParser.IntervalUnitContext ctx);
	/**
	 * Enter a parse tree produced by the {@code orExpression}
	 * labeled alternative in {@link OpenSearchSQLParser#expression}.
	 * @param ctx the parse tree
	 */
	void enterOrExpression(OpenSearchSQLParser.OrExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code orExpression}
	 * labeled alternative in {@link OpenSearchSQLParser#expression}.
	 * @param ctx the parse tree
	 */
	void exitOrExpression(OpenSearchSQLParser.OrExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code andExpression}
	 * labeled alternative in {@link OpenSearchSQLParser#expression}.
	 * @param ctx the parse tree
	 */
	void enterAndExpression(OpenSearchSQLParser.AndExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code andExpression}
	 * labeled alternative in {@link OpenSearchSQLParser#expression}.
	 * @param ctx the parse tree
	 */
	void exitAndExpression(OpenSearchSQLParser.AndExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code notExpression}
	 * labeled alternative in {@link OpenSearchSQLParser#expression}.
	 * @param ctx the parse tree
	 */
	void enterNotExpression(OpenSearchSQLParser.NotExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code notExpression}
	 * labeled alternative in {@link OpenSearchSQLParser#expression}.
	 * @param ctx the parse tree
	 */
	void exitNotExpression(OpenSearchSQLParser.NotExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code predicateExpression}
	 * labeled alternative in {@link OpenSearchSQLParser#expression}.
	 * @param ctx the parse tree
	 */
	void enterPredicateExpression(OpenSearchSQLParser.PredicateExpressionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code predicateExpression}
	 * labeled alternative in {@link OpenSearchSQLParser#expression}.
	 * @param ctx the parse tree
	 */
	void exitPredicateExpression(OpenSearchSQLParser.PredicateExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code expressionAtomPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void enterExpressionAtomPredicate(OpenSearchSQLParser.ExpressionAtomPredicateContext ctx);
	/**
	 * Exit a parse tree produced by the {@code expressionAtomPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void exitExpressionAtomPredicate(OpenSearchSQLParser.ExpressionAtomPredicateContext ctx);
	/**
	 * Enter a parse tree produced by the {@code binaryComparisonPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void enterBinaryComparisonPredicate(OpenSearchSQLParser.BinaryComparisonPredicateContext ctx);
	/**
	 * Exit a parse tree produced by the {@code binaryComparisonPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void exitBinaryComparisonPredicate(OpenSearchSQLParser.BinaryComparisonPredicateContext ctx);
	/**
	 * Enter a parse tree produced by the {@code inPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void enterInPredicate(OpenSearchSQLParser.InPredicateContext ctx);
	/**
	 * Exit a parse tree produced by the {@code inPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void exitInPredicate(OpenSearchSQLParser.InPredicateContext ctx);
	/**
	 * Enter a parse tree produced by the {@code betweenPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void enterBetweenPredicate(OpenSearchSQLParser.BetweenPredicateContext ctx);
	/**
	 * Exit a parse tree produced by the {@code betweenPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void exitBetweenPredicate(OpenSearchSQLParser.BetweenPredicateContext ctx);
	/**
	 * Enter a parse tree produced by the {@code isNullPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void enterIsNullPredicate(OpenSearchSQLParser.IsNullPredicateContext ctx);
	/**
	 * Exit a parse tree produced by the {@code isNullPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void exitIsNullPredicate(OpenSearchSQLParser.IsNullPredicateContext ctx);
	/**
	 * Enter a parse tree produced by the {@code likePredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void enterLikePredicate(OpenSearchSQLParser.LikePredicateContext ctx);
	/**
	 * Exit a parse tree produced by the {@code likePredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void exitLikePredicate(OpenSearchSQLParser.LikePredicateContext ctx);
	/**
	 * Enter a parse tree produced by the {@code regexpPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void enterRegexpPredicate(OpenSearchSQLParser.RegexpPredicateContext ctx);
	/**
	 * Exit a parse tree produced by the {@code regexpPredicate}
	 * labeled alternative in {@link OpenSearchSQLParser#predicate}.
	 * @param ctx the parse tree
	 */
	void exitRegexpPredicate(OpenSearchSQLParser.RegexpPredicateContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#expressions}.
	 * @param ctx the parse tree
	 */
	void enterExpressions(OpenSearchSQLParser.ExpressionsContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#expressions}.
	 * @param ctx the parse tree
	 */
	void exitExpressions(OpenSearchSQLParser.ExpressionsContext ctx);
	/**
	 * Enter a parse tree produced by the {@code constantExpressionAtom}
	 * labeled alternative in {@link OpenSearchSQLParser#expressionAtom}.
	 * @param ctx the parse tree
	 */
	void enterConstantExpressionAtom(OpenSearchSQLParser.ConstantExpressionAtomContext ctx);
	/**
	 * Exit a parse tree produced by the {@code constantExpressionAtom}
	 * labeled alternative in {@link OpenSearchSQLParser#expressionAtom}.
	 * @param ctx the parse tree
	 */
	void exitConstantExpressionAtom(OpenSearchSQLParser.ConstantExpressionAtomContext ctx);
	/**
	 * Enter a parse tree produced by the {@code functionCallExpressionAtom}
	 * labeled alternative in {@link OpenSearchSQLParser#expressionAtom}.
	 * @param ctx the parse tree
	 */
	void enterFunctionCallExpressionAtom(OpenSearchSQLParser.FunctionCallExpressionAtomContext ctx);
	/**
	 * Exit a parse tree produced by the {@code functionCallExpressionAtom}
	 * labeled alternative in {@link OpenSearchSQLParser#expressionAtom}.
	 * @param ctx the parse tree
	 */
	void exitFunctionCallExpressionAtom(OpenSearchSQLParser.FunctionCallExpressionAtomContext ctx);
	/**
	 * Enter a parse tree produced by the {@code fullColumnNameExpressionAtom}
	 * labeled alternative in {@link OpenSearchSQLParser#expressionAtom}.
	 * @param ctx the parse tree
	 */
	void enterFullColumnNameExpressionAtom(OpenSearchSQLParser.FullColumnNameExpressionAtomContext ctx);
	/**
	 * Exit a parse tree produced by the {@code fullColumnNameExpressionAtom}
	 * labeled alternative in {@link OpenSearchSQLParser#expressionAtom}.
	 * @param ctx the parse tree
	 */
	void exitFullColumnNameExpressionAtom(OpenSearchSQLParser.FullColumnNameExpressionAtomContext ctx);
	/**
	 * Enter a parse tree produced by the {@code nestedExpressionAtom}
	 * labeled alternative in {@link OpenSearchSQLParser#expressionAtom}.
	 * @param ctx the parse tree
	 */
	void enterNestedExpressionAtom(OpenSearchSQLParser.NestedExpressionAtomContext ctx);
	/**
	 * Exit a parse tree produced by the {@code nestedExpressionAtom}
	 * labeled alternative in {@link OpenSearchSQLParser#expressionAtom}.
	 * @param ctx the parse tree
	 */
	void exitNestedExpressionAtom(OpenSearchSQLParser.NestedExpressionAtomContext ctx);
	/**
	 * Enter a parse tree produced by the {@code mathExpressionAtom}
	 * labeled alternative in {@link OpenSearchSQLParser#expressionAtom}.
	 * @param ctx the parse tree
	 */
	void enterMathExpressionAtom(OpenSearchSQLParser.MathExpressionAtomContext ctx);
	/**
	 * Exit a parse tree produced by the {@code mathExpressionAtom}
	 * labeled alternative in {@link OpenSearchSQLParser#expressionAtom}.
	 * @param ctx the parse tree
	 */
	void exitMathExpressionAtom(OpenSearchSQLParser.MathExpressionAtomContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#comparisonOperator}.
	 * @param ctx the parse tree
	 */
	void enterComparisonOperator(OpenSearchSQLParser.ComparisonOperatorContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#comparisonOperator}.
	 * @param ctx the parse tree
	 */
	void exitComparisonOperator(OpenSearchSQLParser.ComparisonOperatorContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#nullNotnull}.
	 * @param ctx the parse tree
	 */
	void enterNullNotnull(OpenSearchSQLParser.NullNotnullContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#nullNotnull}.
	 * @param ctx the parse tree
	 */
	void exitNullNotnull(OpenSearchSQLParser.NullNotnullContext ctx);
	/**
	 * Enter a parse tree produced by the {@code nestedAllFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterNestedAllFunctionCall(OpenSearchSQLParser.NestedAllFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code nestedAllFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitNestedAllFunctionCall(OpenSearchSQLParser.NestedAllFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code scalarFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterScalarFunctionCall(OpenSearchSQLParser.ScalarFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code scalarFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitScalarFunctionCall(OpenSearchSQLParser.ScalarFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code specificFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterSpecificFunctionCall(OpenSearchSQLParser.SpecificFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code specificFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitSpecificFunctionCall(OpenSearchSQLParser.SpecificFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code windowFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterWindowFunctionCall(OpenSearchSQLParser.WindowFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code windowFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitWindowFunctionCall(OpenSearchSQLParser.WindowFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code aggregateFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterAggregateFunctionCall(OpenSearchSQLParser.AggregateFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code aggregateFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitAggregateFunctionCall(OpenSearchSQLParser.AggregateFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code filteredAggregationFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterFilteredAggregationFunctionCall(OpenSearchSQLParser.FilteredAggregationFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code filteredAggregationFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitFilteredAggregationFunctionCall(OpenSearchSQLParser.FilteredAggregationFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code scoreRelevanceFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterScoreRelevanceFunctionCall(OpenSearchSQLParser.ScoreRelevanceFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code scoreRelevanceFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitScoreRelevanceFunctionCall(OpenSearchSQLParser.ScoreRelevanceFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code relevanceFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceFunctionCall(OpenSearchSQLParser.RelevanceFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code relevanceFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceFunctionCall(OpenSearchSQLParser.RelevanceFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code highlightFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterHighlightFunctionCall(OpenSearchSQLParser.HighlightFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code highlightFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitHighlightFunctionCall(OpenSearchSQLParser.HighlightFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code positionFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterPositionFunctionCall(OpenSearchSQLParser.PositionFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code positionFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitPositionFunctionCall(OpenSearchSQLParser.PositionFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code extractFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterExtractFunctionCall(OpenSearchSQLParser.ExtractFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code extractFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitExtractFunctionCall(OpenSearchSQLParser.ExtractFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code getFormatFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterGetFormatFunctionCall(OpenSearchSQLParser.GetFormatFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code getFormatFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitGetFormatFunctionCall(OpenSearchSQLParser.GetFormatFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code timestampFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void enterTimestampFunctionCall(OpenSearchSQLParser.TimestampFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code timestampFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#functionCall}.
	 * @param ctx the parse tree
	 */
	void exitTimestampFunctionCall(OpenSearchSQLParser.TimestampFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#timestampFunction}.
	 * @param ctx the parse tree
	 */
	void enterTimestampFunction(OpenSearchSQLParser.TimestampFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#timestampFunction}.
	 * @param ctx the parse tree
	 */
	void exitTimestampFunction(OpenSearchSQLParser.TimestampFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#timestampFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterTimestampFunctionName(OpenSearchSQLParser.TimestampFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#timestampFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitTimestampFunctionName(OpenSearchSQLParser.TimestampFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#getFormatFunction}.
	 * @param ctx the parse tree
	 */
	void enterGetFormatFunction(OpenSearchSQLParser.GetFormatFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#getFormatFunction}.
	 * @param ctx the parse tree
	 */
	void exitGetFormatFunction(OpenSearchSQLParser.GetFormatFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#getFormatType}.
	 * @param ctx the parse tree
	 */
	void enterGetFormatType(OpenSearchSQLParser.GetFormatTypeContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#getFormatType}.
	 * @param ctx the parse tree
	 */
	void exitGetFormatType(OpenSearchSQLParser.GetFormatTypeContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#extractFunction}.
	 * @param ctx the parse tree
	 */
	void enterExtractFunction(OpenSearchSQLParser.ExtractFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#extractFunction}.
	 * @param ctx the parse tree
	 */
	void exitExtractFunction(OpenSearchSQLParser.ExtractFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#simpleDateTimePart}.
	 * @param ctx the parse tree
	 */
	void enterSimpleDateTimePart(OpenSearchSQLParser.SimpleDateTimePartContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#simpleDateTimePart}.
	 * @param ctx the parse tree
	 */
	void exitSimpleDateTimePart(OpenSearchSQLParser.SimpleDateTimePartContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#complexDateTimePart}.
	 * @param ctx the parse tree
	 */
	void enterComplexDateTimePart(OpenSearchSQLParser.ComplexDateTimePartContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#complexDateTimePart}.
	 * @param ctx the parse tree
	 */
	void exitComplexDateTimePart(OpenSearchSQLParser.ComplexDateTimePartContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#datetimePart}.
	 * @param ctx the parse tree
	 */
	void enterDatetimePart(OpenSearchSQLParser.DatetimePartContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#datetimePart}.
	 * @param ctx the parse tree
	 */
	void exitDatetimePart(OpenSearchSQLParser.DatetimePartContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#highlightFunction}.
	 * @param ctx the parse tree
	 */
	void enterHighlightFunction(OpenSearchSQLParser.HighlightFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#highlightFunction}.
	 * @param ctx the parse tree
	 */
	void exitHighlightFunction(OpenSearchSQLParser.HighlightFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#positionFunction}.
	 * @param ctx the parse tree
	 */
	void enterPositionFunction(OpenSearchSQLParser.PositionFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#positionFunction}.
	 * @param ctx the parse tree
	 */
	void exitPositionFunction(OpenSearchSQLParser.PositionFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#matchQueryAltSyntaxFunction}.
	 * @param ctx the parse tree
	 */
	void enterMatchQueryAltSyntaxFunction(OpenSearchSQLParser.MatchQueryAltSyntaxFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#matchQueryAltSyntaxFunction}.
	 * @param ctx the parse tree
	 */
	void exitMatchQueryAltSyntaxFunction(OpenSearchSQLParser.MatchQueryAltSyntaxFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#scalarFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterScalarFunctionName(OpenSearchSQLParser.ScalarFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#scalarFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitScalarFunctionName(OpenSearchSQLParser.ScalarFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by the {@code caseFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#specificFunction}.
	 * @param ctx the parse tree
	 */
	void enterCaseFunctionCall(OpenSearchSQLParser.CaseFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code caseFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#specificFunction}.
	 * @param ctx the parse tree
	 */
	void exitCaseFunctionCall(OpenSearchSQLParser.CaseFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code dataTypeFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#specificFunction}.
	 * @param ctx the parse tree
	 */
	void enterDataTypeFunctionCall(OpenSearchSQLParser.DataTypeFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code dataTypeFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#specificFunction}.
	 * @param ctx the parse tree
	 */
	void exitDataTypeFunctionCall(OpenSearchSQLParser.DataTypeFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#relevanceFunction}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceFunction(OpenSearchSQLParser.RelevanceFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#relevanceFunction}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceFunction(OpenSearchSQLParser.RelevanceFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#scoreRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void enterScoreRelevanceFunction(OpenSearchSQLParser.ScoreRelevanceFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#scoreRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void exitScoreRelevanceFunction(OpenSearchSQLParser.ScoreRelevanceFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#noFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void enterNoFieldRelevanceFunction(OpenSearchSQLParser.NoFieldRelevanceFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#noFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void exitNoFieldRelevanceFunction(OpenSearchSQLParser.NoFieldRelevanceFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#singleFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void enterSingleFieldRelevanceFunction(OpenSearchSQLParser.SingleFieldRelevanceFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#singleFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void exitSingleFieldRelevanceFunction(OpenSearchSQLParser.SingleFieldRelevanceFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#multiFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void enterMultiFieldRelevanceFunction(OpenSearchSQLParser.MultiFieldRelevanceFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#multiFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void exitMultiFieldRelevanceFunction(OpenSearchSQLParser.MultiFieldRelevanceFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#altSingleFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void enterAltSingleFieldRelevanceFunction(OpenSearchSQLParser.AltSingleFieldRelevanceFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#altSingleFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void exitAltSingleFieldRelevanceFunction(OpenSearchSQLParser.AltSingleFieldRelevanceFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#altMultiFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void enterAltMultiFieldRelevanceFunction(OpenSearchSQLParser.AltMultiFieldRelevanceFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#altMultiFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void exitAltMultiFieldRelevanceFunction(OpenSearchSQLParser.AltMultiFieldRelevanceFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#convertedDataType}.
	 * @param ctx the parse tree
	 */
	void enterConvertedDataType(OpenSearchSQLParser.ConvertedDataTypeContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#convertedDataType}.
	 * @param ctx the parse tree
	 */
	void exitConvertedDataType(OpenSearchSQLParser.ConvertedDataTypeContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#caseFuncAlternative}.
	 * @param ctx the parse tree
	 */
	void enterCaseFuncAlternative(OpenSearchSQLParser.CaseFuncAlternativeContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#caseFuncAlternative}.
	 * @param ctx the parse tree
	 */
	void exitCaseFuncAlternative(OpenSearchSQLParser.CaseFuncAlternativeContext ctx);
	/**
	 * Enter a parse tree produced by the {@code regularAggregateFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#aggregateFunction}.
	 * @param ctx the parse tree
	 */
	void enterRegularAggregateFunctionCall(OpenSearchSQLParser.RegularAggregateFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code regularAggregateFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#aggregateFunction}.
	 * @param ctx the parse tree
	 */
	void exitRegularAggregateFunctionCall(OpenSearchSQLParser.RegularAggregateFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code countStarFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#aggregateFunction}.
	 * @param ctx the parse tree
	 */
	void enterCountStarFunctionCall(OpenSearchSQLParser.CountStarFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code countStarFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#aggregateFunction}.
	 * @param ctx the parse tree
	 */
	void exitCountStarFunctionCall(OpenSearchSQLParser.CountStarFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code distinctCountFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#aggregateFunction}.
	 * @param ctx the parse tree
	 */
	void enterDistinctCountFunctionCall(OpenSearchSQLParser.DistinctCountFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code distinctCountFunctionCall}
	 * labeled alternative in {@link OpenSearchSQLParser#aggregateFunction}.
	 * @param ctx the parse tree
	 */
	void exitDistinctCountFunctionCall(OpenSearchSQLParser.DistinctCountFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#filterClause}.
	 * @param ctx the parse tree
	 */
	void enterFilterClause(OpenSearchSQLParser.FilterClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#filterClause}.
	 * @param ctx the parse tree
	 */
	void exitFilterClause(OpenSearchSQLParser.FilterClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#aggregationFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterAggregationFunctionName(OpenSearchSQLParser.AggregationFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#aggregationFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitAggregationFunctionName(OpenSearchSQLParser.AggregationFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#mathematicalFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterMathematicalFunctionName(OpenSearchSQLParser.MathematicalFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#mathematicalFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitMathematicalFunctionName(OpenSearchSQLParser.MathematicalFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#trigonometricFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterTrigonometricFunctionName(OpenSearchSQLParser.TrigonometricFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#trigonometricFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitTrigonometricFunctionName(OpenSearchSQLParser.TrigonometricFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#arithmeticFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterArithmeticFunctionName(OpenSearchSQLParser.ArithmeticFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#arithmeticFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitArithmeticFunctionName(OpenSearchSQLParser.ArithmeticFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#dateTimeFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterDateTimeFunctionName(OpenSearchSQLParser.DateTimeFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#dateTimeFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitDateTimeFunctionName(OpenSearchSQLParser.DateTimeFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#textFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterTextFunctionName(OpenSearchSQLParser.TextFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#textFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitTextFunctionName(OpenSearchSQLParser.TextFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#flowControlFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterFlowControlFunctionName(OpenSearchSQLParser.FlowControlFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#flowControlFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitFlowControlFunctionName(OpenSearchSQLParser.FlowControlFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#noFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterNoFieldRelevanceFunctionName(OpenSearchSQLParser.NoFieldRelevanceFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#noFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitNoFieldRelevanceFunctionName(OpenSearchSQLParser.NoFieldRelevanceFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#systemFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterSystemFunctionName(OpenSearchSQLParser.SystemFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#systemFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitSystemFunctionName(OpenSearchSQLParser.SystemFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#nestedFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterNestedFunctionName(OpenSearchSQLParser.NestedFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#nestedFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitNestedFunctionName(OpenSearchSQLParser.NestedFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#scoreRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterScoreRelevanceFunctionName(OpenSearchSQLParser.ScoreRelevanceFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#scoreRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitScoreRelevanceFunctionName(OpenSearchSQLParser.ScoreRelevanceFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#singleFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterSingleFieldRelevanceFunctionName(OpenSearchSQLParser.SingleFieldRelevanceFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#singleFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitSingleFieldRelevanceFunctionName(OpenSearchSQLParser.SingleFieldRelevanceFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#multiFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterMultiFieldRelevanceFunctionName(OpenSearchSQLParser.MultiFieldRelevanceFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#multiFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitMultiFieldRelevanceFunctionName(OpenSearchSQLParser.MultiFieldRelevanceFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#altSingleFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterAltSingleFieldRelevanceFunctionName(OpenSearchSQLParser.AltSingleFieldRelevanceFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#altSingleFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitAltSingleFieldRelevanceFunctionName(OpenSearchSQLParser.AltSingleFieldRelevanceFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#altMultiFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterAltMultiFieldRelevanceFunctionName(OpenSearchSQLParser.AltMultiFieldRelevanceFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#altMultiFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitAltMultiFieldRelevanceFunctionName(OpenSearchSQLParser.AltMultiFieldRelevanceFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#functionArgs}.
	 * @param ctx the parse tree
	 */
	void enterFunctionArgs(OpenSearchSQLParser.FunctionArgsContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#functionArgs}.
	 * @param ctx the parse tree
	 */
	void exitFunctionArgs(OpenSearchSQLParser.FunctionArgsContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#functionArg}.
	 * @param ctx the parse tree
	 */
	void enterFunctionArg(OpenSearchSQLParser.FunctionArgContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#functionArg}.
	 * @param ctx the parse tree
	 */
	void exitFunctionArg(OpenSearchSQLParser.FunctionArgContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#relevanceArg}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceArg(OpenSearchSQLParser.RelevanceArgContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#relevanceArg}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceArg(OpenSearchSQLParser.RelevanceArgContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#highlightArg}.
	 * @param ctx the parse tree
	 */
	void enterHighlightArg(OpenSearchSQLParser.HighlightArgContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#highlightArg}.
	 * @param ctx the parse tree
	 */
	void exitHighlightArg(OpenSearchSQLParser.HighlightArgContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#relevanceArgName}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceArgName(OpenSearchSQLParser.RelevanceArgNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#relevanceArgName}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceArgName(OpenSearchSQLParser.RelevanceArgNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#highlightArgName}.
	 * @param ctx the parse tree
	 */
	void enterHighlightArgName(OpenSearchSQLParser.HighlightArgNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#highlightArgName}.
	 * @param ctx the parse tree
	 */
	void exitHighlightArgName(OpenSearchSQLParser.HighlightArgNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#relevanceFieldAndWeight}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceFieldAndWeight(OpenSearchSQLParser.RelevanceFieldAndWeightContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#relevanceFieldAndWeight}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceFieldAndWeight(OpenSearchSQLParser.RelevanceFieldAndWeightContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#relevanceFieldWeight}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceFieldWeight(OpenSearchSQLParser.RelevanceFieldWeightContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#relevanceFieldWeight}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceFieldWeight(OpenSearchSQLParser.RelevanceFieldWeightContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#relevanceField}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceField(OpenSearchSQLParser.RelevanceFieldContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#relevanceField}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceField(OpenSearchSQLParser.RelevanceFieldContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#relevanceQuery}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceQuery(OpenSearchSQLParser.RelevanceQueryContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#relevanceQuery}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceQuery(OpenSearchSQLParser.RelevanceQueryContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#relevanceArgValue}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceArgValue(OpenSearchSQLParser.RelevanceArgValueContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#relevanceArgValue}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceArgValue(OpenSearchSQLParser.RelevanceArgValueContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#highlightArgValue}.
	 * @param ctx the parse tree
	 */
	void enterHighlightArgValue(OpenSearchSQLParser.HighlightArgValueContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#highlightArgValue}.
	 * @param ctx the parse tree
	 */
	void exitHighlightArgValue(OpenSearchSQLParser.HighlightArgValueContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#alternateMultiMatchArgName}.
	 * @param ctx the parse tree
	 */
	void enterAlternateMultiMatchArgName(OpenSearchSQLParser.AlternateMultiMatchArgNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#alternateMultiMatchArgName}.
	 * @param ctx the parse tree
	 */
	void exitAlternateMultiMatchArgName(OpenSearchSQLParser.AlternateMultiMatchArgNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#alternateMultiMatchQuery}.
	 * @param ctx the parse tree
	 */
	void enterAlternateMultiMatchQuery(OpenSearchSQLParser.AlternateMultiMatchQueryContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#alternateMultiMatchQuery}.
	 * @param ctx the parse tree
	 */
	void exitAlternateMultiMatchQuery(OpenSearchSQLParser.AlternateMultiMatchQueryContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#alternateMultiMatchField}.
	 * @param ctx the parse tree
	 */
	void enterAlternateMultiMatchField(OpenSearchSQLParser.AlternateMultiMatchFieldContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#alternateMultiMatchField}.
	 * @param ctx the parse tree
	 */
	void exitAlternateMultiMatchField(OpenSearchSQLParser.AlternateMultiMatchFieldContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#tableName}.
	 * @param ctx the parse tree
	 */
	void enterTableName(OpenSearchSQLParser.TableNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#tableName}.
	 * @param ctx the parse tree
	 */
	void exitTableName(OpenSearchSQLParser.TableNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#columnName}.
	 * @param ctx the parse tree
	 */
	void enterColumnName(OpenSearchSQLParser.ColumnNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#columnName}.
	 * @param ctx the parse tree
	 */
	void exitColumnName(OpenSearchSQLParser.ColumnNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#allTupleFields}.
	 * @param ctx the parse tree
	 */
	void enterAllTupleFields(OpenSearchSQLParser.AllTupleFieldsContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#allTupleFields}.
	 * @param ctx the parse tree
	 */
	void exitAllTupleFields(OpenSearchSQLParser.AllTupleFieldsContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#alias}.
	 * @param ctx the parse tree
	 */
	void enterAlias(OpenSearchSQLParser.AliasContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#alias}.
	 * @param ctx the parse tree
	 */
	void exitAlias(OpenSearchSQLParser.AliasContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#qualifiedName}.
	 * @param ctx the parse tree
	 */
	void enterQualifiedName(OpenSearchSQLParser.QualifiedNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#qualifiedName}.
	 * @param ctx the parse tree
	 */
	void exitQualifiedName(OpenSearchSQLParser.QualifiedNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#ident}.
	 * @param ctx the parse tree
	 */
	void enterIdent(OpenSearchSQLParser.IdentContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#ident}.
	 * @param ctx the parse tree
	 */
	void exitIdent(OpenSearchSQLParser.IdentContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchSQLParser#keywordsCanBeId}.
	 * @param ctx the parse tree
	 */
	void enterKeywordsCanBeId(OpenSearchSQLParser.KeywordsCanBeIdContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchSQLParser#keywordsCanBeId}.
	 * @param ctx the parse tree
	 */
	void exitKeywordsCanBeId(OpenSearchSQLParser.KeywordsCanBeIdContext ctx);
}