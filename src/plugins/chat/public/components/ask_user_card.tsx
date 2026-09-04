/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useObservable } from 'react-use';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AskUserRequest, HumanInputService } from '../services/human_input_service';

import './ask_user_card.scss';

interface AskUserCardProps {
  request: AskUserRequest;
  /** Deliver the user's answer for this request. */
  onAnswer: (id: string, value: string) => void;
  /** Called when the user explicitly declines to answer. */
  onDismiss: (id: string) => void;
}

/**
 * Renders a structured question from the assistant (the `ask_user` tool) and
 * collects the user's answer. Rendered inline in the chat timeline while a
 * question is pending; the run is paused until {@link onAnswer} or
 * {@link onDismiss} is called.
 */
export const AskUserCard: React.FC<AskUserCardProps> = ({ request, onAnswer, onDismiss }) => {
  const [textValue, setTextValue] = useState('');

  const submitText = () => {
    const trimmed = textValue.trim();
    if (trimmed) {
      onAnswer(request.id, trimmed);
    }
  };

  const renderControls = () => {
    if (request.inputType === 'confirm') {
      return (
        <EuiFlexGroup gutterSize="s" responsive={false} wrap>
          <EuiFlexItem grow={false}>
            <EuiButton
              size="s"
              fill
              onClick={() => onAnswer(request.id, 'yes')}
              data-test-subj="askUserConfirmYes"
            >
              {i18n.translate('chat.askUser.confirmYes', { defaultMessage: 'Yes' })}
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              onClick={() => onAnswer(request.id, 'no')}
              data-test-subj="askUserConfirmNo"
            >
              {i18n.translate('chat.askUser.confirmNo', { defaultMessage: 'No' })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    // Text field + Send, reused for `text` and appended to `select` when allowFreeText.
    const textField = (
      <EuiFlexGroup gutterSize="s" responsive={false} alignItems="center">
        <EuiFlexItem>
          <EuiFieldText
            compressed
            fullWidth
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitText();
            }}
            placeholder={i18n.translate('chat.askUser.textPlaceholder', {
              defaultMessage: 'Type your answer...',
            })}
            data-test-subj="askUserTextInput"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            fill
            onClick={submitText}
            disabled={!textValue.trim()}
            data-test-subj="askUserTextSubmit"
          >
            {i18n.translate('chat.askUser.textSubmit', { defaultMessage: 'Send' })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );

    if (request.inputType === 'select' && request.options && request.options.length > 0) {
      return (
        <>
          <EuiFlexGroup gutterSize="s" responsive={false} wrap>
            {request.options.map((option) => (
              <EuiFlexItem grow={false} key={option.value}>
                <EuiButton
                  size="s"
                  onClick={() => onAnswer(request.id, option.value)}
                  data-test-subj={`askUserOption-${option.value}`}
                >
                  {option.label}
                </EuiButton>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
          {request.allowFreeText && (
            <>
              <EuiSpacer size="s" />
              <EuiText size="xs" color="subdued">
                {i18n.translate('chat.askUser.orTypeOwn', {
                  defaultMessage: 'Or type your own answer:',
                })}
              </EuiText>
              <EuiSpacer size="xs" />
              {textField}
            </>
          )}
        </>
      );
    }

    return textField;
  };

  return (
    <EuiPanel
      paddingSize="s"
      hasShadow={false}
      hasBorder
      data-test-subj="askUserCard"
      className="askUserCard"
    >
      <EuiText size="s">
        <p>{request.prompt}</p>
      </EuiText>
      <EuiSpacer size="s" />
      {renderControls()}
      <EuiSpacer size="xs" />
      <EuiButtonEmpty
        size="xs"
        color="text"
        onClick={() => onDismiss(request.id)}
        data-test-subj="askUserDismiss"
      >
        {i18n.translate('chat.askUser.dismiss', { defaultMessage: "Skip / don't answer" })}
      </EuiButtonEmpty>
    </EuiPanel>
  );
};

interface AskUserAnsweredCardProps {
  /** The question prompt. */
  prompt?: string;
  /** The user's answer, when available (absent on reload until the result is restored). */
  answer?: string;
}

/** Read-only rendering of a resolved / restored `ask_user` question: prompt + answer, no icon. */
export const AskUserAnsweredCard: React.FC<AskUserAnsweredCardProps> = ({ prompt, answer }) => (
  <EuiPanel
    paddingSize="s"
    hasShadow={false}
    hasBorder
    data-test-subj="askUserAnsweredCard"
    className="askUserCard"
  >
    {prompt && (
      <EuiText size="s">
        <p>{prompt}</p>
      </EuiText>
    )}
    {answer && (
      <>
        <EuiSpacer size="xs" />
        <EuiText size="xs" color="subdued">
          {i18n.translate('chat.askUser.answerLabel', {
            defaultMessage: 'Your answer: {answer}',
            values: { answer },
          })}
        </EuiText>
      </>
    )}
  </EuiPanel>
);

interface InlineAskUserProps {
  humanInputService: HumanInputService;
  /** The tool call this row represents, used to find its pending question. */
  toolCallId?: string;
  /** Question prompt, from the persisted tool-call arguments (resolved fallback). */
  prompt?: string;
  /** The user's answer, once resolved / restored. */
  answer?: string;
}

/**
 * In-conversation rendering of an `ask_user` tool call (the tool's custom
 * renderer, so the question sits inline at the tool-call position instead of
 * floating near the composer). Shows the interactive {@link AskUserCard} while
 * the question is pending in {@link HumanInputService}, else the read-only
 * {@link AskUserAnsweredCard}.
 */
export const InlineAskUser: React.FC<InlineAskUserProps> = ({
  humanInputService,
  toolCallId,
  prompt,
  answer,
}) => {
  const pending = useObservable(humanInputService.getPending$(), humanInputService.getPending());
  const request = toolCallId ? pending.find((req) => req.toolCallId === toolCallId) : undefined;

  // Prefer the locally-recorded answer (set synchronously on click) so it shows
  // immediately; fall back to the `answer` prop (from a restored result on reload).
  const localAnswers = useObservable(
    humanInputService.getAnswers$(),
    humanInputService.getAnswers()
  );
  const resolvedAnswer = (toolCallId && localAnswers.get(toolCallId)) || answer;

  const containerRef = useRef<HTMLDivElement>(null);
  const isPending = !!request;

  // The card is driven by service state, not the timeline, so the message
  // list's auto-scroll misses it. Scroll it into view when it becomes pending.
  useEffect(() => {
    if (isPending) {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isPending]);

  // Prompt not streamed in yet — show a lightweight loading line (mirrors the
  // message list's "Thinking…" indicator) instead of nothing or an empty card,
  // bridging the gap between the hidden "Thinking…" and the rendered question.
  if (!request && !prompt && !resolvedAnswer) {
    return (
      <div className="askUserCard__generating" data-test-subj="askUserGenerating">
        {i18n.translate('chat.askUser.generating', { defaultMessage: 'Generating…' })}
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {request ? (
        <AskUserCard
          // Key by request id so a different question remounts (resets text input).
          key={request.id}
          request={request}
          onAnswer={(id, value) => humanInputService.answer(id, value)}
          onDismiss={(id) => humanInputService.decline(id)}
        />
      ) : (
        <AskUserAnsweredCard prompt={prompt} answer={resolvedAnswer} />
      )}
    </div>
  );
};
