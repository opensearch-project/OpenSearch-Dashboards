/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { I18nProvider } from '@osd/i18n/react';
import { EuiPage } from '@elastic/eui';
import { SideNav } from './components/side_nav';
import { DragDropProvider } from './utils/drag_drop/drag_drop_context';
import { Workspace } from './components/workspace';

import './app.scss';
import { TopNav } from './components/top_nav';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { WizardServices } from '../types';
import { useSavedWizardVisInstance } from './utils/use/use_saved_wizard_vis';

export const WizardApp = () => {
  const { id: visualizationIdFromUrl } = useParams<{ id: string }>();

  const { services } = useOpenSearchDashboards<WizardServices>();

  const savedWizardVisInstance = useSavedWizardVisInstance(services, visualizationIdFromUrl);
  const savedWizardViz = savedWizardVisInstance?.savedWizardVis;

  // Render the application DOM.
  return (
    <I18nProvider>
      <DragDropProvider>
        <EuiPage className="wizLayout">
          <TopNav savedWizardViz={savedWizardViz} />
          <SideNav />
          <Workspace />
        </EuiPage>
      </DragDropProvider>
    </I18nProvider>
  );
};
