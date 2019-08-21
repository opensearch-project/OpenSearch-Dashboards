import { inject } from 'mobx-react';
import { PureComponent } from 'react';
import { ChartStore } from '../chart_types/xy_chart/store/chart_state';

export interface SpecProps {
  chartStore?: ChartStore; // FIX
}

export class SpecsSpecRootComponent extends PureComponent<SpecProps> {
  componentDidMount() {
    this.props.chartStore!.specsInitialized.set(true);
    this.props.chartStore!.computeChart();
  }
  componentDidUpdate() {
    this.props.chartStore!.specsInitialized.set(true);
    this.props.chartStore!.computeChart();
  }
  componentWillUnmount() {
    this.props.chartStore!.chartInitialized.set(false);
  }
  render() {
    return this.props.children || null;
  }
}

export const SpecsParser = inject('chartStore')(SpecsSpecRootComponent);
