/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiPage } from '@elastic/eui';
import { SideNav } from './components/side_nav';
import { DragDropProvider } from './utils/drag_drop/drag_drop_context';
import { Workspace } from './components/workspace';

import './app.scss';
import { TopNav } from './components/top_nav';

export const WizardApp = () => {
  // Render the application DOM.
  return (
    <I18nProvider>
      <DragDropProvider>
        <EuiPage className="wizLayout">
          <TopNav />
          <SideNav />
          <Workspace />
        </EuiPage>
      </DragDropProvider>
    </I18nProvider>
  );
};
