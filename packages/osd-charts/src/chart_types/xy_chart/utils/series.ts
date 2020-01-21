import { ColorConfig } from '../../../utils/themes/theme';
import { Accessor } from '../../../utils/accessor';
import { GroupId, SpecId } from '../../../utils/ids';
import { splitSpecsByGroupId, YBasicSeriesSpec } from '../domains/y_domain';
import { formatNonStackedDataSeriesValues } from './nonstacked_series_utils';
import { BasicSeriesSpec, SubSeriesStringPredicate, SeriesTypes, SeriesSpecs } from './specs';
import { formatStackedDataSeriesValues } from './stacked_series_utils';
import { ScaleType } from '../../../utils/scales/scales';
import { LastValues } from '../state/utils';
import { Datum } from '../../../utils/domain';

export interface FilledValues {
  /** the x value */
  x?: number | string;
  /** the max y value */
  y1?: number;
  /** the minimum y value */
  y0?: number;
}

export interface RawDataSeriesDatum<T = any> {
  /** the x value */
  x: number | string;
  /** the main y metric */
  y1: number | null;
  /** the optional y0 metric, used for bars or area with a lower bound */
  y0?: number | null;
  /** the datum */
  datum?: T;
}

export interface DataSeriesDatum<T = any> {
  /** the x value */
  x: number | string;
  /** the max y value */
  y1: number | null;
  /** the minimum y value */
  y0: number | null;
  /** initial y1 value, non stacked */
  initialY1: number | null;
  /** initial y0 value, non stacked */
  initialY0: number | null;
  /** initial datum */
  datum?: T;
  /** the list of filled values because missing or nulls */
  filled?: FilledValues;
}

export interface SeriesIdentifier {
  specId: SpecId;
  yAccessor: string | number;
  splitAccessors: Map<string | number, string | number>; // does the map have a size vs making it optional
  seriesKeys: (string | number)[];
  key: string;
}

export type DataSeries = SeriesIdentifier & {
  // seriesColorKey: string;
  data: DataSeriesDatum[];
};

export type RawDataSeries = SeriesIdentifier & {
  // seriesColorKey: string;
  data: RawDataSeriesDatum[];
};

export interface FormattedDataSeries {
  groupId: GroupId;
  dataSeries: DataSeries[];
  counts: DataSeriesCounts;
}

export interface DataSeriesCounts {
  barSeries: number;
  lineSeries: number;
  areaSeries: number;
}

export type SeriesCollectionValue = {
  banded?: boolean;
  lastValue?: LastValues;
  specSortIndex?: number;
  seriesIdentifier: SeriesIdentifier;
};

export function getSeriesIndex(series: SeriesIdentifier[], target: SeriesIdentifier): number {
  if (!series) {
    return -1;
  }

  return series.findIndex(({ key }) => target.key === key);
}

/**
 * Split a dataset into multiple series depending on the accessors.
 * Each series is then associated with a key thats belong to its configuration.
 *
 */
export function splitSeries({
  id: specId,
  data,
  xAccessor,
  yAccessors,
  y0Accessors,
  splitSeriesAccessors = [],
}: Pick<BasicSeriesSpec, 'id' | 'data' | 'xAccessor' | 'yAccessors' | 'y0Accessors' | 'splitSeriesAccessors'>): {
  rawDataSeries: RawDataSeries[];
  colorsValues: Set<string>;
  xValues: Set<string | number>;
} {
  const isMultipleY = yAccessors && yAccessors.length > 1;
  const series = new Map<string, RawDataSeries>();
  const colorsValues = new Set<string>();
  const xValues = new Set<string | number>();

  data.forEach((datum) => {
    const splitAccessors = getSplitAccessors(datum, splitSeriesAccessors);
    if (isMultipleY) {
      yAccessors.forEach((accessor, index) => {
        const cleanedDatum = cleanDatum(datum, xAccessor, accessor, y0Accessors && y0Accessors[index]);

        if (cleanedDatum.x !== null && cleanedDatum.x !== undefined) {
          xValues.add(cleanedDatum.x);
          const seriesKey = updateSeriesMap(series, splitAccessors, accessor, cleanedDatum, specId);
          colorsValues.add(seriesKey);
        }
      });
    } else {
      const cleanedDatum = cleanDatum(datum, xAccessor, yAccessors[0], y0Accessors && y0Accessors[0]);
      if (cleanedDatum.x !== null && cleanedDatum.x !== undefined) {
        xValues.add(cleanedDatum.x);
        const seriesKey = updateSeriesMap(series, splitAccessors, yAccessors[0], cleanedDatum, specId);
        colorsValues.add(seriesKey);
      }
    }
  });

  return {
    rawDataSeries: [...series.values()],
    colorsValues,
    xValues,
  };
}

/**
 * Gets global series key to id any series as a string
 */
export function getSeriesKey({
  specId,
  yAccessor,
  splitAccessors,
}: Pick<SeriesIdentifier, 'specId' | 'yAccessor' | 'splitAccessors'>): string {
  const joinedAccessors = [...splitAccessors.entries()]
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([key, value]) => `${key}-${value}`)
    .join('|');
  return `spec{${specId}}yAccessor{${yAccessor}}splitAccessors{${joinedAccessors}}`;
}

/**
 * Mutate the passed map adding or updating the DataSeries stored
 * along with the series key
 */
function updateSeriesMap(
  seriesMap: Map<string, RawDataSeries>,
  splitAccessors: Map<string | number, string | number>,
  accessor: any,
  datum: RawDataSeriesDatum,
  specId: SpecId,
): string {
  const seriesKeys = [...splitAccessors.values(), accessor];
  const seriesKey = getSeriesKey({
    specId,
    yAccessor: accessor,
    splitAccessors,
  });
  const series = seriesMap.get(seriesKey);
  if (series) {
    series.data.push(datum);
  } else {
    seriesMap.set(seriesKey, {
      specId,
      yAccessor: accessor,
      splitAccessors,
      data: [datum],
      key: seriesKey,
      seriesKeys,
    });
  }
  return seriesKey;
}

/**
 * Get the array of values that forms a series key
 */
function getSplitAccessors(datum: Datum, accessors: Accessor[] = []): Map<string | number, string | number> {
  const splitAccessors = new Map<string | number, string | number>();
  accessors.forEach((accessor) => {
    const value = datum[accessor];
    if (value !== undefined || value !== null) {
      splitAccessors.set(accessor, value);
    }
  });
  return splitAccessors;
}

/**
 * Reformat the datum having only the required x and y property.
 */
export function cleanDatum(
  datum: Datum,
  xAccessor: Accessor,
  yAccessor: Accessor,
  y0Accessor?: Accessor,
): RawDataSeriesDatum {
  const x = datum[xAccessor];
  const y1 = castToNumber(datum[yAccessor]);
  const cleanedDatum: RawDataSeriesDatum = { x, y1, datum, y0: null };
  if (y0Accessor) {
    cleanedDatum.y0 = castToNumber(datum[y0Accessor]);
  }
  return cleanedDatum;
}

function castToNumber(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export function getFormattedDataseries(
  specs: YBasicSeriesSpec[],
  dataSeries: Map<SpecId, RawDataSeries[]>,
  xValues: Set<string | number>,
  xScaleType: ScaleType,
  seriesSpecs: SeriesSpecs,
): {
  stacked: FormattedDataSeries[];
  nonStacked: FormattedDataSeries[];
} {
  const specsByGroupIds = splitSpecsByGroupId(specs);
  const specsByGroupIdsEntries = [...specsByGroupIds.entries()];

  const stackedFormattedDataSeries: {
    groupId: GroupId;
    dataSeries: DataSeries[];
    counts: DataSeriesCounts;
  }[] = [];
  const nonStackedFormattedDataSeries: {
    groupId: GroupId;
    dataSeries: DataSeries[];
    counts: DataSeriesCounts;
  }[] = [];

  specsByGroupIdsEntries.forEach(([groupId, groupSpecs]) => {
    const { isPercentageStack } = groupSpecs;
    // format stacked data series
    const stackedDataSeries = getRawDataSeries(groupSpecs.stacked, dataSeries);
    const stackedDataSeriesValues = formatStackedDataSeriesValues(
      stackedDataSeries.rawDataSeries,
      false,
      isPercentageStack,
      xValues,
      xScaleType,
    );
    stackedFormattedDataSeries.push({
      groupId,
      counts: stackedDataSeries.counts,
      dataSeries: stackedDataSeriesValues,
    });

    // format non stacked data series
    const nonStackedDataSeries = getRawDataSeries(groupSpecs.nonStacked, dataSeries);
    nonStackedFormattedDataSeries.push({
      groupId,
      counts: nonStackedDataSeries.counts,
      dataSeries: formatNonStackedDataSeriesValues(nonStackedDataSeries.rawDataSeries, false, seriesSpecs, xScaleType),
    });
  });
  return {
    stacked: stackedFormattedDataSeries.filter((ds) => ds.dataSeries.length > 0),
    nonStacked: nonStackedFormattedDataSeries.filter((ds) => ds.dataSeries.length > 0),
  };
}

function getRawDataSeries(
  seriesSpecs: YBasicSeriesSpec[],
  dataSeries: Map<SpecId, RawDataSeries[]>,
): {
  rawDataSeries: RawDataSeries[];
  counts: DataSeriesCounts;
} {
  const rawDataSeries: RawDataSeries[] = [];
  const counts = {
    barSeries: 0,
    lineSeries: 0,
    areaSeries: 0,
  };
  const seriesSpecsCount = seriesSpecs.length;
  let i = 0;
  for (; i < seriesSpecsCount; i++) {
    const spec = seriesSpecs[i];
    const { id, seriesType } = spec;
    const ds = dataSeries.get(id);
    switch (seriesType) {
      case SeriesTypes.Bar:
        counts.barSeries += ds ? ds.length : 0;
        break;
      case SeriesTypes.Line:
        counts.lineSeries += ds ? ds.length : 0;
        break;
      case SeriesTypes.Area:
        counts.areaSeries += ds ? ds.length : 0;
        break;
    }

    if (ds) {
      rawDataSeries.push(...ds);
    }
  }
  return {
    rawDataSeries,
    counts,
  };
}
/**
 *
 * @param seriesSpecs the map for all the series spec
 * @param deselectedDataSeries the array of deselected/hidden data series
 */
export function getSplittedSeries(
  seriesSpecs: BasicSeriesSpec[],
  deselectedDataSeries: SeriesIdentifier[] = [],
): {
  splittedSeries: Map<SpecId, RawDataSeries[]>;
  seriesCollection: Map<string, SeriesCollectionValue>;
  xValues: Set<string | number>;
} {
  const splittedSeries = new Map<SpecId, RawDataSeries[]>();
  const seriesCollection = new Map<string, SeriesCollectionValue>();
  const xValues: Set<any> = new Set();
  let isOrdinalScale = false;
  for (const spec of seriesSpecs) {
    const dataSeries = splitSeries(spec);
    let currentRawDataSeries = dataSeries.rawDataSeries;
    if (spec.xScaleType === ScaleType.Ordinal) {
      isOrdinalScale = true;
    }
    if (deselectedDataSeries.length > 0) {
      currentRawDataSeries = dataSeries.rawDataSeries.filter(({ key }) => {
        return !deselectedDataSeries.some(({ key: deselectedKey }) => key === deselectedKey);
      });
    }

    splittedSeries.set(spec.id, currentRawDataSeries);

    const banded = spec.y0Accessors && spec.y0Accessors.length > 0;

    dataSeries.rawDataSeries.forEach((series) => {
      seriesCollection.set(series.key, {
        banded,
        specSortIndex: spec.sortIndex,
        seriesIdentifier: series as SeriesIdentifier,
      });
    });

    for (const xValue of dataSeries.xValues) {
      xValues.add(xValue);
    }
  }

  return {
    splittedSeries,
    seriesCollection,
    // keep the user order for ordinal scales
    xValues: isOrdinalScale ? xValues : new Set([...xValues].sort()),
  };
}

/**
 * Get custom  series sub-name
 */
const getCustomSubSeriesName = (() => {
  const cache = new Map();

  return (customSubSeriesLabel: SubSeriesStringPredicate, isTooltip: boolean) => (
    args: [string | number | null, string | number],
  ): string | number => {
    const [accessorKey, accessorLabel] = args;
    const key = [args, isTooltip].join('~~~');

    if (cache.has(key)) {
      return cache.get(key);
    } else {
      const label = customSubSeriesLabel(accessorLabel, accessorKey, isTooltip) || accessorLabel;
      cache.set(key, label);

      return label;
    }
  };
})();

const getSeriesLabelKeys = (
  spec: BasicSeriesSpec,
  seriesIdentifier: SeriesIdentifier,
  isTooltip: boolean,
): (string | number)[] => {
  const isMultipleY = spec.yAccessors.length > 1;

  if (spec.customSubSeriesLabel) {
    const { yAccessor, splitAccessors } = seriesIdentifier;
    const fullKeyPairs: [string | number | null, string | number][] = [...splitAccessors.entries(), [null, yAccessor]];
    const labelKeys = fullKeyPairs.map(getCustomSubSeriesName(spec.customSubSeriesLabel, isTooltip));

    return isMultipleY ? labelKeys : labelKeys.slice(0, -1);
  }

  const { seriesKeys } = seriesIdentifier;

  return isMultipleY ? seriesKeys : seriesKeys.slice(0, -1);
};

/**
 * Get series label based on `SeriesIdentifier`
 */
export function getSeriesLabel(
  seriesIdentifier: SeriesIdentifier,
  hasSingleSeries: boolean,
  isTooltip: boolean,
  spec?: BasicSeriesSpec,
): string {
  if (spec && spec.customSeriesLabel) {
    const customLabel = spec.customSeriesLabel(seriesIdentifier, isTooltip);

    if (customLabel !== null) {
      return customLabel;
    }
  }

  let label = '';
  const labelKeys = spec ? getSeriesLabelKeys(spec, seriesIdentifier, isTooltip) : seriesIdentifier.seriesKeys;

  // there is one series, the is only one yAccessor, the first part is not null
  if (hasSingleSeries || labelKeys.length === 0 || labelKeys[0] == null) {
    if (!spec) {
      return '';
    }

    if (spec.splitSeriesAccessors && labelKeys.length > 0 && labelKeys[0] != null) {
      label = labelKeys.join(' - ');
    } else {
      label = spec.name || `${spec.id}`;
    }
  } else {
    label = labelKeys.join(' - ');
  }

  return label;
}

function getSortIndex({ specSortIndex }: SeriesCollectionValue, total: number): number {
  return specSortIndex != null ? specSortIndex : total;
}

export function getSortedDataSeriesColorsValuesMap(
  seriesCollection: Map<string, SeriesCollectionValue>,
): Map<string, SeriesCollectionValue> {
  const seriesColorsArray = [...seriesCollection];
  seriesColorsArray.sort(([, specA], [, specB]) => {
    return getSortIndex(specA, seriesCollection.size) - getSortIndex(specB, seriesCollection.size);
  });

  return new Map([...seriesColorsArray]);
}

export function getSeriesColors(
  seriesCollection: Map<string, SeriesCollectionValue>,
  chartColors: ColorConfig,
  customColors: Map<string, string>,
): Map<string, string> {
  const seriesColorMap = new Map<string, string>();
  let counter = 0;

  seriesCollection.forEach((_, seriesKey) => {
    const customSeriesColor: string | undefined = customColors.get(seriesKey);
    const color = customSeriesColor || chartColors.vizColors[counter % chartColors.vizColors.length];

    seriesColorMap.set(seriesKey, color);
    counter++;
  });
  return seriesColorMap;
}
