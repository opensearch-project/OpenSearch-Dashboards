/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from '../../../../core/server';
import { CORRELATION_TYPE_PREFIXES } from '../../common';

// @experimental This schema is experimental and might change in future releases.
export const correlationsSavedObjectType: SavedObjectsType = {
  name: 'correlations',
  hidden: false,
  namespaceType: 'single',
  management: {
    icon: 'link',
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle(obj) {
      // Use title if available
      if (obj.attributes?.title) {
        return obj.attributes.title;
      }
      // Fallback for correlations without title (e.g., imported old objects)
      const correlationType = obj.attributes?.correlationType || '';
      if (correlationType.startsWith(CORRELATION_TYPE_PREFIXES.APM_CONFIG)) {
        return 'APM-config';
      }
      if (correlationType.startsWith(CORRELATION_TYPE_PREFIXES.TRACE_TO_LOGS)) {
        // Show full correlationType for unique identification in Assets page
        return correlationType;
      }
      return `Correlation ${obj.id}`;
    },
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    getInAppUrl(obj) {
      const correlationType = obj.attributes?.correlationType || '';
      if (correlationType.startsWith(CORRELATION_TYPE_PREFIXES.APM_CONFIG)) {
        return {
          path: '/app/observability-apm-services#/services',
          uiCapabilitiesPath: 'observability.show',
        };
      }
      if (correlationType.startsWith(CORRELATION_TYPE_PREFIXES.TRACE_TO_LOGS)) {
        const traceDatasetId = obj.references?.[0]?.id;
        if (traceDatasetId) {
          return {
            path: `/app/datasets/patterns/${encodeURIComponent(
              traceDatasetId
            )}#/?_a=(tab:correlatedDatasets)`,
            uiCapabilitiesPath: 'indexPatterns.save',
          };
        }
      }
      return undefined;
    },
  },
  mappings: {
    properties: {
      title: {
        type: 'text',
      },
      correlationType: {
        type: 'keyword',
      },
      version: {
        type: 'keyword',
      },
      entities: {
        type: 'object',
        enabled: false,
      },
    },
  },
  migrations: {},
};
