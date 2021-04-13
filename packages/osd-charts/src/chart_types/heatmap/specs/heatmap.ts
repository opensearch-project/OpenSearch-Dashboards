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

import React from 'react';

import { ChartType } from '../..';
import { Predicate } from '../../../common/predicate';
import { ScaleType } from '../../../scales/constants';
import { SeriesScales, Spec } from '../../../specs';
import { SpecType } from '../../../specs/constants';
import { getConnect, specComponentFactory } from '../../../state/spec_factory';
import { Accessor, AccessorFn } from '../../../utils/accessor';
import { Color, Datum, RecursivePartial } from '../../../utils/common';
import { config } from '../layout/config/config';
import { Config } from '../layout/types/config_types';
import { X_SCALE_DEFAULT } from './scale_defaults';

const defaultProps = {
  chartType: ChartType.Heatmap,
  specType: SpecType.Series,
  data: [],
  colors: ['red', 'yellow', 'green'],
  colorScale: ScaleType.Linear,
  xAccessor: ({ x }: { x: string | number }) => x,
  yAccessor: ({ y }: { y: string | number }) => y,
  xScaleType: X_SCALE_DEFAULT.type,
  valueAccessor: ({ value }: { value: string | number }) => value,
  valueFormatter: (value: number) => `${value}`,
  xSortPredicate: Predicate.AlphaAsc,
  ySortPredicate: Predicate.AlphaAsc,
  config,
};

/** @public */
export type HeatmapScaleType =
  | typeof ScaleType.Linear
  | typeof ScaleType.Quantile
  | typeof ScaleType.Quantize
  | typeof ScaleType.Threshold;

/** @alpha */
export interface HeatmapSpec extends Spec {
  specType: typeof SpecType.Series;
  chartType: typeof ChartType.Heatmap;
  data: Datum[];
  colorScale?: HeatmapScaleType;
  ranges?: number[] | [number, number];
  colors: Color[];
  xAccessor: Accessor | AccessorFn;
  yAccessor: Accessor | AccessorFn;
  valueAccessor: Accessor | AccessorFn;
  valueFormatter: (value: number) => string;
  xSortPredicate: Predicate;
  ySortPredicate: Predicate;
  xScaleType: SeriesScales['xScaleType'];
  config: RecursivePartial<Config>;
  highlightedData?: { x: Array<string | number>; y: Array<string | number> };
  name?: string;
}

/** @alpha */
export const Heatmap: React.FunctionComponent<
  Pick<HeatmapSpec, 'id' | 'data'> & Partial<Omit<HeatmapSpec, 'chartType' | 'specType' | 'id' | 'data'>>
> = getConnect()(
  specComponentFactory<
    HeatmapSpec,
    | 'xAccessor'
    | 'yAccessor'
    | 'valueAccessor'
    | 'colors'
    | 'data'
    | 'ySortPredicate'
    | 'xSortPredicate'
    | 'valueFormatter'
    | 'config'
    | 'xScaleType'
  >(defaultProps),
);
