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
  EuiSwitch,
  EuiTitle,
} from '@elastic/eui';
import { getPositions, Positions } from '../utils/collections';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';

interface BasicVisOptionsProps {
  addTooltip: boolean;
  addLegend: boolean;
  legendPosition: string;
  addTimeMarker: boolean;
  showLine: boolean;
  lineMode: string;
  lineWidth: number;
  showDots: boolean;
  onAddTooltipChange: (addTooltip: boolean) => void;
  onAddLegendChange: (addLegend: boolean) => void;
  onLegendPositionChange: (legendPosition: Positions) => void;
  onAddTimeMarkerChange: (addTimeMarker: boolean) => void;
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
          {i18n.translate('explore.vis.gridOptions.basicSettings', {
            defaultMessage: 'Basic Settings',
          })}
        </h4>
      </EuiTitle>

      <EuiSpacer size="s" />

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.basic.showLine', {
          defaultMessage: 'Show line',
        })}
      >
        <EuiSwitch
          label=""
          checked={showLine}
          onChange={(e) => onShowLineChange(e.target.checked)}
        />
      </EuiFormRow>

      <EuiSpacer size="s" />
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.basic.lineMode', {
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
            label={i18n.translate('explore.stylePanel.basic.linewidth', {
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

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.basic.showDots', {
          defaultMessage: 'Show dots',
        })}
      >
        <EuiSwitch
          label=""
          checked={showDots}
          onChange={(e) => onShowDotsChange(e.target.checked)}
        />
      </EuiFormRow>

      <EuiSpacer size="s" />

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.basic.showLegend', {
          defaultMessage: 'Show legend',
        })}
      >
        <EuiSwitch
          label=""
          checked={addLegend}
          onChange={(e) => onAddLegendChange(e.target.checked)}
        />
      </EuiFormRow>

      {addLegend && (
        <EuiFormRow
          label={i18n.translate('explore.stylePanel.basic.legendPosition', {
            defaultMessage: 'Legend position',
          })}
        >
          <EuiSelect
            options={legendPositions}
            value={legendPosition}
            onChange={(e) => onLegendPositionChange(e.target.value as Positions)}
          />
        </EuiFormRow>
      )}

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.basic.showTooltip', {
          defaultMessage: 'Show tooltip',
        })}
      >
        <EuiSwitch
          label=""
          checked={addTooltip}
          onChange={(e) => onAddTooltipChange(e.target.checked)}
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.basic.showTimeMarker', {
          defaultMessage: 'Show current time marker',
        })}
      >
        <EuiSwitch
          label=""
          checked={addTimeMarker}
          onChange={(e) => onAddTimeMarkerChange(e.target.checked)}
        />
      </EuiFormRow>
    </EuiPanel>
  );
};
