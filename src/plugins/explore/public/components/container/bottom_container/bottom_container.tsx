/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { EuiResizableContainer, EuiPageBody, useIsWithinBreakpoints } from '@elastic/eui';
import { selectShowDatasetFields } from '../../../application/utils/state_management/selectors';
import { CanvasPanel } from '../../../application/legacy/discover/application/components/panel/canvas_panel';
import { DiscoverPanel } from '../../../application/legacy/discover/application/view_components/panel';
import { BottomRightContainer } from './bottom_right_container/bottom_right_container';

export const BottomContainer = () => {
  const showDataSetFields = useSelector(selectShowDatasetFields);
  const isMobile = useIsWithinBreakpoints(['xs', 's', 'm']);

  return (
    <EuiResizableContainer
      direction={isMobile ? 'vertical' : 'horizontal'}
      className="explore-layout__bottom-panel"
    >
      {(EuiResizablePanel, EuiResizableButton) => (
        <>
          <EuiResizablePanel
            initialSize={20}
            minSize="260px"
            mode={['collapsible', { position: 'top' }]}
            paddingSize="none"
            style={{ display: showDataSetFields ? 'block' : 'none' }}
          >
            <CanvasPanel testId="dscBottomLeftCanvas">
              <DiscoverPanel />
            </CanvasPanel>
          </EuiResizablePanel>
          <EuiResizableButton style={{ display: showDataSetFields ? 'block' : 'none' }} />
          <EuiResizablePanel
            initialSize={showDataSetFields ? 80 : 100}
            minSize="65%"
            mode="main"
            paddingSize="none"
          >
            <EuiPageBody className="explore-layout__canvas">
              <BottomRightContainer />
            </EuiPageBody>
          </EuiResizablePanel>
        </>
      )}
    </EuiResizableContainer>
  );
};
