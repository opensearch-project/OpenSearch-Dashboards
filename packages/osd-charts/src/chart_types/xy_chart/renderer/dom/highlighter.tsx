import React from 'react';
import { connect } from 'react-redux';
import { isPointGeometry, IndexedGeometry } from '../../../../utils/geometry';
import { GlobalChartState } from '../../../../state/chart_state';
import { isInitialized } from '../../../../state/selectors/is_initialized';
import { computeChartTransformSelector } from '../../state/selectors/compute_chart_transform';
import { getHighlightedGeomsSelector } from '../../state/selectors/get_tooltip_values_highlighted_geoms';
import { Dimensions } from '../../../../utils/dimensions';
import { Rotation } from '../../../../utils/commons';
import { Transform } from '../../state/utils';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { computeChartDimensionsSelector } from '../../state/selectors/compute_chart_dimensions';

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
                  r={geom.radius}
                  stroke={color}
                  strokeWidth={4}
                  fill="transparent"
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
                className="echHighlighter__rect"
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
  if (!isInitialized(state)) {
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

export const Highlighter = connect(mapStateToProps)(HighlighterComponent);
