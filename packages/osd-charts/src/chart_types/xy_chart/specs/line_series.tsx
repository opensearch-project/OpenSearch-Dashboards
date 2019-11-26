import { LineSeriesSpec, DEFAULT_GLOBAL_ID, HistogramModeAlignments, SpecTypes, SeriesTypes } from '../utils/specs';
import { ScaleType } from '../../../utils/scales/scales';
import { ChartTypes } from '../../../chart_types';
import { specComponentFactory, getConnect } from '../../../state/spec_factory';

const defaultProps = {
  chartType: ChartTypes.XYAxis,
  specType: SpecTypes.Series,
  seriesType: SeriesTypes.Line,
  groupId: DEFAULT_GLOBAL_ID,
  xScaleType: ScaleType.Ordinal,
  yScaleType: ScaleType.Linear,
  xAccessor: 'x',
  yAccessors: ['y'],
  yScaleToDataExtent: false,
  hideInLegend: false,
  histogramModeAlignment: HistogramModeAlignments.Center,
};
type SpecRequiredProps = Pick<LineSeriesSpec, 'id' | 'data'>;
type SpecOptionalProps = Partial<Omit<LineSeriesSpec, 'chartType' | 'specType' | 'seriesType' | 'id' | 'data'>>;

export const LineSeries: React.FunctionComponent<SpecRequiredProps & SpecOptionalProps> = getConnect()(
  specComponentFactory<
    LineSeriesSpec,
    | 'seriesType'
    | 'groupId'
    | 'xScaleType'
    | 'yScaleType'
    | 'xAccessor'
    | 'yAccessors'
    | 'yScaleToDataExtent'
    | 'hideInLegend'
    | 'histogramModeAlignment'
  >(defaultProps),
);
