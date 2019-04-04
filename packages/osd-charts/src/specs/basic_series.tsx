import { inject } from 'mobx-react';
import { PureComponent } from 'react';
import { BasicSeriesSpec } from '../lib/series/specs';
import { getGroupId } from '../lib/utils/ids';
import { ScaleType } from '../lib/utils/scales/scales';
import { SpecProps } from './specs_parser';

type BasicSpecProps = SpecProps & BasicSeriesSpec;

export class BasicSeriesSpecComponent extends PureComponent<BasicSpecProps> {
  static defaultProps: Partial<BasicSpecProps> = {
    seriesType: 'basic',
    groupId: getGroupId('__global__'),
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
    hideInLegend: false,
  };
  componentDidMount() {
    const { chartStore, children, ...config } = this.props;
    chartStore!.addSeriesSpec({ ...config });
  }
  componentDidUpdate() {
    const { chartStore, children, ...config } = this.props;
    chartStore!.addSeriesSpec({ ...config });
  }
  render() {
    return null;
  }
}

export const BasicSeries = inject('chartStore')(BasicSeriesSpecComponent);
