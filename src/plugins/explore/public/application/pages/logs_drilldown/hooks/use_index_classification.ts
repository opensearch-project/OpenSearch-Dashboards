/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useState } from 'react';
import { ExploreServices } from '../../../../types';
import { ClassificationResult, IndexClassification } from '../types';
import { detectSeverityField, pickTimeField } from '../severity';

/**
 * Lazily classifies an index as time-based (logs) vs no-time-field by fetching its fields
 * (`getFieldsForWildcard` → server `_field_caps`) and looking for a `date` field. Classifying
 * every index up front would be one field-caps request per index — a request storm on large
 * clusters — so we classify on demand (hover/selection) and cache the result. While a fetch is
 * in flight the row reports CLASSIFYING (a real spinner); before any fetch it reports UNKNOWN
 * (no badge), never a false "Classifying…" label.
 */
export const useIndexClassification = (services: ExploreServices, dataSourceId?: string) => {
  const cacheRef = useRef<Map<string, ClassificationResult>>(new Map());
  const inFlightRef = useRef<Set<string>>(new Set());
  const [, force] = useState(0);

  const keyFor = useCallback(
    (indexName: string) => `${dataSourceId ?? ''}::${indexName}`,
    [dataSourceId]
  );

  const classify = useCallback(
    async (indexName: string): Promise<ClassificationResult> => {
      const cacheKey = keyFor(indexName);
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
      try {
        const fields = await services.indexPatterns.getFieldsForWildcard({
          pattern: indexName,
          dataSourceId,
        });
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
              // Prefer the canonical OTel/PPL timestamp order, not an arbitrary first date field.
              timeFieldName: pickTimeField(dateFields),
              dateFields,
              severityField,
            }
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
    (indexName: string): ClassificationResult | undefined =>
      cacheRef.current.get(keyFor(indexName)),
    [keyFor]
  );

  /** Classification for display: resolved result, an in-flight spinner, or UNKNOWN (no badge). */
  const getStatus = useCallback(
    (indexName: string): IndexClassification => {
      const cacheKey = keyFor(indexName);
      const cached = cacheRef.current.get(cacheKey);
      if (cached) return cached.classification;
      if (inFlightRef.current.has(cacheKey)) return IndexClassification.CLASSIFYING;
      return IndexClassification.UNKNOWN;
    },
    [keyFor]
  );

  return { classify, getCached, getStatus };
};
