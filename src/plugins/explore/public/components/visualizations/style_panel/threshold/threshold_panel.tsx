/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonGroup, EuiFormRow, EuiSelect, EuiSpacer } from '@elastic/eui';
import { ThresholdCustomValues } from './threshold_custom_values';
import { Threshold, ThresholdMode, ThresholdOptions, ThresholdValueMode } from '../../types';
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

  const thresholdModeOptions = useMemo(
    () => [
      {
        id: 'absolute',
        label: i18n.translate('explore.stylePanel.threshold.mode.absolute', {
          defaultMessage: 'Absolute',
        }),
      },
      {
        id: 'percentage',
        label: i18n.translate('explore.stylePanel.threshold.mode.percentage', {
          defaultMessage: 'Percentage',
        }),
      },
    ],
    []
  );

  return (
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
        thresholdMode={thresholdsOptions?.thresholdMode}
      />

      <EuiSpacer size="s" />
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.threshold.valueMode', {
          defaultMessage: 'Threshold value mode',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.threshold.valueMode.legend', {
            defaultMessage: 'Interpret threshold values as absolute or percentage',
          })}
          data-test-subj="thresholdValueModeButtonGroup"
          buttonSize="compressed"
          isFullWidth
          type="single"
          options={thresholdModeOptions}
          idSelected={thresholdsOptions?.thresholdMode || 'absolute'}
          onChange={(id) => updateThresholdOption('thresholdMode', id as ThresholdValueMode)}
        />
      </EuiFormRow>

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
