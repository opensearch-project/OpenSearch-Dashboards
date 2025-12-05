/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { AssistantActionContext } from '../contexts/assistant_action_context';
import { AssistantActionService, ToolDefinition } from '../services/assistant_action_service';

interface GlobalAssistantProviderProps {
  children: ReactNode;
  onToolsUpdated?: (tools: ToolDefinition[]) => void;
}

/**
 * Global provider that wraps the entire application and uses the singleton service
 */
export function GlobalAssistantProvider({
  children,
  onToolsUpdated,
}: GlobalAssistantProviderProps) {
  const [service] = useState(() => AssistantActionService.getInstance());
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Subscribe to service state updates to trigger re-renders
    const subscription = service.getState$().subscribe(() => {
      forceUpdate({});
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [service]);

  useEffect(() => {
    if (onToolsUpdated) {
      // Subscribe to state changes and call onToolsUpdated when tools change
      const subscription = service.getState$().subscribe((state) => {
        onToolsUpdated(state.toolDefinitions);
      });

      // Immediately notify with current tools
      onToolsUpdated(service.getToolDefinitions());

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [onToolsUpdated, service]);

  // Create context value from service methods
  const contextValue = {
    actions: service.getCurrentState().actions,
    toolCallStates: service.getCurrentState().toolCallStates,
    registerAction: service.registerAction,
    unregisterAction: service.unregisterAction,
    executeAction: async (name: string, args: any) => {
      // This would need to be implemented if needed
      throw new Error('executeAction not implemented in GlobalAssistantProvider');
    },
    getToolDefinitions: service.getToolDefinitions,
    updateToolCallState: service.updateToolCallState,
    getActionRenderer: service.getActionRenderer,
  };

  return (
    <AssistantActionContext.Provider value={contextValue}>
      {children}
    </AssistantActionContext.Provider>
  );
}
