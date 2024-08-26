/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiPage, EuiPageBody, EuiPageContent, euiPaletteColorBlind } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { BehaviorSubject } from 'rxjs';

import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceForm, WorkspaceFormSubmitData, WorkspaceOperationType } from '../workspace_form';
import { WORKSPACE_DETAIL_APP_ID } from '../../../common/constants';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { WorkspaceClient } from '../../workspace_client';
import { convertPermissionSettingsToPermissions } from '../workspace_form';
import { DataSource } from '../../../common/types';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceFormData } from '../workspace_form/types';
import { getUseCaseFeatureConfig } from '../../utils';
import { useFormAvailableUseCases } from '../workspace_form/use_form_available_use_cases';
import { NavigationPublicPluginStart } from '../../../../../plugins/navigation/public';

export interface WorkspaceCreatorProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceCreator = (props: WorkspaceCreatorProps) => {
  const { registeredUseCases$ } = props;
  const {
    services: {
      application,
      notifications,
      http,
      workspaceClient,
      savedObjects,
      dataSourceManagement,
      navigationUI: { HeaderControl },
    },
  } = useOpenSearchDashboards<{
    workspaceClient: WorkspaceClient;
    dataSourceManagement?: DataSourceManagementPluginSetup;
    navigationUI: NavigationPublicPluginStart['ui'];
  }>();

  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;
  const { isOnlyAllowEssential, availableUseCases } = useFormAvailableUseCases({
    savedObjects,
    registeredUseCases$,
    onlyAllowEssentialEnabled: true,
  });

  const defaultSelectedUseCase = availableUseCases?.[0];
  const defaultWorkspaceFormValues: Partial<WorkspaceFormData> = {
    color: euiPaletteColorBlind()[0],
    ...(defaultSelectedUseCase
      ? {
          name: defaultSelectedUseCase.title,
          features: [getUseCaseFeatureConfig(defaultSelectedUseCase.id)],
        }
      : {}),
  };

  const handleWorkspaceFormSubmit = useCallback(
    async (data: WorkspaceFormSubmitData) => {
      let result;
      try {
        const { permissionSettings, selectedDataSources, ...attributes } = data;
        const selectedDataSourceIds = (selectedDataSources ?? []).map((ds: DataSource) => {
          return ds.id;
        });
        result = await workspaceClient.create(attributes, {
          dataSources: selectedDataSourceIds,
          permissions: convertPermissionSettingsToPermissions(permissionSettings),
        });
        if (result?.success) {
          notifications?.toasts.addSuccess({
            title: i18n.translate('workspace.create.success', {
              defaultMessage: 'Create workspace successfully',
            }),
          });
          if (application && http) {
            const newWorkspaceId = result.result.id;
            // Redirect page after one second, leave one second time to show create successful toast.
            window.setTimeout(() => {
              window.location.href = formatUrlWithWorkspaceId(
                application.getUrlForApp(WORKSPACE_DETAIL_APP_ID, {
                  absolute: true,
                }),
                newWorkspaceId,
                http.basePath
              );
            }, 1000);
          }
          return;
        } else {
          throw new Error(result?.error ? result?.error : 'create workspace failed');
        }
      } catch (error) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.create.failed', {
            defaultMessage: 'Failed to create workspace',
          }),
          text: error instanceof Error ? error.message : JSON.stringify(error),
        });
        return;
      }
    },
    [notifications?.toasts, http, application, workspaceClient]
  );

  const isFormReadyToRender =
    application &&
    savedObjects &&
    // Default values only worked for component mount, should wait for isOnlyAllowEssential and availableUseCases loaded
    isOnlyAllowEssential !== undefined &&
    availableUseCases !== undefined;

  return (
    <EuiPage>
      <HeaderControl
        controls={[
          {
            description: i18n.translate('workspace.creator.description', {
              defaultMessage: 'Organize collaborative projects in use-case-specific workspaces.',
            }),
          },
        ]}
        setMountPoint={application?.setAppDescriptionControls}
      />
      <EuiPageBody>
        <EuiPageContent
          verticalPosition="center"
          paddingSize="none"
          color="subdued"
          hasShadow={false}
        >
          {isFormReadyToRender && (
            <WorkspaceForm
              application={application}
              savedObjects={savedObjects}
              onSubmit={handleWorkspaceFormSubmit}
              operationType={WorkspaceOperationType.Create}
              permissionEnabled={isPermissionEnabled}
              dataSourceManagement={dataSourceManagement}
              availableUseCases={availableUseCases}
              defaultValues={defaultWorkspaceFormValues}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
