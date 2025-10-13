/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFormRow } from '@elastic/eui';
import { DebouncedFieldNumber } from '../utils';

export interface MinMaxControlsProps {
  min?: number;
  max?: number;
  onMinChange: (min: number | undefined) => void;
  onMaxChange: (max: number | undefined) => void;
}

export const MinMaxControls = ({ min, max, onMaxChange, onMinChange }: MinMaxControlsProps) => {
  return (
    <>
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.threshold.base.min', {
          defaultMessage: 'Min',
        })}
        helpText={i18n.translate('explore.stylePanel.threshold.base.min.help', {
          defaultMessage: 'Leave empty to calculate based on all values',
        })}
      >
        <DebouncedFieldNumber
          value={min}
          onChange={(value) => onMinChange(value)}
          placeholder="auto"
          data-test-subj="thresholdMinBase"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.threshold.base.max', {
          defaultMessage: 'Max',
        })}
        helpText={i18n.translate('explore.stylePanel.threshold.base.max.help', {
          defaultMessage: 'Leave empty to calculate based on all values',
        })}
      >
        <DebouncedFieldNumber
          value={max}
          onChange={(value) => onMaxChange(value)}
          placeholder="auto"
          data-test-subj="thresholdMaxBase"
        />
      </EuiFormRow>
    </>
  );
};
