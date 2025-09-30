/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, ReactNode } from 'react';
import { AssistantActionService } from '../services/assistant_action_service';

export type ToolStatus = 'pending' | 'executing' | 'complete' | 'failed';

export interface RenderProps<T = any> {
  status: ToolStatus;
  args?: T;
  result?: any;
  error?: Error;
}

export interface AssistantAction<T = any> {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  handler?: (args: T) => Promise<any>;
  render?: (props: RenderProps<T>) => ReactNode;
  available?: 'enabled' | 'disabled'; // 'disabled' for render-only actions
  enabled?: boolean;
  deps?: any[];
}

export function useAssistantAction<T = any>(action: AssistantAction<T>) {
  const service = AssistantActionService.getInstance();
  const actionRef = useRef<AssistantAction<T>>();

  useEffect(() => {
    // Only register if enabled and the action reference has changed
    if (action.enabled !== false) {
      // Store the current action in ref for cleanup
      actionRef.current = action;
      service.registerAction(action);

      return () => {
        // Only unregister on actual unmount, not on every render
        service.unregisterAction(action.name);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Only depend on stable values that should trigger re-registration
    action.name,
    action.enabled,
    // Use JSON.stringify for parameters to check structural changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(action.parameters),
    service,
  ]);

  // Update the action ref with latest handler/render without re-registering
  useEffect(() => {
    if (actionRef.current) {
      actionRef.current.handler = action.handler;
      actionRef.current.render = action.render;
    }
  }, [action.handler, action.render]);
}
