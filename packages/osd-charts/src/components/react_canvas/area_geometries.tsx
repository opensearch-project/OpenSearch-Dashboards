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
  buildPointStyleProps,
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
export class AreaGeometries extends React.PureComponent<AreaGeometriesDataProps, AreaGeometriesDataState> {
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
        {this.renderAreaGeoms(area.visible)}
        {this.renderAreaLines(line.visible)}
        {this.renderAreaPoints(point.visible)}
      </Group>
    );
  }
  private renderAreaPoints = (themeIsVisible: boolean): JSX.Element[] => {
    const { areas } = this.props;
    return areas.reduce(
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
  };
  private renderPoints = (areaPoints: PointGeometry[], areaIndex: number, pointStyleProps: any): JSX.Element[] => {
    const areaPointElements: JSX.Element[] = [];
    areaPoints.forEach((areaPoint, pointIndex) => {
      const { x, y, color, transform } = areaPoint;

      if (this.props.animated) {
        areaPointElements.push(
          <Group key={`area-point-group-${areaIndex}-${pointIndex}`} x={transform.x}>
            <Spring native from={{ y }} to={{ y }}>
              {() => {
                const pointProps = buildAreaPointProps({
                  areaIndex,
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
        const pointProps = buildAreaPointProps({
          areaIndex,
          pointIndex,
          x: transform.x + x,
          y,
          color,
          pointStyleProps,
        });
        areaPointElements.push(<Circle {...pointProps} />);
      }
    });
    return areaPointElements;
  };

  private renderAreaGeoms = (themeIsVisible: boolean): JSX.Element[] => {
    const { areas } = this.props;
    const { opacity } = this.props.style.area;
    const areasToRender: JSX.Element[] = [];

    areas.forEach((glyph, i) => {
      const { area, color, transform, seriesAreaStyle } = glyph;
      const isVisible = seriesAreaStyle ? seriesAreaStyle.visible : themeIsVisible;
      if (!isVisible) {
        return;
      }

      if (this.props.animated) {
        areasToRender.push(
          <Group key={`area-group-${i}`} x={transform.x}>
            <Spring native from={{ area }} to={{ area }}>
              {(props: { area: string }) => {
                const areaProps = buildAreaProps({
                  index: i,
                  areaPath: props.area,
                  xTransform: 0,
                  color,
                  opacity,
                  seriesAreaStyle,
                });
                return <animated.Path {...areaProps} />;
              }}
            </Spring>
          </Group>,
        );
      } else {
        const areaProps = buildAreaProps({
          index: i,
          areaPath: area,
          xTransform: transform.x,
          color,
          opacity,
          seriesAreaStyle,
        });
        areasToRender.push(<Path {...areaProps} />);
      }
    });
    return areasToRender;
  };
  private renderAreaLines = (themeIsVisible: boolean): JSX.Element[] => {
    const { areas, sharedStyle } = this.props;
    const { strokeWidth } = this.props.style.line;
    const linesToRender: JSX.Element[] = [];
    areas.forEach((glyph, areaIndex) => {
      const { lines, color, geometryId, transform, seriesAreaLineStyle } = glyph;
      const isVisible = seriesAreaLineStyle ? seriesAreaLineStyle.visible : themeIsVisible;
      if (!isVisible) {
        return;
      }

      const customOpacity = seriesAreaLineStyle ? seriesAreaLineStyle.opacity : undefined;

      const geometryStyle = getGeometryStyle(geometryId, this.props.highlightedLegendItem, sharedStyle, customOpacity);

      lines.forEach((linePath, lineIndex) => {
        const lineProps = buildAreaLineProps({
          areaIndex,
          lineIndex,
          xTransform: transform.x,
          linePath,
          color,
          strokeWidth,
          geometryStyle,
          seriesAreaLineStyle,
        });
        linesToRender.push(<Path {...lineProps} />);
      });
    });
    return linesToRender;
    // if (this.props.animated) {
    //   return (
    //     <Group key={`area-line-group-${i}`} x={transform.x}>
    //       <Spring native from={{ line }} to={{ line }}>
    //         {(props: { line: string }) => {
    //           const lineProps = buildAreaLineProps({
    //             index: i,
    //             linePath: props.line,
    //             color,
    //             strokeWidth,
    //             geometryStyle,
    //           });
    //           return <animated.Path {...lineProps} />;
    //         }}
    //       </Spring>
    //     </Group>
    //   );
    // } else {

    // }
  };
}
