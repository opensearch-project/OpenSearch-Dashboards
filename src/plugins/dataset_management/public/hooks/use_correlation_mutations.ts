/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { SavedObjectsClientContract } from '../../../../core/public';
import { CorrelationsClient } from '../services/correlations_client';
import {
  CorrelationSavedObject,
  CreateCorrelationData,
  UpdateCorrelationData,
} from '../types/correlations';

interface MutationResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseCreateCorrelationResult extends MutationResult<CorrelationSavedObject> {
  createCorrelation: (data: CreateCorrelationData) => Promise<CorrelationSavedObject | null>;
}

/**
 * Hook to create a new correlation
 */
export function useCreateCorrelation(
  savedObjectsClient: SavedObjectsClientContract
): UseCreateCorrelationResult {
  const [data, setData] = useState<CorrelationSavedObject | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const createCorrelation = useCallback(
    async (correlationData: CreateCorrelationData): Promise<CorrelationSavedObject | null> => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const client = new CorrelationsClient(savedObjectsClient);
        const result = await client.create(correlationData);
        setData(result);
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to create correlation');
        setError(errorObj);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [savedObjectsClient]
  );

  return {
    createCorrelation,
    data,
    loading,
    error,
  };
}

interface UseUpdateCorrelationResult extends MutationResult<CorrelationSavedObject> {
  updateCorrelation: (data: UpdateCorrelationData) => Promise<CorrelationSavedObject | null>;
}

/**
 * Hook to update an existing correlation
 */
export function useUpdateCorrelation(
  savedObjectsClient: SavedObjectsClientContract
): UseUpdateCorrelationResult {
  const [data, setData] = useState<CorrelationSavedObject | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const updateCorrelation = useCallback(
    async (correlationData: UpdateCorrelationData): Promise<CorrelationSavedObject | null> => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const client = new CorrelationsClient(savedObjectsClient);
        const result = await client.update(correlationData);
        setData(result);
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to update correlation');
        setError(errorObj);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [savedObjectsClient]
  );

  return {
    updateCorrelation,
    data,
    loading,
    error,
  };
}

interface UseDeleteCorrelationResult {
  deleteCorrelation: (id: string) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to delete a correlation
 */
export function useDeleteCorrelation(
  savedObjectsClient: SavedObjectsClientContract
): UseDeleteCorrelationResult {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteCorrelation = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const client = new CorrelationsClient(savedObjectsClient);
        await client.delete(id);
        return true;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to delete correlation');
        setError(errorObj);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [savedObjectsClient]
  );

  return {
    deleteCorrelation,
    loading,
    error,
  };
}
