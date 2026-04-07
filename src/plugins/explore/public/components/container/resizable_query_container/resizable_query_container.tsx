/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EuiResizableContainer } from '@elastic/eui';
import './resizable_query_container.scss';

// Fallback used only until the real measurement is available.
const QUERY_PANEL_FALLBACK_SIZE = 10;

interface ResizableQueryContainerProps {
  queryPanel: React.ReactNode;
  children: React.ReactNode;
}

export const ResizableQueryContainer: React.FC<ResizableQueryContainerProps> = ({
  queryPanel,
  children,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [queryPanelSize, setQueryPanelSize] = useState<number | null>(null);

  // Measure the query panel's natural content height by targeting the
  // innermost Monaco container, the widgets bar, and panel/editor padding.
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = containerRef.current;
      const panel = editorRef.current;
      if (!container || !panel) return;

      const containerHeight = container.clientHeight;
      if (containerHeight <= 0) return;

      // Widgets bar
      const widgetsEl = panel.querySelector('.exploreQueryPanelWidgets') as HTMLElement | null;
      const widgetsHeight = widgetsEl?.offsetHeight ?? 0;

      // Monaco's actual rendered content area
      const monacoContainer = panel.querySelector(
        '.react-monaco-editor-container'
      ) as HTMLElement | null;
      const monacoEl = monacoContainer?.querySelector('.monaco-editor') as HTMLElement | null;
      const viewLines = monacoEl?.querySelector('.view-lines') as HTMLElement | null;
      const monacoContentHeight = viewLines?.offsetHeight ?? 18; // fallback to single lineHeight

      const totalHeight = widgetsHeight + monacoContentHeight;
      const pct = Math.min(Math.max((totalHeight / containerHeight) * 100, 3), 60);
      setQueryPanelSize(pct);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const handlePanelWidthChange = useCallback(() => {
    window.dispatchEvent(new Event('resize'));
  }, []);

  // Dispatch resize on mount so Monaco calculates its layout correctly
  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    return () => clearTimeout(timer);
  }, []);

  // console.log(queryPanelSize, 'queryPanelSize');

  const size = queryPanelSize ?? QUERY_PANEL_FALLBACK_SIZE;
  const minSize = queryPanelSize != null ? `${queryPanelSize}%` : '5%';

  // console.log(size, minSize, 'size', 'minSize');

  return (
    <div ref={containerRef} className="exploreResizableQueryContainer__wrapper">
      <EuiResizableContainer
        key={queryPanelSize != null ? 'measured' : 'default'}
        direction="vertical"
        className="exploreResizableQueryContainer"
        onPanelWidthChange={handlePanelWidthChange}
      >
        {(EuiResizablePanel, EuiResizableButton) => (
          <>
            <EuiResizablePanel
              id="queryPanel"
              initialSize={size}
              minSize={minSize}
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
              initialSize={100 - size}
              minSize="40%"
              paddingSize="none"
              className="exploreResizableQueryContainer__contentPanel"
            >
              {children}
            </EuiResizablePanel>
          </>
        )}
      </EuiResizableContainer>
    </div>
  );
};
