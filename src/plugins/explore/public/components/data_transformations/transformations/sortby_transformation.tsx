/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import uuid from 'uuid';
import { EuiFormRow, EuiButtonGroup, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { get } from 'lodash';
import { TransformationInstance, TransformationDefinition, FieldSchema } from '../index';
import { FieldSelector } from '../field_selector';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';

interface SortByConfig {
  field: string | undefined;
  order: 'asc' | 'desc';
}

const orderOptions = [
  {
    id: 'asc',
    label: i18n.translate('explore.transformations.sortBy.ascending', {
      defaultMessage: 'Ascending',
    }),
  },
  {
    id: 'desc',
    label: i18n.translate('explore.transformations.sortBy.descending', {
      defaultMessage: 'Descending',
    }),
  },
];

const SortByEditor = ({
  config,
  onChange,
  availableFields,
}: {
  config: SortByConfig;
  onChange: (newConfig: SortByConfig) => void;
  availableFields: FieldSchema[];
}) => {
  const handleFieldChange = (fieldSchema: FieldSchema | undefined) => {
    onChange({ ...config, field: fieldSchema?.name || undefined });
  };

  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      <EuiFlexItem>
        <FieldSelector
          configField={config.field}
          availableFields={availableFields}
          updateConfigField={handleFieldChange}
          testSubjPrefix="sortBy"
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.transformations.sortBy.orderLabel', {
            defaultMessage: 'Order',
          })}
          display="columnCompressed"
        >
          <EuiButtonGroup
            legend={i18n.translate('explore.transformations.sortBy.orderLegend', {
              defaultMessage: 'Sort order',
            })}
            options={orderOptions}
            idSelected={config.order}
            onChange={(id) => {
              onChange({ ...config, order: id as 'asc' | 'desc' });
            }}
            buttonSize="compressed"
            isFullWidth
            data-test-subj="sortByOrderButtonGroup"
          />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export function createSortByTransformation(): TransformationInstance<SortByConfig> {
  return {
    instance_id: uuid.v4(),
    definition_id: 'sort_by',
    config: {
      field: undefined,
      order: 'asc',
    },
    hide: false,
    transformationMethod: (data: OpenSearchSearchHit[], config: SortByConfig) => {
      const { field, order } = config;

      if (!field) {
        return data;
      }

      const sorted = [...data];

      sorted.sort((a, b) => {
        // extract values from OpenSearch hit (_source.field)
        const valueA = get(a, `_source.${field}`);
        const valueB = get(b, `_source.${field}`);

        // null/undefined values - push to end
        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return 1;
        if (valueB == null) return -1;

        let comparison = 0;

        if (typeof valueA === 'number' && typeof valueB === 'number') {
          comparison = valueA - valueB;
        } else {
          comparison = String(valueA).localeCompare(String(valueB));
        }

        return order === 'asc' ? comparison : -comparison;
      });

      return sorted;
    },

    validateConfig: (config: SortByConfig, availableFields: Array<{ name?: string }>) => {
      if (config.field && !availableFields.find((f) => f.name === config.field)) {
        return { ...config, field: undefined };
      }
      return config;
    },
    Editor: SortByEditor,
  };
}

export const sortByTransformationDefinition: TransformationDefinition<SortByConfig> = {
  id: 'sort_by',
  type: 'sort',
  label: i18n.translate('explore.transformations.sortBy.label', { defaultMessage: 'Sort By' }),
  description: i18n.translate('explore.transformations.sortBy.description', {
    defaultMessage: 'Sort rows by a field in ascending or descending order',
  }),
  iconType: 'sortable',
  createInstance: createSortByTransformation,
};
