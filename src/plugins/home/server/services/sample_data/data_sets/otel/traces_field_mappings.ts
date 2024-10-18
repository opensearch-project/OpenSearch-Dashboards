/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const tracesFieldMappings = {
  droppedAttributesCount: {
    type: 'long',
  },
  droppedEventsCount: {
    type: 'long',
  },
  droppedLinksCount: {
    type: 'long',
  },
  durationInNanos: {
    type: 'long',
  },
  endTime: {
    type: 'date_nanos',
  },
  events: {
    type: 'nested',
    properties: {
      attributes: {
        properties: {
          'app@payment@transaction@id': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'app@quote@cost@total': {
            type: 'float',
          },
          'app@shipping@cost@total': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'app@shipping@tracking@id': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          'message@id': {
            type: 'long',
          },
          'message@type': {
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
      droppedAttributesCount: {
        type: 'long',
      },
      name: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      time: {
        type: 'date_nanos',
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
  kind: {
    type: 'keyword',
    ignore_above: 128,
  },
  links: {
    type: 'nested',
    properties: {
      attributes: {
        type: 'object',
      },
      droppedAttributesCount: {
        type: 'long',
      },
      spanId: {
        type: 'keyword',
        ignore_above: 256,
      },
      traceId: {
        type: 'keyword',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      traceState: {
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
  name: {
    type: 'keyword',
    ignore_above: 1024,
  },
  parentSpanId: {
    type: 'keyword',
    ignore_above: 256,
  },
  resource: {
    properties: {
      attributes: {
        properties: {
          'container@id': {
            type: 'keyword',
          },
          'docker@cli@cobra@command_path': {
            type: 'keyword',
          },
          'host@arch': {
            type: 'keyword',
          },
          'host@name': {
            type: 'keyword',
          },
          'os@description': {
            type: 'keyword',
          },
          'os@name': {
            type: 'keyword',
          },
          'os@type': {
            type: 'keyword',
          },
          'os@version': {
            type: 'keyword',
          },
          'process@command': {
            type: 'keyword',
          },
          'process@command_args': {
            type: 'keyword',
          },
          'process@command_line': {
            type: 'keyword',
          },
          'process@executable@name': {
            type: 'keyword',
          },
          'process@executable@path': {
            type: 'keyword',
          },
          'process@owner': {
            type: 'keyword',
          },
          'process@pid': {
            type: 'keyword',
          },
          'process@runtime@description': {
            type: 'keyword',
          },
          'process@runtime@name': {
            type: 'keyword',
          },
          'process@runtime@version': {
            type: 'keyword',
          },
          'service@instance@id': {
            type: 'keyword',
          },
          'service@name': {
            type: 'keyword',
          },
          'service@version': {
            type: 'keyword',
          },
          'telemetry@auto@version': {
            type: 'keyword',
          },
          'telemetry@sdk@language': {
            type: 'keyword',
          },
          'telemetry@sdk@name': {
            type: 'keyword',
          },
          'telemetry@sdk@version': {
            type: 'keyword',
          },
        },
      },
    },
  },
  serviceName: {
    type: 'keyword',
  },
  span: {
    properties: {
      attributes: {
        properties: {
          'app@ads@ad_request_type': {
            type: 'keyword',
          },
          'app@ads@ad_response_type': {
            type: 'keyword',
          },
          'app@ads@category': {
            type: 'keyword',
          },
          'app@ads@contextKeys': {
            type: 'keyword',
          },
          'app@ads@contextKeys@count': {
            type: 'keyword',
          },
          'app@ads@count': {
            type: 'keyword',
          },
          'app@cart@items@count': {
            type: 'keyword',
          },
          'app@currency@conversion@from': {
            type: 'keyword',
          },
          'app@currency@conversion@to': {
            type: 'keyword',
          },
          'app@email@recipient': {
            type: 'keyword',
          },
          'app@featureflag@enabled': {
            type: 'keyword',
          },
          'app@featureflag@name': {
            type: 'keyword',
          },
          'app@filtered_products@count': {
            type: 'keyword',
          },
          'app@filtered_products@list': {
            type: 'keyword',
          },
          'app@order@amount': {
            type: 'keyword',
          },
          'app@order@id': {
            type: 'keyword',
          },
          'app@order@items@count': {
            type: 'keyword',
          },
          'app@payment@amount': {
            type: 'keyword',
          },
          'app@payment@card_type': {
            type: 'keyword',
          },
          'app@payment@card_valid': {
            type: 'keyword',
          },
          'app@payment@charged': {
            type: 'keyword',
          },
          'app@product@id': {
            type: 'keyword',
          },
          'app@product@name': {
            type: 'keyword',
          },
          'app@product@quantity': {
            type: 'keyword',
          },
          'app@products@count': {
            type: 'keyword',
          },
          'app@products_recommended@count': {
            type: 'keyword',
          },
          'app@quote@cost@total': {
            type: 'keyword',
          },
          'app@quote@items@count': {
            type: 'keyword',
          },
          'app@recommendation@cache_enabled': {
            type: 'keyword',
          },
          'app@shipping@amount': {
            type: 'keyword',
          },
          'app@shipping@cost@total': {
            type: 'keyword',
          },
          'app@shipping@items@count': {
            type: 'keyword',
          },
          'app@shipping@tracking@id': {
            type: 'keyword',
          },
          'app@shipping@zip_code': {
            type: 'keyword',
          },
          'app@synthetic_request': {
            type: 'keyword',
          },
          'app@user@currency': {
            type: 'keyword',
          },
          'app@user@id': {
            type: 'keyword',
          },
          busy_ns: {
            type: 'keyword',
          },
          'code@filepath': {
            type: 'keyword',
          },
          'code@function': {
            type: 'keyword',
          },
          'code@lineno': {
            type: 'keyword',
          },
          'code@namespace': {
            type: 'keyword',
          },
          'db@instance': {
            type: 'keyword',
          },
          'db@name': {
            type: 'keyword',
          },
          'db@redis@database_index': {
            type: 'keyword',
          },
          'db@redis@flags': {
            type: 'keyword',
          },
          'db@statement': {
            type: 'keyword',
          },
          'db@system': {
            type: 'keyword',
          },
          'db@type': {
            type: 'keyword',
          },
          'db@url': {
            type: 'keyword',
          },
          decode_time_microseconds: {
            type: 'keyword',
          },
          'http@client_ip': {
            type: 'keyword',
          },
          'http@flavor': {
            type: 'keyword',
          },
          'http@host': {
            type: 'keyword',
          },
          'http@method': {
            type: 'keyword',
          },
          'http@request_content_length': {
            type: 'keyword',
          },
          'http@request_content_length_uncompressed': {
            type: 'keyword',
          },
          'http@response_content_length': {
            type: 'keyword',
          },
          'http@route': {
            type: 'keyword',
          },
          'http@scheme': {
            type: 'keyword',
          },
          'http@status_code': {
            type: 'keyword',
          },
          'http@status_text': {
            type: 'keyword',
          },
          'http@target': {
            type: 'keyword',
          },
          'http@url': {
            type: 'keyword',
          },
          'http@user_agent': {
            type: 'keyword',
          },
          idle_ns: {
            type: 'keyword',
          },
          idle_time_microseconds: {
            type: 'keyword',
          },
          'messaging@client_id': {
            type: 'keyword',
          },
          'messaging@destination@kind': {
            type: 'keyword',
          },
          'messaging@destination@name': {
            type: 'keyword',
          },
          'messaging@kafka@consumer@group': {
            type: 'keyword',
          },
          'messaging@kafka@destination@partition': {
            type: 'keyword',
          },
          'messaging@kafka@message@offset': {
            type: 'keyword',
          },
          'messaging@message@payload_size_bytes': {
            type: 'keyword',
          },
          'messaging@operation': {
            type: 'keyword',
          },
          'messaging@system': {
            type: 'keyword',
          },
          'net@host@ip': {
            type: 'keyword',
          },
          'net@host@name': {
            type: 'keyword',
          },
          'net@host@port': {
            type: 'keyword',
          },
          'net@peer@ip': {
            type: 'keyword',
          },
          'net@peer@name': {
            type: 'keyword',
          },
          'net@peer@port': {
            type: 'keyword',
          },
          'net@sock@host@addr': {
            type: 'keyword',
          },
          'net@sock@peer@addr': {
            type: 'keyword',
          },
          'net@sock@peer@port': {
            type: 'keyword',
          },
          'net@transport': {
            type: 'keyword',
          },
          'peer@service': {
            type: 'keyword',
          },
          'phoenix@action': {
            type: 'keyword',
          },
          'phoenix@plug': {
            type: 'keyword',
          },
          query_time_microseconds: {
            type: 'keyword',
          },
          queue_time_microseconds: {
            type: 'keyword',
          },
          'rpc@grpc@status_code': {
            type: 'keyword',
          },
          'rpc@method': {
            type: 'keyword',
          },
          'rpc@service': {
            type: 'keyword',
          },
          'rpc@system': {
            type: 'keyword',
          },
          'rpc@user_agent': {
            type: 'keyword',
          },
          'sinatra@template_name': {
            type: 'keyword',
          },
          source: {
            type: 'keyword',
          },
          'thread@id': {
            type: 'keyword',
          },
          'thread@name': {
            type: 'keyword',
          },
          total_time_microseconds: {
            type: 'keyword',
          },
        },
      },
    },
  },
  spanId: {
    type: 'keyword',
    ignore_above: 256,
  },
  startTime: {
    type: 'date_nanos',
  },
  status: {
    properties: {
      code: {
        type: 'integer',
      },
      message: {
        type: 'keyword',
      },
    },
  },
  traceGroup: {
    type: 'keyword',
    ignore_above: 1024,
  },
  traceGroupFields: {
    properties: {
      durationInNanos: {
        type: 'long',
      },
      endTime: {
        type: 'date_nanos',
      },
      statusCode: {
        type: 'integer',
      },
    },
  },
  traceId: {
    type: 'keyword',
    ignore_above: 256,
  },
  traceState: {
    type: 'text',
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  },
};
