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
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { ReactWrapper } from 'enzyme';
import { HitsCounter, HitsCounterProps } from './hits_counter';
import { findTestSubject } from 'test_utils/helpers';
import { OpenSearchSearchHit } from '../../../doc_views/doc_views_types';

const mockRow1: OpenSearchSearchHit = {
  fields: {},
  sort: [],
  _source: {},
  _id: '1',
  _index: 'idx1',
  _type: '',
  _score: 1,
};
const mockRow2: OpenSearchSearchHit = {
  fields: {},
  sort: [],
  _source: {},
  _id: '2',
  _index: 'idx1',
  _score: 1,
  _type: '',
};
const mockRows = [mockRow1, mockRow2];

describe('hits counter', () => {
  let props: HitsCounterProps;
  let component: ReactWrapper<HitsCounterProps>;

  beforeAll(() => {
    props = {
      onResetQuery: jest.fn(),
      showResetButton: true,
      hits: 10,
      rows: mockRows,
    };
  });

  it('HitsCounter renders a button by providing the showResetButton property', () => {
    component = mountWithIntl(<HitsCounter {...props} />);
    expect(findTestSubject(component, 'resetSavedSearch').length).toBe(1);
  });

  it('HitsCounter not renders a button when the showResetButton property is false', () => {
    component = mountWithIntl(<HitsCounter {...props} showResetButton={false} />);
    expect(findTestSubject(component, 'resetSavedSearch').length).toBe(0);
  });

  it('expect to render the number of rows', () => {
    component = mountWithIntl(<HitsCounter {...props} />);
    const rows = findTestSubject(component, 'discoverQueryRowsCount');
    expect(rows.text()).toBe(props.rows?.length.toString());
  });

  it('expect to render the number of hits', () => {
    component = mountWithIntl(<HitsCounter {...props} />);
    const hits = findTestSubject(component, 'discoverQueryHits');
    expect(hits.text()).toBe(props.hits?.toString());
  });

  it('expect to render 1,899 hits if 1899 hits given', () => {
    const hitCount = 1899;
    component = mountWithIntl(<HitsCounter {...props} hits={hitCount} />);
    const hits = findTestSubject(component, 'discoverQueryHits');
    expect(hits.text()).toBe('1,899');
  });

  it('expect to render 1,899 rows if 1,899 hits given', () => {
    const rows = Array(1899).fill(mockRow1);
    component = mountWithIntl(<HitsCounter {...props} rows={rows} />);
    const rowsEl = findTestSubject(component, 'discoverQueryRowsCount');
    expect(rowsEl.text()).toBe('1,899');
  });

  it('expect to render 0 for rows if rows is empty', () => {
    component = mountWithIntl(<HitsCounter {...props} rows={[]} />);
    const rowsEl = findTestSubject(component, 'discoverQueryRowsCount');
    expect(rowsEl.text()).toBe('0');
  });

  it('does not render hits if it is undefined', () => {
    component = mountWithIntl(<HitsCounter {...props} hits={undefined} />);
    expect(component.exists('[data-test-subj="discoverQueryHits"]')).toBeFalsy();
  });

  it('should reset query', () => {
    component = mountWithIntl(<HitsCounter {...props} />);
    findTestSubject(component, 'resetSavedSearch').simulate('click');
    expect(props.onResetQuery).toHaveBeenCalled();
  });
});
