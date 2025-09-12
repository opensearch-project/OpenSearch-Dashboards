/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiSelect, EuiSpacer } from '@elastic/eui';
import { ThresholdCustomValues } from './threshold_custom_values';
import {
  Threshold,
  RangeValue,
  ColorSchemas,
  ThresholdLine,
  ThresholdLineStyle,
  ThresholdOptions,
} from '../../types';
import { StyleAccordion } from '../style_accordion';
import { getThresholdOptions } from '../../utils/collections';
import {
  Colors,
  transformToThreshold,
  transformThresholdLinesToThreshold,
} from './threshold_utils';
import { getColors } from '../../theme/default_colors';

export interface ThresholdPanelProps {
  customRanges?: RangeValue[];
  colorSchema?: ColorSchemas;

  thresholdLines?: ThresholdLine[];

  thresholdsOptions?: ThresholdOptions;
  onChange: (thresholds: ThresholdOptions) => void;
  showThresholdStyle?: boolean;
}

export const ThresholdPanel = ({
  customRanges,
  colorSchema,
  thresholdLines,
  thresholdsOptions,
  onChange,
  showThresholdStyle = false,
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

  // only transform data when user saved old custom ranges config or threshold-lines config
  // and once user makes some updates on threshold, will only focus on threshold
  const [localThreshold, setLocalThreshold] = useState<Threshold[]>(() => {
    if (customRanges && colorSchema && !thresholdsOptions?.thresholds)
      return transformToThreshold(customRanges, colorSchema);

    if (thresholdLines && !thresholdsOptions?.thresholds)
      return transformThresholdLinesToThreshold(thresholdLines);
    return thresholdsOptions?.thresholds ?? [];
  });

  const [localBaseColor, setLocalBaseColor] = useState<string>(() => {
    if (colorSchema && !thresholdsOptions?.baseColor) {
      return Colors[colorSchema].baseColor;
    }
    return thresholdsOptions?.baseColor || getColors().statusGreen;
  });

  const [localThresholdStyle, setLocalThresholdStyle] = useState<ThresholdLineStyle>(() => {
    if (!thresholdsOptions?.thresholdStyle && thresholdLines) {
      return thresholdLines[0].show
        ? thresholdLines[0].style || ThresholdLineStyle.Solid
        : ThresholdLineStyle.Off;
    }
    return thresholdsOptions?.thresholdStyle || ThresholdLineStyle.Off;
  });

  const handleThresholdChange = (ranges: Threshold[]) => {
    updateThresholdOption('thresholds', ranges);
    setLocalThreshold(ranges);
  };

  const handleBaseColorChange = (color: string) => {
    updateThresholdOption('baseColor', color);
    setLocalBaseColor(color);
  };

  const handleThresholdStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalThresholdStyle(e.target.value as ThresholdLineStyle);
    updateThresholdOption('thresholdStyle', e.target.value as ThresholdLineStyle);
  };

  const options = useMemo(() => getThresholdOptions(), []);
  return (
    <StyleAccordion
      id="thresholdSection"
      accordionLabel={i18n.translate('explore.stylePanel.threshold.title', {
        defaultMessage: 'Threshold',
      })}
      initialIsOpen={true}
    >
      <ThresholdCustomValues
        thresholds={localThreshold}
        onThresholdValuesChange={(ranges: Threshold[]) => {
          handleThresholdChange(ranges);
        }}
        baseColor={localBaseColor}
        onBaseColorChange={(color: string) => handleBaseColorChange(color)}
      />

      {showThresholdStyle && (
        <>
          <EuiSpacer />
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.threshold.showthreshold', {
              defaultMessage: 'Show thresholds',
            })}
          >
            <EuiSelect
              options={options}
              value={localThresholdStyle}
              onChange={(e) => handleThresholdStyleChange(e)}
            />
          </EuiFormRow>
        </>
      )}
    </StyleAccordion>
  );
};
