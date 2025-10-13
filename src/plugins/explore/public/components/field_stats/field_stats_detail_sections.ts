/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DetailSectionConfig } from './field_stats_types';
import { topValuesDetailConfig } from './detail_sections/top_values_detail';
import { numericSummaryDetailConfig } from './detail_sections/numeric_summary_detail';
import { dateRangeDetailConfig } from './detail_sections/date_range_detail';
import { examplesDetailConfig } from './detail_sections/examples_detail';

/**
 * Registry of all detail sections that can be displayed in expanded field rows.
 *
 * ## How to Add a New Detail Section
 *
 * Each detail section is a self-contained plugin. To add a new one:
 *
 * 1. Create a new file in `detail_sections/` (e.g., `histogram_detail.tsx`)
 * 2. In that file, define:
 *    - Your query function
 *    - Your React component
 *    - Your DetailSectionConfig export
 * 3. Import and add your config to the DETAIL_SECTIONS array below
 * 4. That's it! The system automatically handles:
 *    - Fetching data when rows are expanded
 *    - Rendering your component with the data
 *    - Error handling
 *
 * ## Example
 *
 * ```typescript
 * // detail_sections/histogram_detail.tsx
 * import React from 'react';
 * import { DetailSectionConfig } from '../field_stats_types';
 * import { executeFieldStatsQuery } from '../field_stats_queries';
 *
 * const getHistogramQuery = (index: string, fieldName: string) => {
 *   return `source = ${index} | stats count() by \`${fieldName}\``;
 * };
 *
 * const HistogramSection: React.FC<{data: HistogramData, field: FieldStatsItem}> = ({data}) => {
 *   return <div>Render your histogram here</div>;
 * };
 *
 * export const histogramDetailConfig: DetailSectionConfig<HistogramData> = {
 *   id: 'histogram',
 *   title: 'Distribution',
 *   applicableToTypes: ['number'],
 *   fetchData: async (fieldName, dataset, services) => {
 *     const query = getHistogramQuery(dataset.title, fieldName);
 *     const result = await executeFieldStatsQuery(services, query, dataset.id, dataset.type);
 *     return parseHistogramData(result);
 *   },
 *   component: HistogramSection,
 * };
 * ```
 *
 * Then add to this file:
 * ```typescript
 * import { histogramDetailConfig } from './detail_sections/histogram_detail';
 *
 * export const DETAIL_SECTIONS: DetailSectionConfig[] = [
 *   // ... existing configs
 *   histogramDetailConfig,
 * ];
 * ```
 */
export const DETAIL_SECTIONS: DetailSectionConfig[] = [
  topValuesDetailConfig,
  numericSummaryDetailConfig,
  dateRangeDetailConfig,
  examplesDetailConfig,
];
