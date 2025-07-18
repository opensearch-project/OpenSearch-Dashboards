/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAbortDataQueryAction, ACTION_ABORT_DATA_QUERY } from './abort_data_query_action';
import { abortAllActiveQueries } from '../query_actions';

jest.mock('../query_actions', () => ({
  abortAllActiveQueries: jest.fn(),
}));

const mockAbortAllActiveQueries = abortAllActiveQueries as jest.MockedFunction<
  typeof abortAllActiveQueries
>;

describe('createAbortDataQueryAction', () => {
  let action: ReturnType<typeof createAbortDataQueryAction>;
  const mockContext = {
    reason: 'test abort',
    trigger: {
      id: 'ABORT_DATA_QUERY_TRIGGER' as any,
    },
  } as any;
  const mockId = 'test-action-id';

  beforeEach(() => {
    jest.clearAllMocks();
    action = createAbortDataQueryAction(mockId);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it('should create an action with correct type and id', () => {
    expect(action.type).toBe(ACTION_ABORT_DATA_QUERY);
    expect(action.id).toBe(mockId);
  });

  it('should call abortAllActiveQueries when execute is called', async () => {
    await action.execute(mockContext);
    expect(mockAbortAllActiveQueries).toHaveBeenCalledTimes(1);
  });

  it('should handle errors and log warning', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const error = new Error('Test error');

    mockAbortAllActiveQueries.mockImplementation(() => {
      throw error;
    });

    await action.execute(mockContext);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[ACTION_ABORT_DATA_QUERY] Failed to abort data query:',
      error
    );
    consoleSpy.mockRestore();
  });

  it('should not throw when abortAllActiveQueries throws an error', async () => {
    mockAbortAllActiveQueries.mockImplementation(() => {
      throw new Error('Test error');
    });

    await expect(action.execute(mockContext)).resolves.not.toThrow();
  });

  it('should have shouldAutoExecute return true', async () => {
    const shouldAutoExecute = await action.shouldAutoExecute?.({} as any);
    expect(shouldAutoExecute).toBe(true);
  });
});
