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

import { MockAnnotationLineProps, MockAnnotationRectProps } from '../../../../mocks/annotations/annotations';
import { MockAnnotationSpec, MockGlobalSpec, MockSeriesSpec } from '../../../../mocks/specs';
import { MockStore } from '../../../../mocks/store';
import { ScaleType } from '../../../../scales/constants';
import { Position } from '../../../../utils/common';
import { AnnotationId } from '../../../../utils/ids';
import { DEFAULT_ANNOTATION_LINE_STYLE } from '../../../../utils/themes/merge_utils';
import { computeAnnotationDimensionsSelector } from '../../state/selectors/compute_annotations';
import { AnnotationDomainType } from '../../utils/specs';
import { AnnotationDimensions } from '../types';
import { AnnotationLineProps } from './types';

describe('Annotation utils', () => {
  const groupId = 'foo-group';

  const continuousBarChart = MockSeriesSpec.bar({
    xScaleType: ScaleType.Linear,
    groupId,
    data: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 10 },
      { x: 4, y: 5 },
      { x: 9, y: 10 },
    ],
  });

  const ordinalBarChart = MockSeriesSpec.bar({
    xScaleType: ScaleType.Ordinal,
    groupId,
    data: [
      { x: 'a', y: 1 },
      { x: 'b', y: 0 },
      { x: 'c', y: 10 },
      { x: 'd', y: 5 },
    ],
  });

  const verticalAxisSpec = MockGlobalSpec.axis({
    id: 'vertical_axis',
    groupId,
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Left,
    showGridLines: true,
  });

  test('should compute line annotation in x ordinal scale', () => {
    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins();

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo',
      groupId,
      domainType: AnnotationDomainType.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
    });

    const rectAnnotation = MockAnnotationSpec.rect({
      id: 'rect',
      groupId,
      dataValues: [{ coordinates: { x0: 'a', x1: 'b', y0: 3, y1: 5 } }],
    });

    MockStore.addSpecs([settings, ordinalBarChart, lineAnnotation, rectAnnotation], store);
    const dimensions = computeAnnotationDimensionsSelector(store.getState());

    const expectedDimensions = new Map<AnnotationId, AnnotationDimensions>();
    expectedDimensions.set('foo', [
      MockAnnotationLineProps.default({
        specId: 'foo',
        linePathPoints: {
          x1: 0,
          y1: 80,
          x2: 100,
          y2: 80,
        },
        datum: { dataValue: 2, details: 'foo' },
      }),
    ]);
    expectedDimensions.set('rect', [
      MockAnnotationRectProps.default({
        rect: { x: 0, y: 50, width: 50, height: 20 },
        panel: { top: 0, left: 0, width: 100, height: 100 },
        datum: { coordinates: { x0: 'a', x1: 'b', y0: 3, y1: 5 } },
      }),
    ]);

    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions also with missing axis', () => {
    const store = MockStore.default({ width: 10, height: 20, top: 0, left: 0 });
    const settings = MockGlobalSpec.settingsNoMargins();

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo',
      domainType: AnnotationDomainType.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs([settings, ordinalBarChart, lineAnnotation], store);

    const dimensions = computeAnnotationDimensionsSelector(store.getState());
    expect(dimensions.size).toEqual(1);
  });

  test('should compute line annotation dimensions for yDomain on a yScale (chartRotation 0, left axis)', () => {
    const panel = { width: 10, height: 100, top: 0, left: 0 };
    const store = MockStore.default(panel);
    const settings = MockGlobalSpec.settingsNoMargins();

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      domainType: AnnotationDomainType.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        ordinalBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());

    const expectedDimensions: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo-line',
        linePathPoints: {
          x1: 0,
          y1: 80,
          x2: 10,
          y2: 80,
        },
        panel,
        datum: { dataValue: 2, details: 'foo' },
      }),
    ];
    expect(dimensions.get('foo-line')).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for yDomain on a yScale (chartRotation 0, right axis)', () => {
    const store = MockStore.default({ width: 10, height: 100, top: 0, left: 0 });
    const settings = MockGlobalSpec.settingsNoMargins();

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      domainType: AnnotationDomainType.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        ordinalBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          position: Position.Right,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());

    const expectedDimensions: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo-line',
        linePathPoints: {
          x1: 0,
          y1: 80,
          x2: 10,
          y2: 80,
        },
        panel: { width: 10, height: 100, top: 0, left: 0 },
        datum: { dataValue: 2, details: 'foo' },
      }),
    ];
    expect(dimensions.get('foo-line')).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for yDomain on a yScale (chartRotation 90)', () => {
    const store = MockStore.default({ width: 100, height: 100, top: 0, left: 0 });
    const settings = MockGlobalSpec.settingsNoMargins({ rotation: 90 });

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      domainType: AnnotationDomainType.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        ordinalBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());

    const expectedDimensions: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo-line',
        linePathPoints: {
          x1: 0,
          y1: 80,
          x2: 100,
          y2: 80,
        },
        datum: { dataValue: 2, details: 'foo' },
      }),
    ];
    expect(dimensions.get('foo-line')).toEqual(expectedDimensions);
  });

  test('should not compute line annotation dimensions for yDomain if no corresponding yScale', () => {
    const store = MockStore.default({ width: 100, height: 100, top: 0, left: 0 });
    const settings = MockGlobalSpec.settingsNoMargins({ rotation: 0 });

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      groupId: 'other-group',
      domainType: AnnotationDomainType.YDomain,
      dataValues: [],
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        ordinalBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());

    expect(dimensions.size).toEqual(0);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 0, ordinal scale)', () => {
    const store = MockStore.default({ width: 100, height: 100, top: 0, left: 0 });
    const settings = MockGlobalSpec.settingsNoMargins({ rotation: 0 });

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      groupId: 'other-group',
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: 'a', details: 'foo' }],
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        ordinalBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          position: Position.Bottom,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());

    const expectedDimensions: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo-line',
        linePathPoints: {
          x1: 12.5,
          y1: 0,
          x2: 12.5,
          y2: 100,
        },
        datum: { dataValue: 'a', details: 'foo' },
      }),
    ];
    expect(dimensions.get('foo-line')).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 0, continuous scale, top axis)', () => {
    const store = MockStore.default({ width: 100, height: 100, top: 0, left: 0 });
    const settings = MockGlobalSpec.settingsNoMargins({ rotation: 0 });

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      groupId: 'other-group',
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        continuousBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          position: Position.Top,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());
    const expectedDimensions: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo-line',
        linePathPoints: {
          x1: 25,
          y1: 0,
          x2: 25,
          y2: 100,
        },
        datum: { dataValue: 2, details: 'foo' },
      }),
    ];
    expect(dimensions.get('foo-line')).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 0, continuous scale, bottom axis)', () => {
    const store = MockStore.default({ width: 100, height: 100, top: 0, left: 0 });
    const settings = MockGlobalSpec.settingsNoMargins({ rotation: 0 });

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      groupId: 'other-group',
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        continuousBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          position: Position.Bottom,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());
    const expectedDimensions: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo-line',
        linePathPoints: {
          x1: 25,
          y1: 0,
          x2: 25,
          y2: 100,
        },
        datum: { dataValue: 2, details: 'foo' },
      }),
    ];
    expect(dimensions.get('foo-line')).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain on a xScale (chartRotation 90, ordinal scale)', () => {
    const store = MockStore.default({ width: 100, height: 100, top: 0, left: 0 });
    const settings = MockGlobalSpec.settingsNoMargins({ rotation: 0 });

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      groupId: 'other-group',
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: 'a', details: 'foo' }],
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        ordinalBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          position: Position.Top,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());
    const expectedDimensions: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo-line',
        linePathPoints: {
          x1: 12.5,
          y1: 0,
          x2: 12.5,
          y2: 100,
        },
        datum: { dataValue: 'a', details: 'foo' },
      }),
    ];
    expect(dimensions.get('foo-line')).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain on a xScale (chartRotation 90, continuous scale)', () => {
    const panel = { width: 100, height: 50, top: 0, left: 0 };
    const store = MockStore.default(panel);
    const settings = MockGlobalSpec.settingsNoMargins({ rotation: 90 });

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      groupId: 'other-group',
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        continuousBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          position: Position.Top,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());
    const expectedDimensions: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo-line',
        linePathPoints: {
          x1: 12.5,
          y1: 0,
          x2: 12.5,
          y2: 100,
        },
        panel,
        datum: { dataValue: 2, details: 'foo' },
      }),
    ];
    expect(dimensions.get('foo-line')).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain on a xScale (chartRotation -90, continuous scale)', () => {
    const panel = { width: 100, height: 50, top: 0, left: 0 };
    const store = MockStore.default(panel);
    const settings = MockGlobalSpec.settingsNoMargins({ rotation: -90 });

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      groupId: 'other-group',
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        continuousBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          position: Position.Top,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());
    const expectedDimensions: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo-line',
        linePathPoints: {
          x1: 12.5,
          y1: 0,
          x2: 12.5,
          y2: 100,
        },
        panel,
        datum: { dataValue: 2, details: 'foo' },
      }),
    ];
    expect(dimensions.get('foo-line')).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 180, continuous scale, top axis)', () => {
    const store = MockStore.default({ width: 100, height: 100, top: 0, left: 0 });
    const settings = MockGlobalSpec.settingsNoMargins({ rotation: 180 });

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      groupId: 'other-group',
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        continuousBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          position: Position.Top,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());
    const expectedDimensions: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo-line',
        linePathPoints: {
          x1: 25,
          y1: 0,
          x2: 25,
          y2: 100,
        },
        datum: { dataValue: 2, details: 'foo' },
      }),
    ];
    expect(dimensions.get('foo-line')).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 180, continuous scale, bottom axis)', () => {
    const panel = { width: 100, height: 50, top: 0, left: 0 };
    const store = MockStore.default(panel);
    const settings = MockGlobalSpec.settingsNoMargins({ rotation: 180 });

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo-line',
      groupId: 'other-group',
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs(
      [
        settings,
        continuousBarChart,
        lineAnnotation,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          position: Position.Bottom,
          hide: true,
        }),
      ],
      store,
    );

    const dimensions = computeAnnotationDimensionsSelector(store.getState());
    const expectedDimensions: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        specId: 'foo-line',
        linePathPoints: {
          x1: 25,
          y1: 0,
          x2: 25,
          y2: 50,
        },
        panel,
        datum: { dataValue: 2, details: 'foo' },
      }),
    ];
    expect(dimensions.get('foo-line')).toEqual(expectedDimensions);
  });
  test('should not compute annotation line values for invalid data values or AnnotationSpec.hideLines', () => {
    let store = MockStore.default({ width: 100, height: 100, top: 0, left: 0 });
    const settings = MockGlobalSpec.settingsNoMargins({ rotation: 180 });

    const annotationId = 'foo-line';
    const invalidXLineAnnotation = MockAnnotationSpec.line({
      id: annotationId,
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: 'e', details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    MockStore.addSpecs([settings, continuousBarChart, invalidXLineAnnotation], store);
    const emptyXDimensions = computeAnnotationDimensionsSelector(store.getState());

    expect(emptyXDimensions.get('foo-line')).toHaveLength(0);

    const invalidStringXLineAnnotation = MockAnnotationSpec.line({
      id: annotationId,
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: '', details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    store = MockStore.default({ width: 100, height: 50, top: 0, left: 0 });
    MockStore.addSpecs([settings, continuousBarChart, invalidStringXLineAnnotation], store);

    const invalidStringXDimensions = computeAnnotationDimensionsSelector(store.getState());

    expect(invalidStringXDimensions.get('foo-line')).toHaveLength(0);

    const outOfBoundsXLineAnnotation = MockAnnotationSpec.line({
      id: annotationId,
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: -999, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    store = MockStore.default({ width: 100, height: 50, top: 0, left: 0 });
    MockStore.addSpecs([settings, continuousBarChart, outOfBoundsXLineAnnotation], store);

    const emptyOutOfBoundsXDimensions = computeAnnotationDimensionsSelector(store.getState());

    expect(emptyOutOfBoundsXDimensions.get('foo-line')).toHaveLength(0);

    const invalidYLineAnnotation = MockAnnotationSpec.line({
      id: annotationId,
      domainType: AnnotationDomainType.YDomain,
      dataValues: [{ dataValue: 'e', details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    store = MockStore.default({ width: 100, height: 50, top: 0, left: 0 });
    MockStore.addSpecs([settings, continuousBarChart, invalidYLineAnnotation], store);

    const emptyOutOfBoundsYDimensions = computeAnnotationDimensionsSelector(store.getState());

    expect(emptyOutOfBoundsYDimensions.get('foo-line')).toHaveLength(0);

    const outOfBoundsYLineAnnotation = MockAnnotationSpec.line({
      id: annotationId,
      domainType: AnnotationDomainType.YDomain,
      dataValues: [{ dataValue: -999, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    store = MockStore.default({ width: 100, height: 50, top: 0, left: 0 });
    MockStore.addSpecs([settings, continuousBarChart, outOfBoundsYLineAnnotation], store);

    const outOfBoundsYAnn = computeAnnotationDimensionsSelector(store.getState());

    expect(outOfBoundsYAnn.get('foo-line')).toHaveLength(0);

    const invalidStringYLineAnnotation = MockAnnotationSpec.line({
      id: annotationId,
      domainType: AnnotationDomainType.YDomain,
      dataValues: [{ dataValue: '', details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    });

    store = MockStore.default({ width: 100, height: 50, top: 0, left: 0 });
    MockStore.addSpecs([settings, continuousBarChart, invalidStringYLineAnnotation], store);

    const invalidStringYDimensions = computeAnnotationDimensionsSelector(store.getState());

    expect(invalidStringYDimensions.get('foo-line')).toHaveLength(0);

    const validHiddenAnnotation = MockAnnotationSpec.line({
      id: annotationId,
      domainType: AnnotationDomainType.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
      hideLines: true,
    });

    store = MockStore.default({ width: 100, height: 50, top: 0, left: 0 });
    MockStore.addSpecs([settings, continuousBarChart, validHiddenAnnotation], store);

    const hiddenAnnotationDimensions = computeAnnotationDimensionsSelector(store.getState());

    expect(hiddenAnnotationDimensions.size).toBe(0);
  });
});
