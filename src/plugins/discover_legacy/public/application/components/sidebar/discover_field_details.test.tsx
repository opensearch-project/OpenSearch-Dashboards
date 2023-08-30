/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
// @ts-ignore
import { findTestSubject } from '@elastic/eui/lib/test';
import { act } from '@testing-library/react';
// @ts-ignore
import stubbedLogstashFields from 'fixtures/logstash_fields';
import { mountWithIntl, nextTick } from 'test_utils/enzyme_helpers';
import { DiscoverFieldDetails } from './discover_field_details';
import { coreMock } from '../../../../../../core/public/mocks';
import { IndexPatternField } from '../../../../../data/public';
import { getStubIndexPattern } from '../../../../../data/public/test_utils';

const mockGetHref = jest.fn();
const mockGetTriggerCompatibleActions = jest.fn();

jest.mock('../../../opensearch_dashboards_services', () => ({
  getUiActions: () => ({
    getTriggerCompatibleActions: mockGetTriggerCompatibleActions,
  }),
}));

const indexPattern = getStubIndexPattern(
  'logstash-*',
  (cfg: any) => cfg,
  'time',
  stubbedLogstashFields(),
  coreMock.createSetup()
);

describe('discover sidebar field details', function () {
  const defaultProps = {
    columns: [],
    details: { buckets: [], error: '', exists: 1, total: 1 },
    indexPattern,
    onAddFilter: jest.fn(),
  };

  beforeEach(() => {
    mockGetHref.mockReturnValue('/foo/bar');
    mockGetTriggerCompatibleActions.mockReturnValue([
      {
        getHref: mockGetHref,
      },
    ]);
  });

  function mountComponent(field: IndexPatternField, props?: Record<string, any>) {
    const compProps = { ...defaultProps, ...props, field };
    return mountWithIntl(<DiscoverFieldDetails {...compProps} />);
  }

  it('should render buckets if they exist', async function () {
    const visualizableField = new IndexPatternField(
      {
        name: 'bytes',
        type: 'number',
        esTypes: ['long'],
        count: 10,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
      'bytes'
    );
    const buckets = [1, 2, 3].map((n) => ({
      display: `display-${n}`,
      value: `value-${n}`,
      percent: 25,
      count: 100,
    }));
    const comp = mountComponent(visualizableField, {
      details: { ...defaultProps.details, buckets },
    });
    expect(findTestSubject(comp, 'fieldVisualizeError').length).toBe(0);
    expect(findTestSubject(comp, 'fieldVisualizeBucketContainer').length).toBe(1);
    expect(findTestSubject(comp, 'fieldVisualizeBucketContainer').children().length).toBe(
      buckets.length
    );
    // Visualize link should not be rendered until async hook update
    expect(findTestSubject(comp, 'fieldVisualizeLink').length).toBe(0);
    expect(findTestSubject(comp, 'fieldVisualize-bytes').length).toBe(0);

    // Complete async hook
    await act(async () => {
      await nextTick();
      comp.update();
    });
    expect(findTestSubject(comp, 'fieldVisualizeError').length).toBe(0);
    expect(findTestSubject(comp, 'fieldVisualizeBucketContainer').length).toBe(1);
    expect(findTestSubject(comp, 'fieldVisualizeBucketContainer').children().length).toBe(
      buckets.length
    );
    expect(findTestSubject(comp, 'fieldVisualizeLink').length).toBe(1);
    expect(findTestSubject(comp, 'fieldVisualize-bytes').length).toBe(1);
  });

  it('should only render buckets if they exist', async function () {
    const visualizableField = new IndexPatternField(
      {
        name: 'bytes',
        type: 'number',
        esTypes: ['long'],
        count: 10,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
      'bytes'
    );
    const comp = mountComponent(visualizableField);
    expect(findTestSubject(comp, 'fieldVisualizeContainer').length).toBe(1);
    expect(findTestSubject(comp, 'fieldVisualizeError').length).toBe(0);
    expect(findTestSubject(comp, 'fieldVisualizeBucketContainer').length).toBe(0);
    expect(findTestSubject(comp, 'fieldVisualizeLink').length).toBe(0);
    expect(findTestSubject(comp, 'fieldVisualize-bytes').length).toBe(0);

    await act(async () => {
      await nextTick();
      comp.update();
    });

    expect(findTestSubject(comp, 'fieldVisualizeContainer').length).toBe(1);
    expect(findTestSubject(comp, 'fieldVisualizeError').length).toBe(0);
    expect(findTestSubject(comp, 'fieldVisualizeBucketContainer').length).toBe(0);
    expect(findTestSubject(comp, 'fieldVisualizeLink').length).toBe(1);
    expect(findTestSubject(comp, 'fieldVisualize-bytes').length).toBe(1);
  });

  it('should render a details error', async function () {
    const visualizableField = new IndexPatternField(
      {
        name: 'bytes',
        type: 'number',
        esTypes: ['long'],
        count: 10,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
      'bytes'
    );
    const errText = 'Some error';
    const comp = mountComponent(visualizableField, {
      details: { ...defaultProps.details, error: errText },
    });
    expect(findTestSubject(comp, 'fieldVisualizeContainer').length).toBe(1);
    expect(findTestSubject(comp, 'fieldVisualizeBucketContainer').length).toBe(0);
    expect(findTestSubject(comp, 'fieldVisualizeError').length).toBe(1);
    expect(findTestSubject(comp, 'fieldVisualizeError').text()).toBe(errText);

    await act(async () => {
      await nextTick();
      comp.update();
    });
    expect(findTestSubject(comp, 'fieldVisualizeLink').length).toBe(1);
    expect(findTestSubject(comp, 'fieldVisualize-bytes').length).toBe(1);
  });

  it('should handle promise rejection from isFieldVisualizable', async function () {
    mockGetTriggerCompatibleActions.mockRejectedValue(new Error('Async error'));
    const visualizableField = new IndexPatternField(
      {
        name: 'bytes',
        type: 'number',
        esTypes: ['long'],
        count: 10,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
      'bytes'
    );
    const comp = mountComponent(visualizableField);

    await act(async () => {
      await nextTick();
      comp.update();
    });
    expect(findTestSubject(comp, 'fieldVisualizeLink').length).toBe(0);
    expect(findTestSubject(comp, 'fieldVisualize-bytes').length).toBe(0);
  });

  it('should handle promise rejection from getVisualizeHref', async function () {
    mockGetHref.mockRejectedValue(new Error('Async error'));
    const visualizableField = new IndexPatternField(
      {
        name: 'bytes',
        type: 'number',
        esTypes: ['long'],
        count: 10,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
      'bytes'
    );
    const comp = mountComponent(visualizableField);

    await act(async () => {
      await nextTick();
      comp.update();
    });
    expect(findTestSubject(comp, 'fieldVisualizeLink').length).toBe(0);
    expect(findTestSubject(comp, 'fieldVisualize-bytes').length).toBe(0);
  });

  it('should enable the visualize link for a number field', async function () {
    const visualizableField = new IndexPatternField(
      {
        name: 'bytes',
        type: 'number',
        esTypes: ['long'],
        count: 10,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
      'bytes'
    );
    const comp = mountComponent(visualizableField);

    await act(async () => {
      await nextTick();
      comp.update();
    });
    expect(findTestSubject(comp, 'fieldVisualizeLink').length).toBe(1);
    expect(findTestSubject(comp, 'fieldVisualize-bytes').length).toBe(1);
  });

  it('should disable the visualize link for an _id field', async function () {
    expect.assertions(1);
    const conflictField = new IndexPatternField(
      {
        name: '_id',
        type: 'string',
        esTypes: ['_id'],
        count: 0,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
      'test'
    );
    const comp = mountComponent(conflictField);

    await act(async () => {
      await nextTick();
      comp.update();
    });
    expect(findTestSubject(comp, 'fieldVisualize-_id').length).toBe(0);
  });

  it('should disable the visualize link for an unknown field', async function () {
    const unknownField = new IndexPatternField(
      {
        name: 'test',
        type: 'unknown',
        esTypes: ['double'],
        count: 0,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
      'test'
    );
    const comp = mountComponent(unknownField);

    await act(async () => {
      await nextTick();
      comp.update();
    });
    expect(findTestSubject(comp, 'fieldVisualize-test').length).toBe(0);
  });
});
