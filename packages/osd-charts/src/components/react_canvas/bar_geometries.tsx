import { Group as KonvaGroup } from 'konva';
import React from 'react';
import { Group, Rect } from 'react-konva';
import { animated, Spring } from 'react-spring/renderprops-konva';
import { LegendItem } from '../../lib/series/legend';
import { BarGeometry, getGeometryStyle } from '../../lib/series/rendering';
import { BarSeriesStyle, SharedGeometryStyle } from '../../lib/themes/theme';

interface BarGeometriesDataProps {
  animated?: boolean;
  bars: BarGeometry[];
  style: BarSeriesStyle;
  sharedStyle: SharedGeometryStyle;
  highlightedLegendItem: LegendItem | null;
}
interface BarGeometriesDataState {
  overBar?: BarGeometry;
}
export class BarGeometries extends React.PureComponent<
  BarGeometriesDataProps,
  BarGeometriesDataState
> {
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
    const {
      style: { border },
      sharedStyle,
    } = this.props;
    return bars.map((bar, i) => {
      const { x, y, width, height, color } = bar;

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

      // min border depending on bar width bars with white border
      const borderEnabled = border.visible && width > border.strokeWidth * 7;
      if (this.props.animated) {
        return (
          <Group key={i}>
            <Spring native from={{ y: y + height, height: 0 }} to={{ y, height }}>
              {(props: { y: number; height: number }) => (
                <animated.Rect
                  key="animatedRect"
                  x={x}
                  y={props.y}
                  width={width}
                  height={props.height}
                  fill={color}
                  strokeWidth={border.strokeWidth}
                  stroke={border.stroke}
                  strokeEnabled={borderEnabled}
                  perfectDrawEnabled={true}
                  {...geometryStyle}
                />
              )}
            </Spring>
          </Group>
        );
      } else {
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            width={width}
            height={height}
            fill={color}
            strokeWidth={border.strokeWidth}
            stroke={border.stroke}
            strokeEnabled={borderEnabled}
            perfectDrawEnabled={false}
            {...geometryStyle}
          />
        );
      }
    });
  }
}
