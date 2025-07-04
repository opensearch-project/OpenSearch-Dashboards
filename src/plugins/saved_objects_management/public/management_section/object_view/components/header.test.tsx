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
import { I18nProvider } from '@osd/i18n/react';
import { Header } from './header';
import { coreMock } from '../../../../../../core/public/mocks';
import { ApplicationStart } from '../../../../../../core/public';
import { NavigationPublicPluginStart } from '../../../../../navigation/public';

describe('Intro component', () => {
  const mountHeader = (props: {
    canEdit: boolean;
    canDelete: boolean;
    canViewInApp: boolean;
    type: string;
    viewUrl: string;
    onDeleteClick: () => void;
    useUpdatedUX: boolean;
    application: ApplicationStart;
    navigationUI: NavigationPublicPluginStart['ui'];
  }) =>
    mount(
      <I18nProvider>
        <Header {...props} />
      </I18nProvider>
    ).find('Header');

  const defaultProps = {
    type: 'search',
    canEdit: true,
    canDelete: true,
    canViewInApp: true,
    viewUrl: '/some-url',
    onDeleteClick: () => undefined,
    useUpdatedUX: false,
    navigationUI: ({
      // @ts-expect-error TS7031 TODO(ts-error): fixme
      HeaderControl: ({ controls }) => {
        return controls?.[0].ariaLabel ?? controls?.[0].label ?? null;
      },
    } as unknown) as NavigationPublicPluginStart['ui'],
    application: coreMock.createStart().application,
  };

  it('renders correctly', () => {
    const mounted = mountHeader({
      ...defaultProps,
    });
    expect(mounted).toMatchSnapshot();
  });

  it('displays correct title depending on canEdit', () => {
    let mounted = mountHeader({
      ...defaultProps,
      canEdit: true,
    });
    expect(mounted.find('h1').text()).toMatchInlineSnapshot(`"Edit search"`);

    mounted = mountHeader({
      ...defaultProps,
      canEdit: false,
    });
    expect(mounted.find('h1').text()).toMatchInlineSnapshot(`"View search"`);
  });

  it('displays correct title depending on type', () => {
    let mounted = mountHeader({
      ...defaultProps,
      type: 'some-type',
    });
    expect(mounted.find('h1').text()).toMatchInlineSnapshot(`"Edit some-type"`);

    mounted = mountHeader({
      ...defaultProps,
      type: 'another-type',
    });
    expect(mounted.find('h1').text()).toMatchInlineSnapshot(`"Edit another-type"`);
  });

  it('only displays delete button if canDelete is true', () => {
    let mounted = mountHeader({
      ...defaultProps,
      canDelete: true,
    });
    expect(mounted.exists(`button[data-test-subj='savedObjectEditDelete']`)).toBe(true);

    mounted = mountHeader({
      ...defaultProps,
      canDelete: false,
    });
    expect(mounted.exists(`button[data-test-subj='savedObjectEditDelete']`)).toBe(false);
  });

  it('calls onDeleteClick when clicking on the delete button', () => {
    const clickHandler = jest.fn();

    const mounted = mountHeader({
      ...defaultProps,
      canDelete: true,
      onDeleteClick: clickHandler,
    });
    expect(clickHandler).toHaveBeenCalledTimes(0);

    mounted.find(`button[data-test-subj='savedObjectEditDelete']`).simulate('click');
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('only displays view button if canViewInApp is true', () => {
    let mounted = mountHeader({
      ...defaultProps,
      canViewInApp: true,
    });
    expect(mounted.exists(`a[data-test-subj='savedObjectEditViewInApp']`)).toBe(true);

    mounted = mountHeader({
      ...defaultProps,
      canViewInApp: false,
    });
    expect(mounted.exists(`a[data-test-subj='savedObjectEditViewInApp']`)).toBe(false);
  });

  it('renders correctly when use new UX', () => {
    const mounted = mountHeader({
      ...defaultProps,
      useUpdatedUX: true,
    });
    expect(mounted).toMatchSnapshot();
  });

  it('renders correctly when use new UX and canViewInApp is true', () => {
    const mounted = mountHeader({
      ...defaultProps,
      useUpdatedUX: true,
      canViewInApp: true,
    });
    expect(mounted).toMatchSnapshot();
  });

  it('renders correctly when use new UX and canDelete is true', () => {
    const mounted = mountHeader({
      ...defaultProps,
      useUpdatedUX: true,
      canDelete: true,
    });
    expect(mounted).toMatchSnapshot();
  });
});
