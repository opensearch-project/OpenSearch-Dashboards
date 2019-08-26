import React from 'react';
import { inject, observer } from 'mobx-react';
import { ChartStore } from '../../chart_types/xy_chart/store/chart_state';
import { ReactiveChart } from './reactive_chart';
interface ReactiveChartProps {
  chartStore?: ChartStore; // FIX until we find a better way on ts mobx
}

class ChartContainerComponent extends React.Component<ReactiveChartProps> {
  static displayName = 'ChartContainer';

  render() {
    const { chartInitialized } = this.props.chartStore!;
    if (!chartInitialized.get()) {
      return null;
    }
    const { setCursorPosition, isChartEmpty } = this.props.chartStore!;
    return (
      <div
        className="echChartCursorContainer"
        style={{
          cursor: this.props.chartStore!.chartCursor.get(),
        }}
        onMouseMove={({ nativeEvent: { offsetX, offsetY } }) => {
          if (!isChartEmpty.get()) {
            setCursorPosition(offsetX, offsetY);
          }
        }}
        onMouseLeave={() => {
          setCursorPosition(-1, -1);
        }}
        onMouseUp={() => {
          if (this.props.chartStore!.isBrushing.get()) {
            return;
          }
          this.props.chartStore!.handleChartClick();
        }}
      >
        <ReactiveChart />
      </div>
    );
  }
}

export const ChartContainer = inject('chartStore')(observer(ChartContainerComponent));
