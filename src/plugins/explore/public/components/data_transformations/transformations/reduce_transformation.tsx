/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import {
  EuiButtonGroup,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiText,
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
} from '../types';
import { FieldSelector } from '../field_selector';
import { isNumericalField } from '../transformation_utils';
import {
  combinedRefId,
  invalidConfigSeriesResult,
  missingFieldsIssue,
  numericalFields,
  skippedSeriesResult,
} from './series_utils';

export type ReduceMode = 'series_to_rows' | 'reduce_fields';
export type ReduceMethod = 'first' | 'last' | 'min' | 'max' | 'mean' | 'sum' | 'count';

export interface ReduceConfig {
  mode: ReduceMode;
  // Empty: every numeric field.
  fields: string[];
  methods: ReduceMethod[];
}

export const REDUCE_METHOD_LABELS: Record<ReduceMethod, string> = {
  first: 'First',
  last: 'Last',
  min: 'Min',
  max: 'Max',
  mean: 'Mean',
  sum: 'Total',
  count: 'Count',
};

const REDUCE_METHODS = Object.keys(REDUCE_METHOD_LABELS) as ReduceMethod[];

const nonNull = (values: unknown[]) => values.filter((value) => value != null);
const numbers = (values: unknown[]) =>
  values.filter((value): value is number => typeof value === 'number' && !isNaN(value));

export const reduceValues = (values: unknown[], method: ReduceMethod): unknown => {
  const present = nonNull(values);
  const nums = numbers(present);
  switch (method) {
    case 'first':
      return present.length > 0 ? present[0] : null;
    case 'last':
      return present.length > 0 ? present[present.length - 1] : null;
    case 'min':
      return nums.length > 0 ? Math.min(...nums) : null;
    case 'max':
      return nums.length > 0 ? Math.max(...nums) : null;
    case 'sum':
      return nums.reduce((acc, value) => acc + value, 0);
    case 'mean':
      return nums.length > 0 ? nums.reduce((acc, value) => acc + value, 0) / nums.length : null;
    case 'count':
      return present.length;
  }
};

const modeOptions = [
  {
    id: 'series_to_rows',
    label: i18n.translate('explore.transformations.reduce.seriesToRows', {
      defaultMessage: 'Series to rows',
    }),
  },
  {
    id: 'reduce_fields',
    label: i18n.translate('explore.transformations.reduce.reduceFields', {
      defaultMessage: 'Reduce fields',
    }),
  },
];

const methodOptions = REDUCE_METHODS.map((method) => ({
  label: REDUCE_METHOD_LABELS[method],
  value: method,
}));

const ReduceEditor = ({
  config,
  onChange,
  availableFields,
}: TransformationEditorProps<ReduceConfig>) => (
  <EuiFlexGroup direction="column" gutterSize="s">
    <EuiFlexItem>
      <EuiFormRow
        label={i18n.translate('explore.transformations.reduce.modeLabel', {
          defaultMessage: 'Mode',
        })}
        display="columnCompressed"
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.transformations.reduce.modeLegend', {
            defaultMessage: 'Reduce mode',
          })}
          options={modeOptions}
          idSelected={config.mode}
          onChange={(id) => onChange({ ...config, mode: id as ReduceMode })}
          buttonSize="compressed"
          isFullWidth
          data-test-subj="reduceModeButtonGroup"
        />
      </EuiFormRow>
    </EuiFlexItem>
    <EuiFlexItem>
      <EuiText size="xs" color="subdued">
        {config.mode === 'series_to_rows'
          ? i18n.translate('explore.transformations.reduce.seriesToRowsHelp', {
              defaultMessage: 'One row per field across every query, one column per calculation.',
            })
          : i18n.translate('explore.transformations.reduce.reduceFieldsHelp', {
              defaultMessage: 'Each query becomes one row: a column per field and calculation.',
            })}
      </EuiText>
    </EuiFlexItem>
    <EuiFlexItem>
      <EuiFormRow
        label={i18n.translate('explore.transformations.reduce.methodsLabel', {
          defaultMessage: 'Calculations',
        })}
        display="columnCompressed"
      >
        <EuiComboBox
          compressed
          options={methodOptions}
          selectedOptions={methodOptions.filter(({ value }) => config.methods.includes(value))}
          onChange={(selected) =>
            onChange({
              ...config,
              methods: selected
                .map(({ value }) => value)
                .filter((value): value is ReduceMethod => Boolean(value)),
            })
          }
          data-test-subj="reduceMethodsComboBox"
        />
      </EuiFormRow>
    </EuiFlexItem>
    <EuiFlexItem>
      <FieldSelector
        configFields={config.fields}
        availableFields={availableFields.filter((field) => isNumericalField(field))}
        updateConfigFields={(fields) => onChange({ ...config, fields: fields.map((f) => f.name) })}
        supportMulti={true}
        testSubjPrefix="reduceFields"
      />
      <EuiText size="xs" color="subdued">
        {i18n.translate('explore.transformations.reduce.fieldsHelp', {
          defaultMessage: 'No field picked: every numeric field.',
        })}
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);

const pickFields = (oneSeries: SeriesResult, fields: string[]): FieldSchema[] =>
  fields.length === 0
    ? numericalFields(oneSeries.fieldSchema)
    : fields
        .map((name) => oneSeries.fieldSchema.find((field) => field.name === name))
        .filter((field): field is FieldSchema => Boolean(field));

const methodType = (method: ReduceMethod, field: FieldSchema) =>
  method === 'count' ? 'integer' : method === 'mean' ? 'double' : field.type;

/**
 * Reduce, two modes. Series to rows: one table with a row per field of every series (Field plus a
 * column per calculation). Reduce fields: each series collapses to one row, a `field-Calculation`
 * column per field and calculation.
 */
export const reduceMethod = (
  series: SeriesResult[],
  config: ReduceConfig
): SeriesExecutionResult => {
  const { mode = 'series_to_rows', fields = [], methods = [] } = config;
  if (methods.length === 0) return invalidConfigSeriesResult(series, 'Pick a calculation.');
  if (series.length === 0) return skippedSeriesResult(series);

  const picked = series.map((oneSeries) => pickFields(oneSeries, fields));
  const found = new Set(picked.flat().map(({ name }) => name));
  const missing = fields.filter((name) => !found.has(name));
  if (found.size === 0) {
    return skippedSeriesResult(series, [
      fields.length > 0
        ? missingFieldsIssue(fields)
        : { code: 'missing_fields', message: 'No numeric fields to reduce.' },
    ]);
  }
  const issues = missing.length > 0 ? [missingFieldsIssue(missing)] : [];
  const status = missing.length > 0 ? 'partially_applied' : 'applied';

  if (mode === 'reduce_fields') {
    return {
      series: series.map((oneSeries, index) => {
        const row: NormalizedRow = {};
        const fieldSchema: FieldSchema[] = [];
        picked[index].forEach((field) => {
          const values = oneSeries.rows.map((r) => r[field.name]);
          methods.forEach((method) => {
            const name = `${field.name}-${REDUCE_METHOD_LABELS[method]}`;
            row[name] = reduceValues(values, method);
            fieldSchema.push({ name, type: methodType(method, field) });
          });
        });
        return { ...oneSeries, rows: [row], fieldSchema };
      }),
      status,
      issues,
    };
  }

  // series_to_rows: a field in several series is named `field (refId)`.
  const nameCount = new Map<string, number>();
  picked.flat().forEach(({ name }) => nameCount.set(name, (nameCount.get(name) ?? 0) + 1));
  const rows: NormalizedRow[] = series.flatMap((oneSeries, index) =>
    picked[index].map((field) => {
      const values = oneSeries.rows.map((r) => r[field.name]);
      const row: NormalizedRow = {
        Field:
          (nameCount.get(field.name) ?? 0) > 1 ? `${field.name} (${oneSeries.refId})` : field.name,
      };
      methods.forEach((method) => {
        row[REDUCE_METHOD_LABELS[method]] = reduceValues(values, method);
      });
      return row;
    })
  );
  const fieldSchema: FieldSchema[] = [
    { name: 'Field', type: 'string' },
    ...methods.map((method) => ({
      name: REDUCE_METHOD_LABELS[method],
      type: method === 'count' ? 'integer' : 'double',
    })),
  ];
  return {
    series: [{ refId: combinedRefId(series), rows, fieldSchema }],
    status,
    issues,
  };
};

export function createReduceTransformation(): MultiSeriesTransformationInstance<ReduceConfig> {
  return {
    instance_id: uuidv4(),
    definition_id: 'reduce',
    config: { mode: 'series_to_rows', fields: [], methods: ['last'] },
    hide: false,
    seriesMethod: reduceMethod,
    Editor: ReduceEditor,
  };
}

export const reduceTransformationDefinition: TransformationDefinition<ReduceConfig> = {
  id: 'reduce',
  type: 'combine',
  label: i18n.translate('explore.transformations.reduce.label', { defaultMessage: 'Reduce' }),
  description: i18n.translate('explore.transformations.reduce.description', {
    defaultMessage:
      'Collapse fields into calculations (first, last, min, max, mean, total, count): a row per field, or a row per query.',
  }),
  iconType: 'aggregate',
  createInstance: createReduceTransformation,
};

export const reduceConfigSchema: TransformationConfigSchema = {
  mode: {
    description:
      'series_to_rows: one table, a row per field of every query and a column per calculation. reduce_fields: each query becomes one row with a `field-Calculation` column per field and calculation.',
    kind: 'enum',
    defaultValue: 'series_to_rows',
    required: true,
    enumOptions: [
      { value: 'series_to_rows', label: 'Series to rows' },
      { value: 'reduce_fields', label: 'Reduce fields' },
    ],
  },
  fields: {
    description: 'Numeric fields to reduce; empty reduces every numeric field.',
    kind: 'field_name[]',
    defaultValue: [],
    required: false,
  },
  methods: {
    description: 'Calculations to apply to each field.',
    kind: 'enum',
    defaultValue: ['last'],
    required: true,
    enumOptions: REDUCE_METHODS.map((value) => ({ value, label: REDUCE_METHOD_LABELS[value] })),
  },
};
