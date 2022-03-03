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
import { geometries } from './geometries';
import { getHeatmapSpecSelector } from './get_heatmap_spec';
import { isBrushingSelector } from './is_brushing';

/**
 * @internal
 */
export const getHighlightedDataSelector = createCustomCachedSelector(
  [getHeatmapSpecSelector, isBrushingSelector],
  (spec, isBrushing) => {
    if (!spec.highlightedData || isBrushing) {
      return null;
    }
    return spec.highlightedData;
  },
);

/**
 * Returns rect position of the highlighted selection.
 * @internal
 */
export const getHighlightedAreaSelector = createCustomCachedSelector(
  [geometries, getHeatmapSpecSelector, isBrushingSelector],
  (geoms, spec, isBrushing) => {
    if (!spec.highlightedData || isBrushing) {
      return null;
    }
    return geoms.pickHighlightedArea(spec.highlightedData.x, spec.highlightedData.y);
  },
);
