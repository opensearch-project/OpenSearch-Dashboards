/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { FieldStatsTable } from './field_stats_table';
import { FieldStatsItem } from './field_stats_types';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';

export const FieldStatsContainer = () => {
  const { dataset } = useDatasetContext();
  const [fieldStats, setFieldStats] = useState<Record<string, FieldStatsItem>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [fieldDetails, setFieldDetails] = useState<Record<string, any>>({});
  const [detailsLoading, setDetailsLoading] = useState<Set<string>>(new Set());

  const fields = useMemo(() => {
    if (!dataset || !dataset.fields) return [];
    return dataset.fields.getAll();
  }, [dataset]);

  // Simulate loading with mocked data
  useEffect(() => {
    if (!fields.length || !dataset) return;

    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const mockedStats: Record<string, FieldStatsItem> = {};

      fields.forEach((field) => {
        mockedStats[field.name] = {
          name: field.name,
          type: field.type,
          docCount: Math.floor(Math.random() * 10000),
          distinctCount: Math.floor(Math.random() * 1000),
          docPercentage: Math.random() * 100,
        };
      });

      setFieldStats(mockedStats);
      setIsLoading(false);
    }, 2000); // 2 second delay to test loading state
  }, [fields, dataset]);

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
    return <div>No dataset selected</div>;
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
