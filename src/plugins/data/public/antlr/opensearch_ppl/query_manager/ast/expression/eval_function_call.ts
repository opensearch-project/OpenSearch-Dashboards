/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';

export interface EvalFunctionCallConstructorProps {
  name: string;
  children: PPLNode[];
  terminateNodes: string[];
  functionName: string;
  args: PPLNode[];
  indices: QueryIndices;
}

export class EvalFunctionCall extends PPLNode {
  private readonly functionName: string;
  private readonly args: string[];
  private readonly terminateNodes: string[];

  /**
   * Creates an instance of EvalFunctionCall.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param terminateNodes - The terminate nodes for the function call.
   * @param functionName - The name of the function.
   * @param args - The arguments of the function.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({
    name,
    children,
    terminateNodes,
    functionName,
    args,
    indices,
  }: EvalFunctionCallConstructorProps) {
    super({ name, children, indices });
    this.functionName = functionName;
    this.args = args;
    this.terminateNodes = terminateNodes;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the function name and arguments.
   */
  getTokens(): Tokens {
    return {
      function: this.functionName,
      args: this.args.map((arg) => {
        if (typeof arg === 'string') {
          return arg;
        }
        return arg.getTokens();
      }),
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the evaluation function call.
   */
  toString(): string {
    return `${this.functionName}${this.terminateNodes[0]}${this.args
      .map((arg) => arg.toString())
      .join(', ')}${this.terminateNodes[1]}`;
  }
}
