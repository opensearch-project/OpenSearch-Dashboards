/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { ReactElement } from 'react';
import { shallow } from 'enzyme';
import { ChangeIndexPattern } from './change_indexpattern';
import { EuiPopover } from '@elastic/eui';

const indexPatternsIdsWithTitle = [
  { id: 'test1', title: 'Test 1' },
  { id: 'test2', title: 'Test 2' },
  { id: 'test3', title: 'Test 3' },
] as Array<{ id: string; title: string }>;

const defaultProps = {
  trigger: {
    label: indexPatternsIdsWithTitle[0].title,
  },
  indexPatternId: indexPatternsIdsWithTitle[0].id,
  indexPatternItems: indexPatternsIdsWithTitle,
  onChange: jest.fn(),
};

describe('ChangeIndexPattern', () => {
  it('fails without an exception on invalid props', async () => {
    const invalidProps = {
      trigger: null,
      indexPatternId: null,
      indexPatternItems: null,
      onChange: null,
    } as any;

    const wrapper = shallow(<ChangeIndexPattern {...invalidProps} />);
    expect(wrapper).toMatchSnapshot('""');
  });

  it('should render correctly when not open', async () => {
    const wrapper = shallow(<ChangeIndexPattern {...defaultProps} />);

    expect(wrapper).toMatchSnapshot();
  });

  it('should render correctly when open', async () => {
    const wrapper = shallow(<ChangeIndexPattern {...defaultProps} />);

    (wrapper.find(EuiPopover).prop('button') as ReactElement).props.onClick();

    expect(wrapper).toMatchSnapshot();
  });
});
