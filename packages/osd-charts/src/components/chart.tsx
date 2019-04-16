import classNames from 'classnames';
import { Provider } from 'mobx-react';
import React, { CSSProperties, Fragment } from 'react';
import { SpecsParser } from '../specs/specs_parser';
import { ChartStore } from '../state/chart_state';
import { AnnotationTooltip } from './annotation_tooltips';
import { ChartResizer } from './chart_resizer';
import { Crosshair } from './crosshair';
import { Highlighter } from './highlighter';
import { Legend } from './legend';
import { LegendButton } from './legend_button';
import { ReactiveChart as ReactChart } from './react_canvas/reactive_chart';
import { ReactiveChart as SVGChart } from './svg/reactive_chart';
import { Tooltips } from './tooltips';

interface ChartProps {
  /** The type of rendered
   * @default 'canvas'
   */
  renderer: 'svg' | 'canvas';
  size?: [number, number];
  className?: string;
}

export class Chart extends React.Component<ChartProps> {
  static defaultProps: ChartProps = {
    renderer: 'canvas',
  };
  private chartSpecStore: ChartStore;
  constructor(props: any) {
    super(props);
    this.chartSpecStore = new ChartStore();
  }
  render() {
    const { renderer, size, className } = this.props;
    let containerStyle: CSSProperties;
    if (size) {
      containerStyle = {
        position: 'relative',
        width: size[0],
        height: size[1],
      };
    } else {
      containerStyle = {};
    }
    const chartClass = classNames('elasticCharts', className);
    return (
      <Provider chartStore={this.chartSpecStore}>
        <Fragment>
          <SpecsParser>{this.props.children}</SpecsParser>
          <div style={containerStyle} className={chartClass}>
            <ChartResizer />
            <Crosshair />
            {renderer === 'svg' && <SVGChart />}
            {renderer === 'canvas' && <ReactChart />}
            <Tooltips />
            <AnnotationTooltip />
            <Legend />
            <LegendButton />
            <Highlighter />
          </div>
        </Fragment>
      </Provider>
    );
  }
}
