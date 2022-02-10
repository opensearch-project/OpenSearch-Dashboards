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

import { connect } from 'react-redux';

import { GlobalChartState } from '../../../../state/chart_state';
import { getChartContainerDimensionsSelector } from '../../../../state/selectors/get_chart_container_dimensions';
import { getInternalIsInitializedSelector, InitStatus } from '../../../../state/selectors/get_internal_is_intialized';
import { partitionDrilldownFocus, partitionMultiGeometries } from '../../state/selectors/geometries';
import { legendHoverHighlightNodes } from '../../state/selectors/get_highlighted_shapes';
import { HighlighterComponent, HighlighterProps, DEFAULT_PROPS, highlightSetMapper } from './highlighter';

const legendMapStateToProps = (state: GlobalChartState): HighlighterProps => {
  if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
    return DEFAULT_PROPS;
  }

  const { chartId } = state;

  const geometries = legendHoverHighlightNodes(state);
  const geometriesFoci = partitionDrilldownFocus(state);
  const canvasDimension = getChartContainerDimensionsSelector(state);
  const multiGeometries = partitionMultiGeometries(state);
  const highlightMapper = highlightSetMapper(geometries, geometriesFoci);
  const highlightSets = multiGeometries.map(highlightMapper);

  return {
    chartId,
    initialized: true,
    renderAsOverlay: false,
    canvasDimension,
    highlightSets,
  };
};

/**
 * Partition chart highlighter from legend events
 * @internal
 */
export const HighlighterFromLegend = connect(legendMapStateToProps)(HighlighterComponent);
