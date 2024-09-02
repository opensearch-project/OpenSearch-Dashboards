/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { WorkspaceInitial } from './workspace_initial/workspace_initial';

export const WorkspaceInitialApp = () => {
  return (
    <I18nProvider>
      <WorkspaceInitial />
    </I18nProvider>
  );
};
