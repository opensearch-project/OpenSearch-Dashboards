/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccessControlTab } from './access_control_tab';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DATACONNECTIONS_BASE, EDIT } from '../../../constants'; // Import the constants here

jest.mock('../../../../../opensearch_dashboards_react/public');

const mockHttpGet = jest.fn();
const mockHttpPost = jest.fn();

const mockRoles = {
  data: {
    admin: {},
    user: {},
    viewer: {},
  },
};

const mockContext = {
  services: {
    http: {
      get: mockHttpGet,
      post: mockHttpPost,
    },
  },
};

(useOpenSearchDashboards as jest.Mock).mockReturnValue(mockContext);

describe('AccessControlTab Component', () => {
  const defaultProps = {
    dataConnection: 'testDataConnection',
    connector: 'testConnector',
    properties: {},
    allowedRoles: ['admin', 'user'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpGet.mockResolvedValue(mockRoles);
  });

  it('renders in view mode by default', async () => {
    render(<AccessControlTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Access control')).toBeInTheDocument();
      expect(screen.getByText('Query access')).toBeInTheDocument();
      expect(screen.getByText('Restricted to admin,user')).toBeInTheDocument();
    });
  });

  it('switches to edit mode when Edit button is clicked', async () => {
    render(<AccessControlTab {...defaultProps} />);

    fireEvent.click(screen.getByText('Edit'));

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  it('switches back to view mode when Cancel button is clicked', async () => {
    render(<AccessControlTab {...defaultProps} />);

    fireEvent.click(screen.getByText('Edit'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
  });

  it('saves changes and switches back to view mode when Save button is clicked', async () => {
    render(<AccessControlTab {...defaultProps} />);

    fireEvent.click(screen.getByText('Edit'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Save'));
    });

    await waitFor(() => {
      expect(mockHttpPost).toHaveBeenCalledWith(`${DATACONNECTIONS_BASE}${EDIT}`, {
        body: JSON.stringify({
          name: 'testDataConnection',
          allowedRoles: ['admin', 'user'],
        }),
      });
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
  });

  it('matches snapshot', async () => {
    const { asFragment } = render(<AccessControlTab {...defaultProps} />);
    await waitFor(() => {
      expect(asFragment()).toMatchSnapshot();
    });
  });
});
