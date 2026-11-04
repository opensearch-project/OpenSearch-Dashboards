/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataView } from '../../../../../../data/common';
import type { SourceTypeVisualBuilder } from '../../../../services/source_type_registry';
import { fetchColumnValues } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { useDatasetContext } from '../../../context';

interface FieldInfo {
  name: string;
  type?: string;
  aggregatable?: boolean;
}

const NO_FIELDS: FieldInfo[] = [];

interface SourceFieldsOptions {
  /** The language's `getFields`, for fields the dataset doesn't list. */
  getFields?: SourceTypeVisualBuilder['getFields'];
  /** Changes each time a query finishes, to ask `getFields` again; null while one runs. */
  refreshKey?: string | null;
}

// The dataset's fields, then the source's extra ones. A source field fills in what the dataset's
// field of the same name lacks.
const mergeFields = (datasetFields: FieldInfo[], sourceFields: FieldInfo[]): FieldInfo[] => {
  if (sourceFields.length === 0) return datasetFields;
  const byName = new Map(datasetFields.map((f) => [f.name, f]));
  const merged = [...datasetFields];
  for (const field of sourceFields) {
    const existing = byName.get(field.name);
    if (!existing) {
      byName.set(field.name, field);
      merged.push(field);
    } else if (existing.type === undefined || existing.aggregatable === undefined) {
      const filled = {
        ...existing,
        type: existing.type ?? field.type,
        aggregatable: existing.aggregatable ?? field.aggregatable,
      };
      merged[merged.indexOf(existing)] = filled;
      byName.set(field.name, filled);
    }
  }
  return merged;
};

export const useFieldData = (
  datasetOverride?: DataView,
  { getFields, refreshKey }: SourceFieldsOptions = {}
) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { dataset: contextDataset } = useDatasetContext();
  const dataset = datasetOverride ?? contextDataset;

  const datasetFields = useMemo<FieldInfo[]>(() => {
    const all = (dataset as any)?.fields?.getAll?.() ?? [];
    const named = all.filter((f: any) => f?.name && !f.name.startsWith('_') && !f.subType);
    return named.map((f: any) => ({ name: f.name, type: f.type, aggregatable: f.aggregatable }));
  }, [dataset]);

  // Fields the source knows beyond the dataset's, asked for on open, on a dataset change and after
  // each query.
  const [sourceFields, setSourceFields] = useState<FieldInfo[]>(NO_FIELDS);
  // Read at call time, so a new services object alone doesn't ask again.
  const servicesRef = useRef(services);
  servicesRef.current = services;
  // Another dataset (or source) drops the last one's fields, so they never show on this one while
  // its own are asked for, or after asking fails. A new query on the same dataset keeps them.
  useEffect(() => {
    setSourceFields(NO_FIELDS);
  }, [getFields, dataset]);
  useEffect(() => {
    if (!getFields || refreshKey === null) return;
    const queryDataset = servicesRef.current.data?.query?.queryString?.getQuery?.()?.dataset;
    if (!queryDataset) return;
    let cancelled = false;
    getFields(queryDataset)
      .then((next) => {
        if (cancelled) return;
        setSourceFields(
          (next ?? [])
            .filter((f) => !!f?.name)
            .map((f) => ({ name: f.name, type: f.type, aggregatable: f.aggregatable }))
        );
      })
      .catch(() => {
        // Keep this dataset's fields from the last call; the dataset's own still show.
      });
    return () => {
      cancelled = true;
    };
  }, [getFields, refreshKey, dataset]);

  const fields = useMemo(
    () => mergeFields(datasetFields, sourceFields),
    [datasetFields, sourceFields]
  );

  const fieldNames = useMemo<string[]>(() => fields.map((f) => f.name), [fields]);

  // A field of unknown type (only a source's `getFields` can give one: a dataset's fields are
  // typed) may hold numbers, so it's offered for numeric aggregations too.
  const mayBeNumber = (f: FieldInfo) => f.type === 'number' || f.type === undefined;

  const numericAndAggregatableNames = useMemo<string[]>(
    () => fields.filter((f) => mayBeNumber(f) || f.aggregatable).map((f) => f.name),
    [fields]
  );

  const numericFieldNames = useMemo<string[]>(
    () => fields.filter(mayBeNumber).map((f) => f.name),
    [fields]
  );

  const timeFieldName = useMemo(() => (dataset as any)?.timeFieldName || '@timestamp', [dataset]);

  const fieldTypeByName = useMemo<Record<string, string | undefined>>(() => {
    const map: Record<string, string | undefined> = {};
    fields.forEach((f) => {
      map[f.name] = f.type;
    });
    return map;
  }, [fields]);

  const getFieldType = useCallback(
    (fieldName: string): string | undefined =>
      fieldTypeByName[fieldName] ?? fieldTypeByName[`${fieldName}.keyword`],
    [fieldTypeByName]
  );

  const groupByFieldNames = useMemo<string[]>(
    () => fields.filter((f) => f.type !== 'date').map((f) => f.name),
    [fields]
  );

  // Mirror the PPL code editor's value autocomplete via fetchColumnValues so the
  // builder surfaces the same values with the same limit and caching. A search
  // term narrows values server-side to reach beyond the cached top-N.
  const getValues = useCallback(
    async (fieldName: string, searchTerm?: string): Promise<string[]> => {
      const indexPattern = dataset as any;
      if (!indexPattern?.title) return [];
      try {
        // The DataView's `.type` is undefined for index patterns; the query
        // service dataset carries the SET_TYPE ('INDEX_PATTERN') fetchColumnValues
        // gates its live query on. Fall back to the DataView type.
        const datasetType =
          services.data?.query?.queryString?.getQuery?.()?.dataset?.type ?? indexPattern.type;
        const values = await fetchColumnValues(
          indexPattern.title,
          fieldName,
          services as any,
          indexPattern,
          datasetType,
          undefined,
          searchTerm
        );
        return (values || [])
          .filter((v: unknown) => v !== null && v !== undefined)
          .map((v: unknown) => String(v));
      } catch {
        return [];
      }
    },
    [services, dataset]
  );

  return {
    fields,
    fieldNames,
    numericAndAggregatableNames,
    numericFieldNames,
    groupByFieldNames,
    timeFieldName,
    getFieldType,
    getValues,
  };
};
