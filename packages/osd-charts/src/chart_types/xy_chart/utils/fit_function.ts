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
 * under the License. */

import { DeepNonNullable } from 'utility-types';

import { Fit, FitConfig } from './specs';
import { DataSeries, DataSeriesDatum } from './series';
import { datumXSortPredicate } from './stacked_series_utils';
import { ScaleType } from '../../../scales';

/**
 * Fit type that requires previous and/or next `non-nullable` values
 */
export type BoundingFit = Exclude<Fit, 'none' | 'explicit'>;

/**
 * `DataSeriesDatum` with non-`null` value for `x` and `y1`
 */
export type FullDataSeriesDatum = Omit<DataSeriesDatum, 'y1' | 'x'> &
  DeepNonNullable<Pick<DataSeriesDatum, 'y1' | 'x'>>;

/**
 * Embellishes `FullDataSeriesDatum` with `fittingIndex` for ordinal scales
 */
export type WithIndex<T> = T & { fittingIndex: number };

/**
 * Returns `[x, y1]` values for a given datum with `fittingIndex`
 */
export const getXYValues = ({ x, y1, fittingIndex }: WithIndex<FullDataSeriesDatum>): [number, number] => {
  return [typeof x === 'string' ? fittingIndex : x, y1];
};

/** @internal */
export const getValue = (
  current: DataSeriesDatum,
  currentIndex: number,
  previous: WithIndex<FullDataSeriesDatum> | null,
  next: WithIndex<FullDataSeriesDatum> | null,
  type: BoundingFit,
  endValue?: number | 'nearest',
): DataSeriesDatum => {
  if (previous !== null && type === Fit.Carry) {
    return {
      ...current,
      filled: {
        y1: previous.y1,
      },
    };
  } else if (next !== null && type === Fit.Lookahead) {
    return {
      ...current,
      filled: {
        y1: next.y1,
      },
    };
  } else if (previous !== null && next !== null) {
    if (type === Fit.Average) {
      return {
        ...current,
        filled: {
          y1: (previous.y1 + next.y1) / 2,
        },
      };
    } else if (current.x !== null && previous.x !== null && next.x !== null) {
      const [x1, y1] = getXYValues(previous);
      const [x2, y2] = getXYValues(next);
      const currentX = typeof current.x === 'string' ? currentIndex : current.x;

      if (type === Fit.Nearest) {
        const x1Delta = Math.abs(currentX - x1);
        const x2Delta = Math.abs(currentX - x2);
        return {
          ...current,
          filled: {
            y1: x1Delta > x2Delta ? y2 : y1,
          },
        };
      } else if (type === Fit.Linear) {
        return {
          ...current,
          filled: {
            // simple linear interpolation function
            y1: previous.y1 + (currentX - x1) * ((y2 - y1) / (x2 - x1)),
          },
        };
      }
    }
  } else if ((previous !== null || next !== null) && (type === Fit.Nearest || endValue === 'nearest')) {
    return {
      ...current,
      filled: {
        y1: previous !== null ? previous.y1 : next!.y1,
      },
    };
  }

  if (endValue === undefined || typeof endValue === 'string') {
    return current;
  }

  // No matching fit - should only fall here on end conditions
  return {
    ...current,
    filled: {
      y1: endValue,
    },
  };
};

/** @internal */
export const parseConfig = (config?: Exclude<Fit, 'explicit'> | FitConfig): FitConfig => {
  if (!config) {
    return {
      type: Fit.None,
    };
  }

  if (typeof config === 'string') {
    return {
      type: config,
    };
  }

  if (config.type === Fit.Explicit && config.value === undefined) {
    // Using explicit fit function requires a value
    return {
      type: Fit.None,
    };
  }

  return {
    type: config.type,
    value: config.type === Fit.Explicit ? config.value : undefined,
    endValue: config.endValue,
  };
};

/** @internal */
export const fitFunction = (
  dataSeries: DataSeries,
  fitConfig: Exclude<Fit, 'explicit'> | FitConfig,
  xScaleType: ScaleType,
  sorted = false,
): DataSeries => {
  const { type, value, endValue } = parseConfig(fitConfig);

  if (type === Fit.None) {
    return dataSeries;
  }

  const { data } = dataSeries;

  if (type === Fit.Zero) {
    return {
      ...dataSeries,
      data: data.map((datum) => ({
        ...datum,
        filled: {
          y1: datum.y1 === null ? 0 : undefined,
        },
      })),
    };
  }

  if (type === Fit.Explicit) {
    if (value === undefined) {
      return dataSeries;
    }

    return {
      ...dataSeries,
      data: data.map((datum) => ({
        ...datum,
        filled: {
          y1: datum.y1 === null ? value : undefined,
        },
      })),
    };
  }

  const sortedData =
    sorted || xScaleType === ScaleType.Ordinal ? data : data.slice().sort(datumXSortPredicate(xScaleType));
  const newData: DataSeriesDatum[] = [];
  let previousNonNullDatum: WithIndex<FullDataSeriesDatum> | null = null;
  let nextNonNullDatum: WithIndex<FullDataSeriesDatum> | null = null;

  for (let i = 0; i < sortedData.length; i++) {
    let j = i;
    const current = sortedData[i];

    if (
      current.y1 === null &&
      nextNonNullDatum === null &&
      (type === Fit.Lookahead ||
        type === Fit.Nearest ||
        type === Fit.Average ||
        type === Fit.Linear ||
        endValue === 'nearest')
    ) {
      // Forward lookahead to get next non-null value
      for (j = i + 1; j < sortedData.length; j++) {
        const value = sortedData[j];

        if (value.y1 !== null && value.x !== null) {
          nextNonNullDatum = {
            ...(value as FullDataSeriesDatum),
            fittingIndex: j,
          };
          break;
        }
      }
    }

    const newValue =
      current.y1 === null ? getValue(current, i, previousNonNullDatum, nextNonNullDatum, type, endValue) : current;

    newData[i] = newValue;

    if (current.y1 !== null && current.x !== null) {
      previousNonNullDatum = {
        ...(current as FullDataSeriesDatum),
        fittingIndex: i,
      };
    }

    if (nextNonNullDatum !== null && nextNonNullDatum.x <= current.x) {
      nextNonNullDatum = null;
    }
  }

  return {
    ...dataSeries,
    data: newData,
  };
};
