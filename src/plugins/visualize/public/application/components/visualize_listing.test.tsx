/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import { VisualizeListing } from './visualize_listing';

let mockPathname = '/';
let mockServices: any;
const mockTableListView = jest.fn(() => null);
const mockHeaderControl = jest.fn(() => null);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: mockPathname }),
}));

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: () => ({ services: mockServices }),
  TableListView: (props: any) => mockTableListView(props),
}));

jest.mock('@osd/i18n/react', () => ({
  ...jest.requireActual('@osd/i18n/react'),
  FormattedMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage,
}));

describe('VisualizeListing', () => {
  beforeEach(() => {
    mockPathname = '/';
    mockServices = {
      application: {
        capabilities: {
          dashboard: {
            showWriteControls: false,
          },
        },
        navigateToApp: jest.fn(),
        setAppRightControls: jest.fn(),
      },
      chrome: {
        docTitle: {
          change: jest.fn(),
        },
        setBreadcrumbs: jest.fn(),
      },
      history: {
        push: jest.fn(),
        replace: jest.fn(),
      },
      navigation: {
        ui: {
          HeaderControl: mockHeaderControl,
        },
      },
      savedObjects: {
        client: {
          delete: jest.fn(),
        },
      },
      savedObjectsPublic: {
        settings: {
          getListingLimit: jest.fn(() => 100),
          getPerPage: jest.fn(() => 10),
        },
      },
      savedVisualizations: {
        findListItems: jest.fn(),
      },
      toastNotifications: {
        addError: jest.fn(),
      },
      uiSettings: {
        get: jest.fn((key: string) => key === 'home:useNewHomePage'),
      },
      visualizations: {
        showNewVisModal: jest.fn(() => jest.fn()),
      },
      visualizeCapabilities: {
        delete: false,
        save: false,
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not expose visualization creation controls when dashboard write controls are hidden', () => {
    render(<VisualizeListing />);

    expect(mockHeaderControl).not.toHaveBeenCalled();

    const tableListViewProps = mockTableListView.mock.calls[0][0];
    expect(tableListViewProps.createItem).toBeUndefined();

    const { queryByTestId } = render(tableListViewProps.noItemsFragment);
    expect(queryByTestId('createVisualizationPromptButton')).not.toBeInTheDocument();
  });

  it('does not open the visualization creation modal from a direct URL when write controls are hidden', () => {
    mockPathname = '/new';

    render(<VisualizeListing />);

    expect(mockServices.visualizations.showNewVisModal).not.toHaveBeenCalled();
    expect(mockServices.history.replace).toHaveBeenCalledWith('/');
  });

  it('keeps visualization creation controls for users with write access', () => {
    mockServices.application.capabilities.dashboard.showWriteControls = true;
    mockServices.visualizeCapabilities = {
      delete: true,
      save: true,
    };

    render(<VisualizeListing />);

    expect(mockHeaderControl).toHaveBeenCalled();

    const tableListViewProps = mockTableListView.mock.calls[0][0];
    expect(tableListViewProps.createItem).toEqual(expect.any(Function));

    const { getByTestId } = render(tableListViewProps.noItemsFragment);
    expect(getByTestId('createVisualizationPromptButton')).toBeInTheDocument();
  });
});
