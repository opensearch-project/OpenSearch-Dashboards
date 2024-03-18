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

export const AppContainer = React.memo(
  ({ view, params }: { view?: View; params: AppMountParameters }) => {
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.view === nextProps.view &&
      shallowEqual(prevProps.params, nextProps.params, ['history'])
    );
  }
);

// A simple shallow equal function that can ignore specified keys
function shallowEqual(object1: any, object2: any, ignoreKeys: any) {
  const keys1 = Object.keys(object1).filter((key) => !ignoreKeys.includes(key));
  const keys2 = Object.keys(object2).filter((key) => !ignoreKeys.includes(key));

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
}
