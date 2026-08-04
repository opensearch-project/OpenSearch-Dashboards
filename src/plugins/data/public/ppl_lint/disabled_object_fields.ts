/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../core/public';

/** Read-only DSL mapping route (proxies `indices.getMapping`). */
const DSL_MAPPING_URL = '/api/directquery/dsl/indices.getFieldMapping';

/**
 * Walk an `indices.getMapping` response and collect the dotted names of object
 * fields mapped with `enabled: false`. Such objects are stored in `_source` but
 * never indexed, so every field beneath them silently resolves to null at query
 * time. The `enabled: false` attribute is stripped by `_field_caps` (so it never
 * appears in `indexPattern.fields`); it must be read from `_mappings` directly.
 *
 * Runs client-side on the response of the existing DSL mapping route, so no new
 * backend endpoint is needed. Only field names are derived — no other mapping
 * detail is retained.
 */
export function collectDisabledObjectFields(getMappingResponse: unknown): string[] {
  const names = new Set<string>();
  const body = (getMappingResponse as { body?: unknown })?.body ?? getMappingResponse;
  if (typeof body !== 'object' || body === null) {
    return [];
  }

  const walkProperties = (
    properties: Record<string, unknown> | undefined,
    prefix: string
  ): void => {
    if (!properties) {
      return;
    }
    for (const [name, rawDefinition] of Object.entries(properties)) {
      if (typeof rawDefinition !== 'object' || rawDefinition === null) {
        continue;
      }
      const definition = rawDefinition as {
        enabled?: boolean;
        properties?: Record<string, unknown>;
      };
      const path = prefix ? `${prefix}.${name}` : name;
      if (definition.enabled === false) {
        names.add(path);
        // The subtree is not indexed; no need to descend further.
        continue;
      }
      walkProperties(definition.properties, path);
    }
  };

  // Response shape: { [indexName]: { mappings: { properties: {...} } } }.
  for (const indexEntry of Object.values(body as Record<string, unknown>)) {
    const mappings = (indexEntry as { mappings?: { properties?: Record<string, unknown> } })
      ?.mappings;
    walkProperties(mappings?.properties, '');
  }

  return [...names];
}

/**
 * Best-effort fetch of the object fields mapped `enabled: false` for an index
 * pattern. The attribute is stripped by `_field_caps` (so it never appears in
 * `indexPattern.fields`) and must be read from `_mappings`. Rather than a
 * dedicated endpoint, this calls the existing read-only DSL mapping route and
 * walks the response client-side via {@link collectDisabledObjectFields}.
 * Returns undefined on any failure (or when no disabled fields are found) so the
 * `enabled-false-object` rule self-suppresses rather than false-firing. Shared
 * by both PPL editor hosts; callers gate on `http` presence externally (mirrors
 * `fetchVisibleIndices`).
 */
export async function fetchDisabledObjectFields(
  http: HttpSetup,
  indexPattern: { title?: string; dataSourceRef?: { id?: string } }
): Promise<Set<string> | undefined> {
  const pattern = indexPattern.title;
  if (!pattern) {
    return undefined;
  }
  try {
    const mdsId = indexPattern.dataSourceRef?.id;
    const url = mdsId
      ? `${DSL_MAPPING_URL}/dataSourceMDSId=${encodeURIComponent(mdsId)}`
      : DSL_MAPPING_URL;
    const resp = await http.get(url, { query: { index: pattern } });
    const fields = collectDisabledObjectFields(resp);
    return fields.length > 0 ? new Set(fields) : undefined;
  } catch {
    return undefined;
  }
}
