import { mergePartial } from '../../utils/commons';
import {
  SeriesSpecs,
  DEFAULT_GLOBAL_ID,
  BarSeriesSpec,
  AreaSeriesSpec,
  HistogramModeAlignments,
  HistogramBarSeriesSpec,
  LineSeriesSpec,
  BasicSeriesSpec,
  SpecTypes,
  SeriesTypes,
} from '../../chart_types/xy_chart/utils/specs';
import { getSpecId, getGroupId } from '../../utils/ids';
import { ScaleType } from '../../utils/scales/scales';
import { ChartTypes } from '../../chart_types';

export class MockSeriesSpec {
  private static readonly barBase: BarSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: getSpecId('spec1'),
    seriesType: SeriesTypes.Bar,
    groupId: getGroupId(DEFAULT_GLOBAL_ID),
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    splitSeriesAccessors: ['g'],
    yScaleToDataExtent: false,
    hideInLegend: false,
    enableHistogramMode: false,
    stackAsPercentage: false,
    data: [] as any[],
  };

  private static readonly histogramBarBase: HistogramBarSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: getSpecId('spec1'),
    seriesType: SeriesTypes.Bar,
    groupId: getGroupId(DEFAULT_GLOBAL_ID),
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
    hideInLegend: false,
    enableHistogramMode: true,
    data: [],
  };

  private static readonly areaBase: AreaSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: getSpecId('spec1'),
    seriesType: SeriesTypes.Area,
    groupId: getGroupId(DEFAULT_GLOBAL_ID),
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
    hideInLegend: false,
    histogramModeAlignment: HistogramModeAlignments.Center,
    data: [],
  };

  private static readonly lineBase: LineSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: getSpecId('spec1'),
    seriesType: SeriesTypes.Line,
    groupId: getGroupId(DEFAULT_GLOBAL_ID),
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
    hideInLegend: false,
    histogramModeAlignment: HistogramModeAlignments.Center,
    data: [],
  };

  static bar(partial?: Partial<BarSeriesSpec>): BarSeriesSpec {
    return mergePartial<BarSeriesSpec>(MockSeriesSpec.barBase, partial, { mergeOptionalPartialValues: true });
  }

  static histogramBar(partial?: Partial<HistogramBarSeriesSpec>): HistogramBarSeriesSpec {
    return mergePartial<HistogramBarSeriesSpec>(MockSeriesSpec.histogramBarBase, partial, {
      mergeOptionalPartialValues: true,
    });
  }

  static area(partial?: Partial<AreaSeriesSpec>): AreaSeriesSpec {
    return mergePartial<AreaSeriesSpec>(MockSeriesSpec.areaBase, partial, { mergeOptionalPartialValues: true });
  }

  static line(partial?: Partial<LineSeriesSpec>): LineSeriesSpec {
    return mergePartial<LineSeriesSpec>(MockSeriesSpec.lineBase, partial, { mergeOptionalPartialValues: true });
  }

  static byType(type?: 'line' | 'bar' | 'area'): BasicSeriesSpec {
    switch (type) {
      case 'line':
        return MockSeriesSpec.lineBase;
        break;
      case 'bar':
        return MockSeriesSpec.barBase;
        break;
      case 'area':
        return MockSeriesSpec.areaBase;
        break;
      default:
        return MockSeriesSpec.barBase;
    }
  }
}

export class MockSeriesSpecs {
  static fromSpecs(specs: BasicSeriesSpec[]): SeriesSpecs {
    return specs;
  }

  static fromPartialSpecs(specs: Partial<BasicSeriesSpec>[]): SeriesSpecs {
    return specs.map(({ seriesType, ...spec }) => {
      const base = MockSeriesSpec.byType(seriesType);
      return mergePartial<BasicSeriesSpec>(base, spec, { mergeOptionalPartialValues: true });
    });
  }

  static empty(): SeriesSpecs {
    return [];
  }
}
