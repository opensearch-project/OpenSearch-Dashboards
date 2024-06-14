/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';

export interface SpanExpressionConstructorProps {
  name: string;
  children: PPLNode[];
  fieldExpression: string;
  literalValue: string;
  timeUnit: string;
  indices: QueryIndices;
}

export class SpanExpression extends PPLNode {
  private readonly fieldExpression: string;
  private readonly literalValue: string;
  private readonly timeUnit: string;

  /**
   * Creates an instance of SpanExpression.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param fieldExpression - The field expression of the span.
   * @param literalValue - The literal value of the span.
   * @param timeUnit - The time unit of the span.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({
    name,
    children,
    fieldExpression,
    literalValue,
    timeUnit,
    indices,
  }: SpanExpressionConstructorProps) {
    super({ name, children, indices });
    this.fieldExpression = fieldExpression;
    this.literalValue = literalValue;
    this.timeUnit = timeUnit;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the field expression, literal value, and time unit.
   */
  getTokens(): Tokens {
    return {
      field: this.fieldExpression,
      literal_value: this.literalValue,
      time_unit: this.timeUnit,
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the span expression.
   */
  toString(): string {
    return `span(${this.fieldExpression}, ${this.literalValue} ${this.timeUnit})`;
  }
}
