/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiPage, EuiResizableContainer } from '@elastic/eui';
import { DragDropProvider } from './utils/drag_drop/drag_drop_context';
import { LeftNav } from './components/left_nav';
import { TopNav } from './components/top_nav';
import { Workspace } from './components/workspace';
import './app.scss';
import { RightNav } from './components/right_nav';

export const VisBuilderApp = () => {
  // Render the application DOM.
  return (
    <I18nProvider>
      <DragDropProvider>
        <EuiPage className="vbLayout">
          <TopNav />
          <LeftNav />
          <EuiResizableContainer className="vbLayout__resizeContainer">
            {(EuiResizablePanel, EuiResizableButton) => (
              <>
                <EuiResizablePanel
                  className="vbLayout__workspaceResize"
                  paddingSize="none"
                  initialSize={80}
                  minSize="300px"
                  mode="main"
                >
                  <Workspace />
                </EuiResizablePanel>
                <EuiResizableButton className="vbLayout__resizeButton" />
                <EuiResizablePanel
                  className="vbLayout__rightNavResize"
                  paddingSize="none"
                  initialSize={20}
                  minSize="250px"
                  mode={[
                    'collapsible',
                    {
                      position: 'top',
                    },
                  ]}
                  id="vbRightResize"
                >
                  <RightNav />
                </EuiResizablePanel>
              </>
            )}
          </EuiResizableContainer>
        </EuiPage>
      </DragDropProvider>
    </I18nProvider>
  );
};

export { Option } from './components/option';
