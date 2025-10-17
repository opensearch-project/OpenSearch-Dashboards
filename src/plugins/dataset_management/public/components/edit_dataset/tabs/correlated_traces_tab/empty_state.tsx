/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiEmptyPrompt, EuiButton } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../../types';

export const EmptyState: React.FC = () => {
  const { application } = useOpenSearchDashboards<DatasetManagmentContext>().services;

  const handleViewDatasets = useCallback(() => {
    application.navigateToApp('datasets', {
      path: '/',
    });
  }, [application]);

  return (
    <EuiEmptyPrompt
      title={
        <h4>
          {i18n.translate('datasetManagement.correlatedTraces.emptyState.title', {
            defaultMessage: 'There are no correlated traces',
          })}
        </h4>
      }
      titleSize="s"
      body={
        <p>
          {i18n.translate('datasetManagement.correlatedTraces.emptyState.description', {
            defaultMessage: 'Create a correlation from a traces dataset',
          })}
        </p>
      }
      actions={
        <EuiButton onClick={handleViewDatasets} data-test-subj="viewDatasetsButton">
          {i18n.translate('datasetManagement.correlatedTraces.emptyState.viewDatasetsButton', {
            defaultMessage: 'View datasets',
          })}
        </EuiButton>
      }
    />
  );
};
