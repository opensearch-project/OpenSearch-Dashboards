/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';

export interface IntervalLiteralConstructorProps {
  name: string;
  children: PPLNode[];
  typeLiteral: string;
  value: string;
  unit: string;
  indices: QueryIndices;
}

export class IntervalLiteral extends PPLNode {
  private readonly typeLiteral: string;
  private readonly value: string;
  private readonly unit: string;

  /**
   * Creates an instance of IntervalLiteral.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param typeLiteral - The type literal of the interval.
   * @param value - The value of the interval.
   * @param unit - The unit of the interval.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({
    name,
    children,
    typeLiteral,
    value,
    unit,
    indices,
  }: IntervalLiteralConstructorProps) {
    super({ name, children, indices });
    this.typeLiteral = typeLiteral;
    this.value = value;
    this.unit = unit;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the type literal, value, and unit.
   */
  getTokens(): Tokens {
    return {
      typeLiteral: this.typeLiteral,
      value: this.value,
      unit: this.unit,
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the interval literal.
   */
  toString(): string {
    return `${this.typeLiteral} '${this.value}' ${this.unit}`;
  }
}
