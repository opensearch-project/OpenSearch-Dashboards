import {
  buildAreaLineProps,
  buildAreaPointProps,
  buildAreaProps,
  buildBarProps,
  buildLinePointProps,
  buildLineProps,
  buildPointStyleProps,
} from './rendering_props_utils';

describe('[canvas] Area Geometries props', () => {
  test('can build area point props', () => {
    const pointStyleProps = buildPointStyleProps({
      radius: 30,
      strokeWidth: 2,
      opacity: 0.5,
    });

    const props = buildAreaPointProps({
      areaIndex: 1,
      pointIndex: 2,
      x: 10,
      y: 20,
      color: 'red',
      pointStyleProps,
    });
    expect(props).toEqual({
      key: 'area-point-1-2',
      x: 10,
      y: 20,
      radius: 30,
      strokeWidth: 2,
      strokeEnabled: true,
      stroke: 'red',
      fill: 'white',
      opacity: 0.5,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });

    const noStrokePointStyleProps = buildPointStyleProps({
      radius: 30,
      strokeWidth: 0,
      opacity: 0.5,
    });

    const propsNoStroke = buildAreaPointProps({
      areaIndex: 1,
      pointIndex: 2,
      x: 10,
      y: 20,
      color: 'red',
      pointStyleProps: noStrokePointStyleProps,
    });
    expect(propsNoStroke).toEqual({
      key: 'area-point-1-2',
      x: 10,
      y: 20,
      radius: 30,
      strokeWidth: 0,
      strokeEnabled: false,
      stroke: 'red',
      fill: 'white',
      opacity: 0.5,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });

    const seriesPointStyleProps = buildPointStyleProps({
      radius: 30,
      strokeWidth: 2,
      opacity: 0.5,
      seriesPointStyle: {
        radius: 123,
        stroke: 'series-stroke',
        strokeWidth: 456,
        opacity: 789,
        visible: true,
      },
    });
    const seriesPointStyle = buildAreaPointProps({
      areaIndex: 1,
      pointIndex: 2,
      x: 10,
      y: 20,
      color: 'red',
      pointStyleProps: seriesPointStyleProps,
    });
    expect(seriesPointStyle).toEqual({
      key: 'area-point-1-2',
      x: 10,
      y: 20,
      radius: 123,
      strokeWidth: 456,
      strokeEnabled: true,
      stroke: 'red',
      fill: 'white',
      opacity: 789,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });
  });
  test('can build area path props', () => {
    const props = buildAreaProps({
      index: 1,
      areaPath: 'M0,0L10,10Z',
      xTransform: 40,
      color: 'red',
      opacity: 0.5,
    });
    expect(props).toEqual({
      key: 'area-1',
      data: 'M0,0L10,10Z',
      x: 40,
      fill: 'red',
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.5,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });

    const seriesAreaStyle = buildAreaProps({
      index: 1,
      areaPath: 'M0,0L10,10Z',
      xTransform: 0,
      color: 'red',
      opacity: 0.5,
      seriesAreaStyle: {
        opacity: 123,
        fill: '',
        visible: true,
      },
    });
    expect(seriesAreaStyle).toEqual({
      key: 'area-1',
      data: 'M0,0L10,10Z',
      x: 0,
      fill: 'red',
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 123,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });
  });
  test('can build area line path props', () => {
    const props = buildAreaLineProps({
      areaIndex: 1,
      lineIndex: 2,
      xTransform: 40,
      linePath: 'M0,0L10,10Z',
      color: 'red',
      strokeWidth: 1,
      geometryStyle: {
        opacity: 0.5,
      },
    });
    expect(props).toEqual({
      key: `area-1-line-2`,
      data: 'M0,0L10,10Z',
      x: 40,
      stroke: 'red',
      strokeWidth: 1,
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.5,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });
    expect(props.fill).toBeFalsy();

    const seriesLineStyle = buildAreaLineProps({
      areaIndex: 1,
      xTransform: 0,
      lineIndex: 2,
      linePath: 'M0,0L10,10Z',
      color: 'red',
      strokeWidth: 1,
      geometryStyle: {
        opacity: 0.5,
      },
      seriesAreaLineStyle: {
        opacity: 0.5,
        stroke: 'series-stroke',
        strokeWidth: 66,
        visible: true,
      },
    });
    expect(seriesLineStyle).toEqual({
      key: `area-1-line-2`,
      data: 'M0,0L10,10Z',
      x: 0,
      stroke: 'red',
      strokeWidth: 66,
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.5,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });
  });
});

describe('[canvas] Line Geometries', () => {
  test('can build line point props', () => {
    const pointStyleProps = buildPointStyleProps({
      radius: 30,
      strokeWidth: 2,
      opacity: 0.5,
    });

    const props = buildLinePointProps({
      lineIndex: 1,
      pointIndex: 2,
      x: 10,
      y: 20,
      color: 'red',
      pointStyleProps,
    });
    expect(props).toEqual({
      key: 'line-point-1-2',
      x: 10,
      y: 20,
      radius: 30,
      strokeWidth: 2,
      strokeEnabled: true,
      stroke: 'red',
      fill: 'white',
      opacity: 0.5,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });

    const noStrokeStyleProps = buildPointStyleProps({
      radius: 30,
      strokeWidth: 0,
      opacity: 0.5,
    });
    const propsNoStroke = buildLinePointProps({
      lineIndex: 1,
      pointIndex: 2,
      x: 10,
      y: 20,
      color: 'red',
      pointStyleProps: noStrokeStyleProps,
    });
    expect(propsNoStroke).toEqual({
      key: 'line-point-1-2',
      x: 10,
      y: 20,
      radius: 30,
      strokeWidth: 0,
      strokeEnabled: false,
      stroke: 'red',
      fill: 'white',
      opacity: 0.5,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });

    const seriesPointStyleProps = buildPointStyleProps({
      radius: 30,
      strokeWidth: 2,
      opacity: 0.5,
      seriesPointStyle: {
        stroke: 'series-stroke',
        strokeWidth: 6,
        visible: true,
        radius: 12,
        opacity: 18,
      },
    });
    const seriesPointStyle = buildLinePointProps({
      lineIndex: 1,
      pointIndex: 2,
      x: 10,
      y: 20,
      color: 'red',
      pointStyleProps: seriesPointStyleProps,
    });
    expect(seriesPointStyle).toEqual({
      key: 'line-point-1-2',
      x: 10,
      y: 20,
      radius: 12,
      strokeWidth: 6,
      strokeEnabled: true,
      stroke: 'red',
      fill: 'white',
      opacity: 18,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });
  });
  test('can build line path props', () => {
    const props = buildLineProps({
      index: 1,
      linePath: 'M0,0L10,10Z',
      xTransform: 40,
      color: 'red',
      strokeWidth: 1,
      geometryStyle: {
        opacity: 0.5,
      },
    });
    expect(props).toEqual({
      key: `line-1`,
      data: 'M0,0L10,10Z',
      x: 40,
      stroke: 'red',
      strokeWidth: 1,
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.5,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });
    expect(props.fill).toBeFalsy();

    const seriesLineStyleProps = buildLineProps({
      index: 1,
      linePath: 'M0,0L10,10Z',
      xTransform: 0,
      color: 'red',
      strokeWidth: 1,
      geometryStyle: {
        opacity: 0.5,
      },
      seriesLineStyle: {
        stroke: 'series-stroke',
        strokeWidth: 66,
        visible: true,
      },
    });
    expect(seriesLineStyleProps).toEqual({
      key: `line-1`,
      data: 'M0,0L10,10Z',
      x: 0,
      stroke: 'red',
      strokeWidth: 66,
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.5,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });
  });
});

describe('[canvas] Bar Geometries', () => {
  test('can build bar props', () => {
    const props = buildBarProps({
      index: 1,
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      fill: 'red',
      stroke: 'blue',
      strokeWidth: 1,
      borderEnabled: true,
      geometryStyle: {
        opacity: 0.5,
      },
    });
    expect(props).toEqual({
      key: `bar-1`,
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      fill: 'red',
      stroke: 'blue',
      strokeWidth: 1,
      strokeEnabled: true,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
      opacity: 0.5,
    });
  });
});
