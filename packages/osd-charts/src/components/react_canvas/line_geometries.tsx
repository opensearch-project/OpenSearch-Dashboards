import { Group as KonvaGroup } from 'konva';
import { IAction } from 'mobx';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { animated, Spring } from 'react-spring/konva';
import { GeometryValue, LineGeometry, PointGeometry } from '../../lib/series/rendering';
import { LineSeriesStyle } from '../../lib/themes/theme';
import { ElementClickListener, TooltipData } from '../../state/chart_state';

interface LineGeometriesDataProps {
  animated?: boolean;
  lines: LineGeometry[];
  style: LineSeriesStyle;
  onElementClick?: ElementClickListener;
  onElementOver: ((tooltip: TooltipData) => void) & IAction;
  onElementOut: (() => void) & IAction;
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
        {
          this.renderLineGeoms()
        }
        {
          this.renderLinePoints()
        }
      </Group>
    );
  }
  private onElementClick = (value: GeometryValue) => () => {
    if (this.props.onElementClick) {
      this.props.onElementClick(value);
    }
  }
  private onOverPoint = (point: PointGeometry) => () => {
    const { onElementOver } = this.props;
    const { x, y, value, transform } = point;
    this.setState(() => {
      return {
        overPoint: point,
      };
    });
    onElementOver({
      value,
      position: {
        left: transform.x + x,
        top: y,
      },
    });
  }
  private onOutPoint = () => {
    const { onElementOut } = this.props;

    this.setState(() => {
      return {
        overPoint: undefined,
      };
    });
    onElementOut();
  }
  private renderLinePoints = (): JSX.Element[] => {
    const { lines } = this.props;
    return lines.reduce((acc, glyph, i) => {
      const { points } = glyph;
      return [...acc, ...this.renderPoints(points, i)];
    }, [] as JSX.Element[]);
  }
  private renderPoints = (points: PointGeometry[], i: number): JSX.Element[] => {
    const { style } = this.props;
    const { overPoint } = this.state;

    return points.map((point, index) => {
      const { x, y, color, value, transform } = point;
      return (
        <Group key={`point-${i}-${index}`}>
          <Circle
            x={transform.x + x}
            y={y}
            radius={style.dataPointsRadius * 2.5}
            onClick={this.onElementClick(point.value)}
            onMouseOver={this.onOverPoint(point)}
            onMouseLeave={this.onOutPoint}
            fill={'gray'}
            opacity={overPoint === point ? 0.3 : 0}
          />
          <Circle
            x={transform.x + x}
            y={y}
            radius={style.dataPointsRadius}
            strokeWidth={0}
            fill={color}
            opacity={overPoint === point ? 0.5 : 0}
            strokeHitEnabled={false}
            listening={false}
            perfectDrawEnabled={true}
          />
           <Circle
            x={transform.x + x}
            y={y}
            radius={style.dataPointsRadius}
            onMouseOver={this.onOverPoint(point)}
            onMouseLeave={this.onOutPoint}
            fill={'transparent'}
            stroke={style.dataPointsStroke}
            strokeWidth={style.dataPointsStrokeWidth}
            opacity={overPoint === point ? 1 : 0}
            strokeHitEnabled={false}
            listening={false}
            perfectDrawEnabled={true}
          />
        </Group>);
    });
  }
  private renderLineGeoms = (): JSX.Element[] => {
    const { style, lines } = this.props;
    return lines.map((glyph, i) => {
      const { line, color, transform } = glyph;
      if (this.props.animated) {
        return (
          <Group key={i} x={transform.x}>
            <Spring
              native
              from={{ line }}
              to={{ line }}
              >
                {(props: {line: string}) => (
                  <animated.Path
                    key="line"
                    data={props.line}
                    strokeWidth={style.lineWidth}
                    stroke={color}
                    listening={false}
                    lineCap="round"
                    lineJoin="round"

                  />
                )}
            </Spring>
          </Group>
        );
      } else {
        return <Path
          key="line"
          data={line}
          strokeWidth={style.lineWidth}
          stroke={color}
          listening={false}
          lineCap="round"
          lineJoin="round"
        />;
      }
    });
  }
}
