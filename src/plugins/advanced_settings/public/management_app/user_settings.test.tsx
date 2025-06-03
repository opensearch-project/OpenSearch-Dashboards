/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { contentManagementPluginMocks } from '../../../content_management/public';
import { setupUserSettingsPage, UserSettingsApp } from './user_settings';
import { I18nProvider } from '@osd/i18n/react';
import { coreMock } from '../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { render } from '@testing-library/react';

describe('UserSettings', () => {
  const registerPageMock = jest.fn();
  const contentManagementSetupMock = {
    ...contentManagementPluginMocks.createSetupContract(),
    registerPage: registerPageMock,
  };

  const coreStartMock = coreMock.createStart();
  const renderPageMock = jest.fn();

  renderPageMock.mockReturnValue('<div>page content</div>');

  const contentManagementStartMock = {
    ...contentManagementPluginMocks.createStartContract(),
    renderPage: renderPageMock,
  };

  const mockHeaderControl = ({ controls }) => {
    return controls?.[0].description ?? controls?.[0].renderComponent ?? null;
  };

  function renderUserSettingsApp() {
    const services = {
      ...coreStartMock,
      navigation: {
        ui: {
          HeaderControl: mockHeaderControl,
        },
      },
      contentManagement: contentManagementStartMock,
    };

    return (
      <I18nProvider>
        <OpenSearchDashboardsContextProvider services={services}>
          <UserSettingsApp />
        </OpenSearchDashboardsContextProvider>
      </I18nProvider>
    );
  }

  it('setupUserSettingsPage', () => {
    setupUserSettingsPage(contentManagementSetupMock);

    const calls = registerPageMock.mock.calls[0];
    expect(calls[0]).toMatchInlineSnapshot(`
      Object {
        "id": "user_settings",
        "sections": Array [
          Object {
            "id": "user_profile",
            "kind": "custom",
            "order": 1000,
            "render": [Function],
            "title": "User's profile",
          },
          Object {
            "id": "default_workspace",
            "kind": "custom",
            "order": 2000,
            "render": [Function],
          },
          Object {
            "id": "user_identity_role",
            "kind": "custom",
            "order": 3000,
            "render": [Function],
          },
        ],
        "title": "User Settings",
      }
    `);
  });

  it('renders', () => {
    const { container } = render(renderUserSettingsApp());
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="euiPage euiPage--paddingMedium euiPage--grow"
        >
          Configure your personal preferences.
          &lt;div&gt;page content&lt;/div&gt;
        </div>
      </div>
    `);
    expect(renderPageMock).toHaveBeenCalledWith('user_settings', { fragmentOnly: true });
    expect(coreStartMock.chrome.setBreadcrumbs).toHaveBeenCalled();
  });
});
