/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton, EuiEmptyPrompt, EuiText } from '@elastic/eui';
import React from 'react';
import { DataSourceManagementContext } from 'src/plugins/data_source_management/public/types';
import { LoadCacheType } from '../../../../../framework/types';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';

interface AssociatedObjectsTabEmptyProps {
  cacheType: LoadCacheType;
}

export const AssociatedObjectsTabEmpty: React.FC<AssociatedObjectsTabEmptyProps> = (props) => {
  const { cacheType } = props;

  const { application } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  const QueryWorkbenchButton = (
    <EuiButton
      iconSide="right"
      onClick={() => application.navigateToApp('opensearch-query-workbench')}
      iconType="popout"
    >
      Query Workbench
    </EuiButton>
  );

  let titleText;
  let bodyText;
  switch (cacheType) {
    case 'databases':
      titleText = 'You have no databases in your data source';
      bodyText = 'Add databases and tables to your data source or use Query Workbench';
      break;
    case 'tables':
      titleText = 'You have no associated objects';
      bodyText = 'Add tables to your data source or use Query Workbench';
      break;
    default:
      titleText = '';
      bodyText = '';
      break;
  }

  return (
    <EuiEmptyPrompt
      body={
        <>
          <EuiText>
            <h4>{titleText}</h4>
            <p>{bodyText}</p>
          </EuiText>
        </>
      }
      actions={QueryWorkbenchButton}
    />
  );
};
