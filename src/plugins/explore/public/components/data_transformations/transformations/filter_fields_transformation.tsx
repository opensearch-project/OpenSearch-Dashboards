/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import uuid from 'uuid';
import { EuiButtonGroup, EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TransformationInstance, TransformationDefinition, FieldSchema } from '../index';
import { FieldSelector } from '../field_selector';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';

type FilterFieldsMode = 'include' | 'exclude';

interface FilterFieldsConfig {
  mode: FilterFieldsMode;
  fieldOptions: FieldSchema[];
}

const isConfigComplete = (config: FilterFieldsConfig): boolean => config.fieldOptions.length > 0;

const FilterFieldsEditor = ({
  config,
  onChange,
  availableFields,
}: {
  config: FilterFieldsConfig;
  onChange: (newConfig: FilterFieldsConfig) => void;
  availableFields: FieldSchema[];
}) => {
  const update = useCallback(
    (partial: Partial<FilterFieldsConfig>) => onChange({ ...config, ...partial }),
    [config, onChange]
  );

  const modeOptions = [
    {
      id: 'include',
      label: i18n.translate('explore.transformations.filterFields.include', {
        defaultMessage: 'Include',
      }),
    },
    {
      id: 'exclude',
      label: i18n.translate('explore.transformations.filterFields.exclude', {
        defaultMessage: 'Exclude',
      }),
    },
  ];

  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.transformations.filterFields.modeLabel', {
            defaultMessage: 'Mode',
          })}
          display="columnCompressed"
        >
          <EuiButtonGroup
            legend={i18n.translate('explore.transformations.filterFields.modeLegend', {
              defaultMessage: 'Filter mode',
            })}
            options={modeOptions}
            idSelected={config.mode}
            onChange={(id) => update({ mode: id as FilterFieldsMode })}
            buttonSize="compressed"
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <FieldSelector
          configFields={config.fieldOptions.map((f) => f.name)}
          availableFields={availableFields}
          updateConfigFields={(fields) => update({ fieldOptions: fields })}
          supportMulti={true}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export function createFilterFieldsTransformation(): TransformationInstance<FilterFieldsConfig> {
  return {
    instance_id: uuid.v4(),
    definition_id: 'filter_fields',
    config: {
      mode: 'exclude',
      fieldOptions: [],
    },
    hide: false,
    transformationMethod: (data: OpenSearchSearchHit[], config: FilterFieldsConfig) => {
      if (!isConfigComplete(config)) return data;

      const fieldNames = new Set(config.fieldOptions.map((f) => f.name));

      return data.map((row) => {
        const source = row._source as Record<string, unknown>;
        const newSource =
          config.mode === 'include'
            ? Object.fromEntries(Object.entries(source).filter(([key]) => fieldNames.has(key)))
            : Object.fromEntries(Object.entries(source).filter(([key]) => !fieldNames.has(key)));

        return { ...row, _source: newSource };
      });
    },
    validateConfig: (config: FilterFieldsConfig, availableFields: Array<{ name?: string }>) => {
      const fieldNames = new Set(availableFields.map((f) => f.name));
      const valid = config.fieldOptions.filter((f) => fieldNames.has(f.name));
      if (valid.length !== config.fieldOptions.length) {
        return { ...config, fieldOptions: valid };
      }
      return config;
    },
    Editor: FilterFieldsEditor,
  };
}

export const filterFieldsTransformationDefinition: TransformationDefinition<FilterFieldsConfig> = {
  id: 'filter_fields',
  type: 'filter',
  label: i18n.translate('explore.transformations.filterFields.label', {
    defaultMessage: 'Filter Fields',
  }),
  description: i18n.translate('explore.transformations.filterFields.description', {
    defaultMessage: 'Include or exclude fields by name',
  }),
  iconType: 'tableOfContents',
  createInstance: createFilterFieldsTransformation,
};
