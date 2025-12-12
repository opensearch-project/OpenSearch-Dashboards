/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef } from 'react';
import { i18n } from '@osd/i18n';
import { DataStructure } from '../../../../../../common';
import { IDataPluginServices } from '../../../../../types';

interface ResolveIndexResponse {
  indices?: Array<{ name: string; attributes?: string[] }>;
  aliases?: Array<{ name: string }>;
  data_streams?: Array<{ name: string }>;
}

interface UseIndexFetcherOptions {
  services?: IDataPluginServices;
  path?: DataStructure[];
  onError?: (error: any, pattern: string) => void;
}

interface FetchIndicesOptions {
  patterns: string[];
  limit?: number;
}

export const useIndexFetcher = ({ services, path, onError }: UseIndexFetcherOptions) => {
  const requestIdRef = useRef<number>(0);

  /**
   * Fetches indices matching the given patterns
   * @param patterns - Array of index patterns to search for
   * @param limit - Optional limit on number of results to return
   * @returns Array of matching index names
   */
  const fetchIndices = useCallback(
    async ({ patterns, limit }: FetchIndicesOptions): Promise<string[]> => {
      if (!services?.http || !patterns.length) {
        return [];
      }

      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;

      try {
        const dataSourceId = path?.find((item) => item.type === 'DATA_SOURCE')?.id;
        const query: any = {
          expand_wildcards: 'all',
        };

        if (dataSourceId && dataSourceId !== '') {
          query.data_source = dataSourceId;
        }

        // Fetch matches for all patterns in parallel
        const allResponses = await Promise.all(
          patterns.map((p) =>
            services.http
              .get<ResolveIndexResponse>(
                `/internal/index-pattern-management/resolve_index/${encodeURIComponent(p)}`,
                { query }
              )
              .catch((err) => {
                // Log individual pattern failures for debugging
                // eslint-disable-next-line no-console
                console.error(`Failed to fetch indices for pattern "${p}":`, err?.message || err);
                return null;
              })
          )
        );

        if (currentRequestId !== requestIdRef.current) {
          return [];
        }

        // Combine all results into a single set (to avoid duplicates)
        const allIndices = new Set<string>();

        allResponses.forEach((response) => {
          if (!response) return;

          if (response.indices) {
            response.indices.forEach((idx) => {
              allIndices.add(idx.name);
            });
          }

          if (response.aliases) {
            response.aliases.forEach((alias) => {
              allIndices.add(alias.name);
            });
          }

          if (response.data_streams) {
            response.data_streams.forEach((dataStream) => {
              allIndices.add(dataStream.name);
            });
          }
        });

        const sortedIndices = Array.from(allIndices).sort();

        if (limit && sortedIndices.length > limit) {
          return sortedIndices.slice(0, limit);
        }

        return sortedIndices;
      } catch (error) {
        // Only handle error if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          // Log error for debugging
          // eslint-disable-next-line no-console
          console.error('Failed to fetch indices:', error);

          // Show user-friendly error notification
          if (services?.notifications?.toasts) {
            services.notifications.toasts.addDanger({
              title: i18n.translate('data.datasetService.useIndexFetcher.fetchIndicesError.title', {
                defaultMessage: 'Failed to load indices',
              }),
              text: i18n.translate('data.datasetService.useIndexFetcher.fetchIndicesError.text', {
                defaultMessage: 'Unable to fetch indices matching pattern(s)',
              }),
            });
          }

          // Call custom error handler if provided
          if (onError) {
            onError(error, patterns.join(', '));
          }
        }

        return [];
      }
    },
    [services, path, onError]
  );

  return {
    fetchIndices,
    requestIdRef,
  };
};
