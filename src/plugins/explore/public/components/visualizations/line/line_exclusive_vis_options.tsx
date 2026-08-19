/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { EuiButtonGroup, EuiFormRow, EuiSpacer, EuiSwitch } from '@elastic/eui';
import { StyleAccordion } from '../style_panel/style_accordion';
import { defaultLineChartStyles } from './line_vis_config';
import { InterpolationOption, LineWidthOption } from '../style_panel/share/line_shared_options';
import { PointSizeOption } from '../style_panel/share/point_size_options';
import { ShowValuesSwitch } from '../style_panel/share/value_label_options';
import { ConnectionGroup } from '../style_panel/share/connection_group';
import { LineMode, ConnectNullValuesOption, DisconnectValuesOption, DisableMode } from '../types';

export type LineStyle = 'both' | 'line' | 'dots';

interface BasicVisOptionsProps {
  addTimeMarker: boolean;
  lineStyle: LineStyle;
  lineMode: LineMode;
  lineWidth: number;
  pointSize?: number;
  showValues?: boolean;
  connectNullValues?: ConnectNullValuesOption;
  disconnectValues?: DisconnectValuesOption;
  onAddTimeMarkerChange: (addTimeMarker: boolean) => void;
  onLineModeChange: (lineMode: LineMode) => void;
  onLineWidthChange: (lineWidth: number) => void;
  onLineStyleChange: (style: LineStyle) => void;
  onPointSizeChange: (pointSize: number) => void;
  onShowValuesChange: (showValues: boolean) => void;
  onConnectNullValuesChange: (connectNullValues: ConnectNullValuesOption) => void;
  onDisconnectValuesChange: (disconnectValues: DisconnectValuesOption) => void;
  shouldShowTimeMarker?: boolean;
}

export const LineExclusiveVisOptions = ({
  addTimeMarker,
  lineStyle,
  lineMode,
  lineWidth,
  pointSize,
  showValues = false,
  connectNullValues,
  disconnectValues,
  onAddTimeMarkerChange,
  onLineModeChange,
  onLineWidthChange,
  onLineStyleChange,
  onPointSizeChange,
  onShowValuesChange,
  onConnectNullValuesChange,
  onDisconnectValuesChange,
  shouldShowTimeMarker = true,
}: BasicVisOptionsProps) => {
  const connectMode = connectNullValues?.connectMode ?? DisableMode.Always;
  const disconnectMode = disconnectValues?.disableMode ?? DisableMode.Never;

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
              'data-test-subj': 'lineStyle-both',
            },
            {
              id: 'line',
              label: i18n.translate('explore.stylePanel.basic.lineOnly', {
                defaultMessage: 'Line only',
              }),
              'data-test-subj': 'lineStyle-line',
            },
            {
              id: 'dots',
              label: i18n.translate('explore.stylePanel.basic.dotsOnly', {
                defaultMessage: 'Dots only',
              }),
              'data-test-subj': 'lineStyle-dots',
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
          data-test-subj="lineStyleButtonGroup"
        />
      </EuiFormRow>

      <EuiSpacer size="s" />

      {lineStyle === 'dots' && (
        <>
          <PointSizeOption
            pointSize={pointSize}
            onPointSizeChange={onPointSizeChange}
            defaultValue={defaultLineChartStyles.pointSize}
            testsubj="linePointSize"
          />

          <ShowValuesSwitch
            showValues={showValues}
            onShowValuesChange={onShowValuesChange}
            testsubj="lineShowValues"
          />

          <EuiSpacer size="s" />
        </>
      )}

      <InterpolationOption lineMode={lineMode} onLineModeChange={onLineModeChange} />

      <LineWidthOption
        lineWidth={lineWidth}
        onLineWidthChange={onLineWidthChange}
        defaultValue={defaultLineChartStyles.lineWidth}
      />

      {shouldShowTimeMarker && (
        <>
          <ConnectionGroup
            connectMode={connectMode}
            disconnectMode={disconnectMode}
            connectNullValues={connectNullValues}
            disconnectValues={disconnectValues}
            onConnectNullValuesChange={onConnectNullValuesChange}
            onDisconnectValuesChange={onDisconnectValuesChange}
            testsubj="line"
          />

          <EuiSpacer size="s" />

          <EuiSwitch
            compressed
            label={i18n.translate('explore.stylePanel.basic.showTimeMarker', {
              defaultMessage: 'Show current time marker',
            })}
            checked={addTimeMarker}
            onChange={(e) => onAddTimeMarkerChange(e.target.checked)}
          />
        </>
      )}
      <EuiSpacer size="s" />
    </StyleAccordion>
  );
};
