/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import uuid from 'uuid';
import { EuiAccordion, EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { get } from 'lodash';
import { TransformationInstance, TransformationDefinition, FieldSchema } from '../types';
import { FieldSelector } from '../field_selector';
import { VisFieldType } from '../../visualizations/types';
import { FIELD_TYPE_MAP } from '../../visualizations/constants';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { CalculationMethod, calculateValue } from '../../visualizations/utils/calculation';
import { ValueCalculationSelector } from '../../visualizations/style_panel/value/value_calculation_selector';

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

const defaultMethodForField = (field: { type?: string; name?: string }): CalculationMethod => {
  const fieldType = FIELD_TYPE_MAP[field.type || ''] || VisFieldType.Unknown;
  switch (fieldType) {
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

const applyAgg = (values: unknown[], method: CalculationMethod): unknown => {
  if ((method === 'min' || method === 'max') && values.length > 0) {
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

  const fieldMap = new Map(availableFields.map((f) => [f.name, f]));

  const visibleCount = config.aggregations.filter((r) => !r.hidden).length;
  const totalCount = config.aggregations.length;

  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      <EuiFlexItem>
        <FieldSelector
          configField={config.groupByField}
          availableFields={availableFields}
          updateConfigField={(f) => update({ groupByField: f?.name })}
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
    instance_id: uuid.v4(),
    definition_id: 'group_by',
    config: {
      groupByField: undefined,
      aggregations: [],
    },
    hide: false,
    transformationMethod: (data: OpenSearchSearchHit[], config: GroupByConfig) => {
      if (!config.groupByField || config.aggregations.length === 0) return data;
      const groups = new Map<string, OpenSearchSearchHit[]>();
      for (const row of data) {
        const key = String(get(row, `_source.${config.groupByField}`) ?? '');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)?.push(row);
      }

      const result = Array.from(groups.entries()).map(([groupKey, rows]) => {
        const source: Record<string, unknown> = {
          [config.groupByField!]: get(rows[0], `_source.${config.groupByField}`),
        };
        for (const agg of config.aggregations) {
          if (agg.hidden) continue;
          const values = rows.map((row) => get(row, `_source.${agg.field}`));
          source[`${agg.method}_${agg.field}`] = applyAgg(values, agg.method);
        }
        return { ...rows[0], _source: source };
      });
      return result;
    },
    validateConfig: (
      config: GroupByConfig,
      availableFields: Array<{ name?: string; type?: string }>
    ) => {
      const fieldNames = new Set(availableFields.map((f) => f.name));

      if (config.groupByField && !fieldNames.has(config.groupByField)) {
        return { ...config, groupByField: undefined, aggregations: [] };
      }

      if (config.groupByField) {
        const validAggs = config.aggregations.filter((a) => fieldNames.has(a.field));
        const existingFields = new Set(validAggs.map((a) => a.field));

        const newAggs = availableFields
          .filter((f) => f.name && f.name !== config.groupByField && !existingFields.has(f.name))
          .map((f) => ({ field: f.name ?? '', method: defaultMethodForField(f) }));

        if (newAggs.length > 0 || validAggs.length !== config.aggregations.length) {
          return { ...config, aggregations: [...validAggs, ...newAggs] };
        }
      }

      return config;
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
