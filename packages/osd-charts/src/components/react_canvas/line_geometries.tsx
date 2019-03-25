import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { animated, Spring } from 'react-spring/renderprops-konva';
import { LegendItem } from '../../lib/series/legend';
import { getGeometryStyle, LineGeometry, PointGeometry } from '../../lib/series/rendering';
import { LineSeriesStyle, SharedGeometryStyle } from '../../lib/themes/theme';
import { GlobalKonvaElementProps } from './globals';

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
    const { radius, strokeWidth, opacity } = this.props.style.point;

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
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeEnabled={strokeWidth !== 0}
                  fill={'white'}
                  opacity={opacity}
                  {...GlobalKonvaElementProps}
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
            stroke={color}
            strokeWidth={strokeWidth}
            strokeEnabled={strokeWidth !== 0}
            fill={'white'}
            opacity={opacity}
            {...GlobalKonvaElementProps}
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
                  key={`line-${i}`}
                  data={line}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  opacity={props.opacity}
                  lineCap="round"
                  lineJoin="round"
                  {...geometryStyle}
                  {...GlobalKonvaElementProps}
                />
              )}
            </Spring>
          </Group>
        );
      } else {
        return (
          <Path
            key={`line-${i}`}
            data={line}
            stroke={color}
            strokeWidth={strokeWidth}
            lineCap="round"
            lineJoin="round"
            {...geometryStyle}
            {...GlobalKonvaElementProps}
          />
        );
      }
    });
  }
}
