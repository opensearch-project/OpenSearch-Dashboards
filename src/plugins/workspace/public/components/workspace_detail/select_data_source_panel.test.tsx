/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceFormProvider, WorkspaceOperationType } from '../workspace_form';
import { SelectDataSourceDetailPanel } from './select_data_source_panel';
import * as utils from '../../utils';
import { IntlProvider } from 'react-intl';

const mockCoreStart = coreMock.createStart();

const workspaceObject = {
  id: 'foo_id',
  name: 'foo',
  description: 'this is my foo workspace description',
  features: ['use-case-observability', 'workspace_detail'],
};

const dataSources = [
  {
    id: 'ds-1',
    title: 'ds-1-title',
    description: 'ds-1-description',
  },
  {
    id: 'ds-2',
    title: 'ds-2-title',
    description: 'ds-2-description',
  },
];
jest.spyOn(utils, 'getDataSourcesList').mockResolvedValue(dataSources);

const defaultValues = {
  id: workspaceObject.id,
  name: workspaceObject.name,
  features: workspaceObject.features,
  selectedDataSources: [dataSources[0]],
};

const defaultProps = {
  savedObjects: {},
  assignedDataSources: [],
  detailTitle: 'Data Sources',
  isDashboardAdmin: true,
  currentWorkspace: workspaceObject,
};

const notificationToastsAddSuccess = jest.fn();
const notificationToastsAddDanger = jest.fn();

const success = jest.fn().mockResolvedValue({
  success: true,
});
const failed = jest.fn().mockResolvedValue({});

const WorkspaceDetailPage = (props: any) => {
  const { Provider } = createOpenSearchDashboardsReactContext({
    ...mockCoreStart,
    ...{
      notifications: {
        ...mockCoreStart.notifications,
        toasts: {
          ...mockCoreStart.notifications.toasts,
          addDanger: notificationToastsAddDanger,
          addSuccess: notificationToastsAddSuccess,
        },
      },
      workspaceClient: {
        update: props.action,
      },
    },
  });

  return (
    <IntlProvider locale="en">
      <WorkspaceFormProvider
        application={mockCoreStart.application}
        savedObjects={mockCoreStart.savedObjects}
        operationType={WorkspaceOperationType.Update}
        permissionEnabled={true}
        onSubmit={jest.fn()}
        defaultValues={defaultValues}
        availableUseCases={[]}
      >
        <Provider>
          <SelectDataSourceDetailPanel {...props} />
        </Provider>
      </WorkspaceFormProvider>
    </IntlProvider>
  );
};

describe('WorkspaceDetail', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders "No associated data sources" message when no data sources are assigned', () => {
    const { getByText } = render(WorkspaceDetailPage(defaultProps));
    expect(getByText('No associated data sources')).toBeInTheDocument();
    expect(
      getByText('No OpenSearch connections are available in this workspace.')
    ).toBeInTheDocument();
  });

  it('should not show Association OpenSearch Connections button when user is not OSD admin', () => {
    const { getByText, queryByText } = render(
      WorkspaceDetailPage({
        ...defaultProps,
        isDashboardAdmin: false,
      })
    );
    expect(
      getByText('Contact your administrator to associate data sources with the workspace.')
    ).toBeInTheDocument();
    expect(queryByText('Association OpenSearch Connections')).toBeNull();
  });

  it('should click on Association OpenSearch Connections button', async () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
    const { getByText } = render(
      WorkspaceDetailPage({ ...defaultProps, assignedDataSources: [dataSources[0]] })
    );
    expect(getByText('Association OpenSearch Connections')).toBeInTheDocument();

    fireEvent.click(getByText('Association OpenSearch Connections'));
    await waitFor(() => {
      expect(
        getByText('Add OpenSearch connections that will be available in the workspace.')
      ).toBeInTheDocument();
      expect(getByText('Close')).toBeInTheDocument();
      expect(getByText('Save changes')).toBeInTheDocument();
      expect(getByText('ds-2-title')).toBeInTheDocument();
    });
    fireEvent.click(getByText('Close'));
  });

  it('Association OpenSearch connections successfully', async () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
    const { getByText } = render(
      WorkspaceDetailPage({
        ...defaultProps,
        assignedDataSources: [dataSources[0]],
        action: success,
      })
    );
    expect(getByText('Association OpenSearch Connections')).toBeInTheDocument();

    fireEvent.click(getByText('Association OpenSearch Connections'));
    await waitFor(() => {
      expect(
        getByText('Add OpenSearch connections that will be available in the workspace.')
      ).toBeInTheDocument();
      expect(getByText('Close')).toBeInTheDocument();
      expect(getByText('Save changes')).toBeInTheDocument();
      expect(getByText('ds-2-title')).toBeInTheDocument();
    });
    fireEvent.click(getByText('ds-2-title'));
    fireEvent.click(getByText('Save changes'));
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
  });

  it('Association OpenSearch connections failed', async () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
    const { getByText } = render(
      WorkspaceDetailPage({
        ...defaultProps,
        assignedDataSources: [dataSources[0]],
        action: failed,
      })
    );
    expect(getByText('Association OpenSearch Connections')).toBeInTheDocument();

    fireEvent.click(getByText('Association OpenSearch Connections'));
    await waitFor(() => {
      expect(
        getByText('Add OpenSearch connections that will be available in the workspace.')
      ).toBeInTheDocument();
      expect(getByText('Close')).toBeInTheDocument();
      expect(getByText('Save changes')).toBeInTheDocument();
      expect(getByText('ds-2-title')).toBeInTheDocument();
    });
    fireEvent.click(getByText('ds-2-title'));
    fireEvent.click(getByText('Save changes'));
    await waitFor(() => {
      expect(notificationToastsAddDanger).toHaveBeenCalled();
    });
  });

  it('Remove OpenSearch connections successfully', async () => {
    const { getByText, getByTestId } = render(
      WorkspaceDetailPage({
        ...defaultProps,
        assignedDataSources: [dataSources[0]],
        action: success,
      })
    );
    expect(getByText('ds-1-title')).toBeInTheDocument();
    const button = getByTestId('workspace-detail-dataSources-table-actions-remove');
    fireEvent.click(button);
    expect(getByText('Remove OpenSearch connections')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
    fireEvent.click(button);
    fireEvent.click(getByText('Remove connections'));
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
  });

  it('Remove OpenSearch connections failed', async () => {
    const { getByText, getByTestId } = render(
      WorkspaceDetailPage({
        ...defaultProps,
        assignedDataSources: [dataSources[0]],
        action: failed,
      })
    );
    expect(getByText('ds-1-title')).toBeInTheDocument();
    const button = getByTestId('workspace-detail-dataSources-table-actions-remove');
    fireEvent.click(button);
    fireEvent.click(getByText('Remove connections'));
    await waitFor(() => {
      expect(notificationToastsAddDanger).toHaveBeenCalled();
    });
  });

  it('Remove selected OpenSearch connections successfully', async () => {
    const { getByText, queryByTestId } = render(
      WorkspaceDetailPage({
        ...defaultProps,
        assignedDataSources: [dataSources[0]],
        action: success,
      })
    );
    expect(getByText('ds-1-title')).toBeInTheDocument();
    expect(queryByTestId('workspace-detail-dataSources-table-bulkRemove')).toBeNull();
    const checkbox = screen.getAllByRole('checkbox')[0];

    // Simulate clicking the checkbox
    fireEvent.click(checkbox);
    expect(getByText('Remove 1 association(s)')).toBeInTheDocument();
    fireEvent.click(getByText('Remove 1 association(s)'));
    fireEvent.click(getByText('Remove connections'));
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
  });

  it('should handle input in the search box', async () => {
    const { getByText, queryByText } = render(
      WorkspaceDetailPage({
        ...defaultProps,
        assignedDataSources: dataSources,
      })
    );
    expect(getByText('ds-1-title')).toBeInTheDocument();
    expect(getByText('ds-2-title')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search');
    // Simulate typing in the search input
    fireEvent.change(searchInput, { target: { value: 'ds-1-title' } });
    expect(getByText('ds-1-title')).toBeInTheDocument();
    expect(queryByText('ds-2-title')).toBeNull();
  });

  it('should not allow user to remove associations when user is not OSD admin', () => {
    const { queryByTestId } = render(
      WorkspaceDetailPage({
        ...defaultProps,
        assignedDataSources: dataSources,
        isDashboardAdmin: false,
      })
    );
    expect(queryByTestId('workspace-detail-dataSources-table-action-Remove')).toBeNull();
  });
});
