/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const logsFieldMappings = {
  body: {
    type: 'text',
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  },
  droppedAttributesCount: {
    type: 'long',
  },
  flags: {
    type: 'long',
  },
  instrumentationScope: {
    properties: {
      name: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
    },
  },
  log: {
    properties: {
      attributes: {
        properties: {
          address: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          contentRoot: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          context: {
            type: 'keyword',
            ignore_above: 256,
          },
          envName: {
            type: 'keyword',
            ignore_above: 256,
          },
          otelServiceName: {
            type: 'keyword',
            ignore_above: 256,
          },
          otelSpanID: {
            type: 'keyword',
            ignore_above: 256,
          },
          otelTraceID: {
            type: 'keyword',
            ignore_above: 256,
          },
          otelTraceSampled: {
            type: 'boolean',
          },
          productId: {
            type: 'keyword',
            ignore_above: 256,
          },
          quantity: {
            type: 'long',
          },
          userId: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
    },
  },
  observedTime: {
    type: 'date',
  },
  resource: {
    properties: {
      attributes: {
        properties: {
          'container@id': {
            type: 'keyword',
            ignore_above: 256,
          },
          'docker@cli@cobra@command_path': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'host@arch': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'host@name': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'os@description': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'os@name': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'os@type': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'os@version': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'process@command': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'process@command_args': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'process@command_line': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'process@executable@path': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'process@owner': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'process@pid': {
            type: 'long',
          },
          'process@runtime@description': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'process@runtime@name': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'process@runtime@version': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'service@name': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'service@version': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'telemetry@auto@version': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'telemetry@sdk@language': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'telemetry@sdk@name': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'telemetry@sdk@version': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
        },
      },
    },
  },
  schemaUrl: {
    type: 'text',
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  },
  serviceName: {
    type: 'keyword',
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  },
  severityNumber: {
    type: 'long',
  },
  severityText: {
    type: 'text',
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  },
  spanId: {
    type: 'keyword',
    ignore_above: 256,
  },
  time: {
    type: 'date',
  },
  traceId: {
    type: 'keyword',
    ignore_above: 256,
  },
};
