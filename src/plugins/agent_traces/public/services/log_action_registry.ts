/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogActionDefinition, LogActionContext, LogActionRegistry } from '../types/log_actions';

/**
 * Service for managing log actions that can be performed on log entries
 */
export class LogActionRegistryService implements LogActionRegistry {
  private actions = new Map<string, LogActionDefinition>();

  /**
   * Register a new log action
   */
  public registerAction = (action: LogActionDefinition): void => {
    if (this.actions.has(action.id)) {
      throw new Error(`Action with id "${action.id}" is already registered`);
    }
    this.actions.set(action.id, action);
  };

  /**
   * Unregister a log action by ID
   */
  public unregisterAction = (actionId: string): void => {
    this.actions.delete(actionId);
  };

  /**
   * Get all registered actions that are compatible with the given context
   */
  public getCompatibleActions = (context: LogActionContext): LogActionDefinition[] => {
    const compatibleActions: LogActionDefinition[] = [];

    for (const action of this.actions.values()) {
      try {
        if (action.isCompatible(context)) {
          compatibleActions.push(action);
        }
      } catch (error) {
        // Log error but don't break the flow
        // eslint-disable-next-line no-console
        console.warn(`Error checking compatibility for action "${action.id}":`, error);
      }
    }

    // Sort by order property
    return compatibleActions.sort((a, b) => a.order - b.order);
  };

  /**
   * Get a specific action by ID
   */
  public getAction = (actionId: string): LogActionDefinition | undefined => {
    return this.actions.get(actionId);
  };

  /**
   * Get all registered actions (for debugging/testing)
   */
  public getAllActions = (): LogActionDefinition[] => {
    return Array.from(this.actions.values());
  };

  /**
   * Clear all registered actions
   */
  public clear = (): void => {
    this.actions.clear();
  };
}

// Create a singleton instance
export const logActionRegistry = new LogActionRegistryService();
