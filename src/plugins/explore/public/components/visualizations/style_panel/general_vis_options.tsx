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
  addTooltip: boolean;
  addLegend: boolean;
  legendPosition: Positions;

  onAddTooltipChange: (addTooltip: boolean) => void;
  onAddLegendChange: (addLegend: boolean) => void;
  onLegendPositionChange: (legendPosition: Positions) => void;
  shouldShowLegend?: boolean;
}

export const GeneralVisOptions = ({
  addTooltip,
  addLegend,
  legendPosition,
  onAddTooltipChange,
  onAddLegendChange,
  onLegendPositionChange,
  shouldShowLegend = true,
}: GeneralVisOptionsProps) => {
  const legendPositions = getPositions();

  return (
    <EuiPanel paddingSize="s" data-test-subj="generalSettingsPanel">
      <EuiFlexGroup direction="column" alignItems="flexStart" gutterSize="m">
        <EuiFlexItem>
          <EuiTitle size="xs">
            <h4>
              {i18n.translate('explore.stylePanel.general.basicSettings', {
                defaultMessage: 'Basic Settings',
              })}
            </h4>
          </EuiTitle>
        </EuiFlexItem>
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
        <EuiFlexItem>
          <EuiSwitch
            label={i18n.translate('explore.stylePanel.general.showTooltip', {
              defaultMessage: 'Show tooltip',
            })}
            checked={addTooltip}
            onChange={(e) => onAddTooltipChange(e.target.checked)}
            data-test-subj="showTooltipSwitch"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
