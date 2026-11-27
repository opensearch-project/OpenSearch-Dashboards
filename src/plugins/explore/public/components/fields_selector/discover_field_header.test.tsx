/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { DiscoverFieldHeader } from './discover_field_header';

describe('DiscoverFieldHeader', () => {
  it('renders the Fields heading and a labeled collapse button', () => {
    render(<DiscoverFieldHeader />);
    expect(screen.getByText('Fields')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse fields panel' })).toBeInTheDocument();
  });

  it('calls onCollapse when the button is clicked', () => {
    const onCollapse = jest.fn();
    render(<DiscoverFieldHeader onCollapse={onCollapse} />);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse fields panel' }));
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
});
