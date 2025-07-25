/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiscoverFieldHeader } from './discover_field_header';

describe('DiscoverFieldHeader', () => {
  it('renders fields header', () => {
    render(<DiscoverFieldHeader />);
    expect(screen.getByText('Fields')).toBeInTheDocument();
  });

  it('calls onCollapse when button clicked', () => {
    const onCollapse = jest.fn();
    render(<DiscoverFieldHeader onCollapse={onCollapse} />);

    fireEvent.click(screen.getByTestId('fieldList-collapse-button'));
    expect(onCollapse).toHaveBeenCalled();
  });
});
