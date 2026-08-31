/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { EuiButtonGroup, EuiFormRow, EuiSwitch, EuiSpacer } from '@elastic/eui';
import { StyleAccordion } from '../style_panel/style_accordion';
import { GradientMode, DEFAULT_FILL_OPACITY } from './area_vis_config';
import {
  StackMode,
  LineDashStyle,
  LineMode,
  LineStyle,
  ConnectNullValuesOption,
  DisconnectValuesOption,
  DisableMode,
} from '../types';
import {
  LineSharePanel,
  StackModeButtonGroup,
  OpacityRange,
  ConnectionGroup,
} from '../style_panel/share/index';

interface AreaExclusiveVisOptionsProps {
  addTimeMarker: boolean;
  areaOpacity: number | undefined;
  gradientMode: GradientMode;
  stackMode?: StackMode;
  lineDashStyle?: LineDashStyle;
  lineMode?: LineMode;
  lineWidth?: number;
  pointSize?: number;
  showValues?: boolean;
  lineStyle?: LineStyle;
  connectNullValues?: ConnectNullValuesOption;
  disconnectValues?: DisconnectValuesOption;
  onAddTimeMarkerChange: (addTimeMarker: boolean) => void;
  onFillOpacityChange: (areaOpacity: number) => void;
  onGradientModeChange: (gradientMode: GradientMode) => void;
  onStackModeChange: (stackMode: StackMode) => void;
  onLineDashStyleChange: (lineDashStyle: LineDashStyle) => void;
  onLineModeChange: (lineMode: LineMode) => void;
  onLineWidthChange: (lineWidth: number) => void;
  onPointSizeChange: (pointSize: number) => void;
  onShowValuesChange: (showValues: boolean) => void;
  onLineStyleChange: (style: LineStyle) => void;
  onConnectNullValuesChange: (connectNullValues: ConnectNullValuesOption) => void;
  onDisconnectValuesChange: (disconnectValues: DisconnectValuesOption) => void;
  isTimeBased?: boolean;
}

export const AreaExclusiveVisOptions = ({
  addTimeMarker,
  areaOpacity = DEFAULT_FILL_OPACITY,
  gradientMode,
  stackMode = 'none',
  lineDashStyle = 'solid',
  lineMode = 'smooth',
  lineWidth,
  pointSize,
  lineStyle,
  showValues = false,
  connectNullValues,
  disconnectValues,
  onAddTimeMarkerChange,
  onFillOpacityChange,
  onGradientModeChange,
  onStackModeChange,
  onLineDashStyleChange,
  onLineModeChange,
  onLineWidthChange,
  onPointSizeChange,
  onShowValuesChange,
  onLineStyleChange,
  onConnectNullValuesChange,
  onDisconnectValuesChange,
  isTimeBased = true,
}: AreaExclusiveVisOptionsProps) => {
  const connectMode = connectNullValues?.connectMode ?? DisableMode.Always;
  const disconnectMode = disconnectValues?.disableMode ?? DisableMode.Never;

  const gradientModeOptions: Array<{ id: GradientMode; label: string }> = [
    {
      id: 'none',
      label: i18n.translate('explore.stylePanel.area.gradientMode.none', {
        defaultMessage: 'None',
      }),
    },
    {
      id: 'opacity',
      label: i18n.translate('explore.stylePanel.area.gradientMode.opacity', {
        defaultMessage: 'Opacity',
      }),
    },
    {
      id: 'hue',
      label: i18n.translate('explore.stylePanel.area.gradientMode.hue', {
        defaultMessage: 'Hue',
      }),
    },
  ];

  return (
    <StyleAccordion
      id="areaSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.area', {
        defaultMessage: 'Area',
      })}
      initialIsOpen={true}
    >
      <StackModeButtonGroup
        stackMode={stackMode}
        onStackModeChange={onStackModeChange}
        testsubj="areaStackMode"
      />
      <OpacityRange
        defaultOpacity={DEFAULT_FILL_OPACITY}
        fillOpacity={areaOpacity}
        onOpacityChange={onFillOpacityChange}
        testsubj="areaFillOpacityRange"
      />
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.area.gradientMode', {
          defaultMessage: 'Gradient mode',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.area.gradientMode', {
            defaultMessage: 'Gradient mode',
          })}
          options={gradientModeOptions.map((option) => ({
            id: option.id,
            label: option.label,
            'data-test-subj': `areaGradientMode-${option.id}`,
          }))}
          idSelected={gradientMode}
          onChange={(id) => onGradientModeChange(id as GradientMode)}
          buttonSize="compressed"
          isFullWidth
        />
      </EuiFormRow>
      <LineSharePanel
        lineStyle={lineStyle}
        lineDashStyle={lineDashStyle}
        lineMode={lineMode}
        lineWidth={lineWidth}
        pointSize={pointSize}
        showValues={showValues}
        onLineDashStyleChange={onLineDashStyleChange}
        onLineModeChange={onLineModeChange}
        onLineWidthChange={onLineWidthChange}
        onPointSizeChange={onPointSizeChange}
        onShowValuesChange={onShowValuesChange}
        onLineStyleChange={onLineStyleChange}
        isFullWidth
        testSubj="area"
      />

      {isTimeBased && (
        <>
          <EuiSpacer size="s" />
          <EuiSwitch
            compressed
            label={i18n.translate('explore.stylePanel.area.showTimeMarker', {
              defaultMessage: 'Show current time marker',
            })}
            checked={addTimeMarker}
            onChange={(e) => onAddTimeMarkerChange(e.target.checked)}
            data-test-subj="areaAddTimeMarkerSwitch"
          />
          <EuiSpacer size="s" />
          <ConnectionGroup
            connectMode={connectMode}
            disconnectMode={disconnectMode}
            connectNullValues={connectNullValues}
            disconnectValues={disconnectValues}
            onConnectNullValuesChange={onConnectNullValuesChange}
            onDisconnectValuesChange={onDisconnectValuesChange}
            testsubj="area"
          />
        </>
      )}
    </StyleAccordion>
  );
};
