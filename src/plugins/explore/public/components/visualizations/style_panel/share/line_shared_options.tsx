/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiButtonGroup, EuiFormRow, EuiRange } from '@elastic/eui';
import { useDebouncedNumber } from '../../utils/use_debounced_value';
import { LineMode, LineDashStyle } from '../../types';

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

interface InterpolationOptionProps {
  lineMode: LineMode;
  onLineModeChange: (lineMode: LineMode) => void;
  isFullWidth?: boolean;
}

export const InterpolationOption = ({
  lineMode,
  onLineModeChange,
  isFullWidth,
}: InterpolationOptionProps) => {
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
        isFullWidth={isFullWidth}
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
  isFullWidth,
}: LineDashStyleOptionProps) => {
  const label = i18n.translate('explore.stylePanel.basic.lineDashStyle', {
    defaultMessage: 'Line style',
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
        isFullWidth={isFullWidth}
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
