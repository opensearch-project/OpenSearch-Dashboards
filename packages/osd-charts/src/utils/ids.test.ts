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

import { AnnotationId, AxisId, GroupId } from './ids';

describe('IDs', () => {
  test('ids should differ depending on entity', () => {
    const axisId1 = 'axisId1';
    const axisId2 = 'axisId2';
    const groupId1 = 'groupId';
    const groupId2 = 'groupId';
    const axisSeries: Map<AxisId, string> = new Map();
    axisSeries.set(axisId1, 'data1');
    axisSeries.set(axisId2, 'data2');

    const groupSeries: Map<GroupId, string> = new Map();
    groupSeries.set(groupId1, 'data1');
    groupSeries.set(groupId2, 'data2');
    const expectedAxisSeries = [
      ['axisId1', 'data1'],
      ['axisId2', 'data2'],
    ];
    const expectedGroupSeries = [['groupId', 'data2']];
    expect(expectedAxisSeries).toEqual([...axisSeries]);
    expect(expectedGroupSeries).toEqual([...groupSeries]);
  });
  test('should be able to identify annotations', () => {
    const annotationId1 = 'anno1';
    const annotationId2 = 'anno2';

    const annotations = new Map<AnnotationId, string>();
    annotations.set(annotationId1, 'annotations 1');
    annotations.set(annotationId2, 'annotations 2');

    const expectedAnnotations = [
      ['anno1', 'annotations 1'],
      ['anno2', 'annotations 2'],
    ];
    expect(expectedAnnotations).toEqual([...annotations]);
  });
});
