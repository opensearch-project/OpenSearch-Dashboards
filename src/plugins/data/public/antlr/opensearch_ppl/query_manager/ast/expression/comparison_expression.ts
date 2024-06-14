/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';

export interface ComparisonExpressionConstructorProps {
  name: string;
  children: PPLNode[];
  leftValue: PPLNode | string;
  rightValue: PPLNode | string;
  operator: string;
  indices: QueryIndices;
}

export class ComparisonExpression extends PPLNode {
  private readonly leftValue: PPLNode | string;
  private readonly rightValue: PPLNode | string;
  private readonly operator: string;

  /**
   * Creates an instance of ComparisonExpression.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param leftValue - The left value of the comparison.
   * @param rightValue - The right value of the comparison.
   * @param operator - The operator of the comparison.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({
    name,
    children,
    leftValue,
    rightValue,
    operator,
    indices,
  }: ComparisonExpressionConstructorProps) {
    super({ name, children, indices });
    this.leftValue = leftValue;
    this.rightValue = rightValue;
    this.operator = operator;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the left value, right value, and operator of the comparison.
   */
  getTokens(): Tokens {
    return {
      leftValue: typeof this.leftValue === 'string' ? this.leftValue : this.leftValue.getTokens(),
      rightValue:
        typeof this.rightValue === 'string' ? this.rightValue : this.rightValue.getTokens(),
      operator: this.operator,
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the comparison expression.
   */
  toString(): string {
    return `${this.leftValue} ${this.operator} ${this.rightValue}`;
  }
}
