/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

interface UseFlyoutResizeResult {
  flyoutWidth: number;
  isResizingFlyout: boolean;
  handleFlyoutMouseDown: (e: React.MouseEvent) => void;
}

export const useFlyoutResize = (): UseFlyoutResizeResult => {
  const [flyoutWidth, setFlyoutWidth] = useState<number>();
  const [isResizingFlyout, setIsResizingFlyout] = useState(false);

  const handleFlyoutMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingFlyout(true);
  }, []);

  useEffect(() => {
    if (!isResizingFlyout) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const maxWidth = window.innerWidth * 0.95;
      setFlyoutWidth(Math.max(600, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizingFlyout(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingFlyout]);

  return { flyoutWidth, isResizingFlyout, handleFlyoutMouseDown };
};
