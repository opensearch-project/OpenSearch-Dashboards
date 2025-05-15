/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
  EuiButton,
  EuiHorizontalRule,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiTitle,
  EuiText,
} from '@elastic/eui';

import { CoreStart } from '../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';

import { COUNTER_SERVICE_PLUGIN_KEY, PLUGIN_ID } from '../../common';
import { useSelector, useAction } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { CounterState } from '../state';
import { CounterActions } from '../state/counter_actions';

interface StateManagementExampleAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}

export const StateManagementExampleApp = ({
  basename,
  notifications,
  http,
  navigation,
}: StateManagementExampleAppDeps) => {
  const actions = useAction<CounterState>(COUNTER_SERVICE_PLUGIN_KEY) as CounterActions;
  const count = useSelector<CounterState, number>(
    COUNTER_SERVICE_PLUGIN_KEY,
    (state) => state.count
  );

  return (
    <Router basename={basename}>
      <I18nProvider>
        <>
          <navigation.ui.TopNavMenu
            appName={PLUGIN_ID}
            showSearchBar={true}
            useDefaultBehaviors={true}
          />
          <EuiPage restrictWidth="1000px">
            <EuiPageBody component="main">
              <EuiPageContent>
                <EuiPageContentBody>
                  <EuiTitle size="l">
                    <h1>Counter Example</h1>
                  </EuiTitle>
                  <EuiHorizontalRule />
                  <EuiText>
                    <p>Current count: {count}</p>
                  </EuiText>
                  <EuiButton onClick={() => actions.increment()}>Increment</EuiButton>{' '}
                  <EuiButton onClick={() => actions.decrement()}>Decrement</EuiButton>
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
