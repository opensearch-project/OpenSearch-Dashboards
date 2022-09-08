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

export const WizardApp = () => {
  // Render the application DOM.
  return (
    <I18nProvider>
      <DragDropProvider>
        <EuiPage className="wizLayout">
          <TopNav />
          <LeftNav />
          <EuiResizableContainer className="wizLayout__resizeContainer">
            {(EuiResizablePanel, EuiResizableButton) => (
              <>
                <EuiResizablePanel
                  className="wizLayout__workspaceResize"
                  paddingSize="none"
                  initialSize={80}
                  minSize="300px"
                  mode="main"
                >
                  <Workspace />
                </EuiResizablePanel>
                <EuiResizableButton className="wizLayout__resizeButton" />
                <EuiResizablePanel
                  className="wizLayout__rightNavResize"
                  paddingSize="none"
                  initialSize={20}
                  minSize="250px"
                  mode={[
                    'collapsible',
                    {
                      position: 'top',
                    },
                  ]}
                  id="wizRightResize"
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
