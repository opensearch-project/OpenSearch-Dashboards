import { getSpecId } from '../utils/ids';
import { BarGeometry, isPointOnGeometry, PointGeometry } from './rendering';

describe('Rendering utils', () => {
  test('check if point is in geometry', () => {
    const geometry: BarGeometry = {
      color: 'red',
      geometryId: {
        seriesKey: [],
        specId: getSpecId('id'),
      },
      value: {
        accessor: 'y1',
        x: 0,
        y: 0,
      },
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    };
    expect(isPointOnGeometry(0, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(10, 10, geometry)).toBe(true);
    expect(isPointOnGeometry(0, 10, geometry)).toBe(true);
    expect(isPointOnGeometry(10, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(-10, 0, geometry)).toBe(false);
    expect(isPointOnGeometry(-11, 0, geometry)).toBe(false);
    expect(isPointOnGeometry(11, 11, geometry)).toBe(false);
  });
  test('check if point is in point geometry', () => {
    const geometry: PointGeometry = {
      color: 'red',
      geometryId: {
        seriesKey: [],
        specId: getSpecId('id'),
      },
      value: {
        accessor: 'y1',
        x: 0,
        y: 0,
      },
      transform: {
        x: 0,
        y: 0,
      },
      x: 0,
      y: 0,
      radius: 10,
    };
    expect(isPointOnGeometry(0, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(10, 10, geometry)).toBe(true);
    expect(isPointOnGeometry(0, 10, geometry)).toBe(true);
    expect(isPointOnGeometry(10, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(11, 11, geometry)).toBe(false);
    expect(isPointOnGeometry(-10, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(-11, 0, geometry)).toBe(false);
    expect(isPointOnGeometry(11, 11, geometry)).toBe(false);
  });
});
