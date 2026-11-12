/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PPL `source=` helpers shared by the PPL search interceptor (query_enhancements) and Explore.
 *
 * Both need the same answer to "does this query read an index that lacks the dataset's time
 * field?": the interceptor to decide whether injecting the date-picker `WHERE` clause and the
 * default time sort would break the query, Explore to decide whether to switch into
 * non-time-series mode. Keeping the decision here means the two cannot drift apart.
 */

/**
 * The fields of the selected dataset these helpers read. A structural subset of `Dataset`, so
 * either a `Dataset` or a hand-built object can be passed.
 */
export interface PPLSourceCheckDataset {
  title?: string;
  timeFieldName?: string;
  dataSource?: { id?: string };
}

/**
 * Extracts the index named after the first `source=` in a PPL query, stripped of surrounding
 * backticks/quotes. Returns `undefined` when no `source=` is found.
 *
 * Intentionally simple: it reads the first `source=` token only and does not resolve aliases or
 * handle multi-source/subquery forms. Aliases and cross-cluster names are resolved later by
 * {@link PPLSourceTimeFieldChecker}, which asks the cluster for the target's fields.
 */
export const extractPPLSourceIndex = (queryString: string): string | undefined => {
  const match = /\bsource\s*=\s*([`'"]?)([^\s`'"|,]+)\1/i.exec(queryString);
  return match?.[2];
};

/**
 * True when the query's `source=` names something the dataset title does not cover.
 *
 * The dataset title is treated as a comma-separated list of index patterns where `*` matches
 * anything (e.g. `logs-*` covers `source=logs-2026.10`); comparison is case-insensitive. Returns
 * `false` when either side is missing.
 *
 * A mismatch alone says nothing about the time field: `source=logs-b` on dataset `logs-a`, an
 * alias of the dataset's index, or `remote:logs` all differ by name yet usually carry the time
 * field. Use {@link PPLSourceTimeFieldChecker} for the decision; this is its cheap first gate.
 */
export const pplSourceDiffersFromDataset = (
  queryString: string,
  datasetTitle: string | undefined
): boolean => {
  const source = extractPPLSourceIndex(queryString);
  if (!source || !datasetTitle) return false;
  const target = source.toLowerCase();
  return !datasetTitle
    .split(',')
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean)
    .some((pattern) => {
      const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      return new RegExp(`^${escaped}$`).test(target);
    });
};

/** Fetches the field list of an index pattern (`source=` value) on a data source. */
export type PPLSourceFieldsResolver = (
  pattern: string,
  dataSourceId?: string
) => Promise<Array<{ name: string }> | undefined>;

// Bounded so a long session querying many ad-hoc sources can't grow the cache without limit.
const MAX_CACHED_SOURCES = 100;

/**
 * Decides whether a PPL query's `source=` target genuinely lacks the dataset's time field.
 *
 * - Source covered by the dataset title, or a dataset without a time field: `false`, with no
 *   request (the time filter applies as usual / there is nothing to filter on).
 * - Otherwise the target's fields are fetched once per (data source, source, time field) and the
 *   answer cached for the session: `true` only when the time field is not among them.
 * - A failed lookup (missing index, permissions, unsupported remote) resolves `false`, i.e.
 *   "apply the time filter" — the pre-existing behavior — and is not cached, so a later query
 *   retries.
 *
 * Mapping changes after the first answer (e.g. a time field later added to a lookup index) are
 * not picked up until reload; the cache is deliberately session-scoped to keep the per-query cost
 * at zero requests.
 */
export class PPLSourceTimeFieldChecker {
  private readonly resolved = new Map<string, boolean>();
  private readonly inflight = new Map<string, Promise<boolean>>();

  constructor(private readonly resolveFields: PPLSourceFieldsResolver) {}

  /**
   * Cache key for the check, or `undefined` when no check is needed (the answer is `false`).
   */
  private getCheckKey(
    queryString: string,
    dataset: PPLSourceCheckDataset | undefined
  ): { key: string; source: string } | undefined {
    const timeFieldName = dataset?.timeFieldName;
    if (!timeFieldName) return undefined;
    if (!pplSourceDiffersFromDataset(queryString, dataset?.title)) return undefined;
    const source = extractPPLSourceIndex(queryString)!;
    const key = [dataset?.dataSource?.id ?? '', source.toLowerCase(), timeFieldName].join('\u0000');
    return { key, source };
  }

  /**
   * Synchronous view of {@link sourceLacksTimeField}: the answer when it is known without a
   * request (no check needed, or already cached), `undefined` while it still has to be fetched.
   */
  public peek(
    queryString: string,
    dataset: PPLSourceCheckDataset | undefined
  ): boolean | undefined {
    const check = this.getCheckKey(queryString, dataset);
    if (!check) return false;
    return this.resolved.get(check.key);
  }

  /** Whether the query's source lacks the dataset's time field. Never rejects. */
  public async sourceLacksTimeField(
    queryString: string,
    dataset: PPLSourceCheckDataset | undefined
  ): Promise<boolean> {
    const check = this.getCheckKey(queryString, dataset);
    if (!check) return false;
    const { key, source } = check;

    const cached = this.resolved.get(key);
    if (cached !== undefined) return cached;

    const pending = this.inflight.get(key);
    if (pending) return pending;

    const timeFieldName = dataset!.timeFieldName!;
    const request = this.resolveFields(source, dataset?.dataSource?.id)
      .then((fields) => {
        // An unexpected shape is a failed lookup, not "no fields": fall through to applying.
        if (!Array.isArray(fields)) return false;
        const lacks = !fields.some((field) => field?.name === timeFieldName);
        this.remember(key, lacks);
        return lacks;
      })
      .catch(() => false)
      .finally(() => this.inflight.delete(key));

    this.inflight.set(key, request);
    return request;
  }

  private remember(key: string, value: boolean) {
    if (this.resolved.size >= MAX_CACHED_SOURCES) {
      // Map iterates in insertion order, so the first key is the oldest entry.
      const oldest = this.resolved.keys().next().value;
      if (oldest !== undefined) this.resolved.delete(oldest);
    }
    this.resolved.set(key, value);
  }
}

/** The part of the index patterns service the checker needs. */
export interface PPLSourceFieldsProvider {
  getFieldsForWildcard: (options: { pattern: string; dataSourceId?: string }) => Promise<any>;
}

const checkersByProvider = new WeakMap<PPLSourceFieldsProvider, PPLSourceTimeFieldChecker>();

/**
 * The checker for an index patterns service, created on first use. The interceptor and Explore
 * both pass the data plugin's `indexPatterns` start contract, so they share one cache: by the
 * time Explore renders results, the interceptor has usually already answered for that source.
 */
export const getPPLSourceTimeFieldChecker = (
  indexPatterns: PPLSourceFieldsProvider
): PPLSourceTimeFieldChecker => {
  let checker = checkersByProvider.get(indexPatterns);
  if (!checker) {
    checker = new PPLSourceTimeFieldChecker((pattern, dataSourceId) =>
      indexPatterns.getFieldsForWildcard({ pattern, dataSourceId })
    );
    checkersByProvider.set(indexPatterns, checker);
  }
  return checker;
};
