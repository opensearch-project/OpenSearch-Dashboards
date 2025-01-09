/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState, useMemo } from 'react';
import { EuiPage, EuiPageBody, EuiPageContent, euiPaletteColorBlind } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { BehaviorSubject } from 'rxjs';
import { useLocation } from 'react-router-dom';

import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { PermissionModeId } from '../../../../../core/public';
import {
  CURRENT_USER_PLACEHOLDER,
  WORKSPACE_COLLABORATORS_APP_ID,
  WORKSPACE_DETAIL_APP_ID,
} from '../../../common/constants';
import {
  WorkspaceFormSubmitData,
  WorkspaceOperationType,
  WorkspacePermissionItemType,
  convertPermissionSettingsToPermissions,
  WorkspacePermissionSetting,
} from '../workspace_form';
import { getUseCaseFeatureConfig } from '../../../common/utils';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { WorkspaceClient } from '../../workspace_client';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { WorkspaceUseCase } from '../../types';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { useFormAvailableUseCases } from '../workspace_form/use_form_available_use_cases';
import { NavigationPublicPluginStart } from '../../../../../plugins/navigation/public';
import { DataSourceConnectionType } from '../../../common/types';
import { navigateToAppWithinWorkspace } from '../utils/workspace';
import { WorkspaceCreatorForm } from './workspace_creator_form';
import { optionIdToWorkspacePermissionModesMap } from '../workspace_form/constants';

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
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [goToCollaborators, setGoToCollaborators] = useState(false);
  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;

  const { isOnlyAllowEssential, availableUseCases } = useFormAvailableUseCases({
    savedObjects,
    registeredUseCases$,
    onlyAllowEssentialEnabled: true,
  });

  const location = useLocation();

  const defaultWorkspaceFormValues = useMemo(() => {
    let defaultSelectedUseCase;
    const params = new URLSearchParams(location.search);
    const useCaseTitle = params.get('useCase');
    if (useCaseTitle) {
      defaultSelectedUseCase =
        availableUseCases?.find(({ title }) => title === useCaseTitle) || availableUseCases?.[0];
    } else {
      defaultSelectedUseCase = availableUseCases?.[0];
    }
    return {
      color: euiPaletteColorBlind()[0],
      ...(defaultSelectedUseCase
        ? {
            features: [getUseCaseFeatureConfig(defaultSelectedUseCase.id)],
          }
        : {}),
      ...(isPermissionEnabled
        ? {
            permissionSettings: [
              {
                id: 1,
                type: WorkspacePermissionItemType.User,
                userId: CURRENT_USER_PLACEHOLDER,
                modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Owner],
              },
            ] as WorkspacePermissionSetting[],
          }
        : {}),
    };
  }, [location.search, availableUseCases, isPermissionEnabled]);

  const handleWorkspaceFormSubmit = useCallback(
    async (data: WorkspaceFormSubmitData) => {
      let result;
      if (isFormSubmitting) {
        return;
      }
      setIsFormSubmitting(true);
      try {
        const { permissionSettings, selectedDataSourceConnections, ...attributes } = data;
        const selectedDataSourceIds = (selectedDataSourceConnections ?? [])
          .filter(
            ({ connectionType }) => connectionType === DataSourceConnectionType.OpenSearchConnection
          )
          .map(({ id }) => {
            return id;
          });
        const selectedDataConnectionIds = (selectedDataSourceConnections ?? [])
          .filter(
            ({ connectionType }) => connectionType === DataSourceConnectionType.DataConnection
          )
          .map(({ id }) => {
            return id;
          });
        result = await workspaceClient.create(attributes, {
          dataSources: selectedDataSourceIds,
          dataConnections: selectedDataConnectionIds,
          ...(isPermissionEnabled
            ? {
                permissions: convertPermissionSettingsToPermissions(permissionSettings),
              }
            : {}),
        });
        if (result?.success) {
          notifications?.toasts.addSuccess({
            title: i18n.translate('workspace.create.success', {
              defaultMessage: 'Create workspace successfully',
            }),
          });
          if (application && http) {
            const newWorkspaceId = result.result.id;
            const useCaseId = getFirstUseCaseOfFeatureConfigs(attributes.features);
            const useCaseLandingAppId = availableUseCases?.find(({ id }) => useCaseId === id)
              ?.features[0].id;
            // Redirect page after one second, leave one second time to show create successful toast.
            window.setTimeout(() => {
              if (isPermissionEnabled && goToCollaborators) {
                navigateToAppWithinWorkspace(
                  { application, http },
                  newWorkspaceId,
                  WORKSPACE_COLLABORATORS_APP_ID
                );
                return;
              }
              window.location.href = formatUrlWithWorkspaceId(
                application.getUrlForApp(useCaseLandingAppId || WORKSPACE_DETAIL_APP_ID, {
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
      } finally {
        setIsFormSubmitting(false);
      }
    },
    [
      notifications?.toasts,
      http,
      application,
      workspaceClient,
      isFormSubmitting,
      availableUseCases,
      isPermissionEnabled,
      goToCollaborators,
    ]
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
          color="transparent"
          hasBorder={false}
          hasShadow={false}
        >
          {isFormReadyToRender && (
            <WorkspaceCreatorForm
              application={application}
              savedObjects={savedObjects}
              onSubmit={handleWorkspaceFormSubmit}
              operationType={WorkspaceOperationType.Create}
              dataSourceManagement={dataSourceManagement}
              availableUseCases={availableUseCases}
              defaultValues={defaultWorkspaceFormValues}
              isSubmitting={isFormSubmitting}
              goToCollaborators={goToCollaborators}
              onGoToCollaboratorsChange={setGoToCollaborators}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
