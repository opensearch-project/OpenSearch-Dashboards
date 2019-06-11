import { inject } from 'mobx-react';
import { PureComponent } from 'react';
import { DomainRange, Position, Rendering, Rotation } from '../lib/series/specs';
import { LIGHT_THEME } from '../lib/themes/light_theme';
import { Theme } from '../lib/themes/theme';
import { Domain } from '../lib/utils/domain';
import { TooltipType } from '../lib/utils/interactions';
import {
  BrushEndListener,
  ChartStore,
  ElementClickListener,
  ElementOverListener,
  LegendItemListener,
} from '../state/chart_state';

export const DEFAULT_TOOLTIP_TYPE = TooltipType.VerticalCursor;
export const DEFAULT_TOOLTIP_SNAP = true;

interface SettingSpecProps {
  chartStore?: ChartStore;
  theme?: Theme;
  rendering: Rendering;
  rotation: Rotation;
  animateData: boolean;
  showLegend: boolean;
  /** Specify the tooltip type */
  tooltipType?: TooltipType;
  /** Snap tooltip to grid */
  tooltipSnap?: boolean;
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

function updateChartStore(props: SettingSpecProps) {
  const {
    chartStore,
    theme,
    rotation,
    rendering,
    animateData,
    showLegend,
    tooltipType,
    tooltipSnap,
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
  chartStore.chartTheme = theme || LIGHT_THEME;
  chartStore.chartRotation = rotation;
  chartStore.chartRendering = rendering;
  chartStore.animateData = animateData;
  chartStore.debug = debug;

  chartStore.tooltipType.set(tooltipType!);
  chartStore.tooltipSnap.set(tooltipSnap!);

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
    tooltipType: DEFAULT_TOOLTIP_TYPE,
    tooltipSnap: DEFAULT_TOOLTIP_SNAP,
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
