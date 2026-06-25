/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import uuid from 'uuid';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiSelect } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TransformationInstance, TransformationDefinition, FieldSchema } from '../index';
import { FieldSelector } from '../field_selector';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';

type TargetType = 'string' | 'number' | 'boolean' | 'date';

interface ConvertRule {
  field: string | undefined;
  targetType: TargetType;
}

interface ConvertFieldTypeConfig {
  rules: ConvertRule[];
}

const isConfigComplete = (config: ConvertFieldTypeConfig): boolean => {
  const rules = config.rules;
  return rules.length > 0 && rules.some((r) => !!r.field && !!r.targetType);
};

const convertValue = (value: unknown, targetType: TargetType): unknown => {
  if (value == null) return value;
  switch (targetType) {
    case 'string':
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    case 'number': {
      const n = Number(value);
      return isNaN(n) ? null : n;
    }
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === '1' || value === 1) return true;
      if (value === 'false' || value === '0' || value === 0 || value === '') return false;
      return value != null;
    case 'date':
      try {
        const d = new Date(value as string);
        return isNaN(d.getTime()) ? null : d.toISOString();
      } catch {
        return null;
      }
    default:
      return value;
  }
};

const TARGET_TYPE_OPTIONS: Array<{ value: TargetType; text: string }> = [
  {
    value: 'string',
    text: i18n.translate('explore.transformations.convertFieldType.string', {
      defaultMessage: 'String',
    }),
  },
  {
    value: 'number',
    text: i18n.translate('explore.transformations.convertFieldType.number', {
      defaultMessage: 'Number',
    }),
  },
  {
    value: 'boolean',
    text: i18n.translate('explore.transformations.convertFieldType.boolean', {
      defaultMessage: 'Boolean',
    }),
  },
  {
    value: 'date',
    text: i18n.translate('explore.transformations.convertFieldType.date', {
      defaultMessage: 'Date',
    }),
  },
];

const ConvertFieldTypeEditor = ({
  config,
  onChange,
  availableFields,
}: {
  config: ConvertFieldTypeConfig;
  onChange: (newConfig: ConvertFieldTypeConfig) => void;
  availableFields: FieldSchema[];
}) => {
  const rules = config.rules;

  const update = useCallback(
    (newRules: ConvertRule[]) => onChange({ ...config, rules: newRules }),
    [config, onChange]
  );

  const updateRule = (index: number, patch: Partial<ConvertRule>) => {
    const updated = rules.map((r, i) => (i === index ? { ...r, ...patch } : r));
    update(updated);
  };

  const addRule = () => {
    update([...rules, { field: undefined, targetType: 'string' }]);
  };

  const removeRule = (index: number) => {
    update(rules.filter((_, i) => i !== index));
  };

  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      {rules.map((rule, index) => (
        <EuiFlexItem key={index}>
          <EuiFlexGroup gutterSize="m" alignItems="center" justifyContent="flexStart">
            <EuiFlexItem grow={false} style={{ width: '150px' }}>
              <FieldSelector
                configField={rule.field}
                availableFields={availableFields}
                updateConfigField={(fieldSchema) => updateRule(index, { field: fieldSchema?.name })}
                testSubjPrefix={`convertField${index}`}
                supportClearSelection={false}
              />
            </EuiFlexItem>

            <EuiFlexItem grow={false} style={{ textAlign: 'center', width: '30px' }}>
              {i18n.translate('explore.transformations.convertFieldType.as', {
                defaultMessage: 'As',
              })}
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ width: '150px' }}>
              <EuiSelect
                compressed
                options={TARGET_TYPE_OPTIONS}
                value={rule.targetType}
                onChange={(e) => updateRule(index, { targetType: e.target.value as TargetType })}
                data-test-subj={`convertFieldTypeSelect${index}`}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="trash"
                size="s"
                color="text"
                onClick={() => removeRule(index)}
                aria-label={i18n.translate('explore.transformations.convertFieldType.removeRule', {
                  defaultMessage: 'Remove rule',
                })}
                data-test-subj={`convertFieldRemoveRule${index}`}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      ))}
      <EuiFlexItem>
        <EuiButtonIcon
          iconType="plusInCircle"
          color="primary"
          size="s"
          onClick={addRule}
          aria-label={i18n.translate('explore.transformations.convertFieldType.addRule', {
            defaultMessage: 'Add conversion rule',
          })}
          data-test-subj="convertFieldAddRule"
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export function createConvertFieldTypeTransformation(): TransformationInstance<
  ConvertFieldTypeConfig
> {
  return {
    instance_id: uuid.v4(),
    definition_id: 'convert_field_type',
    config: { rules: [] },
    hide: false,
    transformationMethod: (data: OpenSearchSearchHit[], config: ConvertFieldTypeConfig) => {
      if (!isConfigComplete(config)) return data;
      const rules = config.rules.filter((r) => !!r.field && !!r.targetType);

      return data.map((row) => {
        const source = { ...(row._source as Record<string, unknown>) };
        for (const rule of rules) {
          source[rule.field!] = convertValue(source[rule.field!], rule.targetType!);
        }
        return { ...row, _source: source };
      });
    },
    transformSchema: (schema, config: ConvertFieldTypeConfig) => {
      if (!isConfigComplete(config)) return schema;
      const typeMap = new Map<string, string>();
      for (const rule of config.rules) {
        if (rule.field && rule.targetType) typeMap.set(rule.field, rule.targetType);
      }
      return schema.map((f) => {
        const target = f.name ? typeMap.get(f.name) : null;
        return target ? { ...f, type: target } : f;
      });
    },
    validateConfig: (config: ConvertFieldTypeConfig, availableFields: Array<{ name?: string }>) => {
      const fieldNames = new Set(availableFields.map((f) => f.name));
      let changed = false;
      const cleaned = config.rules.map((r) => {
        if (r.field && !fieldNames.has(r.field)) {
          changed = true;
          return { ...r, field: undefined };
        }
        return r;
      });
      if (changed) {
        return { ...config, rules: cleaned };
      }
      return config;
    },
    Editor: ConvertFieldTypeEditor,
  };
}

export const convertFieldTypeTransformationDefinition: TransformationDefinition<ConvertFieldTypeConfig> = {
  id: 'convert_field_type',
  type: 'transform',
  label: i18n.translate('explore.transformations.convertFieldType.label', {
    defaultMessage: 'Convert Field Type',
  }),
  description: i18n.translate('explore.transformations.convertFieldType.description', {
    defaultMessage: 'Convert field values to a different type (string, number, boolean, date)',
  }),
  iconType: 'inputOutput',
  createInstance: createConvertFieldTypeTransformation,
};
