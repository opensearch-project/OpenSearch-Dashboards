/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';

export interface SpanExpressionConstructorProps {
  name: string;
  children: PPLNode[];
  spanExpression: PPLNode;
  customLabel: string;
  indices: QueryIndices;
}

export class Span extends PPLNode {
  private readonly spanExpression: PPLNode;
  private readonly customLabel: string;

  constructor({
    name,
    children,
    spanExpression,
    customLabel,
    indices,
  }: SpanExpressionConstructorProps) {
    super({ name, children, indices });
    this.spanExpression = spanExpression;
    this.customLabel = customLabel;
  }

  getTokens(): Tokens {
    return {
      span_expression: this.spanExpression.getTokens(),
      customLabel: this.customLabel,
    };
  }

  toString(): string {
    return `${this.spanExpression.toString()}${this.customLabel ? ` as ${this.customLabel}` : ''}`;
  }
}
