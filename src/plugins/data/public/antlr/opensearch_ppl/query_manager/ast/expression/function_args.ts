/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';

export interface FunctionArgsConstructorProps {
  name: string;
  children: PPLNode[];
  args: string[];
  terminateNodes: string[];
  indices: QueryIndices;
}

export class FunctionArgs extends PPLNode {
  private readonly args: string[];
  private readonly terminateNodes: string[];

  /**
   * Creates an instance of FunctionArgs.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param args - An array of function arguments.
   * @param terminateNodes - An array of terminate nodes.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({ name, children, args, terminateNodes, indices }: FunctionArgsConstructorProps) {
    super({ name, children, indices });
    this.args = args;
    this.terminateNodes = terminateNodes;
  }

  /**
   * Gets the tokens of FunctionArgs.
   * @returns An object containing the function arguments and terminate nodes.
   */
  getTokens(): Tokens {
    return {
      args: this.args,
      terminateNodes: this.terminateNodes,
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the function arguments.
   */
  toString(): string {
    return this.args.map((arg) => arg.toString()).join(', ');
  }
}
