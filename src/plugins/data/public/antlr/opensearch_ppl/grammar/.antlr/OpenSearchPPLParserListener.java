// Generated from /home/ubuntu/ws/OpenSearch-Dashboards/src/plugins/data/public/antlr/opensearch_ppl/grammar/OpenSearchPPLParser.g4 by ANTLR 4.13.1
import org.antlr.v4.runtime.tree.ParseTreeListener;

/**
 * This interface defines a complete listener for a parse tree produced by
 * {@link OpenSearchPPLParser}.
 */
public interface OpenSearchPPLParserListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#root}.
	 * @param ctx the parse tree
	 */
	void enterRoot(OpenSearchPPLParser.RootContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#root}.
	 * @param ctx the parse tree
	 */
	void exitRoot(OpenSearchPPLParser.RootContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#pplStatement}.
	 * @param ctx the parse tree
	 */
	void enterPplStatement(OpenSearchPPLParser.PplStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#pplStatement}.
	 * @param ctx the parse tree
	 */
	void exitPplStatement(OpenSearchPPLParser.PplStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#dmlStatement}.
	 * @param ctx the parse tree
	 */
	void enterDmlStatement(OpenSearchPPLParser.DmlStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#dmlStatement}.
	 * @param ctx the parse tree
	 */
	void exitDmlStatement(OpenSearchPPLParser.DmlStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#queryStatement}.
	 * @param ctx the parse tree
	 */
	void enterQueryStatement(OpenSearchPPLParser.QueryStatementContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#queryStatement}.
	 * @param ctx the parse tree
	 */
	void exitQueryStatement(OpenSearchPPLParser.QueryStatementContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#pplCommands}.
	 * @param ctx the parse tree
	 */
	void enterPplCommands(OpenSearchPPLParser.PplCommandsContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#pplCommands}.
	 * @param ctx the parse tree
	 */
	void exitPplCommands(OpenSearchPPLParser.PplCommandsContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#commands}.
	 * @param ctx the parse tree
	 */
	void enterCommands(OpenSearchPPLParser.CommandsContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#commands}.
	 * @param ctx the parse tree
	 */
	void exitCommands(OpenSearchPPLParser.CommandsContext ctx);
	/**
	 * Enter a parse tree produced by the {@code searchFrom}
	 * labeled alternative in {@link OpenSearchPPLParser#searchCommand}.
	 * @param ctx the parse tree
	 */
	void enterSearchFrom(OpenSearchPPLParser.SearchFromContext ctx);
	/**
	 * Exit a parse tree produced by the {@code searchFrom}
	 * labeled alternative in {@link OpenSearchPPLParser#searchCommand}.
	 * @param ctx the parse tree
	 */
	void exitSearchFrom(OpenSearchPPLParser.SearchFromContext ctx);
	/**
	 * Enter a parse tree produced by the {@code searchFromFilter}
	 * labeled alternative in {@link OpenSearchPPLParser#searchCommand}.
	 * @param ctx the parse tree
	 */
	void enterSearchFromFilter(OpenSearchPPLParser.SearchFromFilterContext ctx);
	/**
	 * Exit a parse tree produced by the {@code searchFromFilter}
	 * labeled alternative in {@link OpenSearchPPLParser#searchCommand}.
	 * @param ctx the parse tree
	 */
	void exitSearchFromFilter(OpenSearchPPLParser.SearchFromFilterContext ctx);
	/**
	 * Enter a parse tree produced by the {@code searchFilterFrom}
	 * labeled alternative in {@link OpenSearchPPLParser#searchCommand}.
	 * @param ctx the parse tree
	 */
	void enterSearchFilterFrom(OpenSearchPPLParser.SearchFilterFromContext ctx);
	/**
	 * Exit a parse tree produced by the {@code searchFilterFrom}
	 * labeled alternative in {@link OpenSearchPPLParser#searchCommand}.
	 * @param ctx the parse tree
	 */
	void exitSearchFilterFrom(OpenSearchPPLParser.SearchFilterFromContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#describeCommand}.
	 * @param ctx the parse tree
	 */
	void enterDescribeCommand(OpenSearchPPLParser.DescribeCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#describeCommand}.
	 * @param ctx the parse tree
	 */
	void exitDescribeCommand(OpenSearchPPLParser.DescribeCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#showDataSourcesCommand}.
	 * @param ctx the parse tree
	 */
	void enterShowDataSourcesCommand(OpenSearchPPLParser.ShowDataSourcesCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#showDataSourcesCommand}.
	 * @param ctx the parse tree
	 */
	void exitShowDataSourcesCommand(OpenSearchPPLParser.ShowDataSourcesCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#whereCommand}.
	 * @param ctx the parse tree
	 */
	void enterWhereCommand(OpenSearchPPLParser.WhereCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#whereCommand}.
	 * @param ctx the parse tree
	 */
	void exitWhereCommand(OpenSearchPPLParser.WhereCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#fieldsCommand}.
	 * @param ctx the parse tree
	 */
	void enterFieldsCommand(OpenSearchPPLParser.FieldsCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#fieldsCommand}.
	 * @param ctx the parse tree
	 */
	void exitFieldsCommand(OpenSearchPPLParser.FieldsCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#renameCommand}.
	 * @param ctx the parse tree
	 */
	void enterRenameCommand(OpenSearchPPLParser.RenameCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#renameCommand}.
	 * @param ctx the parse tree
	 */
	void exitRenameCommand(OpenSearchPPLParser.RenameCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#statsCommand}.
	 * @param ctx the parse tree
	 */
	void enterStatsCommand(OpenSearchPPLParser.StatsCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#statsCommand}.
	 * @param ctx the parse tree
	 */
	void exitStatsCommand(OpenSearchPPLParser.StatsCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#dedupCommand}.
	 * @param ctx the parse tree
	 */
	void enterDedupCommand(OpenSearchPPLParser.DedupCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#dedupCommand}.
	 * @param ctx the parse tree
	 */
	void exitDedupCommand(OpenSearchPPLParser.DedupCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#sortCommand}.
	 * @param ctx the parse tree
	 */
	void enterSortCommand(OpenSearchPPLParser.SortCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#sortCommand}.
	 * @param ctx the parse tree
	 */
	void exitSortCommand(OpenSearchPPLParser.SortCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#evalCommand}.
	 * @param ctx the parse tree
	 */
	void enterEvalCommand(OpenSearchPPLParser.EvalCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#evalCommand}.
	 * @param ctx the parse tree
	 */
	void exitEvalCommand(OpenSearchPPLParser.EvalCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#headCommand}.
	 * @param ctx the parse tree
	 */
	void enterHeadCommand(OpenSearchPPLParser.HeadCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#headCommand}.
	 * @param ctx the parse tree
	 */
	void exitHeadCommand(OpenSearchPPLParser.HeadCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#topCommand}.
	 * @param ctx the parse tree
	 */
	void enterTopCommand(OpenSearchPPLParser.TopCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#topCommand}.
	 * @param ctx the parse tree
	 */
	void exitTopCommand(OpenSearchPPLParser.TopCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#rareCommand}.
	 * @param ctx the parse tree
	 */
	void enterRareCommand(OpenSearchPPLParser.RareCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#rareCommand}.
	 * @param ctx the parse tree
	 */
	void exitRareCommand(OpenSearchPPLParser.RareCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#grokCommand}.
	 * @param ctx the parse tree
	 */
	void enterGrokCommand(OpenSearchPPLParser.GrokCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#grokCommand}.
	 * @param ctx the parse tree
	 */
	void exitGrokCommand(OpenSearchPPLParser.GrokCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#parseCommand}.
	 * @param ctx the parse tree
	 */
	void enterParseCommand(OpenSearchPPLParser.ParseCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#parseCommand}.
	 * @param ctx the parse tree
	 */
	void exitParseCommand(OpenSearchPPLParser.ParseCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#patternsCommand}.
	 * @param ctx the parse tree
	 */
	void enterPatternsCommand(OpenSearchPPLParser.PatternsCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#patternsCommand}.
	 * @param ctx the parse tree
	 */
	void exitPatternsCommand(OpenSearchPPLParser.PatternsCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#patternsParameter}.
	 * @param ctx the parse tree
	 */
	void enterPatternsParameter(OpenSearchPPLParser.PatternsParameterContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#patternsParameter}.
	 * @param ctx the parse tree
	 */
	void exitPatternsParameter(OpenSearchPPLParser.PatternsParameterContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#patternsMethod}.
	 * @param ctx the parse tree
	 */
	void enterPatternsMethod(OpenSearchPPLParser.PatternsMethodContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#patternsMethod}.
	 * @param ctx the parse tree
	 */
	void exitPatternsMethod(OpenSearchPPLParser.PatternsMethodContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#kmeansCommand}.
	 * @param ctx the parse tree
	 */
	void enterKmeansCommand(OpenSearchPPLParser.KmeansCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#kmeansCommand}.
	 * @param ctx the parse tree
	 */
	void exitKmeansCommand(OpenSearchPPLParser.KmeansCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#kmeansParameter}.
	 * @param ctx the parse tree
	 */
	void enterKmeansParameter(OpenSearchPPLParser.KmeansParameterContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#kmeansParameter}.
	 * @param ctx the parse tree
	 */
	void exitKmeansParameter(OpenSearchPPLParser.KmeansParameterContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#adCommand}.
	 * @param ctx the parse tree
	 */
	void enterAdCommand(OpenSearchPPLParser.AdCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#adCommand}.
	 * @param ctx the parse tree
	 */
	void exitAdCommand(OpenSearchPPLParser.AdCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#adParameter}.
	 * @param ctx the parse tree
	 */
	void enterAdParameter(OpenSearchPPLParser.AdParameterContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#adParameter}.
	 * @param ctx the parse tree
	 */
	void exitAdParameter(OpenSearchPPLParser.AdParameterContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#mlCommand}.
	 * @param ctx the parse tree
	 */
	void enterMlCommand(OpenSearchPPLParser.MlCommandContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#mlCommand}.
	 * @param ctx the parse tree
	 */
	void exitMlCommand(OpenSearchPPLParser.MlCommandContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#mlArg}.
	 * @param ctx the parse tree
	 */
	void enterMlArg(OpenSearchPPLParser.MlArgContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#mlArg}.
	 * @param ctx the parse tree
	 */
	void exitMlArg(OpenSearchPPLParser.MlArgContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#fromClause}.
	 * @param ctx the parse tree
	 */
	void enterFromClause(OpenSearchPPLParser.FromClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#fromClause}.
	 * @param ctx the parse tree
	 */
	void exitFromClause(OpenSearchPPLParser.FromClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#tableSourceClause}.
	 * @param ctx the parse tree
	 */
	void enterTableSourceClause(OpenSearchPPLParser.TableSourceClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#tableSourceClause}.
	 * @param ctx the parse tree
	 */
	void exitTableSourceClause(OpenSearchPPLParser.TableSourceClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#renameClasue}.
	 * @param ctx the parse tree
	 */
	void enterRenameClasue(OpenSearchPPLParser.RenameClasueContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#renameClasue}.
	 * @param ctx the parse tree
	 */
	void exitRenameClasue(OpenSearchPPLParser.RenameClasueContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#byClause}.
	 * @param ctx the parse tree
	 */
	void enterByClause(OpenSearchPPLParser.ByClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#byClause}.
	 * @param ctx the parse tree
	 */
	void exitByClause(OpenSearchPPLParser.ByClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#statsByClause}.
	 * @param ctx the parse tree
	 */
	void enterStatsByClause(OpenSearchPPLParser.StatsByClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#statsByClause}.
	 * @param ctx the parse tree
	 */
	void exitStatsByClause(OpenSearchPPLParser.StatsByClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#bySpanClause}.
	 * @param ctx the parse tree
	 */
	void enterBySpanClause(OpenSearchPPLParser.BySpanClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#bySpanClause}.
	 * @param ctx the parse tree
	 */
	void exitBySpanClause(OpenSearchPPLParser.BySpanClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#spanClause}.
	 * @param ctx the parse tree
	 */
	void enterSpanClause(OpenSearchPPLParser.SpanClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#spanClause}.
	 * @param ctx the parse tree
	 */
	void exitSpanClause(OpenSearchPPLParser.SpanClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#sortbyClause}.
	 * @param ctx the parse tree
	 */
	void enterSortbyClause(OpenSearchPPLParser.SortbyClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#sortbyClause}.
	 * @param ctx the parse tree
	 */
	void exitSortbyClause(OpenSearchPPLParser.SortbyClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#evalClause}.
	 * @param ctx the parse tree
	 */
	void enterEvalClause(OpenSearchPPLParser.EvalClauseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#evalClause}.
	 * @param ctx the parse tree
	 */
	void exitEvalClause(OpenSearchPPLParser.EvalClauseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#statsAggTerm}.
	 * @param ctx the parse tree
	 */
	void enterStatsAggTerm(OpenSearchPPLParser.StatsAggTermContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#statsAggTerm}.
	 * @param ctx the parse tree
	 */
	void exitStatsAggTerm(OpenSearchPPLParser.StatsAggTermContext ctx);
	/**
	 * Enter a parse tree produced by the {@code statsFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#statsFunction}.
	 * @param ctx the parse tree
	 */
	void enterStatsFunctionCall(OpenSearchPPLParser.StatsFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code statsFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#statsFunction}.
	 * @param ctx the parse tree
	 */
	void exitStatsFunctionCall(OpenSearchPPLParser.StatsFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code countAllFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#statsFunction}.
	 * @param ctx the parse tree
	 */
	void enterCountAllFunctionCall(OpenSearchPPLParser.CountAllFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code countAllFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#statsFunction}.
	 * @param ctx the parse tree
	 */
	void exitCountAllFunctionCall(OpenSearchPPLParser.CountAllFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code distinctCountFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#statsFunction}.
	 * @param ctx the parse tree
	 */
	void enterDistinctCountFunctionCall(OpenSearchPPLParser.DistinctCountFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code distinctCountFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#statsFunction}.
	 * @param ctx the parse tree
	 */
	void exitDistinctCountFunctionCall(OpenSearchPPLParser.DistinctCountFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code percentileAggFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#statsFunction}.
	 * @param ctx the parse tree
	 */
	void enterPercentileAggFunctionCall(OpenSearchPPLParser.PercentileAggFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code percentileAggFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#statsFunction}.
	 * @param ctx the parse tree
	 */
	void exitPercentileAggFunctionCall(OpenSearchPPLParser.PercentileAggFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code takeAggFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#statsFunction}.
	 * @param ctx the parse tree
	 */
	void enterTakeAggFunctionCall(OpenSearchPPLParser.TakeAggFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code takeAggFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#statsFunction}.
	 * @param ctx the parse tree
	 */
	void exitTakeAggFunctionCall(OpenSearchPPLParser.TakeAggFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#statsFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterStatsFunctionName(OpenSearchPPLParser.StatsFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#statsFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitStatsFunctionName(OpenSearchPPLParser.StatsFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#takeAggFunction}.
	 * @param ctx the parse tree
	 */
	void enterTakeAggFunction(OpenSearchPPLParser.TakeAggFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#takeAggFunction}.
	 * @param ctx the parse tree
	 */
	void exitTakeAggFunction(OpenSearchPPLParser.TakeAggFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#percentileAggFunction}.
	 * @param ctx the parse tree
	 */
	void enterPercentileAggFunction(OpenSearchPPLParser.PercentileAggFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#percentileAggFunction}.
	 * @param ctx the parse tree
	 */
	void exitPercentileAggFunction(OpenSearchPPLParser.PercentileAggFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#expression}.
	 * @param ctx the parse tree
	 */
	void enterExpression(OpenSearchPPLParser.ExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#expression}.
	 * @param ctx the parse tree
	 */
	void exitExpression(OpenSearchPPLParser.ExpressionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code relevanceExpr}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceExpr(OpenSearchPPLParser.RelevanceExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code relevanceExpr}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceExpr(OpenSearchPPLParser.RelevanceExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code logicalNot}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void enterLogicalNot(OpenSearchPPLParser.LogicalNotContext ctx);
	/**
	 * Exit a parse tree produced by the {@code logicalNot}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void exitLogicalNot(OpenSearchPPLParser.LogicalNotContext ctx);
	/**
	 * Enter a parse tree produced by the {@code booleanExpr}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void enterBooleanExpr(OpenSearchPPLParser.BooleanExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code booleanExpr}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void exitBooleanExpr(OpenSearchPPLParser.BooleanExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code logicalAnd}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void enterLogicalAnd(OpenSearchPPLParser.LogicalAndContext ctx);
	/**
	 * Exit a parse tree produced by the {@code logicalAnd}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void exitLogicalAnd(OpenSearchPPLParser.LogicalAndContext ctx);
	/**
	 * Enter a parse tree produced by the {@code comparsion}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void enterComparsion(OpenSearchPPLParser.ComparsionContext ctx);
	/**
	 * Exit a parse tree produced by the {@code comparsion}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void exitComparsion(OpenSearchPPLParser.ComparsionContext ctx);
	/**
	 * Enter a parse tree produced by the {@code logicalXor}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void enterLogicalXor(OpenSearchPPLParser.LogicalXorContext ctx);
	/**
	 * Exit a parse tree produced by the {@code logicalXor}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void exitLogicalXor(OpenSearchPPLParser.LogicalXorContext ctx);
	/**
	 * Enter a parse tree produced by the {@code logicalOr}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void enterLogicalOr(OpenSearchPPLParser.LogicalOrContext ctx);
	/**
	 * Exit a parse tree produced by the {@code logicalOr}
	 * labeled alternative in {@link OpenSearchPPLParser#logicalExpression}.
	 * @param ctx the parse tree
	 */
	void exitLogicalOr(OpenSearchPPLParser.LogicalOrContext ctx);
	/**
	 * Enter a parse tree produced by the {@code compareExpr}
	 * labeled alternative in {@link OpenSearchPPLParser#comparisonExpression}.
	 * @param ctx the parse tree
	 */
	void enterCompareExpr(OpenSearchPPLParser.CompareExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code compareExpr}
	 * labeled alternative in {@link OpenSearchPPLParser#comparisonExpression}.
	 * @param ctx the parse tree
	 */
	void exitCompareExpr(OpenSearchPPLParser.CompareExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code inExpr}
	 * labeled alternative in {@link OpenSearchPPLParser#comparisonExpression}.
	 * @param ctx the parse tree
	 */
	void enterInExpr(OpenSearchPPLParser.InExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code inExpr}
	 * labeled alternative in {@link OpenSearchPPLParser#comparisonExpression}.
	 * @param ctx the parse tree
	 */
	void exitInExpr(OpenSearchPPLParser.InExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code positionFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void enterPositionFunctionCall(OpenSearchPPLParser.PositionFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code positionFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void exitPositionFunctionCall(OpenSearchPPLParser.PositionFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code valueExpressionDefault}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void enterValueExpressionDefault(OpenSearchPPLParser.ValueExpressionDefaultContext ctx);
	/**
	 * Exit a parse tree produced by the {@code valueExpressionDefault}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void exitValueExpressionDefault(OpenSearchPPLParser.ValueExpressionDefaultContext ctx);
	/**
	 * Enter a parse tree produced by the {@code parentheticValueExpr}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void enterParentheticValueExpr(OpenSearchPPLParser.ParentheticValueExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code parentheticValueExpr}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void exitParentheticValueExpr(OpenSearchPPLParser.ParentheticValueExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code getFormatFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void enterGetFormatFunctionCall(OpenSearchPPLParser.GetFormatFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code getFormatFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void exitGetFormatFunctionCall(OpenSearchPPLParser.GetFormatFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code extractFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void enterExtractFunctionCall(OpenSearchPPLParser.ExtractFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code extractFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void exitExtractFunctionCall(OpenSearchPPLParser.ExtractFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by the {@code binaryArithmetic}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void enterBinaryArithmetic(OpenSearchPPLParser.BinaryArithmeticContext ctx);
	/**
	 * Exit a parse tree produced by the {@code binaryArithmetic}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void exitBinaryArithmetic(OpenSearchPPLParser.BinaryArithmeticContext ctx);
	/**
	 * Enter a parse tree produced by the {@code timestampFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void enterTimestampFunctionCall(OpenSearchPPLParser.TimestampFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by the {@code timestampFunctionCall}
	 * labeled alternative in {@link OpenSearchPPLParser#valueExpression}.
	 * @param ctx the parse tree
	 */
	void exitTimestampFunctionCall(OpenSearchPPLParser.TimestampFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#primaryExpression}.
	 * @param ctx the parse tree
	 */
	void enterPrimaryExpression(OpenSearchPPLParser.PrimaryExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#primaryExpression}.
	 * @param ctx the parse tree
	 */
	void exitPrimaryExpression(OpenSearchPPLParser.PrimaryExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#positionFunction}.
	 * @param ctx the parse tree
	 */
	void enterPositionFunction(OpenSearchPPLParser.PositionFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#positionFunction}.
	 * @param ctx the parse tree
	 */
	void exitPositionFunction(OpenSearchPPLParser.PositionFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#booleanExpression}.
	 * @param ctx the parse tree
	 */
	void enterBooleanExpression(OpenSearchPPLParser.BooleanExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#booleanExpression}.
	 * @param ctx the parse tree
	 */
	void exitBooleanExpression(OpenSearchPPLParser.BooleanExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#relevanceExpression}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceExpression(OpenSearchPPLParser.RelevanceExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#relevanceExpression}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceExpression(OpenSearchPPLParser.RelevanceExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#singleFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void enterSingleFieldRelevanceFunction(OpenSearchPPLParser.SingleFieldRelevanceFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#singleFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void exitSingleFieldRelevanceFunction(OpenSearchPPLParser.SingleFieldRelevanceFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#multiFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void enterMultiFieldRelevanceFunction(OpenSearchPPLParser.MultiFieldRelevanceFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#multiFieldRelevanceFunction}.
	 * @param ctx the parse tree
	 */
	void exitMultiFieldRelevanceFunction(OpenSearchPPLParser.MultiFieldRelevanceFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#tableSource}.
	 * @param ctx the parse tree
	 */
	void enterTableSource(OpenSearchPPLParser.TableSourceContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#tableSource}.
	 * @param ctx the parse tree
	 */
	void exitTableSource(OpenSearchPPLParser.TableSourceContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#tableFunction}.
	 * @param ctx the parse tree
	 */
	void enterTableFunction(OpenSearchPPLParser.TableFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#tableFunction}.
	 * @param ctx the parse tree
	 */
	void exitTableFunction(OpenSearchPPLParser.TableFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#fieldList}.
	 * @param ctx the parse tree
	 */
	void enterFieldList(OpenSearchPPLParser.FieldListContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#fieldList}.
	 * @param ctx the parse tree
	 */
	void exitFieldList(OpenSearchPPLParser.FieldListContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#wcFieldList}.
	 * @param ctx the parse tree
	 */
	void enterWcFieldList(OpenSearchPPLParser.WcFieldListContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#wcFieldList}.
	 * @param ctx the parse tree
	 */
	void exitWcFieldList(OpenSearchPPLParser.WcFieldListContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#sortField}.
	 * @param ctx the parse tree
	 */
	void enterSortField(OpenSearchPPLParser.SortFieldContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#sortField}.
	 * @param ctx the parse tree
	 */
	void exitSortField(OpenSearchPPLParser.SortFieldContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#sortFieldExpression}.
	 * @param ctx the parse tree
	 */
	void enterSortFieldExpression(OpenSearchPPLParser.SortFieldExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#sortFieldExpression}.
	 * @param ctx the parse tree
	 */
	void exitSortFieldExpression(OpenSearchPPLParser.SortFieldExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#fieldExpression}.
	 * @param ctx the parse tree
	 */
	void enterFieldExpression(OpenSearchPPLParser.FieldExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#fieldExpression}.
	 * @param ctx the parse tree
	 */
	void exitFieldExpression(OpenSearchPPLParser.FieldExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#wcFieldExpression}.
	 * @param ctx the parse tree
	 */
	void enterWcFieldExpression(OpenSearchPPLParser.WcFieldExpressionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#wcFieldExpression}.
	 * @param ctx the parse tree
	 */
	void exitWcFieldExpression(OpenSearchPPLParser.WcFieldExpressionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#evalFunctionCall}.
	 * @param ctx the parse tree
	 */
	void enterEvalFunctionCall(OpenSearchPPLParser.EvalFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#evalFunctionCall}.
	 * @param ctx the parse tree
	 */
	void exitEvalFunctionCall(OpenSearchPPLParser.EvalFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#dataTypeFunctionCall}.
	 * @param ctx the parse tree
	 */
	void enterDataTypeFunctionCall(OpenSearchPPLParser.DataTypeFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#dataTypeFunctionCall}.
	 * @param ctx the parse tree
	 */
	void exitDataTypeFunctionCall(OpenSearchPPLParser.DataTypeFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#booleanFunctionCall}.
	 * @param ctx the parse tree
	 */
	void enterBooleanFunctionCall(OpenSearchPPLParser.BooleanFunctionCallContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#booleanFunctionCall}.
	 * @param ctx the parse tree
	 */
	void exitBooleanFunctionCall(OpenSearchPPLParser.BooleanFunctionCallContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#convertedDataType}.
	 * @param ctx the parse tree
	 */
	void enterConvertedDataType(OpenSearchPPLParser.ConvertedDataTypeContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#convertedDataType}.
	 * @param ctx the parse tree
	 */
	void exitConvertedDataType(OpenSearchPPLParser.ConvertedDataTypeContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#evalFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterEvalFunctionName(OpenSearchPPLParser.EvalFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#evalFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitEvalFunctionName(OpenSearchPPLParser.EvalFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#functionArgs}.
	 * @param ctx the parse tree
	 */
	void enterFunctionArgs(OpenSearchPPLParser.FunctionArgsContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#functionArgs}.
	 * @param ctx the parse tree
	 */
	void exitFunctionArgs(OpenSearchPPLParser.FunctionArgsContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#functionArg}.
	 * @param ctx the parse tree
	 */
	void enterFunctionArg(OpenSearchPPLParser.FunctionArgContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#functionArg}.
	 * @param ctx the parse tree
	 */
	void exitFunctionArg(OpenSearchPPLParser.FunctionArgContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#relevanceArg}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceArg(OpenSearchPPLParser.RelevanceArgContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#relevanceArg}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceArg(OpenSearchPPLParser.RelevanceArgContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#relevanceArgName}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceArgName(OpenSearchPPLParser.RelevanceArgNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#relevanceArgName}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceArgName(OpenSearchPPLParser.RelevanceArgNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#relevanceFieldAndWeight}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceFieldAndWeight(OpenSearchPPLParser.RelevanceFieldAndWeightContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#relevanceFieldAndWeight}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceFieldAndWeight(OpenSearchPPLParser.RelevanceFieldAndWeightContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#relevanceFieldWeight}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceFieldWeight(OpenSearchPPLParser.RelevanceFieldWeightContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#relevanceFieldWeight}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceFieldWeight(OpenSearchPPLParser.RelevanceFieldWeightContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#relevanceField}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceField(OpenSearchPPLParser.RelevanceFieldContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#relevanceField}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceField(OpenSearchPPLParser.RelevanceFieldContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#relevanceQuery}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceQuery(OpenSearchPPLParser.RelevanceQueryContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#relevanceQuery}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceQuery(OpenSearchPPLParser.RelevanceQueryContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#relevanceArgValue}.
	 * @param ctx the parse tree
	 */
	void enterRelevanceArgValue(OpenSearchPPLParser.RelevanceArgValueContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#relevanceArgValue}.
	 * @param ctx the parse tree
	 */
	void exitRelevanceArgValue(OpenSearchPPLParser.RelevanceArgValueContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#mathematicalFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterMathematicalFunctionName(OpenSearchPPLParser.MathematicalFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#mathematicalFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitMathematicalFunctionName(OpenSearchPPLParser.MathematicalFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#trigonometricFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterTrigonometricFunctionName(OpenSearchPPLParser.TrigonometricFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#trigonometricFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitTrigonometricFunctionName(OpenSearchPPLParser.TrigonometricFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#dateTimeFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterDateTimeFunctionName(OpenSearchPPLParser.DateTimeFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#dateTimeFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitDateTimeFunctionName(OpenSearchPPLParser.DateTimeFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#getFormatFunction}.
	 * @param ctx the parse tree
	 */
	void enterGetFormatFunction(OpenSearchPPLParser.GetFormatFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#getFormatFunction}.
	 * @param ctx the parse tree
	 */
	void exitGetFormatFunction(OpenSearchPPLParser.GetFormatFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#getFormatType}.
	 * @param ctx the parse tree
	 */
	void enterGetFormatType(OpenSearchPPLParser.GetFormatTypeContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#getFormatType}.
	 * @param ctx the parse tree
	 */
	void exitGetFormatType(OpenSearchPPLParser.GetFormatTypeContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#extractFunction}.
	 * @param ctx the parse tree
	 */
	void enterExtractFunction(OpenSearchPPLParser.ExtractFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#extractFunction}.
	 * @param ctx the parse tree
	 */
	void exitExtractFunction(OpenSearchPPLParser.ExtractFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#simpleDateTimePart}.
	 * @param ctx the parse tree
	 */
	void enterSimpleDateTimePart(OpenSearchPPLParser.SimpleDateTimePartContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#simpleDateTimePart}.
	 * @param ctx the parse tree
	 */
	void exitSimpleDateTimePart(OpenSearchPPLParser.SimpleDateTimePartContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#complexDateTimePart}.
	 * @param ctx the parse tree
	 */
	void enterComplexDateTimePart(OpenSearchPPLParser.ComplexDateTimePartContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#complexDateTimePart}.
	 * @param ctx the parse tree
	 */
	void exitComplexDateTimePart(OpenSearchPPLParser.ComplexDateTimePartContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#datetimePart}.
	 * @param ctx the parse tree
	 */
	void enterDatetimePart(OpenSearchPPLParser.DatetimePartContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#datetimePart}.
	 * @param ctx the parse tree
	 */
	void exitDatetimePart(OpenSearchPPLParser.DatetimePartContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#timestampFunction}.
	 * @param ctx the parse tree
	 */
	void enterTimestampFunction(OpenSearchPPLParser.TimestampFunctionContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#timestampFunction}.
	 * @param ctx the parse tree
	 */
	void exitTimestampFunction(OpenSearchPPLParser.TimestampFunctionContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#timestampFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterTimestampFunctionName(OpenSearchPPLParser.TimestampFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#timestampFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitTimestampFunctionName(OpenSearchPPLParser.TimestampFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#conditionFunctionBase}.
	 * @param ctx the parse tree
	 */
	void enterConditionFunctionBase(OpenSearchPPLParser.ConditionFunctionBaseContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#conditionFunctionBase}.
	 * @param ctx the parse tree
	 */
	void exitConditionFunctionBase(OpenSearchPPLParser.ConditionFunctionBaseContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#systemFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterSystemFunctionName(OpenSearchPPLParser.SystemFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#systemFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitSystemFunctionName(OpenSearchPPLParser.SystemFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#textFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterTextFunctionName(OpenSearchPPLParser.TextFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#textFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitTextFunctionName(OpenSearchPPLParser.TextFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#positionFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterPositionFunctionName(OpenSearchPPLParser.PositionFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#positionFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitPositionFunctionName(OpenSearchPPLParser.PositionFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#comparisonOperator}.
	 * @param ctx the parse tree
	 */
	void enterComparisonOperator(OpenSearchPPLParser.ComparisonOperatorContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#comparisonOperator}.
	 * @param ctx the parse tree
	 */
	void exitComparisonOperator(OpenSearchPPLParser.ComparisonOperatorContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#singleFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterSingleFieldRelevanceFunctionName(OpenSearchPPLParser.SingleFieldRelevanceFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#singleFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitSingleFieldRelevanceFunctionName(OpenSearchPPLParser.SingleFieldRelevanceFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#multiFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void enterMultiFieldRelevanceFunctionName(OpenSearchPPLParser.MultiFieldRelevanceFunctionNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#multiFieldRelevanceFunctionName}.
	 * @param ctx the parse tree
	 */
	void exitMultiFieldRelevanceFunctionName(OpenSearchPPLParser.MultiFieldRelevanceFunctionNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#literalValue}.
	 * @param ctx the parse tree
	 */
	void enterLiteralValue(OpenSearchPPLParser.LiteralValueContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#literalValue}.
	 * @param ctx the parse tree
	 */
	void exitLiteralValue(OpenSearchPPLParser.LiteralValueContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#intervalLiteral}.
	 * @param ctx the parse tree
	 */
	void enterIntervalLiteral(OpenSearchPPLParser.IntervalLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#intervalLiteral}.
	 * @param ctx the parse tree
	 */
	void exitIntervalLiteral(OpenSearchPPLParser.IntervalLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#stringLiteral}.
	 * @param ctx the parse tree
	 */
	void enterStringLiteral(OpenSearchPPLParser.StringLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#stringLiteral}.
	 * @param ctx the parse tree
	 */
	void exitStringLiteral(OpenSearchPPLParser.StringLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#integerLiteral}.
	 * @param ctx the parse tree
	 */
	void enterIntegerLiteral(OpenSearchPPLParser.IntegerLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#integerLiteral}.
	 * @param ctx the parse tree
	 */
	void exitIntegerLiteral(OpenSearchPPLParser.IntegerLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#decimalLiteral}.
	 * @param ctx the parse tree
	 */
	void enterDecimalLiteral(OpenSearchPPLParser.DecimalLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#decimalLiteral}.
	 * @param ctx the parse tree
	 */
	void exitDecimalLiteral(OpenSearchPPLParser.DecimalLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#booleanLiteral}.
	 * @param ctx the parse tree
	 */
	void enterBooleanLiteral(OpenSearchPPLParser.BooleanLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#booleanLiteral}.
	 * @param ctx the parse tree
	 */
	void exitBooleanLiteral(OpenSearchPPLParser.BooleanLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#datetimeLiteral}.
	 * @param ctx the parse tree
	 */
	void enterDatetimeLiteral(OpenSearchPPLParser.DatetimeLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#datetimeLiteral}.
	 * @param ctx the parse tree
	 */
	void exitDatetimeLiteral(OpenSearchPPLParser.DatetimeLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#dateLiteral}.
	 * @param ctx the parse tree
	 */
	void enterDateLiteral(OpenSearchPPLParser.DateLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#dateLiteral}.
	 * @param ctx the parse tree
	 */
	void exitDateLiteral(OpenSearchPPLParser.DateLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#timeLiteral}.
	 * @param ctx the parse tree
	 */
	void enterTimeLiteral(OpenSearchPPLParser.TimeLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#timeLiteral}.
	 * @param ctx the parse tree
	 */
	void exitTimeLiteral(OpenSearchPPLParser.TimeLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#timestampLiteral}.
	 * @param ctx the parse tree
	 */
	void enterTimestampLiteral(OpenSearchPPLParser.TimestampLiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#timestampLiteral}.
	 * @param ctx the parse tree
	 */
	void exitTimestampLiteral(OpenSearchPPLParser.TimestampLiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#intervalUnit}.
	 * @param ctx the parse tree
	 */
	void enterIntervalUnit(OpenSearchPPLParser.IntervalUnitContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#intervalUnit}.
	 * @param ctx the parse tree
	 */
	void exitIntervalUnit(OpenSearchPPLParser.IntervalUnitContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#timespanUnit}.
	 * @param ctx the parse tree
	 */
	void enterTimespanUnit(OpenSearchPPLParser.TimespanUnitContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#timespanUnit}.
	 * @param ctx the parse tree
	 */
	void exitTimespanUnit(OpenSearchPPLParser.TimespanUnitContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#valueList}.
	 * @param ctx the parse tree
	 */
	void enterValueList(OpenSearchPPLParser.ValueListContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#valueList}.
	 * @param ctx the parse tree
	 */
	void exitValueList(OpenSearchPPLParser.ValueListContext ctx);
	/**
	 * Enter a parse tree produced by the {@code identsAsQualifiedName}
	 * labeled alternative in {@link OpenSearchPPLParser#qualifiedName}.
	 * @param ctx the parse tree
	 */
	void enterIdentsAsQualifiedName(OpenSearchPPLParser.IdentsAsQualifiedNameContext ctx);
	/**
	 * Exit a parse tree produced by the {@code identsAsQualifiedName}
	 * labeled alternative in {@link OpenSearchPPLParser#qualifiedName}.
	 * @param ctx the parse tree
	 */
	void exitIdentsAsQualifiedName(OpenSearchPPLParser.IdentsAsQualifiedNameContext ctx);
	/**
	 * Enter a parse tree produced by the {@code identsAsTableQualifiedName}
	 * labeled alternative in {@link OpenSearchPPLParser#tableQualifiedName}.
	 * @param ctx the parse tree
	 */
	void enterIdentsAsTableQualifiedName(OpenSearchPPLParser.IdentsAsTableQualifiedNameContext ctx);
	/**
	 * Exit a parse tree produced by the {@code identsAsTableQualifiedName}
	 * labeled alternative in {@link OpenSearchPPLParser#tableQualifiedName}.
	 * @param ctx the parse tree
	 */
	void exitIdentsAsTableQualifiedName(OpenSearchPPLParser.IdentsAsTableQualifiedNameContext ctx);
	/**
	 * Enter a parse tree produced by the {@code identsAsWildcardQualifiedName}
	 * labeled alternative in {@link OpenSearchPPLParser#wcQualifiedName}.
	 * @param ctx the parse tree
	 */
	void enterIdentsAsWildcardQualifiedName(OpenSearchPPLParser.IdentsAsWildcardQualifiedNameContext ctx);
	/**
	 * Exit a parse tree produced by the {@code identsAsWildcardQualifiedName}
	 * labeled alternative in {@link OpenSearchPPLParser#wcQualifiedName}.
	 * @param ctx the parse tree
	 */
	void exitIdentsAsWildcardQualifiedName(OpenSearchPPLParser.IdentsAsWildcardQualifiedNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#ident}.
	 * @param ctx the parse tree
	 */
	void enterIdent(OpenSearchPPLParser.IdentContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#ident}.
	 * @param ctx the parse tree
	 */
	void exitIdent(OpenSearchPPLParser.IdentContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#tableIdent}.
	 * @param ctx the parse tree
	 */
	void enterTableIdent(OpenSearchPPLParser.TableIdentContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#tableIdent}.
	 * @param ctx the parse tree
	 */
	void exitTableIdent(OpenSearchPPLParser.TableIdentContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#wildcard}.
	 * @param ctx the parse tree
	 */
	void enterWildcard(OpenSearchPPLParser.WildcardContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#wildcard}.
	 * @param ctx the parse tree
	 */
	void exitWildcard(OpenSearchPPLParser.WildcardContext ctx);
	/**
	 * Enter a parse tree produced by {@link OpenSearchPPLParser#keywordsCanBeId}.
	 * @param ctx the parse tree
	 */
	void enterKeywordsCanBeId(OpenSearchPPLParser.KeywordsCanBeIdContext ctx);
	/**
	 * Exit a parse tree produced by {@link OpenSearchPPLParser#keywordsCanBeId}.
	 * @param ctx the parse tree
	 */
	void exitKeywordsCanBeId(OpenSearchPPLParser.KeywordsCanBeIdContext ctx);
}