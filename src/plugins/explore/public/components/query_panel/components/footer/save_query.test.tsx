/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SaveQueryButton } from './save_query';
import { legacyReducer } from '../../../../application/utils/state_management/slices/legacy/legacy_slice';

// Mock the data plugin
jest.mock('../../../../../../data/public', () => ({
  SavedQueryManagementComponent: ({ children }: any) => (
    <div data-testid="saved-query-management">{children}</div>
  ),
}));

// Mock services
const mockServices = {
  data: {
    query: {
      savedQueries: {
        getSavedQuery: jest.fn(),
        saveQuery: jest.fn(),
      },
    },
  },
  notifications: {
    toasts: {
      addSuccess: jest.fn(),
      addDanger: jest.fn(),
    },
  },
  capabilities: {
    explore: {
      saveQuery: true,
    },
  },
};

const mockTimeFilter = {
  getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
  getRefreshInterval: jest.fn(() => ({ pause: false, value: 0 })),
  setTime: jest.fn(),
  setRefreshInterval: jest.fn(),
};

const mockQuery = {
  query: 'SELECT * FROM logs',
  language: 'SQL',
};

describe('SaveQueryButton', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        legacy: legacyReducer,
      },
    });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <SaveQueryButton
          services={mockServices as any}
          showDatePicker={true}
          timeFilter={mockTimeFilter as any}
          query={mockQuery}
          onQueryExecute={jest.fn()}
          onQueryUpdate={jest.fn()}
        />
      </Provider>
    );
  };

  it('renders saved queries button', () => {
    renderComponent();
    expect(screen.getByText('Saved queries')).toBeInTheDocument();
  });

  it('renders with correct test id', () => {
    renderComponent();
    expect(screen.getByTestId('queryPanelFootersaveQueryButton')).toBeInTheDocument();
  });
});
