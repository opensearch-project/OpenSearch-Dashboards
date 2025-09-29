/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useMemo } from 'react';
import { AssistantContextOptions, AssistantContextStore } from '../types';

/**
 * Deep comparison utility for context options
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}

/**
 * Base hook for registering context with the assistant context store.
 * This hook automatically handles registration/cleanup lifecycle.
 *
 * @param options - Context options to register
 * @returns Context ID for the registered context
 */
export function useDynamicContext(options: AssistantContextOptions | null): string {
  const previousOptionsRef = useRef<AssistantContextOptions | null>(null);

  useEffect(() => {
    // Check if options have actually changed using deep comparison
    if (deepEqual(options, previousOptionsRef.current)) {
      return; // No change, skip re-registration
    }

    // Update the reference
    previousOptionsRef.current = options;

    // Handle null options (no context to register)
    if (!options) {
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

    // Register the context (store handles replacement automatically)
    contextStore.addContext(options);

    // No cleanup needed - store handles context replacement automatically
  }, [options]);

  return 'context';
}
