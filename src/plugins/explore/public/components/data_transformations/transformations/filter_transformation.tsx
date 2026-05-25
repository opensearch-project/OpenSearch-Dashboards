/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import uuid from 'uuid';
import { EuiFormRow, EuiSelect, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { get } from 'lodash';
import {
  TransformationInstance,
  TransformationDefinition,
  FieldSchema,
  dateOperatorOptions,
  FilterConfig,
  numericalOperatorOptions,
  allOperatorOptions,
} from '../types';
import { VisFieldType } from '../../visualizations/types';
import { FieldSelector } from '../field_selector';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { DebouncedFieldText } from '../../visualizations/style_panel/utils';

const isConfigComplete = (config: FilterConfig): boolean => {
  return !!config.field && !!config.operator && config.value.trim() !== '';
};

const FilterEditor = ({
  config,
  onChange,
  availableFields,
}: {
  config: FilterConfig;
  onChange: (newConfig: FilterConfig) => void;
  availableFields: FieldSchema[];
}) => {
  const selectedField = availableFields.find((field) => field.name === config.field);
  const fieldType = selectedField?.visFieldType;

  const updateConfig = useCallback(
    (newConfig: FilterConfig) => {
      onChange(newConfig);
    },
    [onChange]
  );

  const getOperatorsForType = (type: VisFieldType | undefined) => {
    if (type === VisFieldType.Numerical)
      return [...allOperatorOptions, ...numericalOperatorOptions];
    if (type === VisFieldType.Date) return [...allOperatorOptions, ...dateOperatorOptions];
    return allOperatorOptions;
  };

  const handleFieldChange = (fieldSchema: FieldSchema | undefined) => {
    const newConfig = { ...config, field: fieldSchema?.name || undefined, value: '' };
    const validOperators = getOperatorsForType(fieldSchema?.visFieldType);
    // reset operator if FieldSchema type is changed
    if (!validOperators.some((op) => op.value === newConfig.operator)) {
      newConfig.operator = 'equals';
    }
    updateConfig(newConfig);
  };

  const operatorOptions = getOperatorsForType(fieldType);

  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      <EuiFlexItem>
        <FieldSelector
          configField={config.field}
          availableFields={availableFields}
          updateConfigField={handleFieldChange}
          testSubjPrefix="filter"
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.transformations.filter.operatorLabel', {
            defaultMessage: 'Operator',
          })}
          display="columnCompressed"
        >
          <EuiSelect
            compressed
            options={operatorOptions}
            value={config.operator}
            onChange={(e) => {
              updateConfig({
                ...config,
                operator: e.target.value as FilterConfig['operator'],
              });
            }}
            data-test-subj="filterOperatorSelect"
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.transformations.filter.valueLabel', {
            defaultMessage: 'Value',
          })}
          display="columnCompressed"
        >
          <DebouncedFieldText
            value={config.value}
            onChange={(val) => updateConfig({ ...config, value: val })}
            placeholder={i18n.translate('explore.transformations.filter.valuePlaceholder', {
              defaultMessage: 'Enter a value',
            })}
          />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export function createFilterTransformation(): TransformationInstance<FilterConfig> {
  return {
    instance_id: uuid.v4(),
    definition_id: 'filter',
    config: {
      field: undefined,
      operator: 'equals',
      value: '',
    },
    hide: false,
    transformationMethod: (data: OpenSearchSearchHit[], config: FilterConfig) => {
      const { field, operator, value } = config;

      // Return original data if config is incomplete
      if (!isConfigComplete({ field, operator, value })) {
        return data;
      }

      return data.filter((row) => {
        // get value from OpenSearch hit structure (_source.field)
        const fieldValue = get(row, `_source.${field}`);

        // Handle null/undefined field values
        if (fieldValue == null) {
          return false;
        }

        const fieldValueStr = String(fieldValue).toLowerCase();
        const compareValue = value.toLowerCase();

        switch (operator) {
          case 'equals':
            return fieldValueStr === compareValue;
          case 'not_equals':
            return fieldValueStr !== compareValue;
          case 'contains':
            return fieldValueStr.includes(compareValue);
          case 'not_contains':
            return !fieldValueStr.includes(compareValue);
          case 'greater_than':
            // Try numeric comparison first, fall back to string comparison
            if (typeof fieldValue === 'number') {
              const numValue = parseFloat(value);
              return !isNaN(numValue) && fieldValue > numValue;
            }
            return fieldValueStr > compareValue;
          case 'greater_than_or_equal_to':
            if (typeof fieldValue === 'number') {
              const numValue = parseFloat(value);
              return !isNaN(numValue) && fieldValue >= numValue;
            }
            return fieldValueStr >= compareValue;
          case 'less_than':
            if (typeof fieldValue === 'number') {
              const numValue = parseFloat(value);
              return !isNaN(numValue) && fieldValue < numValue;
            }
            return fieldValueStr < compareValue;
          case 'less_than_or_equal_to':
            if (typeof fieldValue === 'number') {
              const numValue = parseFloat(value);
              return !isNaN(numValue) && fieldValue <= numValue;
            }
            return fieldValueStr <= compareValue;
          case 'is_earlier':
          case 'is_earlier_or_equal':
          case 'is_later':
          case 'is_later_or_equal': {
            const fieldTs = Date.parse(fieldValue);
            const compareTs = Date.parse(value);
            if (isNaN(fieldTs) || isNaN(compareTs)) return false;
            if (operator === 'is_earlier') return fieldTs < compareTs;
            if (operator === 'is_earlier_or_equal') return fieldTs <= compareTs;
            if (operator === 'is_later') return fieldTs > compareTs;
            return fieldTs >= compareTs;
          }
          default:
            return true;
        }
      });
    },

    validateConfig: (config: FilterConfig, availableFields: Array<{ name?: string }>) => {
      if (config.field && !availableFields.find((f) => f.name === config.field)) {
        return { ...config, field: undefined, value: '' };
      }
      return config;
    },
    Editor: FilterEditor,
  };
}

export const filterTransformationDefinition: TransformationDefinition<FilterConfig> = {
  id: 'filter',
  type: 'filter',
  label: i18n.translate('explore.transformations.filter.label', { defaultMessage: 'Filter' }),
  description: i18n.translate('explore.transformations.filter.description', {
    defaultMessage: 'Filter rows by field value using various comparison operators',
  }),
  // TODO icon filter is not applicable
  iconType: 'filter',
  createInstance: createFilterTransformation,
};
