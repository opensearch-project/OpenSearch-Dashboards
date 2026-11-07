/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SourceItemCard } from './source_item_card';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_k: string, o: { defaultMessage: string; values?: Record<string, unknown> }) =>
      Object.entries(o.values ?? {}).reduce(
        (text, [key, value]) => text.replace(`{${key}}`, String(value)),
        o.defaultMessage
      ),
  },
}));
jest.mock('./severity_histogram', () => ({
  SeverityHistogram: () => <div data-test-subj="mock-histogram" />,
}));

const item = {
  id: 'g',
  name: '/app/g',
  timeFieldName: '@timestamp',
  details: [
    { label: 'Stored', value: '1 KB' },
    { label: 'Empty', value: '' },
  ],
};

const renderCard = (props: Record<string, unknown> = {}) => {
  const handlers = {
    onRun: jest.fn(),
    onStop: jest.fn(),
    onToggleCheck: jest.fn(),
    onVisibilityChange: jest.fn(),
  };
  render(
    <SourceItemCard
      services={{} as any}
      item={item}
      hasHistogram
      explicitRun
      loading={false}
      stale={false}
      checked={false}
      onBrushTime={jest.fn()}
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

describe('SourceItemCard', () => {
  it('shows the details with a value and an idle state with Run, before anything runs', () => {
    const { onRun } = renderCard();
    expect(screen.getByTestId('logsDrilldownSourceCardDetails-g')).toHaveTextContent(
      'Stored: 1 KB'
    );
    expect(screen.getByTestId('logsDrilldownSourceCardDetails-g')).not.toHaveTextContent('Empty');
    expect(screen.getByTestId('logsDrilldownSourceCardIdle-g')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('logsDrilldownSourceCardRun-g'));
    expect(onRun).toHaveBeenCalledWith('g');
  });

  it('shows the events and histogram after a run, and offers Run again', () => {
    renderCard({
      result: {
        preview: { rows: [{ '@timestamp': '2026-11-05', msg: 'hello' }], columns: [] },
        histogram: { series: [], intervalMs: 1, from: 0, to: 1, totals: [] },
        ranWith: 'k',
      },
    });
    expect(screen.getByTestId('logsDrilldownSourceCardLogs-g')).toHaveTextContent('hello');
    expect(screen.getByTestId('mock-histogram')).toBeInTheDocument();
    expect(screen.getByTestId('logsDrilldownSourceCardRun-g')).toHaveAttribute(
      'aria-label',
      'Run /app/g again'
    );
  });

  it('says a run card is stale', () => {
    renderCard({
      stale: true,
      result: { preview: { rows: [], columns: [] }, ranWith: 'old' },
    });
    expect(screen.getByTestId('logsDrilldownSourceCardStale-g')).toBeInTheDocument();
    expect(screen.getByText('No events in the selected time range.')).toBeInTheDocument();
  });

  it('shows an error, with Retry only on a source that runs on its own', () => {
    renderCard({ error: 'denied' });
    expect(screen.getByTestId('logsDrilldownSourceCardError-g')).toHaveTextContent('denied');
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('has no Run button on a source that runs on its own', () => {
    renderCard({ explicitRun: false, loading: true });
    expect(screen.queryByTestId('logsDrilldownSourceCardRun-g')).not.toBeInTheDocument();
  });

  it("can't be ticked once the selection is full, and says why to screen readers", () => {
    renderCard({ checkDisabledReason: 'You can open at most 2 at once.' });
    const box = screen.getByTestId('logsDrilldownSourceCardCheckbox-g');
    expect(box).toBeDisabled();
    expect(box).toHaveAccessibleDescription('You can open at most 2 at once.');
  });

  it('offers Stop while a run is in flight, and Run once it is not', () => {
    const { onStop } = renderCard({ loading: true });
    expect(screen.queryByTestId('logsDrilldownSourceCardRun-g')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('logsDrilldownSourceCardStop-g'));
    expect(onStop).toHaveBeenCalledWith('g');
  });

  it('stays enabled when already ticked, so it can be unticked', () => {
    renderCard({ checkDisabledReason: 'full', checked: true });
    expect(screen.getByTestId('logsDrilldownSourceCardCheckbox-g')).not.toBeDisabled();
  });
});
