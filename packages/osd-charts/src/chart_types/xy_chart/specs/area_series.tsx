import { inject } from 'mobx-react';
import { PureComponent } from 'react';
import { AreaSeriesSpec, HistogramModeAlignments } from '../utils/specs';
import { getGroupId } from '../../../utils/ids';
import { ScaleType } from '../../../utils/scales/scales';
import { SpecProps } from '../../../specs/specs_parser';

type AreaSpecProps = SpecProps & AreaSeriesSpec;

export class AreaSeriesSpecComponent extends PureComponent<AreaSpecProps> {
  static defaultProps: Partial<AreaSpecProps> = {
    seriesType: 'area',
    groupId: getGroupId('__global__'),
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
    hideInLegend: false,
    histogramModeAlignment: HistogramModeAlignments.Center,
  };
  componentDidMount() {
    const { chartStore, children, ...config } = this.props;
    chartStore!.addSeriesSpec({ ...config });
  }
  componentDidUpdate(prevProps: AreaSpecProps) {
    const { chartStore, children, ...config } = this.props;
    chartStore!.addSeriesSpec({ ...config });
    if (prevProps.id !== this.props.id) {
      chartStore!.removeSeriesSpec(prevProps.id);
    }
  }
  componentWillUnmount() {
    const { chartStore, id } = this.props;
    chartStore!.removeSeriesSpec(id);
  }
  render() {
    return null;
  }
}

export const AreaSeries = inject('chartStore')(AreaSeriesSpecComponent);
