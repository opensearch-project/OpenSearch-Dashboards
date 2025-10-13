/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../types';
import {
  Dataset,
  DetailSectionConfig,
  FieldDetails,
  FieldDetailsMap,
  FieldStatsItem,
  IndexPatternField,
} from './field_stats_types';
import { DETAIL_SECTIONS } from './field_stats_detail_sections';

/**
 * Filter dataset fields to remove meta fields, multi-fields, and scripted fields
 * @param dataset The dataset to filter fields from
 * @returns Array of filtered fields
 */
export function filterDatasetFields(dataset: any): IndexPatternField[] {
  if (!dataset || !dataset.fields) {
    return [];
  }

  // Get the list of meta fields from the dataset configuration
  const metaFieldsSet = new Set(dataset.metaFields || []);

  return dataset.fields.getAll().filter((field: IndexPatternField) => {
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
  // Extract results from response
  // PPL stats queries return results in hits.hits[0]._source
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

  // Fetch all applicable sections in parallel
  const results = await Promise.allSettled(
    applicableSections.map(async (section) => {
      try {
        const data = await section.fetchData(fieldName, safeDataset, services);
        return { id: section.id, data, error: false };
      } catch (error) {
        // TODO: put in a UI error within the expanded row panel
        return { id: section.id, data: null, error: true };
      }
    })
  );

  // Collect results into a single object
  const details: FieldDetails = {};
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      const { id, data, error } = result.value;
      if (error) {
        // Store error flag for this section
        (details as any)[id] = { error: true };
      } else {
        // Store the data
        (details as any)[id] = data;
      }
    }
  });

  return details;
}

/**
 * Sanitize a field name for use in PPL queries by wrapping it in backticks
 * @param fieldName The field name to sanitize
 * @returns The sanitized field name wrapped in backticks
 */
export function sanitizeFieldName(fieldName: string): string {
  return `\`${fieldName}\``;
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

    // Toggle expansion
    if (newExpanded.has(fieldName)) {
      newExpanded.delete(fieldName);
      setExpandedRows(newExpanded);
      return;
    }

    newExpanded.add(fieldName);
    setExpandedRows(newExpanded);

    const field = fieldStats[fieldName];
    if (!field || !dataset) return;

    // Don't fetch if already fetched
    if (fieldDetails[fieldName]) return;

    setDetailsLoading((prev) => new Set(prev).add(fieldName));

    try {
      const details = await fetchFieldDetails(fieldName, field.type, dataset, services);
      setFieldDetails((prev) => ({ ...prev, [fieldName]: details }));
    } catch (error) {
      setFieldDetails((prev) => ({ ...prev, [fieldName]: { error: true } }));
    } finally {
      setDetailsLoading((prev) => {
        const next = new Set(prev);
        next.delete(fieldName);
        return next;
      });
    }
  };
}
