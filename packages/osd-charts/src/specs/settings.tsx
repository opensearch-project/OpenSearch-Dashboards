import * as deepmerge from 'deepmerge';
import { inject } from 'mobx-react';
import { PureComponent } from 'react';
import { Position, Rendering, Rotation } from '../lib/series/specs';
import {
  AxisConfig,
  ChartConfig,
  ColorConfig,
  DEFAULT_THEME,
  InteractionConfig,
  LegendStyle,
  ScalesConfig,
  Theme,
} from '../lib/themes/theme';
import {
  BrushEndListener,
  ChartStore,
  ElementClickListener,
  ElementOverListener,
} from '../state/chart_state';

interface SettingSpecProps {
  chartStore?: ChartStore;
  theme?: Partial<{
    chart: Partial<ChartConfig>;
    axes: Partial<AxisConfig>;
    scales: Partial<ScalesConfig>;
    colors: Partial<ColorConfig>;
    interactions: Partial<InteractionConfig>;
    legend: Partial<LegendStyle>;
  }>;
  rendering: Rendering;
  rotation: Rotation;
  animateData: boolean;
  showLegend: boolean;
  debug: boolean;
  legendPosition?: Position;
  onElementClick?: ElementClickListener;
  onElementOver?: ElementOverListener;
  onElementOut?: () => undefined;
  onBrushEnd?: BrushEndListener;
}

type DefaultProps =
  | 'rendering'
  | 'rotation'
  | 'animateData'
  | 'showLegend'
  | 'debug';

function updateChartStore(props: SettingSpecProps) {
  const {
    chartStore,
    theme,
    rotation,
    rendering,
    animateData,
    showLegend,
    legendPosition,
    onElementClick,
    onElementOver,
    onElementOut,
    onBrushEnd,
    debug,
  } = props;
  if (!chartStore) {
    return;
  }
  chartStore.chartTheme = theme ? deepmerge.all([DEFAULT_THEME, theme]) as Theme : DEFAULT_THEME;
  chartStore.chartRotation = rotation;
  chartStore.chartRendering = rendering;
  chartStore.animateData = animateData;
  chartStore.debug = debug;

  chartStore.setShowLegend(showLegend);
  chartStore.legendPosition = legendPosition;

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
}

export class SettingsComponent extends PureComponent<SettingSpecProps> {
  static defaultProps: Pick<SettingSpecProps, DefaultProps> = {
    rendering: 'canvas',
    rotation: 0,
    animateData: true,
    showLegend: false,
    debug: false,
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
