import { PureComponent } from 'react';
import { inject } from 'mobx-react';

import { DomainRange, Position, Rendering, Rotation } from '../chart_types/xy_chart/utils/specs';
import { mergeWithDefaultTheme, PartialTheme, Theme } from '../utils/themes/theme';
import { Domain } from '../utils/domain';
import { TooltipType, TooltipValueFormatter } from '../chart_types/xy_chart/utils/interactions';
import {
  BrushEndListener,
  ChartStore,
  ElementClickListener,
  ElementOverListener,
  LegendItemListener,
  CursorUpdateListener,
} from '../chart_types/xy_chart/store/chart_state';
import { ScaleTypes } from '../utils/scales/scales';
import { LIGHT_THEME } from '../utils/themes/light_theme';

export const DEFAULT_TOOLTIP_TYPE = TooltipType.VerticalCursor;
export const DEFAULT_TOOLTIP_SNAP = true;

interface TooltipProps {
  type?: TooltipType;
  snap?: boolean;
  headerFormatter?: TooltipValueFormatter;
}

/**
 * Event used to syncronize cursors between Charts.
 *
 * fired as callback argument for `CursorUpdateListener`
 */
export interface CursorEvent {
  chartId: string;
  scale: ScaleTypes;
  /**
   * @todo
   * unit for event (i.e. `time`, `feet`, `count`, etc.)
   */
  unit?: string;
  value: number | string;
}

function isTooltipProps(config: TooltipType | TooltipProps): config is TooltipProps {
  return typeof config === 'object';
}

function isTooltipType(config: TooltipType | TooltipProps): config is TooltipType {
  return typeof config === 'string';
}

export interface SettingSpecProps {
  chartStore?: ChartStore;
  /**
   * Partial theme to be merged with base
   *
   * or
   *
   * Array of partial themes to be merged with base
   * index `0` being the hightest priority
   *
   * i.e. `[primary, secondary, tertiary]`
   */
  theme?: PartialTheme | PartialTheme[];
  /**
   * Full default theme to use as base
   *
   * @default `LIGHT_THEME`
   */
  baseTheme?: Theme;
  rendering: Rendering;
  rotation: Rotation;
  animateData: boolean;
  showLegend: boolean;
  /** Either a TooltipType or an object with configuration of type, snap, and/or headerFormatter */
  tooltip?: TooltipType | TooltipProps;
  debug: boolean;
  legendPosition?: Position;
  showLegendDisplayValue: boolean;
  onElementClick?: ElementClickListener;
  onElementOver?: ElementOverListener;
  onElementOut?: () => undefined | void;
  onBrushEnd?: BrushEndListener;
  onLegendItemOver?: LegendItemListener;
  onLegendItemOut?: () => undefined | void;
  onLegendItemClick?: LegendItemListener;
  onLegendItemPlusClick?: LegendItemListener;
  onLegendItemMinusClick?: LegendItemListener;
  onCursorUpdate?: CursorUpdateListener;
  xDomain?: Domain | DomainRange;
}

function getTheme(baseTheme?: Theme, theme?: PartialTheme | PartialTheme[]): Theme {
  const base = baseTheme ? baseTheme : LIGHT_THEME;

  if (Array.isArray(theme)) {
    const [firstTheme, ...axillaryThemes] = theme;
    return mergeWithDefaultTheme(firstTheme, base, axillaryThemes);
  }

  return theme ? mergeWithDefaultTheme(theme, base) : base;
}

function updateChartStore(props: SettingSpecProps) {
  const {
    chartStore,
    theme,
    baseTheme,
    rotation,
    rendering,
    animateData,
    showLegend,
    tooltip,
    legendPosition,
    showLegendDisplayValue,
    onElementClick,
    onElementOver,
    onElementOut,
    onBrushEnd,
    onLegendItemOver,
    onLegendItemOut,
    onLegendItemClick,
    onLegendItemMinusClick,
    onLegendItemPlusClick,
    onCursorUpdate,
    debug,
    xDomain,
  } = props;

  if (!chartStore) {
    return;
  }

  chartStore.chartTheme = getTheme(baseTheme, theme);
  chartStore.chartRotation = rotation;
  chartStore.chartRendering = rendering;
  chartStore.animateData = animateData;
  chartStore.debug = debug;

  if (tooltip && isTooltipProps(tooltip)) {
    const { type, snap, headerFormatter } = tooltip;
    chartStore.tooltipType.set(type!);
    chartStore.tooltipSnap.set(snap!);
    chartStore.tooltipHeaderFormatter = headerFormatter;
  } else if (tooltip && isTooltipType(tooltip)) {
    chartStore.tooltipType.set(tooltip);
  }

  chartStore.setShowLegend(showLegend);

  if (legendPosition) {
    chartStore.legendPosition.set(legendPosition);
  }
  chartStore.showLegendDisplayValue.set(showLegendDisplayValue);
  chartStore.customXDomain = xDomain;

  if (onElementOver) {
    chartStore.setOnElementOverListener(onElementOver);
  }
  if (onElementClick) {
    chartStore.setOnElementClickListener(onElementClick);
  }
  if (onElementOut) {
    chartStore.setOnElementOutListener(onElementOut);
  }
  if (onBrushEnd) {
    chartStore.setOnBrushEndListener(onBrushEnd);
  }
  if (onLegendItemOver) {
    chartStore.setOnLegendItemOverListener(onLegendItemOver);
  }
  if (onLegendItemOut) {
    chartStore.setOnLegendItemOutListener(onLegendItemOut);
  }
  if (onLegendItemClick) {
    chartStore.setOnLegendItemClickListener(onLegendItemClick);
  }
  if (onLegendItemPlusClick) {
    chartStore.setOnLegendItemPlusClickListener(onLegendItemPlusClick);
  }
  if (onLegendItemMinusClick) {
    chartStore.setOnLegendItemMinusClickListener(onLegendItemMinusClick);
  }
  if (onCursorUpdate) {
    chartStore.setOnCursorUpdateListener(onCursorUpdate);
  }
}

export class SettingsComponent extends PureComponent<SettingSpecProps> {
  static defaultProps: Partial<SettingSpecProps> = {
    rendering: 'canvas',
    rotation: 0,
    animateData: true,
    showLegend: false,
    debug: false,
    tooltip: {
      type: DEFAULT_TOOLTIP_TYPE,
      snap: DEFAULT_TOOLTIP_SNAP,
    },
    showLegendDisplayValue: true,
  };

  componentDidMount() {
    updateChartStore(this.props);
  }
  componentDidUpdate() {
    updateChartStore(this.props);
  }
  render() {
    return null;
  }
}

export const Settings = inject('chartStore')(SettingsComponent);
