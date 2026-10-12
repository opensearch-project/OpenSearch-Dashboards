/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { FlyoutHistoryNav } from './flyout_history_nav';

describe('FlyoutHistoryNav', () => {
  it('renders nothing without history', () => {
    const { container } = render(
      <FlyoutHistoryNav navigation={{ onBack: jest.fn(), onForward: jest.fn() }} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(render(<FlyoutHistoryNav />).container).toBeEmptyDOMElement();
  });

  it('labels Back and Forward by what they lead to', () => {
    const onBack = jest.fn();
    const onForward = jest.fn();
    render(
      <FlyoutHistoryNav
        navigation={{
          back: { kind: 'session', label: 's1' },
          forward: { kind: 'trace', label: 'POST /plan' },
          onBack,
          onForward,
        }}
      />
    );
    fireEvent.click(screen.getByText('Back to session'));
    fireEvent.click(screen.getByText('Forward to trace'));
    expect(onBack).toHaveBeenCalled();
    expect(onForward).toHaveBeenCalled();
  });
});
