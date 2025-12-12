/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiRange, EuiSwitch, EuiFormRow, EuiSelect } from '@elastic/eui';
import React from 'react';
import { defaultScatterChartStyles, ScatterChartStyle } from './scatter_vis_config';
import { PointShape, ColorModeOption } from '../types';
import { getPointShapes } from '../utils/collections';
import { StyleAccordion } from '../style_panel/style_accordion';
import { useDebouncedNumber } from '../utils/use_debounced_value';
import { ColorModeOptionSelect } from '../style_panel/value_mapping/filter_options_select';

export interface ScatterVisOptionsProps {
  styles: ScatterChartStyle['exclusive'];
  onChange: (styles: ScatterChartStyle['exclusive']) => void;
  shouldDisableUseThresholdColor?: boolean;
  colorModeOption?: ColorModeOption | undefined;
  onColorModeOptionChange?: (option: ColorModeOption | undefined) => void;
}

export const ScatterExclusiveVisOptions = ({
  styles,
  onChange,
  shouldDisableUseThresholdColor = false,
  colorModeOption,
  onColorModeOptionChange,
}: ScatterVisOptionsProps) => {
  const updateStyle = <K extends keyof ScatterChartStyle['exclusive']>(
    key: K,
    value: ScatterChartStyle['exclusive'][K]
  ) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  const [pointAngle, handlePointAngle] = useDebouncedNumber(
    styles.angle,
    (val) => onChange({ ...styles, angle: val ?? defaultScatterChartStyles.exclusive.angle }),
    {
      min: 0,
      max: 360,
    }
  );

  const pointShapes = getPointShapes();
  return (
    <StyleAccordion
      data-test-subj="scatterExclusivePanel"
      id="scatterSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.scatter', {
        defaultMessage: 'Scatter',
      })}
      initialIsOpen={true}
    >
      <ColorModeOptionSelect
        colorModeOption={colorModeOption}
        onColorModeOptionChange={onColorModeOptionChange}
        disableThreshold={shouldDisableUseThresholdColor}
      />

      <EuiFormRow
        label={i18n.translate('explore.vis.scatter.shape', {
          defaultMessage: 'Shape',
        })}
      >
        <EuiSelect
          compressed
          options={pointShapes}
          value={styles.pointShape}
          onChange={(e) => updateStyle('pointShape', e.target.value as PointShape)}
          onMouseUp={(e) => e.stopPropagation()}
        />
      </EuiFormRow>

      <EuiFormRow>
        <EuiSwitch
          data-test-subj="pointFilledSwitch"
          compressed
          label={i18n.translate('explore.vis.scatter.filled', {
            defaultMessage: 'Filled',
          })}
          checked={styles.filled}
          onChange={(e) => updateStyle('filled', e.target.checked)}
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.vis.scatter.colorScale', {
          defaultMessage: 'Angle',
        })}
      >
        <EuiRange
          compressed
          min={0}
          max={360}
          value={pointAngle ?? defaultScatterChartStyles.exclusive.angle}
          onChange={(e) =>
            handlePointAngle(e.currentTarget.value ? Number(e.currentTarget.value) : undefined)
          }
          showInput
        />
      </EuiFormRow>
    </StyleAccordion>
  );
};
