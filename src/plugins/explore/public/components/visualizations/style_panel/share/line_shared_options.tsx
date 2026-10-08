/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiButtonGroup, EuiFormRow, EuiRange } from '@elastic/eui';
import { useDebouncedNumber } from '../../utils/use_debounced_value';
import { LineMode, LineDashStyle, LineStyle } from '../../types';
import { PointSizeOption } from './point_size_options';
import { ShowValuesSwitch } from './value_label_options';

export const DEFAULT_LINE_WIDTH = 2;
export const MIN_LINE_WIDTH = 1;
export const MAX_LINE_WIDTH = 10;

const lineModeOptions: Array<{ value: LineMode; text: string }> = [
  {
    value: 'straight',
    text: i18n.translate('explore.stylePanel.lineMode.straight', { defaultMessage: 'Straight' }),
  },
  {
    value: 'smooth',
    text: i18n.translate('explore.stylePanel.lineMode.smooth', { defaultMessage: 'Smooth' }),
  },
  {
    value: 'stepped',
    text: i18n.translate('explore.stylePanel.lineMode.stepped', { defaultMessage: 'Stepped' }),
  },
];

const lineDashStyleOptions: Array<{ value: LineDashStyle; text: string }> = [
  {
    value: 'solid',
    text: i18n.translate('explore.stylePanel.lineDashStyle.solid', { defaultMessage: 'Solid' }),
  },
  {
    value: 'dashed',
    text: i18n.translate('explore.stylePanel.lineDashStyle.dashed', { defaultMessage: 'Dashed' }),
  },
  {
    value: 'dotted',
    text: i18n.translate('explore.stylePanel.lineDashStyle.dotted', { defaultMessage: 'Dotted' }),
  },
];

const lineStyleOptions: Array<{ id: LineStyle; label: string; ['data-test-subj']: string }> = [
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
];

interface LineStyleOptionProps {
  lineStyle?: LineStyle;
  onLineStyleChange: (lineStyle: LineStyle) => void;
}

export const LineStyleOption = ({ lineStyle, onLineStyleChange }: LineStyleOptionProps) => {
  const label = i18n.translate('explore.stylePanel.basic.linestyle', {
    defaultMessage: 'Line Style',
  });

  return (
    <EuiFormRow label={label}>
      <EuiButtonGroup
        isFullWidth={true}
        legend={i18n.translate('explore.stylePanel.basic.linestyleLegend', {
          defaultMessage: 'Line Style',
        })}
        options={lineStyleOptions}
        onChange={(optionId) => {
          if (optionId === 'both' || optionId === 'line' || optionId === 'dots') {
            onLineStyleChange(optionId as LineStyle);
          }
        }}
        type="single"
        idSelected={lineStyle ?? ''}
        buttonSize="compressed"
        data-test-subj="lineStyleButtonGroup"
      />
    </EuiFormRow>
  );
};

interface InterpolationOptionProps {
  lineMode: LineMode;
  onLineModeChange: (lineMode: LineMode) => void;
}

export const InterpolationOption = ({ lineMode, onLineModeChange }: InterpolationOptionProps) => {
  const label = i18n.translate('explore.stylePanel.basic.lineMode', {
    defaultMessage: 'Interpolation',
  });

  return (
    <EuiFormRow label={label}>
      <EuiButtonGroup
        legend={label}
        options={lineModeOptions.map((option) => ({
          id: option.value,
          label: option.text,
          'data-test-subj': `lineMode-${option.value}`,
        }))}
        idSelected={lineMode}
        onChange={(id) => onLineModeChange(id as LineMode)}
        buttonSize="compressed"
        isFullWidth={true}
        data-test-subj="lineModeButtonGroup"
      />
    </EuiFormRow>
  );
};

interface LineDashStyleOptionProps {
  lineDashStyle: LineDashStyle;
  onLineDashStyleChange: (lineDashStyle: LineDashStyle) => void;
  isFullWidth?: boolean;
}

export const LineDashStyleOption = ({
  lineDashStyle,
  onLineDashStyleChange,
}: LineDashStyleOptionProps) => {
  const label = i18n.translate('explore.stylePanel.basic.lineDashStyle', {
    defaultMessage: 'Line Dash style',
  });

  return (
    <EuiFormRow label={label}>
      <EuiButtonGroup
        legend={label}
        options={lineDashStyleOptions.map((option) => ({
          id: option.value,
          label: option.text,
          'data-test-subj': `lineDashStyle-${option.value}`,
        }))}
        idSelected={lineDashStyle}
        onChange={(id) => onLineDashStyleChange(id as LineDashStyle)}
        buttonSize="compressed"
        isFullWidth={true}
        data-test-subj="lineDashStyleButtonGroup"
      />
    </EuiFormRow>
  );
};

interface LineWidthOptionProps {
  lineWidth: number | undefined;
  onLineWidthChange: (lineWidth: number) => void;
  defaultValue?: number;
}

export const LineWidthOption = ({
  lineWidth,
  onLineWidthChange,
  defaultValue = DEFAULT_LINE_WIDTH,
}: LineWidthOptionProps) => {
  const [localLineWidth, handleLineWidthChange] = useDebouncedNumber(
    lineWidth,
    (value) => onLineWidthChange(value ?? defaultValue),
    { min: MIN_LINE_WIDTH, max: MAX_LINE_WIDTH }
  );

  const label = i18n.translate('explore.stylePanel.basic.linewidth', {
    defaultMessage: 'Line width',
  });

  return (
    <EuiFormRow label={label}>
      <EuiRange
        compressed
        value={localLineWidth ?? defaultValue}
        onChange={(e) =>
          handleLineWidthChange(e.currentTarget.value ? Number(e.currentTarget.value) : undefined)
        }
        min={MIN_LINE_WIDTH}
        max={MAX_LINE_WIDTH}
        step={1}
        aria-label={label}
        showLabels
        showValue
        data-test-subj="lineWidthRange"
      />
    </EuiFormRow>
  );
};

/**
 * Maps a LineMode onto the ECharts series flags that produce it.
 */
export const getLineInterpolation = (lineMode?: LineMode) => {
  switch (lineMode) {
    case 'smooth':
      return { smooth: true };
    case 'stepped':
      return { step: true };
    case 'straight':
    default:
      return {};
  }
};

/**
 * Maps a LineDashStyle onto an ECharts `lineStyle.type`. Explicit dash arrays are
 * used rather than the 'dashed'/'dotted' keywords so the pattern stays the same
 * regardless of the stroke width, which ECharts otherwise scales it by.
 */
export const getLineDashType = (lineDashStyle?: LineDashStyle): 'solid' | number[] => {
  switch (lineDashStyle) {
    case 'dashed':
      return [5, 3];
    case 'dotted':
      return [2, 3];
    case 'solid':
    default:
      return 'solid';
  }
};

interface LineSharePanelProps {
  lineStyle?: LineStyle;
  lineDashStyle?: LineDashStyle;
  lineMode?: LineMode;
  lineWidth?: number;

  pointSize?: number;
  showValues?: boolean;

  onLineStyleChange?: (style: LineStyle) => void;
  onLineDashStyleChange?: (lineDashStyle: LineDashStyle) => void;
  onLineModeChange?: (lineMode: LineMode) => void;
  onLineWidthChange?: (lineWidth: number) => void;
  onPointSizeChange?: (pointSize: number) => void;
  onShowValuesChange?: (showValues: boolean) => void;

  isFullWidth?: boolean;
  testSubj?: string;
}

/**
 * Shared line configuration panel
 * includes:
 * 1. lineDashStyle
 * 2. lineWidth
 * 3. lineMode
 * 4. pointSize
 * 5. showValues
 * 6. lineStyle
 *
 */
export const LineSharePanel = ({
  lineStyle,
  lineDashStyle = 'solid',
  lineMode = 'smooth',
  lineWidth,
  pointSize,
  showValues,
  onLineStyleChange,
  onLineDashStyleChange,
  onLineModeChange,
  onLineWidthChange,
  onPointSizeChange,
  onShowValuesChange,
  testSubj = 'lineSharePanel',
}: LineSharePanelProps) => (
  <>
    {onLineStyleChange && (
      <LineStyleOption lineStyle={lineStyle} onLineStyleChange={onLineStyleChange} />
    )}
    {lineStyle !== 'dots' && (
      <>
        {onLineDashStyleChange && (
          <LineDashStyleOption
            lineDashStyle={lineDashStyle}
            onLineDashStyleChange={onLineDashStyleChange}
          />
        )}
        {onLineModeChange && (
          <InterpolationOption lineMode={lineMode} onLineModeChange={onLineModeChange} />
        )}
        {onLineWidthChange && (
          <LineWidthOption lineWidth={lineWidth} onLineWidthChange={onLineWidthChange} />
        )}
      </>
    )}
    {onPointSizeChange && lineStyle !== 'line' && (
      <PointSizeOption
        pointSize={pointSize}
        onPointSizeChange={onPointSizeChange}
        testsubj={`${testSubj}PointSize`}
      />
    )}
    {onShowValuesChange && (
      <ShowValuesSwitch
        showValues={showValues}
        onShowValuesChange={onShowValuesChange}
        testsubj={`${testSubj}ShowValues`}
      />
    )}
  </>
);
