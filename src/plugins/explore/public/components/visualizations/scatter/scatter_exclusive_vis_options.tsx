/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiRange,
  EuiSwitch,
  EuiFormRow,
  EuiSpacer,
  EuiSelect,
} from '@elastic/eui';
import React from 'react';
import { ScatterChartStyleControls } from './scatter_vis_config';
import { PointShape } from '../types';

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

  return (
    <>
      <EuiSpacer />
      <EuiFlexGroup direction="column" alignItems="flexStart" gutterSize="m">
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('explore.vis.scatter.shape', {
              defaultMessage: 'Shape',
            })}
          >
            <EuiSelect
              options={[
                { value: 'circle', text: 'Circle' },
                { value: 'square', text: 'Square' },
                { value: 'cross', text: 'Cross' },
                { value: 'diamond', text: 'Diamond' },
              ]}
              value={styles.pointShape}
              onChange={(e) => updateStyle('pointShape', e.target.value as PointShape)}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.vis.scatter.filled', {
              defaultMessage: 'Filled',
            })}
            checked={styles.filled}
            onChange={(e) => updateStyle('filled', e.target.checked)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('explore.vis.scatter.colorScale', {
              defaultMessage: 'Angle',
            })}
          >
            <EuiRange
              min={0}
              max={360}
              value={styles.angle}
              onChange={(e) => updateStyle('angle', Number(e.currentTarget.value))}
              showInput
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
