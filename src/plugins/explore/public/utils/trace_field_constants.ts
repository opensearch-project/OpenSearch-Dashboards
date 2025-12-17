/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const TRACE_ID_FIELD_PATHS = [
  'traceId',
  'trace_id',
  'traceID',
  '_source.traceId',
  '_source.trace_id',
  '_source.traceID',
  'fields.traceId',
  'fields.trace_id',
  'fields.traceID',
] as const;

export const SPAN_ID_FIELD_PATHS = [
  'spanId',
  'span_id',
  'spanID',
  '_source.spanId',
  '_source.span_id',
  '_source.spanID',
  'fields.spanId',
  'fields.span_id',
  'fields.spanID',
] as const;

export const STATUS_CODE_FIELD_PATHS = [
  'status.code',
  'statusCode',
  'status_code',
  'otel.status_code',
  '_source.status.code',
  '_source.statusCode',
  'fields.status.code',
  'fields.statusCode',
] as const;

export const HTTP_STATUS_CODE_FIELD_PATHS = [
  'attributes.http.status_code',
  'http.status_code',
  'httpStatusCode',
  'http_status_code',
  'tags.http.status_code',
  '_source.attributes.http.status_code',
  '_source.http.status_code',
  'fields.attributes.http.status_code',
  'fields.http.status_code',
  'span.attributes.http@status_code',
  '_source.attributes.http.response.status_code',
] as const;

// gRPC request method paths (Jaeger equivalent of http.method)
export const RPC_METHOD_FIELD_PATHS = [
  'rpc.method', // Jaeger gRPC method (e.g., "EventStream")
  'attributes.rpc.method',
  'tags.rpc.method',
  '_source.rpc.method',
  '_source.attributes.rpc.method',
  'fields.rpc.method',
  'fields.attributes.rpc.method',
] as const;

// gRPC status code paths (Jaeger equivalent of http.status_code)
export const RPC_STATUS_CODE_FIELD_PATHS = [
  'rpc.grpc.status_code', // Jaeger gRPC status (e.g., "4" for DEADLINE_EXCEEDED)
  'grpc.status_code', // Direct Jaeger gRPC status
  'attributes.rpc.grpc.status_code',
  'attributes.grpc.status_code',
  'tags.rpc.grpc.status_code',
  'tags.grpc.status_code',
  '_source.rpc.grpc.status_code',
  '_source.grpc.status_code',
  '_source.attributes.rpc.grpc.status_code',
  '_source.attributes.grpc.status_code',
  'fields.rpc.grpc.status_code',
  'fields.grpc.status_code',
  'fields.attributes.rpc.grpc.status_code',
  'fields.attributes.grpc.status_code',
] as const;

// HTTP method paths (DataPrepper equivalent)
export const HTTP_METHOD_FIELD_PATHS = [
  'http.method', // DataPrepper HTTP method (e.g., "GET", "POST")
  'attributes.http.method',
  'tags.http.method',
  '_source.http.method',
  '_source.attributes.http.method',
  'fields.http.method',
  'fields.attributes.http.method',
] as const;

export const SERVICE_NAME_FIELD_PATHS = [
  'process.serviceName',
  'serviceName',
  'service_name',
  'service.name',
  'resource.service.name',
  '_source.process.serviceName',
  '_source.serviceName',
  '_source.service_name',
  '_source.service.name',
  'fields.process.serviceName',
  'fields.serviceName',
  'fields.service_name',
] as const;

export const SPAN_NAME_FIELD_PATHS = [
  'operationName',
  'name',
  'operation_name',
  'span.name',
  '_source.operationName',
  '_source.name',
  '_source.operation_name',
  'fields.operationName',
  'fields.name',
] as const;

export const DURATION_FIELD_PATHS = [
  'duration',
  'durationInNanos',
  'duration_in_nanos',
  'durationNanos',
  '_source.duration',
  '_source.durationNano',
  '_source.durationInNanos',
  '_source.duration_in_nanos',
  'fields.duration',
  'fields.durationInNanos',
] as const;
