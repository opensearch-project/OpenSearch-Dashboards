import { inject } from 'mobx-react';
import React from 'react';
import { Position, Rendering, Rotation } from '../lib/series/specs';
import { BrushEndListener, ChartStore, ElementClickListener, ElementOverListener } from '../state/chart_state';

interface SettingSpecProps {
  chartStore?: ChartStore;
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

type DefaultProps = 'rendering' | 'rotation' | 'animateData' | 'showLegend' | 'debug';

export class SettingsComponent extends React.PureComponent<SettingSpecProps> {
  static defaultProps: Pick<SettingSpecProps, DefaultProps> = {
    rendering: 'canvas',
    rotation: 0,
    animateData: true,
    showLegend: false,
    debug: false,
  };
  componentDidMount() {
    const {
      chartStore,
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
    } = this.props;
    chartStore!.chartRotation = rotation;
    chartStore!.chartRendering = rendering;
    chartStore!.animateData = animateData;
    chartStore!.debug = debug;

    chartStore!.setShowLegend(showLegend);
    chartStore!.legendPosition = legendPosition;

    if (onElementOver) {
      chartStore!.setOnElementOverListener(onElementOver);
    }
    if (onElementClick) {
      chartStore!.setOnElementClickListener(onElementClick);
    }
    if (onElementOut) {
      chartStore!.setOnElementOutListener(onElementOut);
    }
    if (onBrushEnd) {
      chartStore!.setOnBrushEndListener(onBrushEnd);
    }
  }
  componentDidUpdate() {
    const {
      chartStore,
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
    } = this.props;
    chartStore!.chartRotation = rotation;
    chartStore!.chartRendering = rendering;
    chartStore!.animateData = animateData;
    chartStore!.debug = debug;
    chartStore!.setShowLegend(showLegend);
    chartStore!.legendPosition = legendPosition;
    if (onElementOver) {
      chartStore!.setOnElementOverListener(onElementOver);
    }
    if (onElementClick) {
      chartStore!.setOnElementClickListener(onElementClick);
    }
    if (onElementOut) {
      chartStore!.setOnElementOutListener(onElementOut);
    }
    if (onBrushEnd) {
      chartStore!.setOnBrushEndListener(onBrushEnd);
    }
  }
  render() {
    return null;
  }
}

export const Settings = inject('chartStore')(SettingsComponent);
