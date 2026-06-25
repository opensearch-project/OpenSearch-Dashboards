/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { EuiPopover, EuiPopoverProps } from '@elastic/eui';

interface SimplePopoverProps extends Omit<EuiPopoverProps, 'button' | 'isOpen' | 'closePopover'> {
  button: React.ReactElement;
  children: React.ReactNode;
  debounceMs?: number;
  /**
   * When true, the anchor wrapper fills its container (full-width nav rows).
   * Defaults to false, where it shrinks to the trigger (icon rail).
   */
  fullWidthAnchor?: boolean;
  /**
   * When true, the anchor wrapper is marked as the current/selected item, so it
   * can carry the persistent "active" styling (grey fill + accent bar) even when
   * the popover is closed.
   */
  isActive?: boolean;
}

/**
 * A hover-triggered EuiPopover wrapper. Opens on mouse enter with a debounce,
 * closes on mouse leave from both the button and the popover panel.
 */
export function SimplePopover({
  button,
  children,
  debounceMs = 150,
  fullWidthAnchor = false,
  isActive = false,
  ...popoverProps
}: SimplePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, debounceMs);
  }, [debounceMs, cancelClose]);

  const handleMouseEnter = useCallback(() => {
    cancelClose();
    setIsOpen(true);
  }, [cancelClose]);

  const handleMouseLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  const close = useCallback(() => {
    cancelClose();
    setIsOpen(false);
  }, [cancelClose]);

  // Keyboard a11y: this is a hover popover, but a keyboard-only user must still
  // be able to reach its actions. Open it when the trigger receives focus (Tab
  // lands on the inner button), so the panel — and the links/actions inside it —
  // become reachable. Closing stays mouse/Escape-driven; we deliberately do NOT
  // close on blur, because Tab moving focus from the trigger into the portaled
  // panel blurs the wrapper and would otherwise slam the panel shut before the
  // user can operate it.
  const handleFocus = useCallback(() => {
    cancelClose();
    setIsOpen(true);
  }, [cancelClose]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        close();
      }
    },
    [isOpen, close]
  );

  // Dismiss the popover when the trigger itself is clicked (e.g. a nav icon that
  // navigates) and when any actionable element inside the panel is clicked
  // (e.g. a flyout link). Without this the popover would linger after the click
  // navigates away. onClickCapture is used (not onClick) so the wrapper stays a
  // non-interactive container — the underlying button/link remains the only
  // focusable, keyboard-operable element.
  const wrappedButton = (
    <div
      className={classNames('obsSimplePopover-anchor', {
        'obsSimplePopover-anchor--fullWidth': fullWidthAnchor,
        'obsSimplePopover-anchor--open': isOpen,
        'obsSimplePopover-anchor--active': isActive,
      })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleFocus}
      onKeyDown={handleKeyDown}
      onClickCapture={close}
    >
      {button}
    </div>
  );

  return (
    <EuiPopover
      button={wrappedButton}
      isOpen={isOpen}
      closePopover={close}
      // Seamless "slide from the rail" feel: no arrow and zero offset so the
      // panel butts flush against the nav edge (Datadog-style). Overridable.
      hasArrow={false}
      offset={0}
      // Hover popover: don't trap or auto-move focus, otherwise the first row
      // gets an unwanted "selected" focus ring on open.
      ownFocus={false}
      initialFocus={false}
      panelProps={{
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onClickCapture: close,
      }}
      {...popoverProps}
    >
      {children}
    </EuiPopover>
  );
}
