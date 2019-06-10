import { inject, observer } from 'mobx-react';
import React from 'react';
import { isPointGeometry } from '../lib/series/rendering';
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
      <svg className="echHighlighter">
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
                fill="white"
                opacity={0.4}
              />
            );
          })}
        </g>
      </svg>
    );
  }
}

export const Highlighter = inject('chartStore')(observer(HighlighterComponent));
