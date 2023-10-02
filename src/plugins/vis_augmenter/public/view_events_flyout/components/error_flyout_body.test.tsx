/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ErrorFlyoutBody } from './error_flyout_body';

describe('<ErrorFlyoutBody/>', () => {
  const errorMsg = 'oh no an error!';
  it('shows error message', async () => {
    const { getByText } = render(<ErrorFlyoutBody errorMessage={errorMsg} />);
    expect(getByText(errorMsg)).toBeInTheDocument();
  });
  it('renders component', async () => {
    const { container, getByTestId } = render(<ErrorFlyoutBody errorMessage={errorMsg} />);
    expect(getByTestId('errorCallOut')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
