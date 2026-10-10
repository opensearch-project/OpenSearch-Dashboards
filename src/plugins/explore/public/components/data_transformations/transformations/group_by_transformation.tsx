/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { EuiAccordion, EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  TransformationInstance,
  TransformationDefinition,
  FieldSchema,
  TransformationConfigSchema,
} from '../types';
import { FieldSelector } from '../field_selector';
import { VisFieldType } from '../../visualizations/types';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { CalculationMethod, calculateValue } from '../../visualizations/utils/calculation';
import { ValueCalculationSelector } from '../../visualizations/style_panel/value/value_calculation_selector';
import {
  createAppliedResult,
  createInvalidConfigResult,
  createMissingFieldsResult,
  getRowFieldValue,
  rowHasField,
} from '../transformation_utils';

// Methods not applicable to string fields
const STRING_DISABLED: CalculationMethod[] = [
  'min',
  'max',
  'mean',
  'median',
  'variance',
  'total',
  'first*',
  'last*',
];

// Methods not applicable to date fields
const DATE_DISABLED: CalculationMethod[] = [
  'mean',
  'median',
  'variance',
  'total',
  'first*',
  'last*',
];

const getDisabledForField = (field: FieldSchema): CalculationMethod[] => {
  switch (field.visFieldType) {
    case VisFieldType.Numerical:
      return [];
    case VisFieldType.Date:
      return DATE_DISABLED;
    default:
      return STRING_DISABLED;
  }
};

const defaultMethodForField = (field: FieldSchema): CalculationMethod => {
  switch (field.visFieldType) {
    case VisFieldType.Numerical:
      return 'total';
    case VisFieldType.Date:
      return 'first';
    default:
      return 'count';
  }
};

interface AggMethod {
  field: string;
  method: CalculationMethod;
  hidden?: boolean;
}

interface GroupByConfig {
  groupByField: string | undefined;
  aggregations: AggMethod[];
}

const createDefaultAggregations = (
  groupByField: string,
  availableFields: FieldSchema[]
): AggMethod[] =>
  availableFields
    .filter((field) => field.name !== groupByField)
    .map((field) => ({
      field: field.name,
      method: defaultMethodForField(field),
    }));

const applyAgg = (values: unknown[], method: CalculationMethod): unknown => {
  if (values.length === 0) {
    return method === 'count' || method === 'distinct_count' ? 0 : null;
  }
  if (method === 'min' || method === 'max') {
    const firstVal = values[0];
    // Detect date especially for min and max method
    if (typeof firstVal === 'string' && isNaN(Number(firstVal)) && !isNaN(Date.parse(firstVal))) {
      const timestamps = values
        .map((v) => (typeof v === 'string' ? Date.parse(v) : NaN))
        .filter((t) => !isNaN(t));
      if (timestamps.length === 0) return null;
      const result = method === 'min' ? Math.min(...timestamps) : Math.max(...timestamps);
      return new Date(result).toISOString();
    }
  }
  return calculateValue(values as any[], method) ?? null;
};

const GroupByEditor = ({
  config,
  onChange,
  availableFields,
}: {
  config: GroupByConfig;
  onChange: (newConfig: GroupByConfig) => void;
  availableFields: FieldSchema[];
}) => {
  const update = useCallback(
    (change: Partial<GroupByConfig>) => onChange({ ...config, ...change }),
    [config, onChange]
  );

  const updateAgg = (index: number, method: CalculationMethod) => {
    const updated = config.aggregations.map((r, i) => (i === index ? { ...r, method } : r));
    update({ aggregations: updated });
  };

  const toggleHidden = (index: number) => {
    const updated = config.aggregations.map((r, i) =>
      i === index ? { ...r, hidden: !r.hidden } : r
    );
    update({ aggregations: updated });
  };

  const handleGroupByFieldChange = (field: FieldSchema | undefined) => {
    const groupByField = field?.name;
    onChange({
      ...config,
      groupByField,
      aggregations: groupByField ? createDefaultAggregations(groupByField, availableFields) : [],
    });
  };

  const fieldMap = new Map(availableFields.map((f) => [f.name, f]));

  const visibleCount = config.aggregations.filter((r) => !r.hidden).length;
  const totalCount = config.aggregations.length;

  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      <EuiFlexItem>
        <FieldSelector
          configField={config.groupByField}
          availableFields={availableFields}
          updateConfigField={handleGroupByFieldChange}
          testSubjPrefix="groupByField"
        />
      </EuiFlexItem>

      {config.groupByField && totalCount > 0 && (
        <EuiFlexItem>
          <EuiAccordion
            id="groupByAggregations"
            buttonContent={
              <EuiText size="s">
                <span>
                  {i18n.translate('explore.transformations.groupBy.aggregationsLabel', {
                    defaultMessage: '{visible} of {total} fields visible for aggregation',
                    values: { visible: visibleCount, total: totalCount },
                  })}
                </span>
              </EuiText>
            }
            initialIsOpen={totalCount <= 5}
            paddingSize="s"
          >
            <EuiFlexGroup direction="column" gutterSize="xs">
              {config.aggregations.map((agg, index) => {
                const fieldSchema = fieldMap.get(agg.field);
                if (!fieldSchema) return null;

                return (
                  <EuiFlexItem key={agg.field}>
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon
                          iconType={agg.hidden ? 'eyeClosed' : 'eye'}
                          color="text"
                          size="s"
                          onClick={() => toggleHidden(index)}
                          data-test-subj={`groupByToggleHidden${index}`}
                        />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false} style={{ width: 150 }}>
                        <EuiText
                          size="s"
                          color={agg.hidden ? 'subdued' : 'default'}
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={agg.field}
                        >
                          {agg.field}
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <ValueCalculationSelector
                          selectedValue={agg.method}
                          onChange={(method) => updateAgg(index, method)}
                          disabledList={getDisabledForField(fieldSchema)}
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                );
              })}
            </EuiFlexGroup>
          </EuiAccordion>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

export function createGroupByTransformation(): TransformationInstance<GroupByConfig> {
  return {
    instance_id: uuidv4(),
    definition_id: 'group_by',
    config: {
      groupByField: undefined,
      aggregations: [],
    },
    hide: false,
    transformationMethod: (data: OpenSearchSearchHit[], config: GroupByConfig) => {
      if (!config.groupByField || config.aggregations.length === 0) {
        return createInvalidConfigResult(data, 'Group By configuration is incomplete.');
      }

      const groups = new Map<string, OpenSearchSearchHit[]>();
      let missingGroupByRows = 0;
      for (const row of data) {
        if (!rowHasField(row, config.groupByField)) {
          missingGroupByRows++;
          continue;
        }
        const key = String(getRowFieldValue(row, config.groupByField) ?? '');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)?.push(row);
      }

      if (groups.size === 0) {
        return createMissingFieldsResult(data, [config.groupByField]);
      }

      const result = Array.from(groups.values()).map((rows) => {
        const source: Record<string, unknown> = {
          [config.groupByField!]: getRowFieldValue(rows[0], config.groupByField!),
        };
        for (const agg of config.aggregations) {
          if (agg.hidden) continue;
          const values = rows
            .filter((row) => rowHasField(row, agg.field))
            .map((row) => getRowFieldValue(row, agg.field));
          source[`${agg.method}_${agg.field}`] = applyAgg(values, agg.method);
        }
        return { ...rows[0], _source: source };
      });
      return missingGroupByRows > 0
        ? createMissingFieldsResult(result, [config.groupByField], 'partially_applied')
        : createAppliedResult(result);
    },

    Editor: GroupByEditor,
  };
}

export const groupByTransformationDefinition: TransformationDefinition<GroupByConfig> = {
  id: 'group_by',
  type: 'aggregate',
  label: i18n.translate('explore.transformations.groupBy.label', {
    defaultMessage: 'Group By',
  }),
  description: i18n.translate('explore.transformations.groupBy.description', {
    defaultMessage: 'Group rows by a field value and aggregate other fields per group',
  }),
  iconType: 'aggregate',
  createInstance: createGroupByTransformation,
};

export const groupByConfigSchema: TransformationConfigSchema = {
  groupByField: {
    description:
      'The column to group rows by. Each unique value in this column becomes one output row.',
    kind: 'field_name',
    defaultValue: undefined,
    required: true,
  },
  aggregations: {
    description:
      'Aggregation methods to apply to all other columns per group. ' +
      'The output column name is "<method>_<field>" (e.g. "mean_AvgTicketPrice"). ' +
      'Set hidden: true to exclude a field from the output.',
    kind: 'object[]',
    defaultValue: [],
    required: true,
    nestedSchema: {
      field: {
        description: 'Column name to aggregate.',
        kind: 'field_name',
        required: true,
      },
      method: {
        description:
          'Aggregation method. Not all methods apply to all field types: ' +
          'string fields support count/first/last only; ' +
          'date fields support count/min/max/first/last; ' +
          'numerical fields support all methods.',
        kind: 'enum',
        defaultValue: 'count',
        required: true,
        enumOptions: [
          { value: 'count', label: 'Count' },
          { value: 'total', label: 'Sum (total)' },
          { value: 'mean', label: 'Mean (average)' },
          { value: 'median', label: 'Median' },
          { value: 'min', label: 'Min' },
          { value: 'max', label: 'Max' },
          { value: 'first', label: 'First value' },
          { value: 'last', label: 'Last value' },
        ],
      },
      hidden: {
        description: 'Set to true to exclude this aggregation from the output.',
        kind: 'boolean',
        defaultValue: false,
        required: false,
      },
    },
  },
};
