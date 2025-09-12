/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFormRow } from '@elastic/eui';
import { ThresholdCustomValues } from './threshold_custom_values';
import { Threshold } from '../../types';
import { StyleAccordion } from '../style_accordion';
import { DebouncedFieldNumber } from '../utils';

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
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.threshold.base.min', {
          defaultMessage: 'Min',
        })}
        helpText={i18n.translate('explore.stylePanel.threshold.base.min.help', {
          defaultMessage: 'Leave empty to calculate based on all values',
        })}
      >
        <DebouncedFieldNumber
          data-test-subj="thresholdMinBase"
          value={min}
          onChange={(value) => onMinChange(value)}
          placeholder="auto"
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
          data-test-subj="thresholdMaxBase"
          value={max}
          onChange={(value) => onMaxChange(value)}
          placeholder="auto"
        />
      </EuiFormRow>

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
