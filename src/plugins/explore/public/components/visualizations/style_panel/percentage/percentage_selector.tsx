/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFormRow, EuiSelect, EuiSwitch } from '@elastic/eui';
import React from 'react';
import { i18n } from '@osd/i18n';
import { PercentageColor } from '../../types';

interface Props {
  showPercentage: boolean;
  percentageColor: PercentageColor;
  onShowPercentageToggle: (show: boolean) => void;
  onPercentageColorChange: (color: PercentageColor) => void;
}

const OPTIONS = [
  {
    text: i18n.translate('explore.vis.stylePanel.percentageColor.standard', {
      defaultMessage: 'Standard',
    }),
    value: 'standard',
  },
  {
    text: i18n.translate('explore.vis.stylePanel.percentageColor.inverted', {
      defaultMessage: 'Inverted',
    }),
    value: 'inverted',
  },
];

export const PercentageSelector = (props: Props) => {
  return (
    <>
      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.vis.metric.showPercentage', {
            defaultMessage: 'Show percentage',
          })}
          checked={props.showPercentage}
          onChange={(e) => props.onShowPercentageToggle(e.target.checked)}
        />
      </EuiFormRow>
      {props.showPercentage && (
        <EuiFormRow
          label={i18n.translate('explore.vis.metric.percentageColor', {
            defaultMessage: 'Percentage color',
          })}
        >
          <EuiSelect
            compressed
            options={OPTIONS}
            value={props.percentageColor}
            onChange={(e) => props.onPercentageColorChange(e.target.value as PercentageColor)}
            data-test-subj="percentageColorSelector"
          />
        </EuiFormRow>
      )}
    </>
  );
};
