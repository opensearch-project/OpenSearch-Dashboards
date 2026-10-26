/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useState } from 'react';
import { ExploreServices } from '../../../../types';
import { ClassificationResult, IndexClassification } from '../types';
import { detectSeverityField, pickTimeField } from '../severity';
import { fetchTimestampField, getDataSourceEngineKind } from '../serverless';

/**
 * Lazily classifies an index as time-based (logs) vs no-time-field by fetching its fields
 * (`getFieldsForWildcard` → server `_field_caps`) and looking for a `date` field. Classifying
 * every index up front would be one field-caps request per index — a request storm on large
 * clusters — so we classify on demand (hover/selection) and cache the result. While a fetch is
 * in flight the row reports CLASSIFYING (a real spinner); before any fetch it reports UNKNOWN
 * (no badge), never a false "Classifying…" label.
 *
 * On OpenSearch Serverless, every time-series index has an `index.timestamp_field` (`@timestamp` by
 * default, or a custom field set at creation) that each document must carry and that the index is
 * sorted on. For index rows it is read alongside the fields and preferred as the time field, and
 * it keeps an index time-based even if the field fetch fails or returns no date field. It is also
 * tried when the data source has no saved engine type. Dataset rows skip it: a dataset keeps its
 * own saved time field.
 */

/** Whether a classification is for an index row or a dataset row (datasets skip time-field work). */
export type ClassifyKind = 'index' | 'dataset';
export const useIndexClassification = (services: ExploreServices, dataSourceId?: string) => {
  const cacheRef = useRef<Map<string, ClassificationResult>>(new Map());
  const inFlightRef = useRef<Set<string>>(new Set());
  const [, force] = useState(0);

  const keyFor = useCallback(
    (indexName: string, kind: ClassifyKind = 'index') =>
      `${dataSourceId ?? ''}::${kind}::${indexName}`,
    [dataSourceId]
  );

  const classify = useCallback(
    async (indexName: string, kind: ClassifyKind = 'index'): Promise<ClassificationResult> => {
      const cacheKey = keyFor(indexName, kind);
      const cached = cacheRef.current.get(cacheKey);
      if (cached) return cached;
      if (inFlightRef.current.has(cacheKey))
        return { classification: IndexClassification.CLASSIFYING };

      // MDS-only: field resolution must target an explicit data source. A bare `getFieldsForWildcard`
      // (no data source id) targets the local cluster, which does not exist under MDS (e.g. Neo) and
      // 500s on an unconfigured client. With no data source we can't classify — cache/return
      // NO_TIME_FIELD (same shape as the failure path) without issuing the request.
      if (!dataSourceId) {
        const result: ClassificationResult = {
          classification: IndexClassification.NO_TIME_FIELD,
        };
        cacheRef.current.set(cacheKey, result);
        return result;
      }

      inFlightRef.current.add(cacheKey);
      force((n) => n + 1);
      // Runs in parallel with the field fetch. Only serverless indexes have the setting; data sources
      // with no saved engine type are tried too, other engines are skipped.
      const timestampFieldPromise: Promise<string | undefined> =
        kind === 'index'
          ? getDataSourceEngineKind(services, dataSourceId).then((engine) =>
              engine === 'other'
                ? undefined
                : fetchTimestampField(services, dataSourceId, indexName)
            )
          : Promise.resolve(undefined);
      try {
        const [fieldsResult, timestampField] = await Promise.all([
          services.indexPatterns.getFieldsForWildcard({ pattern: indexName, dataSourceId }).then(
            (fields: Array<{ name: string; type: string }>) => ({ fields }),
            (error: unknown) => ({ error })
          ),
          timestampFieldPromise,
        ]);
        // The field fetch failed or found no date field, but the serverless timestamp field is
        // known: the index is still time-based (it is mapped as a date on every such index).
        const timestampOnly: ClassificationResult | undefined = timestampField
          ? {
              classification: IndexClassification.TIME_BASED,
              timeFieldName: timestampField,
              dateFields: [timestampField],
            }
          : undefined;
        if ('error' in fieldsResult) {
          if (!timestampOnly) throw fieldsResult.error;
          cacheRef.current.set(cacheKey, timestampOnly);
          return timestampOnly;
        }
        const fields = fieldsResult.fields;
        const dateFields = fields
          .filter((field: { type: string }) => field.type === 'date')
          .map((field: { name: string }) => field.name);
        // Severity/level fields are keyword-typed, so detect over ALL field names (not dateFields).
        const severityField = detectSeverityField(
          fields.map((field: { name: string }) => field.name)
        );
        const result: ClassificationResult = dateFields.length
          ? {
              classification: IndexClassification.TIME_BASED,
              // The serverless timestamp field wins; otherwise prefer the canonical OTel/PPL
              // timestamp order, not an arbitrary first date field.
              timeFieldName: pickTimeField(dateFields, timestampField),
              dateFields,
              severityField,
            }
          : timestampOnly
            ? { ...timestampOnly, severityField }
            : { classification: IndexClassification.NO_TIME_FIELD, dateFields: [], severityField };
        cacheRef.current.set(cacheKey, result);
        return result;
      } catch {
        // On failure, treat as no-time-field so the preview still degrades gracefully.
        const result: ClassificationResult = {
          classification: IndexClassification.NO_TIME_FIELD,
        };
        cacheRef.current.set(cacheKey, result);
        return result;
      } finally {
        inFlightRef.current.delete(cacheKey);
        force((n) => n + 1);
      }
    },
    [services, dataSourceId, keyFor]
  );

  const getCached = useCallback(
    (indexName: string, kind: ClassifyKind = 'index'): ClassificationResult | undefined =>
      cacheRef.current.get(keyFor(indexName, kind)),
    [keyFor]
  );

  /** Classification for display: resolved result, an in-flight spinner, or UNKNOWN (no badge). */
  const getStatus = useCallback(
    (indexName: string, kind: ClassifyKind = 'index'): IndexClassification => {
      const cacheKey = keyFor(indexName, kind);
      const cached = cacheRef.current.get(cacheKey);
      if (cached) return cached.classification;
      if (inFlightRef.current.has(cacheKey)) return IndexClassification.CLASSIFYING;
      return IndexClassification.UNKNOWN;
    },
    [keyFor]
  );

  return { classify, getCached, getStatus };
};
