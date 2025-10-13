/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { FieldStatsTable } from './field_stats_table';
import { FieldStatsItem, FieldDetailsMap } from './field_stats_types';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { getFieldStatsQuery, executeFieldStatsQuery } from './field_stats_queries';
import {
  filterDatasetFields,
  transformFieldStatsResult,
  createRowExpandHandler,
} from './field_stats_utils';

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

  // Fetch top-level field row statistics
  useEffect(() => {
    if (!fields.length || !dataset) return;

    const fetchAllFieldStats = async () => {
      setIsLoading(true);

      try {
        // Fetch stats for each field in parallel
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
                stats: transformFieldStatsResult(field.name, field.type, result),
              };
            } catch (error) {
              // TODO: put in a UI error state that covers the field row or extended row panel
              return {
                name: field.name,
                stats: {
                  name: field.name,
                  type: field.type,
                  docCount: 0,
                  distinctCount: 0,
                  docPercentage: 0,
                  error: true,
                },
              };
            }
          })
        );

        // Collect all results into a single object
        const allFieldStats: Record<string, FieldStatsItem> = {};
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            allFieldStats[result.value.name] = result.value.stats;
          }
        });

        // Update state once with all field statistics
        setFieldStats(allFieldStats);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllFieldStats();
  }, [fields, dataset, services]);

  // Create row expansion handler
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
