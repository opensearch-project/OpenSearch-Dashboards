import { inject } from 'mobx-react';
import React from 'react';
import { Position, Rendering, Rotation } from '../lib/series/specs';
import { SpecId } from '../lib/utils/ids';
import { ChartStore, ValueClickListener } from '../state/chart_state';

interface SettingSpecProps {
  chartStore?: ChartStore;
  rendering: Rendering;
  rotation: Rotation;
  animateData: boolean;
  showLegend: boolean;
  debug: boolean;
  legendPosition?: Position;
  onValueClick?: ValueClickListener;
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
      onValueClick,
      debug,
    } = this.props;
    chartStore!.chartRotation = rotation;
    chartStore!.chartRendering = rendering;
    chartStore!.animateData = animateData;
    chartStore!.debug = debug;

    chartStore!.setShowLegend(showLegend);
    chartStore!.legendPosition = legendPosition;

    if (onValueClick) {
      chartStore!.setOnValueClickListener(onValueClick);
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
      onValueClick,
      debug,
    } = this.props;
    chartStore!.chartRotation = rotation;
    chartStore!.chartRendering = rendering;
    chartStore!.animateData = animateData;
    chartStore!.debug = debug;
    chartStore!.setShowLegend(showLegend);
    chartStore!.legendPosition = legendPosition;
    if (onValueClick) {
      chartStore!.setOnValueClickListener(onValueClick);
    } else {
      chartStore!.removeValueClickListener();
    }
  }
  render() {
    return null;
  }
}

export const Settings = inject('chartStore')(SettingsComponent);
