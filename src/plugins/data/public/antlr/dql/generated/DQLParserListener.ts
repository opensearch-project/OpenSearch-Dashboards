// Generated from grammar/DQLParser.g4 by ANTLR 4.13.1

import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";


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
 * This interface defines a complete listener for a parse tree produced by
 * `DQLParser`.
 */
export class DQLParserListener implements ParseTreeListener {
    /**
     * Enter a parse tree produced by `DQLParser.query`.
     * @param ctx the parse tree
     */
    enterQuery?: (ctx: QueryContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.query`.
     * @param ctx the parse tree
     */
    exitQuery?: (ctx: QueryContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.operatorExpression`.
     * @param ctx the parse tree
     */
    enterOperatorExpression?: (ctx: OperatorExpressionContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.operatorExpression`.
     * @param ctx the parse tree
     */
    exitOperatorExpression?: (ctx: OperatorExpressionContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.booleanOperator`.
     * @param ctx the parse tree
     */
    enterBooleanOperator?: (ctx: BooleanOperatorContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.booleanOperator`.
     * @param ctx the parse tree
     */
    exitBooleanOperator?: (ctx: BooleanOperatorContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.notExpression`.
     * @param ctx the parse tree
     */
    enterNotExpression?: (ctx: NotExpressionContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.notExpression`.
     * @param ctx the parse tree
     */
    exitNotExpression?: (ctx: NotExpressionContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.primaryExpression`.
     * @param ctx the parse tree
     */
    enterPrimaryExpression?: (ctx: PrimaryExpressionContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.primaryExpression`.
     * @param ctx the parse tree
     */
    exitPrimaryExpression?: (ctx: PrimaryExpressionContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.comparisonExpression`.
     * @param ctx the parse tree
     */
    enterComparisonExpression?: (ctx: ComparisonExpressionContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.comparisonExpression`.
     * @param ctx the parse tree
     */
    exitComparisonExpression?: (ctx: ComparisonExpressionContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.keyValueExpression`.
     * @param ctx the parse tree
     */
    enterKeyValueExpression?: (ctx: KeyValueExpressionContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.keyValueExpression`.
     * @param ctx the parse tree
     */
    exitKeyValueExpression?: (ctx: KeyValueExpressionContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.tokenSearch`.
     * @param ctx the parse tree
     */
    enterTokenSearch?: (ctx: TokenSearchContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.tokenSearch`.
     * @param ctx the parse tree
     */
    exitTokenSearch?: (ctx: TokenSearchContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.groupExpression`.
     * @param ctx the parse tree
     */
    enterGroupExpression?: (ctx: GroupExpressionContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.groupExpression`.
     * @param ctx the parse tree
     */
    exitGroupExpression?: (ctx: GroupExpressionContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.groupContent`.
     * @param ctx the parse tree
     */
    enterGroupContent?: (ctx: GroupContentContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.groupContent`.
     * @param ctx the parse tree
     */
    exitGroupContent?: (ctx: GroupContentContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.field`.
     * @param ctx the parse tree
     */
    enterField?: (ctx: FieldContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.field`.
     * @param ctx the parse tree
     */
    exitField?: (ctx: FieldContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.value`.
     * @param ctx the parse tree
     */
    enterValue?: (ctx: ValueContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.value`.
     * @param ctx the parse tree
     */
    exitValue?: (ctx: ValueContext) => void;
    /**
     * Enter a parse tree produced by `DQLParser.comparisonOperator`.
     * @param ctx the parse tree
     */
    enterComparisonOperator?: (ctx: ComparisonOperatorContext) => void;
    /**
     * Exit a parse tree produced by `DQLParser.comparisonOperator`.
     * @param ctx the parse tree
     */
    exitComparisonOperator?: (ctx: ComparisonOperatorContext) => void;

    visitTerminal(node: TerminalNode): void {}
    visitErrorNode(node: ErrorNode): void {}
    enterEveryRule(node: ParserRuleContext): void {}
    exitEveryRule(node: ParserRuleContext): void {}
}

