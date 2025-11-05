/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { FieldStatsTable } from './field_stats_table';
import { FieldStatsItem, FieldDetailsMap } from './utils/field_stats_types';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import {
  getTotalDocCountQuery,
  getFieldStatsQuery,
  executeFieldStatsQuery,
} from './field_stats_queries';
import {
  filterDatasetFields,
  transformFieldStatsResult,
  createRowExpandHandler,
} from './utils/field_stats_utils';

/**
 * Container component for the Field Statistics feature.
 * Manages the state and data fetching for field statistics display.
 *
 * Features:
 * - Fetches basic statistics for all fields in the current dataset
 * - Handles row expansion to show detailed field statistics
 * - Uses the detail sections registry to dynamically fetch and display field details
 */
export const FieldStatsContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { dataset } = useDatasetContext();
  const [fieldStats, setFieldStats] = useState<Record<string, FieldStatsItem>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [fieldDetails, setFieldDetails] = useState<FieldDetailsMap>({});
  const [detailsLoading, setDetailsLoading] = useState<Set<string>>(new Set());

  const fields = useMemo(() => {
    if (!dataset) return [];
    return filterDatasetFields(dataset);
  }, [dataset]);

  useEffect(() => {
    if (!fields.length || !dataset) return;

    const fetchAllFieldStats = async () => {
      setIsLoading(true);

      try {
        // Step 1: fetch total document count
        const totalDocCount = await (async () => {
          try {
            const totalCountQuery = getTotalDocCountQuery(dataset.title);
            const totalCountResult = await executeFieldStatsQuery(
              services,
              totalCountQuery,
              dataset.id || '',
              dataset.type
            );
            const totalHits = totalCountResult?.hits?.hits || [];
            const totalFirstHit = totalHits[0]?._source || {};
            return totalFirstHit.total_count || 0;
          } catch (error) {
            return undefined;
          }
        })();

        // Step 2: fetch field stats per row
        const results = await Promise.allSettled(
          fields.map(async (field) => {
            try {
              const query = getFieldStatsQuery(dataset.title, field.name);
              const result = await executeFieldStatsQuery(
                services,
                query,
                dataset.id || '',
                dataset.type
              );

              return {
                name: field.name,
                stats: transformFieldStatsResult(field.name, field.type, result, totalDocCount),
              };
            } catch (error) {
              const errorMessage = error?.body?.message || String(error);
              return {
                name: field.name,
                stats: {
                  name: field.name,
                  type: field.type,
                  docCount: 0,
                  distinctCount: 0,
                  docPercentage: undefined,
                  errorMessage,
                },
              };
            }
          })
        );

        const allFieldStats: Record<string, FieldStatsItem> = {};
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            allFieldStats[result.value.name] = result.value.stats;
          }
        });

        setFieldStats(allFieldStats);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllFieldStats();
  }, [fields, dataset, services]);

  const handleRowExpand = createRowExpandHandler(
    expandedRows,
    setExpandedRows,
    fieldStats,
    fieldDetails,
    setFieldDetails,
    detailsLoading,
    setDetailsLoading,
    dataset,
    services
  );

  const sortedFieldStats = useMemo(() => {
    return Object.values(fieldStats).sort((a, b) => a.name.localeCompare(b.name));
  }, [fieldStats]);

  if (!dataset) {
    return (
      <div>
        {i18n.translate('explore.fieldStats.container.noDatasetSelected', {
          defaultMessage: 'No dataset selected',
        })}
      </div>
    );
  }

  return (
    <FieldStatsTable
      items={sortedFieldStats}
      expandedRows={expandedRows}
      fieldDetails={fieldDetails}
      onRowExpand={handleRowExpand}
      isLoading={isLoading}
      detailsLoading={detailsLoading}
    />
  );
};
