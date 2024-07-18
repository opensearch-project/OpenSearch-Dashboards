// Generated from grammar/DQLParser.g4 by ANTLR 4.13.1

import { AbstractParseTreeVisitor } from "antlr4ng";


import { QueryContext } from "./DQLParser.js";
import { OperatorExpressionContext } from "./DQLParser.js";
import { OrExpressionContext } from "./DQLParser.js";
import { OrTermContext } from "./DQLParser.js";
import { AndExpressionContext } from "./DQLParser.js";
import { PrimaryExpressionContext } from "./DQLParser.js";
import { ComparisonExpressionContext } from "./DQLParser.js";
import { FieldExpressionContext } from "./DQLParser.js";
import { TermSearchContext } from "./DQLParser.js";
import { GroupExpressionContext } from "./DQLParser.js";
import { GroupContentContext } from "./DQLParser.js";
import { FieldContext } from "./DQLParser.js";
import { RangeValueContext } from "./DQLParser.js";
import { ValueContext } from "./DQLParser.js";
import { ComparisonOperatorContext } from "./DQLParser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `DQLParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class DQLParserVisitor<Result> extends AbstractParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `DQLParser.query`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitQuery?: (ctx: QueryContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.operatorExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOperatorExpression?: (ctx: OperatorExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.orExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOrExpression?: (ctx: OrExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.orTerm`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOrTerm?: (ctx: OrTermContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.andExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAndExpression?: (ctx: AndExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.primaryExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPrimaryExpression?: (ctx: PrimaryExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.comparisonExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComparisonExpression?: (ctx: ComparisonExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.fieldExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFieldExpression?: (ctx: FieldExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.termSearch`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTermSearch?: (ctx: TermSearchContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.groupExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGroupExpression?: (ctx: GroupExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.groupContent`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGroupContent?: (ctx: GroupContentContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.field`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitField?: (ctx: FieldContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.rangeValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRangeValue?: (ctx: RangeValueContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.value`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitValue?: (ctx: ValueContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.comparisonOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComparisonOperator?: (ctx: ComparisonOperatorContext) => Result;
}

