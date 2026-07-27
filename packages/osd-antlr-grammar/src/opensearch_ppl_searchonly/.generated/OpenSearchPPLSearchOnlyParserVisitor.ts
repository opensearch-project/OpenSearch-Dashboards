// Generated from ./src/opensearch_ppl_searchonly/grammar/OpenSearchPPLSearchOnlyParser.g4 by ANTLR 4.13.1

import { AbstractParseTreeVisitor } from "antlr4ng";


import { SearchExpressionContext } from "./OpenSearchPPLSearchOnlyParser.js";
import { AndExpressionContext } from "./OpenSearchPPLSearchOnlyParser.js";
import { OrExpressionContext } from "./OpenSearchPPLSearchOnlyParser.js";
import { NotExpressionContext } from "./OpenSearchPPLSearchOnlyParser.js";
import { PrimaryExpressionContext } from "./OpenSearchPPLSearchOnlyParser.js";
import { ComparisonExpressionContext } from "./OpenSearchPPLSearchOnlyParser.js";
import { InExpressionContext } from "./OpenSearchPPLSearchOnlyParser.js";
import { ComparisonOperatorContext } from "./OpenSearchPPLSearchOnlyParser.js";
import { FieldContext } from "./OpenSearchPPLSearchOnlyParser.js";
import { ValueContext } from "./OpenSearchPPLSearchOnlyParser.js";
import { TermContext } from "./OpenSearchPPLSearchOnlyParser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `OpenSearchPPLSearchOnlyParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class OpenSearchPPLSearchOnlyParserVisitor<Result> extends AbstractParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `OpenSearchPPLSearchOnlyParser.searchExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSearchExpression?: (ctx: SearchExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLSearchOnlyParser.andExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAndExpression?: (ctx: AndExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLSearchOnlyParser.orExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOrExpression?: (ctx: OrExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLSearchOnlyParser.notExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNotExpression?: (ctx: NotExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLSearchOnlyParser.primaryExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPrimaryExpression?: (ctx: PrimaryExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLSearchOnlyParser.comparisonExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComparisonExpression?: (ctx: ComparisonExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLSearchOnlyParser.inExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitInExpression?: (ctx: InExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLSearchOnlyParser.comparisonOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitComparisonOperator?: (ctx: ComparisonOperatorContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLSearchOnlyParser.field`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitField?: (ctx: FieldContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLSearchOnlyParser.value`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitValue?: (ctx: ValueContext) => Result;
    /**
     * Visit a parse tree produced by `OpenSearchPPLSearchOnlyParser.term`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTerm?: (ctx: TermContext) => Result;
}

