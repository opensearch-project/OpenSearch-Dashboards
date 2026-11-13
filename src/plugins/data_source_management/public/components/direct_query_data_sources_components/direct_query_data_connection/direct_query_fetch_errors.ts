/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Direct query connections are served by OpenSearch's SQL plugin at
 * `/_plugins/_query/_datasources`. When that plugin is not installed, OpenSearch
 * returns HTTP 400 with "no handler found" rather than 404.
 */

const NO_HANDLER_PATTERN = /no handler found/i;
const QUERY_DATASOURCES_PATH_PATTERN = /_plugins\/_query\/_datasources/i;

function collectErrorText(value: unknown, parts: string[], depth = 0): void {
  if (value == null || depth > 4) {
    return;
  }
  if (typeof value === 'string') {
    parts.push(value);
    return;
  }
  if (typeof value !== 'object') {
    return;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.message === 'string') {
    parts.push(record.message);
  }
  if (typeof record.path === 'string') {
    parts.push(record.path);
  }
  if (typeof record.error === 'string') {
    parts.push(record.error);
  } else if (record.error && typeof record.error === 'object') {
    collectErrorText(record.error, parts, depth + 1);
  }
  if (typeof record.body === 'string') {
    parts.push(record.body);
  } else if (record.body && typeof record.body === 'object' && record.body !== value) {
    collectErrorText(record.body, parts, depth + 1);
  }
}

export function extractErrorText(error: unknown): string {
  const parts: string[] = [];
  collectErrorText(error, parts);
  return parts.join(' ');
}

export function getHttpStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const record = error as Record<string, unknown>;
  const response = record.response as { status?: unknown } | undefined;
  const candidates = [response?.status, record.statusCode, record.status];
  if (record.body && typeof record.body === 'object') {
    candidates.push((record.body as Record<string, unknown>).statusCode);
  }
  const status = candidates.find((value) => typeof value === 'number');
  return typeof status === 'number' ? status : undefined;
}

export function isQueryDatasourcesUnavailable(error: unknown): boolean {
  const status = getHttpStatusCode(error);
  if (typeof status === 'number' && status !== 400) {
    return false;
  }
  const text = extractErrorText(error);
  return NO_HANDLER_PATTERN.test(text) && QUERY_DATASOURCES_PATH_PATTERN.test(text);
}
