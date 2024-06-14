// Generated from /home/ubuntu/ws/OpenSearch-Dashboards/src/plugins/data/public/antlr/opensearch_sql/grammar/OpenSearchSQLParser.g4 by ANTLR 4.13.1

import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";


import { RootContext } from "./OpenSearchSQLParser.js";
import { SqlStatementContext } from "./OpenSearchSQLParser.js";
import { DmlStatementContext } from "./OpenSearchSQLParser.js";
import { SimpleSelectContext } from "./OpenSearchSQLParser.js";
import { AdminStatementContext } from "./OpenSearchSQLParser.js";
import { ShowStatementContext } from "./OpenSearchSQLParser.js";
import { DescribeStatementContext } from "./OpenSearchSQLParser.js";
import { ColumnFilterContext } from "./OpenSearchSQLParser.js";
import { TableFilterContext } from "./OpenSearchSQLParser.js";
import { ShowDescribePatternContext } from "./OpenSearchSQLParser.js";
import { CompatibleIDContext } from "./OpenSearchSQLParser.js";
import { QuerySpecificationContext } from "./OpenSearchSQLParser.js";
import { SelectClauseContext } from "./OpenSearchSQLParser.js";
import { SelectSpecContext } from "./OpenSearchSQLParser.js";
import { SelectElementsContext } from "./OpenSearchSQLParser.js";
import { SelectElementContext } from "./OpenSearchSQLParser.js";
import { FromClauseContext } from "./OpenSearchSQLParser.js";
import { TableAsRelationContext } from "./OpenSearchSQLParser.js";
import { SubqueryAsRelationContext } from "./OpenSearchSQLParser.js";
import { WhereClauseContext } from "./OpenSearchSQLParser.js";
import { GroupByClauseContext } from "./OpenSearchSQLParser.js";
import { GroupByElementsContext } from "./OpenSearchSQLParser.js";
import { GroupByElementContext } from "./OpenSearchSQLParser.js";
import { HavingClauseContext } from "./OpenSearchSQLParser.js";
import { OrderByClauseContext } from "./OpenSearchSQLParser.js";
import { OrderByElementContext } from "./OpenSearchSQLParser.js";
import { LimitClauseContext } from "./OpenSearchSQLParser.js";
import { WindowFunctionClauseContext } from "./OpenSearchSQLParser.js";
import { ScalarWindowFunctionContext } from "./OpenSearchSQLParser.js";
import { AggregateWindowFunctionContext } from "./OpenSearchSQLParser.js";
import { OverClauseContext } from "./OpenSearchSQLParser.js";
import { PartitionByClauseContext } from "./OpenSearchSQLParser.js";
import { StringContext } from "./OpenSearchSQLParser.js";
import { SignedDecimalContext } from "./OpenSearchSQLParser.js";
import { SignedRealContext } from "./OpenSearchSQLParser.js";
import { BooleanContext } from "./OpenSearchSQLParser.js";
import { DatetimeContext } from "./OpenSearchSQLParser.js";
import { IntervalContext } from "./OpenSearchSQLParser.js";
import { NullContext } from "./OpenSearchSQLParser.js";
import { DecimalLiteralContext } from "./OpenSearchSQLParser.js";
import { StringLiteralContext } from "./OpenSearchSQLParser.js";
import { BooleanLiteralContext } from "./OpenSearchSQLParser.js";
import { RealLiteralContext } from "./OpenSearchSQLParser.js";
import { SignContext } from "./OpenSearchSQLParser.js";
import { NullLiteralContext } from "./OpenSearchSQLParser.js";
import { DatetimeLiteralContext } from "./OpenSearchSQLParser.js";
import { DateLiteralContext } from "./OpenSearchSQLParser.js";
import { TimeLiteralContext } from "./OpenSearchSQLParser.js";
import { TimestampLiteralContext } from "./OpenSearchSQLParser.js";
import { DatetimeConstantLiteralContext } from "./OpenSearchSQLParser.js";
import { IntervalLiteralContext } from "./OpenSearchSQLParser.js";
import { IntervalUnitContext } from "./OpenSearchSQLParser.js";
import { OrExpressionContext } from "./OpenSearchSQLParser.js";
import { AndExpressionContext } from "./OpenSearchSQLParser.js";
import { NotExpressionContext } from "./OpenSearchSQLParser.js";
import { PredicateExpressionContext } from "./OpenSearchSQLParser.js";
import { ExpressionAtomPredicateContext } from "./OpenSearchSQLParser.js";
import { BinaryComparisonPredicateContext } from "./OpenSearchSQLParser.js";
import { InPredicateContext } from "./OpenSearchSQLParser.js";
import { BetweenPredicateContext } from "./OpenSearchSQLParser.js";
import { IsNullPredicateContext } from "./OpenSearchSQLParser.js";
import { LikePredicateContext } from "./OpenSearchSQLParser.js";
import { RegexpPredicateContext } from "./OpenSearchSQLParser.js";
import { ExpressionsContext } from "./OpenSearchSQLParser.js";
import { ConstantExpressionAtomContext } from "./OpenSearchSQLParser.js";
import { FunctionCallExpressionAtomContext } from "./OpenSearchSQLParser.js";
import { FullColumnNameExpressionAtomContext } from "./OpenSearchSQLParser.js";
import { NestedExpressionAtomContext } from "./OpenSearchSQLParser.js";
import { MathExpressionAtomContext } from "./OpenSearchSQLParser.js";
import { ComparisonOperatorContext } from "./OpenSearchSQLParser.js";
import { NullNotnullContext } from "./OpenSearchSQLParser.js";
import { NestedAllFunctionCallContext } from "./OpenSearchSQLParser.js";
import { ScalarFunctionCallContext } from "./OpenSearchSQLParser.js";
import { SpecificFunctionCallContext } from "./OpenSearchSQLParser.js";
import { WindowFunctionCallContext } from "./OpenSearchSQLParser.js";
import { AggregateFunctionCallContext } from "./OpenSearchSQLParser.js";
import { FilteredAggregationFunctionCallContext } from "./OpenSearchSQLParser.js";
import { ScoreRelevanceFunctionCallContext } from "./OpenSearchSQLParser.js";
import { RelevanceFunctionCallContext } from "./OpenSearchSQLParser.js";
import { HighlightFunctionCallContext } from "./OpenSearchSQLParser.js";
import { PositionFunctionCallContext } from "./OpenSearchSQLParser.js";
import { ExtractFunctionCallContext } from "./OpenSearchSQLParser.js";
import { GetFormatFunctionCallContext } from "./OpenSearchSQLParser.js";
import { TimestampFunctionCallContext } from "./OpenSearchSQLParser.js";
import { TimestampFunctionContext } from "./OpenSearchSQLParser.js";
import { TimestampFunctionNameContext } from "./OpenSearchSQLParser.js";
import { GetFormatFunctionContext } from "./OpenSearchSQLParser.js";
import { GetFormatTypeContext } from "./OpenSearchSQLParser.js";
import { ExtractFunctionContext } from "./OpenSearchSQLParser.js";
import { SimpleDateTimePartContext } from "./OpenSearchSQLParser.js";
import { ComplexDateTimePartContext } from "./OpenSearchSQLParser.js";
import { DatetimePartContext } from "./OpenSearchSQLParser.js";
import { HighlightFunctionContext } from "./OpenSearchSQLParser.js";
import { PositionFunctionContext } from "./OpenSearchSQLParser.js";
import { MatchQueryAltSyntaxFunctionContext } from "./OpenSearchSQLParser.js";
import { ScalarFunctionNameContext } from "./OpenSearchSQLParser.js";
import { CaseFunctionCallContext } from "./OpenSearchSQLParser.js";
import { DataTypeFunctionCallContext } from "./OpenSearchSQLParser.js";
import { RelevanceFunctionContext } from "./OpenSearchSQLParser.js";
import { ScoreRelevanceFunctionContext } from "./OpenSearchSQLParser.js";
import { NoFieldRelevanceFunctionContext } from "./OpenSearchSQLParser.js";
import { SingleFieldRelevanceFunctionContext } from "./OpenSearchSQLParser.js";
import { MultiFieldRelevanceFunctionContext } from "./OpenSearchSQLParser.js";
import { AltSingleFieldRelevanceFunctionContext } from "./OpenSearchSQLParser.js";
import { AltMultiFieldRelevanceFunctionContext } from "./OpenSearchSQLParser.js";
import { ConvertedDataTypeContext } from "./OpenSearchSQLParser.js";
import { CaseFuncAlternativeContext } from "./OpenSearchSQLParser.js";
import { RegularAggregateFunctionCallContext } from "./OpenSearchSQLParser.js";
import { CountStarFunctionCallContext } from "./OpenSearchSQLParser.js";
import { DistinctCountFunctionCallContext } from "./OpenSearchSQLParser.js";
import { FilterClauseContext } from "./OpenSearchSQLParser.js";
import { AggregationFunctionNameContext } from "./OpenSearchSQLParser.js";
import { MathematicalFunctionNameContext } from "./OpenSearchSQLParser.js";
import { TrigonometricFunctionNameContext } from "./OpenSearchSQLParser.js";
import { ArithmeticFunctionNameContext } from "./OpenSearchSQLParser.js";
import { DateTimeFunctionNameContext } from "./OpenSearchSQLParser.js";
import { TextFunctionNameContext } from "./OpenSearchSQLParser.js";
import { FlowControlFunctionNameContext } from "./OpenSearchSQLParser.js";
import { NoFieldRelevanceFunctionNameContext } from "./OpenSearchSQLParser.js";
import { SystemFunctionNameContext } from "./OpenSearchSQLParser.js";
import { NestedFunctionNameContext } from "./OpenSearchSQLParser.js";
import { ScoreRelevanceFunctionNameContext } from "./OpenSearchSQLParser.js";
import { SingleFieldRelevanceFunctionNameContext } from "./OpenSearchSQLParser.js";
import { MultiFieldRelevanceFunctionNameContext } from "./OpenSearchSQLParser.js";
import { AltSingleFieldRelevanceFunctionNameContext } from "./OpenSearchSQLParser.js";
import { AltMultiFieldRelevanceFunctionNameContext } from "./OpenSearchSQLParser.js";
import { FunctionArgsContext } from "./OpenSearchSQLParser.js";
import { FunctionArgContext } from "./OpenSearchSQLParser.js";
import { RelevanceArgContext } from "./OpenSearchSQLParser.js";
import { HighlightArgContext } from "./OpenSearchSQLParser.js";
import { RelevanceArgNameContext } from "./OpenSearchSQLParser.js";
import { HighlightArgNameContext } from "./OpenSearchSQLParser.js";
import { RelevanceFieldAndWeightContext } from "./OpenSearchSQLParser.js";
import { RelevanceFieldWeightContext } from "./OpenSearchSQLParser.js";
import { RelevanceFieldContext } from "./OpenSearchSQLParser.js";
import { RelevanceQueryContext } from "./OpenSearchSQLParser.js";
import { RelevanceArgValueContext } from "./OpenSearchSQLParser.js";
import { HighlightArgValueContext } from "./OpenSearchSQLParser.js";
import { AlternateMultiMatchArgNameContext } from "./OpenSearchSQLParser.js";
import { AlternateMultiMatchQueryContext } from "./OpenSearchSQLParser.js";
import { AlternateMultiMatchFieldContext } from "./OpenSearchSQLParser.js";
import { TableNameContext } from "./OpenSearchSQLParser.js";
import { ColumnNameContext } from "./OpenSearchSQLParser.js";
import { AllTupleFieldsContext } from "./OpenSearchSQLParser.js";
import { AliasContext } from "./OpenSearchSQLParser.js";
import { QualifiedNameContext } from "./OpenSearchSQLParser.js";
import { IdentContext } from "./OpenSearchSQLParser.js";
import { KeywordsCanBeIdContext } from "./OpenSearchSQLParser.js";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `OpenSearchSQLParser`.
 */
export class OpenSearchSQLParserListener implements ParseTreeListener {
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.root`.
     * @param ctx the parse tree
     */
    enterRoot?: (ctx: RootContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.root`.
     * @param ctx the parse tree
     */
    exitRoot?: (ctx: RootContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.sqlStatement`.
     * @param ctx the parse tree
     */
    enterSqlStatement?: (ctx: SqlStatementContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.sqlStatement`.
     * @param ctx the parse tree
     */
    exitSqlStatement?: (ctx: SqlStatementContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.dmlStatement`.
     * @param ctx the parse tree
     */
    enterDmlStatement?: (ctx: DmlStatementContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.dmlStatement`.
     * @param ctx the parse tree
     */
    exitDmlStatement?: (ctx: DmlStatementContext) => void;
    /**
     * Enter a parse tree produced by the `simpleSelect`
     * labeled alternative in `OpenSearchSQLParser.selectStatement`.
     * @param ctx the parse tree
     */
    enterSimpleSelect?: (ctx: SimpleSelectContext) => void;
    /**
     * Exit a parse tree produced by the `simpleSelect`
     * labeled alternative in `OpenSearchSQLParser.selectStatement`.
     * @param ctx the parse tree
     */
    exitSimpleSelect?: (ctx: SimpleSelectContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.adminStatement`.
     * @param ctx the parse tree
     */
    enterAdminStatement?: (ctx: AdminStatementContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.adminStatement`.
     * @param ctx the parse tree
     */
    exitAdminStatement?: (ctx: AdminStatementContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.showStatement`.
     * @param ctx the parse tree
     */
    enterShowStatement?: (ctx: ShowStatementContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.showStatement`.
     * @param ctx the parse tree
     */
    exitShowStatement?: (ctx: ShowStatementContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.describeStatement`.
     * @param ctx the parse tree
     */
    enterDescribeStatement?: (ctx: DescribeStatementContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.describeStatement`.
     * @param ctx the parse tree
     */
    exitDescribeStatement?: (ctx: DescribeStatementContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.columnFilter`.
     * @param ctx the parse tree
     */
    enterColumnFilter?: (ctx: ColumnFilterContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.columnFilter`.
     * @param ctx the parse tree
     */
    exitColumnFilter?: (ctx: ColumnFilterContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.tableFilter`.
     * @param ctx the parse tree
     */
    enterTableFilter?: (ctx: TableFilterContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.tableFilter`.
     * @param ctx the parse tree
     */
    exitTableFilter?: (ctx: TableFilterContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.showDescribePattern`.
     * @param ctx the parse tree
     */
    enterShowDescribePattern?: (ctx: ShowDescribePatternContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.showDescribePattern`.
     * @param ctx the parse tree
     */
    exitShowDescribePattern?: (ctx: ShowDescribePatternContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.compatibleID`.
     * @param ctx the parse tree
     */
    enterCompatibleID?: (ctx: CompatibleIDContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.compatibleID`.
     * @param ctx the parse tree
     */
    exitCompatibleID?: (ctx: CompatibleIDContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.querySpecification`.
     * @param ctx the parse tree
     */
    enterQuerySpecification?: (ctx: QuerySpecificationContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.querySpecification`.
     * @param ctx the parse tree
     */
    exitQuerySpecification?: (ctx: QuerySpecificationContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.selectClause`.
     * @param ctx the parse tree
     */
    enterSelectClause?: (ctx: SelectClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.selectClause`.
     * @param ctx the parse tree
     */
    exitSelectClause?: (ctx: SelectClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.selectSpec`.
     * @param ctx the parse tree
     */
    enterSelectSpec?: (ctx: SelectSpecContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.selectSpec`.
     * @param ctx the parse tree
     */
    exitSelectSpec?: (ctx: SelectSpecContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.selectElements`.
     * @param ctx the parse tree
     */
    enterSelectElements?: (ctx: SelectElementsContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.selectElements`.
     * @param ctx the parse tree
     */
    exitSelectElements?: (ctx: SelectElementsContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.selectElement`.
     * @param ctx the parse tree
     */
    enterSelectElement?: (ctx: SelectElementContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.selectElement`.
     * @param ctx the parse tree
     */
    exitSelectElement?: (ctx: SelectElementContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.fromClause`.
     * @param ctx the parse tree
     */
    enterFromClause?: (ctx: FromClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.fromClause`.
     * @param ctx the parse tree
     */
    exitFromClause?: (ctx: FromClauseContext) => void;
    /**
     * Enter a parse tree produced by the `tableAsRelation`
     * labeled alternative in `OpenSearchSQLParser.relation`.
     * @param ctx the parse tree
     */
    enterTableAsRelation?: (ctx: TableAsRelationContext) => void;
    /**
     * Exit a parse tree produced by the `tableAsRelation`
     * labeled alternative in `OpenSearchSQLParser.relation`.
     * @param ctx the parse tree
     */
    exitTableAsRelation?: (ctx: TableAsRelationContext) => void;
    /**
     * Enter a parse tree produced by the `subqueryAsRelation`
     * labeled alternative in `OpenSearchSQLParser.relation`.
     * @param ctx the parse tree
     */
    enterSubqueryAsRelation?: (ctx: SubqueryAsRelationContext) => void;
    /**
     * Exit a parse tree produced by the `subqueryAsRelation`
     * labeled alternative in `OpenSearchSQLParser.relation`.
     * @param ctx the parse tree
     */
    exitSubqueryAsRelation?: (ctx: SubqueryAsRelationContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.whereClause`.
     * @param ctx the parse tree
     */
    enterWhereClause?: (ctx: WhereClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.whereClause`.
     * @param ctx the parse tree
     */
    exitWhereClause?: (ctx: WhereClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.groupByClause`.
     * @param ctx the parse tree
     */
    enterGroupByClause?: (ctx: GroupByClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.groupByClause`.
     * @param ctx the parse tree
     */
    exitGroupByClause?: (ctx: GroupByClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.groupByElements`.
     * @param ctx the parse tree
     */
    enterGroupByElements?: (ctx: GroupByElementsContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.groupByElements`.
     * @param ctx the parse tree
     */
    exitGroupByElements?: (ctx: GroupByElementsContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.groupByElement`.
     * @param ctx the parse tree
     */
    enterGroupByElement?: (ctx: GroupByElementContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.groupByElement`.
     * @param ctx the parse tree
     */
    exitGroupByElement?: (ctx: GroupByElementContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.havingClause`.
     * @param ctx the parse tree
     */
    enterHavingClause?: (ctx: HavingClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.havingClause`.
     * @param ctx the parse tree
     */
    exitHavingClause?: (ctx: HavingClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.orderByClause`.
     * @param ctx the parse tree
     */
    enterOrderByClause?: (ctx: OrderByClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.orderByClause`.
     * @param ctx the parse tree
     */
    exitOrderByClause?: (ctx: OrderByClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.orderByElement`.
     * @param ctx the parse tree
     */
    enterOrderByElement?: (ctx: OrderByElementContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.orderByElement`.
     * @param ctx the parse tree
     */
    exitOrderByElement?: (ctx: OrderByElementContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.limitClause`.
     * @param ctx the parse tree
     */
    enterLimitClause?: (ctx: LimitClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.limitClause`.
     * @param ctx the parse tree
     */
    exitLimitClause?: (ctx: LimitClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.windowFunctionClause`.
     * @param ctx the parse tree
     */
    enterWindowFunctionClause?: (ctx: WindowFunctionClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.windowFunctionClause`.
     * @param ctx the parse tree
     */
    exitWindowFunctionClause?: (ctx: WindowFunctionClauseContext) => void;
    /**
     * Enter a parse tree produced by the `scalarWindowFunction`
     * labeled alternative in `OpenSearchSQLParser.windowFunction`.
     * @param ctx the parse tree
     */
    enterScalarWindowFunction?: (ctx: ScalarWindowFunctionContext) => void;
    /**
     * Exit a parse tree produced by the `scalarWindowFunction`
     * labeled alternative in `OpenSearchSQLParser.windowFunction`.
     * @param ctx the parse tree
     */
    exitScalarWindowFunction?: (ctx: ScalarWindowFunctionContext) => void;
    /**
     * Enter a parse tree produced by the `aggregateWindowFunction`
     * labeled alternative in `OpenSearchSQLParser.windowFunction`.
     * @param ctx the parse tree
     */
    enterAggregateWindowFunction?: (ctx: AggregateWindowFunctionContext) => void;
    /**
     * Exit a parse tree produced by the `aggregateWindowFunction`
     * labeled alternative in `OpenSearchSQLParser.windowFunction`.
     * @param ctx the parse tree
     */
    exitAggregateWindowFunction?: (ctx: AggregateWindowFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.overClause`.
     * @param ctx the parse tree
     */
    enterOverClause?: (ctx: OverClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.overClause`.
     * @param ctx the parse tree
     */
    exitOverClause?: (ctx: OverClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.partitionByClause`.
     * @param ctx the parse tree
     */
    enterPartitionByClause?: (ctx: PartitionByClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.partitionByClause`.
     * @param ctx the parse tree
     */
    exitPartitionByClause?: (ctx: PartitionByClauseContext) => void;
    /**
     * Enter a parse tree produced by the `string`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    enterString?: (ctx: StringContext) => void;
    /**
     * Exit a parse tree produced by the `string`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    exitString?: (ctx: StringContext) => void;
    /**
     * Enter a parse tree produced by the `signedDecimal`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    enterSignedDecimal?: (ctx: SignedDecimalContext) => void;
    /**
     * Exit a parse tree produced by the `signedDecimal`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    exitSignedDecimal?: (ctx: SignedDecimalContext) => void;
    /**
     * Enter a parse tree produced by the `signedReal`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    enterSignedReal?: (ctx: SignedRealContext) => void;
    /**
     * Exit a parse tree produced by the `signedReal`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    exitSignedReal?: (ctx: SignedRealContext) => void;
    /**
     * Enter a parse tree produced by the `boolean`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    enterBoolean?: (ctx: BooleanContext) => void;
    /**
     * Exit a parse tree produced by the `boolean`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    exitBoolean?: (ctx: BooleanContext) => void;
    /**
     * Enter a parse tree produced by the `datetime`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    enterDatetime?: (ctx: DatetimeContext) => void;
    /**
     * Exit a parse tree produced by the `datetime`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    exitDatetime?: (ctx: DatetimeContext) => void;
    /**
     * Enter a parse tree produced by the `interval`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    enterInterval?: (ctx: IntervalContext) => void;
    /**
     * Exit a parse tree produced by the `interval`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    exitInterval?: (ctx: IntervalContext) => void;
    /**
     * Enter a parse tree produced by the `null`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    enterNull?: (ctx: NullContext) => void;
    /**
     * Exit a parse tree produced by the `null`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     */
    exitNull?: (ctx: NullContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.decimalLiteral`.
     * @param ctx the parse tree
     */
    enterDecimalLiteral?: (ctx: DecimalLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.decimalLiteral`.
     * @param ctx the parse tree
     */
    exitDecimalLiteral?: (ctx: DecimalLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.stringLiteral`.
     * @param ctx the parse tree
     */
    enterStringLiteral?: (ctx: StringLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.stringLiteral`.
     * @param ctx the parse tree
     */
    exitStringLiteral?: (ctx: StringLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.booleanLiteral`.
     * @param ctx the parse tree
     */
    enterBooleanLiteral?: (ctx: BooleanLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.booleanLiteral`.
     * @param ctx the parse tree
     */
    exitBooleanLiteral?: (ctx: BooleanLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.realLiteral`.
     * @param ctx the parse tree
     */
    enterRealLiteral?: (ctx: RealLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.realLiteral`.
     * @param ctx the parse tree
     */
    exitRealLiteral?: (ctx: RealLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.sign`.
     * @param ctx the parse tree
     */
    enterSign?: (ctx: SignContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.sign`.
     * @param ctx the parse tree
     */
    exitSign?: (ctx: SignContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.nullLiteral`.
     * @param ctx the parse tree
     */
    enterNullLiteral?: (ctx: NullLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.nullLiteral`.
     * @param ctx the parse tree
     */
    exitNullLiteral?: (ctx: NullLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.datetimeLiteral`.
     * @param ctx the parse tree
     */
    enterDatetimeLiteral?: (ctx: DatetimeLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.datetimeLiteral`.
     * @param ctx the parse tree
     */
    exitDatetimeLiteral?: (ctx: DatetimeLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.dateLiteral`.
     * @param ctx the parse tree
     */
    enterDateLiteral?: (ctx: DateLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.dateLiteral`.
     * @param ctx the parse tree
     */
    exitDateLiteral?: (ctx: DateLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.timeLiteral`.
     * @param ctx the parse tree
     */
    enterTimeLiteral?: (ctx: TimeLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.timeLiteral`.
     * @param ctx the parse tree
     */
    exitTimeLiteral?: (ctx: TimeLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.timestampLiteral`.
     * @param ctx the parse tree
     */
    enterTimestampLiteral?: (ctx: TimestampLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.timestampLiteral`.
     * @param ctx the parse tree
     */
    exitTimestampLiteral?: (ctx: TimestampLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.datetimeConstantLiteral`.
     * @param ctx the parse tree
     */
    enterDatetimeConstantLiteral?: (ctx: DatetimeConstantLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.datetimeConstantLiteral`.
     * @param ctx the parse tree
     */
    exitDatetimeConstantLiteral?: (ctx: DatetimeConstantLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.intervalLiteral`.
     * @param ctx the parse tree
     */
    enterIntervalLiteral?: (ctx: IntervalLiteralContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.intervalLiteral`.
     * @param ctx the parse tree
     */
    exitIntervalLiteral?: (ctx: IntervalLiteralContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.intervalUnit`.
     * @param ctx the parse tree
     */
    enterIntervalUnit?: (ctx: IntervalUnitContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.intervalUnit`.
     * @param ctx the parse tree
     */
    exitIntervalUnit?: (ctx: IntervalUnitContext) => void;
    /**
     * Enter a parse tree produced by the `orExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     */
    enterOrExpression?: (ctx: OrExpressionContext) => void;
    /**
     * Exit a parse tree produced by the `orExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     */
    exitOrExpression?: (ctx: OrExpressionContext) => void;
    /**
     * Enter a parse tree produced by the `andExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     */
    enterAndExpression?: (ctx: AndExpressionContext) => void;
    /**
     * Exit a parse tree produced by the `andExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     */
    exitAndExpression?: (ctx: AndExpressionContext) => void;
    /**
     * Enter a parse tree produced by the `notExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     */
    enterNotExpression?: (ctx: NotExpressionContext) => void;
    /**
     * Exit a parse tree produced by the `notExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     */
    exitNotExpression?: (ctx: NotExpressionContext) => void;
    /**
     * Enter a parse tree produced by the `predicateExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     */
    enterPredicateExpression?: (ctx: PredicateExpressionContext) => void;
    /**
     * Exit a parse tree produced by the `predicateExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     */
    exitPredicateExpression?: (ctx: PredicateExpressionContext) => void;
    /**
     * Enter a parse tree produced by the `expressionAtomPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    enterExpressionAtomPredicate?: (ctx: ExpressionAtomPredicateContext) => void;
    /**
     * Exit a parse tree produced by the `expressionAtomPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    exitExpressionAtomPredicate?: (ctx: ExpressionAtomPredicateContext) => void;
    /**
     * Enter a parse tree produced by the `binaryComparisonPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    enterBinaryComparisonPredicate?: (ctx: BinaryComparisonPredicateContext) => void;
    /**
     * Exit a parse tree produced by the `binaryComparisonPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    exitBinaryComparisonPredicate?: (ctx: BinaryComparisonPredicateContext) => void;
    /**
     * Enter a parse tree produced by the `inPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    enterInPredicate?: (ctx: InPredicateContext) => void;
    /**
     * Exit a parse tree produced by the `inPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    exitInPredicate?: (ctx: InPredicateContext) => void;
    /**
     * Enter a parse tree produced by the `betweenPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    enterBetweenPredicate?: (ctx: BetweenPredicateContext) => void;
    /**
     * Exit a parse tree produced by the `betweenPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    exitBetweenPredicate?: (ctx: BetweenPredicateContext) => void;
    /**
     * Enter a parse tree produced by the `isNullPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    enterIsNullPredicate?: (ctx: IsNullPredicateContext) => void;
    /**
     * Exit a parse tree produced by the `isNullPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    exitIsNullPredicate?: (ctx: IsNullPredicateContext) => void;
    /**
     * Enter a parse tree produced by the `likePredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    enterLikePredicate?: (ctx: LikePredicateContext) => void;
    /**
     * Exit a parse tree produced by the `likePredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    exitLikePredicate?: (ctx: LikePredicateContext) => void;
    /**
     * Enter a parse tree produced by the `regexpPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    enterRegexpPredicate?: (ctx: RegexpPredicateContext) => void;
    /**
     * Exit a parse tree produced by the `regexpPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     */
    exitRegexpPredicate?: (ctx: RegexpPredicateContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.expressions`.
     * @param ctx the parse tree
     */
    enterExpressions?: (ctx: ExpressionsContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.expressions`.
     * @param ctx the parse tree
     */
    exitExpressions?: (ctx: ExpressionsContext) => void;
    /**
     * Enter a parse tree produced by the `constantExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     */
    enterConstantExpressionAtom?: (ctx: ConstantExpressionAtomContext) => void;
    /**
     * Exit a parse tree produced by the `constantExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     */
    exitConstantExpressionAtom?: (ctx: ConstantExpressionAtomContext) => void;
    /**
     * Enter a parse tree produced by the `functionCallExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     */
    enterFunctionCallExpressionAtom?: (ctx: FunctionCallExpressionAtomContext) => void;
    /**
     * Exit a parse tree produced by the `functionCallExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     */
    exitFunctionCallExpressionAtom?: (ctx: FunctionCallExpressionAtomContext) => void;
    /**
     * Enter a parse tree produced by the `fullColumnNameExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     */
    enterFullColumnNameExpressionAtom?: (ctx: FullColumnNameExpressionAtomContext) => void;
    /**
     * Exit a parse tree produced by the `fullColumnNameExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     */
    exitFullColumnNameExpressionAtom?: (ctx: FullColumnNameExpressionAtomContext) => void;
    /**
     * Enter a parse tree produced by the `nestedExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     */
    enterNestedExpressionAtom?: (ctx: NestedExpressionAtomContext) => void;
    /**
     * Exit a parse tree produced by the `nestedExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     */
    exitNestedExpressionAtom?: (ctx: NestedExpressionAtomContext) => void;
    /**
     * Enter a parse tree produced by the `mathExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     */
    enterMathExpressionAtom?: (ctx: MathExpressionAtomContext) => void;
    /**
     * Exit a parse tree produced by the `mathExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     */
    exitMathExpressionAtom?: (ctx: MathExpressionAtomContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.comparisonOperator`.
     * @param ctx the parse tree
     */
    enterComparisonOperator?: (ctx: ComparisonOperatorContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.comparisonOperator`.
     * @param ctx the parse tree
     */
    exitComparisonOperator?: (ctx: ComparisonOperatorContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.nullNotnull`.
     * @param ctx the parse tree
     */
    enterNullNotnull?: (ctx: NullNotnullContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.nullNotnull`.
     * @param ctx the parse tree
     */
    exitNullNotnull?: (ctx: NullNotnullContext) => void;
    /**
     * Enter a parse tree produced by the `nestedAllFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterNestedAllFunctionCall?: (ctx: NestedAllFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `nestedAllFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitNestedAllFunctionCall?: (ctx: NestedAllFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `scalarFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterScalarFunctionCall?: (ctx: ScalarFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `scalarFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitScalarFunctionCall?: (ctx: ScalarFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `specificFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterSpecificFunctionCall?: (ctx: SpecificFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `specificFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitSpecificFunctionCall?: (ctx: SpecificFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `windowFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterWindowFunctionCall?: (ctx: WindowFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `windowFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitWindowFunctionCall?: (ctx: WindowFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `aggregateFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterAggregateFunctionCall?: (ctx: AggregateFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `aggregateFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitAggregateFunctionCall?: (ctx: AggregateFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `filteredAggregationFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterFilteredAggregationFunctionCall?: (ctx: FilteredAggregationFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `filteredAggregationFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitFilteredAggregationFunctionCall?: (ctx: FilteredAggregationFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `scoreRelevanceFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterScoreRelevanceFunctionCall?: (ctx: ScoreRelevanceFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `scoreRelevanceFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitScoreRelevanceFunctionCall?: (ctx: ScoreRelevanceFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `relevanceFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterRelevanceFunctionCall?: (ctx: RelevanceFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `relevanceFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitRelevanceFunctionCall?: (ctx: RelevanceFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `highlightFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterHighlightFunctionCall?: (ctx: HighlightFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `highlightFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitHighlightFunctionCall?: (ctx: HighlightFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `positionFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterPositionFunctionCall?: (ctx: PositionFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `positionFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitPositionFunctionCall?: (ctx: PositionFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `extractFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterExtractFunctionCall?: (ctx: ExtractFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `extractFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitExtractFunctionCall?: (ctx: ExtractFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `getFormatFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterGetFormatFunctionCall?: (ctx: GetFormatFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `getFormatFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitGetFormatFunctionCall?: (ctx: GetFormatFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `timestampFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    enterTimestampFunctionCall?: (ctx: TimestampFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `timestampFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     */
    exitTimestampFunctionCall?: (ctx: TimestampFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.timestampFunction`.
     * @param ctx the parse tree
     */
    enterTimestampFunction?: (ctx: TimestampFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.timestampFunction`.
     * @param ctx the parse tree
     */
    exitTimestampFunction?: (ctx: TimestampFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.timestampFunctionName`.
     * @param ctx the parse tree
     */
    enterTimestampFunctionName?: (ctx: TimestampFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.timestampFunctionName`.
     * @param ctx the parse tree
     */
    exitTimestampFunctionName?: (ctx: TimestampFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.getFormatFunction`.
     * @param ctx the parse tree
     */
    enterGetFormatFunction?: (ctx: GetFormatFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.getFormatFunction`.
     * @param ctx the parse tree
     */
    exitGetFormatFunction?: (ctx: GetFormatFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.getFormatType`.
     * @param ctx the parse tree
     */
    enterGetFormatType?: (ctx: GetFormatTypeContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.getFormatType`.
     * @param ctx the parse tree
     */
    exitGetFormatType?: (ctx: GetFormatTypeContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.extractFunction`.
     * @param ctx the parse tree
     */
    enterExtractFunction?: (ctx: ExtractFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.extractFunction`.
     * @param ctx the parse tree
     */
    exitExtractFunction?: (ctx: ExtractFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.simpleDateTimePart`.
     * @param ctx the parse tree
     */
    enterSimpleDateTimePart?: (ctx: SimpleDateTimePartContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.simpleDateTimePart`.
     * @param ctx the parse tree
     */
    exitSimpleDateTimePart?: (ctx: SimpleDateTimePartContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.complexDateTimePart`.
     * @param ctx the parse tree
     */
    enterComplexDateTimePart?: (ctx: ComplexDateTimePartContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.complexDateTimePart`.
     * @param ctx the parse tree
     */
    exitComplexDateTimePart?: (ctx: ComplexDateTimePartContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.datetimePart`.
     * @param ctx the parse tree
     */
    enterDatetimePart?: (ctx: DatetimePartContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.datetimePart`.
     * @param ctx the parse tree
     */
    exitDatetimePart?: (ctx: DatetimePartContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.highlightFunction`.
     * @param ctx the parse tree
     */
    enterHighlightFunction?: (ctx: HighlightFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.highlightFunction`.
     * @param ctx the parse tree
     */
    exitHighlightFunction?: (ctx: HighlightFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.positionFunction`.
     * @param ctx the parse tree
     */
    enterPositionFunction?: (ctx: PositionFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.positionFunction`.
     * @param ctx the parse tree
     */
    exitPositionFunction?: (ctx: PositionFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.matchQueryAltSyntaxFunction`.
     * @param ctx the parse tree
     */
    enterMatchQueryAltSyntaxFunction?: (ctx: MatchQueryAltSyntaxFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.matchQueryAltSyntaxFunction`.
     * @param ctx the parse tree
     */
    exitMatchQueryAltSyntaxFunction?: (ctx: MatchQueryAltSyntaxFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.scalarFunctionName`.
     * @param ctx the parse tree
     */
    enterScalarFunctionName?: (ctx: ScalarFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.scalarFunctionName`.
     * @param ctx the parse tree
     */
    exitScalarFunctionName?: (ctx: ScalarFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by the `caseFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.specificFunction`.
     * @param ctx the parse tree
     */
    enterCaseFunctionCall?: (ctx: CaseFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `caseFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.specificFunction`.
     * @param ctx the parse tree
     */
    exitCaseFunctionCall?: (ctx: CaseFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `dataTypeFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.specificFunction`.
     * @param ctx the parse tree
     */
    enterDataTypeFunctionCall?: (ctx: DataTypeFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `dataTypeFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.specificFunction`.
     * @param ctx the parse tree
     */
    exitDataTypeFunctionCall?: (ctx: DataTypeFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.relevanceFunction`.
     * @param ctx the parse tree
     */
    enterRelevanceFunction?: (ctx: RelevanceFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.relevanceFunction`.
     * @param ctx the parse tree
     */
    exitRelevanceFunction?: (ctx: RelevanceFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.scoreRelevanceFunction`.
     * @param ctx the parse tree
     */
    enterScoreRelevanceFunction?: (ctx: ScoreRelevanceFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.scoreRelevanceFunction`.
     * @param ctx the parse tree
     */
    exitScoreRelevanceFunction?: (ctx: ScoreRelevanceFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.noFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    enterNoFieldRelevanceFunction?: (ctx: NoFieldRelevanceFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.noFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    exitNoFieldRelevanceFunction?: (ctx: NoFieldRelevanceFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.singleFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    enterSingleFieldRelevanceFunction?: (ctx: SingleFieldRelevanceFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.singleFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    exitSingleFieldRelevanceFunction?: (ctx: SingleFieldRelevanceFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.multiFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    enterMultiFieldRelevanceFunction?: (ctx: MultiFieldRelevanceFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.multiFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    exitMultiFieldRelevanceFunction?: (ctx: MultiFieldRelevanceFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.altSingleFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    enterAltSingleFieldRelevanceFunction?: (ctx: AltSingleFieldRelevanceFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.altSingleFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    exitAltSingleFieldRelevanceFunction?: (ctx: AltSingleFieldRelevanceFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.altMultiFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    enterAltMultiFieldRelevanceFunction?: (ctx: AltMultiFieldRelevanceFunctionContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.altMultiFieldRelevanceFunction`.
     * @param ctx the parse tree
     */
    exitAltMultiFieldRelevanceFunction?: (ctx: AltMultiFieldRelevanceFunctionContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.convertedDataType`.
     * @param ctx the parse tree
     */
    enterConvertedDataType?: (ctx: ConvertedDataTypeContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.convertedDataType`.
     * @param ctx the parse tree
     */
    exitConvertedDataType?: (ctx: ConvertedDataTypeContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.caseFuncAlternative`.
     * @param ctx the parse tree
     */
    enterCaseFuncAlternative?: (ctx: CaseFuncAlternativeContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.caseFuncAlternative`.
     * @param ctx the parse tree
     */
    exitCaseFuncAlternative?: (ctx: CaseFuncAlternativeContext) => void;
    /**
     * Enter a parse tree produced by the `regularAggregateFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.aggregateFunction`.
     * @param ctx the parse tree
     */
    enterRegularAggregateFunctionCall?: (ctx: RegularAggregateFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `regularAggregateFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.aggregateFunction`.
     * @param ctx the parse tree
     */
    exitRegularAggregateFunctionCall?: (ctx: RegularAggregateFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `countStarFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.aggregateFunction`.
     * @param ctx the parse tree
     */
    enterCountStarFunctionCall?: (ctx: CountStarFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `countStarFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.aggregateFunction`.
     * @param ctx the parse tree
     */
    exitCountStarFunctionCall?: (ctx: CountStarFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by the `distinctCountFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.aggregateFunction`.
     * @param ctx the parse tree
     */
    enterDistinctCountFunctionCall?: (ctx: DistinctCountFunctionCallContext) => void;
    /**
     * Exit a parse tree produced by the `distinctCountFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.aggregateFunction`.
     * @param ctx the parse tree
     */
    exitDistinctCountFunctionCall?: (ctx: DistinctCountFunctionCallContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.filterClause`.
     * @param ctx the parse tree
     */
    enterFilterClause?: (ctx: FilterClauseContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.filterClause`.
     * @param ctx the parse tree
     */
    exitFilterClause?: (ctx: FilterClauseContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.aggregationFunctionName`.
     * @param ctx the parse tree
     */
    enterAggregationFunctionName?: (ctx: AggregationFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.aggregationFunctionName`.
     * @param ctx the parse tree
     */
    exitAggregationFunctionName?: (ctx: AggregationFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.mathematicalFunctionName`.
     * @param ctx the parse tree
     */
    enterMathematicalFunctionName?: (ctx: MathematicalFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.mathematicalFunctionName`.
     * @param ctx the parse tree
     */
    exitMathematicalFunctionName?: (ctx: MathematicalFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.trigonometricFunctionName`.
     * @param ctx the parse tree
     */
    enterTrigonometricFunctionName?: (ctx: TrigonometricFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.trigonometricFunctionName`.
     * @param ctx the parse tree
     */
    exitTrigonometricFunctionName?: (ctx: TrigonometricFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.arithmeticFunctionName`.
     * @param ctx the parse tree
     */
    enterArithmeticFunctionName?: (ctx: ArithmeticFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.arithmeticFunctionName`.
     * @param ctx the parse tree
     */
    exitArithmeticFunctionName?: (ctx: ArithmeticFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.dateTimeFunctionName`.
     * @param ctx the parse tree
     */
    enterDateTimeFunctionName?: (ctx: DateTimeFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.dateTimeFunctionName`.
     * @param ctx the parse tree
     */
    exitDateTimeFunctionName?: (ctx: DateTimeFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.textFunctionName`.
     * @param ctx the parse tree
     */
    enterTextFunctionName?: (ctx: TextFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.textFunctionName`.
     * @param ctx the parse tree
     */
    exitTextFunctionName?: (ctx: TextFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.flowControlFunctionName`.
     * @param ctx the parse tree
     */
    enterFlowControlFunctionName?: (ctx: FlowControlFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.flowControlFunctionName`.
     * @param ctx the parse tree
     */
    exitFlowControlFunctionName?: (ctx: FlowControlFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.noFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    enterNoFieldRelevanceFunctionName?: (ctx: NoFieldRelevanceFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.noFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    exitNoFieldRelevanceFunctionName?: (ctx: NoFieldRelevanceFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.systemFunctionName`.
     * @param ctx the parse tree
     */
    enterSystemFunctionName?: (ctx: SystemFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.systemFunctionName`.
     * @param ctx the parse tree
     */
    exitSystemFunctionName?: (ctx: SystemFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.nestedFunctionName`.
     * @param ctx the parse tree
     */
    enterNestedFunctionName?: (ctx: NestedFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.nestedFunctionName`.
     * @param ctx the parse tree
     */
    exitNestedFunctionName?: (ctx: NestedFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.scoreRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    enterScoreRelevanceFunctionName?: (ctx: ScoreRelevanceFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.scoreRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    exitScoreRelevanceFunctionName?: (ctx: ScoreRelevanceFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.singleFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    enterSingleFieldRelevanceFunctionName?: (ctx: SingleFieldRelevanceFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.singleFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    exitSingleFieldRelevanceFunctionName?: (ctx: SingleFieldRelevanceFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.multiFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    enterMultiFieldRelevanceFunctionName?: (ctx: MultiFieldRelevanceFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.multiFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    exitMultiFieldRelevanceFunctionName?: (ctx: MultiFieldRelevanceFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.altSingleFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    enterAltSingleFieldRelevanceFunctionName?: (ctx: AltSingleFieldRelevanceFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.altSingleFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    exitAltSingleFieldRelevanceFunctionName?: (ctx: AltSingleFieldRelevanceFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.altMultiFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    enterAltMultiFieldRelevanceFunctionName?: (ctx: AltMultiFieldRelevanceFunctionNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.altMultiFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     */
    exitAltMultiFieldRelevanceFunctionName?: (ctx: AltMultiFieldRelevanceFunctionNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.functionArgs`.
     * @param ctx the parse tree
     */
    enterFunctionArgs?: (ctx: FunctionArgsContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.functionArgs`.
     * @param ctx the parse tree
     */
    exitFunctionArgs?: (ctx: FunctionArgsContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.functionArg`.
     * @param ctx the parse tree
     */
    enterFunctionArg?: (ctx: FunctionArgContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.functionArg`.
     * @param ctx the parse tree
     */
    exitFunctionArg?: (ctx: FunctionArgContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.relevanceArg`.
     * @param ctx the parse tree
     */
    enterRelevanceArg?: (ctx: RelevanceArgContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.relevanceArg`.
     * @param ctx the parse tree
     */
    exitRelevanceArg?: (ctx: RelevanceArgContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.highlightArg`.
     * @param ctx the parse tree
     */
    enterHighlightArg?: (ctx: HighlightArgContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.highlightArg`.
     * @param ctx the parse tree
     */
    exitHighlightArg?: (ctx: HighlightArgContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.relevanceArgName`.
     * @param ctx the parse tree
     */
    enterRelevanceArgName?: (ctx: RelevanceArgNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.relevanceArgName`.
     * @param ctx the parse tree
     */
    exitRelevanceArgName?: (ctx: RelevanceArgNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.highlightArgName`.
     * @param ctx the parse tree
     */
    enterHighlightArgName?: (ctx: HighlightArgNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.highlightArgName`.
     * @param ctx the parse tree
     */
    exitHighlightArgName?: (ctx: HighlightArgNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.relevanceFieldAndWeight`.
     * @param ctx the parse tree
     */
    enterRelevanceFieldAndWeight?: (ctx: RelevanceFieldAndWeightContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.relevanceFieldAndWeight`.
     * @param ctx the parse tree
     */
    exitRelevanceFieldAndWeight?: (ctx: RelevanceFieldAndWeightContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.relevanceFieldWeight`.
     * @param ctx the parse tree
     */
    enterRelevanceFieldWeight?: (ctx: RelevanceFieldWeightContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.relevanceFieldWeight`.
     * @param ctx the parse tree
     */
    exitRelevanceFieldWeight?: (ctx: RelevanceFieldWeightContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.relevanceField`.
     * @param ctx the parse tree
     */
    enterRelevanceField?: (ctx: RelevanceFieldContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.relevanceField`.
     * @param ctx the parse tree
     */
    exitRelevanceField?: (ctx: RelevanceFieldContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.relevanceQuery`.
     * @param ctx the parse tree
     */
    enterRelevanceQuery?: (ctx: RelevanceQueryContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.relevanceQuery`.
     * @param ctx the parse tree
     */
    exitRelevanceQuery?: (ctx: RelevanceQueryContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.relevanceArgValue`.
     * @param ctx the parse tree
     */
    enterRelevanceArgValue?: (ctx: RelevanceArgValueContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.relevanceArgValue`.
     * @param ctx the parse tree
     */
    exitRelevanceArgValue?: (ctx: RelevanceArgValueContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.highlightArgValue`.
     * @param ctx the parse tree
     */
    enterHighlightArgValue?: (ctx: HighlightArgValueContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.highlightArgValue`.
     * @param ctx the parse tree
     */
    exitHighlightArgValue?: (ctx: HighlightArgValueContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.alternateMultiMatchArgName`.
     * @param ctx the parse tree
     */
    enterAlternateMultiMatchArgName?: (ctx: AlternateMultiMatchArgNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.alternateMultiMatchArgName`.
     * @param ctx the parse tree
     */
    exitAlternateMultiMatchArgName?: (ctx: AlternateMultiMatchArgNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.alternateMultiMatchQuery`.
     * @param ctx the parse tree
     */
    enterAlternateMultiMatchQuery?: (ctx: AlternateMultiMatchQueryContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.alternateMultiMatchQuery`.
     * @param ctx the parse tree
     */
    exitAlternateMultiMatchQuery?: (ctx: AlternateMultiMatchQueryContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.alternateMultiMatchField`.
     * @param ctx the parse tree
     */
    enterAlternateMultiMatchField?: (ctx: AlternateMultiMatchFieldContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.alternateMultiMatchField`.
     * @param ctx the parse tree
     */
    exitAlternateMultiMatchField?: (ctx: AlternateMultiMatchFieldContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.tableName`.
     * @param ctx the parse tree
     */
    enterTableName?: (ctx: TableNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.tableName`.
     * @param ctx the parse tree
     */
    exitTableName?: (ctx: TableNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.columnName`.
     * @param ctx the parse tree
     */
    enterColumnName?: (ctx: ColumnNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.columnName`.
     * @param ctx the parse tree
     */
    exitColumnName?: (ctx: ColumnNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.allTupleFields`.
     * @param ctx the parse tree
     */
    enterAllTupleFields?: (ctx: AllTupleFieldsContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.allTupleFields`.
     * @param ctx the parse tree
     */
    exitAllTupleFields?: (ctx: AllTupleFieldsContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.alias`.
     * @param ctx the parse tree
     */
    enterAlias?: (ctx: AliasContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.alias`.
     * @param ctx the parse tree
     */
    exitAlias?: (ctx: AliasContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.qualifiedName`.
     * @param ctx the parse tree
     */
    enterQualifiedName?: (ctx: QualifiedNameContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.qualifiedName`.
     * @param ctx the parse tree
     */
    exitQualifiedName?: (ctx: QualifiedNameContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.ident`.
     * @param ctx the parse tree
     */
    enterIdent?: (ctx: IdentContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.ident`.
     * @param ctx the parse tree
     */
    exitIdent?: (ctx: IdentContext) => void;
    /**
     * Enter a parse tree produced by `OpenSearchSQLParser.keywordsCanBeId`.
     * @param ctx the parse tree
     */
    enterKeywordsCanBeId?: (ctx: KeywordsCanBeIdContext) => void;
    /**
     * Exit a parse tree produced by `OpenSearchSQLParser.keywordsCanBeId`.
     * @param ctx the parse tree
     */
    exitKeywordsCanBeId?: (ctx: KeywordsCanBeIdContext) => void;

    visitTerminal(node: TerminalNode): void {}
    visitErrorNode(node: ErrorNode): void {}
    enterEveryRule(node: ParserRuleContext): void {}
    exitEveryRule(node: ParserRuleContext): void {}
}

