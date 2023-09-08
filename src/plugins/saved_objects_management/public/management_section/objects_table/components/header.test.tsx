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
import { shallow } from 'enzyme';
import { Header } from './header';

describe('Header', () => {
  it('should render normally', () => {
    const props = {
      onExportAll: () => {},
      onImport: () => {},
      onRefresh: () => {},
      onCopy: () => {},
      title: 'Saved Objects',
      selectedCount: 0,
      totalCount: 4,
      filteredCount: 2,
      showDuplicateAll: false,
      hideImport: false,
    };

    const component = shallow(<Header {...props} />);

    expect(component).toMatchSnapshot();
  });
});

describe('Header - workspace enabled', () => {
  it('should render `Duplicate All` button when workspace enabled', () => {
    const props = {
      onExportAll: () => {},
      onImport: () => {},
      onRefresh: () => {},
      onCopy: () => {},
      title: 'Saved Objects',
      selectedCount: 0,
      totalCount: 4,
      filteredCount: 2,
      showDuplicateAll: true,
      hideImport: false,
    };

    const component = shallow(<Header {...props} />);

    expect(component.find('EuiButtonEmpty[data-test-subj="copyObjects"]').exists()).toBe(true);
  });

  it('should hide `Import` button for application home state', () => {
    const props = {
      onExportAll: () => {},
      onImport: () => {},
      onRefresh: () => {},
      onCopy: () => {},
      title: 'Saved Objects',
      selectedCount: 0,
      totalCount: 4,
      filteredCount: 2,
      showDuplicateAll: true,
      hideImport: true,
    };

    const component = shallow(<Header {...props} />);

    expect(component.find('EuiButtonEmpty[data-test-subj="importObjects"]').exists()).toBe(false);
  });
});
