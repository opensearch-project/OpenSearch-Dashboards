/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import {
  EuiButtonGroup,
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiRange,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiTitle,
} from '@elastic/eui';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';

// Import LineStyle from line_vis_config
import { LineStyle } from './line_vis_config';

interface BasicVisOptionsProps {
  addTimeMarker: boolean;
  lineStyle: LineStyle;
  lineMode: string;
  lineWidth: number;
  onAddTimeMarkerChange: (addTimeMarker: boolean) => void;
  onLineModeChange: (lineMode: string) => void;
  onLineWidthChange: (lineWidth: number) => void;
  onLineStyleChange: (style: LineStyle) => void;
}

export const LineExclusiveVisOptions = ({
  addTimeMarker,
  lineStyle,
  lineMode,
  lineWidth,
  onAddTimeMarkerChange,
  onLineModeChange,
  onLineWidthChange,
  onLineStyleChange,
}: BasicVisOptionsProps) => {
  // Could import and reuse { getConfigCollections } from '../../../../../vis_type_vislib/public';
  // That requires adding vis_type_vislib as a dependency to discover, and somehow that throw errors

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
    <EuiPanel paddingSize="s" color="subdued">
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.basic.linestyle', {
          defaultMessage: 'Line style',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.basic.linestyle', {
            defaultMessage: 'Line style',
          })}
          options={[
            {
              id: 'both',
              label: i18n.translate('explore.stylePanel.basic.lineWithDots', {
                defaultMessage: 'Default',
              }),
            },
            {
              id: 'line',
              label: i18n.translate('explore.stylePanel.basic.lineOnly', {
                defaultMessage: 'Line only',
              }),
            },
            {
              id: 'dots',
              label: i18n.translate('explore.stylePanel.basic.dotsOnly', {
                defaultMessage: 'Dots only',
              }),
            },
          ]}
          onChange={(optionId) => {
            if (optionId === 'both' || optionId === 'line' || optionId === 'dots') {
              onLineStyleChange(optionId as LineStyle);
            }
          }}
          type="single"
          idSelected={lineStyle}
          buttonSize="compressed"
        />
      </EuiFormRow>

      <EuiSpacer size="s" />

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.basic.lineMode', {
          defaultMessage: 'Line Mode',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.basic.lineMode', {
            defaultMessage: 'Line Mode',
          })}
          options={lineModeOptions.map((option) => ({
            id: option.value,
            label: option.text,
          }))}
          idSelected={lineMode}
          onChange={onLineModeChange}
          buttonSize="compressed"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.basic.linewidth', {
          defaultMessage: 'Line Width',
        })}
      >
        <EuiRange
          value={localLineWidth}
          onChange={(e) => handleLineWidthChange((e.target as HTMLInputElement).value)}
          min={1}
          max={10}
          step={1}
          aria-label={i18n.translate('explore.stylePanel.basic.linewidth', {
            defaultMessage: 'Line Width',
          })}
          showLabels
          showValue
        />
      </EuiFormRow>

      <EuiSpacer size="s" />

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
