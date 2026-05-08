/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useCallback } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../types';
import { SavedAgentTraces } from '../../../types/saved_agent_traces_types';
/**
 * Hook for loading saved agent traces objects
 */
export const useSavedAgentTraces = (agentTracesIdFromUrl?: string) => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const [savedAgentTracesState, setSavedAgentTracesState] = useState<SavedAgentTraces | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toastNotifications, getSavedAgentTracesById } = services;

  const loadSavedAgentTraces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load saved agent traces object
      const savedAgentTracesObject = await getSavedAgentTracesById(agentTracesIdFromUrl);
      setSavedAgentTracesState(savedAgentTracesObject);
    } catch (loadError) {
      const errorMessage = `Failed to load saved agent traces: ${(loadError as Error).message}`;
      setError(errorMessage);

      toastNotifications.addError(loadError as Error, {
        title: 'Error loading saved agent traces',
        toastMessage: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [agentTracesIdFromUrl, getSavedAgentTracesById, toastNotifications]);

  useEffect(() => {
    loadSavedAgentTraces();
  }, [loadSavedAgentTraces]);

  return {
    savedAgentTraces: savedAgentTracesState,
    isLoading,
    error,
    reload: loadSavedAgentTraces,
  };
};
