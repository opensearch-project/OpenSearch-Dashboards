/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getNoItemsMessage } from './get_no_items_message';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { httpServiceMock } from '../../../../../core/public/mocks';
import { BrowserRouter as Router } from 'react-router-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';

const mockBasePath = httpServiceMock.createSetupContract({ basePath: '/test' }).basePath;
const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

describe('dashboard listing table with no item', () => {
  test('and no write controls', () => {
    const component = mountWithIntl(getNoItemsMessage(true, jest.fn(), mockBasePath, 'wk1'));

    expect(component).toMatchSnapshot();
  });

  test('and with write controls', async () => {
    const basePath = 'wk1';
    const component = mountWithIntl(getNoItemsMessage(false, jest.fn(), mockBasePath, basePath));
    const { getByText } = render(<Router>{component}</Router>);

    expect(component).toMatchSnapshot();
    fireEvent.click(getByText('Install some sample data'));

    waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalled();
    });
    mockUseNavigate.mockClear();
  });
});
