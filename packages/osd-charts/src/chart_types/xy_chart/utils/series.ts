/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { SeriesIdentifier, SeriesKey } from '../../../commons/series_id';
import { ScaleType } from '../../../scales/constants';
import { ColorOverrides } from '../../../state/chart_state';
import { Accessor, AccessorFn, getAccessorValue } from '../../../utils/accessor';
import { Datum, Color } from '../../../utils/commons';
import { GroupId, SpecId } from '../../../utils/ids';
import { Logger } from '../../../utils/logger';
import { ColorConfig } from '../../../utils/themes/theme';
import { splitSpecsByGroupId, YBasicSeriesSpec } from '../domains/y_domain';
import { LastValues } from '../state/utils/types';
import { applyFitFunctionToDataSeries } from './fit_function_utils';
import { BasicSeriesSpec, SeriesTypes, SeriesSpecs, SeriesNameConfigOptions, StackMode } from './specs';
import { formatStackedDataSeriesValues } from './stacked_series_utils';

/** @internal */
export const SERIES_DELIMITER = ' - ';

/** @public */
export interface FilledValues {
  /** the x value */
  x?: number | string;
  /** the max y value */
  y1?: number;
  /** the minimum y value */
  y0?: number;
}

/** @public */
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
  /** the optional mark metric, used for lines and area series */
  mark: number | null;
  /** initial datum */
  datum: T;
  /** the list of filled values because missing or nulls */
  filled?: FilledValues;
}

export interface XYChartSeriesIdentifier extends SeriesIdentifier {
  yAccessor: string | number;
  splitAccessors: Map<string | number, string | number>; // does the map have a size vs making it optional
  seriesKeys: (string | number)[];
}

/** @internal */
export type DataSeries = XYChartSeriesIdentifier & {
  // seriesColorKey: string;
  data: DataSeriesDatum[];
};

/** @internal */
export interface FormattedDataSeries {
  groupId: GroupId;
  dataSeries: DataSeries[];
  counts: DataSeriesCounts;
  stackMode?: StackMode;
}

/** @internal */
export type DataSeriesCounts = {[key in SeriesTypes]: number};

/** @internal */
export type SeriesCollectionValue = {
  banded?: boolean;
  lastValue?: LastValues;
  specSortIndex?: number;
  seriesIdentifier: XYChartSeriesIdentifier;
};

/** @internal */
export function getSeriesIndex(series: SeriesIdentifier[], target: SeriesIdentifier): number {
  if (!series) {
    return -1;
  }

  return series.findIndex(({ key }) => target.key === key);
}

/**
 * Split a dataset into multiple series depending on the accessors.
 * Each series is then associated with a key thats belong to its configuration.
 * This method removes every data with an invalid x: a string or number value is required
 * `y` values and `mark` values are casted to number or null.
 * @internal
 */
export function splitSeriesDataByAccessors({
  id: specId,
  data,
  xAccessor,
  yAccessors,
  y0Accessors,
  markSizeAccessor,
  splitSeriesAccessors = [],
}: Pick<
  BasicSeriesSpec,
  'id' | 'data' | 'xAccessor' | 'yAccessors' | 'y0Accessors' | 'splitSeriesAccessors' | 'markSizeAccessor'
>): {
  dataSeries: Map<SeriesKey, DataSeries>;
  xValues: Array<string | number>;
} {
  const dataSeries = new Map<SeriesKey, DataSeries>();
  const xValues: Array<string|number> = [];
  const nonNumericValues: any[] = [];

  data.forEach((datum) => {
    const splitAccessors = getSplitAccessors(datum, splitSeriesAccessors);
    // if splitSeriesAccessors are defined we should have at least one split value to include datum
    if (splitSeriesAccessors.length > 0 && splitAccessors.size < 1) {
      return;
    }

    // skip if the datum is not an object or null
    if (typeof datum !== 'object' || datum === null) {
      return null;
    }

    const x = getAccessorValue(datum, xAccessor);

    // skip if the x value is not a string or a number
    if (typeof x !== 'string' && typeof x !== 'number') {
      return null;
    }

    xValues.push(x);

    yAccessors.forEach((accessor, index) => {
      const cleanedDatum = extractYandMarkFromDatum(
        datum,
        accessor,
        nonNumericValues,
        y0Accessors && y0Accessors[index],
        markSizeAccessor,
      );
      const seriesKeys = [...splitAccessors.values(), accessor];
      const seriesKey = getSeriesKey({
        specId,
        yAccessor: accessor,
        splitAccessors,
      });
      const newDatum = { x, ...cleanedDatum };
      const series = dataSeries.get(seriesKey);
      if (series) {
        series.data.push(newDatum);
      } else {
        dataSeries.set(seriesKey, {
          specId,
          yAccessor: accessor,
          splitAccessors,
          data: [newDatum],
          key: seriesKey,
          seriesKeys,
        });
      }
    });
  });

  if (nonNumericValues.length > 0) {
    Logger.warn(`Found non-numeric y value${nonNumericValues.length > 1 ? 's' : ''} in dataset for spec "${specId}"`,
      `(${nonNumericValues.map((v) => JSON.stringify(v)).join(', ')})`
    );
  }

  return {
    dataSeries,
    xValues,
  };
}

/**
 * Gets global series key to id any series as a string
 * @internal
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
 * Get the array of values that forms a series key
 * @internal
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
 * Extract y1 and y0 and mark properties from Datum. Casting them to numbers or null
 * @internal
 */
export function extractYandMarkFromDatum(
  datum: Datum,
  yAccessor: Accessor,
  nonNumericValues: any[],
  y0Accessor?: Accessor,
  markSizeAccessor?: Accessor | AccessorFn,
): Pick<DataSeriesDatum, 'y0' | 'y1' | 'mark' | 'datum' | 'initialY0' | 'initialY1'> {
  const mark = markSizeAccessor === undefined
    ? null
    : castToNumber(
      getAccessorValue(datum, markSizeAccessor),
      nonNumericValues
    );
  const y1 = castToNumber(datum[yAccessor], nonNumericValues);
  const y0 = y0Accessor ? castToNumber(datum[y0Accessor as keyof typeof datum], nonNumericValues) : null;
  return { y1, datum, y0, mark, initialY0: y0, initialY1: y1 };
}

function castToNumber(value: any, nonNumericValues: any[]): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const num = Number(value);

  if (isNaN(num)) {
    nonNumericValues.push(value);
    return null;
  }
  return num;
}

/** @internal */
export function getFormattedDataseries(
  specs: YBasicSeriesSpec[],
  availableDataSeries: Map<SpecId, DataSeries[]>,
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
    stackMode?: StackMode;
  }[] = [];
  const nonStackedFormattedDataSeries: {
    groupId: GroupId;
    dataSeries: DataSeries[];
    counts: DataSeriesCounts;
  }[] = [];

  specsByGroupIdsEntries.forEach(([groupId, groupSpecs]) => {
    const { stackMode } = groupSpecs;
    // format stacked data series
    const stackedDataSeries = getDataSeriesBySpecGroup(groupSpecs.stacked, availableDataSeries);
    const fittedDataSeries = applyFitFunctionToDataSeries(stackedDataSeries.dataSeries, seriesSpecs, xScaleType);
    const fittedAndStackedDataSeries = formatStackedDataSeriesValues(
      fittedDataSeries,
      xValues,
      stackMode,
    );

    stackedFormattedDataSeries.push({
      groupId,
      counts: stackedDataSeries.counts,
      dataSeries: fittedAndStackedDataSeries,
      stackMode,
    });

    // format non stacked data series
    const nonStackedDataSeries = getDataSeriesBySpecGroup(groupSpecs.nonStacked, availableDataSeries);
    nonStackedFormattedDataSeries.push({
      groupId,
      counts: nonStackedDataSeries.counts,
      dataSeries: applyFitFunctionToDataSeries(nonStackedDataSeries.dataSeries, seriesSpecs, xScaleType),
    });
  });
  return {
    stacked: stackedFormattedDataSeries.filter((ds) => ds.dataSeries.length > 0),
    nonStacked: nonStackedFormattedDataSeries.filter((ds) => ds.dataSeries.length > 0),
  };
}

function getDataSeriesBySpecGroup(
  seriesSpecs: YBasicSeriesSpec[],
  dataSeries: Map<SpecId, DataSeries[]>,
): {
  dataSeries: DataSeries[];
  counts: DataSeriesCounts;
} {
  return seriesSpecs.reduce<{
    dataSeries: DataSeries[];
    counts: DataSeriesCounts;
  }>((acc, { id, seriesType }) => {
    const ds = dataSeries.get(id);
    if (!ds) {
      return acc;
    }

    acc.dataSeries.push(...ds);
    acc.counts[seriesType] += ds.length;
    return acc;
  }, {
    dataSeries: [],
    counts: {
      [SeriesTypes.Bar]: 0,
      [SeriesTypes.Area]: 0,
      [SeriesTypes.Line]: 0,
      [SeriesTypes.Bubble]: 0,
    },
  });
}

/**
 *
 * @param seriesSpecs the map for all the series spec
 * @param deselectedDataSeries the array of deselected/hidden data series
 * @internal
 */
export function getDataSeriesBySpecId(
  seriesSpecs: BasicSeriesSpec[],
  deselectedDataSeries: SeriesIdentifier[] = [],
): {
  dataSeriesBySpecId: Map<SpecId, DataSeries[]>;
  seriesCollection: Map<SeriesKey, SeriesCollectionValue>;
  xValues: Set<string | number>;
  fallbackScale?: ScaleType;
} {
  const dataSeriesBySpecId = new Map<SpecId, DataSeries[]>();
  const seriesCollection = new Map<SeriesKey, SeriesCollectionValue>();

  // the unique set of values along the x axis
  const globalXValues: Set<string | number> = new Set();

  let isNumberArray = true;
  let isOrdinalScale = false;
  // eslint-disable-next-line no-restricted-syntax
  for (const spec of seriesSpecs) {
    // check scale type and cast to Ordinal if we found at least one series
    // with Ordinal Scale
    if (spec.xScaleType === ScaleType.Ordinal) {
      isOrdinalScale = true;
    }

    const { dataSeries, xValues } = splitSeriesDataByAccessors(spec);

    // filter deleselected dataseries
    let filteredDataSeries: DataSeries[] = [...dataSeries.values()];
    if (deselectedDataSeries.length > 0) {
      filteredDataSeries = filteredDataSeries.filter(
        ({ key }) =>
          !deselectedDataSeries.some(
            ({ key: deselectedKey }) => key === deselectedKey
          )
      );
    }

    dataSeriesBySpecId.set(spec.id, filteredDataSeries);

    const banded = spec.y0Accessors && spec.y0Accessors.length > 0;

    dataSeries.forEach((series, key) => {
      const { data, ...seriesIdentifier } = series;
      seriesCollection.set(key, {
        banded,
        specSortIndex: spec.sortIndex,
        seriesIdentifier,
      });
    });

    // check the nature of the x values. If all of them are numbers
    // we can use a continuous scale, if not we should use an ordinal scale.
    // The xValue is already casted to be a valid number or a string
    // eslint-disable-next-line no-restricted-syntax
    for (const xValue of xValues) {
      if (isNumberArray && typeof xValue !== 'number') {
        isNumberArray = false;
      }
      globalXValues.add(xValue);
    }
  }
  return {
    dataSeriesBySpecId,
    seriesCollection,
    // keep the user order for ordinal scales
    xValues: (isOrdinalScale || !isNumberArray) ? globalXValues : new Set([...globalXValues]
      .sort((a, b) => {
        if (typeof a === 'string' || typeof b === 'string') {
          return 0;
        }
        return a - b;
      })),
    fallbackScale: (!isOrdinalScale && !isNumberArray) ? ScaleType.Ordinal : undefined,
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
 * @internal
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
  const nameKeys = spec && spec.yAccessors.length > 1 ? seriesIdentifier.seriesKeys : seriesIdentifier.seriesKeys.slice(0, -1);

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

/** @internal */
export function getSortedDataSeriesColorsValuesMap(
  seriesCollection: Map<SeriesKey, SeriesCollectionValue>,
): Map<SeriesKey, SeriesCollectionValue> {
  const seriesColorsArray = [...seriesCollection];
  seriesColorsArray.sort(([, specA], [, specB]) => getSortIndex(specA, seriesCollection.size) - getSortIndex(specB, seriesCollection.size));

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
 * @internal
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
