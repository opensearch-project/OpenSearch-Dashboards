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
  EuiSelect,
  EuiSwitch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldNumber,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { GridOptions as GridConfig } from '../line/line_vis_config';

interface GridOptionsProps {
  grid: GridConfig;
  onGridChange: (grid: GridConfig) => void;
}

export const GridOptions: React.FC<GridOptionsProps> = ({ grid, onGridChange }) => {
  const updateGridOption = <K extends keyof GridConfig>(key: K, value: GridConfig[K]) => {
    onGridChange({
      ...grid,
      [key]: value,
    });
  };

  return (
    <EuiPanel paddingSize="s">
      {/* Grid Options */}
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
