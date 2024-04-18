/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiText,
  EuiColorPicker,
  EuiHorizontalRule,
  EuiTab,
  EuiTabs,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { WorkspaceBottomBar } from './workspace_bottom_bar';
import { WorkspaceFormProps } from './types';
import { WorkspaceFormTabs } from './constants';
import { useWorkspaceForm } from './use_workspace_form';
import { WorkspaceFeatureSelector } from './workspace_feature_selector';
import { WorkspacePermissionSettingPanel } from './workspace_permission_setting_panel';

export const WorkspaceForm = (props: WorkspaceFormProps) => {
  const {
    application,
    defaultValues,
    operationType,
    permissionEnabled,
    permissionLastAdminItemDeletable,
  } = props;
  const {
    formId,
    formData,
    formErrors,
    selectedTab,
    numberOfErrors,
    handleFormSubmit,
    handleColorChange,
    handleFeaturesChange,
    handleNameInputChange,
    handleTabFeatureClick,
    setPermissionSettings,
    handleTabPermissionClick,
    handleDescriptionInputChange,
  } = useWorkspaceForm(props);
  const workspaceDetailsTitle = i18n.translate('workspace.form.workspaceDetails.title', {
    defaultMessage: 'Workspace Details',
  });
  const featureVisibilityTitle = i18n.translate('workspace.form.featureVisibility.title', {
    defaultMessage: 'Feature Visibility',
  });
  const usersAndPermissionsTitle = i18n.translate('workspace.form.usersAndPermissions.title', {
    defaultMessage: 'Users & Permissions',
  });

  return (
    <EuiForm id={formId} onSubmit={handleFormSubmit} component="form">
      <EuiPanel>
        <EuiTitle size="s">
          <h2>{workspaceDetailsTitle}</h2>
        </EuiTitle>
        <EuiHorizontalRule margin="xs" />
        <EuiSpacer size="s" />
        <EuiFormRow
          label={i18n.translate('workspace.form.workspaceDetails.name.label', {
            defaultMessage: 'Name',
          })}
          helpText={i18n.translate('workspace.form.workspaceDetails.name.helpText', {
            defaultMessage:
              'Valid characters are a-z, A-Z, 0-9, (), [], _ (underscore), - (hyphen) and (space).',
          })}
          isInvalid={!!formErrors.name}
          error={formErrors.name}
        >
          <EuiFieldText
            value={formData.name}
            onChange={handleNameInputChange}
            readOnly={!!defaultValues?.reserved}
            data-test-subj="workspaceForm-workspaceDetails-nameInputText"
          />
        </EuiFormRow>
        <EuiFormRow
          label={
            <>
              Description - <i>optional</i>
            </>
          }
          helpText={i18n.translate('workspace.form.workspaceDetails.description.helpText', {
            defaultMessage:
              'Valid characters are a-z, A-Z, 0-9, (), [], _ (underscore), - (hyphen) and (space).',
          })}
          isInvalid={!!formErrors.description}
          error={formErrors.description}
        >
          <EuiFieldText
            value={formData.description}
            onChange={handleDescriptionInputChange}
            data-test-subj="workspaceForm-workspaceDetails-descriptionInputText"
          />
        </EuiFormRow>
        <EuiFormRow
          label={i18n.translate('workspace.form.workspaceDetails.color.label', {
            defaultMessage: 'Color',
          })}
          isInvalid={!!formErrors.color}
          error={formErrors.color}
        >
          <div>
            <EuiText size="xs" color="subdued">
              {i18n.translate('workspace.form.workspaceDetails.color.helpText', {
                defaultMessage: 'Accent color for your workspace',
              })}
            </EuiText>
            <EuiSpacer size={'s'} />
            <EuiColorPicker
              color={formData.color}
              onChange={handleColorChange}
              data-test-subj="workspaceForm-workspaceDetails-colorPicker"
            />
          </div>
        </EuiFormRow>
      </EuiPanel>
      <EuiSpacer />

      <EuiTabs>
        <EuiTab
          onClick={handleTabFeatureClick}
          isSelected={selectedTab === WorkspaceFormTabs.FeatureVisibility}
        >
          <EuiText>{featureVisibilityTitle}</EuiText>
        </EuiTab>
        {permissionEnabled && (
          <EuiTab
            onClick={handleTabPermissionClick}
            isSelected={selectedTab === WorkspaceFormTabs.UsersAndPermissions}
          >
            <EuiText>{usersAndPermissionsTitle}</EuiText>
          </EuiTab>
        )}
      </EuiTabs>
      {selectedTab === WorkspaceFormTabs.FeatureVisibility && (
        <EuiPanel>
          <EuiTitle size="s">
            <h2>{featureVisibilityTitle}</h2>
          </EuiTitle>
          <EuiHorizontalRule margin="xs" />
          <EuiSpacer size="s" />
          <WorkspaceFeatureSelector
            selectedFeatures={formData.features}
            onChange={handleFeaturesChange}
            workspaceConfigurableApps={props.workspaceConfigurableApps}
          />
        </EuiPanel>
      )}
      {selectedTab === WorkspaceFormTabs.UsersAndPermissions && (
        <EuiPanel>
          <EuiTitle size="s">
            <h2>
              {i18n.translate('workspace.form.usersAndPermissions.title', {
                defaultMessage: 'Users & Permissions',
              })}
            </h2>
          </EuiTitle>
          <EuiHorizontalRule margin="xs" />
          <WorkspacePermissionSettingPanel
            errors={formErrors.permissionSettings}
            onChange={setPermissionSettings}
            permissionSettings={formData.permissionSettings}
            lastAdminItemDeletable={!!permissionLastAdminItemDeletable}
            data-test-subj={`workspaceForm-permissionSettingPanel`}
          />
        </EuiPanel>
      )}
      <EuiSpacer />
      <WorkspaceBottomBar
        operationType={operationType}
        formId={formId}
        application={application}
        numberOfErrors={numberOfErrors}
      />
    </EuiForm>
  );
};
