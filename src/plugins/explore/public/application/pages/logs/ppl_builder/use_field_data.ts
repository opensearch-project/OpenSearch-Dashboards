/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { fetchColumnValues } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { useDatasetContext } from '../../../context';

interface FieldInfo {
  name: string;
  type?: string;
  aggregatable?: boolean;
}

export const useFieldData = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { dataset } = useDatasetContext();

  const fields = useMemo<FieldInfo[]>(() => {
    const all = (dataset as any)?.fields?.getAll?.() ?? [];
    const named = all.filter((f: any) => f?.name && !f.name.startsWith('_') && !f.subType);
    return named.map((f: any) => ({ name: f.name, type: f.type, aggregatable: f.aggregatable }));
  }, [dataset]);

  const fieldNames = useMemo<string[]>(() => fields.map((f) => f.name), [fields]);

  const numericAndAggregatableNames = useMemo<string[]>(
    () => fields.filter((f) => f.type === 'number' || f.aggregatable).map((f) => f.name),
    [fields]
  );

  const numericFieldNames = useMemo<string[]>(
    () => fields.filter((f) => f.type === 'number').map((f) => f.name),
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
