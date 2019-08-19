import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { LegendItem } from '../../chart_types/xy_chart/legend/legend';
import {
  getGeometryStyle,
  LineGeometry,
  PointGeometry,
  getGeometryIdKey,
} from '../../chart_types/xy_chart/rendering/rendering';
import { SharedGeometryStyle } from '../../utils/themes/theme';
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
      </Group>
    );
  }

  private renderPoints = (
    linePoints: PointGeometry[],
    lineKey: string,
    pointStyleProps: PointStyleProps,
  ): JSX.Element[] => {
    const linePointsElements: JSX.Element[] = [];
    linePoints.forEach((linePoint, pointIndex) => {
      const { x, y, transform } = linePoint;
      const key = `line-point-${lineKey}-${pointIndex}`;
      const pointProps = buildPointRenderProps(transform.x + x, y, pointStyleProps);
      linePointsElements.push(<Circle {...pointProps} key={key} />);
    });
    return linePointsElements;
  };

  private renderLineGeoms = (): JSX.Element[] => {
    const { lines, sharedStyle } = this.props;

    return lines.reduce<JSX.Element[]>((acc, glyph) => {
      const { seriesLineStyle, seriesPointStyle, geometryId } = glyph;
      const key = getGeometryIdKey(geometryId, 'line-');
      if (seriesLineStyle.visible) {
        acc.push(this.getLineToRender(glyph, sharedStyle, key));
      }

      if (seriesPointStyle.visible) {
        acc.push(...this.getPointToRender(glyph, sharedStyle, key));
      }
      return acc;
    }, []);
  };

  getLineToRender(glyph: LineGeometry, sharedStyle: SharedGeometryStyle, key: string) {
    const { line, color, transform, geometryId, seriesLineStyle } = glyph;
    const customOpacity = seriesLineStyle ? seriesLineStyle.opacity : undefined;
    const geometryStyle = getGeometryStyle(geometryId, this.props.highlightedLegendItem, sharedStyle, customOpacity);
    const lineProps = buildLineRenderProps(transform.x, line, color, seriesLineStyle, geometryStyle);
    return <Path {...lineProps} key={key} />;
  }

  getPointToRender(glyph: LineGeometry, sharedStyle: SharedGeometryStyle, key: string) {
    const { points, color, geometryId, seriesPointStyle } = glyph;
    const customOpacity = seriesPointStyle ? seriesPointStyle.opacity : undefined;
    const geometryStyle = getGeometryStyle(geometryId, this.props.highlightedLegendItem, sharedStyle, customOpacity);
    const pointStyleProps = buildPointStyleProps(color, seriesPointStyle, geometryStyle);
    return this.renderPoints(points, key, pointStyleProps);
  }
}
