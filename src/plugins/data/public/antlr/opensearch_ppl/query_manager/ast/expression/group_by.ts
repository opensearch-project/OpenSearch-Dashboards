/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';

export interface GroupByConstructorProps {
  name: string;
  children: PPLNode[];
  fields: PPLNode[];
  span: PPLNode | null;
  indices: QueryIndices;
}

export class GroupBy extends PPLNode {
  private readonly fields: PPLNode[];
  private readonly span: PPLNode | null;

  /**
   * Creates an instance of GroupBy.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param fields - The fields to group by.
   * @param span - The span for the group by.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({ name, children, fields, span, indices }: GroupByConstructorProps) {
    super({ name, children, indices });
    this.fields = fields;
    this.span = span;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the tokens of the group fields and the span.
   */
  getTokens(): Tokens {
    console.log('this.fields: ', this.fields);
    return {
      group_fields: this.fields.map((field) => field.getTokens()),
      span: this.span,
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the group by expression.
   */
  toString(): string {
    return (
      `${!this.isEmpty(this.fields) || !this.isEmpty(this.span) ? 'by ' : ''}` +
      `${
        !this.isEmpty(this.span)
          ? `${this.span.toString()}${this.fields.length > 0 ? ', ' : ''}`
          : ''
      }` +
      `${this.fields.map((field) => field.toString()).join(', ')}`
    );
  }

  /**
   * Checks if a value is empty.
   * @param value - The value to check.
   * @returns True if the value is empty, false otherwise.
   */
  private isEmpty(value: any): boolean {
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return value === null || value === undefined || value === '';
  }
}
