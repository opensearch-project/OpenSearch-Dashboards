/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DataPublicPluginStart, DataView } from '../../../data/public';
import { CorrelationValidationResult } from '../types/correlations';
import { validateFieldMappings } from '../utils/correlation_validation';

interface UseValidateFieldMappingsResult {
  validationResult: CorrelationValidationResult | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to validate field mappings for selected log datasets
 * Fetches datasets and checks if they have required schemaMappings.otelLogs fields
 */
export function useValidateFieldMappings(
  logDatasetIds: string[],
  dataService: DataPublicPluginStart
): UseValidateFieldMappingsResult {
  const [validationResult, setValidationResult] = useState<CorrelationValidationResult | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (logDatasetIds.length === 0) {
      setValidationResult({ isValid: true, errors: [] });
      setLoading(false);
      return;
    }

    const validateDatasets = async () => {
      setLoading(true);
      setError(null);

      try {
        const datasets: DataView[] = [];

        // Fetch each dataset
        for (const datasetId of logDatasetIds) {
          try {
            const dataset = await dataService.dataViews.get(datasetId);
            datasets.push(dataset);
          } catch (err) {
            // If dataset not found or error, skip it but log
            // eslint-disable-next-line no-console
            console.warn(`Failed to fetch dataset ${datasetId}:`, err);
          }
        }

        // Validate field mappings
        const result = validateFieldMappings(datasets);
        setValidationResult(result);
      } catch (err) {
        const errorObj =
          err instanceof Error ? err : new Error('Failed to validate field mappings');
        setError(errorObj);
        setValidationResult(null);
      } finally {
        setLoading(false);
      }
    };

    validateDatasets();
  }, [JSON.stringify(logDatasetIds), dataService]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    validationResult,
    loading,
    error,
  };
}
