/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { createMemoryHistory } from 'history';
import { render, screen } from 'test_utils/testing_lib_helpers';
import { AppErrorBoundary } from './app_error_boundary';

const Boom = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('AppErrorBoundary', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    // React logs the caught error itself; keep the test output readable.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  it('renders children when nothing throws', () => {
    render(
      <AppErrorBoundary history={createMemoryHistory()}>
        <div>discover content</div>
      </AppErrorBoundary>
    );

    expect(screen.getByText('discover content')).toBeInTheDocument();
  });

  it('shows a message instead of an empty page when a child throws', () => {
    render(
      <AppErrorBoundary history={createMemoryHistory()}>
        <Boom message="Failed to load dataset: sample-dataset" />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Discover could not be displayed')).toBeInTheDocument();
  });

  it('surfaces the underlying error so the failure is diagnosable', () => {
    render(
      <AppErrorBoundary history={createMemoryHistory()}>
        <Boom message="Could not locate that index-pattern-field (id: @timestamp)" />
      </AppErrorBoundary>
    );

    expect(
      screen.getByText('Could not locate that index-pattern-field (id: @timestamp)')
    ).toBeInTheDocument();
  });

  it('clears the error when the user navigates, so recovery does not need a reload', () => {
    const history = createMemoryHistory();
    const { rerender } = render(
      <AppErrorBoundary history={history}>
        <Boom message="boom" />
      </AppErrorBoundary>
    );
    expect(screen.getByText('Discover could not be displayed')).toBeInTheDocument();

    history.push('/somewhere-else');
    rerender(
      <AppErrorBoundary history={history}>
        <div>recovered content</div>
      </AppErrorBoundary>
    );

    expect(screen.getByText('recovered content')).toBeInTheDocument();
    expect(screen.queryByText('Discover could not be displayed')).not.toBeInTheDocument();
  });

  it('stops listening to history when unmounted', () => {
    const history = createMemoryHistory();
    const unlisten = jest.fn();
    jest.spyOn(history, 'listen').mockReturnValue(unlisten);

    const { unmount } = render(
      <AppErrorBoundary history={history}>
        <div>content</div>
      </AppErrorBoundary>
    );
    unmount();

    expect(unlisten).toHaveBeenCalled();
  });

  it('logs the error for debugging', () => {
    render(
      <AppErrorBoundary history={createMemoryHistory()}>
        <Boom message="boom" />
      </AppErrorBoundary>
    );

    expect(consoleError).toHaveBeenCalledWith(
      '[data-explorer] render failed',
      expect.objectContaining({ message: 'boom' }),
      expect.any(String)
    );
  });
});
