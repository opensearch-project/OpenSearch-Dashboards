/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PPLNodeProps {
  getName: () => string;
  getChildren: () => PPLNode[];
  toString: () => string;
  getTokens: () => any;
}

export interface QueryIndices {
  start: number;
  end: number;
}

export interface PPLNodeConstructorProps {
  name: string;
  children: PPLNode[];
  indices: QueryIndices;
}

export interface Tokens {
  [key: string]: string | string[] | Tokens | Tokens[];
}

export abstract class PPLNode implements PPLNodeProps {
  private name: string;
  private children: PPLNode[];
  protected indices: QueryIndices;

  /**
   * Creates an instance of PPLNode.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({ name, children = [], indices }: PPLNodeConstructorProps) {
    this.name = name;
    this.children = children;
    this.indices = indices;
  }

  /**
   * Gets the children of the node.
   * @returns An array of child nodes.
   */
  getChildren(): PPLNode[] {
    return this.children;
  }

  /**
   * Gets the name of the node.
   * @returns The name of the node.
   */
  getName(): string {
    return this.name;
  }

  /**
   * Gets the start and end indices of the node in the original query.
   * @returns The start and end indices.
   */
  getStartEndIndicesOfOriginQuery(): QueryIndices {
    return {
      start: this.indices.start,
      end: this.indices.end,
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the node.
   */
  abstract toString(): string;

  /**
   * Gets the tokens of the node.
   * @returns The tokens of the node.
   */
  abstract getTokens(): Tokens;
}