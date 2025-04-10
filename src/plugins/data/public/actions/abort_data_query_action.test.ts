/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAbortDataQueryAction, ACTION_ABORT_DATA_QUERY } from './abort_data_query_action';

describe('createAbortDataQueryAction', () => {
  let action: ReturnType<typeof createAbortDataQueryAction>;
  let mockAbortController: AbortController;
  let mockContext: { abortControllerRef: { current: AbortController | undefined } };

  beforeEach(() => {
    action = createAbortDataQueryAction();
    mockAbortController = ({
      abort: jest.fn(),
      signal: new AbortController().signal,
    } as unknown) as AbortController;

    mockContext = {
      abortControllerRef: {
        current: mockAbortController,
      },
    };
  });

  it('should create an action with correct type and id', () => {
    expect(action.type).toBe(ACTION_ABORT_DATA_QUERY);
    expect(action.id).toBe(ACTION_ABORT_DATA_QUERY);
  });

  it('should abort the query when execute is called with valid abort controller', async () => {
    await action.execute(mockContext);
    expect(mockAbortController.abort).toHaveBeenCalled();
  });

  it('should handle errors and log warning', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const error = new Error('Test error');
    mockAbortController.abort = jest.fn().mockImplementation(() => {
      throw error;
    });

    await action.execute(mockContext);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error [ACTION_ABORT_DATA_QUERY]: Failed to abort data query',
      error
    );
    consoleSpy.mockRestore();
  });
});
