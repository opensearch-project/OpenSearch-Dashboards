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

import { Rotation } from '../../../utils/commons';
import { Dimensions } from '../../../utils/dimensions';
import { BarGeometry, PointGeometry, IndexedGeometry, isPointGeometry, isBarGeometry } from '../../../utils/geometry';

/**
 * Get the cursor position depending on the chart rotation
 * @param xPos x position relative to chart
 * @param yPos y position relative to chart
 * @param chartRotation the chart rotation
 * @param chartDimension the chart dimension
 */
export function getOrientedXPosition(xPos: number, yPos: number, chartRotation: Rotation, chartDimension: Dimensions) {
  switch (chartRotation) {
    case 0:
      return xPos;
    case 180:
      return chartDimension.width - xPos;
    case 90:
      return yPos;
    case -90:
      return chartDimension.height - yPos;
  }
}
export function getOrientedYPosition(xPos: number, yPos: number, chartRotation: Rotation, chartDimension: Dimensions) {
  switch (chartRotation) {
    case 0:
      return yPos;
    case 180:
      return chartDimension.height - yPos;
    case -90:
      return xPos;
    case 90:
      return chartDimension.width - xPos;
  }
}

export function areIndexedGeometryArraysEquals(arr1: IndexedGeometry[], arr2: IndexedGeometry[]) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = arr1.length; i--; ) {
    return areIndexedGeomsEquals(arr1[i], arr2[i]);
  }
  return true;
}

export function areIndexedGeomsEquals(ig1: IndexedGeometry, ig2: IndexedGeometry) {
  if (isPointGeometry(ig1) && isPointGeometry(ig2)) {
    return arePointsEqual(ig1, ig2);
  }
  if (isBarGeometry(ig1) && isBarGeometry(ig2)) {
    return areBarEqual(ig1, ig2);
  }
  return false;
}

function arePointsEqual(ig1: PointGeometry, ig2: PointGeometry) {
  return (
    ig1.seriesIdentifier.specId === ig2.seriesIdentifier.specId &&
    ig1.color === ig2.color &&
    ig1.x === ig2.x &&
    ig1.transform.x === ig2.transform.x &&
    ig1.transform.y === ig2.transform.y &&
    ig1.y === ig2.y &&
    ig1.radius === ig2.radius
  );
}
function areBarEqual(ig1: BarGeometry, ig2: BarGeometry) {
  return (
    ig1.seriesIdentifier.specId === ig2.seriesIdentifier.specId &&
    ig1.color === ig2.color &&
    ig1.x === ig2.x &&
    ig1.y === ig2.y &&
    ig1.width === ig2.width &&
    ig1.height === ig2.height
  );
}
