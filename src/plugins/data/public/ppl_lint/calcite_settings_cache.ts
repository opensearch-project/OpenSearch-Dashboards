/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../core/public';

export interface CalciteSettings {
  calciteEnabled: boolean;
  allJoinTypesAllowed: boolean;
}

const CALCITE_SETTINGS_ENDPOINT = '/api/enhancements/ppl/calcite_settings';

/**
 * Per-dataSourceId cache for Calcite cluster settings with in-flight request
 * deduplication. Provides a synchronous `getCached()` for the lint context builder
 * and an async `warmUp()` to trigger background fetching.
 *
 * Not gated on the runtimePplGrammar flag because compiled-surface lint can still
 * emit `disabled-join-type` warnings that depend on `allJoinTypesAllowed`.
 */
class CalciteSettingsCache {
  private cache: Map<string, CalciteSettings> = new Map();
  private inFlight: Map<string, Promise<CalciteSettings | null>> = new Map();
  private listeners: Set<(event: { dataSourceId?: string }) => void> = new Set();

  getCached(dataSourceId?: string): CalciteSettings | undefined {
    return this.cache.get(dataSourceId ?? '');
  }

  warmUp(http: HttpSetup, dataSourceId?: string): void {
    const key = dataSourceId ?? '';
    if (this.cache.has(key) || this.inFlight.has(key)) {
      return;
    }

    const promise = this.doFetch(http, dataSourceId);
    this.inFlight.set(key, promise);

    promise
      .then((settings) => {
        if (settings) {
          this.cache.set(key, settings);
          this.notifyListeners(dataSourceId);
        }
      })
      .catch(() => {
        // Swallow — the lint system fails safe (settings undefined = strict defaults).
      })
      .finally(() => {
        if (this.inFlight.get(key) === promise) {
          this.inFlight.delete(key);
        }
      });
  }

  invalidate(dataSourceId?: string): void {
    this.cache.delete(dataSourceId ?? '');
  }

  subscribe(listener: (event: { dataSourceId?: string }) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    this.cache.clear();
    this.inFlight.clear();
    this.listeners.clear();
  }

  private async doFetch(http: HttpSetup, dataSourceId?: string): Promise<CalciteSettings | null> {
    try {
      const query: Record<string, string> = {};
      if (dataSourceId) {
        query.dataSourceId = dataSourceId;
      }

      const response = await http.get<CalciteSettings>(CALCITE_SETTINGS_ENDPOINT, { query });
      if (
        response &&
        typeof response.calciteEnabled === 'boolean' &&
        typeof response.allJoinTypesAllowed === 'boolean'
      ) {
        return response;
      }
      return null;
    } catch {
      return null;
    }
  }

  private notifyListeners(dataSourceId?: string): void {
    for (const listener of this.listeners) {
      try {
        listener({ dataSourceId });
      } catch {
        // A failing listener must not affect others.
      }
    }
  }
}

export const calciteSettingsCache = new CalciteSettingsCache();
