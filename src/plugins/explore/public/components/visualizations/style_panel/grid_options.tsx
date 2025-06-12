/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiFormRow,
  EuiSwitch,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { GridOptions } from '../types';

interface GridOptionsProps {
  grid: GridOptions;
  onGridChange: (grid: GridOptions) => void;
}

export const GridOptionsPanel: React.FC<GridOptionsProps> = ({ grid, onGridChange }) => {
  const updateGridOption = <K extends keyof GridOptions>(key: K, value: GridOptions[K]) => {
    onGridChange({
      ...grid,
      [key]: value,
    });
  };

  return (
    <EuiPanel paddingSize="s">
      <EuiTitle size="xs">
        <h4>
          {i18n.translate('explore.vis.gridOptions.gridSettings', {
            defaultMessage: 'Grid Settings',
          })}
        </h4>
      </EuiTitle>

      <EuiSpacer size="s" />

      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow>
            <EuiSwitch
              label={i18n.translate('explore.vis.gridOptions.showCategoryLines', {
                defaultMessage: 'Show category lines',
              })}
              checked={grid.categoryLines}
              onChange={(e) => updateGridOption('categoryLines', e.target.checked)}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow>
            <EuiSwitch
              label={i18n.translate('explore.vis.gridOptions.showValueLines', {
                defaultMessage: 'Show value lines',
              })}
              checked={grid.valueLines}
              onChange={(e) => updateGridOption('valueLines', e.target.checked)}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
