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
  EuiSpacer,
  EuiPanel,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

import { CoreStart } from '../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';

import { COUNTER_SERVICE_PLUGIN_KEY, PLUGIN_ID, REDUX_COUNTER_KEY } from '../../common';
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
  // Original Observable-based counter
  const actions = useAction<CounterState>(COUNTER_SERVICE_PLUGIN_KEY) as CounterActions;
  const count = useSelector<CounterState, number>(
    COUNTER_SERVICE_PLUGIN_KEY,
    (state) => state.count
  );

  // Redux-based counter
  const reduxActions = useAction<CounterState>(REDUX_COUNTER_KEY) as CounterActions;
  const reduxCount = useSelector<CounterState, number>(REDUX_COUNTER_KEY, (state) => state.count);

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
                  <EuiCallOut title="Multi-backend State Management" iconType="iInCircle">
                    <p>
                      This example demonstrates how BaseActions and BaseSelectors can work with both
                      Observable and Redux state backends while maintaining the same API.
                    </p>
                  </EuiCallOut>
                  <EuiSpacer size="m" />
                  <EuiHorizontalRule />

                  <EuiFlexGroup>
                    {/* Original Observable-based counter */}
                    <EuiFlexItem>
                      <EuiPanel>
                        <EuiTitle size="s">
                          <h2>Observable-based Counter</h2>
                        </EuiTitle>
                        <EuiText>
                          <p>Current count: {count}</p>
                        </EuiText>
                        <EuiSpacer size="s" />
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <EuiButton onClick={() => actions.increment()} fullWidth>
                              Increment
                            </EuiButton>
                          </EuiFlexItem>
                          <EuiFlexItem>
                            <EuiButton onClick={() => actions.decrement()} fullWidth>
                              Decrement
                            </EuiButton>
                          </EuiFlexItem>
                          <EuiFlexItem>
                            <EuiButton onClick={() => actions.reset()} fullWidth>
                              Reset
                            </EuiButton>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiPanel>
                    </EuiFlexItem>

                    {/* Redux-based counter */}
                    <EuiFlexItem>
                      <EuiPanel>
                        <EuiTitle size="s">
                          <h2>Redux-based Counter</h2>
                        </EuiTitle>
                        <EuiText>
                          <p>Current count: {reduxCount}</p>
                        </EuiText>
                        <EuiSpacer size="s" />
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <EuiButton onClick={() => reduxActions.increment()} fullWidth>
                              Increment
                            </EuiButton>
                          </EuiFlexItem>
                          <EuiFlexItem>
                            <EuiButton onClick={() => reduxActions.decrement()} fullWidth>
                              Decrement
                            </EuiButton>
                          </EuiFlexItem>
                          <EuiFlexItem>
                            <EuiButton onClick={() => reduxActions.reset()} fullWidth>
                              Reset
                            </EuiButton>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiPanel>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
