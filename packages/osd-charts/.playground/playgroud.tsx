import React, { Fragment } from 'react';
import {
  Axis,
  Chart,
  getAxisId,
  getSpecId,
  Position,
  ScaleType,
  Settings,
  LineAnnotation,
  getAnnotationId,
  AnnotationDomainTypes,
  RectAnnotation,
  Rotation,
  HistogramBarSeries,
} from '../src';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';
import { LoremIpsum } from 'lorem-ipsum';
const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
});
interface State {
  showChart1: boolean;
  rotation: number;
  vAxis: number;
  hAxis: number;
}
const ROTATIONS: Rotation[] = [0, 90, -90, 180];
const RECT_ANNOTATION_TEXT = lorem.generateSentences(3);
export class Playground extends React.Component<{}, State> {
  state = {
    showChart1: true,
    rotation: 0,
    vAxis: 0,
    hAxis: 0,
  };
  rotateChart = (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const sense = evt.metaKey ? -1 : 1;

    this.setState((prevState) => {
      const val = prevState.rotation + sense < 0 ? 4 + sense : prevState.rotation + sense;
      return {
        rotation: val % 4,
      };
    });
  };
  rotateVerticalAxis = () => {
    this.setState((prevState) => {
      return {
        vAxis: (prevState.vAxis + 1) % 2,
      };
    });
  };
  rotateHorizontalAxis = () => {
    this.setState((prevState) => {
      return {
        hAxis: (prevState.hAxis + 1) % 2,
      };
    });
  };
  removeChart = () => {
    this.setState((prevState) => {
      return {
        showChart1: !prevState.showChart1,
      };
    });
  };
  render() {
    const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 30);
    return (
      this.state.showChart1 && (
        <Fragment>
          <div id="controls">
            <button onClick={this.removeChart}>remove chart</button>
            <button onClick={this.rotateChart}>rotateChart {ROTATIONS[this.state.rotation]}</button>
            <button onClick={this.rotateVerticalAxis}>
              Axis to {[Position.Left, Position.Right][this.state.vAxis]}
            </button>
            <button onClick={this.rotateHorizontalAxis}>
              Axis to {[Position.Bottom, Position.Top][this.state.hAxis]}
            </button>
          </div>
          <div className="chart">
            <Chart>
              <Settings rotation={ROTATIONS[this.state.rotation]} />
              <Axis id={getAxisId('x')} position={[Position.Bottom, Position.Top][this.state.hAxis]} />
              <Axis id={getAxisId('y')} position={[Position.Left, Position.Right][this.state.vAxis]} />

              <HistogramBarSeries
                id={getSpecId('series bars chart')}
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                xAccessor={0}
                yAccessors={[1]}
                data={data}
                yScaleToDataExtent={true}
              />
              <RectAnnotation
                annotationId={getAnnotationId('annrec')}
                style={{
                  fill: 'red',
                  stroke: 'red',
                  opacity: 0.3,
                }}
                dataValues={[
                  {
                    coordinates: {
                      x0: data[0][0],
                      x1: data[10][0],
                      y0: 14,
                    },
                    details: RECT_ANNOTATION_TEXT,
                  },
                ]}
              />
            </Chart>

            <Chart>
              <Settings rotation={ROTATIONS[this.state.rotation]} />
              <Axis id={getAxisId('x')} position={[Position.Bottom, Position.Top][this.state.hAxis]} />
              <Axis id={getAxisId('y')} position={[Position.Left, Position.Right][this.state.vAxis]} />

              <HistogramBarSeries
                id={getSpecId('series bars chart')}
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                xAccessor={0}
                yAccessors={[1]}
                data={data}
                yScaleToDataExtent={true}
              />
              {/* <BarSeries
                id={getSpecId('series bars char2')}
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                xAccessor={0}
                yAccessors={[1]}
                stackAccessors={[0]}
                data={KIBANA_METRICS.metrics.kibana_os_load[1].data}
                yScaleToDataExtent={true}
              />
              <BarSeries
                id={getSpecId('series bars char3')}
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                xAccessor={0}
                yAccessors={[1]}
                stackAccessors={[0]}
                data={KIBANA_METRICS.metrics.kibana_os_load[1].data}
                yScaleToDataExtent={true}
              /> */}
              <RectAnnotation
                annotationId={getAnnotationId('annrec')}
                style={{
                  fill: 'red',
                  stroke: 'red',
                  opacity: 0.3,
                }}
                dataValues={[
                  {
                    coordinates: {
                      x0: data[0][0],
                      x1: data[10][0],
                      y0: 14,
                    },
                    details: RECT_ANNOTATION_TEXT,
                  },
                ]}
              />
              <LineAnnotation
                annotationId={getAnnotationId('annline')}
                domainType={AnnotationDomainTypes.XDomain}
                dataValues={[
                  // {
                  //   dataValue: data2[1].x,
                  //   details: 'LINE ANNOTATION long title',
                  // },
                  // {
                  //   dataValue: data2[data2.length - 1].x,
                  //   details: 'LINE ANNOTATION',
                  // },
                  {
                    dataValue: data[10][0],
                    details: 'X DOMAIN ANNOTATION',
                  },
                ]}
                hideLinesTooltips={false}
                marker={<div style={{ width: 40, height: 20, background: 'blue', lineHeight: '20px' }}>X ANN</div>}
              />
              <LineAnnotation
                annotationId={getAnnotationId('yannline')}
                domainType={AnnotationDomainTypes.YDomain}
                dataValues={[
                  // {
                  //   dataValue: 7,
                  //   details: 'LINE ANNOTATION long title',
                  // },
                  // {
                  //   dataValue: 6,
                  //   details: 'LINE ANNOTATION',
                  // },
                  // {
                  //   dataValue: 7.6,
                  //   details: 'LINE ANNOTATION long title',
                  // },
                  {
                    dataValue: 14,
                    details: 'Y Annotation',
                  },
                ]}
                hideLinesTooltips={false}
                // marker={<div style={{ width: 40, height: 20, background: 'red', lineHeight: '20px' }}>Y ANN</div>}
              />
            </Chart>
          </div>
        </Fragment>
      )
    );
  }
}
