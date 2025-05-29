/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import {
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { SelectOption, SwitchOption } from '../../../../../../charts/public';
import { getPositions, Positions } from '../utils/collections';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';

interface BasicVisOptionsProps {
  addTooltip: boolean;
  addLegend: boolean;
  legendPosition: string;
  addTimeMarker: boolean;
  mode: string;
  showLine: boolean;
  lineMode: string;
  lineWidth: number;
  showDots: boolean;
  onAddTooltipChange: (addTooltip: boolean) => void;
  onAddLegendChange: (addLegend: boolean) => void;
  onLegendPositionChange: (legendPosition: Positions) => void;
  onAddTimeMarkerChange: (addTimeMarker: boolean) => void;
  onModeChange: (mode: string) => void;
  onShowLineChange: (showLine: boolean) => void;
  onLineModeChange: (lineMode: string) => void;
  onLineWidthChange: (lineWidth: number) => void;
  onShowDotsChange: (showDots: boolean) => void;
}

export const BasicVisOptions = ({
  addTooltip,
  addLegend,
  legendPosition,
  addTimeMarker,
  showLine,
  lineMode,
  lineWidth,
  showDots,
  onAddTooltipChange,
  onAddLegendChange,
  onLegendPositionChange,
  onAddTimeMarkerChange,
  onModeChange,
  onShowLineChange,
  onLineModeChange,
  onLineWidthChange,
  onShowDotsChange,
}: BasicVisOptionsProps) => {
  // Could import and reuse { getConfigCollections } from '../../../../../vis_type_vislib/public';
  // That requires adding vis_type_vislib as a dependency to discover, and somehow that throw errors
  const legendPositions = getPositions();

  // Use debounced value for line width
  const [localLineWidth, handleLineWidthChange] = useDebouncedNumericValue(
    lineWidth,
    onLineWidthChange,
    { min: 1, max: 10, defaultValue: 2 }
  );

  const lineModeOptions = [
    { value: 'straight', text: 'Straight' },
    { value: 'smooth', text: 'Smooth' },
    { value: 'stepped', text: 'Stepped' },
  ];

  return (
    <EuiPanel paddingSize="s">
      <EuiTitle size="xs">
        <h4>
          {i18n.translate('discover.vis.gridOptions.basicSettings', {
            defaultMessage: 'Basic Settings',
          })}
        </h4>
      </EuiTitle>

      <EuiSpacer size="s" />

      {/* Show Line Toggle */}
      <SwitchOption
        label={i18n.translate('discover.stylePanel.basic.showLine', {
          defaultMessage: 'Show line',
        })}
        paramName="showLine"
        value={showLine}
        setValue={(_, value) => onShowLineChange(value)}
      />

      {/* Line Configuration - Same Row */}
      <EuiSpacer size="s" />
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('discover.stylePanel.basic.lineMode', {
              defaultMessage: 'Line Mode',
            })}
          >
            <EuiSelect
              options={lineModeOptions}
              value={lineMode}
              onChange={(e) => onLineModeChange(e.target.value)}
              disabled={!showLine}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('discover.stylePanel.basic.linewidth', {
              defaultMessage: 'Line Width',
            })}
          >
            <EuiFieldNumber
              value={localLineWidth}
              onChange={(e) => handleLineWidthChange(e.target.value)}
              min={1}
              max={10}
              step={1}
              disabled={!showLine}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      {/* Show Dots Toggle */}
      <SwitchOption
        label={i18n.translate('discover.stylePanel.basic.showDots', {
          defaultMessage: 'Show dots',
        })}
        paramName="showDots"
        value={showDots}
        setValue={(_, value) => onShowDotsChange(value)}
      />

      <EuiSpacer size="s" />

      <SwitchOption
        label={i18n.translate('discover.stylePanel.basic.showLegend', {
          defaultMessage: 'Show legend',
        })}
        paramName="addLegend"
        value={addLegend}
        setValue={(_, value) => onAddLegendChange(value)}
      />

      {addLegend && (
        <SelectOption
          label={i18n.translate('discover.stylePanel.basic.legendPosition', {
            defaultMessage: 'Legend position',
          })}
          options={legendPositions}
          paramName="legendPosition"
          value={legendPosition}
          setValue={(_, value) => onLegendPositionChange(value as Positions)}
        />
      )}

      <SwitchOption
        label={i18n.translate('discover.stylePanel.basic.showTooltip', {
          defaultMessage: 'Show tooltip',
        })}
        paramName="addTooltip"
        value={addTooltip}
        setValue={(_, value) => onAddTooltipChange(value)}
      />

      <SwitchOption
        label={i18n.translate('discover.stylePanel.basic.showTimeMarker', {
          defaultMessage: 'Show current time marker',
        })}
        paramName="addTimeMarker"
        value={addTimeMarker}
        setValue={(_, value) => onAddTimeMarkerChange(value)}
      />
    </EuiPanel>
  );
};
