/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { FlyoutHistoryNav } from './flyout_history_nav';

describe('FlyoutHistoryNav', () => {
  it('renders nothing without history', () => {
    const { container } = render(<FlyoutHistoryNav navigation={{ onBack: jest.fn() }} />);
    expect(container).toBeEmptyDOMElement();
    expect(render(<FlyoutHistoryNav />).container).toBeEmptyDOMElement();
  });

  it('labels Back by what it leads to', () => {
    const onBack = jest.fn();
    render(<FlyoutHistoryNav navigation={{ back: { kind: 'session', label: 's1' }, onBack }} />);
    fireEvent.click(screen.getByText('Back to session'));
    expect(onBack).toHaveBeenCalled();
    expect(screen.queryByText(/Forward/)).not.toBeInTheDocument();
  });
});
