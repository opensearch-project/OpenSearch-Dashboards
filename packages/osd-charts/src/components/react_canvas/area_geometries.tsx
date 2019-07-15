import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { animated, Spring } from 'react-spring/renderprops-konva.cjs';
import { LegendItem } from '../../lib/series/legend';
import { AreaGeometry, getGeometryStyle, PointGeometry } from '../../lib/series/rendering';
import { SharedGeometryStyle } from '../../lib/themes/theme';
import {
  buildAreaRenderProps,
  buildPointStyleProps,
  buildPointRenderProps,
  PointStyleProps,
  buildLineRenderProps,
} from './utils/rendering_props_utils';

interface AreaGeometriesDataProps {
  animated?: boolean;
  areas: AreaGeometry[];
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
    return (
      <Group ref={this.barSeriesRef} key={'bar_series'}>
        {this.renderAreaGeoms()}
        {this.renderAreaLines()}
        {this.renderAreaPoints()}
      </Group>
    );
  }
  private renderAreaPoints = (): JSX.Element[] => {
    const { areas } = this.props;
    return areas.reduce(
      (acc, glyph, i) => {
        const { points, seriesPointStyle, color } = glyph;

        if (!seriesPointStyle.visible) {
          return acc;
        }

        const pointStyleProps = buildPointStyleProps(color, seriesPointStyle);

        return [...acc, ...this.renderPoints(points, i, pointStyleProps)];
      },
      [] as JSX.Element[],
    );
  };
  private renderPoints = (
    areaPoints: PointGeometry[],
    areaIndex: number,
    pointStyleProps: PointStyleProps,
  ): JSX.Element[] => {
    const areaPointElements: JSX.Element[] = [];

    areaPoints.forEach((areaPoint, pointIndex) => {
      const { x, y, transform } = areaPoint;
      const key = `area-point-${areaIndex}-${pointIndex}`;

      if (this.props.animated) {
        areaPointElements.push(
          <Group key={`area-point-group-${areaIndex}-${pointIndex}`} x={transform.x}>
            <Spring native from={{ y }} to={{ y }}>
              {() => {
                const pointProps = buildPointRenderProps(x, y, pointStyleProps);
                return <animated.Circle {...pointProps} key={key} />;
              }}
            </Spring>
          </Group>,
        );
      } else {
        const pointProps = buildPointRenderProps(transform.x + x, y, pointStyleProps);
        areaPointElements.push(<Circle {...pointProps} key={key} />);
      }
    });
    return areaPointElements;
  };

  private renderAreaGeoms = (): JSX.Element[] => {
    const { areas, sharedStyle } = this.props;
    const areasToRender: JSX.Element[] = [];

    areas.forEach((glyph, i) => {
      const { area, color, transform, geometryId, seriesAreaStyle } = glyph;
      if (!seriesAreaStyle.visible) {
        return;
      }
      const customOpacity = seriesAreaStyle ? seriesAreaStyle.opacity : undefined;
      const geometryStyle = getGeometryStyle(geometryId, this.props.highlightedLegendItem, sharedStyle, customOpacity);
      const key = `area-${i}`;
      if (this.props.animated) {
        areasToRender.push(
          <Group key={`area-group-${i}`} x={transform.x}>
            <Spring native from={{ area }} to={{ area }}>
              {(props: { area: string }) => {
                const areaProps = buildAreaRenderProps(0, props.area, color, seriesAreaStyle, geometryStyle);
                return <animated.Path {...areaProps} key={key} />;
              }}
            </Spring>
          </Group>,
        );
      } else {
        const areaProps = buildAreaRenderProps(transform.x, area, color, seriesAreaStyle, geometryStyle);
        areasToRender.push(<Path {...areaProps} key={key} />);
      }
    });
    return areasToRender;
  };
  private renderAreaLines = (): JSX.Element[] => {
    const { areas, sharedStyle } = this.props;
    const linesToRender: JSX.Element[] = [];
    areas.forEach((glyph, areaIndex) => {
      const { lines, color, geometryId, transform, seriesAreaLineStyle } = glyph;
      if (!seriesAreaLineStyle.visible) {
        return;
      }

      const geometryStyle = getGeometryStyle(
        geometryId,
        this.props.highlightedLegendItem,
        sharedStyle,
        seriesAreaLineStyle.opacity,
      );

      lines.forEach((linePath, lineIndex) => {
        const key = `area-${areaIndex}-line-${lineIndex}`;
        const lineProps = buildLineRenderProps(transform.x, linePath, color, seriesAreaLineStyle, geometryStyle);
        linesToRender.push(<Path {...lineProps} key={key} />);
      });
    });
    return linesToRender;
  };
}
