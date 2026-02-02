/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DetailSectionConfig } from './utils/field_stats_types';
import { topValuesDetailConfig } from './detail_sections/top_values_detail';
import { rareValuesDetailConfig } from './detail_sections/rare_values_detail';
import { numericSummaryDetailConfig } from './detail_sections/numeric_summary_detail';
import { dateRangeDetailConfig } from './detail_sections/date_range_detail';
import { examplesDetailConfig } from './detail_sections/examples_detail';

/**
 * Registry of all detail sections that can be displayed in expanded field rows.
 *
 * ## How to Add a New Detail Section
 *
 * Each detail section is a self-contained component. To add a new one:
 *
 * 1. Create a new file in `detail_sections/` (e.g., `top_values_detail.tsx`)
 * 2. In that file, define:
 *    - Your query function
 *    - Your React component
 *    - Your DetailSectionConfig export
 * 3. Import and add your config to the DETAIL_SECTIONS array below
 *
 * The system automatically handles:
 *    - Fetching data when rows are expanded
 *    - Rendering your component with the data
 *    - Error handling
 */
export const DETAIL_SECTIONS: DetailSectionConfig[] = [
  topValuesDetailConfig,
  rareValuesDetailConfig,
  numericSummaryDetailConfig,
  dateRangeDetailConfig,
  examplesDetailConfig,
];
