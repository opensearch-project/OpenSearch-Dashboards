/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent } from '@testing-library/react';
import { getReloadButton } from './reload_button';

describe('getReloadButton', () => {
  it('renders button with correct label', () => {
    const { getByText } = render(getReloadButton());
    expect(getByText('Refresh the page')).toBeInTheDocument();
  });

  it('calls window.location.reload() on button click', () => {
    // jsdom 26: spy on location.reload rather than replacing the location object.
    const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation(jest.fn());

    const { getByText } = render(getReloadButton());
    fireEvent.click(getByText('Refresh the page'));
    expect(reloadSpy).toHaveBeenCalled();

    reloadSpy.mockRestore();
  });
});
