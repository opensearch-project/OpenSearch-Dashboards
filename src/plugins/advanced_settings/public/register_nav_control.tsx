/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';
import { CoreStart } from 'opensearch-dashboards/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { HeaderUserThemeMenu } from './header_user_theme_menu';
import { ThemeToggleIcon } from './theme_toggle_icon';

export function setupTopNavThemeButton(coreStart: CoreStart, useUpdatedAppearance: boolean) {
  const useIconSideNav = coreStart.uiSettings.get('home:enableIconSideNav', false);

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
          {useIconSideNav ? <ThemeToggleIcon /> : <HeaderUserThemeMenu />}
        </OpenSearchDashboardsContextProvider>
      );
      return () => root.unmount();
    },
  });
}
