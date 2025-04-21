/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAbortDataQueryAction, ACTION_ABORT_DATA_QUERY } from './abort_data_query_action';

describe('createAbortDataQueryAction', () => {
  let action: ReturnType<typeof createAbortDataQueryAction>;
  let mockAbortController: AbortController;
  const mockContext = {
    reason: 'test abort',
    trigger: {
      type: 'test-trigger',
      payload: undefined,
    },
  };
  let abortControllerRefMock: React.MutableRefObject<AbortController | undefined>;

  beforeEach(() => {
    mockAbortController = ({
      abort: jest.fn(),
      signal: new AbortController().signal,
    } as unknown) as AbortController;

    abortControllerRefMock = {
      current: mockAbortController,
    } as React.MutableRefObject<AbortController | undefined>;

    action = createAbortDataQueryAction(abortControllerRefMock);
  });

  it('should create an action with correct type and id', () => {
    expect(action.type).toBe(ACTION_ABORT_DATA_QUERY);
    expect(action.id).toBe(ACTION_ABORT_DATA_QUERY);
  });

  it('should abort the query when execute is called with valid abort controller', async () => {
    await action.execute(mockContext);
    expect(abortControllerRefMock.current?.abort).toHaveBeenCalled();
  });

  it('should handle errors and log warning', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const error = new Error('Test error');

    if (abortControllerRefMock.current) {
      abortControllerRefMock.current.abort = jest.fn().mockImplementation(() => {
        throw error;
      });
    }

    await action.execute(mockContext);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error [ACTION_ABORT_DATA_QUERY]: Failed to abort data query',
      error
    );
    consoleSpy.mockRestore();
  });

  it('should not throw when abort controller is undefined', async () => {
    abortControllerRefMock.current = undefined;
    await expect(action.execute(mockContext)).resolves.not.toThrow();
  });
});
