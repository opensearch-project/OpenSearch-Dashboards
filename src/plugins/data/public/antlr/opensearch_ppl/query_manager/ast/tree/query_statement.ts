/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';

export interface QueryStatementConstructorProps {
  name: string;
  children: PPLNode[];
  pplCommands: PPLNode;
  commands: PPLNode[];
  indices: QueryIndices;
}

/**
 * Creates an instance of QueryStatement.
 * @param name - The name of the node.
 * @param children - The children of the node.
 * @param pplCommands - The PPL commands node.
 * @param commands - An array of command nodes.
 * @param indices - The start and end indices of the node in the original query.
 */
export class QueryStatement extends PPLNode {
  private readonly commands: PPLNode[];
  private readonly pplCommands: PPLNode;
  constructor({ name, children, pplCommands, commands, indices }: QueryStatementConstructorProps) {
    super({ name, children, indices });
    this.commands = commands;
    this.pplCommands = pplCommands;
    this.indices = indices;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the tokens of the PPL commands and other commands.
   */
  getTokens(): Tokens {
    return {
      pplCommands: this.pplCommands,
      commands: this.commands.map((command) => typeof command.getTokens === 'function' ? command.getTokens() : command),
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the PPL commands and other commands.
   */
  toString() {
    return `${this.pplCommands.toString()}${this.commands
      .map((command) => command.toString())
      .join(' | ')}`;
  }
}
