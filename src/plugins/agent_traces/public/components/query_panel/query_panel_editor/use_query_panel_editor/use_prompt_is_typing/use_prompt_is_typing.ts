/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export const PROMPT_IS_TYPING_TIMEOUT = 300;

/**
 * Custom hook to handle the 'isTyping' state for when the editor is in prompt mode.
 * It is used to add CSS class to the editor when the user is typing in the prompt.
 */
export const usePromptIsTyping = () => {
  const [promptIsTyping, setPromptIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChangeForPromptIsTyping = useCallback(() => {
    setPromptIsTyping(true);

    // clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setPromptIsTyping(false);
    }, PROMPT_IS_TYPING_TIMEOUT);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    promptIsTyping,
    handleChangeForPromptIsTyping,
  };
};
