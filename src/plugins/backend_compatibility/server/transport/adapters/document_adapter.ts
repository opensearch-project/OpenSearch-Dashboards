/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BackendInfo, DEFAULT_DOCUMENT_TYPE } from '../types';
import { isPlainObject, synthesizeSeqNo, extractQueryString } from './normalization_utils';

/** Bulk action verbs used in bulk request/response processing */
const DOC_ACTIONS = ['index', 'create', 'update', 'delete'] as const;

/**
 * ES 6.x doesn't support if_seq_no/if_primary_term — stripping disables OCC.
 * We can't convert to _version because migration reindexing resets _version to 1.
 */
function stripSeqNoFromQuerystring(
  qs: Record<string, any> | undefined
): Record<string, any> | undefined {
  if (!qs) return qs;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { if_seq_no, if_primary_term, ...rest } = qs;
  return rest;
}

export function translateBulkRequest(params: any, backend: BackendInfo): any {
  // opensearch-js passes bulk data as bulkBody (for NDJSON serialization) or body
  const source = Array.isArray(params.bulkBody)
    ? params.bulkBody
    : Array.isArray(params.body)
    ? params.body
    : null;
  if (!source) return params;

  const transformed = source.map((item: any) => {
    if (!item || typeof item !== 'object') return item;
    for (const action of DOC_ACTIONS) {
      if (action in item) {
        const meta = { ...item[action] };
        if (!meta._type && !meta.type) {
          meta._type = DEFAULT_DOCUMENT_TYPE;
        }
        delete meta.if_seq_no;
        delete meta.if_primary_term;
        return { [action]: meta };
      }
    }
    return item;
  });
  return {
    ...params,
    body: undefined,
    bulkBody: transformed,
    querystring: stripSeqNoFromQuerystring(params.querystring),
  };
}

export function translateCreateRequest(params: any, backend: BackendInfo): any {
  const newPath = params.path.replace('/_create', '/_doc');
  const existing = extractQueryString(params);
  const qs = stripSeqNoFromQuerystring({ ...existing, op_type: 'create' });
  return { ...params, path: newPath, querystring: qs };
}

export function translateDocRequest(params: any, backend: BackendInfo): any {
  const qs = stripSeqNoFromQuerystring(params.querystring);
  let { path } = params;

  // /{index}/_update/{id} → /{index}/_doc/{id}/_update
  const updateMatch = path.match(/^(\/[^/]+)\/_update\/(.+)$/);
  if (updateMatch) {
    path = `${updateMatch[1]}/_doc/${updateMatch[2]}/_update`;
    if (qs) {
      delete qs._source_include;
      delete qs._source_exclude;
      delete qs._source_includes;
      delete qs._source_excludes;
    }
  }

  return { ...params, path, querystring: qs };
}

export function translateMgetRequest(params: any, backend: BackendInfo): any {
  if (!isPlainObject(params.body) || !params.body.docs) {
    return params;
  }
  const docs = params.body.docs.map((doc: any) => ({
    ...doc,
    _type: doc._type || DEFAULT_DOCUMENT_TYPE,
  }));
  return { ...params, body: { ...params.body, docs } };
}

export function translateDeleteByQueryRequest(params: any, backend: BackendInfo): any {
  return { ...params, querystring: stripSeqNoFromQuerystring(params.querystring) };
}

export function translateResponse(response: any, backend: BackendInfo): any {
  const body = response?.body || response;
  if (!body || typeof body !== 'object') return response;

  if (body._id !== undefined) normalizeDocResponse(body);

  if (Array.isArray(body.items)) {
    body.items.forEach((item: any) => {
      if (!item || typeof item !== 'object') return;
      for (const action of DOC_ACTIONS) {
        if (item[action]) normalizeDocResponse(item[action]);
      }
    });
  }

  if (Array.isArray(body.docs)) {
    body.docs.forEach((doc: any) => {
      if (doc && typeof doc === 'object' && !doc.error) normalizeDocResponse(doc);
    });
  }

  return response;
}

function normalizeDocResponse(doc: any): void {
  delete doc._type;
  synthesizeSeqNo(doc);
}
