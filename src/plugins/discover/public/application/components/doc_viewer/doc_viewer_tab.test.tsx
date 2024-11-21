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
import { mount } from 'enzyme';
import { DocViewerTab, DocViewerTabProps } from './doc_viewer_tab';
import { DocViewRenderProps } from '../../doc_views/doc_views_types';

test('DocViewerTab updated when getting new renderProps', () => {
  const MockComp = ({ columns }: DocViewRenderProps) => (
    <div data-test-subj="test-div">{columns![0]}</div>
  );

  const mockProps: DocViewerTabProps = {
    id: 1,
    title: 'Test1',
    component: MockComp,
    renderProps: {
      hit: { _id: '1' },
      columns: ['test1'],
    },
  };

  const wrapper = mount(<DocViewerTab {...mockProps} />);

  const div = wrapper.find({ 'data-test-subj': 'test-div' });
  expect(div.text()).toEqual('test1');

  mockProps.renderProps = { hit: { _id: '1' }, columns: ['test2'] };
  wrapper.setProps(mockProps);
  expect(div.text()).toEqual('test2');
});
