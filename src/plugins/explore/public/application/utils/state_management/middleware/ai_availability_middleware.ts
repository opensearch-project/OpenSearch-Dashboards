/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAction, Middleware } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { RootState } from '../store';
import { ExploreServices } from '../../../../types';
import { setPromptModeIsAvailable, setSummaryAgentIsAvailable } from '../slices';
import { getPromptModeIsAvailable } from '../../get_prompt_mode_is_available';
import { getSummaryAgentIsAvailable } from '../../get_summary_agent_is_available';

export const AI_AVAILABILITY_PROBE_TIMEOUT_MS = 5000;

/**
 * Re-checks whether the AI entry points are available for the current dataset. The probes run in
 * the background, so nothing that dispatches this waits for them.
 */
export const refreshAiAvailability = createAction('app/refreshAiAvailability');

/**
 * Resolves to `false` if the probe rejects, does not settle within `timeoutMs`, or the run is
 * cancelled. The timer is always cleared once the promise settles.
 */
// visible for testing
export const withTimeout = (
  probe: Promise<boolean>,
  timeoutMs: number,
  cancelSignal: AbortSignal,
  onTimeout?: () => void
): Promise<boolean> =>
  new Promise((resolve) => {
    if (cancelSignal.aborted) {
      resolve(false);
      return;
    }
    const settle = (value: boolean) => {
      clearTimeout(timer);
      cancelSignal.removeEventListener('abort', onCancel);
      resolve(value);
    };
    const onCancel = () => settle(false);
    const timer = setTimeout(() => {
      onTimeout?.();
      settle(false);
    }, timeoutMs);
    cancelSignal.addEventListener('abort', onCancel);
    probe.then(
      (value) => settle(Boolean(value)),
      () => settle(false)
    );
  });

export const createAiAvailabilityMiddleware =
  (services: ExploreServices): Middleware<{}, RootState> =>
  (store) => {
    let generation = 0;
    let cancelController: AbortController | undefined;

    const cancel = () => {
      generation++;
      cancelController?.abort();
      cancelController = undefined;
    };

    const refresh = () => {
      cancel();
      const runGeneration = generation;
      const dataset = store.getState().query.dataset;
      // Nothing to probe without a dataset: the AI entry points stay off.
      if (!dataset) {
        const { promptModeIsAvailable, summaryAgentIsAvailable } = store.getState().queryEditor;
        if (promptModeIsAvailable) store.dispatch(setPromptModeIsAvailable(false));
        if (summaryAgentIsAvailable) store.dispatch(setSummaryAgentIsAvailable(false));
        return;
      }
      const runCancel = new AbortController();
      cancelController = runCancel;
      // The summary request has its own controller, so its timeout never affects the prompt probe.
      const summaryRequest = new AbortController();
      runCancel.signal.addEventListener('abort', () => summaryRequest.abort());
      // A result only applies to the dataset it was probed for.
      const isCurrent = () =>
        runGeneration === generation && isEqual(store.getState().query.dataset, dataset);

      withTimeout(
        getPromptModeIsAvailable(services),
        AI_AVAILABILITY_PROBE_TIMEOUT_MS,
        runCancel.signal
      ).then((value) => {
        if (isCurrent() && store.getState().queryEditor.promptModeIsAvailable !== value) {
          store.dispatch(setPromptModeIsAvailable(value));
        }
      });

      withTimeout(
        getSummaryAgentIsAvailable(services, dataset.dataSource?.id || '', {
          signal: summaryRequest.signal,
        }),
        AI_AVAILABILITY_PROBE_TIMEOUT_MS,
        runCancel.signal,
        () => summaryRequest.abort()
      ).then((value) => {
        if (isCurrent() && store.getState().queryEditor.summaryAgentIsAvailable !== value) {
          store.dispatch(setSummaryAgentIsAvailable(value));
        }
      });
    };

    return (next) => (action) => {
      const result = next(action);
      if (refreshAiAvailability.match(action)) {
        refresh();
      } else if (action.type === 'app/resetState') {
        cancel();
      }
      return result;
    };
  };
