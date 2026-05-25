/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DirectQueryDataSourceConfigure } from './configure_direct_query_data_sources';
import { NotificationsStart } from '../../../../../../core/public';
import { act } from 'react';
import { createMemoryHistory } from 'history';
import { I18nProvider } from '@osd/i18n/react';
import { Router, Route } from 'react-router-dom';

const mockSetBreadcrumbs = jest.fn();
const mockToasts = {
  addSuccess: jest.fn(),
  addError: jest.fn(),
};
const mockHttp = {
  get: jest.fn().mockResolvedValue({ data: { role1: {}, role2: {} } }),
  post: jest.fn().mockImplementation((url: string) => {
    if (url === '/api/ppl/search') {
      return Promise.resolve({
        json: jest.fn().mockResolvedValue({ jsonData: [] }),
      });
    }
    if (url === '/api/directquery/dataconnections') {
      return Promise.resolve({});
    }
    return Promise.resolve({});
  }),
};
const mockSavedObjects = {
  client: {},
};
const mockNavigation = {};
const mockApplication = {};

const mockServices = {
  chrome: {
    setBreadcrumbs: mockSetBreadcrumbs,
  },
  setBreadcrumbs: mockSetBreadcrumbs,
  notifications: { toasts: mockToasts },
  http: mockHttp,
  savedObjects: mockSavedObjects,
  navigation: mockNavigation,
  application: mockApplication,
};

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: mockServices,
  }),
}));

describe('ConfigureDirectQueryDataSourceWithRouter', () => {
  const mockNotifications = ({ toasts: mockToasts } as unknown) as NotificationsStart;
  const mockMatch = { params: { type: 'AmazonS3AWSGlue' }, isExact: true, path: '', url: '' };
  const mockHistory = createMemoryHistory();

  const renderComponent = async (type: string) => {
    mockHistory.push(`/configure/${type}`);

    await act(async () => {
      render(
        <Router history={mockHistory}>
          <I18nProvider>
            <Route path="/configure/:type">
              <DirectQueryDataSourceConfigure
                notifications={mockNotifications}
                history={mockHistory}
                location={mockHistory.location}
                match={{ ...mockMatch, params: { type } }}
                useNewUX={false}
              />
            </Route>
          </I18nProvider>
        </Router>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('reviewSaveOrCancel')).toBeInTheDocument();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHistory.push('/');
  });

  it.each([
    ['AmazonS3AWSGlue', 'Connect to Amazon S3'],
    ['Prometheus', 'Connect to Prometheus'],
  ])('renders the component for %s data source', async (type, expectedButtonText) => {
    await renderComponent(type);

    expect(screen.getByTestId('createButton')).toHaveTextContent(expectedButtonText);
  });

  it('sets breadcrumbs', async () => {
    await renderComponent('AmazonS3AWSGlue');

    expect(mockSetBreadcrumbs).toHaveBeenCalled();
  });

  it('redirects to root path after successful data source creation', async () => {
    const user = userEvent.setup();
    const pushSpy = jest.spyOn(mockHistory, 'push');

    await renderComponent('Prometheus');

    const nameInput = await waitFor(
      () => {
        const input = document.querySelector(
          'input[data-test-subj="direct_query-data-source-name"]'
        );
        if (!input) throw new Error('Name input not found');
        return input as HTMLInputElement;
      },
      { timeout: 5000 }
    );

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.blur(nameInput);
    });

    const uriInput = await screen.findByTestId('Prometheus-URI');
    await act(async () => {
      fireEvent.change(uriInput, { target: { value: 'http://localhost:9090/' } });
      fireEvent.blur(uriInput);
    });

    await act(async () => {
      await user.click(screen.getByTestId('createButton'));
    });

    await waitFor(() => {
      expect(pushSpy).toHaveBeenCalledWith('/');
    });
  });
});
