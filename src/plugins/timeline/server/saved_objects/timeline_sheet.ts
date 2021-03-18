/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { SavedObjectsType } from 'opensearch-dashboards/server';

export const timelineSheetSavedObjectType: SavedObjectsType = {
  name: 'timeline-sheet',
  hidden: false,
  namespaceType: 'single',
  mappings: {
    properties: {
      description: { type: 'text' },
      hits: { type: 'integer' },
      opensearchDashboardsSavedObjectMeta: {
        properties: {
          searchSourceJSON: { type: 'text' },
        },
      },
      timeline_chart_height: { type: 'integer' },
      timeline_columns: { type: 'integer' },
      timeline_interval: { type: 'keyword' },
      timeline_other_interval: { type: 'keyword' },
      timeline_rows: { type: 'integer' },
      timeline_sheet: { type: 'text' },
      title: { type: 'text' },
      version: { type: 'integer' },
    },
  },
};
