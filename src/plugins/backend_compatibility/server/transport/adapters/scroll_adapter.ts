/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BackendInfo } from '../types';
import { normalizeTotalHits, synthesizeSeqNo } from './normalization_utils';

export function translateRequest(params: any, backend: BackendInfo): any {
  return params;
}

export function translateResponse(response: any, backend: BackendInfo): any {
  const body = response?.body || response;
  if (!body?.hits) return response;

  body.hits.total = normalizeTotalHits(body.hits.total);

  if (Array.isArray(body.hits.hits)) {
    body.hits.hits = body.hits.hits.map((hit: any) => {
      if (!hit) return hit;
      const { _type, ...rest } = hit;
      synthesizeSeqNo(rest);
      return rest;
    });
  }

  return response;
}
