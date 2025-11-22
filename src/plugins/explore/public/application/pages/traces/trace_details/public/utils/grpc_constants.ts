/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * gRPC status codes with human-readable descriptions
 * Based on the gRPC specification: https://grpc.github.io/grpc/core/md_doc_statuscodes.html
 */
export const GRPC_STATUS_CODES: Record<string, string> = {
  '0': '0 (OK)',
  '1': '1 (CANCELLED)',
  '2': '2 (UNKNOWN)',
  '3': '3 (INVALID_ARGUMENT)',
  '4': '4 (DEADLINE_EXCEEDED)',
  '5': '5 (NOT_FOUND)',
  '6': '6 (ALREADY_EXISTS)',
  '7': '7 (PERMISSION_DENIED)',
  '8': '8 (RESOURCE_EXHAUSTED)',
  '9': '9 (FAILED_PRECONDITION)',
  '10': '10 (ABORTED)',
  '11': '11 (OUT_OF_RANGE)',
  '12': '12 (UNIMPLEMENTED)',
  '13': '13 (INTERNAL)',
  '14': '14 (UNAVAILABLE)',
  '15': '15 (DATA_LOSS)',
  '16': '16 (UNAUTHENTICATED)',
};

/**
 * gRPC status codes for overview tab (without parentheses for cleaner display)
 */
export const GRPC_STATUS_NAMES: Record<number, string> = {
  0: 'OK',
  1: 'CANCELLED',
  2: 'UNKNOWN',
  3: 'INVALID_ARGUMENT',
  4: 'DEADLINE_EXCEEDED',
  5: 'NOT_FOUND',
  6: 'ALREADY_EXISTS',
  7: 'PERMISSION_DENIED',
  8: 'RESOURCE_EXHAUSTED',
  9: 'FAILED_PRECONDITION',
  10: 'ABORTED',
  11: 'OUT_OF_RANGE',
  12: 'UNIMPLEMENTED',
  13: 'INTERNAL',
  14: 'UNAVAILABLE',
  15: 'DATA_LOSS',
  16: 'UNAUTHENTICATED',
};

export const getReadableGrpcStatus = (code: string): string => {
  return GRPC_STATUS_CODES[code] || `${code} (UNKNOWN)`;
};

export const getGrpcStatusName = (code: number): string => {
  return GRPC_STATUS_NAMES[code] || 'UNKNOWN';
};
