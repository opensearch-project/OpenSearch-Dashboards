/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPage, EuiResizableContainer } from '@elastic/eui';
import { I18nProvider } from '@osd/i18n/react';
import { ViewProps } from '../../../../../data_explorer/public';
import { TopNav } from '../../components/top_nav';
import { Workspace } from '../../components/workspace';
import { RightNav } from '../../components/right_nav';
import { ConfigPanel } from '../../components/config_panel/config_panel';

import './canvas.scss';

// eslint-disable-next-line import/no-default-export
export default function VisBuilderCanvas({ setHeaderActionMenu, history }: ViewProps) {
  return (
    <I18nProvider>
      <EuiPage className="vbLayout">
        <TopNav setHeaderActionMenu={setHeaderActionMenu} />
        <EuiResizableContainer className="vbLayout__resizeContainer">
          {(EuiResizablePanel, EuiResizableButton) => (
            <>
              <EuiResizablePanel
                className="vbLayout__configPanelResize"
                paddingSize="none"
                initialSize={20}
                minSize="250px"
                mode={[
                  'collapsible',
                  {
                    position: 'top',
                  },
                ]}
                id="vbLeftResize"
              >
                <ConfigPanel />
              </EuiResizablePanel>
              <EuiResizableButton className="vbLayout__resizeButton" />
              <EuiResizablePanel
                className="vbLayout__workspaceResize"
                paddingSize="none"
                initialSize={60}
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
    </I18nProvider>
  );
}
