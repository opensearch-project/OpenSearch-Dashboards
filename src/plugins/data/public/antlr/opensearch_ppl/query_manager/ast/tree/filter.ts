/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';

export interface FilterConstructorProps {
  name: string;
  children: PPLNode[];
  logicalExpr: PPLNode;
  indices: QueryIndices;
}

export class Filter extends PPLNode {
  private readonly logicalExpr: PPLNode;

  /**
   * Creates an instance of Filter.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param logicalExpr - The logical expression of the filter.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({ name, children, logicalExpr, indices }: FilterConstructorProps) {
    super({ name, children, indices });
    this.logicalExpr = logicalExpr;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the tokens of the logical expression.
   */
  getTokens(): Tokens {
    return {
      logicalExpression: this.logicalExpr.getTokens(),
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the logical expression prefixed with 'where'.
   */
  toString(): string {
    return `where ${this.logicalExpr.toString()}`;
  }
}
