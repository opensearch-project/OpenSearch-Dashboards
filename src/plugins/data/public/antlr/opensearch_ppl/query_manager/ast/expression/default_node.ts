/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, Tokens } from '../node';

export interface DefaultNodeConstructorProps {
  name: string;
  children: PPLNode[];
}

export class DefaultNode extends PPLNode {
  /**
   * Creates an instance of DefaultNode.
   * @param name - The name of the node.
   * @param children - The children of the node.
   */
  constructor({ name, children }: DefaultNodeConstructorProps) {
    super({ name, children, indices: { start: -1, end: -1 } });
  }

  /**
   * Gets the tokens of the node.
   * @returns An empty object.
   */
  getTokens(): Tokens {
    return {};
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of 'DefaultNode'.
   */
  toString(): string {
    return 'DefaultNode';
  }
}
