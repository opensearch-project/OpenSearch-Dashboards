/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { DebouncedTruncateGaugeBaseField } from '../utils';

export interface MinMaxControlsProps {
  min?: number;
  max?: number;
  onMinChange: (min: number | undefined) => void;
  onMaxChange: (max: number | undefined) => void;
}

export const MinMaxControls = ({ min, max, onMaxChange, onMinChange }: MinMaxControlsProps) => {
  return (
    <>
      <DebouncedTruncateGaugeBaseField
        label={i18n.translate('explore.stylePanel.threshold.base.min', {
          defaultMessage: 'Min',
        })}
        value={min}
        onChange={(value) => onMinChange(value)}
        testId={'thresholdMinBase'}
      />

      <DebouncedTruncateGaugeBaseField
        label={i18n.translate('explore.stylePanel.threshold.base.max', {
          defaultMessage: 'Max',
        })}
        value={max}
        onChange={(value) => onMaxChange(value)}
        testId={'thresholdMaxBase'}
      />
    </>
  );
};
