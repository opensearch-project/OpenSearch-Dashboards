/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { AssistantAction, ToolStatus } from '../hooks/use_assistant_action';

export interface ToolCallState {
  id: string;
  name: string;
  status: ToolStatus;
  args?: any;
  result?: any;
  error?: Error;
  timestamp: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AssistantActionState {
  actions: Map<string, AssistantAction>;
  toolCallStates: Map<string, ToolCallState>;
  toolDefinitions: ToolDefinition[];
}

/**
 * Global singleton service for managing assistant actions across all plugins
 */
export class AssistantActionService {
  private static instance: AssistantActionService | null = null;
  private state$ = new BehaviorSubject<AssistantActionState>({
    actions: new Map(),
    toolCallStates: new Map(),
    toolDefinitions: [],
  });

  private constructor() {}

  static getInstance(): AssistantActionService {
    if (!AssistantActionService.instance) {
      AssistantActionService.instance = new AssistantActionService();
    }
    return AssistantActionService.instance;
  }

  /**
   * Get observable state for reactive updates
   */
  getState$(): Observable<AssistantActionState> {
    return this.state$.asObservable();
  }

  /**
   * Get current state snapshot
   */
  getCurrentState(): AssistantActionState {
    return this.state$.getValue();
  }

  registerAction = (action: AssistantAction) => {
    const currentState = this.state$.getValue();
    const existingAction = currentState.actions.get(action.name);

    // Check if this is actually a new or changed action
    const hasChanged =
      !existingAction ||
      existingAction.description !== action.description ||
      JSON.stringify(existingAction.parameters) !== JSON.stringify(action.parameters) ||
      existingAction.available !== action.available;

    // Always update the action to get latest handler/render
    const newActions = new Map(currentState.actions);
    newActions.set(action.name, action);

    // Only trigger updates if something actually changed
    if (hasChanged) {
      const toolDefinitions = this.createToolDefinitions(newActions);
      this.state$.next({
        ...currentState,
        actions: newActions,
        toolDefinitions,
      });
    }
  };

  unregisterAction = (name: string) => {
    const currentState = this.state$.getValue();

    // Only update if the action actually exists
    if (currentState.actions.has(name)) {
      const newActions = new Map(currentState.actions);
      newActions.delete(name);

      const toolDefinitions = this.createToolDefinitions(newActions);
      this.state$.next({
        ...currentState,
        actions: newActions,
        toolDefinitions,
      });
    }
  };

  executeAction = async (name: string, args: any) => {
    const currentState = this.state$.getValue();
    const action = currentState.actions.get(name);
    if (!action) {
      throw new Error(`Action ${name} not found`);
    }
    if (!action.handler) {
      throw new Error(`Action ${name} has no handler`);
    }
    return action.handler(args);
  };

  updateToolCallState = (id: string, state: Partial<ToolCallState>) => {
    const currentState = this.state$.getValue();
    const existing = currentState.toolCallStates.get(id) || {
      id,
      name: '',
      status: 'pending' as ToolStatus,
      timestamp: Date.now(),
    };

    const newToolCallStates = new Map(currentState.toolCallStates);
    newToolCallStates.set(id, {
      ...existing,
      ...state,
    });

    this.state$.next({
      ...currentState,
      toolCallStates: newToolCallStates,
    });
  };

  getActionRenderer = (name: string) => {
    const currentState = this.state$.getValue();
    const action = currentState.actions.get(name);
    return action?.render;
  };

  private createToolDefinitions = (actions: Map<string, AssistantAction>): ToolDefinition[] => {
    return Array.from(actions.values())
      .filter((action) => action.available !== 'disabled')
      .map((action) => ({
        name: action.name,
        description: action.description,
        parameters: action.parameters,
      }));
  };

  getToolDefinitions = (): ToolDefinition[] => {
    return this.state$.getValue().toolDefinitions;
  };

  // For debugging
  getRegisteredActions = () => {
    return Array.from(this.state$.getValue().actions.keys());
  };
}
