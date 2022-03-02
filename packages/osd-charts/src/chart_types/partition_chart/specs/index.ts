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
import { Pixels } from '../../../common/geometry';
import { Spec } from '../../../specs';
import { SpecType } from '../../../specs/constants'; // kept as unshortened import on separate line otherwise import circularity emerges
import { getConnect, specComponentFactory } from '../../../state/spec_factory';
import { IndexedAccessorFn } from '../../../utils/accessor';
import {
  Datum,
  LabelAccessor,
  RecursivePartial,
  ShowAccessor,
  ValueAccessor,
  ValueFormatter,
} from '../../../utils/common';
import { config, percentFormatter } from '../layout/config';
import { Config, FillFontSizeRange, FillLabelConfig } from '../layout/types/config_types';
import { NodeColorAccessor, ShapeTreeNode, ValueGetter } from '../layout/types/viewmodel_types';
import { AGGREGATE_KEY, NodeSorter, PrimitiveValue } from '../layout/utils/group_by_rollup';

interface ExtendedFillLabelConfig extends FillLabelConfig, FillFontSizeRange {}

/**
 * Specification for a given layer in the partition chart
 * @public
 */
export interface Layer {
  groupByRollup: IndexedAccessorFn;
  sortPredicate?: NodeSorter | null;
  nodeLabel?: LabelAccessor;
  fillLabel?: Partial<ExtendedFillLabelConfig>;
  showAccessor?: ShowAccessor;
  shape?: { fillColor: string | NodeColorAccessor };
}

const defaultProps = {
  chartType: ChartType.Partition,
  specType: SpecType.Series,
  config,
  valueAccessor: (d: Datum) => (typeof d === 'number' ? d : 0),
  valueGetter: (n: ShapeTreeNode): number => n[AGGREGATE_KEY],
  valueFormatter: (d: number): string => String(d),
  percentFormatter,
  topGroove: 20,
  smallMultiples: null,
  layers: [
    {
      groupByRollup: (d: Datum, i: number) => i,
      nodeLabel: (d: PrimitiveValue) => String(d),
      showAccessor: () => true,
      fillLabel: {},
    },
  ],
};

/**
 * Specifies the partition chart
 * @public
 */
export interface PartitionSpec extends Spec {
  specType: typeof SpecType.Series;
  chartType: typeof ChartType.Partition;
  config: RecursivePartial<Config>;
  data: Datum[];
  valueAccessor: ValueAccessor;
  valueFormatter: ValueFormatter;
  valueGetter: ValueGetter;
  percentFormatter: ValueFormatter;
  topGroove: Pixels;
  smallMultiples: string | null;
  layers: Layer[];
}

type SpecRequiredProps = Pick<PartitionSpec, 'id' | 'data'>;
type SpecOptionalProps = Partial<Omit<PartitionSpec, 'chartType' | 'specType' | 'id' | 'data'>>;

/** @public */
export const Partition: React.FunctionComponent<SpecRequiredProps & SpecOptionalProps> = getConnect()(
  specComponentFactory<
    PartitionSpec,
    | 'valueAccessor'
    | 'valueGetter'
    | 'valueFormatter'
    | 'layers'
    | 'config'
    | 'percentFormatter'
    | 'topGroove'
    | 'smallMultiples'
  >(defaultProps),
);
