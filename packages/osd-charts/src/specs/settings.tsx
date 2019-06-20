import { inject } from 'mobx-react';
import { PureComponent } from 'react';

import { DomainRange, Position, Rendering, Rotation } from '../lib/series/specs';
import { DARK_THEME } from '../lib/themes/dark_theme';
import { LIGHT_THEME } from '../lib/themes/light_theme';
import { BaseThemeType, mergeWithDefaultTheme, PartialTheme, Theme, BaseThemeTypes } from '../lib/themes/theme';
import { Domain } from '../lib/utils/domain';
import { TooltipType, TooltipValueFormatter } from '../lib/utils/interactions';
import {
  BrushEndListener,
  ChartStore,
  ElementClickListener,
  ElementOverListener,
  LegendItemListener,
} from '../state/chart_state';

export const DEFAULT_TOOLTIP_TYPE = TooltipType.VerticalCursor;
export const DEFAULT_TOOLTIP_SNAP = true;

interface TooltipProps {
  type?: TooltipType;
  snap?: boolean;
  headerFormatter?: TooltipValueFormatter;
}

function isTooltipProps(config: TooltipType | TooltipProps): config is TooltipProps {
  return typeof config === 'object';
}

function isTooltipType(config: TooltipType | TooltipProps): config is TooltipType {
  return typeof config === 'string';
}

export interface SettingSpecProps {
  chartStore?: ChartStore;
  theme?: Theme | PartialTheme;
  baseThemeType?: BaseThemeType;
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
  onElementOut?: () => undefined;
  onBrushEnd?: BrushEndListener;
  onLegendItemOver?: LegendItemListener;
  onLegendItemOut?: () => undefined;
  onLegendItemClick?: LegendItemListener;
  onLegendItemPlusClick?: LegendItemListener;
  onLegendItemMinusClick?: LegendItemListener;
  xDomain?: Domain | DomainRange;
}

function getTheme(theme?: Theme | PartialTheme, baseThemeType: BaseThemeType = BaseThemeTypes.Light): Theme {
  if (theme) {
    const baseTheme = baseThemeType === BaseThemeTypes.Light ? LIGHT_THEME : DARK_THEME;
    return mergeWithDefaultTheme(theme, baseTheme);
  }

  return LIGHT_THEME;
}

function updateChartStore(props: SettingSpecProps) {
  const {
    chartStore,
    theme,
    baseThemeType,
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
    debug,
    xDomain,
  } = props;
  if (!chartStore) {
    return;
  }

  chartStore.chartTheme = getTheme(theme, baseThemeType);
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
  chartStore.legendPosition = legendPosition;
  chartStore.showLegendDisplayValue.set(showLegendDisplayValue);
  chartStore.xDomain = xDomain;

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
}

export class SettingsComponent extends PureComponent<SettingSpecProps> {
  static defaultProps: Partial<SettingSpecProps> = {
    rendering: 'canvas',
    rotation: 0,
    animateData: true,
    showLegend: false,
    debug: false,
    baseThemeType: BaseThemeTypes.Light,
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
