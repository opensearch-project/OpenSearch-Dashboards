/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../types';
import {
  Dataset,
  DetailSectionConfig,
  FieldDetails,
  FieldDetailsMap,
  FieldStatsItem,
  IndexPatternField,
} from './field_stats_types';
import { DETAIL_SECTIONS } from '../field_stats_detail_sections';

/**
 * Filter dataset fields to remove meta fields, multi-fields, and scripted fields
 * @param dataset The dataset to filter fields from
 * @returns Array of filtered fields
 */
export function filterDatasetFields(dataset: any): IndexPatternField[] {
  if (!dataset || !dataset.fields) {
    return [];
  }

  const metaFieldsSet = new Set(dataset.metaFields || []);
  return dataset.fields.getAll().filter((field: IndexPatternField) => {
    if (metaFieldsSet.has(field.name) || field.subType?.multi?.parent || field.scripted) {
      return false;
    }

    return true;
  });
}

/**
 * Transform raw query result into a FieldStatsItem
 * @param fieldName The field name
 * @param fieldType The field type
 * @param result The raw query result
 * @returns Transformed field stats item
 */
export function transformFieldStatsResult(
  fieldName: string,
  fieldType: string,
  result: any
): FieldStatsItem {
  const hits = result?.hits?.hits || [];
  const firstHit = hits[0]?._source || {};

  return {
    name: fieldName,
    type: fieldType,
    docCount: firstHit.count || 0,
    distinctCount: firstHit.dc || 0,
    docPercentage: firstHit.percentage_total || 0,
  };
}

/**
 * Get applicable detail sections for a given field type
 * @param fieldType The field type (e.g., 'string', 'number', 'date')
 * @returns Array of detail section configs that apply to this field type
 */
export function getApplicableSections(fieldType: string): DetailSectionConfig[] {
  const normalizedType = fieldType.toLowerCase();
  return DETAIL_SECTIONS.filter((section) => section.applicableToTypes.includes(normalizedType));
}

/**
 * Fetch all applicable field details for a given field
 * @param fieldName The field name
 * @param fieldType The field type
 * @param dataset The dataset to query (must have type property)
 * @param services OpenSearch Dashboards services
 * @returns Object containing all fetched details keyed by section id
 */
export async function fetchFieldDetails(
  fieldName: string,
  fieldType: string,
  dataset: any,
  services: ExploreServices
): Promise<FieldDetails> {
  // Ensure dataset has required properties
  const safeDataset: Dataset = {
    id: dataset.id,
    type: dataset.type || 'INDEX_PATTERN',
    title: dataset.title,
    fields: dataset.fields,
    metaFields: dataset.metaFields,
  };

  const applicableSections = getApplicableSections(fieldType);

  // fetch all applicable sections in parallel
  const results = await Promise.allSettled(
    applicableSections.map(async (section) => {
      try {
        const data = await section.fetchData(fieldName, safeDataset, services);
        return { id: section.id, data };
      } catch (error) {
        const errorMessage = error?.body?.message || String(error);
        return { id: section.id, errorMessage };
      }
    })
  );

  const details: FieldDetails = {};
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      const { id, data, errorMessage } = result.value as any;
      if (errorMessage) {
        // store error message for this section
        (details as any)[id] = { errorMessage };
      } else {
        (details as any)[id] = data;
      }
    }
  });

  return details;
}

/**
 * Create a row expansion handler for field statistics table
 * @param expandedRows Current set of expanded row field names
 * @param setExpandedRows Setter for expanded rows
 * @param fieldStats Map of field names to their stats
 * @param fieldDetails Map of field names to their detailed stats
 * @param setFieldDetails Setter for field details
 * @param detailsLoading Set of field names currently loading details
 * @param setDetailsLoading Setter for details loading state
 * @param dataset Current dataset
 * @param services OpenSearch Dashboards services
 * @returns Handler function for row expansion
 */
export function createRowExpandHandler(
  expandedRows: Set<string>,
  setExpandedRows: (rows: Set<string>) => void,
  fieldStats: Record<string, FieldStatsItem>,
  fieldDetails: FieldDetailsMap,
  setFieldDetails: (updater: (prev: FieldDetailsMap) => FieldDetailsMap) => void,
  detailsLoading: Set<string>,
  setDetailsLoading: (updater: (prev: Set<string>) => Set<string>) => void,
  dataset: any,
  services: ExploreServices
) {
  return async (fieldName: string) => {
    const newExpanded = new Set(expandedRows);

    // toggle expansion
    if (newExpanded.has(fieldName)) {
      newExpanded.delete(fieldName);
      setExpandedRows(newExpanded);
      return;
    }

    newExpanded.add(fieldName);
    setExpandedRows(newExpanded);

    const field = fieldStats[fieldName];
    if (!field || !dataset) return;

    // don't fetch if already fetched
    if (fieldDetails[fieldName]) return;

    setDetailsLoading((prev) => new Set(prev).add(fieldName));

    try {
      const details = await fetchFieldDetails(fieldName, field.type, dataset, services);
      setFieldDetails((prev) => ({ ...prev, [fieldName]: details }));
    } catch (error) {
      const errorMessage = error?.body?.message || String(error);
      setFieldDetails((prev) => ({ ...prev, [fieldName]: { errorMessage } }));
    } finally {
      setDetailsLoading((prev) => {
        const next = new Set(prev);
        next.delete(fieldName);
        return next;
      });
    }
  };
}
