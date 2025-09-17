/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import { useEffect, useRef, useState } from 'react';
import { useAssistantContext } from './use_assistant_context';

/**
 * Hook that monitors text selection and registers it with the assistant context
 * Part of the OSD Assistant framework
 */
export const useTextSelection = () => {
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentSelection, setCurrentSelection] = useState<string>('');
  const lastSelectedTextRef = useRef<string>('');
  const hasSelectionRef = useRef<boolean>(false);

  console.log('[TEXT_SELECTION] Hook initialized, current selection:', currentSelection);

  const handleSelectionChange = () => {
    console.log('[TEXT_SELECTION] Selection event triggered');

    // Get the current selection immediately
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';

    console.log('[TEXT_SELECTION] Immediate selected text:', selectedText);

    // Store if we have a selection right now
    if (selectedText.length >= 3) {
      lastSelectedTextRef.current = selectedText;
      hasSelectionRef.current = true;
      console.log('[TEXT_SELECTION] Stored valid selection:', selectedText);
    }

    // Clear any pending timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // Debounce the state update to avoid excessive re-renders
    selectionTimeoutRef.current = setTimeout(() => {
      // If we had a valid selection, use it
      if (hasSelectionRef.current && lastSelectedTextRef.current) {
        console.log(
          '[TEXT_SELECTION] Setting selection state to stored:',
          lastSelectedTextRef.current
        );
        setCurrentSelection(lastSelectedTextRef.current);
      } else {
        // Only clear if we explicitly have no selection AND no stored selection
        const currentSel = window.getSelection();
        const currentText = currentSel?.toString().trim() || '';

        if (!currentText && !lastSelectedTextRef.current) {
          console.log('[TEXT_SELECTION] Clearing selection (no stored or current selection)');
          setCurrentSelection('');
        }
      }
    }, 500);
  };

  const handleMouseDown = (e: MouseEvent) => {
    // Check if clicking on chat-related elements
    const target = e.target as HTMLElement;
    const isClickOnChat =
      target.closest('.chat-sidecar') ||
      target.closest('.chatInput') ||
      target.closest('.chatMessages') ||
      target.closest('[aria-label="Toggle chat assistant"]');

    if (!isClickOnChat) {
      // Only clear if there's no new selection after a brief delay
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim() || '';

        if (!selectedText) {
          console.log('[TEXT_SELECTION] Clearing selection on non-chat click');
          lastSelectedTextRef.current = '';
          hasSelectionRef.current = false;
          setCurrentSelection('');
        }
      }, 100);
    } else {
      console.log('[TEXT_SELECTION] Click on chat element, preserving selection');
    }
  };

  useEffect(() => {
    console.log('[TEXT_SELECTION] Setting up event listeners');

    // Listen for selection events
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      console.log('[TEXT_SELECTION] Cleaning up event listeners');

      // Cleanup listeners
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
      document.removeEventListener('mousedown', handleMouseDown);

      // Clear any pending timeout
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);

  // Log when context is being registered
  const contextData = currentSelection
    ? {
        description: `Selected text from the page`,
        value: {
          text: currentSelection,
          url: window.location.href,
          timestamp: Date.now(),
        },
        label: `"${currentSelection.substring(0, 30)}${currentSelection.length > 30 ? '...' : ''}"`,
        categories: ['selection', 'chat'],
      }
    : null;

  console.log('[TEXT_SELECTION] Registering context with useAssistantContext:', contextData);

  // Register the selected text with assistant context
  useAssistantContext(contextData);

  return currentSelection;
};
