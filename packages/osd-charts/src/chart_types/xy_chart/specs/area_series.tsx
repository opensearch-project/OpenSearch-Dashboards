import { AreaSeriesSpec, HistogramModeAlignments, DEFAULT_GLOBAL_ID, SeriesTypes } from '../utils/specs';
import { ScaleType } from '../../../utils/scales/scales';
import { specComponentFactory, getConnect } from '../../../state/spec_factory';
import { ChartTypes } from '../../../chart_types';
import { SpecTypes } from '../../../specs/settings';

const defaultProps = {
  chartType: ChartTypes.XYAxis,
  specType: SpecTypes.Series,
  seriesType: SeriesTypes.Area,
  groupId: DEFAULT_GLOBAL_ID,
  xScaleType: ScaleType.Linear,
  yScaleType: ScaleType.Linear,
  xAccessor: 'x',
  yAccessors: ['y'],
  yScaleToDataExtent: false,
  hideInLegend: false,
  histogramModeAlignment: HistogramModeAlignments.Center,
};

type SpecRequiredProps = Pick<AreaSeriesSpec, 'id' | 'data'>;
type SpecOptionalProps = Partial<Omit<AreaSeriesSpec, 'chartType' | 'specType' | 'seriesType' | 'id' | 'data'>>;

export const AreaSeries: React.FunctionComponent<SpecRequiredProps & SpecOptionalProps> = getConnect()(
  specComponentFactory<
    AreaSeriesSpec,
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
