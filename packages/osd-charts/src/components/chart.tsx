import classNames from 'classnames';
import { Provider } from 'mobx-react';
import React, { CSSProperties, Fragment } from 'react';
import { SpecsParser } from '../specs/specs_parser';
import { ChartStore } from '../chart_types/xy_chart/store/chart_state';
import { htmlIdGenerator } from '../utils/commons';
import { AnnotationTooltip } from './annotation_tooltips';
import { ChartResizer } from './chart_resizer';
import { Crosshair } from './crosshair';
import { Highlighter } from './highlighter';
import { Legend } from './legend/legend';
import { LegendButton } from './legend/legend_button';
import { ReactiveChart as ReactChart } from './react_canvas/reactive_chart';
import { Tooltips } from './tooltips';
import { CursorEvent } from '../specs/settings';
import { ChartSize, getChartSize } from '../utils/chart_size';

interface ChartProps {
  /** The type of rendered
   * @default 'canvas'
   */
  renderer: 'svg' | 'canvas';
  size?: ChartSize;
  className?: string;
}

export class Chart extends React.Component<ChartProps> {
  static defaultProps: ChartProps = {
    renderer: 'canvas',
  };
  private chartSpecStore: ChartStore;
  private legendId: string;
  constructor(props: any) {
    super(props);
    this.chartSpecStore = new ChartStore();
    this.legendId = htmlIdGenerator()('legend');
  }

  dispatchExternalCursorEvent(event?: CursorEvent) {
    this.chartSpecStore.setActiveChartId(event && event.chartId);
    const isActiveChart = this.chartSpecStore.isActiveChart.get();

    if (!event) {
      if (!isActiveChart) {
        this.chartSpecStore.setCursorPosition(-1, -1);
      }
    } else {
      if (
        !isActiveChart &&
        this.chartSpecStore.xScale!.type === event.scale &&
        (event.unit === undefined || event.unit === this.chartSpecStore.xScale!.unit)
      ) {
        this.chartSpecStore.setCursorValue(event.value);
      }
    }
  }

  render() {
    const { renderer, size, className } = this.props;
    let containerStyle: CSSProperties;
    if (size) {
      containerStyle = {
        position: 'relative',
        ...getChartSize(size),
      };
    } else {
      containerStyle = {};
    }
    const chartClass = classNames('echContainer', className);
    return (
      <Provider chartStore={this.chartSpecStore}>
        <Fragment>
          <SpecsParser>{this.props.children}</SpecsParser>
          <div style={containerStyle} className={chartClass}>
            <ChartResizer />
            <Crosshair />
            {// TODO reenable when SVG rendered is aligned with canvas one
            renderer === 'svg' && <ReactChart />}
            {renderer === 'canvas' && <ReactChart />}
            <Tooltips />
            <AnnotationTooltip />
            <Legend legendId={this.legendId} />
            <LegendButton legendId={this.legendId} />
            <Highlighter />
          </div>
        </Fragment>
      </Provider>
    );
  }
}
