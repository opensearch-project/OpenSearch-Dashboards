import React from 'react';
import {
  Chart,
  ScaleType,
  Position,
  Axis,
  LineSeries,
  LineAnnotation,
  RectAnnotation,
  AnnotationDomainTypes,
  LineAnnotationDatum,
  RectAnnotationDatum,
} from '../src';
import { SeededDataGenerator } from '../src/mocks/utils';

export class Playground extends React.Component<{}, { isSunburstShown: boolean }> {
  render() {
    const dg = new SeededDataGenerator();
    const data = dg.generateGroupedSeries(10, 2).map((item) => ({
      ...item,
      y1: item.y + 100,
    }));
    const lineDatum: LineAnnotationDatum[] = [{ dataValue: 321321 }];
    const rectDatum: RectAnnotationDatum[] = [{ coordinates: { x1: 100 } }];

    return (
      <>
        <div className="chart">
          <Chart>
            <Axis id="y1" position={Position.Left} title="y1" />
            <Axis id="y2" domain={{ fit: true }} groupId="g2" position={Position.Right} title="y2" />
            <Axis id="x" position={Position.Bottom} title="x" />
            <LineSeries
              id="line1"
              xScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              splitSeriesAccessors={['g']}
              data={data}
            />
            <LineSeries
              id="line2"
              groupId="g2"
              xScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y1']}
              splitSeriesAccessors={['g']}
              data={data}
            />
            <LineAnnotation id="sss" dataValues={lineDatum} domainType={AnnotationDomainTypes.XDomain} />
            <RectAnnotation id="111" dataValues={rectDatum} />
          </Chart>
        </div>
      </>
    );
  }
}
