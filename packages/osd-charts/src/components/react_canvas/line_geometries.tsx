import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { animated, Spring } from 'react-spring/renderprops-konva';
import { LegendItem } from '../../lib/series/legend';
import { getGeometryStyle, LineGeometry, PointGeometry } from '../../lib/series/rendering';
import { LineSeriesStyle, SharedGeometryStyle } from '../../lib/themes/theme';

interface LineGeometriesDataProps {
  animated?: boolean;
  lines: LineGeometry[];
  style: LineSeriesStyle;
  sharedStyle: SharedGeometryStyle;
  highlightedLegendItem: LegendItem | null;
}
interface LineGeometriesDataState {
  overPoint?: PointGeometry;
}
export class LineGeometries extends React.PureComponent<
  LineGeometriesDataProps,
  LineGeometriesDataState
> {
  static defaultProps: Partial<LineGeometriesDataProps> = {
    animated: false,
  };
  private readonly barSeriesRef: React.RefObject<KonvaGroup> = React.createRef();
  constructor(props: LineGeometriesDataProps) {
    super(props);
    this.barSeriesRef = React.createRef();
    this.state = {
      overPoint: undefined,
    };
  }

  render() {
    const { point, line } = this.props.style;

    return (
      <Group ref={this.barSeriesRef} key={'bar_series'}>
        {line.visible && this.renderLineGeoms()}
        {point.visible && this.renderLinePoints()}
      </Group>
    );
  }

  private renderLinePoints = (): JSX.Element[] => {
    const { lines } = this.props;
    return lines.reduce(
      (acc, glyph, i) => {
        const { points } = glyph;
        return [...acc, ...this.renderPoints(points, i)];
      },
      [] as JSX.Element[],
    );
  }

  private renderPoints = (linePoints: PointGeometry[], i: number): JSX.Element[] => {
    const { radius, stroke, strokeWidth, opacity } = this.props.style.point;

    return linePoints.map((areaPoint, index) => {
      const { x, y, color, transform } = areaPoint;
      if (this.props.animated) {
        return (
          <Group key={`line-point-group-${i}-${index}`} x={transform.x}>
            <Spring native from={{ y }} to={{ y }}>
              {(props: { y: number }) => (
                <animated.Circle
                  key={`line-point-${index}`}
                  x={x}
                  y={y}
                  radius={radius}
                  strokeWidth={strokeWidth}
                  strokeEnabled={strokeWidth !== 0}
                  stroke={color}
                  fill={'white'}
                  opacity={opacity}
                  strokeHitEnabled={false}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              )}
            </Spring>
          </Group>
        );
      } else {
        return (
          <Circle
            key={`line-point-${i}-${index}`}
            x={transform.x + x}
            y={y}
            radius={radius}
            strokeWidth={strokeWidth}
            stroke={stroke}
            fill={color}
            opacity={opacity}
            strokeHitEnabled={false}
            listening={false}
            perfectDrawEnabled={false}
          />
        );
      }
    });
  }

  private renderLineGeoms = (): JSX.Element[] => {
    const { style, lines, sharedStyle } = this.props;
    const { strokeWidth } = style.line;
    return lines.map((glyph, i) => {
      const { line, color, transform, geometryId } = glyph;

      const geometryStyle = getGeometryStyle(
        geometryId,
        this.props.highlightedLegendItem,
        sharedStyle,
      );

      if (this.props.animated) {
        return (
          <Group key={i} x={transform.x}>
            <Spring native reset from={{ opacity: 0 }} to={{ opacity: 1 }}>
              {(props: { opacity: number }) => (
                <animated.Path
                  opacity={props.opacity}
                  key="line"
                  data={line}
                  strokeWidth={strokeWidth}
                  stroke={color}
                  listening={false}
                  lineCap="round"
                  lineJoin="round"
                  {...geometryStyle}
                />
              )}
            </Spring>
          </Group>
        );
      } else {
        return (
          <Path
            key={i}
            data={line}
            strokeWidth={strokeWidth}
            stroke={color}
            listening={false}
            lineCap="round"
            lineJoin="round"
            {...geometryStyle}
          />
        );
      }
    });
  }
}
