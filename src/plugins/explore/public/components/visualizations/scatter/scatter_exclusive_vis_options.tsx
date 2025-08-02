/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiRange, EuiSwitch, EuiFormRow, EuiSelect } from '@elastic/eui';
import React from 'react';
import { ScatterChartStyleControls } from './scatter_vis_config';
import { PointShape } from '../types';
import { getPointShapes } from '../utils/collections';
import { StyleAccordion } from '../style_panel/style_accordion';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';

interface ScatterVisOptionsProps {
  styles: ScatterChartStyleControls['exclusive'];
  onChange: (styles: ScatterChartStyleControls['exclusive']) => void;
}

export const ScatterExclusiveVisOptions = ({ styles, onChange }: ScatterVisOptionsProps) => {
  const updateStyle = <K extends keyof ScatterChartStyleControls['exclusive']>(
    key: K,
    value: ScatterChartStyleControls['exclusive'][K]
  ) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  const [pointAngle, handlePointAngle] = useDebouncedNumericValue(
    styles.angle,
    (val) => onChange({ ...styles, angle: val }),
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
        />
      </EuiFormRow>

      <EuiFormRow>
        <EuiSwitch
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
          value={pointAngle}
          onChange={(e) => handlePointAngle(e.currentTarget.value)}
          showInput
        />
      </EuiFormRow>
    </StyleAccordion>
  );
};
