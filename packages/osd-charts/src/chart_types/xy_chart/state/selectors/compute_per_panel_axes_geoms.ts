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

import createCachedSelector from 're-reselect';

import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { isHorizontalAxis, isVerticalAxis } from '../../utils/axis_type_utils';
import { AxisGeometry } from '../../utils/axis_utils';
import { PerPanelMap, getPerPanelMap } from '../../utils/panel_utils';
import { computeAxesGeometriesSelector } from './compute_axes_geometries';
import { computeSmallMultipleScalesSelector } from './compute_small_multiple_scales';

/** @internal */
export type PerPanelAxisGeoms = {
  axesGeoms: AxisGeometry[];
} & PerPanelMap;

/** @internal */
export const computePerPanelAxesGeomsSelector = createCachedSelector(
  [computeAxesGeometriesSelector, computeSmallMultipleScalesSelector],
  (axesGeoms, scales): Array<PerPanelAxisGeoms> => {
    const { horizontal, vertical } = scales;
    return getPerPanelMap(scales, (anchor, h, v) => {
      const lastLine = horizontal.domain.includes(h) && vertical.domain[vertical.domain.length - 1] === v;
      const firstColumn = horizontal.domain[0] === h;
      if (firstColumn || lastLine) {
        return {
          axesGeoms: axesGeoms
            .filter(({ axis: { position } }) => {
              if (firstColumn && lastLine) {
                return true;
              }
              return firstColumn ? isVerticalAxis(position) : isHorizontalAxis(position);
            })
            .map((geom) => {
              const {
                axis: { position, title },
              } = geom;
              const panelTitle = isVerticalAxis(position) ? `${v}` : `${h}`;
              const useSmallMultiplePanelTitles = isVerticalAxis(position)
                ? vertical.domain.length > 1
                : horizontal.domain.length > 1;
              return {
                ...geom,
                axis: {
                  ...geom.axis,
                  title: useSmallMultiplePanelTitles ? panelTitle : title,
                },
              };
            }),
        };
      }

      return null;
    });
  },
)(getChartIdSelector);
