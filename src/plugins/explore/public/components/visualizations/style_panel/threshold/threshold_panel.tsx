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

// export const Colors: Record<ColorSchemas, any> = {
//   [ColorSchemas.BLUES]: {
//     baseColor: '#9ecae1',
//     colors: [
//       '#c6dbef',
//       '#9ecae1',
//       '#6baed6',
//       '#4292c6',
//       '#2171b5',
//       '#08519c',
//       '#08306b',
//       '#041f45',
//     ],
//   },

//   [ColorSchemas.GREENS]: {
//     baseColor: '#a1d99b',
//     colors: [
//       '#c7e9c0',
//       '#a1d99b',
//       '#74c476',
//       '#41ab5d',
//       '#238b45',
//       '#006d2c',
//       '#00441b',
//       '#003214',
//     ],
//   },

//   [ColorSchemas.GREYS]: {
//     baseColor: '#d9d9d9',
//     colors: [
//       '#f0f0f0',
//       '#d9d9d9',
//       '#bdbdbd',
//       '#969696',
//       '#737373',
//       '#525252',
//       '#252525',
//       '#111111',
//     ],
//   },

//   [ColorSchemas.REDS]: {
//     baseColor: '#fc9272',
//     colors: [
//       '#fcbba1',
//       '#fc9272',
//       '#fb6a4a',
//       '#ef3b2c',
//       '#cb181d',
//       '#a50f15',
//       '#67000d',
//       '#3b0008',
//     ],
//   },

//   [ColorSchemas.GREENBLUE]: {
//     baseColor: '#a8ddb5',
//     colors: [
//       '#ccebc5',
//       '#a8ddb5',
//       '#7bccc4',
//       '#4eb3d3',
//       '#2b8cbe',
//       '#0868ac',
//       '#084081',
//       '#042f5f',
//     ],
//   },

//   [ColorSchemas.YELLOWORANGE]: {
//     baseColor: '#fed976',
//     colors: [
//       '#ffffb2',
//       '#fed976',
//       '#feb24c',
//       '#fd8d3c',
//       '#f03b20',
//       '#bd0026',
//       '#800026',
//       '#4d0019',
//     ],
//   },
// };

// export const transformToThreshold = (ranges: RangeValue[], schema: ColorSchemas) => {
//   if (ranges.length === 0) {
//     return [];
//   } else {
//     // if min is undefined and max > min, then discard this range
//     const combinedArray = ranges.reduce<number[]>((acc, val) => {
//       if (val.min === undefined || (val.max && val.max < val.min)) return acc;
//       acc.push(val.min);
//       if (val.max) acc.push(val.max);
//       return acc;
//     }, []);

//     const uniqueArray = Array.from(new Set(combinedArray)).sort((a, b) => a - b);

//     const result = uniqueArray.map((num, i) => ({
//       value: num,
//       color: Colors[schema].colors[i % 6],
//     }));
//     return result;
//   }
// };

// export const transformThresholdLinesToThreshold = (
//   thresholdLines: ThresholdLine[]
// ): Threshold[] => {
//   if (thresholdLines.length === 0) {
//     return [];
//   } else {
//     // if min is undefined and max > min, then discard this range
//     const combinedArray = thresholdLines.map((line) => {
//       return {
//         value: line.value,
//         color: line.color,
//       };
//     });
//     return combinedArray.sort((a, b) => a.value - b.value);
//   }
// };

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

  // only transform data when user saved old metric config or threshold-lines config
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
    return thresholdsOptions?.baseColor || '#9EE9FA';
  });

  const [localThresholdStyle, setLocalThresholdStyle] = useState<ThresholdLineStyle>(() => {
    if (!thresholdsOptions?.thresholdStyle && thresholdLines && thresholdLines.length > 0) {
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
