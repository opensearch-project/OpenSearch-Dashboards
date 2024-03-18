/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from './index'; // Adjust the import path as necessary
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { MockS3DataSource } from '../../../../discover/public/__mock__/index.test.mock';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';

const mockStore = configureMockStore();
const initialState = {
  metadata: { indexPattern: 'some-index-pattern-id' },
};
const store = mockStore(initialState);

jest.mock('../../../../opensearch_dashboards_react/public', () => {
  return {
    toMountPoint: jest.fn().mockImplementation((component) => () => component),
    useOpenSearchDashboards: jest.fn().mockReturnValue({
      services: {
        data: {
          indexPatterns: {},
          dataSources: {
            dataSourceService: {
              dataSources$: {
                subscribe: jest.fn((callback) => {
                  callback({
                    's3-prod-mock': new MockS3DataSource({
                      name: 's3-prod-mock',
                      type: 's3glue',
                      metadata: {},
                    }),
                  });
                  return { unsubscribe: jest.fn() };
                }),
              },
            },
          },
        },
        notifications: {
          toasts: {
            addError: jest.fn(),
          },
        },
        application: {
          navigateToUrl: jest.fn(),
        },
        overlays: {
          openConfirm: jest.fn(),
        },
      },
    }),
    withOpenSearchDashboards: () => (Component: React.ComponentClass) => (props: any) => (
      <Component {...props} />
    ),
  };
});

jest.mock('../../../../data_explorer/public', () => ({
  useTypedSelector: jest.fn(),
  useTypedDispatch: jest.fn(),
}));

describe('Sidebar Component', () => {
  it('renders without crashing', () => {
    const { container, getByTestId } = render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );
    expect(container).toBeInTheDocument();
    expect(getByTestId('dataExplorerDSSelect')).toBeInTheDocument();
  });

  it('shows title extensions on the non-index pattern data source', () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    fireEvent.click(getByTestId('comboBoxToggleListButton'));
    waitFor(() => {
      expect(getByText('Open in Log Explorer')).toBeInTheDocument();
    });
  });

  it('redirects to log explorer when clicking open-in-log-explorer button', () => {
    const history = createMemoryHistory();
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <Router history={history}>
          <Sidebar />
        </Router>
      </Provider>
    );

    fireEvent.click(getByTestId('comboBoxToggleListButton'));
    waitFor(() => {
      expect(getByText('s3-prod-mock')).toBeInTheDocument();
      fireEvent.click(getByText('s3-prod-mock'));
      expect(history.location.pathname).toContain('observability-logs#/explorer');
    });
  });
});
