/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import uuid from 'uuid';
import { EuiButtonGroup, EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { get } from 'lodash';
import { TransformationInstance, TransformationDefinition, FieldSchema } from '../index';
import { FieldSelector } from '../field_selector';
import { VisFieldType } from '../../visualizations/types';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { DebouncedFieldText } from '../../visualizations/style_panel/utils';

type ParseFormat = 'json' | 'object';

interface ExtractFieldsConfig {
  field: string | undefined;
  format: ParseFormat;
  prefix: string;
}

const isConfigComplete = (config: ExtractFieldsConfig): boolean => !!config.field;

const applyPrefix = (obj: Record<string, unknown>, prefix: string): Record<string, unknown> => {
  if (!prefix) return obj;
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [prefix + k, v]));
};

const extractFromJSON = (raw: string, prefix: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return applyPrefix(parsed as Record<string, unknown>, prefix);
    }
  } catch {
    // not valid JSON
  }
  return {};
};

const extractFromObject = (raw: unknown, prefix: string): Record<string, unknown> => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return applyPrefix(raw as Record<string, unknown>, prefix);
  }
  return {};
};

const ExtractFieldsEditor = ({
  config,
  onChange,
  availableFields,
}: {
  config: ExtractFieldsConfig;
  onChange: (newConfig: ExtractFieldsConfig) => void;
  availableFields: FieldSchema[];
}) => {
  const update = useCallback(
    (patch: Partial<ExtractFieldsConfig>) => onChange({ ...config, ...patch }),
    [config, onChange]
  );

  const possibleFields = useMemo(
    () =>
      availableFields.filter(
        (f) => f.visFieldType !== VisFieldType.Numerical && f.visFieldType !== VisFieldType.Date
      ),
    [availableFields]
  );

  const formatOptions = [
    {
      id: 'object',
      label: i18n.translate('explore.transformations.extractFields.objectFormat', {
        defaultMessage: 'Object',
      }),
    },
    {
      id: 'json',
      label: i18n.translate('explore.transformations.extractFields.jsonFormat', {
        defaultMessage: 'JSON string',
      }),
    },
  ];

  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      <EuiFlexItem>
        <FieldSelector
          configField={config.field}
          availableFields={possibleFields}
          updateConfigField={(f) => update({ field: f?.name })}
          testSubjPrefix="extractFieldsSource"
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.transformations.extractFields.formatLabel', {
            defaultMessage: 'Format',
          })}
          display="columnCompressed"
        >
          <EuiButtonGroup
            legend={i18n.translate('explore.transformations.extractFields.formatLegend', {
              defaultMessage: 'Parse format',
            })}
            options={formatOptions}
            idSelected={config.format}
            onChange={(id) => update({ format: id as ParseFormat })}
            buttonSize="compressed"
            data-test-subj="extractFieldsFormatToggle"
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.transformations.extractFields.prefixLabel', {
            defaultMessage: 'Column prefix',
          })}
          display="columnCompressed"
        >
          <DebouncedFieldText
            value={config.prefix}
            onChange={(val) => update({ prefix: val })}
            placeholder={i18n.translate('explore.transformations.extractFields.prefixPlaceholder', {
              defaultMessage: 'Optional prefix...',
            })}
          />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export function createExtractFieldsTransformation(): TransformationInstance<ExtractFieldsConfig> {
  return {
    instance_id: uuid.v4(),
    definition_id: 'extract_fields',
    config: {
      field: undefined,
      format: 'object',
      prefix: '',
    },
    hide: false,
    transformationMethod: (data: OpenSearchSearchHit[], config: ExtractFieldsConfig) => {
      if (!isConfigComplete(config)) return data;

      return data.map((row) => {
        const raw = get(row, `_source.${config.field}`);
        if (raw == null) return row;

        const extracted =
          config.format === 'json'
            ? extractFromJSON(String(raw), config.prefix)
            : extractFromObject(raw, config.prefix);

        return {
          ...row,
          _source: { ...(row._source as Record<string, unknown>), ...extracted },
        };
      });
    },
    validateConfig: (config: ExtractFieldsConfig, availableFields: Array<{ name?: string }>) => {
      const fieldNames = new Set(availableFields.map((f) => f.name));
      if (config.field && !fieldNames.has(config.field)) {
        return { ...config, field: undefined };
      }
      return config;
    },
    Editor: ExtractFieldsEditor,
  };
}

export const extractFieldsTransformationDefinition: TransformationDefinition<ExtractFieldsConfig> = {
  id: 'extract_fields',
  type: 'transform',
  label: i18n.translate('explore.transformations.extractFields.label', {
    defaultMessage: 'Extract Fields',
  }),
  description: i18n.translate('explore.transformations.extractFields.description', {
    defaultMessage: 'Flatten a nested object or JSON string field into top-level columns',
  }),
  iconType: 'unlink',
  createInstance: createExtractFieldsTransformation,
};
