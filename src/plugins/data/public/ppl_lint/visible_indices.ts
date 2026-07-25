/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../core/public';

interface ResolveIndexResponse {
  indices?: Array<{ name: string }>;
  aliases?: Array<{ name: string }>;
  data_streams?: Array<{ name: string }>;
}

/**
 * Above this many visible indices the helper returns an empty list, which keeps
 * `wildcard-source-zero-match` dormant rather than shipping a huge name set to
 * the lint engine on every keystroke. A future per-pattern narrowing query can
 * lift this for very large clusters.
 */
const MAX_VISIBLE_INDICES = 5000;

/**
 * Fetch the names of indices, aliases, and data streams the caller can see, for
 * the `wildcard-source-zero-match` lint rule. Mirrors `fetchIndices` in
 * `dataset_service/lib/index_type.ts`: same read-only `resolve_index` route and
 * the same response flattening, but returns a flat sorted name list. Returns an
 * empty list on any failure (and on oversized clusters) so the rule
 * self-suppresses rather than false-firing.
 */
export async function fetchVisibleIndices(
  http: HttpSetup,
  dataSourceId?: string
): Promise<string[]> {
  try {
    const query: Record<string, string> = {};
    if (dataSourceId) {
      query.data_source = dataSourceId;
    }
    const response = await http.get<ResolveIndexResponse>(
      '/internal/index-pattern-management/resolve_index/*',
      { query }
    );
    if (!response) {
      return [];
    }
    const names: string[] = [];
    response.indices?.forEach((i) => names.push(i.name));
    response.aliases?.forEach((a) => names.push(a.name));
    response.data_streams?.forEach((d) => names.push(d.name));
    if (names.length > MAX_VISIBLE_INDICES) {
      return [];
    }
    return names.sort();
  } catch {
    return [];
  }
}
