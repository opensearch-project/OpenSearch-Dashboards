/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiResizableContainer, EuiPageBody, useIsWithinBreakpoints } from '@elastic/eui';
import { CanvasPanel } from '../../panel/canvas_panel';
import { DiscoverPanel } from '../../fields_selector/fields_selector_panel';
import { BottomRightContainer } from './bottom_right_container';

export const BottomContainer = () => {
  const isMobile = useIsWithinBreakpoints(['xs', 's', 'm']);

  return (
    <EuiResizableContainer
      direction={isMobile ? 'vertical' : 'horizontal'}
      className="explore-layout__bottom-panel"
    >
      {(EuiResizablePanel, EuiResizableButton, { togglePanel }) => {
        const collapseLeftPanel = () => togglePanel?.('left', { direction: 'left' });
        return (
          <>
            <EuiResizablePanel
              id="left"
              initialSize={20}
              minSize="260px"
              mode={['custom', { position: 'top' }]}
              paddingSize="none"
            >
              <CanvasPanel testId="dscBottomLeftCanvas">
                <DiscoverPanel collapsePanel={collapseLeftPanel} />
              </CanvasPanel>
            </EuiResizablePanel>
            <EuiResizableButton />
            <EuiResizablePanel id="main" initialSize={80} minSize="65%" paddingSize="none">
              <EuiPageBody className="explore-layout__canvas">
                <BottomRightContainer />
              </EuiPageBody>
            </EuiResizablePanel>
          </>
        );
      }}
    </EuiResizableContainer>
  );
};
