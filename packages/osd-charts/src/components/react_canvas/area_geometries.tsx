import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { LegendItem } from '../../chart_types/xy_chart/legend/legend';
import {
  AreaGeometry,
  getGeometryStyle,
  PointGeometry,
  getGeometryIdKey,
  GeometryId,
} from '../../chart_types/xy_chart/rendering/rendering';
import { SharedGeometryStyle } from '../../utils/themes/theme';
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
      </Group>
    );
  }
  private renderAreaGeoms = (): JSX.Element[] => {
    const { sharedStyle, highlightedLegendItem, areas } = this.props;
    return areas.reduce<JSX.Element[]>((acc, glyph, i) => {
      const { seriesAreaLineStyle, seriesAreaStyle, seriesPointStyle, geometryId } = glyph;
      if (seriesAreaStyle.visible) {
        acc.push(this.renderArea(glyph, sharedStyle, highlightedLegendItem));
      }
      if (seriesAreaLineStyle.visible) {
        acc.push(...this.renderAreaLines(glyph, i, sharedStyle, highlightedLegendItem));
      }
      if (seriesPointStyle.visible) {
        const geometryStyle = getGeometryStyle(geometryId, this.props.highlightedLegendItem, sharedStyle);
        const pointStyleProps = buildPointStyleProps(glyph.color, seriesPointStyle, geometryStyle);
        acc.push(...this.renderPoints(glyph.points, i, pointStyleProps, glyph.geometryId));
      }
      return acc;
    }, []);
  };
  private renderArea = (
    glyph: AreaGeometry,
    sharedStyle: SharedGeometryStyle,
    highlightedLegendItem: LegendItem | null,
  ): JSX.Element => {
    const { area, color, transform, geometryId, seriesAreaStyle } = glyph;
    const geometryStyle = getGeometryStyle(geometryId, highlightedLegendItem, sharedStyle);
    const key = getGeometryIdKey(geometryId, 'area-');
    const areaProps = buildAreaRenderProps(transform.x, area, color, seriesAreaStyle, geometryStyle);
    return <Path {...areaProps} key={key} />;
  };
  private renderAreaLines = (
    glyph: AreaGeometry,
    areaIndex: number,
    sharedStyle: SharedGeometryStyle,
    highlightedLegendItem: LegendItem | null,
  ): JSX.Element[] => {
    const { lines, color, geometryId, transform, seriesAreaLineStyle } = glyph;
    const geometryStyle = getGeometryStyle(geometryId, highlightedLegendItem, sharedStyle);

    return lines.map((linePath, lineIndex) => {
      const key = getGeometryIdKey(geometryId, `area-line-${areaIndex}-${lineIndex}`);
      const lineProps = buildLineRenderProps(transform.x, linePath, color, seriesAreaLineStyle, geometryStyle);
      return <Path {...lineProps} key={key} />;
    });
  };

  private renderPoints = (
    areaPoints: PointGeometry[],
    areaIndex: number,
    pointStyleProps: PointStyleProps,
    geometryId: GeometryId,
  ): JSX.Element[] => {
    return areaPoints.map((areaPoint, pointIndex) => {
      const { x, y, transform } = areaPoint;
      const key = getGeometryIdKey(geometryId, `area-point-${areaIndex}-${pointIndex}-`);
      const pointProps = buildPointRenderProps(transform.x + x, y, pointStyleProps);
      return <Circle {...pointProps} key={key} />;
    });
  };
}
