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
// @ts-ignore
import stubbedLogstashFields from 'fixtures/logstash_fields';
// @ts-ignore
import { mountWithIntl, nextTick } from 'test_utils/enzyme_helpers';

import { IndexPatternField } from '../../../../../data/public';

import { FieldDetailsView } from './field_details';

const mockUseIndexPatterns = jest.fn(() => ({ selected: 'mockIndexPattern' }));
const mockUseOnAddFilter = jest.fn();
jest.mock('../../utils/use', () => ({
  useIndexPatterns: jest.fn(() => mockUseIndexPatterns),
  useOnAddFilter: jest.fn(() => mockUseOnAddFilter),
}));

describe('visBuilder field details', function () {
  const defaultDetails = { buckets: [], error: '', exists: 1, total: 1 };
  function mountComponent(field: IndexPatternField, props?: Record<string, any>) {
    const compProps = { details: defaultDetails, ...props, field };
    return mountWithIntl(<FieldDetailsView {...compProps} />);
  }

  it('should render buckets if they exist', async function () {
    const field = new IndexPatternField(
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
    const comp = mountComponent(field, {
      details: { ...defaultDetails, buckets },
    });
    expect(findTestSubject(comp, 'fieldDetailsContainer').length).toBe(1);
    expect(findTestSubject(comp, 'fieldDetailsError').length).toBe(0);
    expect(findTestSubject(comp, 'fieldDetailsBucketsContainer').length).toBe(1);
    expect(findTestSubject(comp, 'fieldDetailsBucketsContainer').children().length).toBe(
      buckets.length
    );
    expect(findTestSubject(comp, 'fieldDetailsExistsLink').length).toBe(1);
  });

  it('should only render buckets if they exist', async function () {
    const field = new IndexPatternField(
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
    const comp = mountComponent(field);
    expect(findTestSubject(comp, 'fieldDetailsContainer').length).toBe(1);
    expect(findTestSubject(comp, 'fieldDetailsError').length).toBe(0);
    expect(findTestSubject(comp, 'fieldDetailsBucketsContainer').length).toBe(1);
    expect(findTestSubject(comp, 'fieldDetailsBucketsContainer').children().length).toBe(0);
    expect(findTestSubject(comp, 'fieldDetailsExistsLink').length).toBe(1);
  });

  it('should render a details error', async function () {
    const field = new IndexPatternField(
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
    const comp = mountComponent(field, {
      details: { ...defaultDetails, error: errText },
    });
    expect(findTestSubject(comp, 'fieldDetailsContainer').length).toBe(1);
    expect(findTestSubject(comp, 'fieldDetailsBucketsContainer').children().length).toBe(0);
    expect(findTestSubject(comp, 'fieldDetailsError').length).toBe(1);
    expect(findTestSubject(comp, 'fieldDetailsError').text()).toBe(errText);
    expect(findTestSubject(comp, 'fieldDetailsExistsLink').length).toBe(0);
  });

  it('should not render an exists filter link for scripted fields', async function () {
    const field = new IndexPatternField(
      {
        name: 'bytes',
        type: 'number',
        esTypes: ['long'],
        count: 10,
        scripted: true,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
      'bytes'
    );
    const comp = mountComponent(field);
    expect(findTestSubject(comp, 'fieldDetailsContainer').length).toBe(1);
    expect(findTestSubject(comp, 'fieldDetailsError').length).toBe(0);
    expect(findTestSubject(comp, 'fieldDetailsExistsLink').length).toBe(0);
  });
});
