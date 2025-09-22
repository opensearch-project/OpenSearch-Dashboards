/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useState, useCallback, ReactNode } from 'react';
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

export interface AssistantActionContextValue {
  actions: Map<string, AssistantAction>;
  toolCallStates: Map<string, ToolCallState>;
  registerAction: (action: AssistantAction) => void;
  unregisterAction: (name: string) => void;
  executeAction: (name: string, args: any) => Promise<any>;
  getToolDefinitions: () => ToolDefinition[];
  updateToolCallState: (id: string, state: Partial<ToolCallState>) => void;
  getActionRenderer: (name: string) => AssistantAction['render'] | undefined;
}

export const AssistantActionContext = createContext<AssistantActionContextValue | null>(null);

interface AssistantActionProviderProps {
  children: ReactNode;
  onToolsUpdated?: (tools: ToolDefinition[]) => void;
}

export function AssistantActionProvider({
  children,
  onToolsUpdated,
}: AssistantActionProviderProps) {
  const [actions] = useState(() => new Map<string, AssistantAction>());
  const [toolCallStates] = useState(() => new Map<string, ToolCallState>());
  const [, forceUpdate] = useState({});

  const registerAction = useCallback(
    (action: AssistantAction) => {
      const existingAction = actions.get(action.name);

      // Check if this is actually a new or changed action
      const hasChanged =
        !existingAction ||
        existingAction.description !== action.description ||
        JSON.stringify(existingAction.parameters) !== JSON.stringify(action.parameters) ||
        existingAction.available !== action.available;

      // Always update the action to get latest handler/render
      actions.set(action.name, action);

      // Only trigger updates if something actually changed
      if (hasChanged) {
        forceUpdate({});

        // Notify chat UI of updated tools
        if (onToolsUpdated) {
          const tools = Array.from(actions.values())
            .filter((a) => a.available !== 'disabled')
            .map((a) => ({
              name: a.name,
              description: a.description,
              parameters: a.parameters,
            }));
          onToolsUpdated(tools);
        }
      }
    },
    [actions, onToolsUpdated]
  );

  const unregisterAction = useCallback(
    (name: string) => {
      // Only update if the action actually exists
      if (actions.has(name)) {
        actions.delete(name);
        forceUpdate({});

        // Notify chat UI of updated tools
        if (onToolsUpdated) {
          const tools = Array.from(actions.values())
            .filter((a) => a.available !== 'disabled')
            .map((a) => ({
              name: a.name,
              description: a.description,
              parameters: a.parameters,
            }));
          onToolsUpdated(tools);
        }
      }
    },
    [actions, onToolsUpdated]
  );

  const executeAction = useCallback(
    async (name: string, args: any) => {
      const action = actions.get(name);
      if (!action) {
        throw new Error(`Action ${name} not found`);
      }
      if (!action.handler) {
        throw new Error(`Action ${name} has no handler`);
      }
      return action.handler(args);
    },
    [actions]
  );

  const updateToolCallState = useCallback(
    (id: string, state: Partial<ToolCallState>) => {
      const existing = toolCallStates.get(id) || {
        id,
        name: '',
        status: 'pending' as ToolStatus,
        timestamp: Date.now(),
      };
      toolCallStates.set(id, {
        ...existing,
        ...state,
      });
      forceUpdate({});
    },
    [toolCallStates]
  );

  const getActionRenderer = useCallback(
    (name: string) => {
      const action = actions.get(name);
      return action?.render;
    },
    [actions]
  );

  const getToolDefinitions = useCallback(() => {
    return Array.from(actions.values())
      .filter((action) => action.available !== 'disabled')
      .map((action) => ({
        name: action.name,
        description: action.description,
        parameters: action.parameters,
      }));
  }, [actions]);

  return (
    <AssistantActionContext.Provider
      value={{
        actions,
        toolCallStates,
        registerAction,
        unregisterAction,
        executeAction,
        getToolDefinitions,
        updateToolCallState,
        getActionRenderer,
      }}
    >
      {children}
    </AssistantActionContext.Provider>
  );
}
