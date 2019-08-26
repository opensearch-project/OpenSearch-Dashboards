import { inject } from 'mobx-react';
import { PureComponent } from 'react';
import { HistogramModeAlignments, LineSeriesSpec, DEFAULT_GLOBAL_ID } from '../utils/specs';
import { getGroupId } from '../../../utils/ids';
import { ScaleType } from '../../../utils/scales/scales';
import { SpecProps } from '../../../specs/specs_parser';

type LineSpecProps = SpecProps & LineSeriesSpec;

export class LineSeriesSpecComponent extends PureComponent<LineSpecProps> {
  static defaultProps: Partial<LineSpecProps> = {
    seriesType: 'line',
    groupId: getGroupId(DEFAULT_GLOBAL_ID),
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
  componentDidUpdate(prevProps: LineSpecProps) {
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

export const LineSeries = inject('chartStore')(LineSeriesSpecComponent);
