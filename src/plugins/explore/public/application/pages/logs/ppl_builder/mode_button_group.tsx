/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonGroup, EuiToolTip } from '@elastic/eui';
import { LogsBuilderMode } from '../logs_query_panel_mode';

interface ModeButtonGroupProps {
  mode: LogsBuilderMode;
  onChange: (mode: LogsBuilderMode) => void;
  builderDisabled?: boolean;
  tooltip?: string;
}

// OUI mirrors each option's `id` onto its hidden radio input as `data-test-subj`,
// while our explicit `data-test-subj` lands on the visible label. Keep them
// distinct so a test-id query resolves to a single element.
const CODE_ID = 'code';
const BUILDER_ID = 'builder';

export const ModeButtonGroup: React.FC<ModeButtonGroupProps> = ({
  mode,
  onChange,
  builderDisabled,
  tooltip,
}) => {
  const options = [
    {
      id: CODE_ID,
      label: i18n.translate('explore.pplBuilder.codeMode', { defaultMessage: 'Code' }),
      'data-test-subj': 'pplBuilderModeToggle-code',
    },
    {
      id: BUILDER_ID,
      label: i18n.translate('explore.pplBuilder.builderMode', { defaultMessage: 'Builder' }),
      isDisabled: builderDisabled,
      'data-test-subj': 'pplBuilderModeToggle-builder',
    },
  ];

  const group = (
    <EuiButtonGroup
      legend={i18n.translate('explore.pplBuilder.modeToggleLegend', {
        defaultMessage: 'Query editor mode',
      })}
      buttonSize="compressed"
      options={options}
      idSelected={mode === 'builder' ? BUILDER_ID : CODE_ID}
      onChange={(id) => onChange(id === BUILDER_ID ? 'builder' : 'code')}
      data-test-subj="pplBuilderModeToggle"
    />
  );

  if (builderDisabled && tooltip) {
    return (
      <EuiToolTip content={tooltip} position="top">
        {group}
      </EuiToolTip>
    );
  }

  return group;
};
