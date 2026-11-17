/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { EuiButtonGroup, EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/types';
import {
  FieldSchema,
  MultiSeriesTransformationInstance,
  NormalizedRow,
  SeriesExecutionResult,
  TransformationConfigSchema,
  TransformationDefinition,
  TransformationEditorProps,
} from '../types';
import { FieldSelector } from '../field_selector';
import { uniqueFieldName } from '../merge_series';
import {
  combinedRefId,
  hasField,
  invalidConfigSeriesResult,
  mergeDisplayNames,
  missingFieldsIssue,
  skippedSeriesResult,
  toKey,
} from './series_utils';

export type JoinMode = 'inner' | 'outer';

export interface JoinByFieldConfig {
  mode: JoinMode;
  field: string | undefined;
}

const modeOptions = [
  {
    id: 'outer',
    label: i18n.translate('explore.transformations.joinByField.outer', {
      defaultMessage: 'Outer',
    }),
  },
  {
    id: 'inner',
    label: i18n.translate('explore.transformations.joinByField.inner', {
      defaultMessage: 'Inner',
    }),
  },
];

const JoinByFieldEditor = ({
  config,
  onChange,
  availableFields,
}: TransformationEditorProps<JoinByFieldConfig>) => (
  <EuiFlexGroup direction="column" gutterSize="s">
    <EuiFlexItem>
      <EuiFormRow
        label={i18n.translate('explore.transformations.joinByField.modeLabel', {
          defaultMessage: 'Mode',
        })}
        display="columnCompressed"
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.transformations.joinByField.modeLegend', {
            defaultMessage: 'Join mode',
          })}
          options={modeOptions}
          idSelected={config.mode}
          onChange={(id) => onChange({ ...config, mode: id as JoinMode })}
          buttonSize="compressed"
          isFullWidth
          data-test-subj="joinByFieldModeButtonGroup"
        />
      </EuiFormRow>
    </EuiFlexItem>
    <EuiFlexItem>
      <FieldSelector
        configField={config.field}
        availableFields={availableFields}
        updateConfigField={(field) => onChange({ ...config, field: field?.name })}
        testSubjPrefix="joinByField"
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);

// Every combination of one row per series (a series without the key adds one empty slot).
const combinations = (lists: Array<Array<NormalizedRow | undefined>>) =>
  lists.reduce<Array<Array<NormalizedRow | undefined>>>(
    (acc, list) => acc.flatMap((combo) => list.map((row) => [...combo, row])),
    [[]]
  );

/**
 * Aligns the series on one field into a wide table: one row per value of the field (per pair of
 * rows when a value repeats). Inner keeps only values every series has; outer keeps all, with
 * null for a series that lacks the value. A non-key field whose name an earlier series uses is
 * renamed `name (refId)`. Series without the field aren't joined and pass through.
 */
export const joinByFieldMethod = (
  series: SeriesResult[],
  config: JoinByFieldConfig
): SeriesExecutionResult => {
  const { field, mode = 'outer' } = config;
  if (!field) return invalidConfigSeriesResult(series, 'Pick the field to join on.');

  const joined = series.filter((oneSeries) => hasField(oneSeries, field));
  const others = series.filter((oneSeries) => !joined.includes(oneSeries));
  if (joined.length === 0) return skippedSeriesResult(series, [missingFieldsIssue([field])]);
  if (joined.length === 1) {
    // Nothing to join with; a missing field is still worth telling.
    return skippedSeriesResult(series, others.length > 0 ? [missingFieldsIssue([field])] : []);
  }

  // Output fields: the key once, then each series's other fields, renamed on a clash.
  const keyField = joined
    .map(({ fieldSchema }) => fieldSchema.find(({ name }) => name === field))
    .find(Boolean) ?? { name: field, type: 'string' };
  const taken = new Set<string>([field]);
  const fieldSchema: FieldSchema[] = [keyField];
  const renames = joined.map(({ refId, fieldSchema: schema }) => {
    const map = new Map<string, string>();
    schema.forEach(({ name, type }) => {
      if (name === field) return;
      const outName = taken.has(name) ? uniqueFieldName(`${name} (${refId})`, taken) : name;
      taken.add(outName);
      map.set(name, outName);
      fieldSchema.push({ name: outName, type });
    });
    return map;
  });

  // Per series: key -> rows; keys in first-seen order (the first series's order for inner).
  const keyValues = new Map<string, unknown>();
  const indexes = joined.map(({ rows }) => {
    const index = new Map<string, NormalizedRow[]>();
    rows.forEach((row) => {
      const key = toKey(row[field]);
      if (key === undefined) return;
      if (!keyValues.has(key)) keyValues.set(key, row[field]);
      index.set(key, [...(index.get(key) ?? []), row]);
    });
    return index;
  });
  const keys = Array.from(keyValues.keys()).filter(
    (key) => mode === 'outer' || indexes.every((index) => index.has(key))
  );

  const rows: NormalizedRow[] = keys.flatMap((key) =>
    combinations(indexes.map((index) => index.get(key) ?? [undefined])).map((combo) => {
      const row: NormalizedRow = { [field]: keyValues.get(key) };
      combo.forEach((source, seriesIndex) => {
        renames[seriesIndex].forEach((outName, name) => {
          row[outName] = source ? (source[name] ?? null) : null;
        });
      });
      return row;
    })
  );

  const result: SeriesResult = {
    refId: combinedRefId(joined),
    rows,
    fieldSchema,
    seriesDisplayNames: mergeDisplayNames(joined),
  };
  return others.length > 0
    ? {
        series: [result, ...others],
        status: 'partially_applied',
        issues: [missingFieldsIssue([field])],
      }
    : { series: [result], status: 'applied', issues: [] };
};

export function createJoinByFieldTransformation(): MultiSeriesTransformationInstance<JoinByFieldConfig> {
  return {
    instance_id: uuidv4(),
    definition_id: 'join_by_field',
    config: { mode: 'outer', field: undefined },
    hide: false,
    seriesMethod: joinByFieldMethod,
    Editor: JoinByFieldEditor,
  };
}

export const joinByFieldTransformationDefinition: TransformationDefinition<JoinByFieldConfig> = {
  id: 'join_by_field',
  type: 'combine',
  label: i18n.translate('explore.transformations.joinByField.label', {
    defaultMessage: 'Join by field',
  }),
  description: i18n.translate('explore.transformations.joinByField.description', {
    defaultMessage:
      'Align every query on a shared field into one wide table (inner or outer join).',
  }),
  iconType: 'link',
  createInstance: createJoinByFieldTransformation,
};

export const joinByFieldConfigSchema: TransformationConfigSchema = {
  mode: {
    description:
      'inner keeps only values of the field that every query has; outer keeps all, with null where a query has no row.',
    kind: 'enum',
    defaultValue: 'outer',
    required: true,
    enumOptions: [
      { value: 'outer', label: 'Outer' },
      { value: 'inner', label: 'Inner' },
    ],
  },
  field: {
    description: 'The field the queries are joined on (e.g. a time field).',
    kind: 'field_name',
    defaultValue: undefined,
    required: true,
  },
};
