/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../core/public';

/**
 * Path of the chat plugin's per-data-source AI-agent availability probe. Kept as
 * a literal (the chat plugin exposes no shared constant) so the data plugin need
 * not depend on chat; it only performs a read-only GET, like `fetchVisibleIndices`.
 */
const AGENT_AVAILABLE_API = '/api/chat/agent_available';

/** Probe answer. `available` is the only field the caller acts on. */
interface AgentAvailableResponse {
  available: boolean;
  reason?: string;
}

/**
 * Resolve whether the AI lint-fix agent is actually reachable for a data source,
 * with per-source caching so the network probe runs at most once per source (and
 * once more only if the cache is cleared). Mirrors the query-assist
 * `getAvailableLanguagesForDataSource` helper: an in-flight map dedupes
 * concurrent callers, and a resolved map memoizes the answer.
 *
 * The AI lint-fix availability question is per-cluster because the fix executes
 * against the SELECTED data source's ML Commons agent, while the button-level
 * gates (`enableAIFeatures`, `chat.isAvailable()`) are deployment-global. Feeding
 * this per-source answer into the lint context lets the "Ask AI to fix" action
 * toggle when the user switches clusters.
 *
 * Fails OPEN: any transport error resolves to `true` for the caller. The server
 * route already returns `available:true` for the external AG-UI path and for
 * transient probe errors; this catch only covers the request itself failing
 * (offline, 4xx from the router, abort, etc.). We never want a probe failure to
 * hide a button the existing checks would otherwise show — the runtime error path
 * stays the honest backstop.
 *
 * A failed probe is NOT a measurement, so it is never written to the cache: the
 * caller sees `true`, but the next call re-probes rather than pinning a fail-open
 * guess for the whole tab. Only a real answer (available true/false) is memoized.
 */
const [getAiAgentAvailableForDataSource, clearAiAgentAvailabilityCache] = (() => {
  const availabilityByDataSource: Map<string | undefined, boolean> = new Map();
  const pendingRequests: Map<string | undefined, Promise<boolean | undefined>> = new Map();

  return [
    async (http: HttpSetup, dataSourceId: string | undefined, timeout?: number) => {
      const cached = availabilityByDataSource.get(dataSourceId);
      if (cached !== undefined) return cached;

      const pendingRequest = pendingRequests.get(dataSourceId);
      // A deduped concurrent caller must also fail open: an unmeasured `undefined`
      // means the probe errored, not that the agent is unavailable.
      if (pendingRequest !== undefined) return (await pendingRequest) ?? true;

      const controller = timeout ? new AbortController() : undefined;
      const timeoutId = timeout ? setTimeout(() => controller?.abort(), timeout) : undefined;

      // `undefined` = unmeasured (offline / OSD 5xx / abort), NOT a measured
      // "available". Only a real answer is cached; an unmeasured result still
      // fails open to the caller but leaves the cache empty so the next call
      // re-probes rather than pinning a guess for the whole tab.
      const availabilityPromise: Promise<boolean | undefined> = http
        .get<AgentAvailableResponse>(AGENT_AVAILABLE_API, {
          query: dataSourceId ? { dataSourceId } : {},
          signal: controller?.signal,
        })
        .then((response) => response?.available !== false)
        .catch(() => undefined)
        .finally(() => {
          pendingRequests.delete(dataSourceId);
          if (timeoutId) clearTimeout(timeoutId);
        });

      pendingRequests.set(dataSourceId, availabilityPromise);

      const measured = await availabilityPromise;
      if (measured !== undefined) {
        availabilityByDataSource.set(dataSourceId, measured);
      }
      return measured ?? true;
    },
    () => {
      availabilityByDataSource.clear();
      pendingRequests.clear();
    },
  ] as const;
})();

export { getAiAgentAvailableForDataSource, clearAiAgentAvailabilityCache };
