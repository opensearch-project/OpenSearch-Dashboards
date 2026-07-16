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

/**
 * Provides the current dataset's field list (for the search box and group-by
 * combobox) and lazy value suggestions for a field (for the search-box value
 * autocomplete).
 *
 * The resolved `DataView` comes from {@link useDatasetContext} (the same source
 * the histogram uses), NOT from `queryString.getQuery().dataset` — the latter is
 * a lightweight descriptor with no `fields`/`timeFieldName`, which is why field
 * and value suggestions were previously always empty. No new client — reuses
 * `data.autocomplete`.
 */
export const useFieldData = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { data } = services;
  const { dataset } = useDatasetContext();

  const fields = useMemo<FieldInfo[]>(() => {
    const all = (dataset as any)?.fields?.getAll?.() ?? [];
    const named = all.filter((f: any) => f?.name && !f.name.startsWith('_'));
    // Drop redundant `.keyword` multi-fields: when a text field `foo` exposes a
    // `foo.keyword` sibling, surfacing both in completions and field selectors
    // just doubles the list with an entry the base field already stands in for.
    // Only the base `foo` is kept; a `.keyword` field with no base sibling stays.
    const names = new Set<string>(named.map((f: any) => f.name));
    return named
      .filter((f: any) => !(f.name.endsWith('.keyword') && names.has(f.name.slice(0, -8))))
      .map((f: any) => ({ name: f.name, type: f.type, aggregatable: f.aggregatable }));
  }, [dataset]);

  const fieldNames = useMemo<string[]>(() => fields.map((f) => f.name), [fields]);

  // Fields the PPL `sort` command accepts. Excludes `.keyword` sub-fields: they
  // are keyword multi-fields (e.g. `machine.os.keyword` under the text field
  // `machine.os`), which the engine rejects as a sort target with an "Invalid
  // Query" AssertionError. The base field is the sortable form.
  const sortableFieldNames = useMemo<string[]>(
    () => fieldNames.filter((name) => !name.endsWith('.keyword')),
    [fieldNames]
  );

  // Any field usable as a `stats` argument (min/max/distinct_count/earliest/…).
  const numericAndAggregatableNames = useMemo<string[]>(
    () => fields.filter((f) => f.type === 'number' || f.aggregatable).map((f) => f.name),
    [fields]
  );

  // Numeric-only fields, for aggregations that require a number (avg/sum/…).
  // A text field such as `referer` is aggregatable (via its keyword sibling) but
  // averaging it is meaningless, so it is excluded here.
  const numericFieldNames = useMemo<string[]>(
    () => fields.filter((f) => f.type === 'number').map((f) => f.name),
    [fields]
  );

  const timeFieldName = useMemo(() => (dataset as any)?.timeFieldName || '@timestamp', [dataset]);

  // Group-by field options: every field EXCEPT date-typed ones. Grouping by a
  // raw timestamp is a code-mode operation — in the builder, time grouping is
  // the "over time" entry (a `span(…)` on the dataset's designated time field),
  // so a bare date field never appears in the field list and the ambiguity of
  // "group by @timestamp — exact values or buckets?" has no surface to exist on.
  const groupByFieldNames = useMemo<string[]>(
    () => fields.filter((f) => f.type !== 'date').map((f) => f.name),
    [fields]
  );

  /**
   * Fetch value suggestions for a field. Resolves to display strings (best
   * effort — an unknown field or a failed request yields an empty list). Tries
   * the `.keyword` sibling first since that is what carries aggregatable values.
   */
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
    getValues,
  };
};
