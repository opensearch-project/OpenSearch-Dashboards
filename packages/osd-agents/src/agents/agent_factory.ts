/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseAgent } from './base_agent';
import { ReactAgent } from './langgraph/react_agent';

export class AgentFactory {
  /**
   * Create an agent instance of the specified type
   * Supports multiple agent implementations for testing and comparison
   */
  static createAgent(type: string): BaseAgent {
    const normalizedType = type.toLowerCase().trim();

    switch (normalizedType) {
      case 'langgraph':
      case 'react':
        return new ReactAgent();

      default:
        throw new Error(
          `Unknown agent type: ${type}. Available types: ${this.getAvailableAgents().join(', ')}`
        );
    }
  }

  /**
   * Get list of all available agent types
   */
  static getAvailableAgents(): string[] {
    return ['react'];
  }

  /**
   * Check if an agent type is supported
   */
  static isValidAgentType(type: string): boolean {
    return this.getAvailableAgents().includes(type.toLowerCase().trim());
  }

  /**
   * Get the default agent type
   */
  static getDefaultAgentType(): string {
    return 'react';
  }
}
