/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { TableFeedbacksPanel } from './table_feedbacks_panel';
import { I18nStart } from '../../../../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';
import { setDataGridTableSetting } from '../utils/local_storage';

let isFeedbackPanelOpen = false;

export function showTableFeedbacksPanel({
  I18nContext,
  services,
}: {
  I18nContext: I18nStart['Context'];
  services: DiscoverViewServices;
}) {
  if (isFeedbackPanelOpen) {
    return;
  }

  isFeedbackPanelOpen = true;
  const container = document.createElement('div');
  const onClose = () => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
    isFeedbackPanelOpen = false;
  };

  const onTurnOff = async () => {
    // Save the new setting to localStorage
    setDataGridTableSetting(false, services.storage);
    onClose();
    window.location.reload();
  };

  document.body.appendChild(container);
  const element = (
    <OpenSearchDashboardsContextProvider services={services}>
      <I18nContext>
        <TableFeedbacksPanel onClose={onClose} onTurnOff={onTurnOff} />
      </I18nContext>
    </OpenSearchDashboardsContextProvider>
  );
  ReactDOM.render(element, container);
}
