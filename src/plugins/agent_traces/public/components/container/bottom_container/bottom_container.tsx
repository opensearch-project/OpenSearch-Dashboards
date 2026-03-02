/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { EuiResizableContainer, EuiPageBody, useIsWithinBreakpoints } from '@elastic/eui';
import { CanvasPanel } from '../../panel/canvas_panel';
import { DiscoverPanel } from '../../fields_selector/fields_selector_panel';
import { BottomRightContainer } from './bottom_right_container';
import { SidebarPanelContext } from './sidebar_panel_context';

export const BottomContainer = () => {
  const isMobile = useIsWithinBreakpoints(['xs', 's', 'm']);
  const isCollapsedRef = useRef(false);
  const togglePanelRef = useRef<Function | null>(null);

  const collapseSidebar = useCallback(() => {
    if (!isCollapsedRef.current && togglePanelRef.current) {
      togglePanelRef.current('left', { direction: 'left' });
      isCollapsedRef.current = true;
    }
  }, []);

  const sidebarContextValue = useMemo(() => ({ collapseSidebar }), [collapseSidebar]);

  // Sync isCollapsedRef when the user clicks EUI's built-in toggle button
  // (which bypasses our collapseSidebar/collapseLeftPanel code paths)
  const handleToggleCollapsed = useCallback(() => {
    isCollapsedRef.current = !isCollapsedRef.current;
  }, []);

  return (
    <EuiResizableContainer
      direction={isMobile ? 'vertical' : 'horizontal'}
      className="agentTraces-layout__bottom-panel"
      onToggleCollapsed={handleToggleCollapsed}
    >
      {(EuiResizablePanel, EuiResizableButton, { togglePanel }) => {
        togglePanelRef.current = togglePanel ?? null;
        const collapseLeftPanel = () => {
          togglePanel?.('left', { direction: 'left' });
          isCollapsedRef.current = !isCollapsedRef.current;
        };
        return (
          <SidebarPanelContext.Provider value={sidebarContextValue}>
            <EuiResizablePanel
              id="left"
              initialSize={15}
              minSize="10%"
              mode={['custom', { position: 'top' }]}
              paddingSize="none"
            >
              <CanvasPanel testId="dscBottomLeftCanvas">
                <DiscoverPanel collapsePanel={collapseLeftPanel} />
              </CanvasPanel>
            </EuiResizablePanel>
            <EuiResizableButton />
            <EuiResizablePanel
              id="main"
              className="resizable-panel-right"
              initialSize={90}
              minSize="65%"
              paddingSize="none"
            >
              <EuiPageBody className="agentTraces-layout__canvas">
                <BottomRightContainer />
              </EuiPageBody>
            </EuiResizablePanel>
          </SidebarPanelContext.Provider>
        );
      }}
    </EuiResizableContainer>
  );
};
