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
  datasets: DataView[]; // Return the fetched datasets so they can be reused
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to validate field mappings for selected log datasets
 * Fetches datasets and checks if they have required schemaMappings.otelLogs fields
 */
export function useValidateFieldMappings(
  logDatasetIds: string[],
  dataService: DataPublicPluginStart,
  validationKey?: number
): UseValidateFieldMappingsResult {
  const [validationResult, setValidationResult] = useState<CorrelationValidationResult | null>(
    null
  );
  const [datasets, setDatasets] = useState<DataView[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (logDatasetIds.length === 0) {
      setValidationResult({ isValid: true, errors: [] });
      setDatasets([]);
      setLoading(false);
      return;
    }

    const validateDatasets = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedDatasets: DataView[] = [];

        // Fetch each dataset with schemaMappings from saved object
        for (const datasetId of logDatasetIds) {
          try {
            // Fetch DataView for fields and structure
            const dataset = await dataService.dataViews.get(datasetId);

            // IMPORTANT: Fetch saved object directly to ensure we get schemaMappings
            // dataViews.get() may return cached version without complete attributes
            try {
              // @ts-expect-error TS2339 TODO(ts-error): fixme
              const savedObject = await dataService.indexPatterns.savedObjectsClient.get(
                'index-pattern',
                datasetId
              );
              const attributes = savedObject.attributes as any;

              // Ensure schemaMappings is populated on the DataView
              if (attributes.schemaMappings) {
                // Parse if it's a string, otherwise use as-is
                dataset.schemaMappings =
                  typeof attributes.schemaMappings === 'string'
                    ? JSON.parse(attributes.schemaMappings)
                    : attributes.schemaMappings;
              }
            } catch (soErr) {
              // eslint-disable-next-line no-console
              console.error(`Failed to fetch saved object for dataset ${datasetId}:`, soErr);
            }

            fetchedDatasets.push(dataset);
          } catch (err) {
            // If dataset not found or error, skip it but log
            // eslint-disable-next-line no-console
            console.error(`Failed to fetch dataset ${datasetId}:`, err);
          }
        }

        // Validate field mappings
        const result = validateFieldMappings(fetchedDatasets);
        setValidationResult(result);
        setDatasets(fetchedDatasets);
      } catch (err) {
        const errorObj =
          err instanceof Error ? err : new Error('Failed to validate field mappings');
        setError(errorObj);
        setValidationResult(null);
        setDatasets([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce validation to prevent excessive API calls when datasets are added rapidly
    const timeoutId = setTimeout(() => {
      validateDatasets();
    }, 300); // Wait 300ms after last change before validating

    // Cleanup timeout on unmount or when dependencies change
    return () => clearTimeout(timeoutId);
  }, [JSON.stringify(logDatasetIds), dataService, validationKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    validationResult,
    datasets,
    loading,
    error,
  };
}
