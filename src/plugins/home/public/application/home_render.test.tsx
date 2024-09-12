/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_NAV_GROUPS } from '../../../../core/public';
import {
  HOME_CONTENT_AREAS,
  SEARCH_OVERVIEW_PAGE_ID,
  OBSERVABILITY_OVERVIEW_PAGE_ID,
  SECURITY_ANALYTICS_OVERVIEW_PAGE_ID,
} from '../../../../plugins/content_management/public';
import { contentManagementPluginMocks } from '../../../../plugins/content_management/public/mocks';
import { registerUseCaseCard } from './components/use_case_card';
import { initHome } from './home_render';

import {
  WHATS_NEW_CONFIG,
  LEARN_OPENSEARCH_CONFIG,
  registerHomeListCard,
} from './components/home_list_card';

jest.mock('./components/use_case_card', () => ({
  registerUseCaseCard: jest.fn(),
}));

jest.mock('./components/home_list_card', () => ({
  registerHomeListCard: jest.fn(),
}));

describe('initHome', () => {
  const registerContentProviderFn = jest.fn();
  const contentManagementStartMock = {
    ...contentManagementPluginMocks.createStartContract(),
    registerContentProvider: registerContentProviderFn,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register use case cards when workspace is enabled', () => {
    const coreMock = {
      createStart: jest.fn(() => ({
        application: {
          capabilities: {
            workspaces: {
              enabled: false,
            },
          },
          navigateToApp: jest.fn(),
        },
      })),
    };
    const core = coreMock.createStart();

    initHome(contentManagementStartMock, core);

    expect(registerUseCaseCard).toHaveBeenCalledTimes(3);

    expect(registerUseCaseCard).toHaveBeenCalledWith(contentManagementStartMock, core, {
      id: DEFAULT_NAV_GROUPS.observability.id,
      order: 1,
      description: DEFAULT_NAV_GROUPS.observability.description,
      title: DEFAULT_NAV_GROUPS.observability.title,
      target: HOME_CONTENT_AREAS.GET_STARTED,
      icon: DEFAULT_NAV_GROUPS.observability.icon ?? '',
      navigateAppId: OBSERVABILITY_OVERVIEW_PAGE_ID,
    });

    expect(registerUseCaseCard).toHaveBeenCalledWith(contentManagementStartMock, core, {
      id: DEFAULT_NAV_GROUPS.search.id,
      order: 2,
      description: DEFAULT_NAV_GROUPS.search.description,
      title: DEFAULT_NAV_GROUPS.search.title,
      target: HOME_CONTENT_AREAS.GET_STARTED,
      icon: DEFAULT_NAV_GROUPS.search.icon ?? '',
      navigateAppId: SEARCH_OVERVIEW_PAGE_ID,
    });

    expect(registerUseCaseCard).toHaveBeenCalledWith(contentManagementStartMock, core, {
      id: DEFAULT_NAV_GROUPS['security-analytics'].id,
      order: 3,
      description: DEFAULT_NAV_GROUPS['security-analytics'].description,
      title: DEFAULT_NAV_GROUPS['security-analytics'].title,
      target: HOME_CONTENT_AREAS.GET_STARTED,
      icon: DEFAULT_NAV_GROUPS['security-analytics'].icon ?? '',
      navigateAppId: SECURITY_ANALYTICS_OVERVIEW_PAGE_ID,
    });
  });

  it('should not register use case cards when workspace is disabled', () => {
    const coreMock = {
      createStart: jest.fn(() => ({
        application: {
          capabilities: {
            workspaces: {
              enabled: true,
            },
          },
        },
      })),
    };
    const core = coreMock.createStart();
    initHome(contentManagementStartMock, core);
    expect(registerUseCaseCard).not.toHaveBeenCalled();
  });

  it('should register home list cards correctly', () => {
    const coreMock = {
      createStart: jest.fn(() => ({
        application: {
          capabilities: {
            workspaces: {
              enabled: false,
            },
          },
        },
      })),
    };
    const core = coreMock.createStart();
    initHome(contentManagementStartMock, core);

    expect(registerHomeListCard).toHaveBeenCalledTimes(2);

    expect(registerHomeListCard).toHaveBeenCalledWith(contentManagementStartMock, {
      id: 'whats_new',
      order: 10,
      config: WHATS_NEW_CONFIG,
      target: HOME_CONTENT_AREAS.SERVICE_CARDS,
      width: 16,
    });

    expect(registerHomeListCard).toHaveBeenCalledWith(contentManagementStartMock, {
      id: 'learn_opensearch_new',
      order: 11,
      config: LEARN_OPENSEARCH_CONFIG,
      target: HOME_CONTENT_AREAS.SERVICE_CARDS,
      width: 16,
    });
  });
});
