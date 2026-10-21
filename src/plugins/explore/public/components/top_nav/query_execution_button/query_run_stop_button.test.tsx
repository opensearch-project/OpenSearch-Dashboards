/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryRunStopButton, QueryRunStopButtonProps } from './query_run_stop_button';

const SHOW_DELAY_MS = 50;
const MIN_DISPLAY_MS = 200;

const renderButton = (props: Partial<QueryRunStopButtonProps> = {}) => {
  const allProps: QueryRunStopButtonProps = {
    status: 'REFRESH',
    isRunning: false,
    onRun: jest.fn(),
    onStop: jest.fn(),
    ...props,
  };
  const utils = render(<QueryRunStopButton {...allProps} />);
  const rerender = (next: Partial<QueryRunStopButtonProps>) =>
    utils.rerender(<QueryRunStopButton {...allProps} {...next} />);
  return { ...utils, props: allProps, rerender };
};

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

describe('QueryRunStopButton', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('run state', () => {
    it('reads Refresh when there are no changes', () => {
      renderButton();
      const button = screen.getByTestId('exploreQueryExecutionButton');
      expect(button).toHaveTextContent('Refresh');
      expect(button).toHaveAttribute('aria-label', 'Submit query: Refresh');
      expect(button).toHaveClass(
        'euiButton--primary',
        'euiButton--fill',
        'exploreQueryRunStopButton'
      );
      expect(button).toBeEnabled();
    });

    it('reads Update when there are unapplied changes', () => {
      renderButton({ status: 'UPDATE' });
      const button = screen.getByTestId('exploreQueryExecutionButton');
      expect(button).toHaveTextContent('Update');
      expect(button).toHaveAttribute('aria-label', 'Submit query: Update');
      expect(button).toHaveClass('euiButton--primary', 'euiButton--fill');
    });

    it('is disabled and hollow when the status is DISABLED', () => {
      renderButton({ status: 'DISABLED' });
      const button = screen.getByTestId('exploreQueryExecutionButton');
      expect(button).toBeDisabled();
      expect(button).not.toHaveClass('euiButton--fill');
    });

    it('runs the query on click', () => {
      const { props } = renderButton();
      fireEvent.click(screen.getByTestId('exploreQueryExecutionButton'));
      expect(props.onRun).toHaveBeenCalledTimes(1);
      expect(props.onStop).not.toHaveBeenCalled();
    });

    it('does not throw when clicked without a run handler', () => {
      renderButton({ onRun: undefined });
      expect(() =>
        fireEvent.click(screen.getByTestId('exploreQueryExecutionButton'))
      ).not.toThrow();
    });

    it('never renders a separate cancel control', () => {
      renderButton({ isRunning: true });
      advance(SHOW_DELAY_MS);
      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(screen.queryByTestId('exploreQueryCancelButton')).not.toBeInTheDocument();
    });
  });

  describe('stop state', () => {
    it('reads Stop once a query has been running past the show delay', () => {
      renderButton({ isRunning: true });
      expect(screen.getByTestId('exploreQueryExecutionButton')).toBeInTheDocument();

      advance(SHOW_DELAY_MS);

      const button = screen.getByTestId('exploreQueryStopButton');
      expect(button).toHaveTextContent('Stop');
      expect(button).toHaveAttribute('aria-label', 'Stop query');
      expect(button).toHaveClass('euiButton--danger', 'euiButton--fill');
      expect(screen.queryByTestId('exploreQueryExecutionButton')).not.toBeInTheDocument();
    });

    it('does not flash Stop for a query that finishes within the show delay', () => {
      const { rerender } = renderButton({ isRunning: true });
      advance(SHOW_DELAY_MS - 10);
      rerender({ isRunning: false });
      advance(MIN_DISPLAY_MS);
      expect(screen.queryByTestId('exploreQueryStopButton')).not.toBeInTheDocument();
      expect(screen.getByTestId('exploreQueryExecutionButton')).toBeInTheDocument();
    });

    it('stops the query on click', () => {
      const { props } = renderButton({ isRunning: true });
      advance(SHOW_DELAY_MS);
      fireEvent.click(screen.getByTestId('exploreQueryStopButton'), { detail: 1 });
      expect(props.onStop).toHaveBeenCalledTimes(1);
      expect(props.onRun).not.toHaveBeenCalled();
    });

    it('stops the query when activated from the keyboard', () => {
      const { props } = renderButton({ isRunning: true });
      advance(SHOW_DELAY_MS);
      fireEvent.click(screen.getByTestId('exploreQueryStopButton'), { detail: 0 });
      expect(props.onStop).toHaveBeenCalledTimes(1);
    });

    it('ignores the second click of a double-click on Run', () => {
      const { props } = renderButton({ isRunning: true });
      advance(SHOW_DELAY_MS);
      fireEvent.click(screen.getByTestId('exploreQueryStopButton'), { detail: 2 });
      expect(props.onStop).not.toHaveBeenCalled();
    });

    it('stays Stop for the minimum display time after the query settles, without cancelling', () => {
      const { props, rerender } = renderButton({ isRunning: true });
      advance(SHOW_DELAY_MS);
      rerender({ isRunning: false });

      const button = screen.getByTestId('exploreQueryStopButton');
      fireEvent.click(button, { detail: 1 });
      expect(props.onStop).not.toHaveBeenCalled();

      advance(MIN_DISPLAY_MS);
      expect(screen.getByTestId('exploreQueryExecutionButton')).toHaveTextContent('Refresh');
    });

    it('is not blocked by an invalid time range', () => {
      const { props } = renderButton({ isRunning: true, status: 'DISABLED' });
      advance(SHOW_DELAY_MS);
      const button = screen.getByTestId('exploreQueryStopButton');
      expect(button).toBeEnabled();
      expect(button).toHaveClass('euiButton--fill');
      fireEvent.click(button, { detail: 1 });
      expect(props.onStop).toHaveBeenCalledTimes(1);
    });

    it('shows Stop instead of Update while running with unapplied changes', () => {
      renderButton({ isRunning: true, status: 'UPDATE' });
      advance(SHOW_DELAY_MS);
      expect(screen.getByTestId('exploreQueryStopButton')).toHaveTextContent('Stop');
    });

    it('is not offered without a stop handler', () => {
      const { props } = renderButton({ isRunning: true, onStop: undefined });
      advance(SHOW_DELAY_MS);
      expect(screen.queryByTestId('exploreQueryStopButton')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('exploreQueryExecutionButton'));
      expect(props.onRun).toHaveBeenCalledTimes(1);
    });

    it('does not read Stop on first render', () => {
      renderButton({ isRunning: false });
      expect(screen.getByTestId('exploreQueryExecutionButton')).toHaveTextContent('Refresh');
    });
  });

  it('keeps the same element across run and stop so keyboard focus survives', () => {
    const { rerender } = renderButton();
    const runButton = screen.getByTestId('exploreQueryExecutionButton');
    runButton.focus();

    rerender({ isRunning: true });
    advance(SHOW_DELAY_MS);
    const stopButton = screen.getByTestId('exploreQueryStopButton');
    expect(stopButton).toBe(runButton);
    expect(stopButton).toHaveFocus();

    rerender({ isRunning: false });
    advance(MIN_DISPLAY_MS);
    expect(screen.getByTestId('exploreQueryExecutionButton')).toBe(runButton);
    expect(runButton).toHaveFocus();
  });
});
