/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { ChatServiceStart } from '../../../../../core/public';
import { AgentError } from '../utils';
import { AskT2pplErrorButton } from './ask_t2ppl_error_button';

const TEST_ID = 'testAskAiForHelp';

const createChatService = () => {
  const sendMessageWithWindow = jest.fn().mockResolvedValue(undefined);
  return {
    chatService: { sendMessageWithWindow } as unknown as ChatServiceStart,
    sendMessageWithWindow,
  };
};

describe('<AskT2pplErrorButton />', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders as an EuiLink by default', () => {
    const { chatService } = createChatService();
    const { getByTestId } = render(
      <AskT2pplErrorButton
        chatService={chatService}
        error={new Error('boom')}
        testSource={TEST_ID}
      />
    );
    // EuiLink with an onClick renders a <button> too, so distinguish by class.
    expect(getByTestId(TEST_ID).className).toContain('euiLink');
  });

  it('renders as an EuiButton when as="button"', () => {
    const { chatService } = createChatService();
    const { getByTestId } = render(
      <AskT2pplErrorButton
        as="button"
        chatService={chatService}
        error={new Error('boom')}
        testSource={TEST_ID}
      />
    );
    expect(getByTestId(TEST_ID).className).toContain('euiButton');
  });

  it('uses error.message as the reason for a plain Error and includes the question', () => {
    const { chatService, sendMessageWithWindow } = createChatService();
    const { getByTestId } = render(
      <AskT2pplErrorButton
        chatService={chatService}
        error={new Error('something failed')}
        question="show me errors"
        testSource={TEST_ID}
      />
    );

    fireEvent.click(getByTestId(TEST_ID));

    const [message, attachments] = sendMessageWithWindow.mock.calls[0];
    expect(message).toContain('from my question "show me errors"');
    expect(message).toContain('Reason: something failed');
    expect(message).not.toContain('Details:');
    expect(attachments).toEqual([]);
  });

  it('omits the question phrase when no question is provided', () => {
    const { chatService, sendMessageWithWindow } = createChatService();
    const { getByTestId } = render(
      <AskT2pplErrorButton
        chatService={chatService}
        error={new Error('failed')}
        testSource={TEST_ID}
      />
    );

    fireEvent.click(getByTestId(TEST_ID));

    const [message] = sendMessageWithWindow.mock.calls[0];
    expect(message).not.toContain('from my question');
  });

  it('uses the agent reason and extracted details for an AgentError', () => {
    const { chatService, sendMessageWithWindow } = createChatService();
    const agentError = new AgentError({
      error: {
        reason: 'Invalid Request',
        details: `Error from remote service: ${JSON.stringify({
          OriginalMessage: JSON.stringify({ error: 'index not found' }),
        })}`,
        type: 'IllegalArgumentException',
      },
      status: 400,
    });

    const { getByTestId } = render(
      <AskT2pplErrorButton
        chatService={chatService}
        error={agentError}
        question="q"
        testSource={TEST_ID}
      />
    );

    fireEvent.click(getByTestId(TEST_ID));

    const [message] = sendMessageWithWindow.mock.calls[0];
    expect(message).toContain('Reason: Invalid Request');
    expect(message).toContain('Details: index not found');
  });

  it('does not throw when no chatService is provided', () => {
    const { getByTestId } = render(
      <AskT2pplErrorButton error={new Error('boom')} testSource={TEST_ID} />
    );
    expect(() => fireEvent.click(getByTestId(TEST_ID))).not.toThrow();
  });
});
