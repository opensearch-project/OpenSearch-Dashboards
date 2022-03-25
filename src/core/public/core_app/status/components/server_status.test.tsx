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
import { ServerStatus } from './server_status';
import { FormattedStatus } from '../lib';
import { mountWithIntl } from 'test_utils/enzyme_helpers';

const getStatus = (parts: Partial<FormattedStatus['state']> = {}): FormattedStatus['state'] => ({
  id: 'green',
  title: 'Green',
  uiColor: 'secondary',
  message: '',
  ...parts,
});

describe('ServerStatus', () => {
  it('renders correctly for green state', () => {
    const status = getStatus();
    const component = mountWithIntl(<ServerStatus serverState={status} name="My Computer" />);
    expect(component.find('EuiTitle').text()).toMatchInlineSnapshot(
      `"OpenSearch Dashboards status is Green"`
    );
    expect(component.find('EuiBadge')).toMatchSnapshot();
  });

  it('renders correctly for red state', () => {
    const status = getStatus({
      id: 'red',
      title: 'Red',
    });
    const component = mountWithIntl(<ServerStatus serverState={status} name="My Computer" />);
    expect(component.find('EuiTitle').text()).toMatchInlineSnapshot(
      `"OpenSearch Dashboards status is Red"`
    );
    expect(component.find('EuiBadge')).toMatchSnapshot();
  });

  it('displays the correct `name`', () => {
    let component = mountWithIntl(<ServerStatus serverState={getStatus()} name="Localhost" />);
    expect(component.find('EuiText').text()).toMatchInlineSnapshot(`"Localhost"`);

    component = mountWithIntl(
      <ServerStatus serverState={getStatus()} name="OpenSearchDashboards" />
    );
    expect(component.find('EuiText').text()).toMatchInlineSnapshot(`"OpenSearchDashboards"`);
  });
});
