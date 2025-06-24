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
  };
  const mockId = 'id';
  let refs: Array<React.MutableRefObject<{ abortController: AbortController | undefined }>>;

  beforeEach(() => {
    mockAbortController = ({
      abort: jest.fn(),
      signal: new AbortController().signal,
    } as unknown) as AbortController;

    const ref = {
      current: {
        abortController: mockAbortController,
      },
    };

    refs = [ref];
    action = createAbortDataQueryAction(refs, mockId);
  });

  it('should create an action with correct type and id', () => {
    expect(action.type).toBe(ACTION_ABORT_DATA_QUERY);
    expect(action.id).toBe(mockId);
  });

  it('should abort the query when execute is called with valid abort controller', async () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    await action.execute(mockContext);
    expect(refs[0].current.abortController?.abort).toHaveBeenCalledWith('test abort');
  });

  it('should handle errors and log warning', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const error = new Error('Test error');

    if (refs[0].current.abortController) {
      refs[0].current.abortController.abort = jest.fn().mockImplementation(() => {
        throw error;
      });
    }

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    await action.execute(mockContext);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[ACTION_ABORT_DATA_QUERY] Failed to abort data query:',
      error
    );
    consoleSpy.mockRestore();
  });

  it('should not throw when abort controller is undefined', async () => {
    refs[0].current.abortController = undefined;
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    await expect(action.execute(mockContext)).resolves.not.toThrow();
  });

  it('should abort multiple controllers when multiple refs are provided', async () => {
    const secondMockAbortController = ({
      abort: jest.fn(),
      signal: new AbortController().signal,
    } as unknown) as AbortController;

    const secondRef = {
      current: {
        abortController: secondMockAbortController,
      },
    };

    refs.push(secondRef);
    // @ts-expect-error TS2554 TODO(ts-error): fixme
    action = createAbortDataQueryAction(refs);

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    await action.execute(mockContext);

    expect(refs[0].current.abortController?.abort).toHaveBeenCalledWith('test abort');
    expect(refs[1].current.abortController?.abort).toHaveBeenCalledWith('test abort');
  });
});
