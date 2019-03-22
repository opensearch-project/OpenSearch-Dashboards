import { inject, observer } from 'mobx-react';
import React from 'react';
import { ChartStore } from '../state/chart_state';

interface HighlighterProps {
  chartStore?: ChartStore;
}

class HighlighterComponent extends React.Component<HighlighterProps> {
  static displayName = 'Highlighter';

  render() {
    const {
      highlightedGeometries,
      chartTransform,
      chartDimensions,
      chartRotation,
    } = this.props.chartStore!;
    const left = chartDimensions.left + chartTransform.x;
    const top = chartDimensions.top + chartTransform.y;
    return (
      <svg className="elasticChartsHighlighter">
        <g transform={`translate(${left}, ${top}) rotate(${chartRotation})`}>
          {highlightedGeometries.map((highlightedGeometry, i) => {
            const {
              color,
              geom: { x, y, width, height, isPoint },
            } = highlightedGeometry;
            if (isPoint) {
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={width}
                  stroke={color}
                  strokeWidth={4}
                  fill="transparent"
                />
              );
            }
            return (
              <rect key={i} x={x} y={y} width={width} height={height} fill="white" opacity={0.4} />
            );
          })}
        </g>
      </svg>
    );
  }
}

export const Highlighter = inject('chartStore')(observer(HighlighterComponent));
