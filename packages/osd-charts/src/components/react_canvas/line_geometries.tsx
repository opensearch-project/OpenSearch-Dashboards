import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { animated, Spring } from 'react-spring/renderprops-konva.cjs';
import { LegendItem } from '../../lib/series/legend';
import { getGeometryStyle, LineGeometry, PointGeometry } from '../../lib/series/rendering';
import { LineSeriesStyle, SharedGeometryStyle } from '../../lib/themes/theme';
import {
  buildLinePointProps,
  buildLineProps,
  buildPointStyleProps,
  PointStyleProps,
} from './utils/rendering_props_utils';

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
        {this.renderLineGeoms(line.visible)}
        {this.renderLinePoints(point.visible)}
      </Group>
    );
  }

  private renderLinePoints = (themeIsVisible: boolean): JSX.Element[] => {
    const { lines } = this.props;
    return lines.reduce(
      (acc, glyph, i) => {
        const { points, seriesPointStyle } = glyph;

        const isVisible = seriesPointStyle ? seriesPointStyle.visible : themeIsVisible;
        if (!isVisible) {
          return acc;
        }

        const { radius, strokeWidth, opacity } = this.props.style.point;
        const pointStyleProps = buildPointStyleProps({
          radius,
          strokeWidth,
          opacity,
          seriesPointStyle,
        });

        return [...acc, ...this.renderPoints(points, i, pointStyleProps)];
      },
      [] as JSX.Element[],
    );
  }

  private renderPoints = (
    linePoints: PointGeometry[],
    lineIndex: number,
    pointStyleProps: PointStyleProps,
  ): JSX.Element[] => {
    const linePointsElements: JSX.Element[] = [];
    linePoints.forEach((linePoint, pointIndex) => {
      const { x, y, color, transform } = linePoint;

      if (this.props.animated) {
        linePointsElements.push(
          <Group key={`line-point-group-${lineIndex}-${pointIndex}`} x={transform.x}>
            <Spring native from={{ y }} to={{ y }}>
              {(props: { y: number }) => {
                const pointProps = buildLinePointProps({
                  lineIndex,
                  pointIndex,
                  x,
                  y,
                  color,
                  pointStyleProps,
                });
                return <animated.Circle {...pointProps} />;
              }}
            </Spring>
          </Group>,
        );
      } else {
        const pointProps = buildLinePointProps({
          lineIndex,
          pointIndex,
          x: transform.x + x,
          y,
          color,
          pointStyleProps,
        });
        linePointsElements.push(<Circle {...pointProps} />);
      }
    });
    return linePointsElements;
  }

  private renderLineGeoms = (themeIsVisible: boolean): JSX.Element[] => {
    const { style, lines, sharedStyle } = this.props;
    const { strokeWidth } = style.line;

    const lineElements: JSX.Element[] = [];

    lines.forEach((glyph, index) => {
      const { line, color, transform, geometryId, seriesLineStyle } = glyph;
      const isVisible = seriesLineStyle ? seriesLineStyle.visible : themeIsVisible;

      if (!isVisible) {
        return;
      }

      const customOpacity = seriesLineStyle ? seriesLineStyle.opacity : undefined;

      const geometryStyle = getGeometryStyle(
        geometryId,
        this.props.highlightedLegendItem,
        sharedStyle,
        customOpacity,
      );

      if (this.props.animated) {
        lineElements.push(
          <Group key={index} x={transform.x}>
            <Spring native reset from={{ opacity: 0 }} to={{ opacity: 1 }}>
              {(props: { opacity: number }) => {
                const lineProps = buildLineProps({
                  index,
                  xTransform: 0,
                  linePath: line,
                  color,
                  strokeWidth,
                  geometryStyle,
                  seriesLineStyle,
                });
                return <animated.Path {...lineProps} />;
              }}
            </Spring>
          </Group>,
        );
      } else {
        const lineProps = buildLineProps({
          index,
          xTransform: transform.x,
          linePath: line,
          color,
          strokeWidth,
          geometryStyle,
          seriesLineStyle,
        });
        lineElements.push(<Path {...lineProps} />);
      }
    });

    return lineElements;
  }
}
