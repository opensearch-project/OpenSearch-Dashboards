// Generated from ./src/plugins/data/public/antlr/opensearch_ppl/grammar/OpenSearchPPLParser.g4 by ANTLR 4.13.1

import { AbstractParseTreeVisitor } from "antlr4ng";


import { RootContext } from "./OpenSearchPPLParser.js";
import { PplStatementContext } from "./OpenSearchPPLParser.js";
import { DmlStatementContext } from "./OpenSearchPPLParser.js";
import { QueryStatementContext } from "./OpenSearchPPLParser.js";
import { PplCommandsContext } from "./OpenSearchPPLParser.js";
import { CommandsContext } from "./OpenSearchPPLParser.js";
import { SearchFromContext } from "./OpenSearchPPLParser.js";
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
import { ValueExpressionDefaultContext } from "./OpenSearchPPLParser.js";
import { PositionFunctionCallContext } from "./OpenSearchPPLParser.js";
import { ExtractFunctionCallContext } from "./OpenSearchPPLParser.js";
import { GetFormatFunctionCallContext } from "./OpenSearchPPLParser.js";
import { TimestampFunctionCallContext } from "./OpenSearchPPLParser.js";
import { ParentheticValueExprContext } from "./OpenSearchPPLParser.js";
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
import { QualifiedNameContext } from "./OpenSearchPPLParser.js";
import { IdentsAsTableQualifiedNameContext } from "./OpenSearchPPLParser.js";
import { IdentsAsWildcardQualifiedNameContext } from "./OpenSearchPPLParser.js";
import { IdentContext } from "./OpenSearchPPLParser.js";
import { TableIdentContext } from "./OpenSearchPPLParser.js";
import { WildcardContext } from "./OpenSearchPPLParser.js";
import { KeywordsCanBeIdContext } from "./OpenSearchPPLParser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `OpenSearchPPLParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class OpenSearchPPLParserVisitor<Result> extends AbstractParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.root`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRoot?: (ctx: RootContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.pplStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPplStatement?: (ctx: PplStatementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.dmlStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDmlStatement?: (ctx: DmlStatementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.queryStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitQueryStatement?: (ctx: QueryStatementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.pplCommands`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPplCommands?: (ctx: PplCommandsContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.commands`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCommands?: (ctx: CommandsContext) => Result;
    /**
     * Visit a parse tree produced by the `searchFrom`
     * labeled alternative in `OpenSearchPPLParser.searchCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSearchFrom?: (ctx: SearchFromContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.describeCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDescribeCommand?: (ctx: DescribeCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.showDataSourcesCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitShowDataSourcesCommand?: (ctx: ShowDataSourcesCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.whereCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWhereCommand?: (ctx: WhereCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.fieldsCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFieldsCommand?: (ctx: FieldsCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.renameCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRenameCommand?: (ctx: RenameCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.statsCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStatsCommand?: (ctx: StatsCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.dedupCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDedupCommand?: (ctx: DedupCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.sortCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSortCommand?: (ctx: SortCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.evalCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEvalCommand?: (ctx: EvalCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.headCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitHeadCommand?: (ctx: HeadCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.topCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTopCommand?: (ctx: TopCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.rareCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRareCommand?: (ctx: RareCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.grokCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGrokCommand?: (ctx: GrokCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.parseCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParseCommand?: (ctx: ParseCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.patternsCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPatternsCommand?: (ctx: PatternsCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.patternsParameter`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPatternsParameter?: (ctx: PatternsParameterContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.patternsMethod`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPatternsMethod?: (ctx: PatternsMethodContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.kmeansCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKmeansCommand?: (ctx: KmeansCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.kmeansParameter`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKmeansParameter?: (ctx: KmeansParameterContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.adCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAdCommand?: (ctx: AdCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.adParameter`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAdParameter?: (ctx: AdParameterContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.mlCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMlCommand?: (ctx: MlCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.mlArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMlArg?: (ctx: MlArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.fromClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFromClause?: (ctx: FromClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.tableSourceClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTableSourceClause?: (ctx: TableSourceClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.renameClasue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRenameClasue?: (ctx: RenameClasueContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.byClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitByClause?: (ctx: ByClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.statsByClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStatsByClause?: (ctx: StatsByClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.bySpanClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBySpanClause?: (ctx: BySpanClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.spanClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSpanClause?: (ctx: SpanClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.sortbyClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSortbyClause?: (ctx: SortbyClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.evalClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEvalClause?: (ctx: EvalClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.statsAggTerm`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStatsAggTerm?: (ctx: StatsAggTermContext) => Result;
    /**
     * Visit a parse tree produced by the `statsFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStatsFunctionCall?: (ctx: StatsFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `countAllFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCountAllFunctionCall?: (ctx: CountAllFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `distinctCountFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDistinctCountFunctionCall?: (ctx: DistinctCountFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `percentileAggFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPercentileAggFunctionCall?: (ctx: PercentileAggFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `takeAggFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTakeAggFunctionCall?: (ctx: TakeAggFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.statsFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStatsFunctionName?: (ctx: StatsFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.takeAggFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTakeAggFunction?: (ctx: TakeAggFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.percentileAggFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPercentileAggFunction?: (ctx: PercentileAggFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExpression?: (ctx: ExpressionContext) => Result;
    /**
     * Visit a parse tree produced by the `relevanceExpr`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceExpr?: (ctx: RelevanceExprContext) => Result;
    /**
     * Visit a parse tree produced by the `logicalNot`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLogicalNot?: (ctx: LogicalNotContext) => Result;
    /**
     * Visit a parse tree produced by the `booleanExpr`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBooleanExpr?: (ctx: BooleanExprContext) => Result;
    /**
     * Visit a parse tree produced by the `logicalAnd`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLogicalAnd?: (ctx: LogicalAndContext) => Result;
    /**
     * Visit a parse tree produced by the `comparsion`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComparsion?: (ctx: ComparsionContext) => Result;
    /**
     * Visit a parse tree produced by the `logicalXor`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLogicalXor?: (ctx: LogicalXorContext) => Result;
    /**
     * Visit a parse tree produced by the `logicalOr`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLogicalOr?: (ctx: LogicalOrContext) => Result;
    /**
     * Visit a parse tree produced by the `compareExpr`
     * labeled alternative in `OpenSearchPPLParser.comparisonExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCompareExpr?: (ctx: CompareExprContext) => Result;
    /**
     * Visit a parse tree produced by the `inExpr`
     * labeled alternative in `OpenSearchPPLParser.comparisonExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitInExpr?: (ctx: InExprContext) => Result;
    /**
     * Visit a parse tree produced by the `valueExpressionDefault`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitValueExpressionDefault?: (ctx: ValueExpressionDefaultContext) => Result;
    /**
     * Visit a parse tree produced by the `positionFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPositionFunctionCall?: (ctx: PositionFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `extractFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExtractFunctionCall?: (ctx: ExtractFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `getFormatFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGetFormatFunctionCall?: (ctx: GetFormatFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `timestampFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimestampFunctionCall?: (ctx: TimestampFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `parentheticValueExpr`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParentheticValueExpr?: (ctx: ParentheticValueExprContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.primaryExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPrimaryExpression?: (ctx: PrimaryExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.positionFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPositionFunction?: (ctx: PositionFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.booleanExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBooleanExpression?: (ctx: BooleanExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.relevanceExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceExpression?: (ctx: RelevanceExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.singleFieldRelevanceFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSingleFieldRelevanceFunction?: (ctx: SingleFieldRelevanceFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.multiFieldRelevanceFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMultiFieldRelevanceFunction?: (ctx: MultiFieldRelevanceFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.tableSource`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTableSource?: (ctx: TableSourceContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.tableFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTableFunction?: (ctx: TableFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.fieldList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFieldList?: (ctx: FieldListContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.wcFieldList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWcFieldList?: (ctx: WcFieldListContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.sortField`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSortField?: (ctx: SortFieldContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.sortFieldExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSortFieldExpression?: (ctx: SortFieldExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.fieldExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFieldExpression?: (ctx: FieldExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.wcFieldExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWcFieldExpression?: (ctx: WcFieldExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.evalFunctionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEvalFunctionCall?: (ctx: EvalFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.dataTypeFunctionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDataTypeFunctionCall?: (ctx: DataTypeFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.booleanFunctionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBooleanFunctionCall?: (ctx: BooleanFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.convertedDataType`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConvertedDataType?: (ctx: ConvertedDataTypeContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.evalFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEvalFunctionName?: (ctx: EvalFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.functionArgs`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionArgs?: (ctx: FunctionArgsContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.functionArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionArg?: (ctx: FunctionArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.relevanceArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceArg?: (ctx: RelevanceArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.relevanceArgName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceArgName?: (ctx: RelevanceArgNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.relevanceFieldAndWeight`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceFieldAndWeight?: (ctx: RelevanceFieldAndWeightContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.relevanceFieldWeight`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceFieldWeight?: (ctx: RelevanceFieldWeightContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.relevanceField`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceField?: (ctx: RelevanceFieldContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.relevanceQuery`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceQuery?: (ctx: RelevanceQueryContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.relevanceArgValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceArgValue?: (ctx: RelevanceArgValueContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.mathematicalFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMathematicalFunctionName?: (ctx: MathematicalFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.trigonometricFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTrigonometricFunctionName?: (ctx: TrigonometricFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.dateTimeFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDateTimeFunctionName?: (ctx: DateTimeFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.getFormatFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGetFormatFunction?: (ctx: GetFormatFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.getFormatType`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGetFormatType?: (ctx: GetFormatTypeContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.extractFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExtractFunction?: (ctx: ExtractFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.simpleDateTimePart`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSimpleDateTimePart?: (ctx: SimpleDateTimePartContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.complexDateTimePart`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComplexDateTimePart?: (ctx: ComplexDateTimePartContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.datetimePart`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDatetimePart?: (ctx: DatetimePartContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.timestampFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimestampFunction?: (ctx: TimestampFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.timestampFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimestampFunctionName?: (ctx: TimestampFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.conditionFunctionBase`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConditionFunctionBase?: (ctx: ConditionFunctionBaseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.systemFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSystemFunctionName?: (ctx: SystemFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.textFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTextFunctionName?: (ctx: TextFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.positionFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPositionFunctionName?: (ctx: PositionFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.comparisonOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComparisonOperator?: (ctx: ComparisonOperatorContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.singleFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSingleFieldRelevanceFunctionName?: (ctx: SingleFieldRelevanceFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.multiFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMultiFieldRelevanceFunctionName?: (ctx: MultiFieldRelevanceFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.literalValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLiteralValue?: (ctx: LiteralValueContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.intervalLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIntervalLiteral?: (ctx: IntervalLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.stringLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStringLiteral?: (ctx: StringLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.integerLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIntegerLiteral?: (ctx: IntegerLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.decimalLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDecimalLiteral?: (ctx: DecimalLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.booleanLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBooleanLiteral?: (ctx: BooleanLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.datetimeLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDatetimeLiteral?: (ctx: DatetimeLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.dateLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDateLiteral?: (ctx: DateLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.timeLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimeLiteral?: (ctx: TimeLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.timestampLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimestampLiteral?: (ctx: TimestampLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.intervalUnit`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIntervalUnit?: (ctx: IntervalUnitContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.timespanUnit`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimespanUnit?: (ctx: TimespanUnitContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.valueList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitValueList?: (ctx: ValueListContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.qualifiedName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitQualifiedName?: (ctx: QualifiedNameContext) => Result;
    /**
     * Visit a parse tree produced by the `identsAsTableQualifiedName`
     * labeled alternative in `OpenSearchPPLParser.tableQualifiedName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIdentsAsTableQualifiedName?: (ctx: IdentsAsTableQualifiedNameContext) => Result;
    /**
     * Visit a parse tree produced by the `identsAsWildcardQualifiedName`
     * labeled alternative in `OpenSearchPPLParser.wcQualifiedName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIdentsAsWildcardQualifiedName?: (ctx: IdentsAsWildcardQualifiedNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.ident`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIdent?: (ctx: IdentContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.tableIdent`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTableIdent?: (ctx: TableIdentContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.wildcard`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWildcard?: (ctx: WildcardContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.keywordsCanBeId`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKeywordsCanBeId?: (ctx: KeywordsCanBeIdContext) => Result;
}

