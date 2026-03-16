/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import deepEqual from 'fast-deep-equal';
import { AssistantContextOptions, AssistantContextStore } from '../types';

/**
 * Base hook for registering context with the assistant context store.
 * This hook automatically handles registration/cleanup lifecycle.
 *
 * @param options - Context options to register
 * @param shouldCleanupOnUnmount - Whether to automatically cleanup context when component unmounts (default: true)
 * @returns Context ID for the registered context
 */
export function useDynamicContext(
  options: AssistantContextOptions | null,
  shouldCleanupOnUnmount: boolean = true
): string {
  const previousOptionsRef = useRef<AssistantContextOptions | null>(null);
  const contextIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Check if options have actually changed using deep comparison
    if (deepEqual(options, previousOptionsRef.current)) {
      return; // No change, skip re-registration
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

    // If we had a previous context with an ID, remove it
    if (previousOptionsRef.current?.id && contextStore.removeContextById) {
      contextStore.removeContextById(previousOptionsRef.current.id);
    }

    // Update the reference
    previousOptionsRef.current = options;

    // Handle null options (remove context)
    if (!options) {
      contextIdRef.current = null;
      return;
    }

    // Store the context ID for cleanup
    contextIdRef.current = options.id || null;

    // Register the context (store handles replacement automatically)
    contextStore.addContext(options);
  }, [options]);

  // Cleanup on unmount (only if shouldCleanupOnUnmount is true)
  useEffect(() => {
    if (!shouldCleanupOnUnmount) {
      return; // No cleanup function returned
    }

    return () => {
      const contextStore = (window as any).assistantContextStore as AssistantContextStore;
      if (contextStore && contextIdRef.current && contextStore.removeContextById) {
        contextStore.removeContextById(contextIdRef.current);
      }
    };
  }, [shouldCleanupOnUnmount]);

  return contextIdRef.current || 'context';
}
