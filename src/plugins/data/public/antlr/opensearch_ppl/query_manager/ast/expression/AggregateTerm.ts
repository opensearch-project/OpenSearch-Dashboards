/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { PPLNode, QueryIndices, Tokens } from '../node';

export interface AggregateTermConstructorProps {
  name: string;
  children: PPLNode[];
  statsFunction: PPLNode;
  customLabel: string;
  indices: QueryIndices;
}

export class AggregateTerm extends PPLNode {
  private readonly statsFunction: PPLNode;
  private readonly customLabel: string;

  /**
   * Creates an instance of AggregateTerm.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param statsFunction - The statistics function of the aggregate term.
   * @param customLabel - The custom label for the aggregate term.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({
    name,
    children,
    statsFunction,
    customLabel,
    indices,
  }: AggregateTermConstructorProps) {
    super({ name, children, indices });
    this.statsFunction = statsFunction;
    this.customLabel = customLabel;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the statistics function tokens and the custom label.
   */
  getTokens(): Tokens {
    return {
      function: this.statsFunction,
      customLabel: this.customLabel,
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the aggregate term, optionally including the custom label.
   */
  toString(): string {
    return `${this.statsFunction.toString()}${this.customLabel ? ` as ${this.customLabel}` : ''}`;
  }
}
