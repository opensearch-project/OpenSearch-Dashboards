/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../core/public';
import { PPL_PATTERNS_WITHOUT_MODE_REGEX, PPLPatternsMode } from '../../common/ppl';

const PATTERN_MODE_SETTINGS_ENDPOINT = '/api/enhancements/ppl/pattern_mode_settings';

interface PatternModeSettingsResponse {
  patternMode?: string;
  patternModeMeasured?: boolean;
}

/**
 * Per-dataSourceId cache of the cluster's default PPL `patterns` mode (`plugins.ppl.pattern.mode`),
 * with in-flight request deduplication. Query analysis is synchronous, so callers `ensure()` the
 * value before analyzing a query and then read it with `getCached()`.
 *
 * A failed or unmeasured read is cached as unknown, so a cluster that denies the settings read isn't
 * asked again on every query; the trait checks treat unknown conservatively.
 */
class PatternsModeCache {
  private cache: Map<string, PPLPatternsMode | undefined> = new Map();
  private inFlight: Map<string, Promise<PPLPatternsMode | undefined>> = new Map();

  /** The cached default mode, or undefined when unknown or not fetched yet. */
  getCached(dataSourceId?: string): PPLPatternsMode | undefined {
    return this.cache.get(dataSourceId ?? '');
  }

  /**
   * Whether {@link ensure} would have to fetch: `maskedQuery` has a `patterns` command without an
   * explicit `mode=` and the data source's default mode isn't cached or in flight yet. Lets callers
   * that must stay synchronous on the common path await `ensure` only when it does work.
   */
  needsFetch(maskedQuery: string, dataSourceId?: string): boolean {
    return PPL_PATTERNS_WITHOUT_MODE_REGEX.test(maskedQuery) && !this.cache.has(dataSourceId ?? '');
  }

  /**
   * Fetches the default mode for the data source if `maskedQuery` has a `patterns` command without
   * an explicit `mode=` (the only case the setting decides) and it isn't cached yet. Resolves to the
   * cached value; never rejects. `maskedQuery` must have quoted strings and bracketed subqueries
   * masked, so a `patterns` inside them doesn't trigger a request.
   */
  ensure(
    http: HttpSetup,
    maskedQuery: string,
    dataSourceId?: string
  ): Promise<PPLPatternsMode | undefined> {
    const key = dataSourceId ?? '';
    if (!PPL_PATTERNS_WITHOUT_MODE_REGEX.test(maskedQuery) || this.cache.has(key)) {
      return Promise.resolve(this.cache.get(key));
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending;
    }

    const promise = this.doFetch(http, dataSourceId).then((mode) => {
      this.cache.set(key, mode);
      return mode;
    });
    this.inFlight.set(key, promise);
    promise.finally(() => {
      if (this.inFlight.get(key) === promise) {
        this.inFlight.delete(key);
      }
    });
    return promise;
  }

  invalidate(dataSourceId?: string): void {
    this.cache.delete(dataSourceId ?? '');
  }

  dispose(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  private async doFetch(
    http: HttpSetup,
    dataSourceId?: string
  ): Promise<PPLPatternsMode | undefined> {
    try {
      const query: Record<string, string> = {};
      if (dataSourceId) {
        query.dataSourceId = dataSourceId;
      }
      const response = await http.get<PatternModeSettingsResponse>(PATTERN_MODE_SETTINGS_ENDPOINT, {
        query,
      });
      if (
        response?.patternModeMeasured === true &&
        (response.patternMode === 'label' || response.patternMode === 'aggregation')
      ) {
        return response.patternMode;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}

export const patternsModeCache = new PatternsModeCache();
