/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './workspace_detail_form.scss';
import React, { useEffect, useRef, useState } from 'react';
import {
  EuiSpacer,
  EuiForm,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiCompressedFormRow,
  EuiCompressedFieldText,
  EuiText,
  EuiCompressedTextArea,
  EuiColorPicker,
  EuiPanel,
  EuiSmallButton,
  EuiHorizontalRule,
} from '@elastic/eui';

import { WorkspaceBottomBar } from './workspace_bottom_bar';
import { WorkspaceFormProps } from './types';
import { WorkspaceUseCase } from './workspace_use_case';
import { WorkspacePermissionSettingPanel } from './workspace_permission_setting_panel';
import {
  DetailTab,
  detailsColorHelpText,
  detailsColorLabel,
  detailsDescriptionIntroduction,
  detailsDescriptionPlaceholder,
  detailsName,
  detailsNameHelpText,
  detailsNamePlaceholder,
  detailsUseCaseLabel,
  usersAndPermissionsTitle,
} from './constants';
import { WorkspaceFormErrorCallout } from './workspace_form_error_callout';
import { useWorkspaceFormContext } from './workspace_form_context';

interface FormGroupProps {
  title: React.ReactNode;
  children: React.ReactNode;
  describe?: string;
}

const FormGroup = ({ title, children, describe }: FormGroupProps) => (
  <>
    <EuiFlexGroup gutterSize="xl">
      <EuiFlexItem grow={false} className="workspace-detail-form-group">
        <EuiTitle size="xs">
          <h3>{title}</h3>
        </EuiTitle>
        <EuiText size="xs" color="subdued">
          {describe}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiSpacer size="s" />
        {children}
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer />
  </>
);

export const WorkspaceDetailForm = (props: WorkspaceFormProps) => {
  const { detailTab, detailTitle, application, defaultValues, availableUseCases } = props;
  const {
    formId,
    formData,
    isEditing,
    formErrors,
    setIsEditing,
    numberOfErrors,
    numberOfChanges,
    handleResetForm,
    handleFormSubmit,
    handleColorChange,
    handleUseCaseChange,
    setPermissionSettings,
    handleNameInputChange,
    handleDescriptionChange,
  } = useWorkspaceFormContext();

  const currentUseCase =
    availableUseCases.find((useCase) => useCase.id === formData.useCase)?.title ?? '';
  const disabledUserOrGroupInputIdsRef = useRef(
    defaultValues?.permissionSettings?.map((item) => item.id) ?? []
  );

  const [isSaving, setIsSaving] = useState(false);

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (event: any) => {
      if (!isSaving && isEditing && numberOfChanges > 0) {
        event.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditing, isSaving, numberOfChanges]);

  return (
    <EuiForm
      id={formId}
      onSubmit={(event) => {
        setIsSaving(true);
        handleFormSubmit(event);
      }}
      component="form"
    >
      {numberOfErrors > 0 && (
        <>
          <WorkspaceFormErrorCallout errors={formErrors} />
          <EuiSpacer />
        </>
      )}
      <EuiPanel>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <h2>{detailTitle}</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {isEditing ? (
              <EuiSmallButton
                onClick={handleResetForm}
                data-test-subj="workspaceForm-workspaceDetails-discardChanges"
              >
                Discard changes
              </EuiSmallButton>
            ) : (
              <EuiSmallButton
                onClick={() => setIsEditing((prevIsEditing) => !prevIsEditing)}
                data-test-subj="workspaceForm-workspaceDetails-edit"
              >
                Edit
              </EuiSmallButton>
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiHorizontalRule />
        {detailTab === DetailTab.Details && (
          <>
            <FormGroup title={detailsName}>
              <EuiCompressedFormRow
                label={detailsName}
                helpText={detailsNameHelpText}
                isInvalid={!!formErrors.name}
                error={formErrors.name?.message}
              >
                <EuiCompressedFieldText
                  value={formData.name}
                  onChange={handleNameInputChange}
                  readOnly={!isEditing}
                  data-test-subj="workspaceForm-workspaceDetails-nameInputText"
                  placeholder={detailsNamePlaceholder}
                />
              </EuiCompressedFormRow>
            </FormGroup>
            <FormGroup
              title={
                <>
                  Description - <i>optional</i>
                </>
              }
              describe={detailsDescriptionIntroduction}
            >
              <EuiCompressedFormRow label="Description">
                <EuiCompressedTextArea
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  readOnly={!isEditing}
                  data-test-subj="workspaceForm-workspaceDetails-descriptionInputText"
                  rows={4}
                  placeholder={detailsDescriptionPlaceholder}
                />
              </EuiCompressedFormRow>
            </FormGroup>
            <FormGroup title={detailsUseCaseLabel}>
              {isEditing ? (
                <WorkspaceUseCase
                  value={formData.useCase}
                  onChange={handleUseCaseChange}
                  formErrors={formErrors}
                  availableUseCases={availableUseCases}
                />
              ) : (
                <EuiCompressedFormRow label={detailsUseCaseLabel}>
                  <EuiCompressedFieldText
                    value={currentUseCase}
                    readOnly={true}
                    data-test-subj="workspaceForm-workspaceDetails-nameInputText"
                  />
                </EuiCompressedFormRow>
              )}
            </FormGroup>
            <FormGroup title={detailsColorLabel} describe={detailsColorHelpText}>
              <EuiCompressedFormRow
                label={detailsColorLabel}
                isInvalid={!!formErrors.color}
                error={formErrors.color?.message}
              >
                <EuiColorPicker
                  color={formData.color}
                  onChange={handleColorChange}
                  readOnly={!isEditing}
                  data-test-subj="workspaceForm-workspaceDetails-colorPicker"
                />
              </EuiCompressedFormRow>
            </FormGroup>
          </>
        )}
        {detailTab === DetailTab.Collaborators && (
          <FormGroup title={usersAndPermissionsTitle}>
            <WorkspacePermissionSettingPanel
              errors={formErrors.permissionSettings?.fields}
              onChange={setPermissionSettings}
              permissionSettings={formData.permissionSettings}
              disabledUserOrGroupInputIds={disabledUserOrGroupInputIdsRef.current}
              data-test-subj={`workspaceForm-permissionSettingPanel`}
              isEditing={isEditing}
            />
          </FormGroup>
        )}
      </EuiPanel>
      <EuiSpacer />
      {isEditing && (
        <WorkspaceBottomBar
          formId={formId}
          application={application}
          numberOfChanges={numberOfChanges}
          numberOfErrors={numberOfErrors}
          handleResetForm={handleResetForm}
        />
      )}
    </EuiForm>
  );
};
