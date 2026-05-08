// Generated from ./src/opensearch_ppl_simplified/grammar/OpenSearchPPLParser.g4 by ANTLR 4.13.1

import { AbstractParseTreeVisitor } from "antlr4ng";


import { RootContext } from "./OpenSearchPPLParser.js";
import { PplStatementContext } from "./OpenSearchPPLParser.js";
import { QueryStatementContext } from "./OpenSearchPPLParser.js";
import { ExplainStatementContext } from "./OpenSearchPPLParser.js";
import { ExplainModeContext } from "./OpenSearchPPLParser.js";
import { SubSearchContext } from "./OpenSearchPPLParser.js";
import { PplCommandsContext } from "./OpenSearchPPLParser.js";
import { CommandsContext } from "./OpenSearchPPLParser.js";
import { CommandNameContext } from "./OpenSearchPPLParser.js";
import { SearchFromContext } from "./OpenSearchPPLParser.js";
import { OrExpressionContext } from "./OpenSearchPPLParser.js";
import { AndExpressionContext } from "./OpenSearchPPLParser.js";
import { NotExpressionContext } from "./OpenSearchPPLParser.js";
import { TermExpressionContext } from "./OpenSearchPPLParser.js";
import { GroupedExpressionContext } from "./OpenSearchPPLParser.js";
import { SearchComparisonTermContext } from "./OpenSearchPPLParser.js";
import { SearchInListTermContext } from "./OpenSearchPPLParser.js";
import { SearchLiteralTermContext } from "./OpenSearchPPLParser.js";
import { SearchLiteralContext } from "./OpenSearchPPLParser.js";
import { SearchFieldCompareContext } from "./OpenSearchPPLParser.js";
import { SearchFieldInValuesContext } from "./OpenSearchPPLParser.js";
import { SearchLiteralsContext } from "./OpenSearchPPLParser.js";
import { EqualsContext } from "./OpenSearchPPLParser.js";
import { NotEqualsContext } from "./OpenSearchPPLParser.js";
import { LessThanContext } from "./OpenSearchPPLParser.js";
import { LessOrEqualContext } from "./OpenSearchPPLParser.js";
import { GreaterThanContext } from "./OpenSearchPPLParser.js";
import { GreaterOrEqualContext } from "./OpenSearchPPLParser.js";
import { DescribeCommandContext } from "./OpenSearchPPLParser.js";
import { ShowDataSourcesCommandContext } from "./OpenSearchPPLParser.js";
import { WhereCommandContext } from "./OpenSearchPPLParser.js";
import { FieldsCommandContext } from "./OpenSearchPPLParser.js";
import { TableCommandContext } from "./OpenSearchPPLParser.js";
import { FieldsCommandBodyContext } from "./OpenSearchPPLParser.js";
import { WcFieldListContext } from "./OpenSearchPPLParser.js";
import { RenameCommandContext } from "./OpenSearchPPLParser.js";
import { StatsCommandContext } from "./OpenSearchPPLParser.js";
import { StatsArgsContext } from "./OpenSearchPPLParser.js";
import { PartitionsArgContext } from "./OpenSearchPPLParser.js";
import { AllnumArgContext } from "./OpenSearchPPLParser.js";
import { DelimArgContext } from "./OpenSearchPPLParser.js";
import { BucketNullableArgContext } from "./OpenSearchPPLParser.js";
import { DedupSplitArgContext } from "./OpenSearchPPLParser.js";
import { EventstatsCommandContext } from "./OpenSearchPPLParser.js";
import { DedupCommandContext } from "./OpenSearchPPLParser.js";
import { SortCommandContext } from "./OpenSearchPPLParser.js";
import { ReverseCommandContext } from "./OpenSearchPPLParser.js";
import { TimechartCommandContext } from "./OpenSearchPPLParser.js";
import { TimechartParameterContext } from "./OpenSearchPPLParser.js";
import { TimechartArgContext } from "./OpenSearchPPLParser.js";
import { SpanLiteralContext } from "./OpenSearchPPLParser.js";
import { EvalCommandContext } from "./OpenSearchPPLParser.js";
import { HeadCommandContext } from "./OpenSearchPPLParser.js";
import { BinCommandContext } from "./OpenSearchPPLParser.js";
import { BinOptionContext } from "./OpenSearchPPLParser.js";
import { AligntimeValueContext } from "./OpenSearchPPLParser.js";
import { NumericSpanValueContext } from "./OpenSearchPPLParser.js";
import { LogBasedSpanValueContext } from "./OpenSearchPPLParser.js";
import { ExtendedTimeSpanValueContext } from "./OpenSearchPPLParser.js";
import { IdentifierSpanValueContext } from "./OpenSearchPPLParser.js";
import { LogWithBaseSpanContext } from "./OpenSearchPPLParser.js";
import { TopCommandContext } from "./OpenSearchPPLParser.js";
import { RareCommandContext } from "./OpenSearchPPLParser.js";
import { GrokCommandContext } from "./OpenSearchPPLParser.js";
import { ParseCommandContext } from "./OpenSearchPPLParser.js";
import { SpathCommandContext } from "./OpenSearchPPLParser.js";
import { SpathParameterContext } from "./OpenSearchPPLParser.js";
import { IndexablePathContext } from "./OpenSearchPPLParser.js";
import { PathElementContext } from "./OpenSearchPPLParser.js";
import { PathArrayAccessContext } from "./OpenSearchPPLParser.js";
import { RegexCommandContext } from "./OpenSearchPPLParser.js";
import { RegexExprContext } from "./OpenSearchPPLParser.js";
import { RexCommandContext } from "./OpenSearchPPLParser.js";
import { RexExprContext } from "./OpenSearchPPLParser.js";
import { RexOptionContext } from "./OpenSearchPPLParser.js";
import { PatternsMethodContext } from "./OpenSearchPPLParser.js";
import { PatternsCommandContext } from "./OpenSearchPPLParser.js";
import { PatternsParameterContext } from "./OpenSearchPPLParser.js";
import { PatternMethodContext } from "./OpenSearchPPLParser.js";
import { PatternModeContext } from "./OpenSearchPPLParser.js";
import { LookupCommandContext } from "./OpenSearchPPLParser.js";
import { LookupMappingListContext } from "./OpenSearchPPLParser.js";
import { OutputCandidateListContext } from "./OpenSearchPPLParser.js";
import { LookupPairContext } from "./OpenSearchPPLParser.js";
import { FillnullCommandContext } from "./OpenSearchPPLParser.js";
import { FillNullWithContext } from "./OpenSearchPPLParser.js";
import { FillNullUsingContext } from "./OpenSearchPPLParser.js";
import { ReplacementPairContext } from "./OpenSearchPPLParser.js";
import { TrendlineCommandContext } from "./OpenSearchPPLParser.js";
import { TrendlineClauseContext } from "./OpenSearchPPLParser.js";
import { TrendlineTypeContext } from "./OpenSearchPPLParser.js";
import { ExpandCommandContext } from "./OpenSearchPPLParser.js";
import { FlattenCommandContext } from "./OpenSearchPPLParser.js";
import { AppendcolCommandContext } from "./OpenSearchPPLParser.js";
import { AppendCommandContext } from "./OpenSearchPPLParser.js";
import { KmeansCommandContext } from "./OpenSearchPPLParser.js";
import { KmeansParameterContext } from "./OpenSearchPPLParser.js";
import { AdCommandContext } from "./OpenSearchPPLParser.js";
import { AdParameterContext } from "./OpenSearchPPLParser.js";
import { MlCommandContext } from "./OpenSearchPPLParser.js";
import { MlArgContext } from "./OpenSearchPPLParser.js";
import { FromClauseContext } from "./OpenSearchPPLParser.js";
import { TableOrSubqueryClauseContext } from "./OpenSearchPPLParser.js";
import { TableSourceClauseContext } from "./OpenSearchPPLParser.js";
import { DynamicSourceClauseContext } from "./OpenSearchPPLParser.js";
import { SourceReferencesContext } from "./OpenSearchPPLParser.js";
import { SourceReferenceContext } from "./OpenSearchPPLParser.js";
import { SourceFilterArgsContext } from "./OpenSearchPPLParser.js";
import { SourceFilterArgContext } from "./OpenSearchPPLParser.js";
import { JoinCommandContext } from "./OpenSearchPPLParser.js";
import { SqlLikeJoinTypeContext } from "./OpenSearchPPLParser.js";
import { JoinTypeContext } from "./OpenSearchPPLParser.js";
import { SideAliasContext } from "./OpenSearchPPLParser.js";
import { JoinCriteriaContext } from "./OpenSearchPPLParser.js";
import { JoinHintListContext } from "./OpenSearchPPLParser.js";
import { LeftHintContext } from "./OpenSearchPPLParser.js";
import { RightHintContext } from "./OpenSearchPPLParser.js";
import { OverwriteOptionContext } from "./OpenSearchPPLParser.js";
import { TypeOptionContext } from "./OpenSearchPPLParser.js";
import { MaxOptionContext } from "./OpenSearchPPLParser.js";
import { RenameClasueContext } from "./OpenSearchPPLParser.js";
import { ByClauseContext } from "./OpenSearchPPLParser.js";
import { StatsByClauseContext } from "./OpenSearchPPLParser.js";
import { BySpanClauseContext } from "./OpenSearchPPLParser.js";
import { SpanClauseContext } from "./OpenSearchPPLParser.js";
import { SortbyClauseContext } from "./OpenSearchPPLParser.js";
import { EvalClauseContext } from "./OpenSearchPPLParser.js";
import { EventstatsAggTermContext } from "./OpenSearchPPLParser.js";
import { WindowFunctionContext } from "./OpenSearchPPLParser.js";
import { WindowFunctionNameContext } from "./OpenSearchPPLParser.js";
import { ScalarWindowFunctionNameContext } from "./OpenSearchPPLParser.js";
import { StatsAggTermContext } from "./OpenSearchPPLParser.js";
import { CountEvalFunctionCallContext } from "./OpenSearchPPLParser.js";
import { CountAllFunctionCallContext } from "./OpenSearchPPLParser.js";
import { PercentileShortcutFunctionCallContext } from "./OpenSearchPPLParser.js";
import { DistinctCountFunctionCallContext } from "./OpenSearchPPLParser.js";
import { TakeAggFunctionCallContext } from "./OpenSearchPPLParser.js";
import { PercentileApproxFunctionCallContext } from "./OpenSearchPPLParser.js";
import { StatsFunctionCallContext } from "./OpenSearchPPLParser.js";
import { StatsFunctionNameContext } from "./OpenSearchPPLParser.js";
import { TakeAggFunctionContext } from "./OpenSearchPPLParser.js";
import { PercentileApproxFunctionContext } from "./OpenSearchPPLParser.js";
import { NumericLiteralContext } from "./OpenSearchPPLParser.js";
import { LogicalNotContext } from "./OpenSearchPPLParser.js";
import { LogicalExprContext } from "./OpenSearchPPLParser.js";
import { LogicalAndContext } from "./OpenSearchPPLParser.js";
import { LogicalXorContext } from "./OpenSearchPPLParser.js";
import { LogicalOrContext } from "./OpenSearchPPLParser.js";
import { RelevanceExprContext } from "./OpenSearchPPLParser.js";
import { ValueExprContext } from "./OpenSearchPPLParser.js";
import { InExprContext } from "./OpenSearchPPLParser.js";
import { BetweenContext } from "./OpenSearchPPLParser.js";
import { CompareExprContext } from "./OpenSearchPPLParser.js";
import { InSubqueryExprContext } from "./OpenSearchPPLParser.js";
import { LambdaExprContext } from "./OpenSearchPPLParser.js";
import { LiteralValueExprContext } from "./OpenSearchPPLParser.js";
import { FunctionCallExprContext } from "./OpenSearchPPLParser.js";
import { ExistsSubqueryExprContext } from "./OpenSearchPPLParser.js";
import { ScalarSubqueryExprContext } from "./OpenSearchPPLParser.js";
import { NestedValueExprContext } from "./OpenSearchPPLParser.js";
import { BinaryArithmeticContext } from "./OpenSearchPPLParser.js";
import { FieldExprContext } from "./OpenSearchPPLParser.js";
import { EvalExpressionContext } from "./OpenSearchPPLParser.js";
import { FunctionCallContext } from "./OpenSearchPPLParser.js";
import { PositionFunctionCallContext } from "./OpenSearchPPLParser.js";
import { CaseFunctionCallContext } from "./OpenSearchPPLParser.js";
import { RelevanceExpressionContext } from "./OpenSearchPPLParser.js";
import { SingleFieldRelevanceFunctionContext } from "./OpenSearchPPLParser.js";
import { MultiFieldRelevanceFunctionContext } from "./OpenSearchPPLParser.js";
import { TableSourceContext } from "./OpenSearchPPLParser.js";
import { TableFunctionContext } from "./OpenSearchPPLParser.js";
import { FieldListContext } from "./OpenSearchPPLParser.js";
import { SortFieldContext } from "./OpenSearchPPLParser.js";
import { SortFieldExpressionContext } from "./OpenSearchPPLParser.js";
import { FieldExpressionContext } from "./OpenSearchPPLParser.js";
import { WcFieldExpressionContext } from "./OpenSearchPPLParser.js";
import { SelectFieldExpressionContext } from "./OpenSearchPPLParser.js";
import { RenameFieldExpressionContext } from "./OpenSearchPPLParser.js";
import { EvalFunctionCallContext } from "./OpenSearchPPLParser.js";
import { DataTypeFunctionCallContext } from "./OpenSearchPPLParser.js";
import { ConvertedDataTypeContext } from "./OpenSearchPPLParser.js";
import { EvalFunctionNameContext } from "./OpenSearchPPLParser.js";
import { FunctionArgsContext } from "./OpenSearchPPLParser.js";
import { NamedFunctionArgsContext } from "./OpenSearchPPLParser.js";
import { FunctionArgContext } from "./OpenSearchPPLParser.js";
import { NamedFunctionArgContext } from "./OpenSearchPPLParser.js";
import { FunctionArgExpressionContext } from "./OpenSearchPPLParser.js";
import { LambdaContext } from "./OpenSearchPPLParser.js";
import { RelevanceArgContext } from "./OpenSearchPPLParser.js";
import { RelevanceArgNameContext } from "./OpenSearchPPLParser.js";
import { RelevanceFieldAndWeightContext } from "./OpenSearchPPLParser.js";
import { RelevanceFieldWeightContext } from "./OpenSearchPPLParser.js";
import { RelevanceFieldContext } from "./OpenSearchPPLParser.js";
import { RelevanceQueryContext } from "./OpenSearchPPLParser.js";
import { RelevanceArgValueContext } from "./OpenSearchPPLParser.js";
import { MathematicalFunctionNameContext } from "./OpenSearchPPLParser.js";
import { GeoipFunctionNameContext } from "./OpenSearchPPLParser.js";
import { CollectionFunctionNameContext } from "./OpenSearchPPLParser.js";
import { TrigonometricFunctionNameContext } from "./OpenSearchPPLParser.js";
import { JsonFunctionNameContext } from "./OpenSearchPPLParser.js";
import { CryptographicFunctionNameContext } from "./OpenSearchPPLParser.js";
import { DateTimeFunctionNameContext } from "./OpenSearchPPLParser.js";
import { GetFormatFunctionCallContext } from "./OpenSearchPPLParser.js";
import { GetFormatTypeContext } from "./OpenSearchPPLParser.js";
import { ExtractFunctionCallContext } from "./OpenSearchPPLParser.js";
import { SimpleDateTimePartContext } from "./OpenSearchPPLParser.js";
import { ComplexDateTimePartContext } from "./OpenSearchPPLParser.js";
import { DatetimePartContext } from "./OpenSearchPPLParser.js";
import { TimestampFunctionCallContext } from "./OpenSearchPPLParser.js";
import { TimestampFunctionNameContext } from "./OpenSearchPPLParser.js";
import { ConditionFunctionNameContext } from "./OpenSearchPPLParser.js";
import { FlowControlFunctionNameContext } from "./OpenSearchPPLParser.js";
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
import { DoubleLiteralContext } from "./OpenSearchPPLParser.js";
import { FloatLiteralContext } from "./OpenSearchPPLParser.js";
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
import { IdentsAsQualifiedNameSeqContext } from "./OpenSearchPPLParser.js";
import { IdentContext } from "./OpenSearchPPLParser.js";
import { TableIdentContext } from "./OpenSearchPPLParser.js";
import { WildcardContext } from "./OpenSearchPPLParser.js";
import { KeywordsCanBeIdContext } from "./OpenSearchPPLParser.js";
import { SearchableKeyWordContext } from "./OpenSearchPPLParser.js";


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
     * Visit a parse tree produced by `OpenSearchPPLParser.queryStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitQueryStatement?: (ctx: QueryStatementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.explainStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExplainStatement?: (ctx: ExplainStatementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.explainMode`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExplainMode?: (ctx: ExplainModeContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.subSearch`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSubSearch?: (ctx: SubSearchContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.commandName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCommandName?: (ctx: CommandNameContext) => Result;
    /**
     * Visit a parse tree produced by the `searchFrom`
     * labeled alternative in `OpenSearchPPLParser.searchCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSearchFrom?: (ctx: SearchFromContext) => Result;
    /**
     * Visit a parse tree produced by the `orExpression`
     * labeled alternative in `OpenSearchPPLParser.searchExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOrExpression?: (ctx: OrExpressionContext) => Result;
    /**
     * Visit a parse tree produced by the `andExpression`
     * labeled alternative in `OpenSearchPPLParser.searchExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAndExpression?: (ctx: AndExpressionContext) => Result;
    /**
     * Visit a parse tree produced by the `notExpression`
     * labeled alternative in `OpenSearchPPLParser.searchExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNotExpression?: (ctx: NotExpressionContext) => Result;
    /**
     * Visit a parse tree produced by the `termExpression`
     * labeled alternative in `OpenSearchPPLParser.searchExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTermExpression?: (ctx: TermExpressionContext) => Result;
    /**
     * Visit a parse tree produced by the `groupedExpression`
     * labeled alternative in `OpenSearchPPLParser.searchExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGroupedExpression?: (ctx: GroupedExpressionContext) => Result;
    /**
     * Visit a parse tree produced by the `searchComparisonTerm`
     * labeled alternative in `OpenSearchPPLParser.searchTerm`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSearchComparisonTerm?: (ctx: SearchComparisonTermContext) => Result;
    /**
     * Visit a parse tree produced by the `searchInListTerm`
     * labeled alternative in `OpenSearchPPLParser.searchTerm`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSearchInListTerm?: (ctx: SearchInListTermContext) => Result;
    /**
     * Visit a parse tree produced by the `searchLiteralTerm`
     * labeled alternative in `OpenSearchPPLParser.searchTerm`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSearchLiteralTerm?: (ctx: SearchLiteralTermContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.searchLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSearchLiteral?: (ctx: SearchLiteralContext) => Result;
    /**
     * Visit a parse tree produced by the `searchFieldCompare`
     * labeled alternative in `OpenSearchPPLParser.searchFieldComparison`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSearchFieldCompare?: (ctx: SearchFieldCompareContext) => Result;
    /**
     * Visit a parse tree produced by the `searchFieldInValues`
     * labeled alternative in `OpenSearchPPLParser.searchFieldInList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSearchFieldInValues?: (ctx: SearchFieldInValuesContext) => Result;
    /**
     * Visit a parse tree produced by the `searchLiterals`
     * labeled alternative in `OpenSearchPPLParser.searchLiteralList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSearchLiterals?: (ctx: SearchLiteralsContext) => Result;
    /**
     * Visit a parse tree produced by the `equals`
     * labeled alternative in `OpenSearchPPLParser.searchComparisonOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEquals?: (ctx: EqualsContext) => Result;
    /**
     * Visit a parse tree produced by the `notEquals`
     * labeled alternative in `OpenSearchPPLParser.searchComparisonOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNotEquals?: (ctx: NotEqualsContext) => Result;
    /**
     * Visit a parse tree produced by the `lessThan`
     * labeled alternative in `OpenSearchPPLParser.searchComparisonOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLessThan?: (ctx: LessThanContext) => Result;
    /**
     * Visit a parse tree produced by the `lessOrEqual`
     * labeled alternative in `OpenSearchPPLParser.searchComparisonOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLessOrEqual?: (ctx: LessOrEqualContext) => Result;
    /**
     * Visit a parse tree produced by the `greaterThan`
     * labeled alternative in `OpenSearchPPLParser.searchComparisonOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGreaterThan?: (ctx: GreaterThanContext) => Result;
    /**
     * Visit a parse tree produced by the `greaterOrEqual`
     * labeled alternative in `OpenSearchPPLParser.searchComparisonOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGreaterOrEqual?: (ctx: GreaterOrEqualContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.tableCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTableCommand?: (ctx: TableCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.fieldsCommandBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFieldsCommandBody?: (ctx: FieldsCommandBodyContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.wcFieldList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWcFieldList?: (ctx: WcFieldListContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.statsArgs`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStatsArgs?: (ctx: StatsArgsContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.partitionsArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPartitionsArg?: (ctx: PartitionsArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.allnumArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAllnumArg?: (ctx: AllnumArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.delimArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDelimArg?: (ctx: DelimArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.bucketNullableArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBucketNullableArg?: (ctx: BucketNullableArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.dedupSplitArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDedupSplitArg?: (ctx: DedupSplitArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.eventstatsCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEventstatsCommand?: (ctx: EventstatsCommandContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.reverseCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitReverseCommand?: (ctx: ReverseCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.timechartCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimechartCommand?: (ctx: TimechartCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.timechartParameter`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimechartParameter?: (ctx: TimechartParameterContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.timechartArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimechartArg?: (ctx: TimechartArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.spanLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSpanLiteral?: (ctx: SpanLiteralContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.binCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinCommand?: (ctx: BinCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.binOption`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinOption?: (ctx: BinOptionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.aligntimeValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAligntimeValue?: (ctx: AligntimeValueContext) => Result;
    /**
     * Visit a parse tree produced by the `numericSpanValue`
     * labeled alternative in `OpenSearchPPLParser.spanValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNumericSpanValue?: (ctx: NumericSpanValueContext) => Result;
    /**
     * Visit a parse tree produced by the `logBasedSpanValue`
     * labeled alternative in `OpenSearchPPLParser.spanValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLogBasedSpanValue?: (ctx: LogBasedSpanValueContext) => Result;
    /**
     * Visit a parse tree produced by the `extendedTimeSpanValue`
     * labeled alternative in `OpenSearchPPLParser.spanValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExtendedTimeSpanValue?: (ctx: ExtendedTimeSpanValueContext) => Result;
    /**
     * Visit a parse tree produced by the `identifierSpanValue`
     * labeled alternative in `OpenSearchPPLParser.spanValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIdentifierSpanValue?: (ctx: IdentifierSpanValueContext) => Result;
    /**
     * Visit a parse tree produced by the `logWithBaseSpan`
     * labeled alternative in `OpenSearchPPLParser.logSpanValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLogWithBaseSpan?: (ctx: LogWithBaseSpanContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.spathCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSpathCommand?: (ctx: SpathCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.spathParameter`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSpathParameter?: (ctx: SpathParameterContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.indexablePath`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIndexablePath?: (ctx: IndexablePathContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.pathElement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPathElement?: (ctx: PathElementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.pathArrayAccess`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPathArrayAccess?: (ctx: PathArrayAccessContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.regexCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRegexCommand?: (ctx: RegexCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.regexExpr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRegexExpr?: (ctx: RegexExprContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.rexCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRexCommand?: (ctx: RexCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.rexExpr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRexExpr?: (ctx: RexExprContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.rexOption`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRexOption?: (ctx: RexOptionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.patternsMethod`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPatternsMethod?: (ctx: PatternsMethodContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.patternMethod`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPatternMethod?: (ctx: PatternMethodContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.patternMode`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPatternMode?: (ctx: PatternModeContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.lookupCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLookupCommand?: (ctx: LookupCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.lookupMappingList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLookupMappingList?: (ctx: LookupMappingListContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.outputCandidateList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOutputCandidateList?: (ctx: OutputCandidateListContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.lookupPair`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLookupPair?: (ctx: LookupPairContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.fillnullCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFillnullCommand?: (ctx: FillnullCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.fillNullWith`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFillNullWith?: (ctx: FillNullWithContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.fillNullUsing`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFillNullUsing?: (ctx: FillNullUsingContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.replacementPair`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitReplacementPair?: (ctx: ReplacementPairContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.trendlineCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTrendlineCommand?: (ctx: TrendlineCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.trendlineClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTrendlineClause?: (ctx: TrendlineClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.trendlineType`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTrendlineType?: (ctx: TrendlineTypeContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.expandCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExpandCommand?: (ctx: ExpandCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.flattenCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFlattenCommand?: (ctx: FlattenCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.appendcolCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAppendcolCommand?: (ctx: AppendcolCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.appendCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAppendCommand?: (ctx: AppendCommandContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.tableOrSubqueryClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTableOrSubqueryClause?: (ctx: TableOrSubqueryClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.tableSourceClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTableSourceClause?: (ctx: TableSourceClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.dynamicSourceClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDynamicSourceClause?: (ctx: DynamicSourceClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.sourceReferences`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSourceReferences?: (ctx: SourceReferencesContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.sourceReference`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSourceReference?: (ctx: SourceReferenceContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.sourceFilterArgs`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSourceFilterArgs?: (ctx: SourceFilterArgsContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.sourceFilterArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSourceFilterArg?: (ctx: SourceFilterArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.joinCommand`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitJoinCommand?: (ctx: JoinCommandContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.sqlLikeJoinType`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSqlLikeJoinType?: (ctx: SqlLikeJoinTypeContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.joinType`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitJoinType?: (ctx: JoinTypeContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.sideAlias`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSideAlias?: (ctx: SideAliasContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.joinCriteria`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitJoinCriteria?: (ctx: JoinCriteriaContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.joinHintList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitJoinHintList?: (ctx: JoinHintListContext) => Result;
    /**
     * Visit a parse tree produced by the `leftHint`
     * labeled alternative in `OpenSearchPPLParser.hintPair`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLeftHint?: (ctx: LeftHintContext) => Result;
    /**
     * Visit a parse tree produced by the `rightHint`
     * labeled alternative in `OpenSearchPPLParser.hintPair`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRightHint?: (ctx: RightHintContext) => Result;
    /**
     * Visit a parse tree produced by the `overwriteOption`
     * labeled alternative in `OpenSearchPPLParser.joinOption`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOverwriteOption?: (ctx: OverwriteOptionContext) => Result;
    /**
     * Visit a parse tree produced by the `typeOption`
     * labeled alternative in `OpenSearchPPLParser.joinOption`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTypeOption?: (ctx: TypeOptionContext) => Result;
    /**
     * Visit a parse tree produced by the `maxOption`
     * labeled alternative in `OpenSearchPPLParser.joinOption`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMaxOption?: (ctx: MaxOptionContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.eventstatsAggTerm`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEventstatsAggTerm?: (ctx: EventstatsAggTermContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.windowFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWindowFunction?: (ctx: WindowFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.windowFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWindowFunctionName?: (ctx: WindowFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.scalarWindowFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitScalarWindowFunctionName?: (ctx: ScalarWindowFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.statsAggTerm`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStatsAggTerm?: (ctx: StatsAggTermContext) => Result;
    /**
     * Visit a parse tree produced by the `countEvalFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCountEvalFunctionCall?: (ctx: CountEvalFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `countAllFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCountAllFunctionCall?: (ctx: CountAllFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `percentileShortcutFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPercentileShortcutFunctionCall?: (ctx: PercentileShortcutFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `distinctCountFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDistinctCountFunctionCall?: (ctx: DistinctCountFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `takeAggFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTakeAggFunctionCall?: (ctx: TakeAggFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `percentileApproxFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPercentileApproxFunctionCall?: (ctx: PercentileApproxFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `statsFunctionCall`
     * labeled alternative in `OpenSearchPPLParser.statsFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStatsFunctionCall?: (ctx: StatsFunctionCallContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.percentileApproxFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPercentileApproxFunction?: (ctx: PercentileApproxFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.numericLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNumericLiteral?: (ctx: NumericLiteralContext) => Result;
    /**
     * Visit a parse tree produced by the `logicalNot`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLogicalNot?: (ctx: LogicalNotContext) => Result;
    /**
     * Visit a parse tree produced by the `logicalExpr`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLogicalExpr?: (ctx: LogicalExprContext) => Result;
    /**
     * Visit a parse tree produced by the `logicalAnd`
     * labeled alternative in `OpenSearchPPLParser.logicalExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLogicalAnd?: (ctx: LogicalAndContext) => Result;
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
     * Visit a parse tree produced by the `relevanceExpr`
     * labeled alternative in `OpenSearchPPLParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceExpr?: (ctx: RelevanceExprContext) => Result;
    /**
     * Visit a parse tree produced by the `valueExpr`
     * labeled alternative in `OpenSearchPPLParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitValueExpr?: (ctx: ValueExprContext) => Result;
    /**
     * Visit a parse tree produced by the `inExpr`
     * labeled alternative in `OpenSearchPPLParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitInExpr?: (ctx: InExprContext) => Result;
    /**
     * Visit a parse tree produced by the `between`
     * labeled alternative in `OpenSearchPPLParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBetween?: (ctx: BetweenContext) => Result;
    /**
     * Visit a parse tree produced by the `compareExpr`
     * labeled alternative in `OpenSearchPPLParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCompareExpr?: (ctx: CompareExprContext) => Result;
    /**
     * Visit a parse tree produced by the `inSubqueryExpr`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitInSubqueryExpr?: (ctx: InSubqueryExprContext) => Result;
    /**
     * Visit a parse tree produced by the `lambdaExpr`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLambdaExpr?: (ctx: LambdaExprContext) => Result;
    /**
     * Visit a parse tree produced by the `literalValueExpr`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLiteralValueExpr?: (ctx: LiteralValueExprContext) => Result;
    /**
     * Visit a parse tree produced by the `functionCallExpr`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionCallExpr?: (ctx: FunctionCallExprContext) => Result;
    /**
     * Visit a parse tree produced by the `existsSubqueryExpr`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExistsSubqueryExpr?: (ctx: ExistsSubqueryExprContext) => Result;
    /**
     * Visit a parse tree produced by the `scalarSubqueryExpr`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitScalarSubqueryExpr?: (ctx: ScalarSubqueryExprContext) => Result;
    /**
     * Visit a parse tree produced by the `nestedValueExpr`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNestedValueExpr?: (ctx: NestedValueExprContext) => Result;
    /**
     * Visit a parse tree produced by the `binaryArithmetic`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryArithmetic?: (ctx: BinaryArithmeticContext) => Result;
    /**
     * Visit a parse tree produced by the `fieldExpr`
     * labeled alternative in `OpenSearchPPLParser.valueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFieldExpr?: (ctx: FieldExprContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.evalExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEvalExpression?: (ctx: EvalExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionCall?: (ctx: FunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.positionFunctionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPositionFunctionCall?: (ctx: PositionFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.caseFunctionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCaseFunctionCall?: (ctx: CaseFunctionCallContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.selectFieldExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSelectFieldExpression?: (ctx: SelectFieldExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.renameFieldExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRenameFieldExpression?: (ctx: RenameFieldExpressionContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.namedFunctionArgs`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNamedFunctionArgs?: (ctx: NamedFunctionArgsContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.functionArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionArg?: (ctx: FunctionArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.namedFunctionArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNamedFunctionArg?: (ctx: NamedFunctionArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.functionArgExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionArgExpression?: (ctx: FunctionArgExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.lambda`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLambda?: (ctx: LambdaContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.geoipFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGeoipFunctionName?: (ctx: GeoipFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.collectionFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCollectionFunctionName?: (ctx: CollectionFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.trigonometricFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTrigonometricFunctionName?: (ctx: TrigonometricFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.jsonFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitJsonFunctionName?: (ctx: JsonFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.cryptographicFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCryptographicFunctionName?: (ctx: CryptographicFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.dateTimeFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDateTimeFunctionName?: (ctx: DateTimeFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.getFormatFunctionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGetFormatFunctionCall?: (ctx: GetFormatFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.getFormatType`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGetFormatType?: (ctx: GetFormatTypeContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.extractFunctionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExtractFunctionCall?: (ctx: ExtractFunctionCallContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.timestampFunctionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimestampFunctionCall?: (ctx: TimestampFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.timestampFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimestampFunctionName?: (ctx: TimestampFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.conditionFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConditionFunctionName?: (ctx: ConditionFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.flowControlFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFlowControlFunctionName?: (ctx: FlowControlFunctionNameContext) => Result;
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
     * Visit a parse tree produced by `OpenSearchPPLParser.doubleLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDoubleLiteral?: (ctx: DoubleLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.floatLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFloatLiteral?: (ctx: FloatLiteralContext) => Result;
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
     * Visit a parse tree produced by the `identsAsQualifiedName`
     * labeled alternative in `OpenSearchPPLParser.qualifiedName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIdentsAsQualifiedName?: (ctx: IdentsAsQualifiedNameContext) => Result;
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
     * Visit a parse tree produced by the `identsAsQualifiedNameSeq`
     * labeled alternative in `OpenSearchPPLParser.identifierSeq`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIdentsAsQualifiedNameSeq?: (ctx: IdentsAsQualifiedNameSeqContext) => Result;
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
    /**
     * Visit a parse tree produced by `OpenSearchPPLParser.searchableKeyWord`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSearchableKeyWord?: (ctx: SearchableKeyWordContext) => Result;
}

