/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { EuiSpacer, EuiSwitch } from '@elastic/eui';
import { StyleAccordion } from '../style_panel/style_accordion';

import { LineSharePanel, ConnectionGroup } from '../style_panel/share';
import {
  LineMode,
  LineDashStyle,
  LineStyle,
  ConnectNullValuesOption,
  DisconnectValuesOption,
  DisableMode,
} from '../types';

interface BasicVisOptionsProps {
  addTimeMarker: boolean;
  lineStyle: LineStyle;
  lineDashStyle?: LineDashStyle;
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
  onLineDashStyleChange: (lineDashStyle: LineDashStyle) => void;
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
  lineDashStyle,
  showValues = false,
  connectNullValues,
  disconnectValues,
  onAddTimeMarkerChange,
  onLineModeChange,
  onLineWidthChange,
  onLineStyleChange,
  onPointSizeChange,
  onLineDashStyleChange,
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
      <LineSharePanel
        lineStyle={lineStyle}
        lineDashStyle={lineDashStyle}
        lineMode={lineMode}
        lineWidth={lineWidth}
        pointSize={pointSize}
        showValues={showValues}
        onLineStyleChange={onLineStyleChange}
        onLineDashStyleChange={onLineDashStyleChange}
        onLineModeChange={onLineModeChange}
        onLineWidthChange={onLineWidthChange}
        // Point size and show values only apply when dots are drawn.
        onPointSizeChange={onPointSizeChange}
        onShowValuesChange={onShowValuesChange}
        testSubj="lineChartSharePanel"
      />
      {shouldShowTimeMarker && (
        <>
          <EuiSpacer size="s" />
          <EuiSwitch
            compressed
            label={i18n.translate('explore.stylePanel.basic.showTimeMarker', {
              defaultMessage: 'Show current time marker',
            })}
            checked={addTimeMarker}
            onChange={(e) => onAddTimeMarkerChange(e.target.checked)}
          />
          <EuiSpacer size="s" />
          <ConnectionGroup
            connectMode={connectMode}
            disconnectMode={disconnectMode}
            connectNullValues={connectNullValues}
            disconnectValues={disconnectValues}
            onConnectNullValuesChange={onConnectNullValuesChange}
            onDisconnectValuesChange={onDisconnectValuesChange}
            testsubj="line"
          />
        </>
      )}
      <EuiSpacer size="s" />
    </StyleAccordion>
  );
};
