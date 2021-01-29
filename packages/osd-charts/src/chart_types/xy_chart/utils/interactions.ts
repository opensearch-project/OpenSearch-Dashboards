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
 * under the License.
 */

import { Rotation } from '../../../utils/common';
import { Size } from '../../../utils/dimensions';

/**
 * Get the cursor position depending on the chart rotation
 * @param xPos x position relative to chart
 * @param yPos y position relative to chart
 * @param chartRotation the chart rotation
 * @param chartDimension the chart dimension
 * @internal
 */
export function getOrientedXPosition(xPos: number, yPos: number, chartRotation: Rotation, chartDimension: Size) {
  switch (chartRotation) {
    case 180:
      return chartDimension.width - xPos;
    case 90:
      return yPos;
    case -90:
      return chartDimension.height - yPos;
    case 0:
    default:
      return xPos;
  }
}

/** @internal */
export function getOrientedYPosition(xPos: number, yPos: number, chartRotation: Rotation, chartDimension: Size) {
  switch (chartRotation) {
    case 180:
      return chartDimension.height - yPos;
    case -90:
      return xPos;
    case 90:
      return chartDimension.width - xPos;
    case 0:
    default:
      return yPos;
  }
}
