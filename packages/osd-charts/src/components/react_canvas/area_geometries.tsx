import {  Group as KonvaGroup } from 'konva';
import { IAction } from 'mobx';
import React from 'react';
import { Circle, Group, Path } from 'react-konva';
import { animated, Spring } from 'react-spring/konva';
import { AreaGeometry, PointGeometry } from '../../lib/series/rendering';
import { AreaSeriesStyle } from '../../lib/themes/theme';
import { TooltipData } from '../../state/chart_state';

interface AreaGeometriesDataProps {
  animated?: boolean;
  areas: AreaGeometry[];
  num?: number;
  style: AreaSeriesStyle;
  onElementOver: ((tooltip: TooltipData) => void) & IAction;
  onElementOut: (() => void) & IAction;
}
interface AreaGeometriesDataState {
  overPoint?: PointGeometry;
}
export class AreaGeometries extends React.PureComponent<AreaGeometriesDataProps, AreaGeometriesDataState> {
  static defaultProps: Partial<AreaGeometriesDataProps> = {
    animated: false,
    num: 1,
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
        {
          this.renderAreaGeoms()
        }
        {
          this.renderAreaPoints()
        }
      </Group>
    );
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
  private renderAreaPoints = (): JSX.Element[] => {
    const { areas } = this.props;
    return areas.reduce((acc, glyph, i) => {
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
  private renderAreaGeoms = (): JSX.Element[] => {
    const { areas } = this.props;
    return areas.map((glyph, i) => {
      const { area, color, transform } = glyph;
      if (this.props.animated) {
        return (
          <Group key={`area-group-${i}`} x={transform.x}>
            <Spring
              native
              from={{ area }}
              to={{ area }}
              >
                {(props: {area: string}) => (
                  <animated.Path
                    key="area"
                    data={props.area}
                    fill={color}
                    listening={false}
                    // areaCap="round"
                    // areaJoin="round"
                  />
                )}
            </Spring>
          </Group>
        );
      } else {
        return <Path
          key={`area-${i}`}
          data={area}
          fill={color}
          listening={false}
          // areaCap="round"
          // areaJoin="round"
        />;
      }
    });
  }
}
