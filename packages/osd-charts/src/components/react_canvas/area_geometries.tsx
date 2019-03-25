import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { animated, Spring } from 'react-spring/renderprops-konva';
import { LegendItem } from '../../lib/series/legend';
import { AreaGeometry, getGeometryStyle, PointGeometry } from '../../lib/series/rendering';
import { AreaSeriesStyle, SharedGeometryStyle } from '../../lib/themes/theme';
import { GlobalKonvaElementProps } from './globals';

interface AreaGeometriesDataProps {
  animated?: boolean;
  areas: AreaGeometry[];
  style: AreaSeriesStyle;
  sharedStyle: SharedGeometryStyle;
  highlightedLegendItem: LegendItem | null;
}
interface AreaGeometriesDataState {
  overPoint?: PointGeometry;
}
export class AreaGeometries extends React.PureComponent<
  AreaGeometriesDataProps,
  AreaGeometriesDataState
> {
  static defaultProps: Partial<AreaGeometriesDataProps> = {
    animated: false,
  };
  private readonly barSeriesRef: React.RefObject<KonvaGroup> = React.createRef();
  constructor(props: AreaGeometriesDataProps) {
    super(props);
    this.barSeriesRef = React.createRef();
    this.state = {
      overPoint: undefined,
    };
  }
  render() {
    const { point, area, line } = this.props.style;

    return (
      <Group ref={this.barSeriesRef} key={'bar_series'}>
        {area.visible && this.renderAreaGeoms()}
        {line.visible && this.renderAreaLine()}
        {point.visible && this.renderAreaPoints()}
      </Group>
    );
  }
  private renderAreaPoints = (): JSX.Element[] => {
    const { areas } = this.props;
    return areas.reduce(
      (acc, glyph, i) => {
        const { points } = glyph;
        return [...acc, ...this.renderPoints(points, i)];
      },
      [] as JSX.Element[],
    );
  }
  private renderPoints = (areaPoints: PointGeometry[], areaIndex: number): JSX.Element[] => {
    const { radius, stroke, strokeWidth, opacity } = this.props.style.point;

    return areaPoints.map((areaPoint, index) => {
      const { x, y, color, transform } = areaPoint;
      if (this.props.animated) {
        return (
          <Group key={`area-point-group-${areaIndex}-${index}`} x={transform.x}>
            <Spring native from={{ y }} to={{ y }}>
              {(props: { y: number }) => (
                <animated.Circle
                  key={`area-point-${areaIndex}-${index}`}
                  x={x}
                  y={y}
                  radius={radius}
                  strokeWidth={strokeWidth}
                  strokeEnabled={strokeWidth !== 0}
                  stroke={color}
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
            key={`area-point-${areaIndex}-${index}`}
            x={transform.x + x}
            y={y}
            radius={radius}
            strokeWidth={strokeWidth}
            stroke={stroke}
            fill={color}
            opacity={opacity}
            {...GlobalKonvaElementProps}
          />
        );
      }
    });
  }

  private renderAreaGeoms = (): JSX.Element[] => {
    const { areas } = this.props;
    const { opacity } = this.props.style.area;

    return areas.map((glyph, i) => {
      const { area, color, transform } = glyph;

      if (this.props.animated) {
        return (
          <Group key={`area-group-${i}`} x={transform.x}>
            <Spring native from={{ area }} to={{ area }}>
              {(props: { area: string }) => (
                <animated.Path
                  key={`area-${i}`}
                  data={props.area}
                  fill={color}
                  lineCap="round"
                  lineJoin="round"
                  opacity={opacity}
                  {...GlobalKonvaElementProps}
                />
              )}
            </Spring>
          </Group>
        );
      } else {
        return (
          <Path
            key={`area-${i}`}
            data={area}
            fill={color}
            opacity={opacity}
            lineCap="round"
            lineJoin="round"
            {...GlobalKonvaElementProps}
          />
        );
      }
    });
  }
  private renderAreaLine = (): JSX.Element[] => {
    const { areas, sharedStyle } = this.props;
    const { strokeWidth } = this.props.style.line;

    return areas.map((glyph, i) => {
      const { line, color, transform, geometryId } = glyph;

      const geometryStyle = getGeometryStyle(
        geometryId,
        this.props.highlightedLegendItem,
        sharedStyle,
      );

      if (this.props.animated) {
        return (
          <Group key={`area-line-group-${i}`} x={transform.x}>
            <Spring native from={{ line }} to={{ line }}>
              {(props: { line: string }) => (
                <animated.Path
                  key={`area-line-${i}`}
                  data={props.line}
                  stroke={color}
                  strokeWidth={strokeWidth}
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
            key={`area-line-${i}`}
            data={line}
            fill={color}
            {...geometryStyle}
            {...GlobalKonvaElementProps}
          />
        );
      }
    });
  }
}
