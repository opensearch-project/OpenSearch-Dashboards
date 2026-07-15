/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompactRow } from './compact_row';

describe('CompactRow', () => {
  it('renders the name as a link that fires nameOnClick when provided', () => {
    const nameOnClick = jest.fn();
    render(
      <CompactRow
        icon="index"
        name="logs-app-2026.07.15"
        nameOnClick={nameOnClick}
        nameTitle="Create dataset"
        message="No events in the last 15 minutes"
        data-test-subj="row"
      />
    );
    const link = screen.getByTestId('logsExploreCardNameLink');
    expect(link).toHaveTextContent('logs-app-2026.07.15');
    fireEvent.click(link);
    expect(nameOnClick).toHaveBeenCalled();
    expect(screen.getByText('No events in the last 15 minutes')).toBeInTheDocument();
  });

  it('renders a muted, non-actionable name when nameOnClick is absent', () => {
    render(
      <CompactRow
        icon="index"
        name="staging-ingest-test"
        message="No documents yet"
        meta="0 docs · created 3 days ago"
      />
    );
    expect(screen.queryByTestId('logsExploreCardNameLink')).not.toBeInTheDocument();
    expect(screen.getByText('staging-ingest-test')).toBeInTheDocument();
    expect(screen.getByText('0 docs · created 3 days ago')).toBeInTheDocument();
  });

  it('renders an error chip and a trailing action', () => {
    const onRetry = jest.fn();
    render(
      <CompactRow
        icon="index"
        name="restricted-pci-logs"
        message="Couldn't load preview"
        tone="danger"
        errorText="security_exception · 403"
        action={
          <button data-test-subj="logsExploreCardRetry" onClick={onRetry}>
            Retry
          </button>
        }
        data-test-subj="logsExploreCardError"
      />
    );
    expect(screen.getByTestId('logsExploreCardError')).toBeInTheDocument();
    expect(screen.getByTestId('logsExploreCardErrorChip')).toHaveTextContent(
      'security_exception · 403'
    );
    fireEvent.click(screen.getByTestId('logsExploreCardRetry'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders a selection checkbox when provided and wires onChange', () => {
    const onChange = jest.fn();
    render(
      <CompactRow
        icon="index"
        name="logs-app-1"
        nameOnClick={jest.fn()}
        message="No events in the last 15 minutes"
        checkbox={{ checked: false, onChange, ariaLabel: 'Select logs-app-1', id: 'cb-logs-app-1' }}
      />
    );
    const cb = screen.getByLabelText('Select logs-app-1');
    fireEvent.click(cb);
    expect(onChange).toHaveBeenCalled();
  });

  it('omits the checkbox when not provided (e.g. empty-index rows)', () => {
    render(<CompactRow icon="index" name="empty-idx" message="No documents yet" />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
