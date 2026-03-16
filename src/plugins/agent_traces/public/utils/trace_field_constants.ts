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

export const SERVICE_NAME_FIELD_PATHS = [
  'serviceName',
  'service_name',
  'service.name',
  'resource.service.name',
  '_source.serviceName',
  '_source.service_name',
  '_source.service.name',
  'fields.serviceName',
  'fields.service_name',
] as const;

export const SPAN_NAME_FIELD_PATHS = [
  'name',
  'operationName',
  'operation_name',
  'span.name',
  '_source.name',
  '_source.operationName',
  '_source.operation_name',
  'fields.name',
  'fields.operationName',
] as const;

export const DURATION_FIELD_PATHS = [
  'durationInNanos',
  'duration_in_nanos',
  'duration',
  'durationNanos',
  '_source.durationNano',
  '_source.durationInNanos',
  '_source.duration_in_nanos',
  '_source.duration',
  'fields.durationInNanos',
  'fields.duration',
] as const;
