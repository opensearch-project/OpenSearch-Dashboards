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

import { MockAnnotationRectProps } from '../../../../mocks/annotations/annotations';
import { Dimensions } from '../../../../utils/dimensions';
import { AnnotationType } from '../../utils/specs';
import { AnnotationTooltipState } from '../types';
import { getRectAnnotationTooltipState } from './tooltip';
import { AnnotationRectProps } from './types';

describe('Rect annotation tooltip', () => {
  test('should compute tooltip state for rect annotation', () => {
    const chartDimensions: Dimensions = {
      width: 10,
      height: 20,
      top: 5,
      left: 15,
    };
    const cursorPosition = { x: 18, y: 9 };
    const annotationRects: AnnotationRectProps[] = [
      MockAnnotationRectProps.default({
        rect: { x: 2, y: 3, width: 3, height: 5 },
        panel: { top: 0, left: 0, width: 10, height: 20 },
        datum: { coordinates: { x0: 0, x1: 10, y0: 0, y1: 10 } },
      }),
    ];

    const visibleTooltip = getRectAnnotationTooltipState(cursorPosition, annotationRects, 0, chartDimensions);
    const expectedVisibleTooltipState: AnnotationTooltipState = {
      isVisible: true,
      annotationType: AnnotationType.Rectangle,
      anchor: {
        top: cursorPosition.y,
        left: cursorPosition.x,
      },
      datum: { coordinates: { x0: 0, x1: 10, y0: 0, y1: 10 } },
    };

    expect(visibleTooltip).toEqual(expectedVisibleTooltipState);
  });
});
