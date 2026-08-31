/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { EuiResizableContainer, EuiPageBody, EuiButtonIcon, EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CanvasPanel } from '../../panel/canvas_panel';
import { DiscoverPanel } from '../../fields_selector/fields_selector_panel';
import { BottomRightContainer } from './bottom_right_container';
import { SidebarPanelContext } from './sidebar_panel_context';

// Below this *container* width the fields sidebar becomes an overlay flyout. Measured on the
// container, not the window, so it also fires when this view is embedded in a narrow host
// (~940px canvas) inside a wide window.
// JS not `@container`: the modes are different trees, not two skins — EuiResizableContainer
// (imperative togglePanel) vs rail + overlay with role="dialog"/Escape/mask, plus
// `collapseSidebar` changes meaning. Cost: crossing 992 remounts the results subtree,
// resetting grid scroll and expanded rows. Live resize only.
// 992 = OUI `l` breakpoint. Kept in sync with explore's BottomContainer.
const NARROW_CONTAINER_WIDTH = 992;

export const BottomContainer = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  // null until first measured, so we never paint the wrong layout (useLayoutEffect sets it
  // before the browser paints).
  const [isNarrow, setIsNarrow] = useState<boolean | null>(null);
  const [isFieldsFlyoutOpen, setIsFieldsFlyoutOpen] = useState(false);
  const isCollapsedRef = useRef(false);
  const togglePanelRef = useRef<Function | null>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const apply = (width: number) => {
      if (width > 0) setIsNarrow(width < NARROW_CONTAINER_WIDTH);
    };
    apply(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => apply(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Close the flyout when the container grows back out of the narrow range, and on Escape.
  useEffect(() => {
    if (isNarrow === false) setIsFieldsFlyoutOpen(false);
  }, [isNarrow]);
  useEffect(() => {
    if (!isFieldsFlyoutOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFieldsFlyoutOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFieldsFlyoutOpen]);

  // Consumed by `TraceFlyoutProvider`, which gets the fields sidebar out of the way before
  // opening the trace details flyout so the two don't compete for the same space.
  const collapseSidebar = useCallback(() => {
    if (isNarrow) {
      // The sidebar is already off-canvas here, so "collapsing" it means dismissing the
      // overlay — otherwise the trace flyout would open on top of the fields flyout.
      setIsFieldsFlyoutOpen(false);
      return;
    }
    if (!isCollapsedRef.current && togglePanelRef.current) {
      togglePanelRef.current('left', { direction: 'left' });
      isCollapsedRef.current = true;
    }
  }, [isNarrow]);

  const sidebarContextValue = useMemo(() => ({ collapseSidebar }), [collapseSidebar]);

  // Sync isCollapsedRef when the user clicks EUI's built-in toggle button
  // (which bypasses our collapseSidebar/collapseLeftPanel code paths)
  const handleToggleCollapsed = useCallback(() => {
    isCollapsedRef.current = !isCollapsedRef.current;
  }, []);

  const showFieldsLabel = i18n.translate('agentTraces.bottomContainer.showFieldsAriaLabel', {
    defaultMessage: 'Show fields',
  });
  const fieldsLabel = i18n.translate('agentTraces.bottomContainer.fieldsFlyoutAriaLabel', {
    defaultMessage: 'Fields',
  });

  const renderNarrow = () => (
    <div className="agentTraces-layout__bottom-panel agentTraces-layout__bottom-panel--narrow">
      <div className="agentTraces-layout__fieldsRail">
        {/* Mirror of the fields panel's own "Collapse fields panel" button (menuLeft),
            so the collapse/expand affordance is identical in overlay and push-out modes. */}
        <EuiButtonIcon
          iconType="menuRight"
          aria-label={showFieldsLabel}
          title={showFieldsLabel}
          data-test-subj="agentTracesFieldsFlyoutToggle"
          onClick={() => setIsFieldsFlyoutOpen(true)}
        />
      </div>
      <EuiPageBody className="agentTraces-layout__canvas">
        <BottomRightContainer />
      </EuiPageBody>
      {isFieldsFlyoutOpen && (
        <>
          {/* Click-away layer only; it carries no information and is not a tab stop. Keyboard
              users dismiss with Escape (handled above) or the panel's own collapse button,
              which is why `role="presentation"` is correct rather than a keyboard handler. */}
          <div
            className="agentTraces-layout__fieldsFlyoutMask"
            role="presentation"
            onClick={() => setIsFieldsFlyoutOpen(false)}
          />
          <EuiPanel
            className="agentTraces-layout__fieldsFlyout"
            paddingSize="none"
            hasShadow
            role="dialog"
            aria-label={fieldsLabel}
            data-test-subj="agentTracesFieldsFlyout"
          >
            {/* No dedicated close button: the fields panel's own "Collapse fields panel"
                (menuLeft) button closes it, matching the wide push-out mode. Mask click
                and Escape also close. */}
            <div className="agentTraces-layout__fieldsFlyoutBody">
              <DiscoverPanel collapsePanel={() => setIsFieldsFlyoutOpen(false)} />
            </div>
          </EuiPanel>
        </>
      )}
    </div>
  );

  const renderWide = () => (
    <EuiResizableContainer
      direction="horizontal"
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
          <>
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
          </>
        );
      }}
    </EuiResizableContainer>
  );

  return (
    // The provider wraps both layouts (rather than living inside the resizable container's
    // render prop as it used to) so `useSidebarPanel` keeps working in overlay mode.
    // `collapseSidebar` reads `togglePanelRef` lazily, so hoisting it is safe.
    <SidebarPanelContext.Provider value={sidebarContextValue}>
      <div ref={rootRef} className="agentTraces-layout__bottomRoot">
        {isNarrow === null ? null : isNarrow ? renderNarrow() : renderWide()}
      </div>
    </SidebarPanelContext.Provider>
  );
};
