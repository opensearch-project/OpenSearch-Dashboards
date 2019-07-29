import { inject } from 'mobx-react';
import { PureComponent } from 'react';
import { ChartStore } from '../chart_types/xy_chart/store/chart_state';

export interface SpecProps {
  chartStore?: ChartStore; // FIX
}

export class SpecsSpecRootComponent extends PureComponent<SpecProps> {
  static getDerivedStateFromProps(props: SpecProps) {
    props.chartStore!.specsInitialized.set(false);
    return null;
  }
  state = {};
  componentDidMount() {
    this.props.chartStore!.specsInitialized.set(true);
    this.props.chartStore!.computeChart();
  }
  componentDidUpdate() {
    this.props.chartStore!.specsInitialized.set(true);
    this.props.chartStore!.computeChart();
  }
  componentWillUnmount() {
    this.props.chartStore!.initialized.set(false);
  }
  render() {
    return this.props.children || null;
  }
}

export const SpecsParser = inject('chartStore')(SpecsSpecRootComponent);
