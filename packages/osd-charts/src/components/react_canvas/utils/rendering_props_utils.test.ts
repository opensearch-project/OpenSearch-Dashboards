import {
  buildAreaLineProps,
  buildAreaPointProps,
  buildAreaProps,
  buildBarProps,
  buildLinePointProps,
  buildLineProps,
} from './rendering_props_utils';

describe('[canvas] Area Geometries props', () => {
  test('can build area point props', () => {
    const props = buildAreaPointProps({
      areaIndex: 1,
      pointIndex: 2,
      x: 10,
      y: 20,
      radius: 30,
      strokeWidth: 2,
      color: 'red',
      opacity: 0.5,
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

    const propsNoStroke = buildAreaPointProps({
      areaIndex: 1,
      pointIndex: 2,
      x: 10,
      y: 20,
      radius: 30,
      strokeWidth: 0,
      color: 'red',
      opacity: 0.5,
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
  });
  test('can build area path props', () => {
    const props = buildAreaProps({
      index: 1,
      areaPath: 'M0,0L10,10Z',
      color: 'red',
      opacity: 0.5,
    });
    expect(props).toEqual({
      key: 'area-1',
      data: 'M0,0L10,10Z',
      fill: 'red',
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.5,
      strokeHitEnabled: false,
      perfectDrawEnabled: false,
      listening: false,
    });
  });
  test('can build area line path props', () => {
    const props = buildAreaLineProps({
      index: 1,
      linePath: 'M0,0L10,10Z',
      color: 'red',
      strokeWidth: 1,
      geometryStyle: {
        opacity: 0.5,
      },
    });
    expect(props).toEqual({
      key: `area-line-1`,
      data: 'M0,0L10,10Z',
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
  });
});

describe('[canvas] Line Geometries', () => {
  test('can build line point props', () => {
    const props = buildLinePointProps({
      lineIndex: 1,
      pointIndex: 2,
      x: 10,
      y: 20,
      radius: 30,
      strokeWidth: 2,
      color: 'red',
      opacity: 0.5,
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

    const propsNoStroke = buildLinePointProps({
      lineIndex: 1,
      pointIndex: 2,
      x: 10,
      y: 20,
      radius: 30,
      strokeWidth: 0,
      color: 'red',
      opacity: 0.5,
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
  });
  test('can build line path props', () => {
    const props = buildLineProps({
      index: 1,
      linePath: 'M0,0L10,10Z',
      color: 'red',
      strokeWidth: 1,
      opacity: 0.3,
      geometryStyle: {
        opacity: 0.5,
      },
    });
    expect(props).toEqual({
      key: `line-1`,
      data: 'M0,0L10,10Z',
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
