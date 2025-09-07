/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { ThresholdCustomValues } from './threshold_custom_values';
import { Threshold } from '../../types';
import { StyleAccordion } from '../style_accordion';
import { DebouncedTruncateGaugeBaseField } from '../utils';

export interface ThresholdPanelProps {
  thresholds: Threshold[];
  onThresholdValuesChange: (thresholds: Threshold[]) => void;
  baseColor: string;
  onBaseColorChange: (baseColor: string) => void;
  min?: number;
  max?: number;
  onMinChange: (min: number | undefined) => void;
  onMaxChange: (max: number | undefined) => void;
}
export const ThresholdPanel = ({
  thresholds,
  baseColor,
  min,
  max,
  onThresholdValuesChange,
  onBaseColorChange,
  onMaxChange,
  onMinChange,
}: ThresholdPanelProps) => {
  return (
    <StyleAccordion
      id="thresholdSection"
      accordionLabel={i18n.translate('explore.stylePanel.threshold', {
        defaultMessage: 'Threshold',
      })}
      initialIsOpen={true}
    >
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

      <ThresholdCustomValues
        thresholds={thresholds}
        onThresholdValuesChange={(ranges: Threshold[]) => {
          onThresholdValuesChange(ranges);
        }}
        baseColor={baseColor}
        onBaseColorChange={(color: string) => onBaseColorChange(color)}
      />
    </StyleAccordion>
  );
};
