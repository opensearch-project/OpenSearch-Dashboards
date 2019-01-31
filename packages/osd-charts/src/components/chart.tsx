import classNames from 'classnames';
import { Provider } from 'mobx-react';
import React, { Fragment } from 'react';
import { SpecsParser } from '../specs/specs_parser';
import { ChartStore } from '../state/chart_state';
import { ChartResizer } from './chart_resizer';
import { Legend } from './legend';
import { ReactiveChart as ReactChart } from './react_canvas/reactive_chart';
import { ReactiveChart as SVGChart } from './svg/reactive_chart';
import { Tooltips } from './tooltips';

interface ChartProps {
  renderer: 'svg' | 'canvas' | 'canvas_old';
  size?: [number, number];
  className?: string;
}

export class Chart extends React.Component<ChartProps> {
  static defaultProps: Pick<ChartProps, 'renderer'> = {
    renderer: 'svg',
  };
  private chartSpecStore: ChartStore;
  constructor(props: any) {
    super(props);
    this.chartSpecStore = new ChartStore();
  }
  render() {
    const { renderer, size, className } = this.props;
    let containerStyle;
    if (size) {
      containerStyle = {
        position: 'relative' as 'relative',
        width: size[0],
        height: size[1],
      };
    } else {
      containerStyle = {};
    }
    const chartClass = classNames('elasticcharts', className);
    return (
      <Provider chartStore={this.chartSpecStore}>
        <Fragment>
          <SpecsParser>{this.props.children}</SpecsParser>
          <div style={containerStyle} className={chartClass}>
            <ChartResizer />
            {renderer === 'svg' && <SVGChart />}
            {renderer === 'canvas' && <ReactChart />}
            <Tooltips />
            <Legend />
          </div>
        </Fragment>
      </Provider>
    );
  }
}
