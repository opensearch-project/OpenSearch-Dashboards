/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { combineReducers, configureStore, createAction } from '@reduxjs/toolkit';
import {
  AI_AVAILABILITY_PROBE_TIMEOUT_MS,
  createAiAvailabilityMiddleware,
  refreshAiAvailability,
  withTimeout,
} from './ai_availability_middleware';
import {
  queryReducer,
  queryEditorReducer,
  setQueryState,
  setPromptModeIsAvailable,
  setSummaryAgentIsAvailable,
} from '../slices';
import { getPromptModeIsAvailable } from '../../get_prompt_mode_is_available';
import { getSummaryAgentIsAvailable } from '../../get_summary_agent_is_available';
import { ExploreServices } from '../../../../types';

jest.mock('../../get_prompt_mode_is_available', () => ({
  getPromptModeIsAvailable: jest.fn(),
}));

jest.mock('../../get_summary_agent_is_available', () => ({
  getSummaryAgentIsAvailable: jest.fn(),
}));

const mockedGetPromptModeIsAvailable = getPromptModeIsAvailable as jest.MockedFunction<
  typeof getPromptModeIsAvailable
>;
const mockedGetSummaryAgentIsAvailable = getSummaryAgentIsAvailable as jest.MockedFunction<
  typeof getSummaryAgentIsAvailable
>;

const resetState = createAction<any>('app/resetState');

const datasetA = { id: 'a', title: 'a', type: 'INDEX_PATTERN', dataSource: { id: 'ds-a' } };
const datasetB = { id: 'b', title: 'b', type: 'INDEX_PATTERN', dataSource: { id: 'ds-b' } };

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const flush = () => new Promise((resolve) => jest.requireActual('timers').setImmediate(resolve));

const services = {} as ExploreServices;

const createStore = (dataset: any = datasetA) => {
  const reducer = combineReducers({ query: queryReducer, queryEditor: queryEditorReducer });
  const base = reducer(undefined, { type: '@@init' });
  return configureStore({
    reducer: (state: any, action: any) =>
      resetState.match(action) ? action.payload : reducer(state, action),
    preloadedState: {
      ...base,
      query: { query: '', language: 'PPL', dataset },
      queryEditor: {
        ...base.queryEditor,
        promptModeIsAvailable: false,
        summaryAgentIsAvailable: false,
      },
    } as any,
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(
        createAiAvailabilityMiddleware(services) as any
      ),
  });
};

describe('createAiAvailabilityMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('does not block the dispatch while probes are pending', () => {
    mockedGetPromptModeIsAvailable.mockReturnValue(new Promise(() => {}));
    mockedGetSummaryAgentIsAvailable.mockReturnValue(new Promise(() => {}));
    const store = createStore();

    const result = store.dispatch(refreshAiAvailability());

    expect(result).toEqual(refreshAiAvailability());
    expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
    expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(false);
  });

  it('sets each flag when its probe resolves later', async () => {
    const prompt = deferred<boolean>();
    const summary = deferred<boolean>();
    mockedGetPromptModeIsAvailable.mockReturnValue(prompt.promise);
    mockedGetSummaryAgentIsAvailable.mockReturnValue(summary.promise);
    const store = createStore();

    store.dispatch(refreshAiAvailability());
    expect(mockedGetSummaryAgentIsAvailable).toHaveBeenCalledWith(services, 'ds-a', {
      signal: expect.any(AbortSignal),
    });

    prompt.resolve(true);
    await flush();
    expect(store.getState().queryEditor.promptModeIsAvailable).toBe(true);
    expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(false);

    summary.resolve(true);
    await flush();
    expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(true);
  });

  it('only dispatches when a value changes', async () => {
    mockedGetPromptModeIsAvailable.mockResolvedValue(false);
    mockedGetSummaryAgentIsAvailable.mockResolvedValue(false);
    const store = createStore();
    const listener = jest.fn();
    store.subscribe(listener);

    store.dispatch(refreshAiAvailability());
    await flush();

    // Only the refresh action itself notified subscribers.
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps the flags false when the probes reject', async () => {
    mockedGetPromptModeIsAvailable.mockRejectedValue(new Error('boom'));
    mockedGetSummaryAgentIsAvailable.mockRejectedValue(new Error('boom'));
    const store = createStore();

    store.dispatch(refreshAiAvailability());
    await flush();

    expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
    expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(false);
  });

  it('times out hanging probes, keeps the flags false and aborts the request', async () => {
    jest.useFakeTimers();
    mockedGetPromptModeIsAvailable.mockReturnValue(new Promise(() => {}));
    let signal: AbortSignal | undefined;
    mockedGetSummaryAgentIsAvailable.mockImplementation((_s, _id, options) => {
      signal = options?.signal;
      return new Promise(() => {});
    });
    const store = createStore();
    store.dispatch(refreshAiAvailability());

    jest.advanceTimersByTime(AI_AVAILABILITY_PROBE_TIMEOUT_MS - 1);
    expect(signal?.aborted).toBe(false);
    jest.advanceTimersByTime(1);
    expect(signal?.aborted).toBe(true);
    jest.useRealTimers();
    await flush();

    expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
    expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(false);
  });

  it('sets a flag back to false when a later probe times out', async () => {
    mockedGetPromptModeIsAvailable.mockResolvedValue(true);
    mockedGetSummaryAgentIsAvailable.mockResolvedValue(true);
    const store = createStore();
    store.dispatch(refreshAiAvailability());
    await flush();
    expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(true);

    jest.useFakeTimers();
    mockedGetPromptModeIsAvailable.mockReturnValue(new Promise(() => {}));
    mockedGetSummaryAgentIsAvailable.mockReturnValue(new Promise(() => {}));
    store.dispatch(refreshAiAvailability());
    jest.advanceTimersByTime(AI_AVAILABILITY_PROBE_TIMEOUT_MS);
    jest.useRealTimers();
    await flush();

    expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
    expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(false);
  });

  it('ignores results that arrive after the dataset changed', async () => {
    const prompt = deferred<boolean>();
    const summary = deferred<boolean>();
    mockedGetPromptModeIsAvailable.mockReturnValue(prompt.promise);
    mockedGetSummaryAgentIsAvailable.mockReturnValue(summary.promise);
    const store = createStore();

    store.dispatch(refreshAiAvailability());
    store.dispatch(setQueryState({ query: '', language: 'PPL', dataset: datasetB } as any));

    prompt.resolve(true);
    summary.resolve(true);
    await flush();

    expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
    expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(false);
  });

  it('ignores results of a probe superseded by a newer refresh', async () => {
    const first = deferred<boolean>();
    const second = deferred<boolean>();
    let firstSignal: AbortSignal | undefined;
    mockedGetPromptModeIsAvailable
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    mockedGetSummaryAgentIsAvailable
      .mockImplementationOnce((_s, _id, options) => {
        firstSignal = options?.signal;
        return new Promise(() => {});
      })
      .mockResolvedValueOnce(false);
    const store = createStore();

    store.dispatch(refreshAiAvailability());
    store.dispatch(refreshAiAvailability());
    expect(firstSignal?.aborted).toBe(true);

    second.resolve(false);
    first.resolve(true);
    await flush();

    expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
  });

  it('cancels pending probes when the store is reset', async () => {
    const prompt = deferred<boolean>();
    mockedGetPromptModeIsAvailable.mockReturnValue(prompt.promise);
    mockedGetSummaryAgentIsAvailable.mockReturnValue(new Promise(() => {}));
    const store = createStore();
    const initialState = store.getState();

    store.dispatch(refreshAiAvailability());
    store.dispatch(resetState(initialState));
    prompt.resolve(true);
    await flush();

    expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
  });

  describe('timers', () => {
    afterEach(() => jest.useRealTimers());

    it('clears both timeout timers once the probes settle', async () => {
      jest.useFakeTimers();
      mockedGetPromptModeIsAvailable.mockResolvedValue(true);
      mockedGetSummaryAgentIsAvailable.mockResolvedValue(true);
      const store = createStore();

      store.dispatch(refreshAiAvailability());
      expect(jest.getTimerCount()).toBe(2);
      await Promise.resolve();
      await Promise.resolve();

      expect(jest.getTimerCount()).toBe(0);
    });

    it('clears the pending timers when a newer refresh supersedes the run', () => {
      jest.useFakeTimers();
      mockedGetPromptModeIsAvailable.mockReturnValue(new Promise(() => {}));
      mockedGetSummaryAgentIsAvailable.mockReturnValue(new Promise(() => {}));
      const store = createStore();

      store.dispatch(refreshAiAvailability());
      store.dispatch(refreshAiAvailability());

      // Only the second run's two timers are left.
      expect(jest.getTimerCount()).toBe(2);
    });

    it('clears the pending timers when the store is reset', () => {
      jest.useFakeTimers();
      mockedGetPromptModeIsAvailable.mockReturnValue(new Promise(() => {}));
      mockedGetSummaryAgentIsAvailable.mockReturnValue(new Promise(() => {}));
      const store = createStore();
      const initialState = store.getState();

      store.dispatch(refreshAiAvailability());
      store.dispatch(resetState(initialState));

      expect(jest.getTimerCount()).toBe(0);
    });

    it('applies a summary result that arrives before the timeout, without aborting the request', async () => {
      jest.useFakeTimers();
      let signal: AbortSignal | undefined;
      mockedGetPromptModeIsAvailable.mockReturnValue(new Promise(() => {}));
      mockedGetSummaryAgentIsAvailable.mockImplementation((_s, _id, options) => {
        signal = options?.signal;
        return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
      });
      const store = createStore();

      store.dispatch(refreshAiAvailability());
      jest.advanceTimersByTime(1000);
      jest.useRealTimers();
      await flush();

      expect(signal?.aborted).toBe(false);
      expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(true);
    });
  });

  describe('without a dataset', () => {
    it('turns the flags off and does not probe', async () => {
      const store = createStore(null);
      store.dispatch(setPromptModeIsAvailable(true));
      store.dispatch(setSummaryAgentIsAvailable(true));

      store.dispatch(refreshAiAvailability());
      await flush();

      expect(mockedGetPromptModeIsAvailable).not.toHaveBeenCalled();
      expect(mockedGetSummaryAgentIsAvailable).not.toHaveBeenCalled();
      expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
      expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(false);
    });

    it('drops the result of a probe that was running when the dataset went away', async () => {
      const prompt = deferred<boolean>();
      let signal: AbortSignal | undefined;
      mockedGetPromptModeIsAvailable.mockReturnValue(prompt.promise);
      mockedGetSummaryAgentIsAvailable.mockImplementation((_s, _id, options) => {
        signal = options?.signal;
        return new Promise(() => {});
      });
      const store = createStore();

      store.dispatch(refreshAiAvailability());
      store.dispatch(setQueryState({ query: '', language: 'PPL', dataset: undefined } as any));
      expect(signal?.aborted).toBe(false);
      store.dispatch(refreshAiAvailability());
      // The refresh without a dataset cancels the run that was still in flight.
      expect(signal?.aborted).toBe(true);
      prompt.resolve(true);
      await flush();

      expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
    });
  });
});

describe('withTimeout', () => {
  afterEach(() => jest.useRealTimers());

  it('resolves false at once, without a timer, when the signal is already aborted', async () => {
    jest.useFakeTimers();
    const controller = new AbortController();
    controller.abort();

    const result = await withTimeout(new Promise(() => {}), 5000, controller.signal);

    expect(result).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('resolves with the probe value and clears the timer', async () => {
    jest.useFakeTimers();
    const controller = new AbortController();

    const result = await withTimeout(Promise.resolve(true), 5000, controller.signal);

    expect(result).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('calls onTimeout and resolves false when the probe does not settle in time', async () => {
    jest.useFakeTimers();
    const onTimeout = jest.fn();
    const promise = withTimeout(
      new Promise(() => {}),
      5000,
      new AbortController().signal,
      onTimeout
    );

    jest.advanceTimersByTime(4999);
    expect(onTimeout).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);

    expect(await promise).toBe(false);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('does not call onTimeout when the run is cancelled', async () => {
    jest.useFakeTimers();
    const onTimeout = jest.fn();
    const controller = new AbortController();
    const promise = withTimeout(new Promise(() => {}), 5000, controller.signal, onTimeout);

    controller.abort();

    expect(await promise).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
