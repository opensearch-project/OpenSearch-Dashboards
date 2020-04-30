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

import React from 'react';
import { connect } from 'react-redux';
import { isPointGeometry, IndexedGeometry } from '../../../../utils/geometry';
import { GlobalChartState } from '../../../../state/chart_state';
import { computeChartTransformSelector } from '../../state/selectors/compute_chart_transform';
import { getHighlightedGeomsSelector } from '../../state/selectors/get_tooltip_values_highlighted_geoms';
import { Dimensions } from '../../../../utils/dimensions';
import { Rotation } from '../../../../utils/commons';
import { Transform } from '../../state/utils';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { computeChartDimensionsSelector } from '../../state/selectors/compute_chart_dimensions';
import { DEFAULT_HIGHLIGHT_PADDING } from '../../rendering/rendering';
import { getInternalIsInitializedSelector } from '../../../../state/selectors/get_internal_is_intialized';

interface HighlighterProps {
  initialized: boolean;
  chartId: string;
  highlightedGeometries: IndexedGeometry[];
  chartTransform: Transform;
  chartDimensions: Dimensions;
  chartRotation: Rotation;
}

class HighlighterComponent extends React.Component<HighlighterProps> {
  static displayName = 'Highlighter';

  render() {
    const { highlightedGeometries, chartTransform, chartDimensions, chartRotation, chartId } = this.props;
    const left = chartDimensions.left + chartTransform.x;
    const top = chartDimensions.top + chartTransform.y;
    const clipWidth = [90, -90].includes(chartRotation) ? chartDimensions.height : chartDimensions.width;
    const clipHeight = [90, -90].includes(chartRotation) ? chartDimensions.width : chartDimensions.height;
    const clipPathId = `echHighlighterClipPath__${chartId}`;
    return (
      <svg className="echHighlighter">
        <defs>
          <clipPath id={clipPathId}>
            <rect x="0" y="0" width={clipWidth} height={clipHeight} />
          </clipPath>
        </defs>
        <g transform={`translate(${left}, ${top}) rotate(${chartRotation})`}>
          {highlightedGeometries.map((geom, i) => {
            const { color, x, y } = geom;
            if (isPointGeometry(geom)) {
              return (
                <circle
                  key={i}
                  cx={x + geom.transform.x}
                  cy={y}
                  r={geom.radius + DEFAULT_HIGHLIGHT_PADDING}
                  stroke={color}
                  strokeWidth={4}
                  fill="transparent"
                  clipPath={geom.value.mark !== null ? `url(#${clipPathId})` : undefined}
                />
              );
            }
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={geom.width}
                height={geom.height}
                className="echHighlighterOverlay__fill"
                clipPath={`url(#${clipPathId})`}
              />
            );
          })}
        </g>
      </svg>
    );
  }
}

const mapStateToProps = (state: GlobalChartState): HighlighterProps => {
  if (!getInternalIsInitializedSelector(state)) {
    return {
      initialized: false,
      chartId: state.chartId,
      highlightedGeometries: [],
      chartTransform: {
        x: 0,
        y: 0,
        rotate: 0,
      },
      chartDimensions: { top: 0, left: 0, width: 0, height: 0 },
      chartRotation: 0,
    };
  }
  return {
    initialized: true,
    chartId: state.chartId,
    highlightedGeometries: getHighlightedGeomsSelector(state),
    chartTransform: computeChartTransformSelector(state),
    chartDimensions: computeChartDimensionsSelector(state).chartDimensions,
    chartRotation: getChartRotationSelector(state),
  };
};

/** @internal */
export const Highlighter = connect(mapStateToProps)(HighlighterComponent);
