/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { EuiPage, EuiSpacer, EuiPageContent } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { BehaviorSubject, of } from 'rxjs';
import { WorkspaceUseCase } from '../../types';
import { useWorkspaceFormContext } from '../workspace_form';
import { WorkspaceDetailPanel } from './workspace_detail_panel';
import { DeleteWorkspaceModal } from '../delete_workspace_modal';
import { DEFAULT_WORKSPACE, WORKSPACE_LIST_APP_ID } from '../../../common/constants';
import { cleanWorkspaceId } from '../../../../../core/public/utils';
import { WorkspaceOperationType } from '../workspace_form/constants';
import { CoreStart, WorkspaceAttribute } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs, getUseCaseUrl } from '../../utils';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { WorkspaceBottomBar } from './workspace_bottom_bar';
import {
  NavigationPublicPluginStart,
  TopNavControlButtonData,
  TopNavControlDescriptionData,
  TopNavControlIconData,
} from '../../../../navigation/public';
import { WorkspaceDetailForm } from './workspace_detail_form';

export interface WorkspaceDetailProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export interface WorkspaceDetailPropsWithFormSubmitting extends WorkspaceDetailProps {
  isFormSubmitting: boolean;
}

export const WorkspaceDetail = (props: WorkspaceDetailPropsWithFormSubmitting) => {
  const {
    services: {
      workspaces,
      application,
      http,
      savedObjects,
      dataSourceManagement,
      uiSettings,
      navigationUI: { HeaderControl },
      chrome,
      notifications,
    },
  } = useOpenSearchDashboards<{
    CoreStart: CoreStart;
    dataSourceManagement?: DataSourceManagementPluginSetup;
    navigationUI: NavigationPublicPluginStart['ui'];
  }>();

  const {
    isEditing,
    formId,
    numberOfErrors,
    handleResetForm,
    numberOfChanges,
    formData,
    onAppLeave,
  } = useWorkspaceFormContext();
  const [deletedWorkspace, setDeletedWorkspace] = useState<WorkspaceAttribute | null>(null);
  const [isSettingDefaultWorkspace, setIsSettingDefaultWorkspace] = useState(false);

  const availableUseCases = useObservable(props.registeredUseCases$, []);
  const isDashboardAdmin = !!application?.capabilities?.dashboards?.isDashboardAdmin;
  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const currentUseCase = availableUseCases.find(
    (useCase) => useCase.id === getFirstUseCaseOfFeatureConfigs(currentWorkspace?.features ?? [])
  );
  //  default workspace state
  const [isDefaultWorkspace, setIsDefaultWorkspace] = useState<boolean>(false);

  useEffect(() => {
    setIsDefaultWorkspace(uiSettings?.get(DEFAULT_WORKSPACE) === currentWorkspace?.id);
  }, [currentWorkspace?.id, uiSettings]);

  // When user has unsaved changes and navigates to other page, will show a confirm modal.
  useEffect(() => {
    onAppLeave((actions) => {
      if (isEditing && numberOfChanges > 0) {
        return actions.confirm(
          i18n.translate('workspace.detail.navigate.message', {
            defaultMessage: 'Any unsaved changes will be lost.',
          }),
          i18n.translate('workspace.detail.navigate.title', {
            defaultMessage: 'Navigate away?',
          }),
          handleResetForm
        );
      }
      return actions.default();
    });
  }, [handleResetForm, isEditing, numberOfChanges, onAppLeave]);

  const handleSetDefaultWorkspace = useCallback(
    async (workspace: WorkspaceAttribute) => {
      setIsSettingDefaultWorkspace(true);
      const setDefaultWorkspaceSuccess = await uiSettings?.set(DEFAULT_WORKSPACE, workspace.id);

      if (setDefaultWorkspaceSuccess) {
        setIsDefaultWorkspace(true);
        notifications?.toasts.addSuccess(
          i18n.translate('workspace.setDefaultWorkspace.success.message', {
            defaultMessage: 'Default workspace been set to {name}',
            values: { name: workspace.name },
          })
        );
      } else {
        notifications?.toasts.addWarning(
          i18n.translate('workspace.setDefaultWorkspace.error.message', {
            defaultMessage: 'Failed to set workspace {name} as default workspace.',
            values: { name: workspace.name },
          })
        );
      }
      setIsSettingDefaultWorkspace(false);
    },
    [notifications?.toasts, uiSettings]
  );

  if (!currentWorkspace || !application || !http || !savedObjects || !uiSettings || !chrome) {
    return null;
  }

  const useCaseUrl = getUseCaseUrl(currentUseCase, currentWorkspace.id, application, http);

  return (
    <EuiPage direction="column">
      {currentWorkspace.description && (
        <HeaderControl
          controls={[
            {
              description: currentWorkspace.description,
            } as TopNavControlDescriptionData,
          ]}
          setMountPoint={application.setAppDescriptionControls}
        />
      )}
      <HeaderControl
        controls={[
          ...(isDashboardAdmin
            ? [
                {
                  run: () => setDeletedWorkspace(currentWorkspace),
                  color: 'danger',
                  iconType: 'trash',
                  ariaLabel: i18n.translate('workspace.detail.delete.button', {
                    defaultMessage: 'Delete workspace',
                  }),
                  testId: 'workspace-detail-delete-button',
                  controlType: 'icon',
                  display: 'base',
                  tooltip: i18n.translate('workspace.detail.delete.button.tooltip', {
                    defaultMessage: 'Delete workspace',
                  }),
                } as TopNavControlIconData,
              ]
            : []),
          isDefaultWorkspace
            ? ({
                label: i18n.translate('workspace.detail.defaultWorkspace.badge', {
                  defaultMessage: 'Default',
                }),
                iconType: 'flag',
                testId: 'workspace-detail-default-workspace-badge',
                controlType: 'button',
                isDisabled: true,
                tooltip: i18n.translate('workspace.detail.defaultWorkspace.badge.tooltip', {
                  defaultMessage: 'Default workspace',
                }),
              } as TopNavControlButtonData)
            : ({
                run: () => handleSetDefaultWorkspace(currentWorkspace),
                label: i18n.translate('workspace.detail.setDefaultWorkspace.button', {
                  defaultMessage: 'Set as default',
                }),
                isLoading: isSettingDefaultWorkspace,
                testId: 'workspace-detail-set-as-default-button',
                controlType: 'button',
                tooltip: i18n.translate('workspace.detail.setDefaultWorkspace.button.tooltip', {
                  defaultMessage: 'Set as default',
                }),
              } as TopNavControlButtonData),
          {
            run: () => {
              window.open(useCaseUrl, '_blank', 'noopener noreferrer');
            },
            iconType: 'popout',
            label: i18n.translate('workspace.detail.WorkspaceOverview.button', {
              defaultMessage: 'Workspace overview',
            }),
            testId: 'workspace-detail-workspace-overview-button',
            controlType: 'button',
            iconSide: 'right',
            tooltip: i18n.translate('workspace.detail.WorkspaceOverview.button.tooltip', {
              defaultMessage: 'Workspace overview',
            }),
          } as TopNavControlButtonData,
        ]}
        setMountPoint={application.setAppRightControls}
      />

      <EuiPageContent>
        <WorkspaceDetailPanel
          currentUseCase={currentUseCase}
          currentWorkspace={currentWorkspace}
          dateFormat={uiSettings.get('dateFormat')}
        />
      </EuiPageContent>
      <EuiSpacer size="m" />
      <EuiPageContent>
        <WorkspaceDetailForm
          application={application}
          operationType={WorkspaceOperationType.Update}
          savedObjects={savedObjects}
          dataSourceManagement={dataSourceManagement}
          availableUseCases={availableUseCases}
        />
      </EuiPageContent>
      {deletedWorkspace && (
        <DeleteWorkspaceModal
          selectedWorkspaces={[deletedWorkspace]}
          typeTextToConfirm={deletedWorkspace.name}
          onClose={() => setDeletedWorkspace(null)}
          onDeleteSuccess={() => {
            window.setTimeout(() => {
              window.location.assign(
                cleanWorkspaceId(
                  application.getUrlForApp(WORKSPACE_LIST_APP_ID, {
                    absolute: false,
                  })
                )
              );
            }, 1000);
          }}
        />
      )}
      {isEditing && (
        <WorkspaceBottomBar
          formId={formId}
          formData={formData}
          numberOfChanges={numberOfChanges}
          numberOfErrors={numberOfErrors}
          handleResetForm={handleResetForm}
          isFormSubmitting={props.isFormSubmitting}
        />
      )}
    </EuiPage>
  );
};
