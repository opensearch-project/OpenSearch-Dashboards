/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { MountPoint } from 'opensearch-dashboards/public';
import { EuiResizableContainer, EuiPageBody, useIsWithinBreakpoints } from '@elastic/eui';
import { useInitPage } from '../../../application/utils/hooks/use_page_initialization';
import { selectShowDatasetFields } from '../../../application/utils/state_management/selectors';
import { CanvasPanel } from '../../../application/legacy/discover/application/components/panel/canvas_panel';
import { DiscoverPanel } from '../../../application/legacy/discover/application/view_components/panel';
import { BottomRightContainer } from './bottom_right_container/bottom_right_container';
import { TopNav } from '../../../components/top_nav/top_nav';

export interface IBottomContainer {
  setHeaderActionMenu?: (menuMount: MountPoint | undefined) => void;
}

export const BottomContainer = ({ setHeaderActionMenu }: IBottomContainer) => {
  const { savedExplore } = useInitPage();
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
              <TopNav setHeaderActionMenu={setHeaderActionMenu} savedExplore={savedExplore} />
              <BottomRightContainer />
            </EuiPageBody>
          </EuiResizablePanel>
        </>
      )}
    </EuiResizableContainer>
  );
};
