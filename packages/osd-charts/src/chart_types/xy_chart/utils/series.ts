import { ColorConfig } from '../../../utils/themes/theme';
import { Accessor, AccessorFn, getAccessorValue } from '../../../utils/accessor';
import { GroupId, SpecId } from '../../../utils/ids';
import { splitSpecsByGroupId, YBasicSeriesSpec } from '../domains/y_domain';
import { formatNonStackedDataSeriesValues } from './nonstacked_series_utils';
import { BasicSeriesSpec, SeriesTypes, SeriesSpecs, SeriesNameConfigOptions } from './specs';
import { formatStackedDataSeriesValues } from './stacked_series_utils';
import { ScaleType } from '../../../scales';
import { LastValues } from '../state/utils';
import { Datum, Color } from '../../../utils/commons';
import { ColorOverrides } from '../../../state/chart_state';

export const SERIES_DELIMITER = ' - ';

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

export type SeriesKey = string;

export type SeriesIdentifier = {
  specId: SpecId;
  key: SeriesKey;
};

export interface XYChartSeriesIdentifier extends SeriesIdentifier {
  yAccessor: string | number;
  splitAccessors: Map<string | number, string | number>; // does the map have a size vs making it optional
  seriesKeys: (string | number)[];
}

export type DataSeries = XYChartSeriesIdentifier & {
  // seriesColorKey: string;
  data: DataSeriesDatum[];
};

export type RawDataSeries = XYChartSeriesIdentifier & {
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
  seriesIdentifier: XYChartSeriesIdentifier;
};

export function getSeriesIndex(series: XYChartSeriesIdentifier[], target: XYChartSeriesIdentifier): number {
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
  const series = new Map<SeriesKey, RawDataSeries>();
  const colorsValues = new Set<string>();
  const xValues = new Set<string | number>();

  data.forEach((datum) => {
    const splitAccessors = getSplitAccessors(datum, splitSeriesAccessors);
    if (isMultipleY) {
      yAccessors.forEach((accessor, index) => {
        const cleanedDatum = cleanDatum(datum, xAccessor, accessor, y0Accessors && y0Accessors[index]);

        if (cleanedDatum !== null && cleanedDatum.x !== null && cleanedDatum.x !== undefined) {
          xValues.add(cleanedDatum.x);
          const seriesKey = updateSeriesMap(series, splitAccessors, accessor, cleanedDatum, specId);
          colorsValues.add(seriesKey);
        }
      });
    } else {
      const cleanedDatum = cleanDatum(datum, xAccessor, yAccessors[0], y0Accessors && y0Accessors[0]);
      if (cleanedDatum !== null && cleanedDatum.x !== null && cleanedDatum.x !== undefined) {
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
}: Pick<XYChartSeriesIdentifier, 'specId' | 'yAccessor' | 'splitAccessors'>): string {
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
  seriesMap: Map<SeriesKey, RawDataSeries>,
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
  if (typeof datum === 'object' && datum !== null) {
    accessors.forEach((accessor: Accessor) => {
      const value = datum[accessor as keyof typeof datum];
      if (typeof value === 'string' || typeof value === 'number') {
        splitAccessors.set(accessor, value);
      }
    });
  }
  return splitAccessors;
}

/**
 * Reformat the datum having only the required x and y property.
 */
export function cleanDatum(
  datum: Datum,
  xAccessor: Accessor | AccessorFn,
  yAccessor: Accessor,
  y0Accessor?: Accessor,
): RawDataSeriesDatum | null {
  if (typeof datum !== 'object' || datum === null) {
    return null;
  }
  const x = getAccessorValue(datum, xAccessor);
  if (typeof x !== 'string' && typeof x !== 'number') {
    return null;
  }

  const y1 = castToNumber(datum[yAccessor as keyof typeof datum]);
  const cleanedDatum: RawDataSeriesDatum = { x, y1, datum, y0: null };
  if (y0Accessor) {
    cleanedDatum.y0 = castToNumber(datum[y0Accessor as keyof typeof datum]);
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
  deselectedDataSeries: XYChartSeriesIdentifier[] = [],
): {
  splittedSeries: Map<SpecId, RawDataSeries[]>;
  seriesCollection: Map<SeriesKey, SeriesCollectionValue>;
  xValues: Set<string | number>;
} {
  const splittedSeries = new Map<SpecId, RawDataSeries[]>();
  const seriesCollection = new Map<SeriesKey, SeriesCollectionValue>();
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
      const { data, ...seriesIdentifier } = series;
      seriesCollection.set(series.key, {
        banded,
        specSortIndex: spec.sortIndex,
        seriesIdentifier,
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

function getSeriesNameFromOptions(
  options: SeriesNameConfigOptions,
  { yAccessor, splitAccessors }: XYChartSeriesIdentifier,
  delimiter: string,
): string | null {
  if (!options.names) {
    return null;
  }

  return (
    options.names
      .slice()
      .sort(({ sortIndex: a = Infinity }, { sortIndex: b = Infinity }) => a - b)
      .map(({ accessor, value, name }) => {
        const accessorValue = splitAccessors.get(accessor) ?? null;
        if (accessorValue === value) {
          return name ?? value;
        }

        if (yAccessor === accessor) {
          return name ?? accessor;
        }
        return null;
      })
      .filter((d) => Boolean(d) || d === 0)
      .join(delimiter) || null
  );
}

/**
 * Get series name based on `SeriesIdentifier`
 */
export function getSeriesName(
  seriesIdentifier: XYChartSeriesIdentifier,
  hasSingleSeries: boolean,
  isTooltip: boolean,
  spec?: BasicSeriesSpec,
): string {
  let delimiter = SERIES_DELIMITER;
  if (spec && spec.name && typeof spec.name !== 'string') {
    let customLabel: string | number | null = null;
    if (typeof spec.name === 'function') {
      customLabel = spec.name(seriesIdentifier, isTooltip);
    } else {
      delimiter = spec.name.delimiter ?? delimiter;
      customLabel = getSeriesNameFromOptions(spec.name, seriesIdentifier, delimiter);
    }

    if (customLabel !== null) {
      return customLabel.toString();
    }
  }

  let name = '';
  const nameKeys =
    spec && spec.yAccessors.length > 1 ? seriesIdentifier.seriesKeys : seriesIdentifier.seriesKeys.slice(0, -1);

  // there is one series, the is only one yAccessor, the first part is not null
  if (hasSingleSeries || nameKeys.length === 0 || nameKeys[0] == null) {
    if (!spec) {
      return '';
    }

    if (spec.splitSeriesAccessors && nameKeys.length > 0 && nameKeys[0] != null) {
      name = nameKeys.join(delimiter);
    } else {
      name = typeof spec.name === 'string' ? spec.name : `${spec.id}`;
    }
  } else {
    name = nameKeys.join(delimiter);
  }

  return name;
}

function getSortIndex({ specSortIndex }: SeriesCollectionValue, total: number): number {
  return specSortIndex != null ? specSortIndex : total;
}

export function getSortedDataSeriesColorsValuesMap(
  seriesCollection: Map<SeriesKey, SeriesCollectionValue>,
): Map<SeriesKey, SeriesCollectionValue> {
  const seriesColorsArray = [...seriesCollection];
  seriesColorsArray.sort(([, specA], [, specB]) => {
    return getSortIndex(specA, seriesCollection.size) - getSortIndex(specB, seriesCollection.size);
  });

  return new Map([...seriesColorsArray]);
}

/**
 * Helper function to get highest override color.
 *
 * from highest to lowest: `temporary`, `seriesSpec.color` then `persisted`
 *
 * @param key
 * @param customColors
 * @param overrides
 */
function getHighestOverride(
  key: string,
  customColors: Map<SeriesKey, Color>,
  overrides: ColorOverrides,
): Color | undefined {
  let color: Color | undefined = overrides.temporary[key];

  if (color) {
    return color;
  }

  color = customColors.get(key);

  if (color) {
    return color;
  }

  return overrides.persisted[key];
}

/**
 * Returns color for a series given all color hierarchies
 *
 * @param seriesCollection
 * @param chartColors
 * @param customColors
 * @param overrides
 */
export function getSeriesColors(
  seriesCollection: Map<SeriesKey, SeriesCollectionValue>,
  chartColors: ColorConfig,
  customColors: Map<SeriesKey, Color>,
  overrides: ColorOverrides,
): Map<SeriesKey, Color> {
  const seriesColorMap = new Map<SeriesKey, Color>();
  let counter = 0;

  seriesCollection.forEach((_, seriesKey) => {
    const colorOverride = getHighestOverride(seriesKey, customColors, overrides);
    const color = colorOverride || chartColors.vizColors[counter % chartColors.vizColors.length];

    seriesColorMap.set(seriesKey, color);
    counter++;
  });
  return seriesColorMap;
}
