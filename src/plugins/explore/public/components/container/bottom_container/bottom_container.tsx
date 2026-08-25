/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EuiResizableContainer, EuiPageBody, EuiButtonIcon, EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CanvasPanel } from '../../panel/canvas_panel';
import { DiscoverPanel } from '../../fields_selector/fields_selector_panel';
import { BottomRightContainer } from './bottom_right_container';

// Below this *container* width the fields sidebar is presented as an overlay flyout rather
// than an inline panel. We measure the container (not the window) so the narrow treatment
// also kicks in when this view is embedded in a narrow host container (e.g. the Maya ~940px
// canvas) inside a wide browser window, where window breakpoints would never fire.
// 992 = OUI `l` breakpoint.
const NARROW_CONTAINER_WIDTH = 992;

export const BottomContainer = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  // null until first measured, so we never paint the wrong layout (useLayoutEffect sets it
  // before the browser paints).
  const [isNarrow, setIsNarrow] = useState<boolean | null>(null);
  const [isFieldsFlyoutOpen, setIsFieldsFlyoutOpen] = useState(false);

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

  const showFieldsLabel = i18n.translate('explore.bottomContainer.showFieldsAriaLabel', {
    defaultMessage: 'Show fields',
  });
  const fieldsLabel = i18n.translate('explore.bottomContainer.fieldsFlyoutAriaLabel', {
    defaultMessage: 'Fields',
  });

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

  const renderNarrow = () => (
    <div className="explore-layout__bottom-panel explore-layout__bottom-panel--narrow">
      <div className="explore-layout__fieldsRail">
        {/* Mirror of the fields panel's own "Collapse fields panel" button (menuLeft),
            so the collapse/expand affordance is identical in overlay and push-out modes. */}
        <EuiButtonIcon
          iconType="menuRight"
          aria-label={showFieldsLabel}
          title={showFieldsLabel}
          data-test-subj="exploreFieldsFlyoutToggle"
          onClick={() => setIsFieldsFlyoutOpen(true)}
        />
      </div>
      <EuiPageBody className="explore-layout__canvas">
        <BottomRightContainer />
      </EuiPageBody>
      {isFieldsFlyoutOpen && (
        <>
          {/* Click-away layer only; it carries no information and is not a tab stop. Keyboard
              users dismiss with Escape (handled above) or the panel's own collapse button,
              which is why `role="presentation"` is correct rather than a keyboard handler. */}
          <div
            className="explore-layout__fieldsFlyoutMask"
            role="presentation"
            onClick={() => setIsFieldsFlyoutOpen(false)}
          />
          <EuiPanel
            className="explore-layout__fieldsFlyout"
            paddingSize="none"
            hasShadow
            role="dialog"
            aria-label={fieldsLabel}
            data-test-subj="exploreFieldsFlyout"
          >
            {/* No dedicated close button: the fields panel's own "Collapse fields panel"
                (menuLeft) button closes it, matching the wide push-out mode. Mask click
                and Escape also close. */}
            <div className="explore-layout__fieldsFlyoutBody">
              <DiscoverPanel collapsePanel={() => setIsFieldsFlyoutOpen(false)} />
            </div>
          </EuiPanel>
        </>
      )}
    </div>
  );

  const renderWide = () => (
    <EuiResizableContainer direction="horizontal" className="explore-layout__bottom-panel">
      {(EuiResizablePanel, EuiResizableButton, { togglePanel }) => {
        const collapseLeftPanel = () => togglePanel?.('left', { direction: 'left' });
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
              <EuiPageBody className="explore-layout__canvas">
                <BottomRightContainer />
              </EuiPageBody>
            </EuiResizablePanel>
          </>
        );
      }}
    </EuiResizableContainer>
  );

  return (
    <div ref={rootRef} className="explore-layout__bottomRoot">
      {isNarrow === null ? null : isNarrow ? renderNarrow() : renderWide()}
    </div>
  );
};
