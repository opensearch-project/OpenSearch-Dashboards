/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useRef, useState } from 'react';
import { AutoResizingTextarea } from './auto-resizing-textarea';
import { SubmitButton } from './submit-button';
import { useChatContext } from '../chat-context';
import { Message } from '../../../common/types';
import './input-wrapper.scss';
import { EuiButtonIcon } from '@elastic/eui';

const MAX_NEWLINES = 6;

export interface InputProps {
  inProgress: boolean;
  onSend: (text: string) => Promise<Message>;
  onStop?: () => void;
  onUpload?: () => void;
  hideStopButton?: boolean;
}

export const InputWrapper = ({
  inProgress,
  onSend,
  onStop,
  onUpload,
  hideStopButton = false,
}: InputProps) => {
  const context = useChatContext();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const handleDivClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    // If the user clicked a button or inside a button, don't focus the textarea
    if (target.closest('button')) return;

    // If the user clicked the textarea, do nothing (it's already focused)
    if (target.tagName === 'TEXTAREA') return;

    // Otherwise, focus the textarea
    textareaRef.current?.focus();
  };

  const [text, setText] = useState('');
  const send = () => {
    if (inProgress) return;
    onSend(text);
    setText('');

    textareaRef.current?.focus();
  };

  const buttonIcon = inProgress && !hideStopButton ? 'stop' : 'sortUp';

  const canSend = useMemo(() => {
    // TODO: Do we need langGraphInterruptAction here?

    return !inProgress && text.trim().length > 0;
  }, [inProgress, text]);

  const canStop = useMemo(() => {
    return inProgress && !hideStopButton;
  }, [inProgress, hideStopButton]);

  const sendDisabled = !canSend && !canStop;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div className="chatInputWrapper" onClick={handleDivClick}>
      <AutoResizingTextarea
        ref={textareaRef}
        placeholder={context.labels.placeholder}
        autoFocus={false}
        maxRows={MAX_NEWLINES}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
            event.preventDefault();
            if (canSend) {
              send();
            }
          }
        }}
      />
      <div className="chatInputWrapper__controls">
        {onUpload && <EuiButtonIcon iconType="menuUp" onClick={onUpload} />}
        <div style={{ flexGrow: 1 }} />
        <SubmitButton
          disabled={sendDisabled}
          onClick={inProgress && !hideStopButton ? onStop : send}
          dataTestSubj={inProgress ? 'chat-request-in-progress' : 'chat-ready'}
          icon={buttonIcon}
        />
      </div>
    </div>
  );
};
