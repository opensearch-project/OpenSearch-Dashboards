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

import { shuffle } from 'lodash';

import { FullDataSeriesDatum, WithIndex } from '../../chart_types/xy_chart/utils/fit_function';
import { DataSeries, DataSeriesDatum, XYChartSeriesIdentifier } from '../../chart_types/xy_chart/utils/series';
import { SeriesType } from '../../specs';
import { mergePartial } from '../../utils/common';
import { MockSeriesSpec } from '../specs';
import { getRandomNumberGenerator } from '../utils';
import { fitFunctionData } from './data';

const rng = getRandomNumberGenerator();

interface DomainRange {
  min?: number;
  max?: number;
  fractionDigits?: number;
  inclusive?: boolean;
}

/** @internal */
export class MockDataSeries {
  private static readonly base: DataSeries = {
    specId: 'spec1',
    seriesKeys: ['spec1'],
    yAccessor: 'y',
    splitAccessors: new Map(),
    key: 'spec1',
    data: [],
    groupId: 'group1',
    seriesType: SeriesType.Bar,
    stackMode: undefined,
    spec: MockSeriesSpec.bar(),
    isStacked: false,
    insertIndex: 0,
    isFiltered: false,
  };

  static default(partial?: Partial<DataSeries>) {
    return mergePartial<DataSeries>(MockDataSeries.base, partial, { mergeOptionalPartialValues: true });
  }

  static fitFunction(
    // eslint-disable-next-line unicorn/no-object-as-default-parameter
    options: { shuffle?: boolean; ordinal?: boolean } = { shuffle: true, ordinal: false },
  ): DataSeries {
    const ordinalData = options.ordinal
      ? fitFunctionData.map((d) => ({ ...d, x: String.fromCharCode(97 + (d.x as number)) }))
      : fitFunctionData;
    const data = options.shuffle && !options.ordinal ? shuffle(ordinalData) : ordinalData;

    return {
      ...MockDataSeries.base,
      data,
    };
  }

  static fromData(data: DataSeries['data'], seriesIdentifier?: Partial<XYChartSeriesIdentifier>): DataSeries {
    return {
      ...MockDataSeries.base,
      ...seriesIdentifier,
      data,
    };
  }

  static random(
    options: { count?: number; x?: DomainRange; y?: DomainRange; mark?: DomainRange },
    includeMarks = false,
  ): DataSeries {
    const data = new Array(options?.count ?? 10).fill(0).map(() => MockDataSeriesDatum.random(options, includeMarks));
    return {
      ...MockDataSeries.base,
      data,
    };
  }

  static empty(): DataSeries[] {
    return [];
  }
}

/** @internal */
export class MockDataSeriesDatum {
  private static readonly base: DataSeriesDatum = {
    x: 1,
    y1: 1,
    y0: null,
    mark: null,
    initialY1: null,
    initialY0: null,
    datum: undefined,
  };

  static default(partial?: Partial<DataSeriesDatum>): DataSeriesDatum {
    const merged = mergePartial<DataSeriesDatum>(MockDataSeriesDatum.base, partial, {
      mergeOptionalPartialValues: true,
    });
    if (merged.initialY1 === null) {
      merged.initialY1 = merged.y1;
    }

    if (merged.initialY0 === null) {
      merged.initialY0 = merged.y0;
    }
    return merged;
  }

  /**
   * Fill datum with minimal values, default missing required values to `null`
   */
  static simple({
    x,
    y1 = null,
    y0 = null,
    mark = null,
    filled,
  }: Partial<DataSeriesDatum> & Pick<DataSeriesDatum, 'x'>): DataSeriesDatum {
    return {
      x,
      y1,
      y0,
      mark,
      initialY1: y1,
      initialY0: y0,
      datum: {
        x,
        y1,
        y0,
      },
      ...(filled && filled),
    };
  }

  /**
   * returns "full" datum with minimal values, default missing required values to `null`
   *
   * "full" - means x and y1 values are `non-nullable`
   */
  static full({
    fittingIndex = 0,
    ...datum
  }: Partial<WithIndex<FullDataSeriesDatum>> &
    Pick<WithIndex<FullDataSeriesDatum>, 'x' | 'y1'>): WithIndex<FullDataSeriesDatum> {
    return {
      ...(MockDataSeriesDatum.simple(datum) as WithIndex<FullDataSeriesDatum>),
      fittingIndex,
    };
  }

  static ordinal(partial?: Partial<DataSeriesDatum>): DataSeriesDatum {
    return mergePartial<DataSeriesDatum>(
      {
        ...MockDataSeriesDatum.base,
        x: 'a',
      },
      partial,
      { mergeOptionalPartialValues: true },
    );
  }

  /**
   * Psuedo-random values between a specified domain
   *
   * @param options
   */
  static random(
    options: { x?: DomainRange; y?: DomainRange; mark?: DomainRange },
    includeMark = false,
  ): DataSeriesDatum {
    return MockDataSeriesDatum.simple({
      x: rng(options?.x?.min, options?.x?.max, options.x?.fractionDigits, options.x?.inclusive),
      y1: rng(options?.y?.min, options?.y?.max, options.y?.fractionDigits, options.y?.inclusive),
      ...(includeMark && {
        mark: rng(options?.mark?.min, options?.mark?.max, options.mark?.fractionDigits, options.mark?.inclusive),
      }),
    });
  }
}
