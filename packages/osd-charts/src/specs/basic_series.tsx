import { inject } from 'mobx-react';
import React from 'react';
import { BasicSeriesSpec } from '../lib/series/specs';
import { getGroupId } from '../lib/utils/ids';
import { ScaleType } from '../lib/utils/scales/scales';
import { SpecProps } from './specs_parser';

type BasicSpecProps = SpecProps & BasicSeriesSpec;

type DefaultProps =
  | 'seriesType'
  | 'groupId'
  | 'xScaleType'
  | 'yScaleType'
  | 'xAccessor'
  | 'yAccessors'
  | 'yScaleToDataExtent';

export class BasicSeriesSpecComponent extends React.PureComponent<BasicSpecProps> {
  static defaultProps: Pick<BasicSpecProps, DefaultProps> = {
    seriesType: 'basic',
    groupId: getGroupId('__global__'),
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
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
