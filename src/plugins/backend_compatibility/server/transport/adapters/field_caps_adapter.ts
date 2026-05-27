/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BackendInfo } from '../types';
import { isPlainObject, extractQueryString } from './normalization_utils';

export function translateRequest(params: any, backend: BackendInfo): any {
  const existing = extractQueryString(params);
  const qs = { ...existing };
  delete qs.include_unmapped;

  let body = params.body;
  // Only transform body if it's a plain object (not pre-serialized string)
  if (isPlainObject(body)) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { index_filter, runtime_mappings, ...restBody } = body;
    body = Object.keys(restBody).length > 0 ? restBody : undefined;
  }

  return { ...params, querystring: qs, body };
}

export function translateResponse(response: any, backend: BackendInfo): any {
  const body = response?.body || response;
  if (!body?.fields) return response;

  for (const fieldTypes of Object.values(body.fields)) {
    if (fieldTypes && typeof fieldTypes === 'object') {
      for (const capability of Object.values(fieldTypes as any)) {
        if (capability && typeof capability === 'object') {
          (capability as any).metadata_field = false;
        }
      }
    }
  }

  return response;
}
