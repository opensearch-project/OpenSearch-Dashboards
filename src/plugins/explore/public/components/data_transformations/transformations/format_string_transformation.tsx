/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiSelect } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  TransformationConfigSchema,
  TransformationDefinition,
  TransformationEditorProps,
  TransformationInstance,
} from '../types';
import { FieldSelector } from '../field_selector';
import {
  createAppliedResult,
  createInvalidConfigResult,
  createMissingFieldsResult,
  isDateField,
  isNumericalField,
  rowHasField,
} from '../transformation_utils';

export type StringFormat = 'upper' | 'lower' | 'sentence' | 'title' | 'trim';

export interface FormatStringConfig {
  field: string | undefined;
  format: StringFormat;
}

const formatOptions: Array<{ value: StringFormat; text: string }> = [
  {
    value: 'upper',
    text: i18n.translate('explore.transformations.formatString.upper', {
      defaultMessage: 'Upper case',
    }),
  },
  {
    value: 'lower',
    text: i18n.translate('explore.transformations.formatString.lower', {
      defaultMessage: 'Lower case',
    }),
  },
  {
    value: 'sentence',
    text: i18n.translate('explore.transformations.formatString.sentence', {
      defaultMessage: 'Sentence case',
    }),
  },
  {
    value: 'title',
    text: i18n.translate('explore.transformations.formatString.title', {
      defaultMessage: 'Title case',
    }),
  },
  {
    value: 'trim',
    text: i18n.translate('explore.transformations.formatString.trim', {
      defaultMessage: 'Trim',
    }),
  },
];

export const formatString = (value: string, format: StringFormat): string => {
  switch (format) {
    case 'upper':
      return value.toUpperCase();
    case 'lower':
      return value.toLowerCase();
    // Sentence: the first non-space character upper, the rest lower.
    case 'sentence':
      return value
        .toLowerCase()
        .replace(/^(\s*)(\S)/, (_, space: string, char: string) => `${space}${char.toUpperCase()}`);
    // Title: each word's first character upper, the rest lower.
    case 'title':
      return value
        .toLowerCase()
        .replace(
          /(^|\s)(\S)/g,
          (_, space: string, char: string) => `${space}${char.toUpperCase()}`
        );
    case 'trim':
      return value.trim();
    // An unknown format, leaves the value as it is.
    default:
      return value;
  }
};

const isStringFormat = (format: unknown): format is StringFormat =>
  formatOptions.some(({ value }) => value === format);

const FormatStringEditor = ({
  config,
  onChange,
  availableFields,
}: TransformationEditorProps<FormatStringConfig>) => (
  <EuiFlexGroup direction="column" gutterSize="s">
    <EuiFlexItem>
      <FieldSelector
        configField={config.field}
        // only cover categorical fields
        availableFields={availableFields.filter(
          (field) => !isNumericalField(field) && !isDateField(field)
        )}
        updateConfigField={(field) => onChange({ ...config, field: field?.name })}
        testSubjPrefix="formatString"
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <EuiFormRow
        label={i18n.translate('explore.transformations.formatString.formatLabel', {
          defaultMessage: 'Format',
        })}
        display="columnCompressed"
      >
        <EuiSelect
          compressed
          options={formatOptions}
          value={config.format}
          onChange={(e) => onChange({ ...config, format: e.target.value as StringFormat })}
          data-test-subj="formatStringFormatSelect"
        />
      </EuiFormRow>
    </EuiFlexItem>
  </EuiFlexGroup>
);

/**
 * Formats the string values of one field; numbers, nulls and objects stay as they are. The schema
 * is unchanged.
 *
 * Formats, for the value '  web SERVER ':
 * - upper:    '  WEB SERVER '
 * - lower:    '  web server '
 * - sentence: '  Web server '  (first non-space character upper, the rest lower)
 * - title:    '  Web Server '  (each word's first character upper, the rest lower)
 * - trim:     'web SERVER'     (spaces at both ends removed)
 *
 * @example
 * config: { field: 'host', format: 'title' }
 * input
 * [{ host: 'web SERVER', count: 1 }, { host: null, count: 2 }, { host: 7, count: 3 }]
 * output
 * [{ host: 'Web Server', count: 1 }, { host: null, count: 2 }, { host: 7, count: 3 }]
 *
 * Without a field, or with an unknown format: invalid_config, rows unchanged.
 * When no row has the field: missing_fields, rows unchanged.
 */
export function createFormatStringTransformation(): TransformationInstance<FormatStringConfig> {
  return {
    instance_id: uuidv4(),
    definition_id: 'format_string',
    config: { field: undefined, format: 'upper' },
    hide: false,
    transformationMethod: (data, config) => {
      const { field, format } = config;
      if (!field || !format) {
        return createInvalidConfigResult(data, 'Format string configuration is incomplete.');
      }
      if (!isStringFormat(format)) {
        return createInvalidConfigResult(data, `Unknown string format: ${format}`);
      }
      if (!data.some((row) => rowHasField(row, field))) {
        return createMissingFieldsResult(data, [field]);
      }
      // Only string values change; numbers, nulls and objects stay as they are.
      return createAppliedResult(
        data.map((row) =>
          typeof row[field] === 'string'
            ? { ...row, [field]: formatString(row[field] as string, format) }
            : row
        )
      );
    },
    Editor: FormatStringEditor,
  };
}

export const formatStringTransformationDefinition: TransformationDefinition<FormatStringConfig> = {
  id: 'format_string',
  type: 'format',
  label: i18n.translate('explore.transformations.formatString.label', {
    defaultMessage: 'Format string',
  }),
  description: i18n.translate('explore.transformations.formatString.description', {
    defaultMessage: 'Change the case of a text field, or trim its spaces.',
  }),
  iconType: 'editorCodeBlock',
  createInstance: createFormatStringTransformation,
};

export const formatStringConfigSchema: TransformationConfigSchema = {
  field: {
    description: 'The text field to format.',
    kind: 'field_name',
    defaultValue: undefined,
    required: true,
  },
  format: {
    description: 'How to format the values.',
    kind: 'enum',
    defaultValue: 'upper',
    required: true,
    enumOptions: formatOptions.map(({ value, text }) => ({ value, label: text })),
  },
};
