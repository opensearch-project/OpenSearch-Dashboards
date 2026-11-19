/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import {
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
} from '@elastic/eui';
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
  TransformationEditorProps,
  TransformationIssue,
} from '../types';
import { uniqueFieldName } from '../merge_series';
import { FieldSelector } from '../field_selector';
import { isNumericalField } from '../transformation_utils';
import {
  combinedRefId,
  findTimeField,
  invalidConfigSeriesResult,
  missingFieldsIssue,
  skippedSeriesResult,
  stringFields,
  toKey,
} from './series_utils';

export interface JoinByLabelsConfig {
  // Its values become the column headers.
  pivotLabel: string | undefined;
  // Kept as row headers.
  rowLabels: string[];
  // The field whose numbers fill the cells.
  pivotValue: string | undefined;
}

// PromQL rows keep their labels in an object field; a label is also read from a top-level field.
const LABELS_FIELD = 'Labels';

export const getLabel = (row: NormalizedRow, label: string): unknown => {
  const labels = row[LABELS_FIELD];
  if (labels && typeof labels === 'object' && label in (labels as object)) {
    return (labels as Record<string, unknown>)[label];
  }
  return row[label];
};

const toOptions = (names: string[]): EuiComboBoxOptionOption[] => names.map((label) => ({ label }));

const JoinByLabelsEditor = ({
  config,
  onChange,
  availableFields,
}: TransformationEditorProps<JoinByLabelsConfig>) => {
  // Label names live inside each row's Labels object, so they're typed in; string fields are
  // offered as well.
  const labelOptions = toOptions(stringFields(availableFields).map(({ name }) => name));
  const createLabel = (value: string) => value.trim();
  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.transformations.joinByLabels.pivotLabel', {
            defaultMessage: 'Column label',
          })}
          helpText={i18n.translate('explore.transformations.joinByLabels.pivotLabelHelp', {
            defaultMessage: 'Each value of this label becomes a column.',
          })}
          display="columnCompressed"
        >
          <EuiComboBox
            compressed
            singleSelection={{ asPlainText: true }}
            options={labelOptions}
            selectedOptions={config.pivotLabel ? toOptions([config.pivotLabel]) : []}
            onChange={(selected) => onChange({ ...config, pivotLabel: selected[0]?.label })}
            onCreateOption={(value) => onChange({ ...config, pivotLabel: createLabel(value) })}
            data-test-subj="joinByLabelsPivotLabel"
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.transformations.joinByLabels.rowLabels', {
            defaultMessage: 'Row labels',
          })}
          display="columnCompressed"
        >
          <EuiComboBox
            compressed
            options={labelOptions}
            selectedOptions={toOptions(config.rowLabels)}
            onChange={(selected) =>
              onChange({ ...config, rowLabels: selected.map(({ label }) => label) })
            }
            onCreateOption={(value) =>
              onChange({ ...config, rowLabels: [...config.rowLabels, createLabel(value)] })
            }
            data-test-subj="joinByLabelsRowLabels"
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <FieldSelector
          configField={config.pivotValue}
          availableFields={availableFields.filter((field) => isNumericalField(field))}
          updateConfigField={(field) => onChange({ ...config, pivotValue: field?.name })}
          testSubjPrefix="joinByLabelsValue"
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

/**
 * Pivots on a label across every series's rows: one row per row-label values (and time, when the
 * rows have a time field), one column per value of the pivot label, filled with pivotValue.
 */
export const joinByLabelsMethod = (
  series: SeriesResult[],
  config: JoinByLabelsConfig
): SeriesExecutionResult => {
  const { pivotLabel, rowLabels = [], pivotValue } = config;
  if (!pivotLabel || !pivotValue) {
    return invalidConfigSeriesResult(series, 'Pick the column label and the value field.');
  }
  if (series.length === 0) return skippedSeriesResult(series);

  // const allRows = series.flatMap(({ rows }) => rows);
  // Series with no row carrying the label (e.g. a PPL query) aren't pivoted; they pass through.
  const pivoted = series.filter(({ rows }) =>
    rows.some((row) => getLabel(row, pivotLabel) != null)
  );
  const others = series.filter((oneSeries) => !pivoted.includes(oneSeries));
  const allRows = pivoted.flatMap(({ rows }) => rows);
  const withPivot = allRows.filter((row) => getLabel(row, pivotLabel) != null);
  if (withPivot.length === 0)
    return skippedSeriesResult(series, [missingFieldsIssue([pivotLabel])]);

  // const timeField = series
  const timeField = pivoted
    .map(({ fieldSchema }) => findTimeField(fieldSchema))
    .find((field): field is FieldSchema => Boolean(field));
  const keyFields = [...rowLabels, ...(timeField ? [timeField.name] : [])];
  const readKey = (row: NormalizedRow, name: string) =>
    timeField && name === timeField.name ? row[name] : getLabel(row, name);

  // Pivot value -> its column; a value equal to a key field's name gets a unique name, so it
  // doesn't overwrite the key.
  const taken = new Set<string>(keyFields);
  const columnByValue = new Map<string, string>();
  const pivotColumns: string[] = [];
  const byKey = new Map<string, NormalizedRow>();
  // Cells written more than once: rows the row labels don't tell apart; the last value is kept.
  let duplicateCells = 0;
  withPivot.forEach((row) => {
    // const column = String(getLabel(row, pivotLabel));
    // if (!pivotColumns.includes(column)) pivotColumns.push(column);
    const value = String(getLabel(row, pivotLabel));
    let column = columnByValue.get(value);
    if (column === undefined) {
      column = uniqueFieldName(value, taken);
      taken.add(column);
      columnByValue.set(value, column);
      pivotColumns.push(column);
    }
    const key = JSON.stringify(keyFields.map((name) => toKey(readKey(row, name)) ?? null));
    let out = byKey.get(key);
    if (!out) {
      out = Object.fromEntries(keyFields.map((name) => [name, readKey(row, name) ?? null]));
      byKey.set(key, out);
    }
    if (out[column] !== undefined) duplicateCells += 1;
    out[column] = row[pivotValue] ?? null;
  });

  const allFields = pivoted.flatMap(({ fieldSchema }) => fieldSchema);
  const valueType = allFields.find(({ name }) => name === pivotValue)?.type ?? 'double';
  const fieldSchema: FieldSchema[] = [
    // ...rowLabels.map((name) => ({ name, type: 'string' })),
    // A row label read from a top-level field keeps its type; one from Labels is a string.
    ...rowLabels.map((name) => ({
      name,
      type: allFields.find((field) => field.name === name)?.type ?? 'string',
    })),
    ...(timeField ? [timeField] : []),
    // ...pivotColumns
    //   .filter((column) => !keyFields.includes(column))
    //   .map((name) => ({ name, type: valueType })),
    ...pivotColumns.map((name) => ({ name, type: valueType })),
  ];

  const missingRows = allRows.length - withPivot.length;
  const issues: TransformationIssue[] = [];
  if (missingRows > 0 || others.length > 0) issues.push(missingFieldsIssue([pivotLabel]));
  if (duplicateCells > 0) {
    issues.push({
      code: 'duplicate_keys',
      message: `${duplicateCells} value(s) share a cell with another row and were replaced. Add a row label that tells the rows apart (e.g. instance).`,
    });
  }
  const result: SeriesResult = {
    refId: combinedRefId(pivoted),
    rows: Array.from(byKey.values()),
    fieldSchema,
  };
  return {
    // series: [{ refId: combinedRefId(series), rows: Array.from(byKey.values()), fieldSchema }],
    // status: missingRows > 0 ? 'partially_applied' : 'applied',
    // issues: missingRows > 0 ? [missingFieldsIssue([pivotLabel])] : [],
    series: [result, ...others],
    status: issues.length > 0 ? 'partially_applied' : 'applied',
    issues,
  };
};

export function createJoinByLabelsTransformation(): MultiSeriesTransformationInstance<JoinByLabelsConfig> {
  return {
    instance_id: uuidv4(),
    definition_id: 'join_by_labels',
    config: { pivotLabel: undefined, rowLabels: [], pivotValue: 'Value' },
    hide: false,
    seriesMethod: joinByLabelsMethod,
    Editor: JoinByLabelsEditor,
  };
}

export const joinByLabelsTransformationDefinition: TransformationDefinition<JoinByLabelsConfig> = {
  id: 'join_by_labels',
  type: 'combine',
  label: i18n.translate('explore.transformations.joinByLabels.label', {
    defaultMessage: 'Join by labels',
  }),
  description: i18n.translate('explore.transformations.joinByLabels.description', {
    defaultMessage:
      "Pivot Prometheus series on a label: each label value becomes a column, filled with the series' values.",
  }),
  iconType: 'tag',
  createInstance: createJoinByLabelsTransformation,
};

export const joinByLabelsConfigSchema: TransformationConfigSchema = {
  pivotLabel: {
    description: 'The label whose values become the column headers (e.g. cluster).',
    kind: 'string',
    defaultValue: undefined,
    required: true,
  },
  rowLabels: {
    description: 'Labels kept as row headers (e.g. job).',
    kind: 'string[]',
    defaultValue: [],
    required: false,
  },
  pivotValue: {
    description: 'The numeric field whose values fill the cells.',
    kind: 'field_name',
    defaultValue: 'Value',
    required: true,
  },
};
