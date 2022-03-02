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

import { createCustomCachedSelector } from '../../../../state/create_selector';
import { Position, safeFormat } from '../../../../utils/common';
import { isHorizontalAxis, isVerticalAxis } from '../../utils/axis_type_utils';
import { AxisGeometry } from '../../utils/axis_utils';
import { hasSMDomain } from '../../utils/panel';
import { PerPanelMap, getPerPanelMap } from '../../utils/panel_utils';
import { computeAxesGeometriesSelector } from './compute_axes_geometries';
import { computeSmallMultipleScalesSelector, SmallMultipleScales } from './compute_small_multiple_scales';
import { getSmallMultiplesIndexOrderSelector, SmallMultiplesGroupBy } from './get_specs';

/** @internal */
export type PerPanelAxisGeoms = {
  axesGeoms: AxisGeometry[];
} & PerPanelMap;

const getPanelTitle = (
  isVertical: boolean,
  verticalValue: any,
  horizontalValue: any,
  groupBy?: SmallMultiplesGroupBy,
): string => {
  const formatter = isVertical ? groupBy?.vertical?.format : groupBy?.horizontal?.format;
  const value = isVertical ? `${verticalValue}` : `${horizontalValue}`;

  return safeFormat(value, formatter);
};

const isPrimaryColumnFn = ({ horizontal: { domain } }: SmallMultipleScales) => (
  position: Position,
  horizontalValue: any,
) => isVerticalAxis(position) && domain[0] === horizontalValue;

const isPrimaryRowFn = ({ vertical: { domain } }: SmallMultipleScales) => (position: Position, verticalValue: any) =>
  isHorizontalAxis(position) && domain[0] === verticalValue;

/** @internal */
export const computePerPanelAxesGeomsSelector = createCustomCachedSelector(
  [computeAxesGeometriesSelector, computeSmallMultipleScalesSelector, getSmallMultiplesIndexOrderSelector],
  (axesGeoms, scales, groupBySpec): Array<PerPanelAxisGeoms> => {
    const { horizontal, vertical } = scales;
    const isPrimaryColumn = isPrimaryColumnFn(scales);
    const isPrimaryRow = isPrimaryRowFn(scales);

    return getPerPanelMap(scales, (_, h, v) => ({
      axesGeoms: axesGeoms.map((geom) => {
        const {
          axis: { position },
        } = geom;
        const isVertical = isVerticalAxis(position);
        const usePanelTitle = isVertical ? hasSMDomain(vertical) : hasSMDomain(horizontal);
        const panelTitle = usePanelTitle ? getPanelTitle(isVertical, v, h, groupBySpec) : undefined;
        const secondary = !isPrimaryColumn(position, h) && !isPrimaryRow(position, v);

        return {
          ...geom,
          axis: {
            ...geom.axis,
            panelTitle,
            secondary,
          },
        };
      }),
    }));
  },
);
