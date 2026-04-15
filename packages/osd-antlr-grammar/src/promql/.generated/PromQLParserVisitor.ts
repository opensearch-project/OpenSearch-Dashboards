// Generated from ./src/plugins/data/public/antlr/promql/grammar/PromQLParser.g4 by ANTLR 4.13.1

import { AbstractParseTreeVisitor } from "antlr4ng";


import { ExpressionContext } from "./PromQLParser.js";
import { VectorOperationContext } from "./PromQLParser.js";
import { UnaryOpContext } from "./PromQLParser.js";
import { PowOpContext } from "./PromQLParser.js";
import { MultOpContext } from "./PromQLParser.js";
import { AddOpContext } from "./PromQLParser.js";
import { CompareOpContext } from "./PromQLParser.js";
import { AndUnlessOpContext } from "./PromQLParser.js";
import { OrOpContext } from "./PromQLParser.js";
import { VectorMatchOpContext } from "./PromQLParser.js";
import { SubqueryOpContext } from "./PromQLParser.js";
import { OffsetOpContext } from "./PromQLParser.js";
import { VectorContext } from "./PromQLParser.js";
import { ParensContext } from "./PromQLParser.js";
import { MetricNameContext } from "./PromQLParser.js";
import { InstantSelectorContext } from "./PromQLParser.js";
import { LabelMatcherContext } from "./PromQLParser.js";
import { LabelValueContext } from "./PromQLParser.js";
import { LabelMatcherOperatorContext } from "./PromQLParser.js";
import { LabelMatcherListContext } from "./PromQLParser.js";
import { MatrixSelectorContext } from "./PromQLParser.js";
import { TimeRangeContext } from "./PromQLParser.js";
import { SubqueryRangeContext } from "./PromQLParser.js";
import { DurationContext } from "./PromQLParser.js";
import { OffsetContext } from "./PromQLParser.js";
import { FunctionContext } from "./PromQLParser.js";
import { ParameterContext } from "./PromQLParser.js";
import { ParameterListContext } from "./PromQLParser.js";
import { FunctionNamesContext } from "./PromQLParser.js";
import { AggregationContext } from "./PromQLParser.js";
import { ByContext } from "./PromQLParser.js";
import { WithoutContext } from "./PromQLParser.js";
import { AggregationOperatorsContext } from "./PromQLParser.js";
import { GroupingContext } from "./PromQLParser.js";
import { On_Context } from "./PromQLParser.js";
import { IgnoringContext } from "./PromQLParser.js";
import { GroupLeftContext } from "./PromQLParser.js";
import { GroupRightContext } from "./PromQLParser.js";
import { LabelNameContext } from "./PromQLParser.js";
import { LabelNameListContext } from "./PromQLParser.js";
import { KeywordContext } from "./PromQLParser.js";
import { LiteralContext } from "./PromQLParser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `PromQLParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class PromQLParserVisitor<Result> extends AbstractParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `PromQLParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExpression?: (ctx: ExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.vectorOperation`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVectorOperation?: (ctx: VectorOperationContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.unaryOp`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitUnaryOp?: (ctx: UnaryOpContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.powOp`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPowOp?: (ctx: PowOpContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.multOp`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMultOp?: (ctx: MultOpContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.addOp`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAddOp?: (ctx: AddOpContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.compareOp`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCompareOp?: (ctx: CompareOpContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.andUnlessOp`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAndUnlessOp?: (ctx: AndUnlessOpContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.orOp`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOrOp?: (ctx: OrOpContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.vectorMatchOp`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVectorMatchOp?: (ctx: VectorMatchOpContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.subqueryOp`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSubqueryOp?: (ctx: SubqueryOpContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.offsetOp`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOffsetOp?: (ctx: OffsetOpContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.vector`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVector?: (ctx: VectorContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.parens`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParens?: (ctx: ParensContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.metricName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMetricName?: (ctx: MetricNameContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.instantSelector`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitInstantSelector?: (ctx: InstantSelectorContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.labelMatcher`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLabelMatcher?: (ctx: LabelMatcherContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.labelValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLabelValue?: (ctx: LabelValueContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.labelMatcherOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLabelMatcherOperator?: (ctx: LabelMatcherOperatorContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.labelMatcherList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLabelMatcherList?: (ctx: LabelMatcherListContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.matrixSelector`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMatrixSelector?: (ctx: MatrixSelectorContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.timeRange`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTimeRange?: (ctx: TimeRangeContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.subqueryRange`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSubqueryRange?: (ctx: SubqueryRangeContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.duration`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDuration?: (ctx: DurationContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.offset`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOffset?: (ctx: OffsetContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.function`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunction?: (ctx: FunctionContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.parameter`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParameter?: (ctx: ParameterContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.parameterList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParameterList?: (ctx: ParameterListContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.functionNames`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFunctionNames?: (ctx: FunctionNamesContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.aggregation`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAggregation?: (ctx: AggregationContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.by`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBy?: (ctx: ByContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.without`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWithout?: (ctx: WithoutContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.aggregationOperators`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAggregationOperators?: (ctx: AggregationOperatorsContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.grouping`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGrouping?: (ctx: GroupingContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.on_`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOn_?: (ctx: On_Context) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.ignoring`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIgnoring?: (ctx: IgnoringContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.groupLeft`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGroupLeft?: (ctx: GroupLeftContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.groupRight`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGroupRight?: (ctx: GroupRightContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.labelName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLabelName?: (ctx: LabelNameContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.labelNameList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLabelNameList?: (ctx: LabelNameListContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.keyword`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKeyword?: (ctx: KeywordContext) => Result;
    /**
     * Visit a parse tree produced by `PromQLParser.literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLiteral?: (ctx: LiteralContext) => Result;
}

