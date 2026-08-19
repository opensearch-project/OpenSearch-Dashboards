/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { EuiButtonGroup, EuiFormRow, EuiSpacer, EuiSwitch } from '@elastic/eui';
import { StyleAccordion } from '../style_panel/style_accordion';
import { defaultAreaChartStyles, GradientMode } from './area_vis_config';
import {
  ConnectNullValuesOption,
  DisconnectValuesOption,
  DisableMode,
  StackMode,
  LineDashStyle,
  LineMode,
} from '../types';
import {
  DEFAULT_LINE_WIDTH,
  InterpolationOption,
  LineDashStyleOption,
  LineWidthOption,
  ConnectionGroup,
  PointSizeOption,
  ShowValuesSwitch,
} from '../style_panel/share/index';
import { GradientRange } from '../style_panel/share/gradient_range';

import { StackModeButtonGroup } from '../style_panel/stack_mode/stack_mode_button_group';

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
  onConnectNullValuesChange: (connectNullValues: ConnectNullValuesOption) => void;
  onDisconnectValuesChange: (disconnectValues: DisconnectValuesOption) => void;
  isTimeBased?: boolean;
}

export const AreaExclusiveVisOptions = ({
  addTimeMarker,
  areaOpacity,
  gradientMode,
  stackMode = 'none',
  lineDashStyle = 'solid',
  lineMode = 'smooth',
  lineWidth,
  pointSize,
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
      <GradientRange fillOpacity={areaOpacity} onOpacityChange={onFillOpacityChange} />
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
      <LineDashStyleOption
        lineDashStyle={lineDashStyle}
        onLineDashStyleChange={onLineDashStyleChange}
        isFullWidth
      />
      <InterpolationOption lineMode={lineMode} onLineModeChange={onLineModeChange} isFullWidth />
      <LineWidthOption
        lineWidth={lineWidth}
        onLineWidthChange={onLineWidthChange}
        defaultValue={defaultAreaChartStyles.lineWidth ?? DEFAULT_LINE_WIDTH}
      />
      <PointSizeOption
        pointSize={pointSize}
        onPointSizeChange={onPointSizeChange}
        defaultValue={defaultAreaChartStyles.pointSize}
        testsubj="areaPointSize"
      />
      <ShowValuesSwitch
        showValues={showValues}
        onShowValuesChange={onShowValuesChange}
        testsubj="areaShowValues"
      />
      <EuiSpacer size="s" />
      {isTimeBased && (
        <>
          <ConnectionGroup
            disconnectMode={disconnectMode}
            connectMode={connectMode}
            disconnectValues={disconnectValues}
            connectNullValues={connectNullValues}
            onConnectNullValuesChange={onConnectNullValuesChange}
            onDisconnectValuesChange={onDisconnectValuesChange}
          />
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
        </>
      )}
      <EuiSpacer size="s" />
    </StyleAccordion>
  );
};
