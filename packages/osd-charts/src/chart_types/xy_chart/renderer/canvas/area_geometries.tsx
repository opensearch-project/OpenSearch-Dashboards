import React from 'react';
import { Group as KonvaGroup } from 'konva/types/Group';
import { PathConfig } from 'konva/types/shapes/Path';
import { Circle, Group, Path } from 'react-konva';
import { deepEqual } from '../../../../utils/fast_deep_equal';
import {
  buildAreaRenderProps,
  buildPointStyleProps,
  buildPointRenderProps,
  PointStyleProps,
  buildLineRenderProps,
} from './utils/rendering_props_utils';
import { getSeriesIdentifierPrefixedKey, getGeometryStateStyle } from '../../rendering/rendering';
import { mergePartial } from '../../../../utils/commons';
import { AreaGeometry, PointGeometry } from '../../../../utils/geometry';
import { PointStyle, SharedGeometryStateStyle } from '../../../../utils/themes/theme';
import { LegendItem } from '../../legend/legend';
import { Clippings, clipRanges } from './bar_values_utils';
import { SeriesIdentifier } from '../../utils/series';

interface AreaGeometriesDataProps {
  animated?: boolean;
  areas: AreaGeometry[];
  sharedStyle: SharedGeometryStateStyle;
  highlightedLegendItem: LegendItem | null;
  clippings: Clippings;
}

export class AreaGeometries extends React.Component<AreaGeometriesDataProps> {
  static defaultProps: Partial<AreaGeometriesDataProps> = {
    animated: false,
  };
  private readonly barSeriesRef: React.RefObject<KonvaGroup> = React.createRef();
  constructor(props: AreaGeometriesDataProps) {
    super(props);
    this.barSeriesRef = React.createRef();
  }

  shouldComponentUpdate(nextProps: AreaGeometriesDataProps) {
    return !deepEqual(this.props, nextProps);
  }

  render() {
    return (
      <Group ref={this.barSeriesRef} key={'bar_series'}>
        {this.renderAreaGeoms()}
      </Group>
    );
  }
  private renderAreaGeoms = (): JSX.Element[] => {
    const { sharedStyle, highlightedLegendItem, areas, clippings } = this.props;
    return areas.reduce<JSX.Element[]>((acc, glyph, i) => {
      const { seriesAreaLineStyle, seriesAreaStyle, seriesPointStyle, seriesIdentifier } = glyph;
      if (seriesAreaStyle.visible) {
        acc.push(this.renderArea(glyph, sharedStyle, highlightedLegendItem, clippings));
      }
      if (seriesAreaLineStyle.visible) {
        acc.push(this.renderAreaLines(glyph, i, sharedStyle, highlightedLegendItem, clippings));
      }
      if (seriesPointStyle.visible) {
        const geometryStateStyle = getGeometryStateStyle(
          seriesIdentifier,
          this.props.highlightedLegendItem,
          sharedStyle,
        );
        const pointStyleProps = buildPointStyleProps(glyph.color, seriesPointStyle, geometryStateStyle);
        acc.push(...this.renderPoints(glyph.points, i, pointStyleProps, glyph.seriesIdentifier));
      }
      return acc;
    }, []);
  };
  private renderArea = (
    glyph: AreaGeometry,
    sharedStyle: SharedGeometryStateStyle,
    highlightedLegendItem: LegendItem | null,
    clippings: Clippings,
  ): JSX.Element => {
    const { area, color, transform, seriesIdentifier, seriesAreaStyle, clippedRanges } = glyph;
    const geometryStateStyle = getGeometryStateStyle(seriesIdentifier, highlightedLegendItem, sharedStyle);
    const key = getSeriesIdentifierPrefixedKey(seriesIdentifier, 'area-');
    const areaProps = buildAreaRenderProps(transform.x, area, color, seriesAreaStyle, geometryStateStyle);

    if (clippedRanges.length > 0) {
      return (
        <Group {...clippings} key={key}>
          <Group clipFunc={clipRanges(clippedRanges, clippings)}>
            <Path {...areaProps} />
          </Group>
          <Group clipFunc={clipRanges(clippedRanges, clippings, true)}>
            <Path {...areaProps} opacity={areaProps.opacity ? Number(areaProps.opacity) / 2 : 0.5} />
          </Group>
        </Group>
      );
    }

    return (
      <Group {...clippings} key={key}>
        <Path {...areaProps} />
      </Group>
    );
  };
  private renderAreaLines = (
    glyph: AreaGeometry,
    areaIndex: number,
    sharedStyle: SharedGeometryStateStyle,
    highlightedLegendItem: LegendItem | null,
    clippings: Clippings,
  ): JSX.Element => {
    const { lines, color, seriesIdentifier, transform, seriesAreaLineStyle, clippedRanges } = glyph;
    const geometryStateStyle = getGeometryStateStyle(seriesIdentifier, highlightedLegendItem, sharedStyle);
    const groupKey = getSeriesIdentifierPrefixedKey(seriesIdentifier, `area-line-${areaIndex}`);
    const linesElementProps = lines.map<{ key: string; props: PathConfig }>((linePath, lineIndex) => {
      const key = getSeriesIdentifierPrefixedKey(seriesIdentifier, `area-line-${areaIndex}-${lineIndex}`);
      const props = buildLineRenderProps(transform.x, linePath, color, seriesAreaLineStyle, geometryStateStyle);
      return { key, props };
    });

    if (clippedRanges.length > 0) {
      return (
        <Group {...clippings} key={groupKey}>
          <Group clipFunc={clipRanges(clippedRanges, clippings)}>
            {linesElementProps.map(({ key, props }) => (
              <Path {...props} key={key} />
            ))}
          </Group>
          <Group clipFunc={clipRanges(clippedRanges, clippings, true)}>
            {linesElementProps.map(({ key, props }) => (
              <Path {...props} key={key} dash={[5, 5]} dashEnabled />
            ))}
          </Group>
        </Group>
      );
    }

    return (
      <Group {...clippings} key={groupKey}>
        {linesElementProps.map(({ key, props }) => (
          <Path {...props} key={key} />
        ))}
      </Group>
    );
  };

  private mergePointPropsWithOverrides(props: PointStyleProps, overrides?: Partial<PointStyle>): PointStyleProps {
    if (!overrides) {
      return props;
    }

    return mergePartial(props, overrides);
  }

  private renderPoints = (
    areaPoints: PointGeometry[],
    areaIndex: number,
    pointStyleProps: PointStyleProps,
    seriesIdentifier: SeriesIdentifier,
  ): JSX.Element[] => {
    return areaPoints.map((areaPoint, pointIndex) => {
      const { x, y, transform, styleOverrides } = areaPoint;
      const key = getSeriesIdentifierPrefixedKey(seriesIdentifier, `area-point-${areaIndex}-${pointIndex}-`);
      const pointStyle = this.mergePointPropsWithOverrides(pointStyleProps, styleOverrides);
      const pointProps = buildPointRenderProps(transform.x + x, y, pointStyle);
      return <Circle {...pointProps} key={key} />;
    });
  };
}
