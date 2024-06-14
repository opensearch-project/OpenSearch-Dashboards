/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';

export interface FieldConstructorProps {
  name: string;
  children: PPLNode[];
  fieldExpression: string;
  indices: QueryIndices;
}

export class Field extends PPLNode {
  private readonly fieldExpression: string;

  /**
   * Creates an instance of Field.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param fieldExpression - The field expression.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({
    name,
    children,
    fieldExpression,
    indices,
  }: FieldConstructorProps) {
    super({ name, children, indices });
    this.fieldExpression = fieldExpression;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the field expression.
   */
  getTokens(): Tokens {
    return { name: this.fieldExpression ?? '' };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the field expression.
   */
  toString(): string {
    return this.fieldExpression ?? '';
  }
}
