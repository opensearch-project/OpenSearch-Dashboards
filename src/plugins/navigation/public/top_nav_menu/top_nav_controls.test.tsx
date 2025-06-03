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
import { mountWithIntl } from '../../../../test_utils/public/enzyme_helpers';
import { MountPointPortal } from '../../../opensearch_dashboards_react/public';
import { TopNavControlData } from './top_nav_control_data';
import { TopNavControls, TopNavControlsProps } from './top_nav_controls';

// Mock props for different scenarios
const controls: TopNavControlData[] = [
  { controlType: 'button', label: 'Button', run: jest.fn() },
  { controlType: 'link', label: 'Link', href: 'http://example.com' },
];

describe('TopNavControls', () => {
  it('renders null when controls is not provided', () => {
    const props: TopNavControlsProps = {};
    const wrapper = mountWithIntl(<TopNavControls {...props} />);
    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('renders null when controls is an empty array', () => {
    const props: TopNavControlsProps = { controls: [] };
    const wrapper = mountWithIntl(<TopNavControls {...props} />);
    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('renders TopNavControlItems when controls are provided', () => {
    const props: TopNavControlsProps = { controls };
    const wrapper = mountWithIntl(<TopNavControls {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('renders MountPointPortal when setMountPoint is provided', () => {
    const setMountPoint = jest.fn();
    const props: TopNavControlsProps = { controls, setMountPoint };
    const wrapper = mountWithIntl(<TopNavControls {...props} />);
    expect(wrapper.find(MountPointPortal)).toHaveLength(1);
  });
});
