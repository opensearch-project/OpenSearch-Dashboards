import React from 'react';
import { Group as KonvaGroup } from 'konva/types/Group';
import { Circle, Group, Path } from 'react-konva';
import deepEqual from 'fast-deep-equal/es6/react';
import {
  buildLineRenderProps,
  buildPointStyleProps,
  PointStyleProps,
  buildPointRenderProps,
} from './utils/rendering_props_utils';
import { getSeriesIdentifierPrefixedKey, getGeometryStateStyle } from '../../rendering/rendering';
import { mergePartial } from '../../../../utils/commons';
import { LineGeometry, PointGeometry } from '../../../../utils/geometry';
import { PointStyle, SharedGeometryStateStyle } from '../../../../utils/themes/theme';
import { LegendItem } from '../../../../chart_types/xy_chart/legend/legend';
import { Clippings, clipRanges } from './bar_values_utils';

interface LineGeometriesDataProps {
  animated?: boolean;
  lines: LineGeometry[];
  sharedStyle: SharedGeometryStateStyle;
  highlightedLegendItem: LegendItem | null;
  clippings: Clippings;
}

export class LineGeometries extends React.Component<LineGeometriesDataProps> {
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

  shouldComponentUpdate(nextProps: LineGeometriesDataProps) {
    return !deepEqual(this.props, nextProps);
  }

  render() {
    return (
      <Group ref={this.barSeriesRef} key={'bar_series'}>
        {this.renderLineGeoms()}
      </Group>
    );
  }

  private mergePointPropsWithOverrides(props: PointStyleProps, overrides?: Partial<PointStyle>): PointStyleProps {
    if (!overrides) {
      return props;
    }

    return mergePartial(props, overrides);
  }

  private renderPoints = (
    linePoints: PointGeometry[],
    lineKey: string,
    pointStyleProps: PointStyleProps,
  ): JSX.Element[] => {
    const linePointElements: JSX.Element[] = [];
    linePoints.forEach((linePoint, pointIndex) => {
      const { x, y, transform, styleOverrides } = linePoint;
      const key = `line-point-${lineKey}-${pointIndex}`;
      const pointStyle = this.mergePointPropsWithOverrides(pointStyleProps, styleOverrides);
      const pointProps = buildPointRenderProps(transform.x + x, y, pointStyle);
      linePointElements.push(<Circle {...pointProps} key={key} />);
    });
    return linePointElements;
  };

  private renderLineGeoms = (): JSX.Element[] => {
    const { lines, sharedStyle } = this.props;

    return lines.reduce<JSX.Element[]>((acc, line) => {
      const { seriesLineStyle, seriesPointStyle, seriesIdentifier } = line;
      const key = getSeriesIdentifierPrefixedKey(seriesIdentifier, 'line-');
      if (seriesLineStyle.visible) {
        acc.push(this.getLineToRender(line, sharedStyle, key));
      }

      if (seriesPointStyle.visible) {
        acc.push(...this.getPointToRender(line, sharedStyle, key));
      }

      return acc;
    }, []);
  };

  getLineToRender(line: LineGeometry, sharedStyle: SharedGeometryStateStyle, key: string) {
    const { clippings } = this.props;
    const { line: linePath, color, transform, seriesIdentifier, seriesLineStyle, clippedRanges } = line;
    const geometryStyle = getGeometryStateStyle(seriesIdentifier, this.props.highlightedLegendItem, sharedStyle);

    const lineProps = buildLineRenderProps(transform.x, linePath, color, seriesLineStyle, geometryStyle);

    if (clippedRanges.length > 0) {
      return (
        <Group {...clippings} key={key}>
          <Group clipFunc={clipRanges(clippedRanges, clippings)}>
            <Path {...lineProps} />
          </Group>
          <Group clipFunc={clipRanges(clippedRanges, clippings, true)}>
            <Path {...lineProps} dash={[5, 5]} dashEnabled />
          </Group>
        </Group>
      );
    }

    return (
      <Group {...clippings} key={key}>
        <Path {...lineProps} />
      </Group>
    );
  }

  getPointToRender(line: LineGeometry, sharedStyle: SharedGeometryStateStyle, key: string) {
    const { points, color, seriesIdentifier, seriesPointStyle } = line;
    const geometryStyle = getGeometryStateStyle(seriesIdentifier, this.props.highlightedLegendItem, sharedStyle);
    const pointStyleProps = buildPointStyleProps(color, seriesPointStyle, geometryStyle);
    return this.renderPoints(points, key, pointStyleProps);
  }
}
