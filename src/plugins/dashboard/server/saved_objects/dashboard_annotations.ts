/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { SavedObjectsType } from 'opensearch-dashboards/server';

export const dashboardAnnotationsSavedObjectType: SavedObjectsType = {
  name: 'dashboard_annotations',
  hidden: false,
  namespaceType: 'single',
  management: {
    icon: 'annotation',
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle(obj) {
      return `Annotations for ${obj.attributes.dashboardId}`;
    },
    getEditUrl(obj) {
      return `/management/opensearch-dashboards/objects/dashboard-annotations/${encodeURIComponent(
        obj.id
      )}`;
    },
    getInAppUrl(obj) {
      return {
        path: `/app/dashboards#/view/${encodeURIComponent(obj.attributes.dashboardId)}`,
        uiCapabilitiesPath: 'dashboard.show',
      };
    },
  },
  mappings: {
    properties: {
      dashboardId: {
        type: 'keyword',
        doc_values: true,
      },
      title: {
        type: 'text',
      },
      annotations: {
        type: 'object',
        enabled: false,
        properties: {
          id: {
            type: 'keyword',
            doc_values: false,
          },
          name: {
            type: 'text',
          },
          type: {
            type: 'keyword',
            doc_values: false,
          },
          enabled: {
            type: 'boolean',
            doc_values: false,
          },
          showAnnotations: {
            type: 'boolean',
            doc_values: false,
          },
          defaultColor: {
            type: 'keyword',
            doc_values: false,
          },
          showIn: {
            type: 'keyword',
            doc_values: false,
          },
          selectedVisualizations: {
            type: 'keyword',
            doc_values: false,
          },
          query: {
            properties: {
              queryType: {
                type: 'keyword',
                doc_values: false,
              },
              fromType: {
                type: 'keyword',
                doc_values: false,
              },
              fromWeekdays: {
                type: 'keyword',
                doc_values: false,
              },
              fromTime: {
                type: 'keyword',
                doc_values: false,
              },
              toType: {
                type: 'keyword',
                doc_values: false,
              },
              toWeekdays: {
                type: 'keyword',
                doc_values: false,
              },
              toTime: {
                type: 'keyword',
                doc_values: false,
              },
            },
          },
          createdAt: {
            type: 'date',
            doc_values: false,
          },
          updatedAt: {
            type: 'date',
            doc_values: false,
          },
        },
      },
      createdAt: {
        type: 'date',
      },
      updatedAt: {
        type: 'date',
      },
    },
  },
};
