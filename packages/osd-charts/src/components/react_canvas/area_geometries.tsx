import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { animated, Spring } from 'react-spring/renderprops-konva.cjs';
import { LegendItem } from '../../lib/series/legend';
import { AreaGeometry, getGeometryStyle, PointGeometry } from '../../lib/series/rendering';
import { AreaSeriesStyle, SharedGeometryStyle } from '../../lib/themes/theme';
import {
  buildAreaLineProps,
  buildAreaPointProps,
  buildAreaProps,
} from './utils/rendering_props_utils';

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
    const { radius, strokeWidth, opacity } = this.props.style.point;

    return areaPoints.map((areaPoint, pointIndex) => {
      const { x, y, color, transform } = areaPoint;
      if (this.props.animated) {
        return (
          <Group key={`area-point-group-${areaIndex}-${pointIndex}`} x={transform.x}>
            <Spring native from={{ y }} to={{ y }}>
              {(props: { y: number }) => {
                const pointProps = buildAreaPointProps({
                  areaIndex,
                  pointIndex,
                  x,
                  y,
                  radius,
                  strokeWidth,
                  color,
                  opacity,
                });
                return <animated.Circle {...pointProps} />;
              }}
            </Spring>
          </Group>
        );
      } else {
        const pointProps = buildAreaPointProps({
          areaIndex,
          pointIndex,
          x: transform.x + x,
          y,
          radius,
          strokeWidth,
          color,
          opacity,
        });
        return <Circle {...pointProps} />;
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
              {(props: { area: string }) => {
                const areaProps = buildAreaProps({
                  index: i,
                  areaPath: props.area,
                  color,
                  opacity,
                });
                return <animated.Path {...areaProps} />;
              }}
            </Spring>
          </Group>
        );
      } else {
        const areaProps = buildAreaProps({
          index: i,
          areaPath: area,
          color,
          opacity,
        });
        return <Path {...areaProps} />;
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
              {(props: { line: string }) => {
                const lineProps = buildAreaLineProps({
                  index: i,
                  linePath: props.line,
                  color,
                  strokeWidth,
                  geometryStyle,
                });
                return <animated.Path {...lineProps} />;
              }}
            </Spring>
          </Group>
        );
      } else {
        const lineProps = buildAreaLineProps({
          index: i,
          linePath: line,
          color,
          strokeWidth,
          geometryStyle,
        });
        return <Path {...lineProps} />;
      }
    });
  }
}
