/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppMountParameters, CoreSetup, CoreStart } from 'opensearch-dashboards/public';
import React from 'react';
import ReactDOM from 'react-dom';
import { Plugin } from '../../../core/public';
import { MyTestDashboard } from './components/my_test_dashboard';

export class MyCustomThemePlugin implements Plugin {
  public setup(core: CoreSetup) {
    core.application.register({
      id: 'myCustomThemeDemo',
      title: 'My Custom Theme',
      mount: async (params: AppMountParameters) => {
        ReactDOM.render(<MyTestDashboard />, params.element);

        return () => ReactDOM.unmountComponentAtNode(params.element);
      },
    });
  }

  public start(core: CoreStart) {}

  public stop() {}
}
