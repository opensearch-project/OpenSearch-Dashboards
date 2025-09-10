/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiButtonGroup, EuiFormRow, EuiRange, EuiSpacer, EuiSwitch } from '@elastic/eui';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';
import { StyleAccordion } from '../style_panel/style_accordion';
import { LineMode } from './line_vis_config';

export type LineStyle = 'both' | 'line' | 'dots';

interface BasicVisOptionsProps {
  addTimeMarker: boolean;
  lineStyle: LineStyle;
  lineMode: LineMode;
  lineWidth: number;
  onAddTimeMarkerChange: (addTimeMarker: boolean) => void;
  onLineModeChange: (lineMode: LineMode) => void;
  onLineWidthChange: (lineWidth: number) => void;
  onLineStyleChange: (style: LineStyle) => void;
  shouldShowTimeMarker?: boolean;
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
  shouldShowTimeMarker = true,
}: BasicVisOptionsProps) => {
  // Could import and reuse { getConfigCollections } from '../../../../../vis_type_vislib/public';
  // That requires adding vis_type_vislib as a dependency to discover, and somehow that throw errors

  // Use debounced value for line width
  const [localLineWidth, handleLineWidthChange] = useDebouncedNumericValue(
    lineWidth,
    onLineWidthChange,
    { min: 1, max: 10, defaultValue: 2 }
  );

  const lineModeOptions: Array<{ value: LineMode; text: string }> = [
    { value: 'straight', text: 'Straight' },
    { value: 'smooth', text: 'Smooth' },
    { value: 'stepped', text: 'Stepped' },
  ];

  return (
    <StyleAccordion
      id="lineSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.line', {
        defaultMessage: 'Line',
      })}
      initialIsOpen={true}
      data-test-subj="lineVisStyleAccordion"
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.basic.linestyle', {
          defaultMessage: 'Style',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.basic.linestyle', {
            defaultMessage: 'Style',
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
          defaultMessage: 'Interpolation',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.basic.lineMode', {
            defaultMessage: 'Interpolation',
          })}
          options={lineModeOptions.map((option) => ({
            id: option.value,
            label: option.text,
            'data-test-subj': `lineMode-${option.value}`,
          }))}
          idSelected={lineMode}
          onChange={(id) => onLineModeChange(id as LineMode)}
          buttonSize="compressed"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.basic.linewidth', {
          defaultMessage: 'Line width',
        })}
      >
        <EuiRange
          compressed
          value={localLineWidth}
          onChange={(e) => handleLineWidthChange((e.target as HTMLInputElement).value)}
          min={1}
          max={10}
          step={1}
          aria-label={i18n.translate('explore.stylePanel.basic.linewidth', {
            defaultMessage: 'Line width',
          })}
          showLabels
          showValue
        />
      </EuiFormRow>

      <EuiSpacer size="s" />

      {shouldShowTimeMarker && (
        <EuiFormRow
          label={i18n.translate('explore.stylePanel.basic.showTimeMarker', {
            defaultMessage: 'Show current time marker',
          })}
        >
          <EuiSwitch
            compressed
            label=""
            checked={addTimeMarker}
            onChange={(e) => onAddTimeMarkerChange(e.target.checked)}
          />
        </EuiFormRow>
      )}
    </StyleAccordion>
  );
};
