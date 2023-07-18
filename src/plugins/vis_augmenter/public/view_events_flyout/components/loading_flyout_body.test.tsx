/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { LoadingFlyoutBody } from './loading_flyout_body';

describe('<LoadingFlyoutBody/>', () => {
  it('renders component', async () => {
    const { container, getByTestId } = render(<LoadingFlyoutBody />);
    expect(getByTestId('loadingSpinner')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
