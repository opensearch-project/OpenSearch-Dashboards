/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AssistantContextOptions, AssistantContextStore } from '../types';

/**
 * Base hook for registering context with the assistant context store.
 * This hook automatically handles registration/cleanup lifecycle.
 *
 * @param options - Context options to register
 * @returns Context ID for the registered context
 */
export function useAssistantContext(options: AssistantContextOptions | null): string {
  const [contextId, setContextId] = useState<string | null>(null);

  useEffect(() => {
    // Handle null options (no context to register)
    if (!options) {
      if (contextId) {
        // Clean up existing context if options become null
        const contextStore = (window as any).assistantContextStore as AssistantContextStore;
        if (contextStore) {
          contextStore.removeContext(contextId);
        }
        setContextId(null);
      }
      return;
    }

    // Get the global assistant context store
    const contextStore = (window as any).assistantContextStore as AssistantContextStore;

    if (!contextStore) {
      // eslint-disable-next-line no-console
      console.warn(
        'Assistant context store not available. Make sure context provider is initialized.'
      );
      return;
    }

    // Register the context
    const id = contextStore.addContext(options);
    setContextId(id);

    // Cleanup on unmount
    return () => {
      contextStore.removeContext(id);
    };
  }, [
    contextId,
    options,
    options?.description,
    options?.value,
    options?.label,
    options?.categories,
  ]);

  return contextId || '';
}
