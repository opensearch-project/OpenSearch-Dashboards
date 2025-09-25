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
export function useAssistantContext(options: AssistantContextOptions): string {
  const [contextId, setContextId] = useState<string | null>(null);

  useEffect(() => {
    // Get the global assistant context store
    const contextStore = (window as any).assistantContextStore as AssistantContextStore;
    
    if (!contextStore) {
      console.warn('Assistant context store not available. Make sure context provider is initialized.');
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
    options.description,
    JSON.stringify(options.value), // Deep comparison for value changes
    options.label,
    JSON.stringify(options.categories),
  ]);

  return contextId || '';
}
