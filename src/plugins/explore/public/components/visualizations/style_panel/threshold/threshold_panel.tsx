/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiSelect, EuiSpacer, EuiSwitch } from '@elastic/eui';
import { ThresholdCustomValues } from './threshold_custom_values';
import { Threshold, ThresholdMode, ThresholdOptions } from '../../types';
import { StyleAccordion } from '../style_accordion';
import { getThresholdOptions } from '../../utils/collections';
import { getColors } from '../../theme/default_colors';

export interface ThresholdPanelProps {
  thresholdsOptions?: ThresholdOptions;
  onChange: (thresholds: ThresholdOptions) => void;
  showThresholdStyle?: boolean;
  canUseThresholdColor?: boolean;
}

export const ThresholdPanel = ({
  thresholdsOptions,
  onChange,
  showThresholdStyle = false,
  canUseThresholdColor = true,
}: ThresholdPanelProps) => {
  const updateThresholdOption = <K extends keyof ThresholdOptions>(
    key: K,
    value: ThresholdOptions[K]
  ) => {
    onChange({
      ...thresholdsOptions,
      [key]: value,
    });
  };

  const options = useMemo(() => getThresholdOptions(), []);
  return (
    <StyleAccordion
      id="thresholdSection"
      accordionLabel={i18n.translate('explore.stylePanel.threshold.title', {
        defaultMessage: 'Thresholds',
      })}
      initialIsOpen={true}
    >
      <ThresholdCustomValues
        thresholds={thresholdsOptions?.thresholds || []}
        onThresholdValuesChange={(ranges: Threshold[]) =>
          updateThresholdOption('thresholds', ranges)
        }
        baseColor={thresholdsOptions?.baseColor || getColors().statusGreen}
        onBaseColorChange={(color: string) => updateThresholdOption('baseColor', color)}
      />

      {showThresholdStyle && (
        <>
          <EuiSpacer />
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.threshold.thresholdMode', {
              defaultMessage: 'Threshold mode',
            })}
          >
            <EuiSelect
              compressed={true}
              options={options}
              value={thresholdsOptions?.thresholdStyle || ThresholdMode.Off}
              onChange={(e) =>
                updateThresholdOption('thresholdStyle', e.target.value as ThresholdMode)
              }
            />
          </EuiFormRow>
        </>
      )}

      {canUseThresholdColor && (
        <>
          <EuiSpacer />
          <EuiFormRow>
            <EuiSwitch
              compressed
              label={i18n.translate('explore.vis.metric.useThresholdColor', {
                defaultMessage: 'Use threshold colors',
              })}
              checked={thresholdsOptions?.useThresholdColor ?? false}
              onChange={(e) => updateThresholdOption('useThresholdColor', e.target.checked)}
            />
          </EuiFormRow>
        </>
      )}
    </StyleAccordion>
  );
};
