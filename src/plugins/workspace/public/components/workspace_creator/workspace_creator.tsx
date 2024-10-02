/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { EuiPage, EuiPageBody, EuiPageContent, euiPaletteColorBlind } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { BehaviorSubject } from 'rxjs';

import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceFormSubmitData, WorkspaceOperationType } from '../workspace_form';
import { WORKSPACE_DETAIL_APP_ID } from '../../../common/constants';
import { getUseCaseFeatureConfig } from '../../../common/utils';
import { convertPermissionSettingsToPermissions } from '../workspace_form';
import { WorkspaceDependServices, WorkspaceUseCase } from '../../types';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { useFormAvailableUseCases } from '../workspace_form/use_form_available_use_cases';
import { DataSourceConnectionType } from '../../../common/types';
import { WorkspaceCreatorForm } from './workspace_creator_form';
import { WorkspaceCreationPostProcessorService } from '../../services';

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
      collaboratorEditorEnabled,
    },
  } = useOpenSearchDashboards<WorkspaceDependServices>();
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;
  const { isOnlyAllowEssential, availableUseCases } = useFormAvailableUseCases({
    savedObjects,
    registeredUseCases$,
    onlyAllowEssentialEnabled: true,
  });

  const defaultSelectedUseCase = availableUseCases?.[0];
  const defaultWorkspaceFormValues: Partial<WorkspaceFormSubmitData> = {
    color: euiPaletteColorBlind()[0],
    ...(defaultSelectedUseCase
      ? {
          features: [getUseCaseFeatureConfig(defaultSelectedUseCase.id)],
        }
      : {}),
  };

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
          permissions: convertPermissionSettingsToPermissions(permissionSettings),
        });
        if (result?.success) {
          notifications?.toasts.addSuccess({
            title: i18n.translate('workspace.create.success', {
              defaultMessage: 'Create workspace successfully',
            }),
          });
          if (application && http) {
            const postProcessor = WorkspaceCreationPostProcessorService.getInstance().getProcessor();
            const useCaseId = getFirstUseCaseOfFeatureConfigs(attributes.features);
            const useCaseLandingAppId = availableUseCases?.find(({ id }) => useCaseId === id)
              ?.features[0].id;

            postProcessor({
              workspaceId: result.result.id,
              http,
              application,
              useCaseLandingAppId: useCaseLandingAppId || WORKSPACE_DETAIL_APP_ID,
            });
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
    [notifications?.toasts, http, application, workspaceClient, isFormSubmitting, availableUseCases]
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
            <WorkspaceCreatorForm
              application={application}
              savedObjects={savedObjects}
              onSubmit={handleWorkspaceFormSubmit}
              operationType={WorkspaceOperationType.Create}
              permissionEnabled={isPermissionEnabled && collaboratorEditorEnabled}
              dataSourceManagement={dataSourceManagement}
              availableUseCases={availableUseCases}
              defaultValues={defaultWorkspaceFormValues}
              isSubmitting={isFormSubmitting}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
