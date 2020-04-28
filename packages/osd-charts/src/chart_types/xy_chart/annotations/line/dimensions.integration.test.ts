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

import { MockStore } from '../../../../mocks/store';
import { MockSeriesSpec, MockAnnotationSpec, MockGlobalSpec } from '../../../../mocks/specs';
import { computeAnnotationDimensionsSelector } from '../../state/selectors/compute_annotations';
import { ScaleType } from '../../../../scales';
import { AnnotationDomainTypes } from '../../utils/specs';
import { Position } from '../../../../utils/commons';

function expectAnnotationAtPosition(
  data: Array<{ x: number; y: number }>,
  type: 'line' | 'bar',
  indexPosition: number,
  expectedLinePosition: number,
  numOfSpecs = 1,
  xScaleType: typeof ScaleType.Ordinal | typeof ScaleType.Linear | typeof ScaleType.Time = ScaleType.Linear,
) {
  const store = MockStore.default();
  const settings = MockGlobalSpec.settingsNoMargins();
  const specs = new Array(numOfSpecs).fill(0).map((d, i) => {
    return MockSeriesSpec.byTypePartial(type)({
      id: `spec_${i}`,
      xScaleType,
      data,
    });
  });
  const annotation = MockAnnotationSpec.line({
    dataValues: [
      {
        dataValue: indexPosition,
      },
    ],
  });

  MockStore.addSpecs([settings, ...specs, annotation], store);
  const annotations = computeAnnotationDimensionsSelector(store.getState());
  expect(annotations.get(annotation.id)).toEqual([
    {
      anchor: { left: expectedLinePosition, position: 'bottom', top: 100 },
      details: { detailsText: undefined, headerText: `${indexPosition}` },
      linePathPoints: {
        start: { x1: expectedLinePosition, y1: 100 },
        end: { x2: expectedLinePosition, y2: 0 },
      },
      marker: undefined,
    },
  ]);
}

describe('Render vertical line annotation within', () => {
  it.each([
    [0, 1, 12.5], // middle of 1st bar
    [1, 1, 37.5], // middle of 2nd bar
    [2, 1, 62.5], // middle of 3rd bar
    [3, 1, 87.5], // middle of 4th bar
    [1, 2, 37.5], // middle of 2nd bar
    [1, 3, 37.5], // middle of 2nd bar
  ])('a bar at position %i, %i specs, all scales', (dataValue, numOfSpecs, linePosition) => {
    const data = [
      { x: 0, y: 4 },
      { x: 1, y: 1 },
      { x: 2, y: 3 },
      { x: 3, y: 2 },
    ];
    expectAnnotationAtPosition(data, 'bar', dataValue, linePosition, numOfSpecs);
    expectAnnotationAtPosition(data, 'bar', dataValue, linePosition, numOfSpecs, ScaleType.Ordinal);
    expectAnnotationAtPosition(data, 'bar', dataValue, linePosition, numOfSpecs, ScaleType.Time);
  });

  it.each([
    [0, 1, 0], // the start of the chart
    [1, 1, 50], // the middle of the chart
    [2, 1, 100], // the end of the chart
    [1, 2, 50], // the middle of the chart
    [1, 3, 50], // the middle of the chart
  ])('line point at position %i, %i specs, linear scale', (dataValue, numOfSpecs, linePosition) => {
    const data = [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    expectAnnotationAtPosition(data, 'line', dataValue, linePosition, numOfSpecs);
  });

  it.each([
    [0, 1, 12.5], // 1st ordinal line point
    [1, 1, 37.5], // 2nd ordinal line point
    [2, 1, 62.5], // 3rd ordinal line point
    [3, 1, 87.5], // 4th ordinal line point
    [1, 2, 37.5], // 2nd ordinal line point
    [1, 3, 37.5], // 2nd ordinal line point
  ])('line point at position %i, %i specs, Ordinal scale', (dataValue, numOfSpecs, linePosition) => {
    const data = [
      { x: 0, y: 4 },
      { x: 1, y: 1 },
      { x: 2, y: 3 },
      { x: 3, y: 2 },
    ];
    expectAnnotationAtPosition(data, 'line', dataValue, linePosition, numOfSpecs, ScaleType.Ordinal);
  });

  it('histogramMode with line after the max value but before the max + minInterval ', () => {
    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins({
      xDomain: {
        min: 0,
        max: 9,
        minInterval: 1,
      },
    });
    const spec = MockSeriesSpec.histogramBar({
      xScaleType: ScaleType.Linear,
      data: [
        {
          x: 0,
          y: 1,
        },
        {
          x: 9,
          y: 20,
        },
      ],
    });
    const annotation = MockAnnotationSpec.line({
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 9.5, details: 'foo' }],
    });

    MockStore.addSpecs([settings, spec, annotation], store);
    const annotations = computeAnnotationDimensionsSelector(store.getState());
    expect(annotations.get(annotation.id)).toEqual([
      {
        anchor: {
          top: 100,
          left: 95,
          position: Position.Bottom,
        },
        linePathPoints: {
          start: { x1: 95, y1: 100 },
          end: { x2: 95, y2: 0 },
        },
        details: { detailsText: 'foo', headerText: '9.5' },
        marker: undefined,
      },
    ]);
  });
});
