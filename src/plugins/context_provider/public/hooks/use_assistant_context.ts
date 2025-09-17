/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { AssistantContextOptions } from '../types';

/**
 * Hook for registering context with the assistant
 *
 * @example
 * ```tsx
 * useAssistantContext({
 *   description: "Currently expanded document details",
 *   value: expandedDocument,
 *   label: `Document ${expandedDocument.id}`,
 *   categories: ['chat', 'explore']
 * });
 * ```
 */
export function useAssistantContext(options: AssistantContextOptions | null) {
  const contextIdRef = useRef<string | null>(null);
  const optionsRef = useRef<AssistantContextOptions | null>(null);

  useEffect(() => {
    // Get context store from window (will be set by context provider)
    const contextStore = (window as any).assistantContextStore;

    if (!contextStore) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Assistant context store not available');
      return;
    }

    // Remove previous context if options changed
    if (contextIdRef.current && optionsRef.current !== options) {
      contextStore.removeContext(contextIdRef.current);
      contextIdRef.current = null;
    }

    // Add new context if provided
    if (options) {
      contextIdRef.current = contextStore.addContext(options);
      optionsRef.current = options;
    }

    // Cleanup on unmount or when options become null
    return () => {
      if (contextIdRef.current) {
        contextStore.removeContext(contextIdRef.current);
        contextIdRef.current = null;
      }
    };
  }, [options]);
}

/**
 * Higher-level hook for managing multiple contexts
 *
 * @example
 * ```tsx
 * const { addContext, removeContext } = useAssistantContexts();
 *
 * useEffect(() => {
 *   const id = addContext({
 *     description: "Selected table cells",
 *     value: selectedCells,
 *     label: `${selectedCells.length} cells selected`,
 *     categories: ['chat', 'table']
 *   });
 *
 *   return () => removeContext(id);
 * }, [selectedCells]);
 * ```
 */
export function useAssistantContexts() {
  const contextIdsRef = useRef<Set<string>>(new Set());

  const addContext = (options: AssistantContextOptions): string => {
    const contextStore = (window as any).assistantContextStore;

    if (!contextStore) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Assistant context store not available');
      return '';
    }

    const id = contextStore.addContext(options);
    contextIdsRef.current.add(id);
    return id;
  };

  const removeContext = (id: string): void => {
    const contextStore = (window as any).assistantContextStore;

    if (!contextStore) return;

    contextStore.removeContext(id);
    contextIdsRef.current.delete(id);
  };

  // Cleanup all contexts on unmount
  useEffect(() => {
    // Snapshot the current IDs so the cleanup uses the same list even if the ref changes later
    const ids = Array.from(contextIdsRef.current);
    return () => {
      const contextStore = (window as any).assistantContextStore;
      if (contextStore) {
        ids.forEach((id) => {
          contextStore.removeContext(id);
        });
      }
    };
  }, []);

  return { addContext, removeContext };
}
