import { Group as KonvaGroup } from 'konva';
import { IAction } from 'mobx';
import React from 'react';
import { Group, Rect } from 'react-konva';
import { animated, Spring } from 'react-spring/konva';
import { BarGeometry, GeometryValue } from '../../lib/series/rendering';
import { ElementClickListener, TooltipData } from '../../state/chart_state';

interface BarGeometriesDataProps {
  animated?: boolean;
  bars: BarGeometry[];
  onElementClick?: ElementClickListener;
  onElementOver: ((tooltip: TooltipData) => void) & IAction;
  onElementOut: (() => void) & IAction;
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
        {
          this.renderBarGeoms(bars)
        }
      </Group>
    );
  }
  private onElementClick = (value: GeometryValue) => () => {
    if (this.props.onElementClick) {
      this.props.onElementClick(value);
    }
  }
  private onOverBar = (point: BarGeometry) => () => {
    const { onElementOver } = this.props;
    const { x, y, value } = point;
    this.setState(() => {
      return {
        overBar: point,
      };
    });
    onElementOver({
      value,
      position: {
        left: x,
        top: y,
      },
    });
  }
  private onOutBar = () => {
    const { onElementOut } = this.props;

    this.setState(() => {
      return {
        overBar: undefined,
      };
    });
    onElementOut();
  }
  private renderBarGeoms = (bars: BarGeometry[]): JSX.Element[] => {
    const { overBar } = this.state;
    return bars.map((bar, i) => {
      const { x, y, width, height, color, value } = bar;
      let opacity = 1;
      if (overBar && overBar !== bar) {
        opacity = 0.6;
      }
      if (this.props.animated) {
        return (
          <Group key={i}>
            <Spring
              native
              from={{ y: y + height, height: 0 }}
              to={{ y, height }}
              >
                {(props: {y: number, height: number}) => (
                  <animated.Rect
                    key="animatedRect"
                    x={x}
                    y={props.y}
                    width={width}
                    height={props.height}
                    fill={color}
                    strokeWidth={0}
                    opacity={opacity}
                    perfectDrawEnabled={true}
                    onMouseOver={this.onOverBar(bar)}
                    onMouseLeave={this.onOutBar}
                    onClick={this.onElementClick(bar.value)}
                  />
                )}
            </Spring>
          </Group>
        );
      } else {
        return <Rect
          key={i}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          strokeWidth={0}
          opacity={opacity}
          perfectDrawEnabled={false}
          onMouseOver={this.onOverBar(bar)}
          onMouseLeave={this.onOutBar}
          onClick={this.onElementClick(bar.value)}
        />;
      }
    });
  }
}
