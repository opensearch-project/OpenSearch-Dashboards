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

import { shuffle } from 'lodash';

import { mergePartial } from '../../utils/commons';
import {
  DataSeries,
  DataSeriesDatum,
  RawDataSeries,
  RawDataSeriesDatum,
} from '../../chart_types/xy_chart/utils/series';
import { fitFunctionData } from './data';
import { FullDataSeriesDatum, WithIndex } from '../../chart_types/xy_chart/utils/fit_function';

/** @internal */
export class MockDataSeries {
  private static readonly base: DataSeries = {
    specId: 'spec1',
    seriesKeys: ['spec1'],
    yAccessor: 'y',
    splitAccessors: new Map(),
    key: 'spec1',
    data: [],
  };

  static default(partial?: Partial<DataSeries>) {
    return mergePartial<DataSeries>(MockDataSeries.base, partial, { mergeOptionalPartialValues: true });
  }

  static fitFunction(
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

  static withData(data: DataSeries['data']): DataSeries {
    return {
      ...MockDataSeries.base,
      data,
    };
  }
}

/** @internal */
export class MockRawDataSeries {
  private static readonly base: RawDataSeries = {
    specId: 'spec1',
    seriesKeys: ['spec1'],
    yAccessor: 'y',
    splitAccessors: new Map(),
    key: 'spec1',
    data: [],
  };

  static default(partial?: Partial<RawDataSeries>) {
    return mergePartial<RawDataSeries>(MockRawDataSeries.base, partial);
  }

  static fitFunction(
    options: { shuffle?: boolean; ordinal?: boolean } = { shuffle: true, ordinal: false },
  ): RawDataSeries {
    const rawData = fitFunctionData.map(({ initialY0, initialY1, filled, ...datum }) => datum);
    const ordinalData = options.ordinal
      ? rawData.map((d) => ({ ...d, x: String.fromCharCode(97 + (d.x as number)) }))
      : rawData;
    const data = options.shuffle && !options.ordinal ? shuffle(ordinalData) : ordinalData;

    return {
      ...MockRawDataSeries.base,
      data,
    };
  }

  static withData(data: RawDataSeries['data']): RawDataSeries {
    return {
      ...MockRawDataSeries.base,
      data,
    };
  }
}

/** @internal */
export class MockDataSeriesDatum {
  private static readonly base: DataSeriesDatum = {
    x: 1,
    y1: 1,
    y0: 1,
    initialY1: 1,
    initialY0: 1,
    datum: {},
  };

  static default(partial?: Partial<DataSeriesDatum>): DataSeriesDatum {
    return mergePartial<DataSeriesDatum>(MockDataSeriesDatum.base, partial, { mergeOptionalPartialValues: true });
  }

  /**
   * Fill datum with minimal values, default missing required values to `null`
   */
  static simple({
    x,
    y1 = null,
    y0 = null,
    filled,
  }: Partial<DataSeriesDatum> & Pick<DataSeriesDatum, 'x'>): DataSeriesDatum {
    return {
      x,
      y1,
      y0,
      initialY1: y1,
      initialY0: y0,
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
  }: Partial<WithIndex<FullDataSeriesDatum>> & Pick<WithIndex<FullDataSeriesDatum>, 'x' | 'y1'>): WithIndex<
    FullDataSeriesDatum
  > {
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
}

/** @internal */
export class MockRawDataSeriesDatum {
  private static readonly base: RawDataSeriesDatum = {
    x: 1,
    y1: 1,
    y0: 1,
    datum: {},
  };

  static default(partial?: Partial<RawDataSeriesDatum>): RawDataSeriesDatum {
    return mergePartial<RawDataSeriesDatum>(MockRawDataSeriesDatum.base, partial);
  }

  /**
   * Fill raw datum with minimal values, default missing required values to `null`
   */
  static simple({
    x,
    y1 = null,
    y0 = null,
  }: Partial<RawDataSeriesDatum> & Pick<RawDataSeriesDatum, 'x'>): RawDataSeriesDatum {
    return {
      x,
      y1,
      y0,
    };
  }

  static ordinal(partial?: Partial<RawDataSeriesDatum>): RawDataSeriesDatum {
    return mergePartial<RawDataSeriesDatum>(
      {
        ...MockRawDataSeriesDatum.base,
        x: 'a',
      },
      partial,
    );
  }
}
