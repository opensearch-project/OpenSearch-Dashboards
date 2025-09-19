/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PatternsErrorGuard } from './patterns_error_guard';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

const mockStore = configureMockStore([]);

const mockTabDefinition: TabDefinition = {
  id: 'test-patterns-tab',
  label: 'Test Patterns Tab',
  component: () => <div>Test Component</div>,
  flavor: ['logs'] as any,
  supportedLanguages: ['PPL'],
};

describe('PatternsErrorGuard', () => {
  it('renders with prepareQuery function', () => {
    const store = mockStore({
      query: {
        language: 'PPL',
      },
    });

    const customTabDefinition = {
      ...mockTabDefinition,
      prepareQuery: () => 'Custom prepared query',
    };

    render(
      <Provider store={store}>
        <PatternsErrorGuard registryTab={customTabDefinition} />
      </Provider>
    );

    expect(screen.getByText('No valid patterns found')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Custom prepared query')).toBeInTheDocument();
  });
});
