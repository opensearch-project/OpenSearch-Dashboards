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
    // Subscribe to service updates to trigger re-renders
    const unsubscribe = service.addListener(() => {
      forceUpdate({});
    });

    return () => {
      unsubscribe();
    };
  }, [service]);

  useEffect(() => {
    if (onToolsUpdated) {
      // Add callback to service for tools updates
      const unsubscribe = service.addToolsUpdatedCallback(onToolsUpdated);

      // Immediately notify with current tools
      onToolsUpdated(service.getToolDefinitions());

      return () => {
        unsubscribe();
      };
    }
  }, [onToolsUpdated, service]);

  return (
    <AssistantActionContext.Provider value={service.getContextValue()}>
      {children}
    </AssistantActionContext.Provider>
  );
}
