// Generated from /home/ubuntu/ws/OpenSearch-Dashboards/src/plugins/data/public/antlr/opensearch_ppl/grammar/OpenSearchPPLParser.g4 by ANTLR 4.13.1

import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";


import { RootContext } from "./OpenSearchPPLParser.js";
import { PplStatementContext } from "./OpenSearchPPLParser.js";
import { DmlStatementContext } from "./OpenSearchPPLParser.js";
import { QueryStatementContext } from "./OpenSearchPPLParser.js";
import { PplCommandsContext } from "./OpenSearchPPLParser.js";
import { CommandsContext } from "./OpenSearchPPLParser.js";
import { SearchFromContext } from "./OpenSearchPPLParser.js";
import { SearchFromFilterContext } from "./OpenSearchPPLParser.js";
import { SearchFilterFromContext } from "./OpenSearchPPLParser.js";
import { DescribeCommandContext } from "./OpenSearchPPLParser.js";
import { ShowDataSourcesCommandContext } from "./OpenSearchPPLParser.js";
import { WhereCommandContext } from "./OpenSearchPPLParser.js";
import { FieldsCommandContext } from "./OpenSearchPPLParser.js";
import { RenameCommandContext } from "./OpenSearchPPLParser.js";
import { StatsCommandContext } from "./OpenSearchPPLParser.js";
import { DedupCommandContext } from "./OpenSearchPPLParser.js";
import { SortCommandContext } from "./OpenSearchPPLParser.js";
import { EvalCommandContext } from "./OpenSearchPPLParser.js";
import { HeadCommandContext } from "./OpenSearchPPLParser.js";
import { TopCommandContext } from "./OpenSearchPPLParser.js";
import { RareCommandContext } from "./OpenSearchPPLParser.js";
import { GrokCommandContext } from "./OpenSearchPPLParser.js";
import { ParseCommandContext } from "./OpenSearchPPLParser.js";
import { PatternsCommandContext } from "./OpenSearchPPLParser.js";
import { PatternsParameterContext } from "./OpenSearchPPLParser.js";
import { PatternsMethodContext } from "./OpenSearchPPLParser.js";
import { KmeansCommandContext } from "./OpenSearchPPLParser.js";
import { KmeansParameterContext } from "./OpenSearchPPLParser.js";
import { AdCommandContext } from "./OpenSearchPPLParser.js";
import { AdParameterContext } from "./OpenSearchPPLParser.js";
import { MlCommandContext } from "./OpenSearchPPLParser.js";
import { MlArgContext } from "./OpenSearchPPLParser.js";
import { FromClauseContext } from "./OpenSearchPPLParser.js";
import { TableSourceClauseContext } from "./OpenSearchPPLParser.js";
import { RenameClasueContext } from "./OpenSearchPPLParser.js";
import { ByClauseContext } from "./OpenSearchPPLParser.js";
import { StatsByClauseContext } from "./OpenSearchPPLParser.js";
import { BySpanClauseContext } from "./OpenSearchPPLParser.js";
import { SpanClauseContext } from "./OpenSearchPPLParser.js";
import { SortbyClauseContext } from "./OpenSearchPPLParser.js";
import { EvalClauseContext } from "./OpenSearchPPLParser.js";
import { StatsAggTermContext } from "./OpenSearchPPLParser.js";
import { StatsFunctionCallContext } from "./OpenSearchPPLParser.js";
import { CountAllFunctionCallContext } from "./OpenSearchPPLParser.js";
import { DistinctCountFunctionCallContext } from "./OpenSearchPPLParser.js";
import { PercentileAggFunctionCallContext } from "./OpenSearchPPLParser.js";
import { TakeAggFunctionCallContext } from "./OpenSearchPPLParser.js";
import { StatsFunctionNameContext } from "./OpenSearchPPLParser.js";
import { TakeAggFunctionContext } from "./OpenSearchPPLParser.js";
import { PercentileAggFunctionContext } from "./OpenSearchPPLParser.js";
import { ExpressionContext } from "./OpenSearchPPLParser.js";
import { RelevanceExprContext } from "./OpenSearchPPLParser.js";
import { LogicalNotContext } from "./OpenSearchPPLParser.js";
import { BooleanExprContext } from "./OpenSearchPPLParser.js";
import { LogicalAndContext } from "./OpenSearchPPLParser.js";
import { ComparsionContext } from "./OpenSearchPPLParser.js";
import { LogicalXorContext } from "./OpenSearchPPLParser.js";
import { LogicalOrContext } from "./OpenSearchPPLParser.js";
import { CompareExprContext } from "./OpenSearchPPLParser.js";
import { InExprContext } from "./OpenSearchPPLParser.js";
import { PositionFunctionCallContext } from "./OpenSearchPPLParser.js";
import { ValueExpressionDefaultContext } from "./OpenSearchPPLParser.js";
import { ParentheticValueExprContext } from "./OpenSearchPPLParser.js";
import { GetFormatFunctionCallContext } from "./OpenSearchPPLParser.js";
import { ExtractFunctionCallContext } from "./OpenSearchPPLParser.js";
import { BinaryArithmeticContext } from "./OpenSearchPPLParser.js";
import { TimestampFunctionCallContext } from "./OpenSearchPPLParser.js";
import { PrimaryExpressionContext } from "./OpenSearchPPLParser.js";
import { PositionFunctionContext } from "./OpenSearchPPLParser.js";
import { BooleanExpressionContext } from "./OpenSearchPPLParser.js";
import { RelevanceExpressionContext } from "./OpenSearchPPLParser.js";
import { SingleFieldRelevanceFunctionContext } from "./OpenSearchPPLParser.js";
import { MultiFieldRelevanceFunctionContext } from "./OpenSearchPPLParser.js";
import { TableSourceContext } from "./OpenSearchPPLParser.js";
import { TableFunctionContext } from "./OpenSearchPPLParser.js";
import { FieldListContext } from "./OpenSearchPPLParser.js";
import { WcFieldListContext } from "./OpenSearchPPLParser.js";
import { SortFieldContext } from "./OpenSearchPPLParser.js";
import { SortFieldExpressionContext } from "./OpenSearchPPLParser.js";
import { FieldExpressionContext } from "./OpenSearchPPLParser.js";
import { WcFieldExpressionContext } from "./OpenSearchPPLParser.js";
import { EvalFunctionCallContext } from "./OpenSearchPPLParser.js";
import { DataTypeFunctionCallContext } from "./OpenSearchPPLParser.js";
import { BooleanFunctionCallContext } from "./OpenSearchPPLParser.js";
import { ConvertedDataTypeContext } from "./OpenSearchPPLParser.js";
import { EvalFunctionNameContext } from "./OpenSearchPPLParser.js";
import { FunctionArgsContext } from "./OpenSearchPPLParser.js";
import { FunctionArgContext } from "./OpenSearchPPLParser.js";
import { RelevanceArgContext } from "./OpenSearchPPLParser.js";
import { RelevanceArgNameContext } from "./OpenSearchPPLParser.js";
import { RelevanceFieldAndWeightContext } from "./OpenSearchPPLParser.js";
import { RelevanceFieldWeightContext } from "./OpenSearchPPLParser.js";
import { RelevanceFieldContext } from "./OpenSearchPPLParser.js";
import { RelevanceQueryContext } from "./OpenSearchPPLParser.js";
import { RelevanceArgValueContext } from "./OpenSearchPPLParser.js";
import { MathematicalFunctionNameContext } from "./OpenSearchPPLParser.js";
import { TrigonometricFunctionNameContext } from "./OpenSearchPPLParser.js";
import { DateTimeFunctionNameContext } from "./OpenSearchPPLParser.js";
import { GetFormatFunctionContext } from "./OpenSearchPPLParser.js";
import { GetFormatTypeContext } from "./OpenSearchPPLParser.js";
import { ExtractFunctionContext } from "./OpenSearchPPLParser.js";
import { SimpleDateTimePartContext } from "./OpenSearchPPLParser.js";
import { ComplexDateTimePartContext } from "./OpenSearchPPLParser.js";
import { DatetimePartContext } from "./OpenSearchPPLParser.js";
import { TimestampFunctionContext } from "./OpenSearchPPLParser.js";
import { TimestampFunctionNameContext } from "./OpenSearchPPLParser.js";
import { ConditionFunctionBaseContext } from "./OpenSearchPPLParser.js";
import { SystemFunctionNameContext } from "./OpenSearchPPLParser.js";
import { TextFunctionNameContext } from "./OpenSearchPPLParser.js";
import { PositionFunctionNameContext } from "./OpenSearchPPLParser.js";
import { ComparisonOperatorContext } from "./OpenSearchPPLParser.js";
import { SingleFieldRelevanceFunctionNameContext } from "./OpenSearchPPLParser.js";
import { MultiFieldRelevanceFunctionNameContext } from "./OpenSearchPPLParser.js";
import { LiteralValueContext } from "./OpenSearchPPLParser.js";
import { IntervalLiteralContext } from "./OpenSearchPPLParser.js";
import { StringLiteralContext } from "./OpenSearchPPLParser.js";
import { IntegerLiteralContext } from "./OpenSearchPPLParser.js";
import { DecimalLiteralContext } from "./OpenSearchPPLParser.js";
import { BooleanLiteralContext } from "./OpenSearchPPLParser.js";
import { DatetimeLiteralContext } from "./OpenSearchPPLParser.js";
import { DateLiteralContext } from "./OpenSearchPPLParser.js";
import { TimeLiteralContext } from "./OpenSearchPPLParser.js";
import { TimestampLiteralContext } from "./OpenSearchPPLParser.js";
import { IntervalUnitContext } from "./OpenSearchPPLParser.js";
import { TimespanUnitContext } from "./OpenSearchPPLParser.js";
import { ValueListContext } from "./OpenSearchPPLParser.js";
import { IdentsAsQualifiedNameContext } from "./OpenSearchPPLParser.js";
import { IdentsAsTableQualifiedNameContext } from "./OpenSearchPPLParser.js";
import { IdentsAsWildcardQualifiedNameContext } from "./OpenSearchPPLParser.js";
import { IdentContext } from "./OpenSearchPPLParser.js";
import { TableIdentContext } from "./OpenSearchPPLParser.js";
import { WildcardContext } from "./OpenSearchPPLParser.js";
import { KeywordsCanBeIdContext } from "./OpenSearchPPLParser.js";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `OpenSearchPPLParser`.
 */
export class OpenSearchPPLParserListener implements ParseTreeListener {
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.root`.
     * @param ctx the parse tree
     */
    enterRoot?: (ctx: RootContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.root`.
     * @param ctx the parse tree
     */
    exitRoot?: (ctx: RootContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.pplStatement`.
     * @param ctx the parse tree
     */
    enterPplStatement?: (ctx: PplStatementContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.pplStatement`.
     * @param ctx the parse tree
     */
    exitPplStatement?: (ctx: PplStatementContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.dmlStatement`.
     * @param ctx the parse tree
     */
    enterDmlStatement?: (ctx: DmlStatementContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.dmlStatement`.
     * @param ctx the parse tree
     */
    exitDmlStatement?: (ctx: DmlStatementContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.queryStatement`.
     * @param ctx the parse tree
     */
    enterQueryStatement?: (ctx: QueryStatementContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.queryStatement`.
     * @param ctx the parse tree
     */
    exitQueryStatement?: (ctx: QueryStatementContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.pplCommands`.
     * @param ctx the parse tree
     */
    enterPplCommands?: (ctx: PplCommandsContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.pplCommands`.
     * @param ctx the parse tree
     */
    exitPplCommands?: (ctx: PplCommandsContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.commands`.
     * @param ctx the parse tree
     */
    enterCommands?: (ctx: CommandsContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.commands`.
     * @param ctx the parse tree
     */
    exitCommands?: (ctx: CommandsContext) => void;
    /**
     * Enter a parse tree produced by the `searchFrom`
     * labeled alternative in `OpenSearchPPLParser.searchCommand`.
     * @param ctx the parse tree
     */
    enterSearchFrom?: (ctx: SearchFromContext) => void;
    /**
     * Exit a parse tree produced by the `searchFrom`
     * labeled alternative in `OpenSearchPPLParser.searchCommand`.
     * @param ctx the parse tree
     */
    exitSearchFrom?: (ctx: SearchFromContext) => void;
    /**
     * Enter a parse tree produced by the `searchFromFilter`
     * labeled alternative in `OpenSearchPPLParser.searchCommand`.
     * @param ctx the parse tree
     */
    enterSearchFromFilter?: (ctx: SearchFromFilterContext) => void;
    /**
     * Exit a parse tree produced by the `searchFromFilter`
     * labeled alternative in `OpenSearchPPLParser.searchCommand`.
     * @param ctx the parse tree
     */
    exitSearchFromFilter?: (ctx: SearchFromFilterContext) => void;
    /**
     * Enter a parse tree produced by the `searchFilterFrom`
     * labeled alternative in `OpenSearchPPLParser.searchCommand`.
     * @param ctx the parse tree
     */
    enterSearchFilterFrom?: (ctx: SearchFilterFromContext) => void;
    /**
     * Exit a parse tree produced by the `searchFilterFrom`
     * labeled alternative in `OpenSearchPPLParser.searchCommand`.
     * @param ctx the parse tree
     */
    exitSearchFilterFrom?: (ctx: SearchFilterFromContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.describeCommand`.
     * @param ctx the parse tree
     */
    enterDescribeCommand?: (ctx: DescribeCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.describeCommand`.
     * @param ctx the parse tree
     */
    exitDescribeCommand?: (ctx: DescribeCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.showDataSourcesCommand`.
     * @param ctx the parse tree
     */
    enterShowDataSourcesCommand?: (ctx: ShowDataSourcesCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.showDataSourcesCommand`.
     * @param ctx the parse tree
     */
    exitShowDataSourcesCommand?: (ctx: ShowDataSourcesCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.whereCommand`.
     * @param ctx the parse tree
     */
    enterWhereCommand?: (ctx: WhereCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.whereCommand`.
     * @param ctx the parse tree
     */
    exitWhereCommand?: (ctx: WhereCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.fieldsCommand`.
     * @param ctx the parse tree
     */
    enterFieldsCommand?: (ctx: FieldsCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.fieldsCommand`.
     * @param ctx the parse tree
     */
    exitFieldsCommand?: (ctx: FieldsCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.renameCommand`.
     * @param ctx the parse tree
     */
    enterRenameCommand?: (ctx: RenameCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.renameCommand`.
     * @param ctx the parse tree
     */
    exitRenameCommand?: (ctx: RenameCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.statsCommand`.
     * @param ctx the parse tree
     */
    enterStatsCommand?: (ctx: StatsCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.statsCommand`.
     * @param ctx the parse tree
     */
    exitStatsCommand?: (ctx: StatsCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.dedupCommand`.
     * @param ctx the parse tree
     */
    enterDedupCommand?: (ctx: DedupCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.dedupCommand`.
     * @param ctx the parse tree
     */
    exitDedupCommand?: (ctx: DedupCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.sortCommand`.
     * @param ctx the parse tree
     */
    enterSortCommand?: (ctx: SortCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.sortCommand`.
     * @param ctx the parse tree
     */
    exitSortCommand?: (ctx: SortCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.evalCommand`.
     * @param ctx the parse tree
     */
    enterEvalCommand?: (ctx: EvalCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.evalCommand`.
     * @param ctx the parse tree
     */
    exitEvalCommand?: (ctx: EvalCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.headCommand`.
     * @param ctx the parse tree
     */
    enterHeadCommand?: (ctx: HeadCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.headCommand`.
     * @param ctx the parse tree
     */
    exitHeadCommand?: (ctx: HeadCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.topCommand`.
     * @param ctx the parse tree
     */
    enterTopCommand?: (ctx: TopCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.topCommand`.
     * @param ctx the parse tree
     */
    exitTopCommand?: (ctx: TopCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.rareCommand`.
     * @param ctx the parse tree
     */
    enterRareCommand?: (ctx: RareCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.rareCommand`.
     * @param ctx the parse tree
     */
    exitRareCommand?: (ctx: RareCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.grokCommand`.
     * @param ctx the parse tree
     */
    enterGrokCommand?: (ctx: GrokCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.grokCommand`.
     * @param ctx the parse tree
     */
    exitGrokCommand?: (ctx: GrokCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.parseCommand`.
     * @param ctx the parse tree
     */
    enterParseCommand?: (ctx: ParseCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.parseCommand`.
     * @param ctx the parse tree
     */
    exitParseCommand?: (ctx: ParseCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.patternsCommand`.
     * @param ctx the parse tree
     */
    enterPatternsCommand?: (ctx: PatternsCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.patternsCommand`.
     * @param ctx the parse tree
     */
    exitPatternsCommand?: (ctx: PatternsCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.patternsParameter`.
     * @param ctx the parse tree
     */
    enterPatternsParameter?: (ctx: PatternsParameterContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.patternsParameter`.
     * @param ctx the parse tree
     */
    exitPatternsParameter?: (ctx: PatternsParameterContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.patternsMethod`.
     * @param ctx the parse tree
     */
    enterPatternsMethod?: (ctx: PatternsMethodContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.patternsMethod`.
     * @param ctx the parse tree
     */
    exitPatternsMethod?: (ctx: PatternsMethodContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.kmeansCommand`.
     * @param ctx the parse tree
     */
    enterKmeansCommand?: (ctx: KmeansCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.kmeansCommand`.
     * @param ctx the parse tree
     */
    exitKmeansCommand?: (ctx: KmeansCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.kmeansParameter`.
     * @param ctx the parse tree
     */
    enterKmeansParameter?: (ctx: KmeansParameterContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.kmeansParameter`.
     * @param ctx the parse tree
     */
    exitKmeansParameter?: (ctx: KmeansParameterContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.adCommand`.
     * @param ctx the parse tree
     */
    enterAdCommand?: (ctx: AdCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.adCommand`.
     * @param ctx the parse tree
     */
    exitAdCommand?: (ctx: AdCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.adParameter`.
     * @param ctx the parse tree
     */
    enterAdParameter?: (ctx: AdParameterContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.adParameter`.
     * @param ctx the parse tree
     */
    exitAdParameter?: (ctx: AdParameterContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.mlCommand`.
     * @param ctx the parse tree
     */
    enterMlCommand?: (ctx: MlCommandContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.mlCommand`.
     * @param ctx the parse tree
     */
    exitMlCommand?: (ctx: MlCommandContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.mlArg`.
     * @param ctx the parse tree
     */
    enterMlArg?: (ctx: MlArgContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.mlArg`.
     * @param ctx the parse tree
     */
    exitMlArg?: (ctx: MlArgContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.fromClause`.
     * @param ctx the parse tree
     */
    enterFromClause?: (ctx: FromClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.fromClause`.
     * @param ctx the parse tree
     */
    exitFromClause?: (ctx: FromClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.tableSourceClause`.
     * @param ctx the parse tree
     */
    enterTableSourceClause?: (ctx: TableSourceClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.tableSourceClause`.
     * @param ctx the parse tree
     */
    exitTableSourceClause?: (ctx: TableSourceClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.renameClasue`.
     * @param ctx the parse tree
     */
    enterRenameClasue?: (ctx: RenameClasueContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.renameClasue`.
     * @param ctx the parse tree
     */
    exitRenameClasue?: (ctx: RenameClasueContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.byClause`.
     * @param ctx the parse tree
     */
    enterByClause?: (ctx: ByClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.byClause`.
     * @param ctx the parse tree
     */
    exitByClause?: (ctx: ByClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.statsByClause`.
     * @param ctx the parse tree
     */
    enterStatsByClause?: (ctx: StatsByClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.statsByClause`.
     * @param ctx the parse tree
     */
    exitStatsByClause?: (ctx: StatsByClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.bySpanClause`.
     * @param ctx the parse tree
     */
    enterBySpanClause?: (ctx: BySpanClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.bySpanClause`.
     * @param ctx the parse tree
     */
    exitBySpanClause?: (ctx: BySpanClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.spanClause`.
     * @param ctx the parse tree
     */
    enterSpanClause?: (ctx: SpanClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.spanClause`.
     * @param ctx the parse tree
     */
    exitSpanClause?: (ctx: SpanClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.sortbyClause`.
     * @param ctx the parse tree
     */
    enterSortbyClause?: (ctx: SortbyClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.sortbyClause`.
     * @param ctx the parse tree
     */
    exitSortbyClause?: (ctx: SortbyClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.evalClause`.
     * @param ctx the parse tree
     */
    enterEvalClause?: (ctx: EvalClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.evalClause`.
     * @param ctx the parse tree
     */
    exitEvalClause?: (ctx: EvalClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.statsAggTerm`.
     * @param ctx the parse tree
     */
    enterStatsAggTerm?: (ctx: StatsAggTermContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.statsAggTerm`.
     * @param ctx the parse tree
     */
    exitStatsAggTerm?: (ctx: StatsAggTermContext) => void;
    /**
     * Enter a parse tree produced by the `statsFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     */
    enterStatsFunctionCall?: (ctx: StatsFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `statsFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     */
    exitStatsFunctionCall?: (ctx: StatsFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `countAllFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     */
    enterCountAllFunctionCall?: (ctx: CountAllFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `countAllFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     */
    exitCountAllFunctionCall?: (ctx: CountAllFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `distinctCountFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     */
    enterDistinctCountFunctionCall?: (ctx: DistinctCountFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `distinctCountFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     */
    exitDistinctCountFunctionCall?: (ctx: DistinctCountFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `percentileAggFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     */
    enterPercentileAggFunctionCall?: (ctx: PercentileAggFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `percentileAggFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     */
    exitPercentileAggFunctionCall?: (ctx: PercentileAggFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `takeAggFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     */
    enterTakeAggFunctionCall?: (ctx: TakeAggFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `takeAggFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     */
    exitTakeAggFunctionCall?: (ctx: TakeAggFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.statsFunctionName`.
     * @param ctx the parse tree
     */
    enterStatsFunctionName?: (ctx: StatsFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.statsFunctionName`.
     * @param ctx the parse tree
     */
    exitStatsFunctionName?: (ctx: StatsFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.takeAggFunction`.
     * @param ctx the parse tree
     */
    enterTakeAggFunction?: (ctx: TakeAggFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.takeAggFunction`.
     * @param ctx the parse tree
     */
    exitTakeAggFunction?: (ctx: TakeAggFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.percentileAggFunction`.
     * @param ctx the parse tree
     */
    enterPercentileAggFunction?: (ctx: PercentileAggFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.percentileAggFunction`.
     * @param ctx the parse tree
     */
    exitPercentileAggFunction?: (ctx: PercentileAggFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.expression`.
     * @param ctx the parse tree
     */
    enterExpression?: (ctx: ExpressionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.expression`.
     * @param ctx the parse tree
     */
    exitExpression?: (ctx: ExpressionContext) => void;
    /**
     * Enter a parse tree produced by the `relevanceExpr`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    enterRelevanceExpr?: (ctx: RelevanceExprContext) => void;
    /**
     * Exit a parse tree produced by the `relevanceExpr`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    exitRelevanceExpr?: (ctx: RelevanceExprContext) => void;
    /**
     * Enter a parse tree produced by the `logicalNot`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    enterLogicalNot?: (ctx: LogicalNotContext) => void;
    /**
     * Exit a parse tree produced by the `logicalNot`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    exitLogicalNot?: (ctx: LogicalNotContext) => void;
    /**
     * Enter a parse tree produced by the `booleanExpr`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    enterBooleanExpr?: (ctx: BooleanExprContext) => void;
    /**
     * Exit a parse tree produced by the `booleanExpr`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    exitBooleanExpr?: (ctx: BooleanExprContext) => void;
    /**
     * Enter a parse tree produced by the `logicalAnd`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    enterLogicalAnd?: (ctx: LogicalAndContext) => void;
    /**
     * Exit a parse tree produced by the `logicalAnd`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    exitLogicalAnd?: (ctx: LogicalAndContext) => void;
    /**
     * Enter a parse tree produced by the `comparsion`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    enterComparsion?: (ctx: ComparsionContext) => void;
    /**
     * Exit a parse tree produced by the `comparsion`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    exitComparsion?: (ctx: ComparsionContext) => void;
    /**
     * Enter a parse tree produced by the `logicalXor`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    enterLogicalXor?: (ctx: LogicalXorContext) => void;
    /**
     * Exit a parse tree produced by the `logicalXor`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    exitLogicalXor?: (ctx: LogicalXorContext) => void;
    /**
     * Enter a parse tree produced by the `logicalOr`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    enterLogicalOr?: (ctx: LogicalOrContext) => void;
    /**
     * Exit a parse tree produced by the `logicalOr`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     */
    exitLogicalOr?: (ctx: LogicalOrContext) => void;
    /**
     * Enter a parse tree produced by the `compareExpr`
     * labeled alternative in `OpenSearchPPLParser.comparisonExpression`.
     * @param ctx the parse tree
     */
    enterCompareExpr?: (ctx: CompareExprContext) => void;
    /**
     * Exit a parse tree produced by the `compareExpr`
     * labeled alternative in `OpenSearchPPLParser.comparisonExpression`.
     * @param ctx the parse tree
     */
    exitCompareExpr?: (ctx: CompareExprContext) => void;
    /**
     * Enter a parse tree produced by the `inExpr`
     * labeled alternative in `OpenSearchPPLParser.comparisonExpression`.
     * @param ctx the parse tree
     */
    enterInExpr?: (ctx: InExprContext) => void;
    /**
     * Exit a parse tree produced by the `inExpr`
     * labeled alternative in `OpenSearchPPLParser.comparisonExpression`.
     * @param ctx the parse tree
     */
    exitInExpr?: (ctx: InExprContext) => void;
    /**
     * Enter a parse tree produced by the `positionFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    enterPositionFunctionCall?: (ctx: PositionFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `positionFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    exitPositionFunctionCall?: (ctx: PositionFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `valueExpressionDefault`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    enterValueExpressionDefault?: (ctx: ValueExpressionDefaultContext) => void;
    /**
     * Exit a parse tree produced by the `valueExpressionDefault`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    exitValueExpressionDefault?: (ctx: ValueExpressionDefaultContext) => void;
    /**
     * Enter a parse tree produced by the `parentheticValueExpr`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    enterParentheticValueExpr?: (ctx: ParentheticValueExprContext) => void;
    /**
     * Exit a parse tree produced by the `parentheticValueExpr`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    exitParentheticValueExpr?: (ctx: ParentheticValueExprContext) => void;
    /**
     * Enter a parse tree produced by the `getFormatFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    enterGetFormatFunctionCall?: (ctx: GetFormatFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `getFormatFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    exitGetFormatFunctionCall?: (ctx: GetFormatFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `extractFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    enterExtractFunctionCall?: (ctx: ExtractFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `extractFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    exitExtractFunctionCall?: (ctx: ExtractFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `binaryArithmetic`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    enterBinaryArithmetic?: (ctx: BinaryArithmeticContext) => void;
    /**
     * Exit a parse tree produced by the `binaryArithmetic`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    exitBinaryArithmetic?: (ctx: BinaryArithmeticContext) => void;
    /**
     * Enter a parse tree produced by the `timestampFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    enterTimestampFunctionCall?: (ctx: TimestampFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `timestampFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     */
    exitTimestampFunctionCall?: (ctx: TimestampFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.primaryExpression`.
     * @param ctx the parse tree
     */
    enterPrimaryExpression?: (ctx: PrimaryExpressionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.primaryExpression`.
     * @param ctx the parse tree
     */
    exitPrimaryExpression?: (ctx: PrimaryExpressionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.positionFunction`.
     * @param ctx the parse tree
     */
    enterPositionFunction?: (ctx: PositionFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.positionFunction`.
     * @param ctx the parse tree
     */
    exitPositionFunction?: (ctx: PositionFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.booleanExpression`.
     * @param ctx the parse tree
     */
    enterBooleanExpression?: (ctx: BooleanExpressionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.booleanExpression`.
     * @param ctx the parse tree
     */
    exitBooleanExpression?: (ctx: BooleanExpressionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.relevanceExpression`.
     * @param ctx the parse tree
     */
    enterRelevanceExpression?: (ctx: RelevanceExpressionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.relevanceExpression`.
     * @param ctx the parse tree
     */
    exitRelevanceExpression?: (ctx: RelevanceExpressionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.singleFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    enterSingleFieldRelevanceFunction?: (ctx: SingleFieldRelevanceFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.singleFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    exitSingleFieldRelevanceFunction?: (ctx: SingleFieldRelevanceFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.multiFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    enterMultiFieldRelevanceFunction?: (ctx: MultiFieldRelevanceFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.multiFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    exitMultiFieldRelevanceFunction?: (ctx: MultiFieldRelevanceFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.tableSource`.
     * @param ctx the parse tree
     */
    enterTableSource?: (ctx: TableSourceContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.tableSource`.
     * @param ctx the parse tree
     */
    exitTableSource?: (ctx: TableSourceContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.tableFunction`.
     * @param ctx the parse tree
     */
    enterTableFunction?: (ctx: TableFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.tableFunction`.
     * @param ctx the parse tree
     */
    exitTableFunction?: (ctx: TableFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.fieldList`.
     * @param ctx the parse tree
     */
    enterFieldList?: (ctx: FieldListContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.fieldList`.
     * @param ctx the parse tree
     */
    exitFieldList?: (ctx: FieldListContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.wcFieldList`.
     * @param ctx the parse tree
     */
    enterWcFieldList?: (ctx: WcFieldListContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.wcFieldList`.
     * @param ctx the parse tree
     */
    exitWcFieldList?: (ctx: WcFieldListContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.sortField`.
     * @param ctx the parse tree
     */
    enterSortField?: (ctx: SortFieldContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.sortField`.
     * @param ctx the parse tree
     */
    exitSortField?: (ctx: SortFieldContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.sortFieldExpression`.
     * @param ctx the parse tree
     */
    enterSortFieldExpression?: (ctx: SortFieldExpressionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.sortFieldExpression`.
     * @param ctx the parse tree
     */
    exitSortFieldExpression?: (ctx: SortFieldExpressionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.fieldExpression`.
     * @param ctx the parse tree
     */
    enterFieldExpression?: (ctx: FieldExpressionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.fieldExpression`.
     * @param ctx the parse tree
     */
    exitFieldExpression?: (ctx: FieldExpressionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.wcFieldExpression`.
     * @param ctx the parse tree
     */
    enterWcFieldExpression?: (ctx: WcFieldExpressionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.wcFieldExpression`.
     * @param ctx the parse tree
     */
    exitWcFieldExpression?: (ctx: WcFieldExpressionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.evalFunctionCall`.
     * @param ctx the parse tree
     */
    enterEvalFunctionCall?: (ctx: EvalFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.evalFunctionCall`.
     * @param ctx the parse tree
     */
    exitEvalFunctionCall?: (ctx: EvalFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.dataTypeFunctionCall`.
     * @param ctx the parse tree
     */
    enterDataTypeFunctionCall?: (ctx: DataTypeFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.dataTypeFunctionCall`.
     * @param ctx the parse tree
     */
    exitDataTypeFunctionCall?: (ctx: DataTypeFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.booleanFunctionCall`.
     * @param ctx the parse tree
     */
    enterBooleanFunctionCall?: (ctx: BooleanFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.booleanFunctionCall`.
     * @param ctx the parse tree
     */
    exitBooleanFunctionCall?: (ctx: BooleanFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.convertedDataType`.
     * @param ctx the parse tree
     */
    enterConvertedDataType?: (ctx: ConvertedDataTypeContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.convertedDataType`.
     * @param ctx the parse tree
     */
    exitConvertedDataType?: (ctx: ConvertedDataTypeContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.evalFunctionName`.
     * @param ctx the parse tree
     */
    enterEvalFunctionName?: (ctx: EvalFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.evalFunctionName`.
     * @param ctx the parse tree
     */
    exitEvalFunctionName?: (ctx: EvalFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.functionArgs`.
     * @param ctx the parse tree
     */
    enterFunctionArgs?: (ctx: FunctionArgsContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.functionArgs`.
     * @param ctx the parse tree
     */
    exitFunctionArgs?: (ctx: FunctionArgsContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.functionArg`.
     * @param ctx the parse tree
     */
    enterFunctionArg?: (ctx: FunctionArgContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.functionArg`.
     * @param ctx the parse tree
     */
    exitFunctionArg?: (ctx: FunctionArgContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.relevanceArg`.
     * @param ctx the parse tree
     */
    enterRelevanceArg?: (ctx: RelevanceArgContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.relevanceArg`.
     * @param ctx the parse tree
     */
    exitRelevanceArg?: (ctx: RelevanceArgContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.relevanceArgName`.
     * @param ctx the parse tree
     */
    enterRelevanceArgName?: (ctx: RelevanceArgNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.relevanceArgName`.
     * @param ctx the parse tree
     */
    exitRelevanceArgName?: (ctx: RelevanceArgNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.relevanceFieldAndWeight`.
     * @param ctx the parse tree
     */
    enterRelevanceFieldAndWeight?: (ctx: RelevanceFieldAndWeightContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.relevanceFieldAndWeight`.
     * @param ctx the parse tree
     */
    exitRelevanceFieldAndWeight?: (ctx: RelevanceFieldAndWeightContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.relevanceFieldWeight`.
     * @param ctx the parse tree
     */
    enterRelevanceFieldWeight?: (ctx: RelevanceFieldWeightContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.relevanceFieldWeight`.
     * @param ctx the parse tree
     */
    exitRelevanceFieldWeight?: (ctx: RelevanceFieldWeightContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.relevanceField`.
     * @param ctx the parse tree
     */
    enterRelevanceField?: (ctx: RelevanceFieldContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.relevanceField`.
     * @param ctx the parse tree
     */
    exitRelevanceField?: (ctx: RelevanceFieldContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.relevanceQuery`.
     * @param ctx the parse tree
     */
    enterRelevanceQuery?: (ctx: RelevanceQueryContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.relevanceQuery`.
     * @param ctx the parse tree
     */
    exitRelevanceQuery?: (ctx: RelevanceQueryContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.relevanceArgValue`.
     * @param ctx the parse tree
     */
    enterRelevanceArgValue?: (ctx: RelevanceArgValueContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.relevanceArgValue`.
     * @param ctx the parse tree
     */
    exitRelevanceArgValue?: (ctx: RelevanceArgValueContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.mathematicalFunctionName`.
     * @param ctx the parse tree
     */
    enterMathematicalFunctionName?: (ctx: MathematicalFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.mathematicalFunctionName`.
     * @param ctx the parse tree
     */
    exitMathematicalFunctionName?: (ctx: MathematicalFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.trigonometricFunctionName`.
     * @param ctx the parse tree
     */
    enterTrigonometricFunctionName?: (ctx: TrigonometricFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.trigonometricFunctionName`.
     * @param ctx the parse tree
     */
    exitTrigonometricFunctionName?: (ctx: TrigonometricFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.dateTimeFunctionName`.
     * @param ctx the parse tree
     */
    enterDateTimeFunctionName?: (ctx: DateTimeFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.dateTimeFunctionName`.
     * @param ctx the parse tree
     */
    exitDateTimeFunctionName?: (ctx: DateTimeFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.getFormatFunction`.
     * @param ctx the parse tree
     */
    enterGetFormatFunction?: (ctx: GetFormatFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.getFormatFunction`.
     * @param ctx the parse tree
     */
    exitGetFormatFunction?: (ctx: GetFormatFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.getFormatType`.
     * @param ctx the parse tree
     */
    enterGetFormatType?: (ctx: GetFormatTypeContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.getFormatType`.
     * @param ctx the parse tree
     */
    exitGetFormatType?: (ctx: GetFormatTypeContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.extractFunction`.
     * @param ctx the parse tree
     */
    enterExtractFunction?: (ctx: ExtractFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.extractFunction`.
     * @param ctx the parse tree
     */
    exitExtractFunction?: (ctx: ExtractFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.simpleDateTimePart`.
     * @param ctx the parse tree
     */
    enterSimpleDateTimePart?: (ctx: SimpleDateTimePartContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.simpleDateTimePart`.
     * @param ctx the parse tree
     */
    exitSimpleDateTimePart?: (ctx: SimpleDateTimePartContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.complexDateTimePart`.
     * @param ctx the parse tree
     */
    enterComplexDateTimePart?: (ctx: ComplexDateTimePartContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.complexDateTimePart`.
     * @param ctx the parse tree
     */
    exitComplexDateTimePart?: (ctx: ComplexDateTimePartContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.datetimePart`.
     * @param ctx the parse tree
     */
    enterDatetimePart?: (ctx: DatetimePartContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.datetimePart`.
     * @param ctx the parse tree
     */
    exitDatetimePart?: (ctx: DatetimePartContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.timestampFunction`.
     * @param ctx the parse tree
     */
    enterTimestampFunction?: (ctx: TimestampFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.timestampFunction`.
     * @param ctx the parse tree
     */
    exitTimestampFunction?: (ctx: TimestampFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.timestampFunctionName`.
     * @param ctx the parse tree
     */
    enterTimestampFunctionName?: (ctx: TimestampFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.timestampFunctionName`.
     * @param ctx the parse tree
     */
    exitTimestampFunctionName?: (ctx: TimestampFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.conditionFunctionBase`.
     * @param ctx the parse tree
     */
    enterConditionFunctionBase?: (ctx: ConditionFunctionBaseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.conditionFunctionBase`.
     * @param ctx the parse tree
     */
    exitConditionFunctionBase?: (ctx: ConditionFunctionBaseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.systemFunctionName`.
     * @param ctx the parse tree
     */
    enterSystemFunctionName?: (ctx: SystemFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.systemFunctionName`.
     * @param ctx the parse tree
     */
    exitSystemFunctionName?: (ctx: SystemFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.textFunctionName`.
     * @param ctx the parse tree
     */
    enterTextFunctionName?: (ctx: TextFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.textFunctionName`.
     * @param ctx the parse tree
     */
    exitTextFunctionName?: (ctx: TextFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.positionFunctionName`.
     * @param ctx the parse tree
     */
    enterPositionFunctionName?: (ctx: PositionFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.positionFunctionName`.
     * @param ctx the parse tree
     */
    exitPositionFunctionName?: (ctx: PositionFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.comparisonOperator`.
     * @param ctx the parse tree
     */
    enterComparisonOperator?: (ctx: ComparisonOperatorContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.comparisonOperator`.
     * @param ctx the parse tree
     */
    exitComparisonOperator?: (ctx: ComparisonOperatorContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.singleFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    enterSingleFieldRelevanceFunctionName?: (ctx: SingleFieldRelevanceFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.singleFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    exitSingleFieldRelevanceFunctionName?: (ctx: SingleFieldRelevanceFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.multiFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    enterMultiFieldRelevanceFunctionName?: (ctx: MultiFieldRelevanceFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.multiFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    exitMultiFieldRelevanceFunctionName?: (ctx: MultiFieldRelevanceFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.literalValue`.
     * @param ctx the parse tree
     */
    enterLiteralValue?: (ctx: LiteralValueContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.literalValue`.
     * @param ctx the parse tree
     */
    exitLiteralValue?: (ctx: LiteralValueContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.intervalLiteral`.
     * @param ctx the parse tree
     */
    enterIntervalLiteral?: (ctx: IntervalLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.intervalLiteral`.
     * @param ctx the parse tree
     */
    exitIntervalLiteral?: (ctx: IntervalLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.stringLiteral`.
     * @param ctx the parse tree
     */
    enterStringLiteral?: (ctx: StringLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.stringLiteral`.
     * @param ctx the parse tree
     */
    exitStringLiteral?: (ctx: StringLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.integerLiteral`.
     * @param ctx the parse tree
     */
    enterIntegerLiteral?: (ctx: IntegerLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.integerLiteral`.
     * @param ctx the parse tree
     */
    exitIntegerLiteral?: (ctx: IntegerLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.decimalLiteral`.
     * @param ctx the parse tree
     */
    enterDecimalLiteral?: (ctx: DecimalLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.decimalLiteral`.
     * @param ctx the parse tree
     */
    exitDecimalLiteral?: (ctx: DecimalLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.booleanLiteral`.
     * @param ctx the parse tree
     */
    enterBooleanLiteral?: (ctx: BooleanLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.booleanLiteral`.
     * @param ctx the parse tree
     */
    exitBooleanLiteral?: (ctx: BooleanLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.datetimeLiteral`.
     * @param ctx the parse tree
     */
    enterDatetimeLiteral?: (ctx: DatetimeLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.datetimeLiteral`.
     * @param ctx the parse tree
     */
    exitDatetimeLiteral?: (ctx: DatetimeLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.dateLiteral`.
     * @param ctx the parse tree
     */
    enterDateLiteral?: (ctx: DateLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.dateLiteral`.
     * @param ctx the parse tree
     */
    exitDateLiteral?: (ctx: DateLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.timeLiteral`.
     * @param ctx the parse tree
     */
    enterTimeLiteral?: (ctx: TimeLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.timeLiteral`.
     * @param ctx the parse tree
     */
    exitTimeLiteral?: (ctx: TimeLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.timestampLiteral`.
     * @param ctx the parse tree
     */
    enterTimestampLiteral?: (ctx: TimestampLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.timestampLiteral`.
     * @param ctx the parse tree
     */
    exitTimestampLiteral?: (ctx: TimestampLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.intervalUnit`.
     * @param ctx the parse tree
     */
    enterIntervalUnit?: (ctx: IntervalUnitContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.intervalUnit`.
     * @param ctx the parse tree
     */
    exitIntervalUnit?: (ctx: IntervalUnitContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.timespanUnit`.
     * @param ctx the parse tree
     */
    enterTimespanUnit?: (ctx: TimespanUnitContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.timespanUnit`.
     * @param ctx the parse tree
     */
    exitTimespanUnit?: (ctx: TimespanUnitContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.valueList`.
     * @param ctx the parse tree
     */
    enterValueList?: (ctx: ValueListContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.valueList`.
     * @param ctx the parse tree
     */
    exitValueList?: (ctx: ValueListContext) => void;
    /**
     * Enter a parse tree produced by the `identsAsQualifiedName`
     * labeled alternative in `OpenSearchPPLParser.qualifiedName`.
     * @param ctx the parse tree
     */
    enterIdentsAsQualifiedName?: (ctx: IdentsAsQualifiedNameContext) => void;
    /**
     * Exit a parse tree produced by the `identsAsQualifiedName`
     * labeled alternative in `OpenSearchPPLParser.qualifiedName`.
     * @param ctx the parse tree
     */
    exitIdentsAsQualifiedName?: (ctx: IdentsAsQualifiedNameContext) => void;
    /**
     * Enter a parse tree produced by the `identsAsTableQualifiedName`
     * labeled alternative in `OpenSearchPPLParser.tableQualifiedName`.
     * @param ctx the parse tree
     */
    enterIdentsAsTableQualifiedName?: (ctx: IdentsAsTableQualifiedNameContext) => void;
    /**
     * Exit a parse tree produced by the `identsAsTableQualifiedName`
     * labeled alternative in `OpenSearchPPLParser.tableQualifiedName`.
     * @param ctx the parse tree
     */
    exitIdentsAsTableQualifiedName?: (ctx: IdentsAsTableQualifiedNameContext) => void;
    /**
     * Enter a parse tree produced by the `identsAsWildcardQualifiedName`
     * labeled alternative in `OpenSearchPPLParser.wcQualifiedName`.
     * @param ctx the parse tree
     */
    enterIdentsAsWildcardQualifiedName?: (ctx: IdentsAsWildcardQualifiedNameContext) => void;
    /**
     * Exit a parse tree produced by the `identsAsWildcardQualifiedName`
     * labeled alternative in `OpenSearchPPLParser.wcQualifiedName`.
     * @param ctx the parse tree
     */
    exitIdentsAsWildcardQualifiedName?: (ctx: IdentsAsWildcardQualifiedNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.ident`.
     * @param ctx the parse tree
     */
    enterIdent?: (ctx: IdentContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.ident`.
     * @param ctx the parse tree
     */
    exitIdent?: (ctx: IdentContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.tableIdent`.
     * @param ctx the parse tree
     */
    enterTableIdent?: (ctx: TableIdentContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.tableIdent`.
     * @param ctx the parse tree
     */
    exitTableIdent?: (ctx: TableIdentContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.wildcard`.
     * @param ctx the parse tree
     */
    enterWildcard?: (ctx: WildcardContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.wildcard`.
     * @param ctx the parse tree
     */
    exitWildcard?: (ctx: WildcardContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchPPLParser.keywordsCanBeId`.
     * @param ctx the parse tree
     */
    enterKeywordsCanBeId?: (ctx: KeywordsCanBeIdContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchPPLParser.keywordsCanBeId`.
     * @param ctx the parse tree
     */
    exitKeywordsCanBeId?: (ctx: KeywordsCanBeIdContext) => void;

    visitTerminal(node: TerminalNode): void {}
    visitErrorNode(node: ErrorNode): void {}
    enterEveryRule(node: ParserRuleContext): void {}
    exitEveryRule(node: ParserRuleContext): void {}
}

