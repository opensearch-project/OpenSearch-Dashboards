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

import { connect } from 'react-redux';
import { GlobalChartState } from '../../../../state/chart_state';
import { isInitialized } from '../../../../state/selectors/is_initialized';
import { partitionGeometries } from '../../state/selectors/geometries';
import { getPickedShapes } from '../../state/selectors/picked_shapes';
import { getChartContainerDimensionsSelector } from '../../../../state/selectors/get_chart_container_dimensions';
import { HighlighterComponent, HighlighterProps, DEFAULT_PROPS } from './highlighter';

const hoverMapStateToProps = (state: GlobalChartState): HighlighterProps => {
  if (!isInitialized(state)) {
    return DEFAULT_PROPS;
  }

  const { chartId } = state;
  const {
    outerRadius,
    diskCenter,
    config: { partitionLayout },
  } = partitionGeometries(state);

  const geometries = getPickedShapes(state);
  const canvasDimension = getChartContainerDimensionsSelector(state);
  return {
    chartId,
    initialized: true,
    renderAsOverlay: true,
    canvasDimension,
    diskCenter,
    outerRadius,
    geometries,
    partitionLayout,
  };
};

/**
 * Partition chart highlighter from mouse hover events
 * @internal
 */
export const HighlighterFromHover = connect(hoverMapStateToProps)(HighlighterComponent);
