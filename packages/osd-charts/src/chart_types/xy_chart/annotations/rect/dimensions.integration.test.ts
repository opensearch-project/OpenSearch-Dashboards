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
import { RectAnnotationDatum } from '../../utils/specs';
import { AnnotationRectProps } from './types';

function expectAnnotationAtPosition(
  data: Array<{ x: number; y: number }>,
  type: 'line' | 'bar' | 'histogram',
  dataValues: RectAnnotationDatum[],
  expectedRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
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
  const annotation = MockAnnotationSpec.rect({
    dataValues,
  });

  MockStore.addSpecs([settings, ...specs, annotation], store);
  const annotations = computeAnnotationDimensionsSelector(store.getState());
  const renderedAnnotations = annotations.get(annotation.id)!;
  expect(renderedAnnotations.length).toBe(1);
  const { rect } = renderedAnnotations[0] as AnnotationRectProps;
  expect(rect.x).toBeCloseTo(expectedRect.x, 3);
  expect(rect.y).toBeCloseTo(expectedRect.y, 3);
  expect(rect.width).toBeCloseTo(expectedRect.width, 3);
  expect(rect.height).toBeCloseTo(expectedRect.height, 3);
}

describe('Render rect annotation within', () => {
  it.each`
    x0   | numOfSpecs | x     | width
    ${0} | ${1}       | ${0}  | ${100}
    ${1} | ${1}       | ${25} | ${75}
    ${2} | ${1}       | ${50} | ${50}
    ${3} | ${1}       | ${75} | ${25}
    ${1} | ${2}       | ${25} | ${75}
    ${2} | ${3}       | ${50} | ${50}
  `('bars starting from $x0, $numOfSpecs specs, all scales', ({ x0, numOfSpecs, x, width }) => {
    const data = [
      { x: 0, y: 4 },
      { x: 1, y: 1 },
      { x: 2, y: 3 },
      { x: 3, y: 2 },
    ];
    const dataValues: RectAnnotationDatum[] = [
      {
        coordinates: { x0 },
      },
    ];
    const rect = { x, width, y: 0, height: 100 };
    expectAnnotationAtPosition(data, 'bar', dataValues, rect, numOfSpecs);
    expectAnnotationAtPosition(data, 'bar', dataValues, rect, numOfSpecs, ScaleType.Ordinal);
    expectAnnotationAtPosition(data, 'bar', dataValues, rect, numOfSpecs, ScaleType.Time);
  });

  it.each`
    x1   | numOfSpecs | x    | width
    ${0} | ${1}       | ${0} | ${25}
    ${1} | ${1}       | ${0} | ${50}
    ${2} | ${1}       | ${0} | ${75}
    ${3} | ${1}       | ${0} | ${100}
    ${1} | ${2}       | ${0} | ${50}
    ${2} | ${2}       | ${0} | ${75}
  `('bars starting ending at $x1, $numOfSpecs specs, all scales', ({ x1, numOfSpecs, x, width }) => {
    const data = [
      { x: 0, y: 4 },
      { x: 1, y: 1 },
      { x: 2, y: 3 },
      { x: 3, y: 2 },
    ];
    const dataValues: RectAnnotationDatum[] = [
      {
        coordinates: { x1 },
      },
    ];
    const rect = { x, width, y: 0, height: 100 };
    expectAnnotationAtPosition(data, 'bar', dataValues, rect, numOfSpecs);
    expectAnnotationAtPosition(data, 'bar', dataValues, rect, numOfSpecs, ScaleType.Ordinal);
    expectAnnotationAtPosition(data, 'bar', dataValues, rect, numOfSpecs, ScaleType.Time);
  });

  it.each`
    x0   | x1   | numOfSpecs | x     | width
    ${0} | ${0} | ${1}       | ${0}  | ${25}
    ${0} | ${1} | ${1}       | ${0}  | ${50}
    ${1} | ${3} | ${1}       | ${25} | ${75}
    ${0} | ${1} | ${2}       | ${0}  | ${50}
    ${1} | ${3} | ${3}       | ${25} | ${75}
  `('bars starting at $x0, ending at $x1, $numOfSpecs specs, all scales', ({ x0, x1, numOfSpecs, x, width }) => {
    const data = [
      { x: 0, y: 4 },
      { x: 1, y: 1 },
      { x: 2, y: 3 },
      { x: 3, y: 2 },
    ];
    const dataValues: RectAnnotationDatum[] = [
      {
        coordinates: { x0, x1 },
      },
    ];
    const rect = { x, width, y: 0, height: 100 };
    expectAnnotationAtPosition(data, 'bar', dataValues, rect, numOfSpecs);
    expectAnnotationAtPosition(data, 'bar', dataValues, rect, numOfSpecs, ScaleType.Ordinal);
    expectAnnotationAtPosition(data, 'bar', dataValues, rect, numOfSpecs, ScaleType.Time);
  });

  it.each`
    x0   | x1   | numOfSpecs | x     | width
    ${0} | ${0} | ${1}       | ${0}  | ${25}
    ${0} | ${1} | ${1}       | ${0}  | ${50}
    ${1} | ${3} | ${1}       | ${25} | ${75}
    ${0} | ${1} | ${2}       | ${0}  | ${50}
    ${1} | ${3} | ${3}       | ${25} | ${75}
  `('lines starting at $x0, ending at $x1, $numOfSpecs specs, ordinal scale', ({ x0, x1, numOfSpecs, x, width }) => {
    const data = [
      { x: 0, y: 4 },
      { x: 1, y: 1 },
      { x: 2, y: 3 },
      { x: 3, y: 2 },
    ];
    const dataValues: RectAnnotationDatum[] = [
      {
        coordinates: { x0, x1 },
      },
    ];
    const rect = { x, width, y: 0, height: 100 };
    expectAnnotationAtPosition(data, 'line', dataValues, rect, numOfSpecs, ScaleType.Ordinal);
  });

  it.each`
    x0   | x1   | numOfSpecs | x     | width
    ${0} | ${0} | ${1}       | ${0}  | ${0}
    ${0} | ${1} | ${1}       | ${0}  | ${50}
    ${1} | ${2} | ${1}       | ${50} | ${50}
    ${0} | ${2} | ${1}       | ${0}  | ${100}
    ${0} | ${1} | ${2}       | ${0}  | ${50}
    ${1} | ${2} | ${3}       | ${50} | ${50}
  `(
    'on line starting at $x0, ending at $x1, $numOfSpecs specs, continuous scale',
    ({ x0, x1, numOfSpecs, x, width }) => {
      const data = [
        { x: 0, y: 4 },
        { x: 1, y: 1 },
        { x: 2, y: 3 },
      ];
      const dataValues: RectAnnotationDatum[] = [
        {
          coordinates: { x0, x1 },
        },
      ];
      const rect = { x, width, y: 0, height: 100 };
      expectAnnotationAtPosition(data, 'line', dataValues, rect, numOfSpecs, ScaleType.Linear);
    },
  );
  it.each`
    x0   | x1   | numOfSpecs | x     | width
    ${0} | ${0} | ${1}       | ${0}  | ${0}
    ${0} | ${1} | ${1}       | ${0}  | ${25}
    ${1} | ${2} | ${1}       | ${25} | ${25}
    ${0} | ${2} | ${1}       | ${0}  | ${50}
    ${0} | ${1} | ${2}       | ${0}  | ${25}
    ${1} | ${2} | ${3}       | ${25} | ${25}
  `(
    'on histogram starting at $x0, ending at $x1, $numOfSpecs specs, continuous scale',
    ({ x0, x1, numOfSpecs, x, width }) => {
      const data = [
        { x: 0, y: 4 },
        { x: 1, y: 1 },
        { x: 2, y: 3 },
        { x: 3, y: 3 },
      ];
      const dataValues: RectAnnotationDatum[] = [
        {
          coordinates: { x0, x1 },
        },
      ];
      const rect = { x, width, y: 0, height: 100 };
      expectAnnotationAtPosition(data, 'histogram', dataValues, rect, numOfSpecs, ScaleType.Linear);
    },
  );

  it.each`
    prop    | x     | y     | width  | height
    ${'x0'} | ${50} | ${0}  | ${50}  | ${100}
    ${'x1'} | ${0}  | ${0}  | ${50}  | ${100}
    ${'y0'} | ${0}  | ${0}  | ${100} | ${75}
    ${'y1'} | ${0}  | ${75} | ${100} | ${25}
  `('expand annotation with only one prop configured:  $prop', ({ prop, x, y, width, height }) => {
    const data = [
      { x: 0, y: 4 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const dataValues: RectAnnotationDatum[] = [
      {
        coordinates: { [prop]: 1 },
      },
    ];
    const rect = { x, width, y, height };
    expectAnnotationAtPosition(data, 'line', dataValues, rect, 1, ScaleType.Linear);
  });

  it.each`
    value | prop
    ${10} | ${'y1'}
    ${-4} | ${'y0'}
    ${-4} | ${'x0'}
    ${5}  | ${'x1'}
  `('out of bound annotations for $prop', ({ prop, value }) => {
    const data = [
      { x: 0, y: 4 },
      { x: 1, y: 1 },
      { x: 2, y: 3 },
    ];
    const dataValues: RectAnnotationDatum[] = [
      {
        coordinates: { [prop]: value },
      },
    ];
    const rect = { x: 0, width: 100, y: 0, height: 100 };
    expectAnnotationAtPosition(data, 'line', dataValues, rect, 1, ScaleType.Linear);
    expectAnnotationAtPosition(data, 'bar', dataValues, rect, 1, ScaleType.Linear);
  });
});
