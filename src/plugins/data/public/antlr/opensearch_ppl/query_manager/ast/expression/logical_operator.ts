/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from "../node";

export interface LogicalOperatorConstructorProps {
  name: string;
  children: PPLNode[];
  operator: string;
  expr: PPLNode;
  indices: QueryIndices;
}

export class LogicalOperator extends PPLNode {
  private readonly operator: string;
  private readonly expr: PPLNode;

  /**
   * Creates an instance of LogicalOperator.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param operator - The operator for the logical operation.
   * @param expr - The expression of the logical operation.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({
    name,
    children,
    operator,
    expr,
    indices,
  }: LogicalOperatorConstructorProps) {
    super({ name, children, indices });
    this.operator = operator;
    this.expr = expr;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the operator and tokens of the expression.
   */
  getTokens(): Tokens {
    return {
      operator: this.operator,
      expression: this.expr.getTokens(),
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the logical operator expression.
   */
  toString(): string {
    return `(${this.operator} ${this.expr.toString()})`;
  }
}