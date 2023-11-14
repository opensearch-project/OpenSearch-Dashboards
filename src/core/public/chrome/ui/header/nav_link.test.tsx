/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isActiveNavLink, createEuiListItem } from './nav_link';
import { ChromeNavLink } from '../../..';
import { httpServiceMock } from '../../../http/http_service.mock';

describe('isActiveNavLink', () => {
  it('should return true if the appId is "discover" and linkId is "discover"', () => {
    expect(isActiveNavLink('discover', 'discover')).toBe(true);
  });

  it('should return true if the appId is "data-explorer" and linkId is "data-explorer"', () => {
    expect(isActiveNavLink('data-explorer', 'data-explorer')).toBe(true);
  });

  it('should return true if the appId is "data-explorer" and linkId is "discover"', () => {
    expect(isActiveNavLink('data-explorer', 'discover')).toBe(true);
  });

  it('should return false if the appId and linkId do not match', () => {
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
