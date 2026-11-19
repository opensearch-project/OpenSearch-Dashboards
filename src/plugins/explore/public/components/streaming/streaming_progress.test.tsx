/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import {
  StreamingAnnouncer,
  StreamingProgressBar,
  formatStreamingAnnouncement,
} from './streaming_progress';

const status = (overrides: Record<string, unknown>) =>
  ({ isPolling: true, total: 0, rowsFetched: 0, startTimeMs: 0, ...overrides }) as any;

describe('formatStreamingAnnouncement', () => {
  it('says nothing for a query that is not streamed', () => {
    expect(formatStreamingAnnouncement(undefined)).toBe('');
  });

  it('announces the start, without a percentage the engine has not reported', () => {
    expect(formatStreamingAnnouncement(status({ fractionDone: -1 }))).toBe('Query running');
    expect(formatStreamingAnnouncement(status({ fractionDone: 0.1 }))).toBe('Query running');
  });

  // A live region speaks on every text change, so progress moves in steps rather than per poll.
  it('changes only at each 25% step', () => {
    const texts = [0.25, 0.3, 0.49, 0.5, 0.79, 0.8, 1].map((fractionDone) =>
      formatStreamingAnnouncement(status({ fractionDone }))
    );
    expect(texts).toEqual([
      'Query running, 25% done',
      'Query running, 25% done',
      'Query running, 25% done',
      'Query running, 50% done',
      'Query running, 75% done',
      'Query running, 75% done',
      // Scanning has ended but rows are still being read; "finished" says the rest.
      'Query running, 75% done',
    ]);
  });

  it('announces how the run ended', () => {
    expect(formatStreamingAnnouncement(status({ isPolling: false }))).toBe('Query finished');
    expect(formatStreamingAnnouncement(status({ isPolling: false, aborted: true }))).toBe(
      'Query stopped'
    );
    expect(formatStreamingAnnouncement(status({ isPolling: false, interrupted: true }))).toBe(
      'Query ended before it finished; results are incomplete'
    );
  });
});

describe('StreamingProgressBar', () => {
  it('exposes a known fraction as a labelled progress value', () => {
    render(<StreamingProgressBar streaming={status({ fractionDone: 0.42 })} />);
    const bar = screen.getByRole('progressbar', { name: 'Query progress' });
    expect(bar).toHaveAttribute('value', '0.42');
    expect(bar).toHaveAttribute('max', '1');
  });

  it('is still a labelled progress bar when the fraction is unknown', () => {
    render(<StreamingProgressBar streaming={status({ fractionDone: -1 })} />);
    expect(screen.getByRole('progressbar', { name: 'Query progress' })).not.toHaveAttribute(
      'value'
    );
  });
});

describe('StreamingAnnouncer', () => {
  it('is a polite status region that stays mounted between runs', () => {
    const { rerender } = render(<StreamingAnnouncer streaming={undefined} />);
    const region = screen.getByTestId('exploreStreamingAnnouncer');
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('');

    rerender(<StreamingAnnouncer streaming={status({ fractionDone: 0.5 })} />);
    expect(screen.getByTestId('exploreStreamingAnnouncer')).toBe(region);
    expect(region).toHaveTextContent('Query running, 50% done');
  });
});
