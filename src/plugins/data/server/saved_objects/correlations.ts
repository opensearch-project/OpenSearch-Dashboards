/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from '../../../../core/server';

// @experimental This schema is experimental and might change in future releases.
export const correlationsSavedObjectType: SavedObjectsType = {
  name: 'correlations',
  hidden: false,
  namespaceType: 'single',
  management: {
    icon: 'link',
    defaultSearchField: 'correlationType',
    importableAndExportable: true,
    getTitle(obj) {
      const correlationType = obj.attributes?.correlationType || '';
      if (correlationType.startsWith('APM-Config-')) {
        return 'APM-config';
      }
      if (correlationType.startsWith('trace-to-logs-')) {
        // Show full correlationType for unique identification in Assets page
        return correlationType;
      }
      return `Correlation ${obj.id}`;
    },
    getInAppUrl(obj) {
      const correlationType = obj.attributes?.correlationType || '';
      if (correlationType.startsWith('APM-Config-')) {
        return {
          path: '/app/observability-apm-services#/services',
          uiCapabilitiesPath: 'observability.show',
        };
      }
      if (correlationType.startsWith('trace-to-logs-')) {
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
