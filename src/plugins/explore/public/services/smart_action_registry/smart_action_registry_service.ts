/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SmartActionDefinition,
  SmartActionRegistry,
  SmartActionContext,
} from '../../types/smart_actions';

export class SmartActionRegistryService implements SmartActionRegistry {
  private actions = new Map<string, SmartActionDefinition>();

  /**
   * Register a new smart action
   */
  registerAction = (action: SmartActionDefinition): void => {
    if (this.actions.has(action.id)) {
      console.warn(`Smart action with id '${action.id}' is already registered. Overriding.`);
    }
    this.actions.set(action.id, action);
    console.log(
      `📝 Smart Action Registry: Registered action "${action.id}" - Total actions: ${this.actions.size}`
    );
  };

  /**
   * Unregister a smart action by ID
   */
  unregisterAction = (actionId: string): void => {
    this.actions.delete(actionId);
  };

  /**
   * Get all registered actions compatible with the given context
   */
  getCompatibleActions = (context: SmartActionContext): SmartActionDefinition[] => {
    const allActions = Array.from(this.actions.values());
    const compatibleActions = allActions
      .filter((action) => action.isCompatible(context))
      .sort((a, b) => a.order - b.order);

    console.log(
      `🔍 Smart Action Registry: Found ${compatibleActions.length} compatible actions for field type "${context.fieldContext.fieldType}"`
    );
    console.log(
      'Compatible actions:',
      compatibleActions.map((a) => a.id)
    );

    return compatibleActions;
  };

  /**
   * Get a specific action by ID
   */
  getAction = (actionId: string): SmartActionDefinition | undefined => {
    return this.actions.get(actionId);
  };

  /**
   * Get all registered actions (for debugging)
   */
  getAllActions = (): SmartActionDefinition[] => {
    return Array.from(this.actions.values()).sort((a, b) => a.order - b.order);
  };
}

// Create singleton instance
export const smartActionRegistry = new SmartActionRegistryService();
