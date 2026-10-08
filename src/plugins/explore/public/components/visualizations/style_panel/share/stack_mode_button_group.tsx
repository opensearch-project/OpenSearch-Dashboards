/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiButtonGroup, EuiFormRow } from '@elastic/eui';
import { StackMode } from '../../types';

const stackModeOptions: Array<{ id: StackMode; label: string }> = [
  {
    id: 'none',
    label: i18n.translate('explore.stylePanel.area.stackModeNone', {
      defaultMessage: 'None',
    }),
  },
  {
    id: 'total',
    label: i18n.translate('explore.stylePanel.area.stackModeNormal', {
      defaultMessage: 'Stack',
    }),
  },
  {
    id: 'percentage',
    label: i18n.translate('explore.stylePanel.area.stackModePercentage', {
      defaultMessage: 'Percentage',
    }),
  },
];
export const StackModeButtonGroup = ({
  stackMode,
  onStackModeChange,
  testsubj = 'stackMode',
}: {
  stackMode: StackMode;
  onStackModeChange: (stackMode: StackMode) => void;
  testsubj?: string;
}) => {
  return (
    <EuiFormRow
      label={i18n.translate('explore.stylePanel.stackMode', {
        defaultMessage: 'Stack',
      })}
    >
      <EuiButtonGroup
        legend={i18n.translate('explore.stylePanel.stackMode', {
          defaultMessage: 'Stack',
        })}
        options={stackModeOptions.map((option) => ({
          id: option.id,
          label: option.label,
          'data-test-subj': `${testsubj}-${option.id}`,
        }))}
        idSelected={stackMode}
        onChange={(id) => onStackModeChange(id as StackMode)}
        buttonSize="compressed"
        isFullWidth
        data-test-subj={`${testsubj}ButtonGroup`}
      />
    </EuiFormRow>
  );
};
