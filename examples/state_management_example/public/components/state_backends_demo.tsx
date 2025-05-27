/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  EuiPanel,
  EuiText,
  EuiTitle,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
} from '@elastic/eui';
import { CounterServiceFactory } from '../state';
import {
  useSelector,
  useAction,
  usePluginKeys,
  globalStoreServiceRegister,
} from '../../../../src/plugins/opensearch_dashboards_react/public';
import { CounterState } from '../state/counter_state';

// Plugin keys for our two counter implementations
const OBSERVABLE_COUNTER_KEY = 'observableCounter';
const REDUX_COUNTER_KEY = 'reduxCounter';

/**
 * Component that demonstrates side-by-side comparison of both Redux and Observable state backends
 */
export const StateBackendsDemo: React.FC = () => {
  // Get available plugin keys to check if we need to register services
  const pluginKeys = usePluginKeys();

  // Register our counters with the global store if they're not already registered
  useEffect(() => {
    if (!pluginKeys.includes(OBSERVABLE_COUNTER_KEY)) {
      const { actions, selectors } = CounterServiceFactory.createObservableCounter(0);
      globalStoreServiceRegister(OBSERVABLE_COUNTER_KEY, selectors, actions);
    }

    if (!pluginKeys.includes(REDUX_COUNTER_KEY)) {
      const { actions, selectors } = CounterServiceFactory.createReduxCounter();
      globalStoreServiceRegister(REDUX_COUNTER_KEY, selectors, actions);
    }
  }, [pluginKeys]);

  // Use hooks to get state and actions
  const observableCount = useSelector<CounterState, number>(
    OBSERVABLE_COUNTER_KEY,
    (state) => state?.count ?? 0
  );
  const reduxCount = useSelector<CounterState, number>(
    REDUX_COUNTER_KEY,
    (state) => state?.count ?? 0
  );

  const observableActions = useAction<CounterState>(OBSERVABLE_COUNTER_KEY);
  const reduxActions = useAction<CounterState>(REDUX_COUNTER_KEY);

  return (
    <EuiFlexGroup>
      {/* Observable-based counter */}
      <EuiFlexItem>
        <EuiPanel>
          <EuiTitle size="s">
            <h3>Observable-based Counter</h3>
          </EuiTitle>
          <EuiSpacer size="m" />
          <EuiText>
            <p>Value: {observableCount}</p>
          </EuiText>
          <EuiSpacer size="m" />
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiButton onClick={() => observableActions?.increment()} fullWidth>
                Increment
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiButton onClick={() => observableActions?.decrement()} fullWidth>
                Decrement
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiButton onClick={() => observableActions?.reset()} fullWidth>
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
            <h3>Redux-based Counter</h3>
          </EuiTitle>
          <EuiSpacer size="m" />
          <EuiText>
            <p>Value: {reduxCount}</p>
          </EuiText>
          <EuiSpacer size="m" />
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiButton onClick={() => reduxActions?.increment()} fullWidth>
                Increment
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiButton onClick={() => reduxActions?.decrement()} fullWidth>
                Decrement
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiButton onClick={() => reduxActions?.reset()} fullWidth>
                Reset
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
