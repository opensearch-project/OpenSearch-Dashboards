/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useCallback } from 'react';
import { StaticContext } from '../../../context_provider/public';
import { ContextService } from '../services/context_service';

/**
 * React hook for accessing context provider functionality
 */
export function useContextProvider(contextService: ContextService) {
  const [currentContext, setCurrentContext] = useState<StaticContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to context changes
  useEffect(() => {
    const subscription = contextService.getContext$().subscribe((context) => {
      setCurrentContext(context);
    });

    // Initial context fetch
    fetchCurrentContext();

    return () => subscription.unsubscribe();
  }, [contextService, fetchCurrentContext]);

  const fetchCurrentContext = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const context = await contextService.getCurrentContext();
      setCurrentContext(context);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch context');
    } finally {
      setIsLoading(false);
    }
  }, [contextService]);

  const refreshContext = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const context = await contextService.refreshCurrentContext();
      setCurrentContext(context);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh context');
    } finally {
      setIsLoading(false);
    }
  }, [contextService]);

  const executeAction = useCallback(
    async (actionType: string, params: any) => {
      try {
        setError(null);
        return await contextService.executeAction(actionType, params);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to execute action';
        setError(errorMessage);
        throw err;
      }
    },
    [contextService]
  );

  const getAvailableActions = useCallback(() => {
    return contextService.getAvailableActions();
  }, [contextService]);

  return {
    currentContext,
    isLoading,
    error,
    fetchCurrentContext,
    refreshContext,
    executeAction,
    getAvailableActions,
  };
}
