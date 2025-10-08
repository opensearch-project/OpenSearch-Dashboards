/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { FieldStatsTable } from './field_stats_table';
import { FieldStatsItem } from './field_stats_types';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { getFieldStatsQuery, executeFieldStatsQuery } from './field_stats_queries';

export const FieldStatsContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { dataset } = useDatasetContext();
  const [fieldStats, setFieldStats] = useState<Record<string, FieldStatsItem>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [fieldDetails, setFieldDetails] = useState<Record<string, any>>({});
  const [detailsLoading, setDetailsLoading] = useState<Set<string>>(new Set());

  const fields = useMemo(() => {
    if (!dataset || !dataset.fields) return [];

    // Get the list of meta fields from the dataset configuration
    const metaFieldsSet = new Set(dataset.metaFields || []);

    return dataset.fields.getAll().filter((field) => {
      // Filter out meta/internal fields that are in the metaFields configuration
      // This programmatically identifies system fields based on DataView settings
      if (metaFieldsSet.has(field.name)) {
        return false;
      }

      // Filter out multi-fields (like .keyword) using OpenSearch metadata
      if (field.subType?.multi?.parent) {
        return false;
      }

      // Filter out scripted fields
      if (field.scripted) {
        return false;
      }

      return true;
    });
  }, [dataset]);

  // Fetch real field statistics
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

              // Extract results from response
              // PPL stats queries return results in hits.hits[0]._source
              const hits = result?.hits?.hits || [];
              const firstHit = hits[0]?._source || {};

              return {
                name: field.name,
                stats: {
                  name: field.name,
                  type: field.type,
                  docCount: firstHit.count || 0,
                  distinctCount: firstHit.dc || 0,
                  docPercentage: firstHit.percentage_total || 0,
                },
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

  // Handle row expansion
  const handleRowExpand = async (fieldName: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(fieldName)) {
      newExpanded.delete(fieldName);
    } else {
      newExpanded.add(fieldName);
      // Add mock detail data for Phase 1 (will be replaced with real data in Phase 4)
      if (!fieldDetails[fieldName]) {
        setFieldDetails((prev) => ({
          ...prev,
          [fieldName]: { mocked: true },
        }));
      }
    }
    setExpandedRows(newExpanded);
  };

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
