/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { AskErrorButton } from './ask_error_button';

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

const useOpenSearchDashboardsMock = useOpenSearchDashboards as jest.Mock;

const TEST_ID = 'discoverQueryErrorAskAiForHelp';

const setup = (options: { chatAvailable?: boolean } = {}) => {
  const { chatAvailable = true } = options;
  const sendMessageWithWindow = jest.fn().mockResolvedValue(undefined);
  const isAvailable = jest.fn().mockReturnValue(chatAvailable);
  useOpenSearchDashboardsMock.mockReturnValue({
    services: { core: { chat: { isAvailable, sendMessageWithWindow } } },
  });
  return { sendMessageWithWindow, isAvailable };
};

describe('<AskErrorButton />', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders nothing when chat is unavailable', () => {
    setup({ chatAvailable: false });
    const { queryByTestId } = render(<AskErrorButton testSource={TEST_ID} />);
    expect(queryByTestId(TEST_ID)).toBeNull();
  });

  it('renders nothing when the chat service is missing entirely', () => {
    useOpenSearchDashboardsMock.mockReturnValue({ services: { core: {} } });
    const { queryByTestId } = render(<AskErrorButton testSource={TEST_ID} />);
    expect(queryByTestId(TEST_ID)).toBeNull();
  });

  it('renders the link when chat is available', () => {
    setup();
    const { getByTestId } = render(<AskErrorButton testSource={TEST_ID} />);
    expect(getByTestId(TEST_ID)).toBeInTheDocument();
  });

  it('uses the provided testSource as the test id', () => {
    setup();
    const { getByTestId } = render(<AskErrorButton testSource="discoverNoResultsAskAiForHelp" />);
    expect(getByTestId('discoverNoResultsAskAiForHelp')).toBeInTheDocument();
  });

  it('sends the error-specific message when an error is provided', () => {
    const { sendMessageWithWindow } = setup();
    const { getByTestId } = render(
      <AskErrorButton getError={() => 'boom parse error'} testSource={TEST_ID} />
    );

    fireEvent.click(getByTestId(TEST_ID));

    expect(sendMessageWithWindow).toHaveBeenCalledTimes(1);
    const [message, attachments] = sendMessageWithWindow.mock.calls[0];
    expect(message).toContain('failed to run with the following error: "boom parse error"');
    expect(attachments).toEqual([]);
  });

  it('sends the no-results message when there is no error', () => {
    const { sendMessageWithWindow } = setup();
    const { getByTestId } = render(
      <AskErrorButton getError={() => undefined} testSource={TEST_ID} />
    );

    fireEvent.click(getByTestId(TEST_ID));

    const [message] = sendMessageWithWindow.mock.calls[0];
    expect(message).toContain('returned no results');
  });

  it('sends the no-results message when no getError prop is passed', () => {
    const { sendMessageWithWindow } = setup();
    const { getByTestId } = render(<AskErrorButton testSource={TEST_ID} />);

    fireEvent.click(getByTestId(TEST_ID));

    const [message] = sendMessageWithWindow.mock.calls[0];
    expect(message).toContain('returned no results');
  });
});
