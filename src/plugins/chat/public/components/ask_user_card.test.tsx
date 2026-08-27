/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { AskUserCard, AskUserAnsweredCard, InlineAskUser } from './ask_user_card';
import { AskUserRequest, HumanInputService } from '../services/human_input_service';

const baseRequest = (overrides: Partial<AskUserRequest> = {}): AskUserRequest => ({
  id: 'req-1',
  toolCallId: 'tc-1',
  prompt: 'Which index?',
  inputType: 'text',
  timestamp: 0,
  ...overrides,
});

describe('AskUserCard', () => {
  it('renders the prompt and a dismiss affordance', () => {
    const { getByText, getByTestId } = render(
      <AskUserCard request={baseRequest()} onAnswer={jest.fn()} onDismiss={jest.fn()} />
    );

    expect(getByText('Which index?')).toBeTruthy();
    expect(getByTestId('askUserDismiss')).toBeTruthy();
  });

  it('calls onDismiss with the request id', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <AskUserCard request={baseRequest()} onAnswer={jest.fn()} onDismiss={onDismiss} />
    );

    fireEvent.click(getByTestId('askUserDismiss'));
    expect(onDismiss).toHaveBeenCalledWith('req-1');
  });

  describe('text input', () => {
    it('submits trimmed text via the Send button', () => {
      const onAnswer = jest.fn();
      const { getByTestId } = render(
        <AskUserCard request={baseRequest()} onAnswer={onAnswer} onDismiss={jest.fn()} />
      );

      fireEvent.change(getByTestId('askUserTextInput'), { target: { value: '  logs-2024  ' } });
      fireEvent.click(getByTestId('askUserTextSubmit'));

      expect(onAnswer).toHaveBeenCalledWith('req-1', 'logs-2024');
    });

    it('submits on Enter', () => {
      const onAnswer = jest.fn();
      const { getByTestId } = render(
        <AskUserCard request={baseRequest()} onAnswer={onAnswer} onDismiss={jest.fn()} />
      );

      const input = getByTestId('askUserTextInput');
      fireEvent.change(input, { target: { value: 'metrics' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onAnswer).toHaveBeenCalledWith('req-1', 'metrics');
    });

    it('does not submit empty / whitespace-only text', () => {
      const onAnswer = jest.fn();
      const { getByTestId } = render(
        <AskUserCard request={baseRequest()} onAnswer={onAnswer} onDismiss={jest.fn()} />
      );

      fireEvent.change(getByTestId('askUserTextInput'), { target: { value: '   ' } });
      fireEvent.click(getByTestId('askUserTextSubmit'));

      expect(onAnswer).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('sends yes / no', () => {
      const onAnswer = jest.fn();
      const { getByTestId } = render(
        <AskUserCard
          request={baseRequest({ inputType: 'confirm' })}
          onAnswer={onAnswer}
          onDismiss={jest.fn()}
        />
      );

      fireEvent.click(getByTestId('askUserConfirmYes'));
      expect(onAnswer).toHaveBeenCalledWith('req-1', 'yes');

      fireEvent.click(getByTestId('askUserConfirmNo'));
      expect(onAnswer).toHaveBeenCalledWith('req-1', 'no');
    });
  });

  describe('select', () => {
    const selectRequest = (overrides: Partial<AskUserRequest> = {}) =>
      baseRequest({
        inputType: 'select',
        options: [
          { label: 'Logs', value: 'logs' },
          { label: 'Metrics', value: 'metrics' },
        ],
        ...overrides,
      });

    it('renders one button per option and sends its value', () => {
      const onAnswer = jest.fn();
      const { getByTestId } = render(
        <AskUserCard request={selectRequest()} onAnswer={onAnswer} onDismiss={jest.fn()} />
      );

      fireEvent.click(getByTestId('askUserOption-metrics'));
      expect(onAnswer).toHaveBeenCalledWith('req-1', 'metrics');
    });

    it('does not show a text field when allowFreeText is unset', () => {
      const { queryByTestId } = render(
        <AskUserCard request={selectRequest()} onAnswer={jest.fn()} onDismiss={jest.fn()} />
      );

      expect(queryByTestId('askUserTextInput')).toBeNull();
    });

    it('shows both option buttons and a text field when allowFreeText is set', () => {
      const onAnswer = jest.fn();
      const { getByTestId } = render(
        <AskUserCard
          request={selectRequest({ allowFreeText: true })}
          onAnswer={onAnswer}
          onDismiss={jest.fn()}
        />
      );

      // Options still work.
      expect(getByTestId('askUserOption-logs')).toBeTruthy();
      // And the free-text path is available and submits the typed value.
      fireEvent.change(getByTestId('askUserTextInput'), { target: { value: 'traces' } });
      fireEvent.click(getByTestId('askUserTextSubmit'));
      expect(onAnswer).toHaveBeenCalledWith('req-1', 'traces');
    });

    it('falls back to a text field when select has no options', () => {
      const { getByTestId, queryByTestId } = render(
        <AskUserCard
          request={selectRequest({ options: [] })}
          onAnswer={jest.fn()}
          onDismiss={jest.fn()}
        />
      );

      expect(getByTestId('askUserTextInput')).toBeTruthy();
      expect(queryByTestId('askUserOption-logs')).toBeNull();
    });
  });
});

describe('AskUserAnsweredCard', () => {
  it('shows the prompt and the answer when both are present', () => {
    const { getByText } = render(<AskUserAnsweredCard prompt="Which index?" answer="logs" />);

    expect(getByText('Which index?')).toBeTruthy();
    expect(getByText('Your answer: logs')).toBeTruthy();
  });

  it('shows the prompt without an answer line when no answer is available', () => {
    const { getByText, queryByText } = render(<AskUserAnsweredCard prompt="Which index?" />);

    expect(getByText('Which index?')).toBeTruthy();
    // No "Your answer:" line when there is no answer.
    expect(queryByText(/Your answer:/)).toBeNull();
  });

  it('renders without crashing when neither prompt nor answer is present', () => {
    const { getByTestId } = render(<AskUserAnsweredCard />);
    expect(getByTestId('askUserAnsweredCard')).toBeTruthy();
  });
});

describe('InlineAskUser', () => {
  let service: HumanInputService;

  beforeEach(() => {
    service = new HumanInputService();
  });

  it('renders the interactive card while its toolCallId is pending', () => {
    // Register a pending question for tc-1.
    service.ask({ toolCallId: 'tc-1', prompt: 'Pick one', inputType: 'text' });

    const { getByTestId } = render(
      <InlineAskUser humanInputService={service} toolCallId="tc-1" prompt="Pick one" />
    );

    expect(getByTestId('askUserCard')).toBeTruthy();
  });

  it('renders the answered card when nothing is pending for the toolCallId', () => {
    const { getByTestId, getByText } = render(
      <InlineAskUser humanInputService={service} toolCallId="tc-1" prompt="Pick one" answer="A" />
    );

    expect(getByTestId('askUserAnsweredCard')).toBeTruthy();
    expect(getByText('Your answer: A')).toBeTruthy();
  });

  it('shows a "generating" placeholder when not pending and no prompt/answer yet', () => {
    // The window after the tool call arrives but before its arguments (prompt)
    // stream in: show the generating indicator, not the card and not an empty node.
    const { queryByTestId, getByTestId } = render(
      <InlineAskUser humanInputService={service} toolCallId="tc-1" />
    );

    expect(queryByTestId('askUserCard')).toBeNull();
    expect(queryByTestId('askUserAnsweredCard')).toBeNull();
    expect(getByTestId('askUserGenerating')).toBeTruthy();
  });

  it('flips from interactive to answered in place, showing the answer immediately', () => {
    service.ask({ toolCallId: 'tc-1', prompt: 'Pick one', inputType: 'text' });

    const { getByTestId, queryByTestId, getByText } = render(
      // No `answer` prop: the answer must come from the locally-recorded value,
      // not a streamed tool result, proving it shows without the continuation run.
      <InlineAskUser humanInputService={service} toolCallId="tc-1" prompt="Pick one" />
    );

    // Interactive initially.
    expect(getByTestId('askUserCard')).toBeTruthy();

    // Answer via the field; the service resolves and drops it from pending.
    fireEvent.change(getByTestId('askUserTextInput'), { target: { value: 'chosen' } });
    fireEvent.click(getByTestId('askUserTextSubmit'));

    // Now no longer pending -> shows the answered card WITH the answer, even
    // though no `answer` prop / tool result was provided.
    expect(queryByTestId('askUserCard')).toBeNull();
    expect(getByTestId('askUserAnsweredCard')).toBeTruthy();
    expect(getByText('Your answer: chosen')).toBeTruthy();
  });

  it('prefers a locally-recorded answer over the answer prop', () => {
    service.ask({ toolCallId: 'tc-1', prompt: 'Pick one', inputType: 'text' });

    const { getByTestId, getByText } = render(
      <InlineAskUser humanInputService={service} toolCallId="tc-1" prompt="Pick one" answer="old" />
    );

    fireEvent.change(getByTestId('askUserTextInput'), { target: { value: 'fresh' } });
    fireEvent.click(getByTestId('askUserTextSubmit'));

    expect(getByText('Your answer: fresh')).toBeTruthy();
  });

  it('does not match a different tool call still pending', () => {
    service.ask({ toolCallId: 'other-tc', prompt: 'Different', inputType: 'text' });

    const { getByTestId, queryByTestId } = render(
      <InlineAskUser humanInputService={service} toolCallId="tc-1" prompt="Pick one" />
    );

    // tc-1 is not pending, so the answered card renders, not the interactive one.
    expect(queryByTestId('askUserCard')).toBeNull();
    expect(getByTestId('askUserAnsweredCard')).toBeTruthy();
  });
});
