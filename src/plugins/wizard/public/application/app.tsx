/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiPage } from '@elastic/eui';
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
          <Workspace />
          <RightNav />
        </EuiPage>
      </DragDropProvider>
    </I18nProvider>
  );
};
