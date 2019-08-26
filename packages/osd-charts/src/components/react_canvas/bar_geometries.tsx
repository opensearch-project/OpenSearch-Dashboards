import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Group, Rect } from 'react-konva';
import { animated, Spring } from 'react-spring/renderprops-konva.cjs';
import { LegendItem } from '../../chart_types/xy_chart/legend/legend';
import { BarGeometry, getGeometryStyle } from '../../chart_types/xy_chart/rendering/rendering';
import { SharedGeometryStyle } from '../../utils/themes/theme';
import { buildBarRenderProps, buildBarBorderRenderProps } from './utils/rendering_props_utils';

interface BarGeometriesDataProps {
  animated?: boolean;
  bars: BarGeometry[];
  sharedStyle: SharedGeometryStyle;
  highlightedLegendItem: LegendItem | null;
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
    const { bars } = this.props;
    return (
      <Group ref={this.barSeriesRef} key={'bar_series'}>
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

      const geometryStyle = getGeometryStyle(
        bar.geometryId,
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
