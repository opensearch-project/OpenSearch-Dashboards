/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../base_constants';

export const VB_DEBOUNCE = 300; // Debounce time for VisBuilder fields in ms

export const VB_INDEX_DATA = 'vis-builder.data.txt';
export const VB_INDEX_DOC_COUNT = '10,000';
export const VB_INDEX_START_TIME = 'Dec 31, 2021 @ 00:00:00.000';
export const VB_INDEX_END_TIME = 'Oct 2, 2022 @ 00:00:00.000';
export const VB_INDEX_ID = 'vis-builder'; // Test index for Vis Builder
export const VB_SO_TYPE = 'visualization-visbuilder'; // Saved object type
export const VB_INDEX_PATTERN = VB_INDEX_ID; // Test index pattern label for Vis Builder

// Default ID's for the saved object fixture data
export const VB_SO_DATA = 'vb_saved_objects.ndjson';
export const VB_DASHBOARD_ID = '1955efa0-5a71-11ed-a595-f5e6ea9b3826';

export const VB_METRIC_VIS_TITLE = 'VB: Basic Metric Chart';
export const VB_BAR_VIS_TITLE = 'VB: Basic Bar Chart';
export const VB_LINE_VIS_TITLE = 'VB: Basic Line Chart';

export const VB_PATH_FIXTURE = 'opensearch_dashboards/visBuilder/';
export const VB_PATH_INDEX_DATA = VB_PATH_FIXTURE + VB_INDEX_DATA;
export const VB_PATH_SO_DATA = VB_PATH_FIXTURE + VB_SO_DATA;

// App URL Paths
export const VB_APP_PATH = '/app/vis-builder';
export const VB_APP_URL = `${BASE_PATH}${VB_APP_PATH}`;

export const toTestId = (str, replace = '-') => str.replace(/\s+/g, replace);
