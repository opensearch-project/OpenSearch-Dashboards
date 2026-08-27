/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAskUserAction } from './ask_user_action';
import { HumanInputService } from './human_input_service';

const makeService = (askImpl?: jest.Mock) =>
  (({
    ask: askImpl ?? jest.fn().mockResolvedValue({ answer: 'blue' }),
    getPending$: jest.fn(),
    getPending: jest.fn().mockReturnValue([]),
    getAnswers$: jest.fn(),
    getAnswers: jest.fn().mockReturnValue(new Map()),
  } as unknown) as HumanInputService);

describe('createAskUserAction', () => {
  it('asks under the tool call id it was given', async () => {
    const ask = jest.fn().mockResolvedValue({ answer: 'blue' });
    const action = createAskUserAction(makeService(ask));

    const result = await action.handler!({ prompt: 'Favourite colour?' }, 'tooluse_abc');

    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({ toolCallId: 'tooluse_abc', prompt: 'Favourite colour?' })
    );
    expect(result).toEqual({ answered: true, question: 'Favourite colour?', answer: 'blue' });
  });

  it('normalizes bare string options to {label, value}', async () => {
    const ask = jest.fn().mockResolvedValue({ answer: 'a' });
    const action = createAskUserAction(makeService(ask));

    await action.handler!({ prompt: 'Pick', options: ['a', { label: 'B', value: 'b' }] }, 'tc-1');

    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { label: 'a', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      })
    );
  });

  it('fails instead of asking when no tool call id is supplied', async () => {
    // render() locates the pending question by tool call id, so a question registered under a
    // substitute id could never be shown and the handler would block until teardown.
    const ask = jest.fn();
    const action = createAskUserAction(makeService(ask));

    await expect(action.handler!({ prompt: 'Favourite colour?' }, undefined)).rejects.toThrow(
      /requires a toolCallId/
    );
    expect(ask).not.toHaveBeenCalled();
  });

  it('uses a failure message ToolExecutor will not reroute to the agent-tool path', async () => {
    // ToolExecutor treats "not found"/"not registered" as "this is not a registered action" and
    // sends the call down the agent-tool path, which would mask the failure.
    const action = createAskUserAction(makeService(jest.fn()));

    let message = '';
    try {
      await action.handler!({ prompt: 'q' }, undefined);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toBeTruthy();
    expect(message).not.toMatch(/not found|not registered/);
  });

  it('reports a declined answer with the question echoed back', async () => {
    const ask = jest.fn().mockResolvedValue({ declined: true });
    const action = createAskUserAction(makeService(ask));

    expect(await action.handler!({ prompt: 'q' }, 'tc-1')).toEqual({
      answered: false,
      declined: true,
      question: 'q',
    });
  });

  it('cancels when the request is torn down', async () => {
    const ask = jest.fn().mockResolvedValue({ cancelled: true });
    const action = createAskUserAction(makeService(ask));

    expect(await action.handler!({ prompt: 'q' }, 'tc-1')).toEqual({ cancelled: true });
  });
});
