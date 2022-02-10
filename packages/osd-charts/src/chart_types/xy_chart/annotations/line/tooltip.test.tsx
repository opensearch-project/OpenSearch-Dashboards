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

import { mount } from 'enzyme';
import React from 'react';

import { ChartType } from '../../..';
import { Chart } from '../../../../components/chart';
import { MockAnnotationLineProps, MockAnnotationRectProps } from '../../../../mocks/annotations/annotations';
import { ScaleType } from '../../../../scales/constants';
import { SpecType } from '../../../../specs/constants';
import { Settings } from '../../../../specs/settings';
import { Rotation } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { AnnotationId } from '../../../../utils/ids';
import { LineAnnotation } from '../../specs/line_annotation';
import { LineSeries } from '../../specs/line_series';
import { AnnotationDomainType, AnnotationType, RectAnnotationSpec } from '../../utils/specs';
import { computeRectAnnotationTooltipState } from '../tooltip';
import { AnnotationDimensions } from '../types';
import { AnnotationLineProps } from './types';

describe('Annotation tooltips', () => {
  describe('Line annotation tooltips', () => {
    test('should show tooltip on mouseenter', () => {
      const wrapper = mount(
        <Chart size={[100, 100]}>
          <Settings
            theme={{
              chartMargins: { left: 0, right: 0, top: 0, bottom: 0 },
              chartPaddings: { left: 0, right: 0, top: 0, bottom: 0 },
            }}
          />
          <LineSeries
            id="line"
            data={[
              { x: 0, y: 1 },
              { x: 2, y: 3 },
              { x: 4, y: 5 },
            ]}
            xScaleType={ScaleType.Linear}
          />
          <LineAnnotation
            id="foo"
            domainType={AnnotationDomainType.YDomain}
            dataValues={[{ dataValue: 2, details: 'foo' }]}
            marker={<div style={{ width: '10px', height: '10px' }} />}
          />
        </Chart>,
      );
      const annotation = wrapper.find('.echAnnotation');
      expect(annotation).toHaveLength(1);
      expect(wrapper.find('.echAnnotation__tooltip')).toHaveLength(0);
      annotation.simulate('mouseenter');
      const header = wrapper.find('.echAnnotation__header');
      expect(header).toHaveLength(1);
      expect(header.text()).toEqual('2');
      expect(wrapper.find('.echAnnotation__details').text()).toEqual('foo');
      annotation.simulate('mouseleave');
      expect(wrapper.find('.echAnnotation__header')).toHaveLength(0);
    });

    test('should now show tooltip if hidden', () => {
      const wrapper = mount(
        <Chart size={[100, 100]}>
          <Settings
            theme={{
              chartMargins: { left: 0, right: 0, top: 0, bottom: 0 },
              chartPaddings: { left: 0, right: 0, top: 0, bottom: 0 },
            }}
          />
          <LineSeries
            id="line"
            data={[
              { x: 0, y: 1 },
              { x: 2, y: 3 },
              { x: 4, y: 5 },
            ]}
            xScaleType={ScaleType.Linear}
          />
          <LineAnnotation
            id="foo"
            domainType={AnnotationDomainType.YDomain}
            dataValues={[{ dataValue: 2, details: 'foo' }]}
            marker={<div style={{ width: '10px', height: '10px' }} />}
            hideTooltips
          />
        </Chart>,
      );
      const annotation = wrapper.find('.echAnnotation');
      expect(wrapper.find('.echAnnotation__tooltip')).toHaveLength(0);
      annotation.simulate('mouseenter');
      expect(wrapper.find('.echAnnotation__header')).toHaveLength(0);
    });
  });

  test('should compute the tooltip state for rect annotation', () => {
    const groupId = 'foo-group';
    const chartDimensions: Dimensions = {
      width: 10,
      height: 20,
      top: 5,
      left: 15,
    };
    const annotationLines: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo',
        linePathPoints: {
          x1: 1,
          y1: 2,
          x2: 3,
          y2: 4,
        },
        markers: [
          {
            icon: React.createElement('div'),
            color: 'red',
            dimension: { width: 10, height: 10 },
            position: { top: 0, left: 0 },
          },
        ],
      }),
    ];
    const chartRotation: Rotation = 0;

    const annotationDimensions = new Map<AnnotationId, AnnotationDimensions>();
    annotationDimensions.set('foo', annotationLines);

    // rect annotation tooltip
    const annotationRectangle: RectAnnotationSpec = {
      chartType: ChartType.XYAxis,
      specType: SpecType.Annotation,
      id: 'rect',
      groupId,
      annotationType: AnnotationType.Rectangle,
      dataValues: [{ coordinates: { x0: 1, x1: 2, y0: 3, y1: 5 } }],
    };

    const rectAnnotations: RectAnnotationSpec[] = [];
    rectAnnotations.push(annotationRectangle);

    annotationDimensions.set(annotationRectangle.id, [
      MockAnnotationRectProps.default({ rect: { x: 2, y: 3, width: 3, height: 5 } }),
    ]);

    const rectTooltipState = computeRectAnnotationTooltipState(
      { x: 18, y: 9 },
      annotationDimensions,
      rectAnnotations,
      chartRotation,
      chartDimensions,
    );

    expect(rectTooltipState).toMatchObject({
      isVisible: true,
      annotationType: AnnotationType.Rectangle,
      anchor: {
        x: 18,
        y: 9,
        width: 0,
        height: 0,
      },
    });
    annotationRectangle.hideTooltips = true;

    const rectHideTooltipState = computeRectAnnotationTooltipState(
      { x: 3, y: 4 },
      annotationDimensions,
      rectAnnotations,
      chartRotation,
      chartDimensions,
    );

    expect(rectHideTooltipState).toBe(null);
  });
});
