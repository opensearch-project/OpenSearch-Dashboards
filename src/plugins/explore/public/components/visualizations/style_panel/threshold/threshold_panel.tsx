/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiSelect, EuiSpacer } from '@elastic/eui';
import { ThresholdCustomValues } from './threshold_custom_values';
import { Threshold, ThresholdMode, ThresholdOptions } from '../../types';
import { StyleAccordion } from '../style_accordion';
import { getThresholdOptions } from '../../utils/collections';
import { getColors } from '../../theme/default_colors';

export interface ThresholdPanelProps {
  thresholdsOptions?: ThresholdOptions;
  onChange: (thresholds: ThresholdOptions) => void;
  showThresholdStyle?: boolean;
  initialIsOpen?: boolean;
}

export const ThresholdPanel = ({
  thresholdsOptions,
  onChange,
  showThresholdStyle = false,
  initialIsOpen = false,
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
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    <StyleAccordion
      id="thresholdSection"
      accordionLabel={i18n.translate('explore.stylePanel.threshold.title', {
        defaultMessage: 'Thresholds',
      })}
      initialIsOpen={initialIsOpen}
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
          <EuiSpacer size="s" />
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.threshold.thresholdMode', {
              defaultMessage: 'Threshold lines mode',
            })}
          >
            <EuiSelect
              data-test-subj="thresholdModeSelect"
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
    </StyleAccordion>
  );
};
