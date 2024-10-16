/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const servicesFieldMappings = {
  dynamic_templates: [
    {
      strings_as_keyword: {
        match_mapping_type: 'string',
        mapping: {
          ignore_above: 1024,
          type: 'keyword',
        },
      },
    },
  ],
  date_detection: false,
  properties: {
    destination: {
      properties: {
        domain: {
          type: 'keyword',
          ignore_above: 1024,
        },
        resource: {
          type: 'keyword',
          ignore_above: 1024,
        },
      },
    },
    hashId: {
      type: 'keyword',
      ignore_above: 1024,
    },
    kind: {
      type: 'keyword',
      ignore_above: 1024,
    },
    serviceName: {
      type: 'keyword',
      ignore_above: 1024,
    },
    target: {
      properties: {
        domain: {
          type: 'keyword',
          ignore_above: 1024,
        },
        resource: {
          type: 'keyword',
          ignore_above: 1024,
        },
      },
    },
    traceGroupName: {
      type: 'keyword',
      ignore_above: 1024,
    },
  },
};
