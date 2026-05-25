/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import uuid from 'uuid';
import { EuiFormRow } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TransformationInstance, TransformationDefinition } from '../index';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { DebouncedFieldNumber } from '../../visualizations/style_panel/utils';

interface LimitConfig {
  limit: number | undefined;
}

const LimitEditor = ({
  config,
  onChange,
}: {
  config: LimitConfig;
  onChange: (newConfig: LimitConfig) => void;
}) => (
  <EuiFormRow
    label={i18n.translate('explore.transformations.limit.rowsLabel', {
      defaultMessage: 'Number of rows',
    })}
    display="columnCompressed"
  >
    <DebouncedFieldNumber
      value={config.limit}
      min={0}
      onChange={(val) => onChange({ limit: val })}
      data-test-subj="limitTransformationInput"
      placeholder="Enter a value"
    />
  </EuiFormRow>
);

export function createLimitTransformation(): TransformationInstance<LimitConfig> {
  return {
    instance_id: uuid.v4(),
    definition_id: 'limit',
    config: { limit: 10 },
    hide: false,
    transformationMethod: (data: OpenSearchSearchHit[], config: LimitConfig) => {
      if (config.limit === undefined) return data;
      return data.slice(0, config.limit);
    },
    Editor: LimitEditor,
  };
}

export const limitTransformationDefinition: TransformationDefinition<LimitConfig> = {
  id: 'limit',
  type: 'filter',
  label: i18n.translate('explore.transformations.limit.label', { defaultMessage: 'Limit' }),
  description: i18n.translate('explore.transformations.limit.description', {
    defaultMessage: 'Keep only the first N rows of the result.',
  }),
  iconType: 'filter',
  createInstance: createLimitTransformation,
};
