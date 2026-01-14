/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { CoreStart } from 'opensearch-dashboards/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { HeaderUserThemeMenu } from './header_user_theme_menu';

export function setupTopNavThemeButton(coreStart: CoreStart, useUpdatedAppearance: boolean) {
  coreStart.chrome.navControls[useUpdatedAppearance ? 'registerLeftBottom' : 'registerRight']({
    order: 2001,
    mount: (element: HTMLElement) => {
      const root = createRoot(element);
      root.render(
        <OpenSearchDashboardsContextProvider
          services={{
            ...coreStart,
          }}
        >
          <HeaderUserThemeMenu />
        </OpenSearchDashboardsContextProvider>
      );
      return () => root.unmount();
    },
  });
}
