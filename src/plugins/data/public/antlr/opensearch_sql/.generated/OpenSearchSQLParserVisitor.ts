// Generated from ./src/plugins/data/public/antlr/opensearch_sql/grammar/OpenSearchSQLParser.g4 by ANTLR 4.13.1

import { AbstractParseTreeVisitor } from "antlr4ng";


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
import { NumericLiteralContext } from "./OpenSearchSQLParser.js";
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
import { PercentileApproxFunctionCallContext } from "./OpenSearchSQLParser.js";
import { PercentileApproxFunctionContext } from "./OpenSearchSQLParser.js";
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
 * This interface defines a complete generic visitor for a parse tree produced
 * by `OpenSearchSQLParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class OpenSearchSQLParserVisitor<Result> extends AbstractParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.root`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRoot?: (ctx: RootContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.sqlStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSqlStatement?: (ctx: SqlStatementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.dmlStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDmlStatement?: (ctx: DmlStatementContext) => Result;
    /**
     * Visit a parse tree produced by the `simpleSelect`
     * labeled alternative in `OpenSearchSQLParser.selectStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSimpleSelect?: (ctx: SimpleSelectContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.adminStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAdminStatement?: (ctx: AdminStatementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.showStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitShowStatement?: (ctx: ShowStatementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.describeStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDescribeStatement?: (ctx: DescribeStatementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.columnFilter`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitColumnFilter?: (ctx: ColumnFilterContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.tableFilter`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTableFilter?: (ctx: TableFilterContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.showDescribePattern`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitShowDescribePattern?: (ctx: ShowDescribePatternContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.compatibleID`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCompatibleID?: (ctx: CompatibleIDContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.querySpecification`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitQuerySpecification?: (ctx: QuerySpecificationContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.selectClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSelectClause?: (ctx: SelectClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.selectSpec`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSelectSpec?: (ctx: SelectSpecContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.selectElements`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSelectElements?: (ctx: SelectElementsContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.selectElement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSelectElement?: (ctx: SelectElementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.fromClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFromClause?: (ctx: FromClauseContext) => Result;
    /**
     * Visit a parse tree produced by the `tableAsRelation`
     * labeled alternative in `OpenSearchSQLParser.relation`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTableAsRelation?: (ctx: TableAsRelationContext) => Result;
    /**
     * Visit a parse tree produced by the `subqueryAsRelation`
     * labeled alternative in `OpenSearchSQLParser.relation`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSubqueryAsRelation?: (ctx: SubqueryAsRelationContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.whereClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWhereClause?: (ctx: WhereClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.groupByClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGroupByClause?: (ctx: GroupByClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.groupByElements`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGroupByElements?: (ctx: GroupByElementsContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.groupByElement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGroupByElement?: (ctx: GroupByElementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.havingClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitHavingClause?: (ctx: HavingClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.orderByClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOrderByClause?: (ctx: OrderByClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.orderByElement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOrderByElement?: (ctx: OrderByElementContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.limitClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLimitClause?: (ctx: LimitClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.windowFunctionClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWindowFunctionClause?: (ctx: WindowFunctionClauseContext) => Result;
    /**
     * Visit a parse tree produced by the `scalarWindowFunction`
     * labeled alternative in `OpenSearchSQLParser.windowFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitScalarWindowFunction?: (ctx: ScalarWindowFunctionContext) => Result;
    /**
     * Visit a parse tree produced by the `aggregateWindowFunction`
     * labeled alternative in `OpenSearchSQLParser.windowFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAggregateWindowFunction?: (ctx: AggregateWindowFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.overClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOverClause?: (ctx: OverClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.partitionByClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPartitionByClause?: (ctx: PartitionByClauseContext) => Result;
    /**
     * Visit a parse tree produced by the `string`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitString?: (ctx: StringContext) => Result;
    /**
     * Visit a parse tree produced by the `signedDecimal`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSignedDecimal?: (ctx: SignedDecimalContext) => Result;
    /**
     * Visit a parse tree produced by the `signedReal`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSignedReal?: (ctx: SignedRealContext) => Result;
    /**
     * Visit a parse tree produced by the `boolean`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBoolean?: (ctx: BooleanContext) => Result;
    /**
     * Visit a parse tree produced by the `datetime`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDatetime?: (ctx: DatetimeContext) => Result;
    /**
     * Visit a parse tree produced by the `interval`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitInterval?: (ctx: IntervalContext) => Result;
    /**
     * Visit a parse tree produced by the `null`
     * labeled alternative in `OpenSearchSQLParser.constant`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNull?: (ctx: NullContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.decimalLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDecimalLiteral?: (ctx: DecimalLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.numericLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNumericLiteral?: (ctx: NumericLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.stringLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStringLiteral?: (ctx: StringLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.booleanLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBooleanLiteral?: (ctx: BooleanLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.realLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRealLiteral?: (ctx: RealLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.sign`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSign?: (ctx: SignContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.nullLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNullLiteral?: (ctx: NullLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.datetimeLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDatetimeLiteral?: (ctx: DatetimeLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.dateLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDateLiteral?: (ctx: DateLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.timeLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimeLiteral?: (ctx: TimeLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.timestampLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimestampLiteral?: (ctx: TimestampLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.datetimeConstantLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDatetimeConstantLiteral?: (ctx: DatetimeConstantLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.intervalLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIntervalLiteral?: (ctx: IntervalLiteralContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.intervalUnit`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIntervalUnit?: (ctx: IntervalUnitContext) => Result;
    /**
     * Visit a parse tree produced by the `orExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOrExpression?: (ctx: OrExpressionContext) => Result;
    /**
     * Visit a parse tree produced by the `andExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAndExpression?: (ctx: AndExpressionContext) => Result;
    /**
     * Visit a parse tree produced by the `notExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNotExpression?: (ctx: NotExpressionContext) => Result;
    /**
     * Visit a parse tree produced by the `predicateExpression`
     * labeled alternative in `OpenSearchSQLParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPredicateExpression?: (ctx: PredicateExpressionContext) => Result;
    /**
     * Visit a parse tree produced by the `expressionAtomPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExpressionAtomPredicate?: (ctx: ExpressionAtomPredicateContext) => Result;
    /**
     * Visit a parse tree produced by the `binaryComparisonPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryComparisonPredicate?: (ctx: BinaryComparisonPredicateContext) => Result;
    /**
     * Visit a parse tree produced by the `inPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitInPredicate?: (ctx: InPredicateContext) => Result;
    /**
     * Visit a parse tree produced by the `betweenPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBetweenPredicate?: (ctx: BetweenPredicateContext) => Result;
    /**
     * Visit a parse tree produced by the `isNullPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIsNullPredicate?: (ctx: IsNullPredicateContext) => Result;
    /**
     * Visit a parse tree produced by the `likePredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLikePredicate?: (ctx: LikePredicateContext) => Result;
    /**
     * Visit a parse tree produced by the `regexpPredicate`
     * labeled alternative in `OpenSearchSQLParser.predicate`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRegexpPredicate?: (ctx: RegexpPredicateContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.expressions`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExpressions?: (ctx: ExpressionsContext) => Result;
    /**
     * Visit a parse tree produced by the `constantExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConstantExpressionAtom?: (ctx: ConstantExpressionAtomContext) => Result;
    /**
     * Visit a parse tree produced by the `functionCallExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionCallExpressionAtom?: (ctx: FunctionCallExpressionAtomContext) => Result;
    /**
     * Visit a parse tree produced by the `fullColumnNameExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFullColumnNameExpressionAtom?: (ctx: FullColumnNameExpressionAtomContext) => Result;
    /**
     * Visit a parse tree produced by the `nestedExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNestedExpressionAtom?: (ctx: NestedExpressionAtomContext) => Result;
    /**
     * Visit a parse tree produced by the `mathExpressionAtom`
     * labeled alternative in `OpenSearchSQLParser.expressionAtom`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMathExpressionAtom?: (ctx: MathExpressionAtomContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.comparisonOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComparisonOperator?: (ctx: ComparisonOperatorContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.nullNotnull`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNullNotnull?: (ctx: NullNotnullContext) => Result;
    /**
     * Visit a parse tree produced by the `nestedAllFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNestedAllFunctionCall?: (ctx: NestedAllFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `scalarFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitScalarFunctionCall?: (ctx: ScalarFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `specificFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSpecificFunctionCall?: (ctx: SpecificFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `windowFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWindowFunctionCall?: (ctx: WindowFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `aggregateFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAggregateFunctionCall?: (ctx: AggregateFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `filteredAggregationFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFilteredAggregationFunctionCall?: (ctx: FilteredAggregationFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `scoreRelevanceFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitScoreRelevanceFunctionCall?: (ctx: ScoreRelevanceFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `relevanceFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceFunctionCall?: (ctx: RelevanceFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `highlightFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitHighlightFunctionCall?: (ctx: HighlightFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `positionFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPositionFunctionCall?: (ctx: PositionFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `extractFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExtractFunctionCall?: (ctx: ExtractFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `getFormatFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGetFormatFunctionCall?: (ctx: GetFormatFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `timestampFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.functionCall`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimestampFunctionCall?: (ctx: TimestampFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.timestampFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimestampFunction?: (ctx: TimestampFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.timestampFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimestampFunctionName?: (ctx: TimestampFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.getFormatFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGetFormatFunction?: (ctx: GetFormatFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.getFormatType`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGetFormatType?: (ctx: GetFormatTypeContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.extractFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExtractFunction?: (ctx: ExtractFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.simpleDateTimePart`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSimpleDateTimePart?: (ctx: SimpleDateTimePartContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.complexDateTimePart`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComplexDateTimePart?: (ctx: ComplexDateTimePartContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.datetimePart`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDatetimePart?: (ctx: DatetimePartContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.highlightFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitHighlightFunction?: (ctx: HighlightFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.positionFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPositionFunction?: (ctx: PositionFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.matchQueryAltSyntaxFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMatchQueryAltSyntaxFunction?: (ctx: MatchQueryAltSyntaxFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.scalarFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitScalarFunctionName?: (ctx: ScalarFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by the `caseFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.specificFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCaseFunctionCall?: (ctx: CaseFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `dataTypeFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.specificFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDataTypeFunctionCall?: (ctx: DataTypeFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.relevanceFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceFunction?: (ctx: RelevanceFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.scoreRelevanceFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitScoreRelevanceFunction?: (ctx: ScoreRelevanceFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.noFieldRelevanceFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNoFieldRelevanceFunction?: (ctx: NoFieldRelevanceFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.singleFieldRelevanceFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSingleFieldRelevanceFunction?: (ctx: SingleFieldRelevanceFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.multiFieldRelevanceFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMultiFieldRelevanceFunction?: (ctx: MultiFieldRelevanceFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.altSingleFieldRelevanceFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAltSingleFieldRelevanceFunction?: (ctx: AltSingleFieldRelevanceFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.altMultiFieldRelevanceFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAltMultiFieldRelevanceFunction?: (ctx: AltMultiFieldRelevanceFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.convertedDataType`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConvertedDataType?: (ctx: ConvertedDataTypeContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.caseFuncAlternative`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCaseFuncAlternative?: (ctx: CaseFuncAlternativeContext) => Result;
    /**
     * Visit a parse tree produced by the `regularAggregateFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.aggregateFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRegularAggregateFunctionCall?: (ctx: RegularAggregateFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `countStarFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.aggregateFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCountStarFunctionCall?: (ctx: CountStarFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `distinctCountFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.aggregateFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDistinctCountFunctionCall?: (ctx: DistinctCountFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by the `percentileApproxFunctionCall`
     * labeled alternative in `OpenSearchSQLParser.aggregateFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPercentileApproxFunctionCall?: (ctx: PercentileApproxFunctionCallContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.percentileApproxFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPercentileApproxFunction?: (ctx: PercentileApproxFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.filterClause`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFilterClause?: (ctx: FilterClauseContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.aggregationFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAggregationFunctionName?: (ctx: AggregationFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.mathematicalFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMathematicalFunctionName?: (ctx: MathematicalFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.trigonometricFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTrigonometricFunctionName?: (ctx: TrigonometricFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.arithmeticFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitArithmeticFunctionName?: (ctx: ArithmeticFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.dateTimeFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDateTimeFunctionName?: (ctx: DateTimeFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.textFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTextFunctionName?: (ctx: TextFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.flowControlFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFlowControlFunctionName?: (ctx: FlowControlFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.noFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNoFieldRelevanceFunctionName?: (ctx: NoFieldRelevanceFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.systemFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSystemFunctionName?: (ctx: SystemFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.nestedFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNestedFunctionName?: (ctx: NestedFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.scoreRelevanceFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitScoreRelevanceFunctionName?: (ctx: ScoreRelevanceFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.singleFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSingleFieldRelevanceFunctionName?: (ctx: SingleFieldRelevanceFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.multiFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMultiFieldRelevanceFunctionName?: (ctx: MultiFieldRelevanceFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.altSingleFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAltSingleFieldRelevanceFunctionName?: (ctx: AltSingleFieldRelevanceFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.altMultiFieldRelevanceFunctionName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAltMultiFieldRelevanceFunctionName?: (ctx: AltMultiFieldRelevanceFunctionNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.functionArgs`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionArgs?: (ctx: FunctionArgsContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.functionArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionArg?: (ctx: FunctionArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.relevanceArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceArg?: (ctx: RelevanceArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.highlightArg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitHighlightArg?: (ctx: HighlightArgContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.relevanceArgName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceArgName?: (ctx: RelevanceArgNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.highlightArgName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitHighlightArgName?: (ctx: HighlightArgNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.relevanceFieldAndWeight`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceFieldAndWeight?: (ctx: RelevanceFieldAndWeightContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.relevanceFieldWeight`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceFieldWeight?: (ctx: RelevanceFieldWeightContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.relevanceField`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceField?: (ctx: RelevanceFieldContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.relevanceQuery`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceQuery?: (ctx: RelevanceQueryContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.relevanceArgValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRelevanceArgValue?: (ctx: RelevanceArgValueContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.highlightArgValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitHighlightArgValue?: (ctx: HighlightArgValueContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.alternateMultiMatchArgName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAlternateMultiMatchArgName?: (ctx: AlternateMultiMatchArgNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.alternateMultiMatchQuery`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAlternateMultiMatchQuery?: (ctx: AlternateMultiMatchQueryContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.alternateMultiMatchField`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAlternateMultiMatchField?: (ctx: AlternateMultiMatchFieldContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.tableName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTableName?: (ctx: TableNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.columnName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitColumnName?: (ctx: ColumnNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.allTupleFields`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAllTupleFields?: (ctx: AllTupleFieldsContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.alias`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAlias?: (ctx: AliasContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.qualifiedName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitQualifiedName?: (ctx: QualifiedNameContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.ident`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIdent?: (ctx: IdentContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchSQLParser.keywordsCanBeId`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKeywordsCanBeId?: (ctx: KeywordsCanBeIdContext) => Result;
}

