/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { NameRow } from './name_row';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';

describe('NameRow', () => {
  const defaultProps = {
    currentName: '',
    currentError: '',
    setErrorForForm: jest.fn(),
    setNameForRequest: jest.fn(),
  };

  const contextValues = {
    services: {
      http: {
        post: jest.fn(),
      },
    },
  };

  const renderWithProviders = (ui) => {
    return render(
      <OpenSearchDashboardsContextProvider value={contextValues}>
        {ui}
      </OpenSearchDashboardsContextProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    renderWithProviders(<NameRow {...defaultProps} />);
    expect(screen.getByLabelText('Data source name')).toBeInTheDocument();
  });

  test('displays error message when name is empty on blur', async () => {
    renderWithProviders(<NameRow {...defaultProps} />);
    const input = screen.getByPlaceholderText('Title');

    fireEvent.blur(input, { target: { value: '' } });

    await waitFor(() => {
      expect(defaultProps.setErrorForForm).toHaveBeenCalledWith('Name is a required parameter.');
    });
  });

  test('sets name for request when input is valid on blur', async () => {
    contextValues.services.http.post.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({
        jsonData: [],
      }),
    });

    renderWithProviders(<NameRow {...defaultProps} />);

    const input = screen.getByPlaceholderText('Title');

    fireEvent.change(input, { target: { value: 'validName' } });
    fireEvent.blur(input, { target: { value: 'validName' } });

    await waitFor(() => {
      expect(defaultProps.setErrorForForm).toHaveBeenCalledWith('');
      expect(defaultProps.setNameForRequest).toHaveBeenCalledWith('validName');
    });
  });
});
