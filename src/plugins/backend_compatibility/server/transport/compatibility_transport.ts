/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transport } from '@opensearch-project/opensearch';
import { parse as parseQuerystring } from 'querystring';
import { BackendInfo } from './types';
import { detectBackend } from './backend_detector';
import * as searchAdapter from './adapters/search_adapter';
import * as documentAdapter from './adapters/document_adapter';
import * as mappingAdapter from './adapters/mapping_adapter';
import * as fieldCapsAdapter from './adapters/field_caps_adapter';
import * as scrollAdapter from './adapters/scroll_adapter';

const DETECTION_TIMEOUT_MS = 30000;
const MAX_DETECTION_ATTEMPTS = 3;
const DETECTION_RETRY_DELAYS_MS = [500, 1000, 2000];

interface RouteEntry {
  name: string;
  pattern: RegExp;
  guard?: (params: any) => boolean;
  request?: (params: any, backend: BackendInfo) => any;
  response?: (response: any, backend: BackendInfo) => any;
  es7Response?: (response: any, backend: BackendInfo) => any;
}

function stripTypeFromHits(response: any): any {
  const body = response?.body || response;
  if (body?.hits?.hits && Array.isArray(body.hits.hits)) {
    body.hits.hits = body.hits.hits.map((hit: any) => {
      if (!hit) return hit;
      const { _type, ...rest } = hit;
      return rest;
    });
  }
  return response;
}

function stripTypeFromMsearchHits(response: any): any {
  const body = response?.body || response;
  if (!body?.responses) return response;

  body.responses = body.responses.map((res: any) => {
    if (res?.hits?.hits && Array.isArray(res.hits.hits)) {
      res.hits.hits = res.hits.hits.map((hit: any) => {
        if (!hit) return hit;
        const { _type, ...rest } = hit;
        return rest;
      });
    }
    return res;
  });

  return response;
}

// ORDER MATTERS — more specific patterns must come before broader ones.
const ROUTE_TABLE: RouteEntry[] = [
  // ── Search ────────────────────────────────────────────────────────
  {
    name: 'scroll',
    pattern: /\/_search\/scroll(\/|$)/,
    request: scrollAdapter.translateRequest,
    response: scrollAdapter.translateResponse,
    es7Response: stripTypeFromHits,
  },
  {
    name: 'search',
    pattern: /\/_search(\/|$)/,
    request: searchAdapter.translateRequest,
    response: searchAdapter.translateResponse,
    es7Response: stripTypeFromHits,
  },
  {
    name: 'msearch',
    pattern: /\/_msearch(\/|$)/,
    request: searchAdapter.translateMsearchRequest,
    response: searchAdapter.translateMsearchResponse,
    es7Response: stripTypeFromMsearchHits,
  },

  // ── Documents ─────────────────────────────────────────────────────
  {
    name: 'bulk',
    pattern: /\/_bulk(\/|$)/,
    request: documentAdapter.translateBulkRequest,
    response: documentAdapter.translateResponse,
    es7Response: (res, backend) => documentAdapter.translateResponse(res, backend),
  },
  {
    name: 'create',
    pattern: /\/_create(\/|$)/,
    request: documentAdapter.translateCreateRequest,
    response: documentAdapter.translateResponse,
  },
  {
    name: 'mget',
    pattern: /\/_mget(\/|$)/,
    request: documentAdapter.translateMgetRequest,
    response: documentAdapter.translateResponse,
    es7Response: (res, backend) => documentAdapter.translateResponse(res, backend),
  },
  {
    name: 'delete_by_query',
    pattern: /\/_delete_by_query(\/|$)/,
    request: documentAdapter.translateDeleteByQueryRequest,
  },
  {
    name: 'doc_update',
    pattern: /\/_update(\/|$)/,
    request: documentAdapter.translateDocRequest,
    response: documentAdapter.translateResponse,
  },
  {
    name: 'doc_crud',
    pattern: /\/_doc(\/|$)/,
    request: documentAdapter.translateDocRequest,
    response: documentAdapter.translateResponse,
    es7Response: (res, backend) => documentAdapter.translateResponse(res, backend),
  },

  // ── Mappings ──────────────────────────────────────────────────────
  {
    name: 'mapping',
    pattern: /\/_mappings?(\/|$)/,
    request: mappingAdapter.translateRequest,
    response: mappingAdapter.translateResponse,
  },
  {
    name: 'index_create',
    pattern: /^\/[^/]+$/,
    guard: (params) => params.method === 'PUT' && !!params.body?.mappings,
    request: mappingAdapter.translateIndexCreateRequest,
  },
  {
    name: 'index_get',
    pattern: /^\/[^/]+$/,
    guard: (params) => params.method === 'GET',
    response: mappingAdapter.translateGetIndexResponse,
  },

  // ── Metadata ──────────────────────────────────────────────────────
  {
    name: 'field_caps',
    pattern: /\/_field_caps(\/|$)/,
    request: fieldCapsAdapter.translateRequest,
    response: fieldCapsAdapter.translateResponse,
  },
];

export class CompatibilityTransport extends Transport {
  static lastDetectedBackend: BackendInfo | null = null;

  private backend: BackendInfo | null = null;
  private detecting: Promise<void> | null = null;
  private detectionAttempts = 0;

  async request(params: any, options?: any): Promise<any> {
    await this.ensureBackendDetected(options);

    if (!this.backend || this.backend.distribution === 'opensearch') {
      return super.request(params, options);
    }

    if (this.backend.majorVersion >= 7) {
      const response = await super.request(params, options);
      return this.applyES7Response(params, response);
    }

    if (params.path?.includes('/_resolve/index')) {
      return this.handleResolveIndex(params, options);
    }

    return this.applyES6Request(params, options);
  }

  private async applyES6Request(params: any, options?: any): Promise<any> {
    const normalized = this.normalizeParams(params);
    const route = this.matchRoute(normalized);

    const translatedParams = route?.request ? route.request(normalized, this.backend!) : normalized;

    const response = await super.request(translatedParams, options);

    return route?.response ? route.response(response, this.backend!) : response;
  }

  // ── Route matching ──────────────────────────────────────────────────

  private matchRoute(params: any): RouteEntry | undefined {
    const { path } = params;
    if (!path) return undefined;

    for (const entry of ROUTE_TABLE) {
      if (entry.pattern.test(path)) {
        if (!entry.guard || entry.guard(params)) {
          return entry;
        }
      }
    }
    return undefined;
  }

  private applyES7Response(params: any, response: any): any {
    const { path } = params;
    if (!path) return response;

    for (const entry of ROUTE_TABLE) {
      if (entry.es7Response && entry.pattern.test(path)) {
        if (!entry.guard || entry.guard(params)) {
          return entry.es7Response(response, this.backend!);
        }
      }
    }
    return response;
  }

  // ── Backend detection ───────────────────────────────────────────────

  private async ensureBackendDetected(options?: any): Promise<void> {
    if (this.backend) return;
    if (this.detecting) {
      await this.detecting;
      return;
    }
    this.detecting = this.performDetection(options);
    await this.detecting;
    this.detecting = null;
  }

  private async performDetection(options?: any): Promise<void> {
    this.detectionAttempts++;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const detectionPromise = super.request({ method: 'GET', path: '/' }, options);

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Backend detection timed out after ${DETECTION_TIMEOUT_MS}ms`)),
          DETECTION_TIMEOUT_MS
        );
      });

      const response = await Promise.race([detectionPromise, timeoutPromise]);
      const info = response?.body || response;
      this.backend = detectBackend(info);
      CompatibilityTransport.lastDetectedBackend = this.backend;
    } catch (error) {
      if (this.detectionAttempts >= MAX_DETECTION_ATTEMPTS) {
        // eslint-disable-next-line no-console
        console.error(
          `[backend_compatibility] Failed to detect backend after ${MAX_DETECTION_ATTEMPTS} attempts. ` +
            `Falling back to OpenSearch pass-through. Last error: ${error}`
        );
        this.backend = {
          distribution: 'opensearch',
          version: '0.0.0',
          majorVersion: 0,
          minorVersion: 0,
          patchVersion: 0,
        };
      } else {
        const delay = DETECTION_RETRY_DELAYS_MS[this.detectionAttempts - 1] || 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // ── _resolve/index synthesis (ES 6.x) ──────────────────────────────

  private async handleResolveIndex(params: any, options?: any): Promise<any> {
    const pathMatch = params.path.match(/\/_resolve\/index\/(.+?)(?:\?|$)/);
    const pattern = pathMatch ? decodeURIComponent(pathMatch[1]) : '*';

    const [catIndicesRes, catAliasesRes] = await Promise.all([
      super
        .request(
          {
            method: 'GET',
            path: `/_cat/indices/${pattern}`,
            querystring: { format: 'json', h: 'index,status' },
          },
          options
        )
        .catch(() => ({ body: [] })),
      super
        .request(
          {
            method: 'GET',
            path: `/_cat/aliases/${pattern}`,
            querystring: { format: 'json', h: 'alias,index' },
          },
          options
        )
        .catch(() => ({ body: [] })),
    ]);

    const catIndices = catIndicesRes?.body || catIndicesRes || [];
    const catAliases = catAliasesRes?.body || catAliasesRes || [];

    const indices = Array.isArray(catIndices)
      ? catIndices.map((item: any) => ({ name: item.index, attributes: [item.status || 'open'] }))
      : [];

    const aliases = Array.isArray(catAliases)
      ? catAliases.map((item: any) => ({ name: item.alias, indices: [item.index] }))
      : [];

    return { body: { indices, aliases, data_streams: [] }, statusCode: 200 };
  }

  // ── Parameter normalization ─────────────────────────────────────────

  private normalizeParams(params: any): any {
    let path = params.path;
    let qs: Record<string, any> =
      typeof params.querystring === 'object' && params.querystring !== null
        ? { ...params.querystring }
        : {};

    if (path && path.includes('?')) {
      const idx = path.indexOf('?');
      const pathQs = parseQuerystring(path.substring(idx + 1));
      qs = { ...qs, ...pathQs };
      path = path.substring(0, idx);
    }

    // _source_includes → _source_include (ES 6.x name)
    if ('_source_includes' in qs) {
      qs._source_include = qs._source_includes;
      delete qs._source_includes;
    }
    if ('_source_excludes' in qs) {
      qs._source_exclude = qs._source_excludes;
      delete qs._source_excludes;
    }

    return { ...params, path, querystring: qs };
  }
}
