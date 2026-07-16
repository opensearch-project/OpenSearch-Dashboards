/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
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
  const { data } = services;
  const { dataset } = useDatasetContext();

  const fields = useMemo<FieldInfo[]>(() => {
    const all = (dataset as any)?.fields?.getAll?.() ?? [];
    const named = all.filter((f: any) => f?.name && !f.name.startsWith('_'));
    const names = new Set<string>(named.map((f: any) => f.name));
    return named
      .filter((f: any) => !(f.name.endsWith('.keyword') && names.has(f.name.slice(0, -8))))
      .map((f: any) => ({ name: f.name, type: f.type, aggregatable: f.aggregatable }));
  }, [dataset]);

  const fieldNames = useMemo<string[]>(() => fields.map((f) => f.name), [fields]);

  const sortableFieldNames = useMemo<string[]>(
    () => fieldNames.filter((name) => !name.endsWith('.keyword')),
    [fieldNames]
  );

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

  const getValues = useCallback(
    async (fieldName: string): Promise<string[]> => {
      const indexPattern = dataset as any;
      if (!indexPattern || !data.autocomplete?.getValueSuggestions) return [];
      const field =
        indexPattern.fields?.getByName?.(`${fieldName}.keyword`) ||
        indexPattern.fields?.getByName?.(fieldName);
      if (!field) return [];
      try {
        const suggestions = await data.autocomplete.getValueSuggestions({
          indexPattern,
          field,
          query: '',
        });
        return (suggestions || [])
          .filter((s: unknown) => s !== null && s !== undefined)
          .map((s: unknown) => String(s));
      } catch {
        return [];
      }
    },
    [data, dataset]
  );

  return {
    fields,
    fieldNames,
    sortableFieldNames,
    numericAndAggregatableNames,
    numericFieldNames,
    groupByFieldNames,
    timeFieldName,
    getFieldType,
    getValues,
  };
};
