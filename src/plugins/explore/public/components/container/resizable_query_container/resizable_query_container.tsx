/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { EuiResizableContainer } from '@elastic/eui';
import './resizable_query_container.scss';

// Approximate pixel height needed for the query panel to show one line:
// widgets bar (~32px) + editor line (~18px) + editor padding/border (~22px)
const QUERY_PANEL_SINGLE_LINE_PX = 72;
const QUERY_PANEL_MIN_SIZE = '3%';

// Compute initial size as a percentage of the viewport so the panel
// always fits at least one editor line regardless of screen height.
function getInitialQueryPanelSize(): number {
  const viewportHeight = window.innerHeight || 800;
  const pct = (QUERY_PANEL_SINGLE_LINE_PX / viewportHeight) * 100;
  // Clamp between 5% and 15% to stay reasonable on all screen sizes
  return Math.min(Math.max(pct, 5), 15);
}

interface ResizableQueryContainerProps {
  queryPanel: React.ReactNode;
  children: React.ReactNode;
}

export const ResizableQueryContainer: React.FC<ResizableQueryContainerProps> = ({
  queryPanel,
  children,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialSize = useMemo(() => getInitialQueryPanelSize(), []);

  const handlePanelWidthChange = useCallback(() => {
    window.dispatchEvent(new Event('resize'));
  }, []);

  // Dispatch resize on mount so Monaco calculates its layout correctly
  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    return () => clearTimeout(timer);
  }, []);

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
            initialSize={initialSize}
            minSize={QUERY_PANEL_MIN_SIZE}
            paddingSize="none"
            className="exploreResizableQueryContainer__queryPanel"
          >
            <div ref={editorRef} className="exploreResizableQueryContainer__queryPanelInner">
              {queryPanel}
            </div>
          </EuiResizablePanel>
          <EuiResizableButton className="exploreResizableQueryContainer__resizeHandle" />
          <EuiResizablePanel
            id="contentPanel"
            initialSize={100 - initialSize}
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
