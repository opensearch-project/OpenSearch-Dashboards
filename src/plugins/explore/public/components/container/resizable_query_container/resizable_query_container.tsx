/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect } from 'react';
import { EuiResizableContainer } from '@elastic/eui';
import './resizable_query_container.scss';

const QUERY_PANEL_MIN_SIZE = '5%';
const QUERY_PANEL_INITIAL_SIZE = 10;
const CONTENT_PANEL_INITIAL_SIZE = 90;
const STORAGE_KEY = 'explore:queryPanelSize';

interface ResizableQueryContainerProps {
  queryPanel: React.ReactNode;
  children: React.ReactNode;
}

export const ResizableQueryContainer: React.FC<ResizableQueryContainerProps> = ({
  queryPanel,
  children,
}) => {
  const getInitialSize = useCallback((): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= 5 && parsed <= 60) return parsed;
      }
    } catch {
      // Ignore localStorage errors
    }
    return QUERY_PANEL_INITIAL_SIZE;
  }, []);

  const handlePanelWidthChange = useCallback((newSizes: Record<string, number>) => {
    const querySize = newSizes.queryPanel;
    if (querySize != null) {
      try {
        localStorage.setItem(STORAGE_KEY, String(querySize));
      } catch {
        // Ignore localStorage errors
      }
    }

    // Trigger Monaco editor relayout after resize
    window.dispatchEvent(new Event('resize'));
  }, []);

  // Dispatch resize on mount so Monaco calculates its layout correctly
  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    return () => clearTimeout(timer);
  }, []);

  const initialQuerySize = getInitialSize();
  const initialContentSize = 100 - initialQuerySize;

  console.log('-------------------drga');
  return (
    <EuiResizableContainer
      direction="vertical"
      className="exploreResizableQueryContainer"
      onPanelWidthChange={handlePanelWidthChange}
    >
      {(EuiResizablePanel, EuiResizableButton) => (
        <>
          <EuiResizablePanel
            id="queryPanel"
            initialSize={initialQuerySize}
            minSize={QUERY_PANEL_MIN_SIZE}
            paddingSize="none"
            className="exploreResizableQueryContainer__queryPanel"
          >
            <div className="exploreResizableQueryContainer__queryPanelInner">{queryPanel}</div>
          </EuiResizablePanel>
          <EuiResizableButton className="exploreResizableQueryContainer__resizeHandle" />
          <EuiResizablePanel
            id="contentPanel"
            initialSize={initialContentSize}
            minSize="40%"
            paddingSize="none"
            className="exploreResizableQueryContainer__contentPanel"
          >
            {children}
          </EuiResizablePanel>
        </>
      )}
    </EuiResizableContainer>
  );
};
