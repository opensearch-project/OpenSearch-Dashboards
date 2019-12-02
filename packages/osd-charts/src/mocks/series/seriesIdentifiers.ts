import { BasicSeriesSpec } from '../../chart_types/xy_chart/utils/specs';
import { getSpecId } from '../..';
import { SeriesCollectionValue, getSplittedSeries, SeriesIdentifier } from '../../chart_types/xy_chart/utils/series';
import { mergePartial } from '../../utils/commons';

type SeriesCollection = Map<string, SeriesCollectionValue>;

export class MockSeriesCollection {
  static empty(): SeriesCollection {
    return new Map();
  }

  static fromSpecs(seriesSpecs: BasicSeriesSpec[]) {
    const { seriesCollection } = getSplittedSeries(seriesSpecs, []);

    return seriesCollection;
  }
}

export class MockSeriesIdentifier {
  private static readonly base: SeriesIdentifier = {
    specId: getSpecId('bars'),
    yAccessor: 'y',
    seriesKeys: ['a'],
    splitAccessors: new Map().set('g', 'a'),
    key: 'spec{bars}yAccessor{y}splitAccessors{g-a}',
  };

  static default(partial?: Partial<SeriesIdentifier>) {
    return mergePartial<SeriesIdentifier>(MockSeriesIdentifier.base, partial, { mergeOptionalPartialValues: true });
  }
}
