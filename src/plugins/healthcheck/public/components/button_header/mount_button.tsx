/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { CoreStart } from 'opensearch-dashboards/public';
import { HealthCheckNavButton } from './health_check_nav_button';

export const mountButton = (core: CoreStart) => {
  const isNewHomePageEnable = core.uiSettings.get('home:useNewHomePage');

  core.chrome.navControls[isNewHomePageEnable ? 'registerLeftBottom' : 'registerRight']({
    order: 100,
    mount: (el: HTMLElement) => {
      ReactDOM.render(
        <HealthCheckNavButton
          coreStart={core}
          status$={core.healthCheck.status$}
          fetch={core.healthCheck.client.internal.fetch}
          getConfig={core.healthCheck.getConfig}
        />,
        el
      );

      return () => {
        ReactDOM.unmountComponentAtNode(el);
      };
    },
  });
};
