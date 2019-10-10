import React, { CSSProperties } from 'react';
import classNames from 'classnames';
import { Provider } from 'mobx-react';

import { SpecsParser } from '../specs/specs_parser';
import { ChartStore } from '../chart_types/xy_chart/store/chart_state';
import { AnnotationTooltip } from './annotation_tooltips';
import { ChartResizer } from './chart_resizer';
import { Crosshair } from './crosshair';
import { Highlighter } from './highlighter';
import { Legend } from './legend/legend';
import { ChartContainer } from './react_canvas/chart_container';
import { Tooltips } from './tooltips';
import { isHorizontalAxis } from '../chart_types/xy_chart/utils/axis_utils';
import { Position } from '../chart_types/xy_chart/utils/specs';
import { CursorEvent } from '../specs/settings';
import { ChartSize, getChartSize } from '../utils/chart_size';

interface ChartProps {
  /** The type of rendered
   * @default 'canvas'
   */
  renderer: 'svg' | 'canvas';
  size?: ChartSize;
  className?: string;
  id?: string;
}

interface ChartState {
  legendPosition: Position;
  renderComplete: boolean;
  renderCount: number;
}

export class Chart extends React.Component<ChartProps, ChartState> {
  static defaultProps: ChartProps = {
    renderer: 'canvas',
  };
  private chartSpecStore: ChartStore;
  constructor(props: any) {
    super(props);
    this.chartSpecStore = new ChartStore(props.id);
    this.state = {
      legendPosition: this.chartSpecStore.legendPosition.get(),
      renderComplete: false,
      renderCount: 0,
    };

    this.chartSpecStore.chartInitialized.observe(({ newValue, oldValue }) => {
      if (newValue !== oldValue) {
        this.setState({
          renderComplete: newValue,
          renderCount: newValue ? this.state.renderCount + 1 : this.state.renderCount,
        });
      }
    });
    // value is set to chart_store in settings so need to watch the value
    this.chartSpecStore.legendPosition.observe(({ newValue: legendPosition }) => {
      this.setState({
        legendPosition,
      });
    });
  }

  static getContainerStyle = (size: any): CSSProperties => {
    if (size) {
      return {
        position: 'relative',
        ...getChartSize(size),
      };
    }
    return {};
  };

  dispatchExternalCursorEvent(event?: CursorEvent) {
    this.chartSpecStore.setActiveChartId(event && event.chartId);
    const isActiveChart = this.chartSpecStore.isActiveChart.get();

    if (!event) {
      this.chartSpecStore.externalCursorShown.set(false);
      this.chartSpecStore.isCursorOnChart.set(false);
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
    const { renderComplete, renderCount } = this.state;
    const containerStyle = Chart.getContainerStyle(size);
    const horizontal = isHorizontalAxis(this.state.legendPosition);
    const chartClassNames = classNames('echChart', className, {
      'echChart--column': horizontal,
    });

    return (
      <Provider chartStore={this.chartSpecStore}>
        <div
          style={containerStyle}
          className={chartClassNames}
          data-ech-render-complete={renderComplete}
          data-ech-render-count={renderCount}
        >
          <Legend />
          <SpecsParser>{this.props.children}</SpecsParser>
          <div className="echContainer">
            <ChartResizer />
            <Crosshair />
            {// TODO reenable when SVG rendered is aligned with canvas one
            renderer === 'svg' && <ChartContainer />}
            {renderer === 'canvas' && <ChartContainer />}
            <Tooltips />
            <AnnotationTooltip />
            <Highlighter />
          </div>
        </div>
      </Provider>
    );
  }
}
