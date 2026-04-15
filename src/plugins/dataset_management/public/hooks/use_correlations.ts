/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { SavedObjectsClientContract } from '../../../../core/public';
import { CORRELATION_TYPE_PREFIXES } from '../../../data/common';
import { CorrelationsClient } from '../services/correlations_client';
import { CorrelationSavedObject, FindCorrelationsOptions } from '../types/correlations';

interface UseCorrelationsResult {
  correlations: CorrelationSavedObject[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch correlations with optional filtering
 */
export function useCorrelations(
  savedObjectsClient: SavedObjectsClientContract,
  options: FindCorrelationsOptions = {}
): UseCorrelationsResult {
  const [correlations, setCorrelations] = useState<CorrelationSavedObject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const client = new CorrelationsClient(savedObjectsClient);

  const fetchCorrelations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await client.find(options);

      // Client-side filtering: only include correlations where datasetId appears in references
      // AND correlationType starts with trace-to-logs prefix
      const filtered = options.datasetId
        ? results.filter(
            (correlation) =>
              correlation.attributes.correlationType.startsWith(
                CORRELATION_TYPE_PREFIXES.TRACE_TO_LOGS
              ) && correlation.references.some((ref) => ref.id === options.datasetId)
          )
        : results.filter((correlation) =>
            correlation.attributes.correlationType.startsWith(
              CORRELATION_TYPE_PREFIXES.TRACE_TO_LOGS
            )
          );

      setCorrelations(filtered);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch correlations'));
    } finally {
      setLoading(false);
    }
  }, [options.datasetId, options.page, options.perPage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCorrelations();
  }, [fetchCorrelations]);

  return {
    correlations,
    loading,
    error,
    refetch: fetchCorrelations,
  };
}

interface UseCorrelationCountResult {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to get the count of correlations for a dataset (for tab badge)
 */
export function useCorrelationCount(
  savedObjectsClient: SavedObjectsClientContract,
  datasetId?: string
): UseCorrelationCountResult {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCount = useCallback(async () => {
    if (!datasetId) {
      setCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new CorrelationsClient(savedObjectsClient);
      const correlations = await client.find({ datasetId, perPage: 1000 });

      // Client-side filtering: only count trace-to-logs correlations where datasetId appears in references
      const filtered = correlations.filter(
        (correlation) =>
          correlation.attributes.correlationType.startsWith(
            CORRELATION_TYPE_PREFIXES.TRACE_TO_LOGS
          ) && correlation.references.some((ref) => ref.id === datasetId)
      );

      setCount(filtered.length);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch correlation count'));
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [savedObjectsClient, datasetId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, error, refetch: fetchCount };
}

interface UseSingleCorrelationResult {
  correlation: CorrelationSavedObject | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch a single correlation by ID
 */
export function useSingleCorrelation(
  savedObjectsClient: SavedObjectsClientContract,
  correlationId?: string
): UseSingleCorrelationResult {
  const [correlation, setCorrelation] = useState<CorrelationSavedObject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!correlationId) {
      setCorrelation(null);
      setLoading(false);
      return;
    }

    const fetchCorrelation = async () => {
      setLoading(true);
      setError(null);

      try {
        const client = new CorrelationsClient(savedObjectsClient);
        const result = await client.get(correlationId);
        setCorrelation(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch correlation'));
        setCorrelation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCorrelation();
  }, [savedObjectsClient, correlationId]);

  return { correlation, loading, error };
}
