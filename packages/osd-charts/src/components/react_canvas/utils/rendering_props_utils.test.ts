import { Rotation } from '../../../lib/series/specs';
import {
  buildAreaLineProps,
  buildAreaPointProps,
  buildAreaProps,
  buildBarProps,
  buildBarValueProps,
  buildLinePointProps,
  buildLineProps,
  buildPointStyleProps,
  getBarValueClipDimensions,
  isBarValueOverflow,
  rotateBarValueProps,
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

  test('can build bar value props', () => {
    const valueArguments = {
      x: 10,
      y: 20,
      barWidth: 30,
      barHeight: 40,
      displayValueStyle: {
        fill: 'fill',
        fontFamily: 'ff',
        fontSize: 10,
        padding: 5,
        offsetX: 0,
        offsetY: 0,
      },
      displayValue: {
        text: 'foo',
        width: 10,
        height: 10,
        isValueContainedInElement: false,
        hideClippedValue: false,
      },
      chartDimensions: {
        width: 10,
        height: 10,
        top: 0,
        left: 0,
      },
      chartRotation: 0 as Rotation,
    };

    const basicProps = buildBarValueProps(valueArguments);
    expect(basicProps).toEqual({
      ...valueArguments.displayValueStyle,
      x: 17.5,
      y: 20,
      height: 15,
      width: 15,
      align: 'center',
      verticalAlign: 'top',
      text: 'foo',
    });

    valueArguments.barHeight = 2;
    const insufficientHeightBarProps = buildBarValueProps(valueArguments);
    expect(insufficientHeightBarProps).toEqual({
      ...valueArguments.displayValueStyle,
      x: 17.5,
      y: 5,
      height: 15,
      width: 15,
      align: 'center',
      verticalAlign: 'top',
      text: 'foo',
    });

    valueArguments.y = 4;
    valueArguments.barHeight = 20;
    valueArguments.chartDimensions = {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    };
    const chartOverflowBarProps = buildBarValueProps(valueArguments);
    expect(chartOverflowBarProps).toEqual({
      ...valueArguments.displayValueStyle,
      x: 17.5,
      y: 4,
      width: 15,
      height: 15,
      align: 'center',
      verticalAlign: 'top',
      text: 'foo',
    });

    valueArguments.displayValue.isValueContainedInElement = true;
    const containedBarProps = buildBarValueProps(valueArguments);
    expect(containedBarProps).toEqual({
      ...valueArguments.displayValueStyle,
      x: 17.5,
      y: -21,
      height: 25,
      width: 15,
      align: 'center',
      verticalAlign: 'top',
      text: 'foo',
    });

    valueArguments.displayValue.isValueContainedInElement = false;
    valueArguments.barWidth = 0;
    const containedXBarProps = buildBarValueProps(valueArguments);
    expect(containedXBarProps).toEqual({
      ...valueArguments.displayValueStyle,
      x: 2.5,
      y: 4,
      height: 15,
      width: 15,
      align: 'center',
      verticalAlign: 'top',
      text: 'foo',
    });

    valueArguments.displayValue.hideClippedValue = true;
    valueArguments.barWidth = 0;
    const clippedBarProps = buildBarValueProps(valueArguments);
    expect(clippedBarProps).toEqual({
      ...valueArguments.displayValueStyle,
      x: 2.5,
      y: 4,
      height: 0,
      width: 0,
      align: 'center',
      verticalAlign: 'top',
      text: 'foo',
    });
  });
  test('shouold get clipDimensions for bar values', () => {
    const chartDimensions = {
      width: 100,
      height: 100,
      top: 0,
      left: 0,
    };

    const clip = {
      width: 10,
      height: 20,
      offsetX: 0,
      offsetY: 0,
    };

    const displayValue = {
      x: 0,
      y: 0,
      offsetX: 2,
      offsetY: 4,
    };

    const overflowVisible = isBarValueOverflow(chartDimensions, clip, displayValue);
    expect(overflowVisible).toBe(false);

    clip.offsetX = -15;
    clip.offsetY = 0;
    const overflowXHidden = isBarValueOverflow(chartDimensions, clip, displayValue, true);
    expect(overflowXHidden).toBe(true);

    clip.offsetX = 10;
    clip.offsetY = -25;
    const overflowYHidden = isBarValueOverflow(chartDimensions, clip, displayValue, true);
    expect(overflowYHidden).toBe(true);
  });
  test('can get bar value clip dimensions', () => {
    const barHeight = 30;
    const computedDimensions = {
      width: 20,
      height: 10,
    };
    const displayValue = {
      width: 15,
      height: 5,
      isValueContainedInElement: false,
    };

    const unrotatedClipDimensions = getBarValueClipDimensions(displayValue, computedDimensions, barHeight, 0);
    expect(unrotatedClipDimensions).toEqual({
      width: 20,
      height: 10,
      offsetX: 0,
      offsetY: 0,
    });

    const horizontalRotatedClipDimensions = getBarValueClipDimensions(displayValue, computedDimensions, barHeight, 180);
    expect(horizontalRotatedClipDimensions).toEqual({
      width: 20,
      height: 10,
      offsetX: 0,
      offsetY: 25,
    });

    const verticalRotatedClipDimensions = getBarValueClipDimensions(displayValue, computedDimensions, barHeight, 90);
    expect(verticalRotatedClipDimensions).toEqual({
      width: 20,
      height: 10,
      offsetX: 15,
      offsetY: 0,
    });
  });
  test('can compute props for rotated bar values', () => {
    const chartDimensions = {
      width: 100,
      height: 100,
      top: 0,
      left: 0,
    };
    const barDimensions = {
      width: 10,
      height: 20,
      top: 0,
      left: 0,
    };
    const displayValueDimensions = {
      width: 15,
      height: 25,
      top: 0,
      left: 0,
    };
    const displayValue = {
      text: 'foo',
      width: 10,
      height: 20,
      isValueContainedInElement: false,
    };
    const displayValueStyle = {
      fill: 'fill',
      fontFamily: 'ff',
      fontSize: 10,
      padding: 0,
      offsetX: 0,
      offsetY: 0,
    };
    const props = {
      ...displayValueStyle,
      x: 33,
      y: 66,
      align: 'center',
      verticalAlign: 'top',
      text: 'foo',
      width: 10,
      height: 20,
    };

    // 0 rotation
    const defaultProps = rotateBarValueProps(
      0,
      chartDimensions,
      barDimensions,
      displayValueDimensions,
      displayValue,
      props,
    );
    expect(defaultProps).toEqual(props);

    // 180 rotation
    const rotatedHorizontalProps = rotateBarValueProps(
      180,
      chartDimensions,
      barDimensions,
      displayValueDimensions,
      displayValue,
      props,
    );
    const expectedRotatedHorizontalProps = {
      ...props,
      verticalAlign: 'bottom',
      x: 85,
      y: 75,
    };
    expect(rotatedHorizontalProps).toEqual(expectedRotatedHorizontalProps);

    // 90 rotation
    const verticalProps = rotateBarValueProps(
      90,
      chartDimensions,
      barDimensions,
      displayValueDimensions,
      displayValue,
      props,
    );
    const expectedVerticalProps = {
      ...props,
      verticalAlign: 'middle',
      x: 85,
      y: -7.5,
    };
    expect(verticalProps).toEqual(expectedVerticalProps);

    const verticalOverflowProps = rotateBarValueProps(
      90,
      chartDimensions,
      { ...barDimensions, height: 0 },
      displayValueDimensions,
      displayValue,
      props,
    );

    expectedVerticalProps.x = 100;
    expect(verticalOverflowProps).toEqual(expectedVerticalProps);

    const verticalContainedProps = rotateBarValueProps(
      90,
      chartDimensions,
      barDimensions,
      displayValueDimensions,
      { ...displayValue, isValueContainedInElement: true },
      props,
    );

    expectedVerticalProps.x = 80;
    expectedVerticalProps.y = 0;
    expectedVerticalProps.height = 0;
    expectedVerticalProps.width = 20;
    expectedVerticalProps.align = 'right';
    expect(verticalContainedProps).toEqual(expectedVerticalProps);

    const verticalContainedOverflowProps = rotateBarValueProps(
      90,
      chartDimensions,
      { ...barDimensions, height: 0, width: 50 },
      displayValueDimensions,
      { ...displayValue, isValueContainedInElement: true },
      props,
    );
    expectedVerticalProps.width = 0;
    expectedVerticalProps.height = 50;
    expectedVerticalProps.x = 100;
    expectedVerticalProps.y = 0;
    expect(verticalContainedOverflowProps).toEqual(expectedVerticalProps);

    // -90 rotation
    const rotatedVerticalProps = rotateBarValueProps(
      -90,
      chartDimensions,
      barDimensions,
      displayValueDimensions,
      displayValue,
      props,
    );
    const expectedRotatedVerticalProps = {
      ...props,
      verticalAlign: 'middle',
      x: 0,
      y: 82.5,
      height: 50,
      width: 0,
    };
    expect(rotatedVerticalProps).toEqual(expectedRotatedVerticalProps);

    const rotatedVerticalOverflowProps = rotateBarValueProps(
      -90,
      chartDimensions,
      { ...barDimensions, height: 0 },
      displayValueDimensions,
      displayValue,
      props,
    );
    expectedRotatedVerticalProps.x = -15;
    expect(rotatedVerticalOverflowProps).toEqual(expectedRotatedVerticalProps);

    const rotatedVerticalOverflowContainedProps = rotateBarValueProps(
      -90,
      chartDimensions,
      { ...barDimensions, height: 0, width: 50 },
      displayValueDimensions,
      { ...displayValue, isValueContainedInElement: true },
      props,
    );

    expectedRotatedVerticalProps.x = 0;
    expectedRotatedVerticalProps.y = 50;
    expectedRotatedVerticalProps.align = 'left';
    expect(rotatedVerticalOverflowContainedProps).toEqual(expectedRotatedVerticalProps);

    const rotatedVerticalContainedProps = rotateBarValueProps(
      -90,
      chartDimensions,
      barDimensions,
      displayValueDimensions,
      { ...displayValue, isValueContainedInElement: true },
      props,
    );

    expectedRotatedVerticalProps.width = 20;
    expectedRotatedVerticalProps.height = 0;
    expectedRotatedVerticalProps.y = 90;
    expect(rotatedVerticalContainedProps).toEqual(expectedRotatedVerticalProps);
  });
});
