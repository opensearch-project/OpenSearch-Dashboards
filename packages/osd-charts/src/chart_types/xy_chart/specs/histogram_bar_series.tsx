import { inject } from 'mobx-react';
import { PureComponent } from 'react';
import { HistogramBarSeriesSpec, DEFAULT_GLOBAL_ID } from '../utils/specs';
import { getGroupId } from '../../../utils/ids';
import { ScaleType } from '../../../utils/scales/scales';
import { SpecProps } from '../../../specs/specs_parser';

type HistogramBarSpecProps = SpecProps & HistogramBarSeriesSpec;

export class HistogramBarSeriesSpecComponent extends PureComponent<HistogramBarSpecProps> {
  static defaultProps: Partial<HistogramBarSpecProps> = {
    seriesType: 'bar',
    groupId: getGroupId(DEFAULT_GLOBAL_ID),
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
    hideInLegend: false,
    enableHistogramMode: true,
  };
  componentDidMount() {
    const { chartStore, children, ...config } = this.props;
    chartStore!.addSeriesSpec({ ...config });
  }
  componentDidUpdate(prevProps: HistogramBarSpecProps) {
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

export const HistogramBarSeries = inject('chartStore')(HistogramBarSeriesSpecComponent);
