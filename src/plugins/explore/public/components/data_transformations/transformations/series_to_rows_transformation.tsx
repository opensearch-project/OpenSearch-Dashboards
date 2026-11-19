/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
// import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/utils';
import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/types';
import {
  FieldSchema,
  MultiSeriesTransformationInstance,
  NormalizedRow,
  SeriesExecutionResult,
  TransformationConfigSchema,
  TransformationDefinition,
  TransformationIssue,
} from '../types';
import { uniqueFieldName } from '../merge_series';
import {
  combinedRefId,
  findTimeField,
  mergeDisplayNames,
  numericalFields,
  skippedSeriesResult,
  stringFields,
} from './series_utils';

type SeriesToRowsConfig = Record<string, never>;

export const METRIC_FIELD = 'Metric';
export const VALUE_FIELD = 'Value';

const SeriesToRowsEditor = () => (
  <EuiText size="s" color="subdued" data-test-subj="seriesToRowsTransformationHelp">
    {i18n.translate('explore.transformations.seriesToRows.help', {
      defaultMessage:
        "Every numeric value becomes a Time / Metric / Value row. Metric is the row's text fields (e.g. a series name), or the value's field name when there are none.",
    })}
  </EuiText>
);

/**
 * Combines the series into one long table: for every row and numeric field, a row with the time,
 * the metric and the value. The metric is the row's string values (a category, a PromQL Series),
 * plus the field name when a series has several numeric fields; without string fields it's the
 * field name, `name (refId)` when several series share it.
 */
export const seriesToRowsMethod = (series: SeriesResult[]): SeriesExecutionResult => {
  if (series.length === 0) return skippedSeriesResult(series);

  const timeFields = series.map(({ fieldSchema }) => findTimeField(fieldSchema));
  const valueFields = series.map(({ fieldSchema }, index) => {
    const ownTime = timeFields[index];
    return numericalFields(fieldSchema, ownTime ? [ownTime.name] : []);
  });
  if (valueFields.every((fields) => fields.length === 0)) {
    return skippedSeriesResult(series, [
      { code: 'missing_fields', message: 'No numeric fields to turn into rows.' },
    ]);
  }

  const fieldCount = new Map<string, number>();
  valueFields.forEach((fields) =>
    fields.forEach(({ name }) => fieldCount.set(name, (fieldCount.get(name) ?? 0) + 1))
  );

  const timeField = timeFields.find((field): field is FieldSchema => Boolean(field));
  const taken = new Set<string>();
  const timeName = timeField?.name;
  if (timeName) taken.add(timeName);
  const metricName = uniqueFieldName(METRIC_FIELD, taken);
  taken.add(metricName);
  const valueName = uniqueFieldName(VALUE_FIELD, taken);

  // const rows: NormalizedRow[] = series.flatMap((oneSeries, index) => {
  const rowsBySeries: NormalizedRow[][] = series.map((oneSeries, index) => {
    const ownTime = timeFields[index];
    const fields = valueFields[index];
    const labels = stringFields(oneSeries.fieldSchema, ownTime ? [ownTime.name] : []);
    return oneSeries.rows.flatMap((row) => {
      const labelText = labels
        .map(({ name }) => row[name])
        .filter((value) => value != null && value !== '')
        .join(' ');
      return fields.map(({ name }) => {
        const fieldLabel =
          (fieldCount.get(name) ?? 0) > 1 && !labelText ? `${name} (${oneSeries.refId})` : name;
        const metric = labelText
          ? fields.length > 1
            ? `${labelText} ${name}`
            : labelText
          : fieldLabel;
        return {
          ...(timeName ? { [timeName]: ownTime ? (row[ownTime.name] ?? null) : null } : {}),
          [metricName]: metric,
          [valueName]: row[name] ?? null,
        };
      });
    });
  });

  // A metric more than one query produces (e.g. both grouped by host) would draw as one series:
  // such metrics get the query's refId, `web1 (A)` and `web1 (B)`.
  const metricQueries = new Map<unknown, Set<number>>();
  rowsBySeries.forEach((seriesRows, index) =>
    seriesRows.forEach((row) => {
      const queries = metricQueries.get(row[metricName]) ?? new Set<number>();
      queries.add(index);
      metricQueries.set(row[metricName], queries);
    })
  );
  const rows: NormalizedRow[] = rowsBySeries.flatMap((seriesRows, index) =>
    seriesRows.map((row) =>
      (metricQueries.get(row[metricName])?.size ?? 0) > 1
        ? { ...row, [metricName]: `${row[metricName]} (${series[index].refId})` }
        : row
    )
  );

  // Queries without a numeric field add no rows; say which.
  const withoutValues = series.filter((_, index) => valueFields[index].length === 0);
  const issues: TransformationIssue[] =
    withoutValues.length > 0
      ? [
          {
            code: 'missing_fields',
            message: `No numeric fields to turn into rows in: ${withoutValues
              .map(({ refId }) => refId)
              .join(', ')}`,
          },
        ]
      : [];

  return {
    series: [
      {
        refId: combinedRefId(series),
        rows,
        fieldSchema: [
          ...(timeField ? [timeField] : []),
          { name: metricName, type: 'string' },
          { name: valueName, type: 'double' },
        ],
        seriesDisplayNames: mergeDisplayNames(series),
      },
    ],
    // status: 'applied',
    // issues: [],
    status: issues.length > 0 ? 'partially_applied' : 'applied',
    issues,
  };
};

export function createSeriesToRowsTransformation(): MultiSeriesTransformationInstance<SeriesToRowsConfig> {
  return {
    instance_id: uuidv4(),
    definition_id: 'series_to_rows',
    config: {},
    hide: false,
    seriesMethod: seriesToRowsMethod,
    Editor: SeriesToRowsEditor,
  };
}

export const seriesToRowsTransformationDefinition: TransformationDefinition<SeriesToRowsConfig> = {
  id: 'series_to_rows',
  type: 'combine',
  label: i18n.translate('explore.transformations.seriesToRows.label', {
    defaultMessage: 'Series to rows',
  }),
  description: i18n.translate('explore.transformations.seriesToRows.description', {
    defaultMessage: 'Combine every query into one Time / Metric / Value table.',
  }),
  iconType: 'visTable',
  createInstance: createSeriesToRowsTransformation,
};

export const seriesToRowsConfigSchema: TransformationConfigSchema = {};
