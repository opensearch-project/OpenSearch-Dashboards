/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const metricsFieldMappings = {
  '@timestamp': {
    type: 'date',
  },
  aggregationTemporality: {
    type: 'keyword',
    ignore_above: 128,
  },
  attributes: {
    properties: {
      data_stream: {
        properties: {
          dataset: {
            type: 'keyword',
            ignore_above: 128,
          },
          namespace: {
            type: 'keyword',
            ignore_above: 128,
          },
          type: {
            type: 'keyword',
            ignore_above: 56,
          },
        },
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
          version: {
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
      metric: {
        properties: {
          attributes: {
            properties: {
              action: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'app@ads@ad_request_type': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'app@ads@ad_response_type': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'app@payment@currency': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'client-id': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              count: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              cpu: {
                type: 'long',
              },
              currency_code: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              daemon: {
                type: 'boolean',
              },
              device: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              direction: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              dropped: {
                type: 'boolean',
              },
              family: {
                type: 'long',
              },
              gc: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              generation: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'http@flavor': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'http@host': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'http@method': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'http@route': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'http@scheme': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'http@status_code': {
                type: 'long',
              },
              method: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'net@host@name': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'net@host@port': {
                type: 'long',
              },
              'net@peer@name': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'net@peer@port': {
                type: 'long',
              },
              'node-id': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              operation: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              partition: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              pool: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              processor: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              processorType: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              protocol: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'recommendation@type': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'rpc@grpc@status_code': {
                type: 'long',
              },
              'rpc@method': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'rpc@service': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'rpc@system': {
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
              'span@kind': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              'span@name': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              state: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              status: {
                type: 'long',
              },
              'status@code': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              success: {
                type: 'boolean',
              },
              target: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              topic: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              type: {
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
      resource: {
        properties: {
          attributes: {
            properties: {
              'container@id': {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
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
              'process@executable@name': {
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
              'service@instance@id': {
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
    },
  },
  bucketCount: {
    type: 'long',
  },
  bucketCounts: {
    type: 'long',
  },
  bucketCountsList: {
    type: 'long',
  },
  buckets: {
    type: 'nested',
    properties: {
      count: {
        type: 'long',
      },
      max: {
        type: 'float',
      },
      min: {
        type: 'float',
      },
      sum: {
        type: 'double',
      },
    },
  },
  count: {
    type: 'long',
  },
  description: {
    type: 'text',
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  },
  exemplar: {
    properties: {
      serviceName: {
        type: 'keyword',
        ignore_above: 256,
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
    },
  },
  exemplars: {
    properties: {
      attributes: {
        properties: {
          exemplar: {
            properties: {
              attributes: {
                properties: {
                  'net@sock@peer@addr': {
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
        },
      },
      spanId: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      time: {
        type: 'date',
      },
      traceId: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      value: {
        type: 'float',
      },
    },
  },
  explicitBounds: {
    type: 'float',
  },
  explicitBoundsCount: {
    type: 'float',
  },
  explicitBoundsList: {
    type: 'float',
  },
  flags: {
    type: 'long',
  },
  instrumentationScope: {
    properties: {
      droppedAttributesCount: {
        type: 'integer',
      },
      name: {
        type: 'keyword',
        ignore_above: 256,
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
      version: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  },
  isMonotonic: {
    type: 'boolean',
  },
  kind: {
    type: 'keyword',
    ignore_above: 128,
  },
  max: {
    type: 'float',
  },
  min: {
    type: 'float',
  },
  monotonic: {
    type: 'boolean',
  },
  name: {
    type: 'keyword',
    ignore_above: 256,
  },
  negativeBuckets: {
    type: 'nested',
    properties: {
      count: {
        type: 'long',
      },
      max: {
        type: 'float',
      },
      min: {
        type: 'float',
      },
    },
  },
  negativeOffset: {
    type: 'integer',
  },
  observedTimestamp: {
    type: 'date_nanos',
  },
  positiveBuckets: {
    type: 'nested',
    properties: {
      count: {
        type: 'long',
      },
      max: {
        type: 'float',
      },
      min: {
        type: 'float',
      },
    },
  },
  positiveOffset: {
    type: 'integer',
  },
  quantileValuesCount: {
    type: 'long',
  },
  quantiles: {
    properties: {
      quantile: {
        type: 'double',
      },
      value: {
        type: 'double',
      },
    },
  },
  scale: {
    type: 'long',
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
  },
  startTime: {
    type: 'date',
  },
  sum: {
    type: 'float',
  },
  time: {
    type: 'date',
  },
  unit: {
    type: 'keyword',
    ignore_above: 128,
  },
  value: {
    type: 'float',
  },
  'value@double': {
    type: 'double',
  },
  'value@int': {
    type: 'integer',
  },
  zeroCount: {
    type: 'long',
  },
};
