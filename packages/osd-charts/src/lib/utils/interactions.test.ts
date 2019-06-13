import { IndexedGeometry, PointGeometry } from '../series/rendering';
import { Dimensions } from './dimensions';
import { getSpecId } from './ids';
import {
  areIndexedGeometryArraysEquals,
  areIndexedGeomsEquals,
  getValidXPosition,
  getValidYPosition,
  isCrosshairTooltipType,
  isFollowTooltipType,
  TooltipType,
} from './interactions';
const ig1: IndexedGeometry = {
  color: 'red',
  geometryId: {
    specId: getSpecId('ig1'),
    seriesKey: [0, 1, 2],
  },
  value: {
    accessor: 'y1',
    x: 0,
    y: 1,
  },
  x: 0,
  y: 0,
  width: 50,
  height: 50,
};
const ig2: IndexedGeometry = {
  geometryId: {
    specId: getSpecId('ig1'),
    seriesKey: [0, 1, 2],
  },
  value: {
    accessor: 'y1',
    x: 0,
    y: 1,
  },
  color: 'red',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
};
const ig3: IndexedGeometry = {
  geometryId: {
    specId: getSpecId('ig1'),
    seriesKey: [123, 123, 123],
  },
  value: {
    accessor: 'y1',
    x: 123,
    y: 123,
  },
  color: 'red',

  x: 0,
  y: 0,
  width: 50,
  height: 50,
};
const ig4: IndexedGeometry = {
  geometryId: {
    specId: getSpecId('ig4'),
    seriesKey: [123, 123, 123],
  },
  value: {
    accessor: 'y1',
    x: 123,
    y: 123,
  },
  color: 'blue',
  x: 0,
  y: 0,
  width: 50,
  height: 50,
};
const ig5: IndexedGeometry = {
  geometryId: {
    specId: getSpecId('ig5'),
    seriesKey: [123, 123, 123],
  },
  value: {
    accessor: 'y1',
    x: 123,
    y: 123,
  },
  color: 'red',
  x: 0,
  y: 0,
  width: 50,
  height: 50,
};
const ig6: PointGeometry = {
  geometryId: {
    specId: getSpecId('ig5'),
    seriesKey: [123, 123, 123],
  },
  value: {
    accessor: 'y1',
    x: 123,
    y: 123,
  },
  color: 'red',
  x: 0,
  y: 0,
  radius: 50,
  transform: {
    x: 0,
    y: 0,
  },
};
describe('Interaction utils', () => {
  const chartDimensions: Dimensions = {
    width: 200,
    height: 100,
    left: 10,
    top: 10,
  };

  test('limit x position with x already relative to chart', () => {
    const xPos = 30;
    const yPos = 50;
    let validPosition = getValidXPosition(xPos, yPos, 0, chartDimensions);
    expect(validPosition).toBe(xPos);
    validPosition = getValidXPosition(xPos, yPos, 180, chartDimensions);
    expect(validPosition).toBe(chartDimensions.width - xPos);
    validPosition = getValidXPosition(xPos, yPos, 90, chartDimensions);
    expect(validPosition).toBe(yPos);
    validPosition = getValidXPosition(xPos, yPos, -90, chartDimensions);
    expect(validPosition).toBe(chartDimensions.height - yPos);
  });
  test('limit y position with x already relative to chart', () => {
    const yPos = 30;
    const xPos = 50;
    let validPosition = getValidYPosition(xPos, yPos, 0, chartDimensions);
    expect(validPosition).toBe(yPos);
    validPosition = getValidYPosition(xPos, yPos, 180, chartDimensions);
    expect(validPosition).toBe(chartDimensions.height - yPos);
    validPosition = getValidYPosition(xPos, yPos, 90, chartDimensions);
    expect(validPosition).toBe(chartDimensions.width - xPos);
    validPosition = getValidYPosition(xPos, yPos, -90, chartDimensions);
    expect(validPosition).toBe(xPos);
  });
  test('checks tooltip type helpers', () => {
    expect(isCrosshairTooltipType(TooltipType.Crosshairs)).toBe(true);
    expect(isCrosshairTooltipType(TooltipType.VerticalCursor)).toBe(true);
    expect(isCrosshairTooltipType(TooltipType.Follow)).toBe(false);
    expect(isCrosshairTooltipType(TooltipType.None)).toBe(false);

    expect(isFollowTooltipType(TooltipType.Crosshairs)).toBe(false);
    expect(isFollowTooltipType(TooltipType.VerticalCursor)).toBe(false);
    expect(isFollowTooltipType(TooltipType.Follow)).toBe(true);
    expect(isFollowTooltipType(TooltipType.None)).toBe(false);
  });

  test('geometry equality', () => {
    expect(areIndexedGeomsEquals(ig1, ig1)).toBe(true);
    expect(areIndexedGeomsEquals(ig1, ig2)).toBe(false);
    expect(areIndexedGeomsEquals(ig1, ig3)).toBe(true);
    expect(areIndexedGeomsEquals(ig5, ig6)).toBe(false);
    expect(areIndexedGeomsEquals(ig6, ig6)).toBe(true);
  });
  test('geometry array equality', () => {
    expect(areIndexedGeometryArraysEquals([ig1, ig2, ig3, ig4, ig5], [ig1, ig2, ig3, ig4, ig5])).toBe(true);
    expect(areIndexedGeometryArraysEquals([ig1, ig2, ig3, ig4, ig5], [ig3, ig2, ig3, ig4, ig5])).toBe(true);
    expect(areIndexedGeometryArraysEquals([ig1, ig2, ig3, ig4], [ig1, ig2, ig3, ig4, ig5])).toBe(false);
    expect(areIndexedGeometryArraysEquals([ig1, ig2, ig3, ig4], [ig1, ig2, ig3])).toBe(false);
    expect(areIndexedGeometryArraysEquals([], [])).toBe(true);
  });
});
