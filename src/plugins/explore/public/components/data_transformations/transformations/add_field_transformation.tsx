/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import uuid from 'uuid';
import {
  EuiFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSelect,
  EuiButtonIcon,
  EuiButtonGroup,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { get } from 'lodash';
import { TransformationInstance, TransformationDefinition, FieldSchema } from '../index';
import { FieldSelector } from '../field_selector';
import { VisFieldType } from '../../visualizations/types';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { DebouncedFieldText } from '../../visualizations/style_panel/utils';
import { binaryOperatorOptions, unaryOperatorOptions, modeToggleOptions } from '../types';

type Mode = 'binary' | 'unary' | 'crossFields';
type BinaryOperator = '+' | '-' | '*' | '/';
type UnaryOperator = 'abs' | 'ceil' | 'floor' | 'round';
type CrossFieldsOperator = 'total' | 'mean' | 'expression';

const CUSTOM_VALUE_KEY = '__CUSTOM__';

interface AddFieldConfig {
  mode: Mode;
  // binary
  field1: string | undefined;
  field1CustomValue: string;
  binaryOperator: BinaryOperator;
  field2: string | undefined;
  field2CustomValue: string;
  // unary
  unaryOperator: UnaryOperator;
  unaryField: string | undefined;
  // cross-field
  crossFieldsOperator: CrossFieldsOperator;
  crossFields: FieldSchema[];
  expression: string;

  alias: string;
}

const isConfigComplete = (config: AddFieldConfig): boolean => {
  if (config.mode === 'binary') {
    const v1ok =
      !!config.field1 && (config.field1 !== CUSTOM_VALUE_KEY || !!config.field1CustomValue);
    const v2ok =
      !!config.field2 && (config.field2 !== CUSTOM_VALUE_KEY || !!config.field2CustomValue);
    return v1ok && v2ok;
  }
  if (config.mode === 'crossFields') {
    if (config.crossFieldsOperator === 'expression') {
      return config.expression.trim() !== '';
    }
    return (config.crossFields ?? []).length > 0;
  }
  return !!config.unaryField;
};

const applyBinary = (v1: number, op: BinaryOperator, v2: number): number | null => {
  switch (op) {
    case '+':
      return v1 + v2;
    case '-':
      return v1 - v2;
    case '*':
      return v1 * v2;
    case '/':
      return v2 !== 0 ? v1 / v2 : null;
    default:
      return null;
  }
};

const applyUnary = (v: number, op: UnaryOperator): number | null => {
  switch (op) {
    case 'abs':
      return Math.abs(v);
    case 'ceil':
      return Math.ceil(v);
    case 'floor':
      return Math.floor(v);
    case 'round':
      return Math.round(v);
    default:
      return null;
  }
};

const parseArithmetic = (input: string): number | null => {
  let pos = 0;
  const skipWhitespace = () => {
    while (pos < input.length && /\s/.test(input[pos])) pos++;
  };

  const parseNumber = (): number | null => {
    skipWhitespace();
    const start = pos;
    if (pos < input.length && input[pos] === '-') pos++;
    if (pos >= input.length || !/\d/.test(input[pos])) {
      pos = start;
      return null;
    }
    while (pos < input.length && /\d/.test(input[pos])) pos++;
    if (pos < input.length && input[pos] === '.') {
      pos++;
      while (pos < input.length && /\d/.test(input[pos])) pos++;
    }
    return Number(input.slice(start, pos));
  };

  const parseFactor = (): number | null => {
    skipWhitespace();
    if (pos < input.length && input[pos] === '(') {
      pos++;
      const val = parseExpr();
      skipWhitespace();
      if (pos >= input.length || input[pos] !== ')') return null;
      pos++;
      return val;
    }
    return parseNumber();
  };

  const parseTerm = (): number | null => {
    let left = parseFactor();
    if (left === null) return null;
    while (pos < input.length) {
      skipWhitespace();
      const op = input[pos];
      if (op !== '*' && op !== '/') break;
      pos++;
      const right = parseFactor();
      if (right === null) return null;
      left = op === '*' ? left * right : right !== 0 ? left / right : null;
      if (left === null) return null;
    }
    return left;
  };

  const parseExpr = (): number | null => {
    let left = parseTerm();
    if (left === null) return null;
    while (pos < input.length) {
      skipWhitespace();
      const op = input[pos];
      if (op !== '+' && op !== '-') break;
      pos++;
      const right = parseTerm();
      if (right === null) return null;
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };

  const result = parseExpr();
  skipWhitespace();
  if (pos !== input.length) return null;
  return result !== null && isFinite(result) ? result : null;
};

const evaluateExpression = (expression: string, source: Record<string, unknown>): number | null => {
  const expr = expression.replace(/\$\{([^}]+)\}/g, (_, fieldName) => {
    const val = Number(source[fieldName]);
    return isNaN(val) ? 'NaN' : String(val);
  });
  if (expr.includes('NaN')) return null;
  return parseArithmetic(expr);
};

const operatorMap: Record<BinaryOperator, string> = {
  '+': 'plus',
  '-': 'minus',
  '*': 'times',
  '/': 'div',
};

const fieldLabel = (field: string | undefined, custom: string) =>
  field === CUSTOM_VALUE_KEY ? custom : field;

export const generateAlias = (c: Partial<AddFieldConfig>): string => {
  if (c.mode === 'unary') {
    return c.unaryField ? `${c.unaryOperator || 'abs'}(${c.unaryField})` : '';
  }
  if (c.mode === 'crossFields') {
    if (c.crossFieldsOperator === 'expression') {
      return c.expression || '';
    }
    const fields = (c.crossFields ?? []).map((f) => f.name).join(', ');
    return fields ? `${c.crossFieldsOperator || 'total'}(${fields})` : '';
  }
  const f1 = fieldLabel(c.field1, c.field1CustomValue || '');
  const f2 = fieldLabel(c.field2, c.field2CustomValue || '');
  const op = operatorMap[c.binaryOperator || '+'];
  return f1 && f2 ? `${f1}_${op}_${f2}` : '';
};

const FieldPicker = ({
  value,
  customValue,
  availableFields,
  onFieldChange,
  onCustomValueChange,
}: {
  value: string | undefined;
  customValue: string;
  availableFields: FieldSchema[];
  onFieldChange: (field: string | undefined) => void;
  onCustomValueChange: (v: string) => void;
}) => {
  const isCustom = value === CUSTOM_VALUE_KEY;

  if (isCustom) {
    return (
      <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
        <EuiFlexItem>
          <DebouncedFieldText
            value={customValue}
            onChange={(val) => onCustomValueChange(val)}
            placeholder={i18n.translate('explore.transformations.addField.enterValuePlaceholder', {
              defaultMessage: 'Enter value',
            })}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="list"
            size="s"
            color="text"
            aria-label={i18n.translate('explore.transformations.addField.switchToFieldList', {
              defaultMessage: 'Show fields',
            })}
            onClick={() => onFieldChange(undefined)}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  return (
    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
      <EuiFlexItem>
        <FieldSelector
          showLabel={false}
          configField={value}
          availableFields={availableFields}
          updateConfigField={(fieldSchema: FieldSchema | undefined) => {
            onFieldChange(fieldSchema?.name);
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          iconType="pencil"
          size="s"
          color="text"
          aria-label={i18n.translate('explore.transformations.addField.switchToCustom', {
            defaultMessage: 'Enter custom value',
          })}
          onClick={() => onFieldChange(CUSTOM_VALUE_KEY)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const AddFieldEditor = ({
  config,
  onChange,
  availableFields,
}: {
  config: AddFieldConfig;
  onChange: (newConfig: AddFieldConfig) => void;
  availableFields: FieldSchema[];
}) => {
  const update = useCallback(
    (partial: Partial<AddFieldConfig>) => {
      onChange({ ...config, ...partial });
    },
    [config, onChange]
  );

  // add field only supports numerical currently
  const numericalFields = useMemo(
    () => availableFields.filter((f) => f.visFieldType === VisFieldType.Numerical),
    [availableFields]
  );

  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.transformations.addField.modeLabel', {
            defaultMessage: 'Mode',
          })}
          display="columnCompressed"
        >
          <EuiButtonGroup
            legend={i18n.translate('explore.transformations.addField.modeLegend', {
              defaultMessage: 'Calculation mode',
            })}
            options={modeToggleOptions}
            idSelected={config.mode}
            onChange={(id) => update({ mode: id as Mode })}
            buttonSize="compressed"
            data-test-subj="addFieldModeToggle"
          />
        </EuiFormRow>
      </EuiFlexItem>

      {config.mode === 'binary' ? (
        <>
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('explore.transformations.addField.field1Label', {
                defaultMessage: 'Field 1',
              })}
              display="columnCompressed"
            >
              <FieldPicker
                value={config.field1}
                customValue={config.field1CustomValue}
                availableFields={numericalFields}
                onFieldChange={(f) => update({ field1: f })}
                onCustomValueChange={(v) => update({ field1CustomValue: v })}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('explore.transformations.addField.operatorLabel', {
                defaultMessage: 'Operator',
              })}
              display="columnCompressed"
            >
              <EuiSelect
                compressed
                options={binaryOperatorOptions}
                value={config.binaryOperator}
                onChange={(e) => update({ binaryOperator: e.target.value as BinaryOperator })}
                data-test-subj="addFieldBinaryOperatorSelect"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('explore.transformations.addField.field2Label', {
                defaultMessage: 'Field 2',
              })}
              display="columnCompressed"
            >
              <FieldPicker
                value={config.field2}
                customValue={config.field2CustomValue}
                availableFields={numericalFields}
                onFieldChange={(f) => update({ field2: f })}
                onCustomValueChange={(v) => update({ field2CustomValue: v })}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </>
      ) : config.mode === 'unary' ? (
        <>
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('explore.transformations.addField.unaryOperatorLabel', {
                defaultMessage: 'Function',
              })}
              display="columnCompressed"
            >
              <EuiSelect
                compressed
                options={unaryOperatorOptions}
                value={config.unaryOperator}
                onChange={(e) => update({ unaryOperator: e.target.value as UnaryOperator })}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <FieldSelector
              configField={config.unaryField}
              availableFields={numericalFields}
              updateConfigField={(fieldSchema) => update({ unaryField: fieldSchema?.name })}
            />
          </EuiFlexItem>
        </>
      ) : (
        <>
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('explore.transformations.addField.crossFieldsOperatorLabel', {
                defaultMessage: 'Function',
              })}
              display="columnCompressed"
            >
              <EuiSelect
                compressed
                options={[
                  {
                    value: 'total',
                    text: i18n.translate('explore.transformations.addField.total', {
                      defaultMessage: 'Total',
                    }),
                  },
                  {
                    value: 'mean',
                    text: i18n.translate('explore.transformations.addField.mean', {
                      defaultMessage: 'Mean',
                    }),
                  },
                  {
                    value: 'expression',
                    text: i18n.translate('explore.transformations.addField.expression', {
                      defaultMessage: 'Expression',
                    }),
                  },
                ]}
                value={config.crossFieldsOperator}
                onChange={(e) =>
                  update({ crossFieldsOperator: e.target.value as CrossFieldsOperator })
                }
                data-test-subj="addFieldCrossFieldsOperatorSelect"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            {config.crossFieldsOperator === 'expression' ? (
              <EuiFormRow
                label={i18n.translate('explore.transformations.addField.expressionLabel', {
                  defaultMessage: 'Expression',
                })}
                display="columnCompressed"
              >
                <DebouncedFieldText
                  value={config.expression}
                  onChange={(val) => update({ expression: val })}
                  placeholder="${field1} + ${field2} * ${field3}"
                  data-test-subj="addFieldExpressionInput"
                />
              </EuiFormRow>
            ) : (
              <FieldSelector
                configFields={(config.crossFields ?? []).map((f) => f.name)}
                availableFields={numericalFields}
                updateConfigFields={(fields) => update({ crossFields: fields })}
                supportMulti
                testSubjPrefix="addFieldCrossFields"
              />
            )}
          </EuiFlexItem>
        </>
      )}

      {/* Alias */}
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.transformations.addField.aliasLabel', {
            defaultMessage: 'Alias',
          })}
          display="columnCompressed"
        >
          <DebouncedFieldText
            value={config.alias}
            onChange={(val) => update({ alias: val })}
            placeholder={
              generateAlias(config) ||
              i18n.translate('explore.transformations.addField.aliasPlaceholder', {
                defaultMessage: 'Enter field name...',
              })
            }
            data-test-subj="addFieldAliasInput"
          />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export function createAddFieldTransformation(): TransformationInstance<AddFieldConfig> {
  return {
    instance_id: uuid.v4(),
    definition_id: 'add_field',
    config: {
      mode: 'binary',
      field1: undefined,
      field1CustomValue: '',
      binaryOperator: '+',
      field2: undefined,
      field2CustomValue: '',
      unaryOperator: 'abs',
      unaryField: undefined,
      crossFieldsOperator: 'total',
      crossFields: [],
      expression: '',
      alias: '',
    },
    hide: false,
    transformationMethod: (data: OpenSearchSearchHit[], config: AddFieldConfig) => {
      if (!isConfigComplete(config)) return data;

      const alias = config.alias || generateAlias(config);

      return data.map((row) => {
        let result: number | null = null;

        if (config.mode === 'binary') {
          const getRaw = (field: string | undefined, custom: string) =>
            field === CUSTOM_VALUE_KEY ? Number(custom) : Number(get(row, `_source.${field}`));

          const v1 = getRaw(config.field1, config.field1CustomValue);
          const v2 = getRaw(config.field2, config.field2CustomValue);

          if (!isNaN(v1) && !isNaN(v2)) {
            result = applyBinary(v1, config.binaryOperator, v2);
          }
        } else if (config.mode === 'unary') {
          const raw = Number(get(row, `_source.${config.unaryField}`));
          if (!isNaN(raw)) {
            result = applyUnary(raw, config.unaryOperator);
          }
        } else if (config.crossFieldsOperator === 'expression') {
          result = evaluateExpression(config.expression, row._source as Record<string, unknown>);
        } else {
          const values = (config.crossFields ?? [])
            .map((f) => Number(get(row, `_source.${f.name}`)))
            .filter((v) => !isNaN(v));
          if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            result = config.crossFieldsOperator === 'total' ? sum : sum / values.length;
          }
        }
        const newSource =
          result !== null
            ? { ...(row._source as Record<string, unknown>), [alias]: result }
            : { ...(row._source as Record<string, unknown>) };

        return { ...row, _source: newSource };
      });
    },
    validateConfig: (config: AddFieldConfig, availableFields: Array<{ name?: string }>) => {
      const fieldNames = new Set(availableFields.map((f) => f.name));
      const patch: Partial<AddFieldConfig> = {};

      if (config.mode === 'binary') {
        if (config.field1 && config.field1 !== CUSTOM_VALUE_KEY && !fieldNames.has(config.field1)) {
          patch.field1 = undefined;
          patch.field1CustomValue = '';
        }
        if (config.field2 && config.field2 !== CUSTOM_VALUE_KEY && !fieldNames.has(config.field2)) {
          patch.field2 = undefined;
          patch.field2CustomValue = '';
        }
      } else if (config.mode === 'unary') {
        if (config.unaryField && !fieldNames.has(config.unaryField)) {
          patch.unaryField = undefined;
        }
      } else if (config.crossFieldsOperator !== 'expression') {
        const valid = (config.crossFields ?? []).filter((f) => fieldNames.has(f.name));
        if (valid.length !== (config.crossFields ?? []).length) {
          patch.crossFields = valid;
        }
      }

      return Object.keys(patch).length > 0 ? { ...config, ...patch } : config;
    },
    Editor: AddFieldEditor,
  };
}

export const addFieldTransformationDefinition: TransformationDefinition<AddFieldConfig> = {
  id: 'add_field',
  type: 'transform',
  label: i18n.translate('explore.transformations.addField.label', { defaultMessage: 'Add Field' }),
  description: i18n.translate('explore.transformations.addField.description', {
    defaultMessage:
      'Create a new field using binary or unary calculations on existing numerical fields',
  }),
  iconType: 'plusInCircle',
  createInstance: createAddFieldTransformation,
};
