// Generated from ./src/plugins/data/public/antlr/dql/grammar/DQLParser.g4 by ANTLR 4.13.1

import { AbstractParseTreeVisitor } from "antlr4ng";


import { QueryContext } from "./DQLParser.js";
import { OperatorExpressionContext } from "./DQLParser.js";
import { BooleanOperatorContext } from "./DQLParser.js";
import { NotExpressionContext } from "./DQLParser.js";
import { PrimaryExpressionContext } from "./DQLParser.js";
import { ComparisonExpressionContext } from "./DQLParser.js";
import { KeyValueExpressionContext } from "./DQLParser.js";
import { TokenSearchContext } from "./DQLParser.js";
import { GroupExpressionContext } from "./DQLParser.js";
import { GroupContentContext } from "./DQLParser.js";
import { FieldContext } from "./DQLParser.js";
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
     * Visit a parse tree produced by `DQLParser.booleanOperator`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBooleanOperator?: (ctx: BooleanOperatorContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.notExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNotExpression?: (ctx: NotExpressionContext) => Result;
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
     * Visit a parse tree produced by `DQLParser.keyValueExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKeyValueExpression?: (ctx: KeyValueExpressionContext) => Result;
    /**
     * Visit a parse tree produced by `DQLParser.tokenSearch`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTokenSearch?: (ctx: TokenSearchContext) => Result;
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

