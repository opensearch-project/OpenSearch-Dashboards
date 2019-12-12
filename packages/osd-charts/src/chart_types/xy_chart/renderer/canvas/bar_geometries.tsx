import { Group as KonvaGroup } from 'konva/types/Group';
import React from 'react';
import { Group, Rect } from 'react-konva';
import { animated, Spring } from 'react-spring/renderprops-konva.cjs';
import { buildBarRenderProps, buildBarBorderRenderProps } from './utils/rendering_props_utils';
import { BarGeometry } from '../../../../utils/geometry';
import { LegendItem } from '../../../../chart_types/xy_chart/legend/legend';
import { SharedGeometryStateStyle } from '../../../../utils/themes/theme';
import { getGeometryStateStyle } from '../../rendering/rendering';
import { Clippings } from './bar_values_utils';

interface BarGeometriesDataProps {
  animated?: boolean;
  bars: BarGeometry[];
  sharedStyle: SharedGeometryStateStyle;
  highlightedLegendItem: LegendItem | null;
  clippings: Clippings;
}
interface BarGeometriesDataState {
  overBar?: BarGeometry;
}
export class BarGeometries extends React.PureComponent<BarGeometriesDataProps, BarGeometriesDataState> {
  static defaultProps: Partial<BarGeometriesDataProps> = {
    animated: false,
  };
  private readonly barSeriesRef: React.RefObject<KonvaGroup> = React.createRef();
  constructor(props: BarGeometriesDataProps) {
    super(props);
    this.barSeriesRef = React.createRef();
    this.state = {
      overBar: undefined,
    };
  }
  render() {
    const { bars, clippings } = this.props;
    return (
      <Group ref={this.barSeriesRef} key={'bar_series'} {...clippings}>
        {this.renderBarGeoms(bars)}
      </Group>
    );
  }

  private renderBarGeoms = (bars: BarGeometry[]): JSX.Element[] => {
    const { overBar } = this.state;
    const { sharedStyle } = this.props;
    return bars.map((bar, index) => {
      const { x, y, width, height, color, seriesStyle } = bar;

      // Properties to determine if we need to highlight individual bars depending on hover state
      const hasGeometryHover = overBar != null;
      const hasHighlight = overBar === bar;
      const individualHighlight = {
        hasGeometryHover,
        hasHighlight,
      };

      const geometryStyle = getGeometryStateStyle(
        bar.seriesIdentifier,
        this.props.highlightedLegendItem,
        sharedStyle,
        individualHighlight,
      );
      const key = `bar-${index}`;

      if (this.props.animated) {
        return (
          <Group key={index}>
            <Spring native from={{ y: y + height, height: 0 }} to={{ y, height }}>
              {(props: { y: number; height: number }) => {
                const barPropsBorder = buildBarBorderRenderProps(
                  x,
                  props.y,
                  width,
                  props.height,
                  seriesStyle.rect,
                  seriesStyle.rectBorder,
                  geometryStyle,
                );
                const barProps = buildBarRenderProps(
                  x,
                  props.y,
                  width,
                  props.height,
                  color,
                  seriesStyle.rect,
                  seriesStyle.rectBorder,
                  geometryStyle,
                );

                return (
                  <React.Fragment key={key}>
                    <animated.Rect {...barProps} />
                    {barPropsBorder && <animated.Rect {...barPropsBorder} />}
                  </React.Fragment>
                );
              }}
            </Spring>
          </Group>
        );
      } else {
        const barPropsBorder = buildBarBorderRenderProps(
          x,
          y,
          width,
          height,
          seriesStyle.rect,
          seriesStyle.rectBorder,
          geometryStyle,
        );
        const barProps = buildBarRenderProps(
          x,
          y,
          width,
          height,
          color,
          seriesStyle.rect,
          seriesStyle.rectBorder,
          geometryStyle,
        );

        return (
          <React.Fragment key={key}>
            <Rect {...barProps} />
            {barPropsBorder && <Rect {...barPropsBorder} />}
          </React.Fragment>
        );
      }
    });
  };
}
