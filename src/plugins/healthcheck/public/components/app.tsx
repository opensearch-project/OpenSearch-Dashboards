/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import { EuiPage, EuiPageBody } from '@elastic/eui';

import { CoreStart } from '../../../../core/public';
import { NavigationPublicPluginStart } from '../../../navigation/public';

import { HealthCheck } from './healthcheck';

interface HealtcheckAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}

export const HealtcheckApp = ({ basename, notifications, http, navigation }: HealtcheckAppDeps) => {
  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <Router basename={basename}>
      <I18nProvider>
        <>
          <EuiPage>
            <EuiPageBody>
              <HealthCheck />
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
