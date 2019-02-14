import { inject } from 'mobx-react';
import { PureComponent } from 'react';
import { Position, Rendering, Rotation } from '../lib/series/specs';
import { DEFAULT_THEME, mergeWithDefaultTheme, PartialTheme } from '../lib/themes/theme';
import {
  BrushEndListener,
  ChartStore,
  ElementClickListener,
  ElementOverListener,
  LegendItemListener,
} from '../state/chart_state';

interface SettingSpecProps {
  chartStore?: ChartStore;
  theme?: PartialTheme;
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
  onLegendItemOver?: LegendItemListener;
  onLegendItemOut?: () => undefined;
}

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
    onLegendItemOver,
    onLegendItemOut,
    debug,
  } = props;
  if (!chartStore) {
    return;
  }
  chartStore.chartTheme = theme ? mergeWithDefaultTheme(theme) : DEFAULT_THEME;
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
  if (onLegendItemOver) {
    chartStore.setOnLegendItemOverListener(onLegendItemOver);
  }
  if (onLegendItemOut) {
    chartStore.setOnLegendItemOutListener(onLegendItemOut);
  }
}

export class SettingsComponent extends PureComponent<SettingSpecProps> {
  static defaultProps: Partial<SettingSpecProps> = {
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
