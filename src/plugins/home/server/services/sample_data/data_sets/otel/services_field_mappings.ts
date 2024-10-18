/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const servicesFieldMappings = {
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
};
