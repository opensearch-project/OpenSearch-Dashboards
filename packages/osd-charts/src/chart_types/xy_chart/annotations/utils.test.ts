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

import { MockGlobalSpec } from '../../../mocks/specs';
import { Position, Rotation } from '../../../utils/common';
import { Dimensions } from '../../../utils/dimensions';
import { AnnotationDomainType } from '../utils/specs';
import { getAnnotationAxis, getTransformedCursor, invertTranformedCursor } from './utils';

describe('Annotation utils', () => {
  const groupId = 'foo-group';

  const verticalAxisSpec = MockGlobalSpec.axis({
    id: 'vertical_axis',
    groupId,
    position: Position.Left,
  });
  const horizontalAxisSpec = MockGlobalSpec.axis({
    id: 'vertical_axis',
    groupId,
    position: Position.Bottom,
  });

  test('should get associated axis for an annotation', () => {
    const noAxis = getAnnotationAxis([], groupId, AnnotationDomainType.XDomain, 0);
    expect(noAxis).toBeUndefined();

    const localAxesSpecs = [horizontalAxisSpec, verticalAxisSpec];

    const xAnnotationAxisPosition = getAnnotationAxis(localAxesSpecs, groupId, AnnotationDomainType.XDomain, 0);
    expect(xAnnotationAxisPosition).toEqual(Position.Bottom);

    const yAnnotationAxisPosition = getAnnotationAxis(localAxesSpecs, groupId, AnnotationDomainType.YDomain, 0);
    expect(yAnnotationAxisPosition).toEqual(Position.Left);
  });

  test('should get rotated cursor position', () => {
    const cursorPosition = { x: 1, y: 2 };
    const chartDimensions: Dimensions = {
      width: 10,
      height: 20,
      top: 5,
      left: 15,
    };
    expect(getTransformedCursor(cursorPosition, chartDimensions, 0)).toEqual(cursorPosition);
    expect(getTransformedCursor(cursorPosition, chartDimensions, 90)).toEqual({ x: 2, y: 9 });
    expect(getTransformedCursor(cursorPosition, chartDimensions, -90)).toEqual({ x: 18, y: 1 });
    expect(getTransformedCursor(cursorPosition, chartDimensions, 180)).toEqual({ x: 9, y: 18 });
  });

  describe('#invertTranformedCursor', () => {
    const cursorPosition = { x: 1, y: 2 };
    const chartDimensions: Dimensions = {
      width: 10,
      height: 20,
      top: 5,
      left: 15,
    };
    it.each<Rotation>([0, 90, -90, 180])('Should invert rotated cursor - rotation %d', (rotation) => {
      expect(
        invertTranformedCursor(
          getTransformedCursor(cursorPosition, chartDimensions, rotation),
          chartDimensions,
          rotation,
        ),
      ).toEqual(cursorPosition);
    });

    it.each<Rotation>([0, 90, -90, 180])('Should invert rotated projected cursor - rotation %d', (rotation) => {
      expect(
        invertTranformedCursor(
          getTransformedCursor(cursorPosition, chartDimensions, rotation, true),
          chartDimensions,
          rotation,
          true,
        ),
      ).toEqual(cursorPosition);
    });
  });
});
