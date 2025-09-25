/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useAssistantContext } from './use_assistant_context';

/**
 * Options for useDynamicContext hook
 */
export interface UseDynamicContextOptions<T> {
  description: string;
  value: T;
  label?: string;
  categories?: string[];
  enabled?: boolean;
}

/**
 * Hook for registering dynamic context based on React state.
 * Similar to CopilotKit's useCopilotReadable hook.
 * 
 * This hook automatically tracks changes to React state and updates
 * the assistant context accordingly.
 * 
 * @example
 * ```typescript
 * const [selectedItems, setSelectedItems] = useState([]);
 * const selectionContextId = useDynamicContext({
 *   description: "Currently selected items",
 *   value: selectedItems,
 *   label: `${selectedItems.length} items selected`,
 *   categories: ['selection', 'ui-state']
 * });
 * ```
 * 
 * @example
 * ```typescript
 * const [filters, setFilters] = useState({ status: 'active' });
 * const filterContextId = useDynamicContext({
 *   description: "Current filter state",
 *   value: filters,
 *   categories: ['filters', 'state']
 * });
 * ```
 * 
 * @param options - Configuration for the dynamic context
 * @returns Context ID for the registered context
 */
export function useDynamicContext<T>(options: UseDynamicContextOptions<T>): string {
  // Prepare context options with memoization for performance
  const contextOptions = useMemo(() => {
    if (options.enabled === false) {
      return {
        description: 'Disabled dynamic context',
        value: null,
        label: 'Disabled',
        categories: ['disabled'],
      };
    }

    return {
      description: options.description,
      value: options.value,
      label: options.label || options.description,
      categories: options.categories || ['dynamic', 'state'],
    };
  }, [
    options.description,
    JSON.stringify(options.value), // Deep comparison for React state changes
    options.label,
    JSON.stringify(options.categories),
    options.enabled,
  ]);

  return useAssistantContext(contextOptions);
}

/**
 * Convenience hook for simple string-based dynamic context
 */
export function useStringContext(description: string, value: string, categories?: string[]): string {
  return useDynamicContext({
    description,
    value,
    categories,
  });
}

/**
 * Convenience hook for object-based dynamic context
 */
export function useObjectContext<T extends Record<string, any>>(
  description: string,
  value: T,
  categories?: string[]
): string {
  return useDynamicContext({
    description,
    value,
    categories,
  });
}

/**
 * Convenience hook for array-based dynamic context
 */
export function useArrayContext<T>(
  description: string,
  value: T[],
  categories?: string[]
): string {
  return useDynamicContext({
    description,
    value,
    label: `${description} (${value.length} items)`,
    categories,
  });
}