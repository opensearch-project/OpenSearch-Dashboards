/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { Dimensions } from '../../../utils/dimensions';
import {
  areIndexedGeometryArraysEquals,
  areIndexedGeomsEquals,
  getOrientedXPosition,
  getOrientedYPosition,
} from './interactions';
import { IndexedGeometry, PointGeometry } from '../../../utils/geometry';
import { TooltipType, isCrosshairTooltipType, isFollowTooltipType } from '../../../specs';

const seriesStyle = {
  rect: {
    opacity: 1,
  },
  rectBorder: {
    strokeWidth: 1,
    visible: false,
  },
  displayValue: {
    fill: 'black',
    fontFamily: '',
    fontSize: 2,
    offsetX: 0,
    offsetY: 0,
    padding: 2,
  },
};

const ig1: IndexedGeometry = {
  color: 'red',
  seriesIdentifier: {
    specId: 'ig1',
    key: '',
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: [0, 1, 2],
  },
  value: {
    accessor: 'y1',
    x: 0,
    y: 1,
    mark: null,
  },
  x: 0,
  y: 0,
  width: 50,
  height: 50,
  seriesStyle,
};
const ig2: IndexedGeometry = {
  seriesIdentifier: {
    specId: 'ig1',
    key: '',
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: [0, 1, 2],
  },
  value: {
    accessor: 'y1',
    x: 0,
    y: 1,
    mark: null,
  },
  color: 'red',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  seriesStyle,
};
const ig3: IndexedGeometry = {
  seriesIdentifier: {
    specId: 'ig1',
    key: '',
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: [123, 123, 123],
  },
  value: {
    accessor: 'y1',
    x: 123,
    y: 123,
    mark: null,
  },
  color: 'red',

  x: 0,
  y: 0,
  width: 50,
  height: 50,
  seriesStyle,
};
const ig4: IndexedGeometry = {
  seriesIdentifier: {
    specId: 'ig4',
    key: '',
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: [123, 123, 123],
  },
  value: {
    accessor: 'y1',
    x: 123,
    y: 123,
    mark: null,
  },
  color: 'blue',
  x: 0,
  y: 0,
  width: 50,
  height: 50,
  seriesStyle,
};
const ig5: IndexedGeometry = {
  seriesIdentifier: {
    specId: 'ig5',
    key: '',
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: [123, 123, 123],
  },
  value: {
    accessor: 'y1',
    x: 123,
    y: 123,
    mark: null,
  },
  color: 'red',
  x: 0,
  y: 0,
  width: 50,
  height: 50,
  seriesStyle,
};
const ig6: PointGeometry = {
  seriesIdentifier: {
    specId: 'ig5',
    key: '',
    yAccessor: 'y1',
    splitAccessors: new Map(),
    seriesKeys: [123, 123, 123],
  },
  value: {
    accessor: 'y1',
    x: 123,
    y: 123,
    mark: null,
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
    let validPosition = getOrientedXPosition(xPos, yPos, 0, chartDimensions);
    expect(validPosition).toBe(xPos);
    validPosition = getOrientedXPosition(xPos, yPos, 180, chartDimensions);
    expect(validPosition).toBe(chartDimensions.width - xPos);
    validPosition = getOrientedXPosition(xPos, yPos, 90, chartDimensions);
    expect(validPosition).toBe(yPos);
    validPosition = getOrientedXPosition(xPos, yPos, -90, chartDimensions);
    expect(validPosition).toBe(chartDimensions.height - yPos);
  });
  test('limit y position with x already relative to chart', () => {
    const yPos = 30;
    const xPos = 50;
    let validPosition = getOrientedYPosition(xPos, yPos, 0, chartDimensions);
    expect(validPosition).toBe(yPos);
    validPosition = getOrientedYPosition(xPos, yPos, 180, chartDimensions);
    expect(validPosition).toBe(chartDimensions.height - yPos);
    validPosition = getOrientedYPosition(xPos, yPos, 90, chartDimensions);
    expect(validPosition).toBe(chartDimensions.width - xPos);
    validPosition = getOrientedYPosition(xPos, yPos, -90, chartDimensions);
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
