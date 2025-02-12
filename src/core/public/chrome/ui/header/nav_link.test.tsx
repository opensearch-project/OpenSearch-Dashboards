/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isActiveNavLink, createEuiListItem, createRecentNavLink } from './nav_link';
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

describe('createRecentNavLink', () => {
  const mockNavLinks: ChromeNavLink[] = [
    {
      id: 'foo',
      title: 'foo',
      baseUrl: '/app/foo',
      href: '/app/foo',
    },
  ];
  const mockedNavigateToUrl = jest.fn();
  beforeEach(() => {
    mockedNavigateToUrl.mockClear();
  });
  it('create a recent link with correct properties', () => {
    const recentLink = createRecentNavLink(
      {
        id: 'foo',
        label: 'foo',
        link: '/app/foo',
      },
      mockNavLinks,
      mockBasePath,
      mockedNavigateToUrl
    );

    expect(recentLink.href).toEqual('http://localhost/test/app/foo');
  });

  it('create a recent link with workspace id', () => {
    const recentLink = createRecentNavLink(
      {
        id: 'foo',
        label: 'foo',
        link: '/app/foo',
        workspaceId: 'foo',
      },
      mockNavLinks,
      mockBasePath,
      mockedNavigateToUrl,
      true
    );

    expect(recentLink.href).toEqual('http://localhost/test/w/foo/app/foo');
  });

  it('create a recent link when workspace disabled', () => {
    const recentLink = createRecentNavLink(
      {
        id: 'foo',
        label: 'foo',
        link: '/app/foo',
        workspaceId: 'foo',
      },
      mockNavLinks,
      mockBasePath,
      mockedNavigateToUrl,
      false
    );

    expect(recentLink.href).toEqual('http://localhost/test/app/foo');
  });
});
