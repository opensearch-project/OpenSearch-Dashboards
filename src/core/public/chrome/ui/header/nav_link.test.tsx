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

import { isActiveNavLink, createEuiListItem } from './nav_link';
import { isModifiedOrPrevented } from './nav_link';
import { ChromeNavLink } from '../../..';
import { httpServiceMock } from '../../../http/http_service.mock';
import React from 'react';

describe('isModifiedOrPrevented', () => {
  test('returns true if metaKey is pressed', () => {
    const mockEvent: Partial<React.MouseEvent<HTMLButtonElement, MouseEvent>> = {
      metaKey: true,
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      defaultPrevented: false,
    };

    expect(
      isModifiedOrPrevented(mockEvent as React.MouseEvent<HTMLButtonElement, MouseEvent>)
    ).toBe(true);
  });

  test('returns true if defaultPrevented is true', () => {
    const mockEvent: Partial<React.MouseEvent<HTMLButtonElement, MouseEvent>> = {
      metaKey: false,
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      defaultPrevented: true,
    };

    expect(
      isModifiedOrPrevented(mockEvent as React.MouseEvent<HTMLButtonElement, MouseEvent>)
    ).toBe(true);
  });

  test('returns false if no modifier keys are pressed and default is not prevented', () => {
    const mockEvent: Partial<React.MouseEvent<HTMLButtonElement, MouseEvent>> = {
      metaKey: false,
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      defaultPrevented: false,
    };

    expect(
      isModifiedOrPrevented(mockEvent as React.MouseEvent<HTMLButtonElement, MouseEvent>)
    ).toBe(false);
  });
});

describe('isActiveNavLink', () => {
  it('should return true if the currentId is "discover" and targetId is "discover"', () => {
    expect(isActiveNavLink('discover', 'discover')).toBe(true);
  });

  it('should return true if the currentId is "data-explorer" and targetId is "data-explorer"', () => {
    expect(isActiveNavLink('data-explorer', 'data-explorer')).toBe(true);
  });

  it('should return true if the currentId is "discover" and targetId is "data-explorer"', () => {
    expect(isActiveNavLink('discover', 'data-explorer')).toBe(true);
  });

  it('should return false if the currentId and targetId do not match', () => {
    expect(isActiveNavLink('dashboard', 'discover')).toBe(false);
  });
});

const mockBasePath = httpServiceMock.createSetupContract({ basePath: '/test' }).basePath;

describe('createEuiListItem', () => {
  const mockLink: Partial<ChromeNavLink> = {
    href: 'test',
    id: 'test',
    title: 'Test App',
    disabled: false,
    euiIconType: 'inputOutput',
    icon: 'testIcon',
    tooltip: 'Test App Tooltip',
  };

  const mockProps = {
    link: mockLink as ChromeNavLink,
    appId: 'test',
    basePath: mockBasePath,
    dataTestSubj: 'test-subj',
    onClick: jest.fn(),
    navigateToApp: jest.fn(),
    externalLink: false,
  };

  it('creates a list item with the correct properties', () => {
    const listItem = createEuiListItem(mockProps);
    expect(listItem).toHaveProperty('label', mockProps.link.tooltip);
    expect(listItem).toHaveProperty('href', mockProps.link.href);
    expect(listItem).toHaveProperty('data-test-subj', mockProps.dataTestSubj);
    expect(listItem).toHaveProperty('onClick');
    expect(listItem).toHaveProperty(
      'isActive',
      isActiveNavLink(mockProps.appId, mockProps.link.id)
    );
    expect(listItem).toHaveProperty('isDisabled', mockProps.link.disabled);
  });
});
