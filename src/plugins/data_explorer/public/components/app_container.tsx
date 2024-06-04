/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';
import { EuiPage, EuiPageBody, EuiResizableContainer, useIsWithinBreakpoints } from '@elastic/eui';
import { Suspense } from 'react';
import { AppMountParameters } from '../../../../core/public';
import { Sidebar } from './sidebar';
import { NoView } from './no_view';
import { View } from '../services/view_service/view';
import './app_container.scss';

export const AppContainer = ({ view, params }: { view?: View; params: AppMountParameters }) => {
  const isMobile = useIsWithinBreakpoints(['xs', 's', 'm']);
  // TODO: Make this more robust.
  if (!view) {
    return <NoView />;
  }

  const { Canvas, Panel, Context } = view;

  const MemoizedPanel = memo(Panel);
  const MemoizedCanvas = memo(Canvas);

  // Render the application DOM.
  return (
    <EuiPage className="deLayout" paddingSize="none">
      {/* TODO: improve fallback state */}
      <Suspense fallback={<div>Loading...</div>}>
        <Context {...params}>
          <EuiResizableContainer direction={isMobile ? 'vertical' : 'horizontal'}>
            {(EuiResizablePanel, EuiResizableButton) => (
              <>
                <EuiResizablePanel
                  initialSize={20}
                  minSize="260px"
                  mode={['collapsible', { position: 'top' }]}
                  paddingSize="none"
                >
                  <Sidebar>
                    <MemoizedPanel {...params} />
                  </Sidebar>
                </EuiResizablePanel>
                <EuiResizableButton />

                <EuiResizablePanel initialSize={80} minSize="65%" mode="main" paddingSize="none">
                  <EuiPageBody className="deLayout__canvas">
                    <MemoizedCanvas {...params} />
                  </EuiPageBody>
                </EuiResizablePanel>
              </>
            )}
          </EuiResizableContainer>
        </Context>
      </Suspense>
    </EuiPage>
  );
};
