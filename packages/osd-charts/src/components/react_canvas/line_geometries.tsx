import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { animated, Spring } from 'react-spring/renderprops-konva.cjs';
import { LegendItem } from '../../lib/series/legend';
import { getGeometryStyle, LineGeometry, PointGeometry } from '../../lib/series/rendering';
import { SharedGeometryStyle } from '../../lib/themes/theme';
import {
  buildLineRenderProps,
  buildPointStyleProps,
  PointStyleProps,
  buildPointRenderProps,
} from './utils/rendering_props_utils';

interface LineGeometriesDataProps {
  animated?: boolean;
  lines: LineGeometry[];
  sharedStyle: SharedGeometryStyle;
  highlightedLegendItem: LegendItem | null;
}
interface LineGeometriesDataState {
  overPoint?: PointGeometry;
}
export class LineGeometries extends React.PureComponent<LineGeometriesDataProps, LineGeometriesDataState> {
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
    return (
      <Group ref={this.barSeriesRef} key={'bar_series'}>
        {this.renderLineGeoms()}
        {this.renderLinePoints()}
      </Group>
    );
  }

  private renderLinePoints = (): JSX.Element[] => {
    const { lines } = this.props;
    return lines.reduce(
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
    linePoints: PointGeometry[],
    lineIndex: number,
    pointStyleProps: PointStyleProps,
  ): JSX.Element[] => {
    const linePointsElements: JSX.Element[] = [];
    linePoints.forEach((linePoint, pointIndex) => {
      const { x, y, transform } = linePoint;
      const key = `line-point-${lineIndex}-${pointIndex}`;
      if (this.props.animated) {
        linePointsElements.push(
          <Group key={`line-point-group-${lineIndex}-${pointIndex}`} x={transform.x}>
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
        linePointsElements.push(<Circle {...pointProps} key={key} />);
      }
    });
    return linePointsElements;
  };

  private renderLineGeoms = (): JSX.Element[] => {
    const { lines, sharedStyle } = this.props;

    const lineElements: JSX.Element[] = [];

    lines.forEach((glyph, index) => {
      const { line, color, transform, geometryId, seriesLineStyle } = glyph;

      if (!seriesLineStyle.visible) {
        return;
      }
      const key = `line-${index}`;
      const customOpacity = seriesLineStyle ? seriesLineStyle.opacity : undefined;
      const geometryStyle = getGeometryStyle(geometryId, this.props.highlightedLegendItem, sharedStyle, customOpacity);

      if (this.props.animated) {
        lineElements.push(
          <Group key={index} x={transform.x}>
            <Spring native reset from={{ opacity: 0 }} to={{ opacity: 1 }}>
              {() => {
                const lineProps = buildLineRenderProps(0, line, color, seriesLineStyle, geometryStyle);
                return <animated.Path {...lineProps} key={key} />;
              }}
            </Spring>
          </Group>,
        );
      } else {
        const lineProps = buildLineRenderProps(transform.x, line, color, seriesLineStyle, geometryStyle);
        lineElements.push(<Path {...lineProps} key={key} />);
      }
    });

    return lineElements;
  };
}
