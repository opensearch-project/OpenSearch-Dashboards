/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { FlyoutActionConfig, FlyoutComponentProps } from '../services/query_panel_actions_registry';
import { ImportDataModal } from '../components/import_data_modal';

const label = i18n.translate('explore.queryPanel.importDataLabel', {
  defaultMessage: 'Import data',
});

/**
 * Component wrapper that adapts the shared ImportDataModal for use with the flyout action system
 */
const ImportDataActionComponent: React.FC<FlyoutComponentProps> = ({ closeFlyout, services }) => {
  return <ImportDataModal services={services} isVisible={true} onClose={closeFlyout} />;
};

/**
 * Import data action configuration for the query panel actions registry
 */
export const importDataActionConfig: FlyoutActionConfig = {
  id: 'import-data',
  actionType: 'flyout',
  order: 100,
  getLabel: () => label,
  getIcon: () => 'importAction',
  getIsEnabled: () => true,
  component: ImportDataActionComponent,
};
