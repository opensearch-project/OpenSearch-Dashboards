/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSwitch,
  EuiSelect,
  EuiFormRow,
  EuiFlexItem,
  EuiFlexGroup,
} from '@elastic/eui';
import { getPositions } from '../utils/collections';
import { Positions } from '../types';
export interface GeneralVisOptionsProps {
  addLegend: boolean;
  legendPosition: Positions;

  onAddLegendChange: (addLegend: boolean) => void;
  onLegendPositionChange: (legendPosition: Positions) => void;
  shouldShowLegend?: boolean;
}

export const GeneralVisOptions = ({
  addLegend,
  legendPosition,
  onAddLegendChange,
  onLegendPositionChange,
  shouldShowLegend = true,
}: GeneralVisOptionsProps) => {
  const legendPositions = getPositions();

  return (
    <EuiPanel color="subdued" paddingSize="m">
      <EuiFlexItem grow={true} data-test-subj="generalSettingsPanel">
        <EuiFlexGroup direction="column" alignItems="flexStart" gutterSize="m">
          {shouldShowLegend && (
            <EuiFlexItem>
              <EuiSwitch
                label={i18n.translate('explore.stylePanel.general.showLegend', {
                  defaultMessage: 'Show legend',
                })}
                checked={addLegend}
                onChange={(e) => onAddLegendChange(e.target.checked)}
                data-test-subj="showLegendSwitch"
              />
            </EuiFlexItem>
          )}
          {addLegend && shouldShowLegend && (
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate('explore.stylePanel.general.legendPosition', {
                  defaultMessage: 'Legend position',
                })}
              >
                <EuiSelect
                  value={legendPosition}
                  onChange={(e) => onLegendPositionChange(e.target.value as Positions)}
                  options={legendPositions}
                  data-test-subj="legendPositionSelect"
                />
              </EuiFormRow>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiPanel>
  );
};
