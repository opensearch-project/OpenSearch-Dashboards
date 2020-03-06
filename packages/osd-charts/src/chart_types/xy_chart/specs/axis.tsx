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

import { AxisSpec, DEFAULT_GLOBAL_ID } from '../utils/specs';
import { Position } from '../../../utils/commons';
import { ChartTypes } from '../../../chart_types';
import { specComponentFactory, getConnect } from '../../../state/spec_factory';
import { SpecTypes } from '../../../specs/settings';

const defaultProps = {
  chartType: ChartTypes.XYAxis,
  specType: SpecTypes.Axis,
  groupId: DEFAULT_GLOBAL_ID,
  hide: false,
  showOverlappingTicks: false,
  showOverlappingLabels: false,
  position: Position.Left,
  tickSize: 10,
  tickPadding: 10,
  tickFormat: (tick: any) => `${tick}`,
  tickLabelRotation: 0,
};

type SpecRequired = Pick<AxisSpec, 'id'>;
type SpecOptionals = Partial<Omit<AxisSpec, 'chartType' | 'specType' | 'seriesType' | 'id'>>;

export const Axis: React.FunctionComponent<SpecRequired & SpecOptionals> = getConnect()(
  specComponentFactory<
    AxisSpec,
    | 'groupId'
    | 'hide'
    | 'showOverlappingTicks'
    | 'showOverlappingLabels'
    | 'position'
    | 'tickSize'
    | 'tickPadding'
    | 'tickFormat'
    | 'tickLabelRotation'
  >(defaultProps),
);
