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
import { applicationServiceMock } from '../../../../../../core/public/mocks';

const defaultProps = {
  onExportAll: () => {},
  onImport: () => {},
  onRefresh: () => {},
  onDuplicate: () => {},
  objectCount: 4,
  filteredCount: 2,
  useUpdatedUX: false,
  navigationUI: { HeaderControl: () => null, TopNavMenu: () => null },
  applications: applicationServiceMock.createStartContract(),
  showImportButton: true,
};

describe('Header', () => {
  it('should render normally', () => {
    const props = {
      ...defaultProps,
      showDuplicateAll: false,
    };

    const component = shallow(<Header {...props} />);

    expect(component).toMatchSnapshot();
  });

  it('should render normally when showDuplicateAll is undefined', () => {
    const props = {
      ...defaultProps,
      showDuplicateAll: undefined,
    };

    const component = shallow(<Header {...props} />);

    expect(component).toMatchSnapshot();
  });

  it('should render normally when useUpdatedUX is true', () => {
    const props = {
      ...defaultProps,
      showDuplicateAll: true,
      useUpdatedUX: true,
    };

    const component = shallow(<Header {...props} />);

    expect(component).toMatchSnapshot();
  });
});

describe('Header - workspace enabled', () => {
  it('should render `Duplicate All` button when workspace enabled', () => {
    const props = {
      ...defaultProps,
      showDuplicateAll: true,
    };

    const component = shallow(<Header {...props} />);

    expect(component.find('EuiButtonEmpty[data-test-subj="duplicateObjects"]').exists()).toBe(true);
  });

  it('should render `Import` button inside a workspace', () => {
    const props = {
      ...defaultProps,
      showImportButton: true,
    };

    const component = shallow(<Header {...props} />);

    expect(component.find('EuiButtonEmpty[data-test-subj="importObjects"]').exists()).toBe(true);

    const newUxProps = {
      ...defaultProps,
      showImportButton: true,
      useUpdatedUX: true,
    };

    const newUxComponent = shallow(<Header {...newUxProps} />);

    expect(newUxComponent).toMatchSnapshot();
  });

  it('should not render `Import` button outside a workspace', () => {
    const props = {
      ...defaultProps,
      showImportButton: false,
    };

    const component = shallow(<Header {...props} />);

    expect(component.find('EuiButtonEmpty[data-test-subj="importObjects"]').exists()).toBe(false);

    const newUxProps = {
      ...defaultProps,
      showImportButton: true,
      useUpdatedUX: false,
    };

    const newUxComponent = shallow(<Header {...newUxProps} />);

    expect(newUxComponent.find('EuiButtonEmpty[data-test-subj="importObjects"]').exists()).toBe(
      true
    );
  });
});
