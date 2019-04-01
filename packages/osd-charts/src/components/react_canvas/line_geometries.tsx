import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { animated, Spring } from 'react-spring/renderprops-konva.cjs';
import { LegendItem } from '../../lib/series/legend';
import { getGeometryStyle, LineGeometry, PointGeometry } from '../../lib/series/rendering';
import { LineSeriesStyle, SharedGeometryStyle } from '../../lib/themes/theme';
import { buildLinePointProps, buildLineProps } from './utils/rendering_props_utils';

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

  private renderPoints = (linePoints: PointGeometry[], lineIndex: number): JSX.Element[] => {
    const { radius, strokeWidth, opacity } = this.props.style.point;

    return linePoints.map((linePoint, pointIndex) => {
      const { x, y, color, transform } = linePoint;
      if (this.props.animated) {
        return (
          <Group key={`line-point-group-${lineIndex}-${pointIndex}`} x={transform.x}>
            <Spring native from={{ y }} to={{ y }}>
              {(props: { y: number }) => {
                const pointProps = buildLinePointProps({
                  lineIndex,
                  pointIndex,
                  x,
                  y,
                  radius,
                  color,
                  strokeWidth,
                  opacity,
                });
                return <animated.Circle {...pointProps} />;
              }}
            </Spring>
          </Group>
        );
      } else {
        const pointProps = buildLinePointProps({
          lineIndex,
          pointIndex,
          x: transform.x + x,
          y,
          radius,
          color,
          strokeWidth,
          opacity,
        });
        return <Circle {...pointProps} />;
      }
    });
  }

  private renderLineGeoms = (): JSX.Element[] => {
    const { style, lines, sharedStyle } = this.props;
    const { strokeWidth } = style.line;
    return lines.map((glyph, index) => {
      const { line, color, transform, geometryId } = glyph;

      const geometryStyle = getGeometryStyle(
        geometryId,
        this.props.highlightedLegendItem,
        sharedStyle,
      );

      if (this.props.animated) {
        return (
          <Group key={index} x={transform.x}>
            <Spring native reset from={{ opacity: 0 }} to={{ opacity: 1 }}>
              {(props: { opacity: number }) => {
                const lineProps = buildLineProps({
                  index,
                  linePath: line,
                  color,
                  strokeWidth,
                  opacity: props.opacity,
                  geometryStyle,
                });
                return <animated.Path {...lineProps} />;
              }}
            </Spring>
          </Group>
        );
      } else {
        const lineProps = buildLineProps({
          index,
          linePath: line,
          color,
          strokeWidth,
          opacity: 1,
          geometryStyle,
        });
        return <Path {...lineProps} />;
      }
    });
  }
}
