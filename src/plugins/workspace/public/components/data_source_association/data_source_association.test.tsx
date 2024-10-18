/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { coreMock } from '../../../../../core/public/mocks';
import {
  useOpenSearchDashboards,
  toMountPoint,
} from '../../../../opensearch_dashboards_react/public';
import { DataSourceAssociation } from './data_source_association';
import { AssociationDataSourceModalContent } from './association_data_source_modal';
import { DataSourceConnectionType } from 'src/plugins/workspace/common/types';
import { BehaviorSubject } from 'rxjs';
import { IWorkspaceClient } from 'opensearch-dashboards/public';

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: jest.fn(),
  toMountPoint: jest.fn(),
}));

jest.mock('./association_data_source_modal', () => ({
  AssociationDataSourceModalContent: jest.fn(),
}));

describe('<DataSourceAssociation />', () => {
  let servicesMock: ReturnType<typeof coreMock.createStart>;
  beforeEach(() => {
    servicesMock = coreMock.createStart();
    (useOpenSearchDashboards as jest.Mock).mockImplementation(() => {
      return { services: servicesMock };
    });
    (toMountPoint as jest.Mock).mockImplementation((node: React.ReactNode) => {
      return () => render(<>{node}</>);
    });
    servicesMock.overlays.openModal.mockImplementation((fn) => {
      fn();
      return { close: jest.fn(), onClose: jest.fn() };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders Associate data sources button', () => {
    render(<DataSourceAssociation excludedDataSourceIds={[]} />);
    expect(screen.getByText('Associate data sources')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('workspaceAssociateDataSourceButton'));
    expect(screen.getByText('OpenSearch data sources')).toBeInTheDocument();
    expect(screen.getByText('Direct query data sources')).toBeInTheDocument();
  });

  it('should open association modal', async () => {
    (AssociationDataSourceModalContent as jest.Mock).mockImplementation(() => (
      <div>Mocked association data source modal</div>
    ));
    render(<DataSourceAssociation excludedDataSourceIds={[]} />);
    fireEvent.click(screen.getByTestId('workspaceAssociateDataSourceButton'));
    fireEvent.click(screen.getByText('OpenSearch data sources'));
    expect(servicesMock.overlays.openModal).toHaveBeenCalled();
    expect(screen.getByText('Mocked association data source modal')).toBeInTheDocument();
  });

  it('should associate data sources successfully', async () => {
    const associateMock = jest
      .fn()
      .mockResolvedValue({ success: true, result: [{ id: 'id1' }, { id: 'id2' }] });
    servicesMock.workspaces.client$ = new BehaviorSubject<IWorkspaceClient | null>({
      associate: associateMock,
      copy: jest.fn(),
      dissociate: jest.fn(),
      ui: jest.fn(),
    });
    servicesMock.workspaces.currentWorkspaceId$ = new BehaviorSubject<string>('workspace_test');

    (AssociationDataSourceModalContent as jest.Mock).mockImplementation((props: any) => (
      <button
        onClick={() =>
          props.handleAssignDataSourceConnections([
            { id: 'id1', connectionType: DataSourceConnectionType.OpenSearchConnection },
            { id: 'id2', connectionType: DataSourceConnectionType.OpenSearchConnection },
          ])
        }
      >
        Mocked association button
      </button>
    ));

    render(<DataSourceAssociation excludedDataSourceIds={[]} />);
    fireEvent.click(screen.getByTestId('workspaceAssociateDataSourceButton'));
    fireEvent.click(screen.getByText('OpenSearch data sources'));
    fireEvent.click(screen.getByText('Mocked association button'));
    await waitFor(() => {
      expect(associateMock).toHaveBeenCalled();
      expect(servicesMock.notifications.toasts.addSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ title: '2 data sources been associated to the workspace' })
      );
    });
  });

  it('should associate data connections successfully', async () => {
    const associateMock = jest
      .fn()
      .mockResolvedValue({ success: true, result: [{ id: 'id1' }, { id: 'id2' }] });
    servicesMock.workspaces.client$ = new BehaviorSubject<IWorkspaceClient | null>({
      associate: associateMock,
      copy: jest.fn(),
      dissociate: jest.fn(),
      ui: jest.fn(),
    });
    servicesMock.workspaces.currentWorkspaceId$ = new BehaviorSubject<string>('workspace_test');

    (AssociationDataSourceModalContent as jest.Mock).mockImplementation((props: any) => (
      <button
        onClick={() =>
          props.handleAssignDataSourceConnections([
            { id: 'id1', connectionType: DataSourceConnectionType.DataConnection },
            { id: 'id2', connectionType: DataSourceConnectionType.DataConnection },
          ])
        }
      >
        Mocked association button
      </button>
    ));

    render(<DataSourceAssociation excludedDataSourceIds={[]} />);
    fireEvent.click(screen.getByTestId('workspaceAssociateDataSourceButton'));
    fireEvent.click(screen.getByText('Direct query data sources'));
    fireEvent.click(screen.getByText('Mocked association button'));
    await waitFor(() => {
      expect(associateMock).toHaveBeenCalled();
      expect(servicesMock.notifications.toasts.addSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ title: '2 data sources been associated to the workspace' })
      );
    });
  });

  it('should display error toast when associate data source failed', async () => {
    const associateMock = jest.fn().mockRejectedValue(new Error());
    servicesMock.workspaces.client$ = new BehaviorSubject<IWorkspaceClient | null>({
      associate: associateMock,
      copy: jest.fn(),
      dissociate: jest.fn(),
      ui: jest.fn(),
    });
    servicesMock.workspaces.currentWorkspaceId$ = new BehaviorSubject<string>('workspace_test');

    (AssociationDataSourceModalContent as jest.Mock).mockImplementation((props: any) => (
      <button
        onClick={() =>
          props.handleAssignDataSourceConnections([
            { id: 'id1', connectionType: DataSourceConnectionType.OpenSearchConnection },
            { id: 'id2', connectionType: DataSourceConnectionType.OpenSearchConnection },
          ])
        }
      >
        Mocked association button
      </button>
    ));

    render(<DataSourceAssociation excludedDataSourceIds={[]} />);
    fireEvent.click(screen.getByTestId('workspaceAssociateDataSourceButton'));
    fireEvent.click(screen.getByText('OpenSearch data sources'));
    fireEvent.click(screen.getByText('Mocked association button'));
    await waitFor(() => {
      expect(associateMock).toHaveBeenCalled();
      expect(servicesMock.notifications.toasts.addDanger).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Failed to associate 2 data sources to the workspace' })
      );
    });
  });

  it('should display toast when associate data source partially success', async () => {
    const associateMock = jest.fn().mockResolvedValue({
      success: true,
      // id1 failed to associate with error
      result: [{ id: 'id1', error: new Error() }, { id: 'id2' }],
    });
    servicesMock.workspaces.client$ = new BehaviorSubject<IWorkspaceClient | null>({
      associate: associateMock,
      copy: jest.fn(),
      dissociate: jest.fn(),
      ui: jest.fn(),
    });
    servicesMock.workspaces.currentWorkspaceId$ = new BehaviorSubject<string>('workspace_test');

    (AssociationDataSourceModalContent as jest.Mock).mockImplementation((props: any) => (
      <button
        onClick={() =>
          props.handleAssignDataSourceConnections([
            { id: 'id1', connectionType: DataSourceConnectionType.OpenSearchConnection },
            { id: 'id2', connectionType: DataSourceConnectionType.OpenSearchConnection },
          ])
        }
      >
        Mocked association button
      </button>
    ));

    render(<DataSourceAssociation excludedDataSourceIds={[]} />);
    fireEvent.click(screen.getByTestId('workspaceAssociateDataSourceButton'));
    fireEvent.click(screen.getByText('OpenSearch data sources'));
    fireEvent.click(screen.getByText('Mocked association button'));
    await waitFor(() => {
      expect(associateMock).toHaveBeenCalled();
      expect(servicesMock.notifications.toasts.addDanger).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Failed to associate 1 data source to the workspace' })
      );
      expect(servicesMock.notifications.toasts.addSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ title: '1 data source been associated to the workspace' })
      );
    });
  });
});
