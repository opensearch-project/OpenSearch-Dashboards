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
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { WorkspaceClient } from '../../workspace_client';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { DataPublicPluginStart } from '../../../../data/public';
import { WorkspaceUseCase } from '../../types';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { useFormAvailableUseCases } from '../workspace_form/use_form_available_use_cases';
import { NavigationPublicPluginStart } from '../../../../../plugins/navigation/public';
import { DataSourceConnectionType } from '../../../common/types';
import { navigateToAppWithinWorkspace } from '../utils/workspace';
import { WorkspaceCreatorForm } from './workspace_creator_form';
import { optionIdToWorkspacePermissionModesMap } from '../workspace_form/constants';
import { getUseCaseFeatureConfig } from '../../../../../core/public';
import { UseCaseService } from '../../services';
import { detectTraceData, createAutoDetectedDatasets } from '../../../../explore/public';

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
      useCaseService,
      data: dataPlugin,
    },
  } = useOpenSearchDashboards<{
    workspaceClient: WorkspaceClient;
    dataSourceManagement?: DataSourceManagementPluginSetup;
    navigationUI: NavigationPublicPluginStart['ui'];
    useCaseService: UseCaseService;
    data: DataPublicPluginStart;
  }>();
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [goToCollaborators, setGoToCollaborators] = useState(false);
  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;

  const { availableUseCases } = useFormAvailableUseCases({
    savedObjects,
    registeredUseCases$,
    useCaseService,
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

            // For observability workspaces, run trace detection and create datasets if found
            const isObservabilityWorkspace = useCaseId === 'observability';
            if (isObservabilityWorkspace && savedObjects && dataPlugin?.dataViews) {
              try {
                // Set workspace context for saved objects client
                savedObjects.client.setCurrentWorkspace(newWorkspaceId);

                // Get selected data sources (OpenSearch connections only)
                const dataSourceConnections = (selectedDataSourceConnections ?? []).filter(
                  ({ connectionType }) =>
                    connectionType === DataSourceConnectionType.OpenSearchConnection
                );

                // Create mapping from dataSourceId to name
                const dataSourceIdToName = new Map(
                  dataSourceConnections.map(({ id, name }) => [id, name])
                );

                // If no data sources selected, check local cluster
                const dataSourcesToCheck =
                  dataSourceConnections.length > 0
                    ? dataSourceConnections.map(({ id }) => id)
                    : [undefined]; // undefined means local cluster

                let datasetsCreatedCount = 0;

                // Run detection for each data source
                for (const dataSourceId of dataSourcesToCheck) {
                  try {
                    const detection = await detectTraceData(
                      savedObjects.client,
                      // @ts-expect-error TS2345 TODO(ts-error): fixme
                      dataPlugin.dataViews,
                      dataSourceId
                    );

                    if (detection.tracesDetected || detection.logsDetected) {
                      // Add datasource title to detection
                      if (dataSourceId) {
                        detection.dataSourceTitle = dataSourceIdToName.get(dataSourceId);
                      } else {
                        detection.dataSourceTitle = 'Local Cluster';
                      }

                      await createAutoDetectedDatasets(
                        savedObjects.client,
                        detection,
                        dataSourceId
                      );
                      datasetsCreatedCount++;
                    }
                  } catch (error) {
                    // Continue with other data sources even if one fails
                  }
                }

                if (datasetsCreatedCount > 0) {
                  notifications?.toasts.addSuccess({
                    title: i18n.translate('workspace.create.traceDatasetsCreated', {
                      defaultMessage: 'Trace datasets created automatically',
                    }),
                    text:
                      datasetsCreatedCount > 1
                        ? i18n.translate('workspace.create.traceDatasetsCreatedMultiple', {
                            defaultMessage: 'Created datasets for {count} data sources',
                            values: { count: datasetsCreatedCount },
                          })
                        : undefined,
                  });
                }
              } catch (error) {
                // Don't block workspace creation if trace detection fails
              } finally {
                // Clear the workspace context to prevent subsequent operations from targeting the new workspace
                savedObjects.client.setCurrentWorkspace(undefined as any);
              }
            }

            // Redirect to workspace after a short delay
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
          return { result: true, success: true };
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
      savedObjects,
      dataPlugin,
    ]
  );

  const isFormReadyToRender =
    application &&
    savedObjects &&
    // Default values only worked for component mount, should wait for availableUseCases loaded
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
              onAppLeave={() => {}}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
