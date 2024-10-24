/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { AssociatedObjectsTable } from './associated_objects_table';
import renderer from 'react-test-renderer';
import {
  getRenderAccelerationDetailsFlyout,
  getRenderAssociatedObjectsDetailsFlyout,
  getRenderCreateAccelerationFlyout,
} from '../../../plugin';
import * as utils from '../../utils';
import { coreMock } from '../../../../../../core/public/mocks';

// Mock the imported functions
jest.mock('../../../plugin', () => ({
  getRenderAccelerationDetailsFlyout: jest.fn(),
  getRenderAssociatedObjectsDetailsFlyout: jest.fn(),
  getRenderCreateAccelerationFlyout: jest.fn(),
}));

// Mock the application with navigateToApp function
const mockApplication = {
  navigateToApp: jest.fn(),
};

const renderComponent = (props) => {
  return render(<AssociatedObjectsTable {...props} />);
};

describe('AssociatedObjectsTable', () => {
  const props = {
    datasourceName: 'Test Data Source',
    associatedObjects: [
      {
        name: 'Test Object 1',
        type: 'table',
        database: 'Test Database',
        tableName: 'Test Table 1',
      },
      {
        name: 'Test Object 2',
        type: 'covering',
        id: 'index_1',
      },
    ],
    cachedAccelerations: [
      {
        indexName: 'index_1',
      },
    ],
    handleRefresh: jest.fn(),
    application: mockApplication,
    dataSourceMDSId: '123',
  };

  it('should render correctly and match the snapshot', () => {
    const tree = renderer.create(<AssociatedObjectsTable {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render the table with associated objects', () => {
    renderComponent(props);

    expect(screen.getByText('Test Object 1')).toBeInTheDocument();
    expect(screen.getByText('Test Object 2')).toBeInTheDocument();
  });

  it('should handle clicking on an object name', async () => {
    const renderAccelerationDetailsFlyoutMock = jest.fn();
    const renderAssociatedObjectsDetailsFlyoutMock = jest.fn();
    getRenderAccelerationDetailsFlyout.mockReturnValue(renderAccelerationDetailsFlyoutMock);
    getRenderAssociatedObjectsDetailsFlyout.mockReturnValue(
      renderAssociatedObjectsDetailsFlyoutMock
    );

    renderComponent(props);

    fireEvent.click(screen.getByText('Test Object 1'));

    await waitFor(() => {
      expect(renderAssociatedObjectsDetailsFlyoutMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText('Test Object 2'));

    await waitFor(() => {
      expect(renderAccelerationDetailsFlyoutMock).toHaveBeenCalled();
    });
  });

  /* eslint-dsiable no-shadow */
  it('should filter objects based on search input', async () => {
    renderComponent(props);

    const searchInput = screen.getByPlaceholderText('Search for objects');
    fireEvent.change(searchInput, { target: { value: 'Test Object 3' } });

    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.queryByText('Test Object 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Object 2')).not.toBeInTheDocument();
    });
  });
  /* eslint-dsiable no-shadow */

  it.skip('should call the correct action when clicking on the "Discover" button', async () => {
    // TODO: need to enable MDS
    const { uiSettings } = coreMock.createSetup();
    spyOn(utils, 'getUiSettings').and.returnValue(uiSettings);

    renderComponent(props);

    const discoverButton = screen.getAllByRole('button', { name: /Discover/i })[0];
    fireEvent.click(discoverButton);

    await waitFor(() => {
      expect(mockApplication.navigateToApp).toHaveBeenCalled();
    });
  });

  it('should call the correct action when clicking on the "Discover" button without query enhancements enabled', async () => {
    renderComponent(props);

    const discoverButton = screen.getAllByRole('button', { name: /Discover/i })[0];
    expect(discoverButton).toBeDisabled();
  });
});
