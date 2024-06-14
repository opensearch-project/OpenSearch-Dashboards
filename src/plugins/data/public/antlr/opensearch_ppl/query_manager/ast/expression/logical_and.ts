/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from "../node";

export interface LogicalAndConstructorProps {
  name: string;
  children: PPLNode[];
  operator: string;
  left: PPLNode;
  right: PPLNode;
  indices: QueryIndices;
}

export class LogicalAnd extends PPLNode {
  private readonly operator: string;
  private readonly left: PPLNode;
  private readonly right: PPLNode;

  /**
   * Creates an instance of LogicalAnd.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param operator - The operator for the logical AND.
   * @param left - The left operand of the logical AND.
   * @param right - The right operand of the logical AND.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({
    name,
    children,
    operator,
    left,
    right,
    indices,
  }: LogicalAndConstructorProps) {
    super({ name, children, indices });
    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the operator and tokens of the left and right operands.
   */
  getTokens(): Tokens {
    return {
      operator: this.operator,
      left: this.left.getTokens(),
      right: this.right.getTokens(),
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the logical AND expression.
   */
  toString(): string {
    return `${this.left.toString()} ${this.operator} ${this.right.toString()}`;
  }
}