import { HistogramBarSeriesSpec, DEFAULT_GLOBAL_ID, SeriesTypes } from '../utils/specs';
import { ScaleType } from '../../../scales';
import { specComponentFactory, getConnect } from '../../../state/spec_factory';
import { ChartTypes } from '../../../chart_types';
import { SpecTypes } from '../../../specs/settings';

const defaultProps = {
  chartType: ChartTypes.XYAxis,
  specType: SpecTypes.Series,
  seriesType: SeriesTypes.Bar,
  groupId: DEFAULT_GLOBAL_ID,
  xScaleType: ScaleType.Linear,
  yScaleType: ScaleType.Linear,
  xAccessor: 'x',
  yAccessors: ['y'],
  yScaleToDataExtent: false,
  hideInLegend: false,
  enableHistogramMode: true as true,
};

type SpecRequiredProps = Pick<HistogramBarSeriesSpec, 'id' | 'data'>;
type SpecOptionalProps = Partial<Omit<HistogramBarSeriesSpec, 'chartType' | 'specType' | 'seriesType' | 'id' | 'data'>>;

export const HistogramBarSeries: React.FunctionComponent<SpecRequiredProps & SpecOptionalProps> = getConnect()(
  specComponentFactory<
    HistogramBarSeriesSpec,
    | 'seriesType'
    | 'groupId'
    | 'xScaleType'
    | 'yScaleType'
    | 'xAccessor'
    | 'yAccessors'
    | 'yScaleToDataExtent'
    | 'hideInLegend'
    | 'enableHistogramMode'
  >(defaultProps),
);
