/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPage, EuiPageBody, EuiPageHeader, EuiPageContent } from '@elastic/eui';
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';

import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceForm, WorkspaceOperationType } from '../workspace_form';
import { WorkspaceClient } from '../../workspace_client';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { WorkspaceUseCase } from '../../types';

export interface WorkspaceCreatorProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceCreator = (props: WorkspaceCreatorProps) => {
  const {
    services: { application, savedObjects, dataSourceManagement },
  } = useOpenSearchDashboards<{
    workspaceClient: WorkspaceClient;
    dataSourceManagement?: DataSourceManagementPluginSetup;
  }>();
  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;
  const availableUseCases = useObservable(props.registeredUseCases$, []);

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageHeader pageTitle="Create a workspace" />
        <EuiPageContent
          verticalPosition="center"
          paddingSize="none"
          color="subdued"
          hasShadow={false}
        >
          {application && savedObjects && (
            <WorkspaceForm
              application={application}
              savedObjects={savedObjects}
              operationType={WorkspaceOperationType.Create}
              permissionEnabled={isPermissionEnabled}
              dataSourceManagement={dataSourceManagement}
              availableUseCases={availableUseCases}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
