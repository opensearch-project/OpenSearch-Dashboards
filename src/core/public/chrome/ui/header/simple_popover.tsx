/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EuiPopover, EuiPopoverProps } from '@elastic/eui';

interface SimplePopoverProps extends Omit<EuiPopoverProps, 'button' | 'isOpen' | 'closePopover'> {
  button: React.ReactElement;
  children: React.ReactNode;
  debounceMs?: number;
}

/**
 * A hover-triggered EuiPopover wrapper. Opens on mouse enter with a debounce,
 * closes on mouse leave from both the button and the popover panel.
 */
export function SimplePopover({
  button,
  children,
  debounceMs = 150,
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

  const wrappedButton = (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {button}
    </div>
  );

  return (
    <EuiPopover
      button={wrappedButton}
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelProps={{
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      }}
      {...popoverProps}
    >
      {children}
    </EuiPopover>
  );
}
