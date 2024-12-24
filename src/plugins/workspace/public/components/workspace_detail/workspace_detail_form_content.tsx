/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCompressedSuperSelect,
  EuiCompressedColorPicker,
  EuiCompressedFormRow,
  EuiDescribedFormGroup,
  EuiText,
  EuiLink,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useObservable } from 'react-use';
import { WORKSPACE_COLLABORATORS_APP_ID } from '../../../common/constants';
import {
  detailsName,
  detailsColorLabel,
  detailsUseCaseLabel,
  detailsColorHelpText,
  detailsDescriptionIntroduction,
  detailsUseCaseHelpText,
  workspacePrivacyTitle,
  privacyType2TextMap,
} from '../workspace_form/constants';
import { CoreStart } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { useWorkspaceFormContext } from '../workspace_form/workspace_form_context';
import { WorkspaceUseCase as WorkspaceUseCaseObject } from '../../types';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceNameField } from '../workspace_form/fields/workspace_name_field';
import { WorkspaceDescriptionField } from '../workspace_form/fields/workspace_description_field';
import { WorkspacePrivacySettingSelect } from '../workspace_form/workspace_privacy_setting_select';

interface WorkspaceDetailFormContentProps {
  availableUseCases: Array<
    Pick<WorkspaceUseCaseObject, 'id' | 'title' | 'description' | 'systematic'>
  >;
}

export const WorkspaceDetailFormContent = ({
  availableUseCases,
}: WorkspaceDetailFormContentProps) => {
  const {
    setName,
    formData,
    isEditing,
    formErrors,
    setDescription,
    handleColorChange,
    handleUseCaseChange,
    privacyType,
    setPrivacyType,
  } = useWorkspaceFormContext();
  const {
    services: { workspaces, application },
  } = useOpenSearchDashboards<CoreStart>();
  const [value, setValue] = useState(formData.useCase);
  const currentWorkspace = useObservable(workspaces.currentWorkspace$);
  const currentUseCase = getFirstUseCaseOfFeatureConfigs(currentWorkspace?.features ?? []);
  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;

  useEffect(() => {
    setValue(formData.useCase);
  }, [formData.useCase]);

  const options = availableUseCases
    .filter((item) => !item.systematic)
    .concat(DEFAULT_NAV_GROUPS.all)
    .filter(({ id }) => {
      // Essential can be changed to other use cases;
      // Analytics (all) cannot be changed back to a single use case;
      // Other use cases can only be changed to Analytics (all) use case.
      return (
        currentUseCase === DEFAULT_NAV_GROUPS.essentials.id ||
        id === DEFAULT_NAV_GROUPS.all.id ||
        id === currentUseCase
      );
    })
    .map((useCase) => ({
      value: useCase.id,
      inputDisplay: useCase.title,
      'data-test-subj': useCase.id,
    }));

  return (
    <>
      <EuiDescribedFormGroup title={<h3>{detailsName}</h3>}>
        <WorkspaceNameField
          value={formData.name}
          onChange={setName}
          readOnly={!isEditing}
          error={formErrors.name?.message}
        />
      </EuiDescribedFormGroup>
      <EuiDescribedFormGroup
        title={
          <h3>
            Description - <i>optional</i>
          </h3>
        }
        description={detailsDescriptionIntroduction}
      >
        <WorkspaceDescriptionField
          value={formData.description}
          onChange={setDescription}
          readOnly={!isEditing}
        />
      </EuiDescribedFormGroup>
      <EuiDescribedFormGroup title={<h3>{detailsUseCaseLabel}</h3>}>
        <EuiCompressedFormRow
          label={detailsUseCaseLabel}
          isInvalid={!!formErrors.features}
          error={formErrors.features?.message}
          helpText={detailsUseCaseHelpText}
        >
          <EuiCompressedSuperSelect
            hasDividers={true}
            options={options}
            valueOfSelected={value}
            onChange={(id) => {
              setValue(id);
              handleUseCaseChange(id);
            }}
            disabled={!isEditing}
            readOnly={!isEditing}
          />
        </EuiCompressedFormRow>
      </EuiDescribedFormGroup>
      <EuiDescribedFormGroup
        title={<h3>{detailsColorLabel}</h3>}
        description={detailsColorHelpText}
      >
        <EuiCompressedFormRow
          label={detailsColorLabel}
          isInvalid={!!formErrors.color}
          error={formErrors.color?.message}
        >
          <EuiCompressedColorPicker
            mode="swatch"
            color={formData.color}
            onChange={handleColorChange}
            readOnly={!isEditing}
            data-test-subj="workspaceForm-workspaceDetails-colorPicker"
          />
        </EuiCompressedFormRow>
      </EuiDescribedFormGroup>
      {isPermissionEnabled && (
        <EuiDescribedFormGroup
          title={<h3>{workspacePrivacyTitle}</h3>}
          description={
            <FormattedMessage
              id="workspace.form.details.panels.privacy.description"
              defaultMessage="Manage who can view or edit workspace and assign workspace administrators on the {collaboratorsLink} page."
              values={{
                collaboratorsLink: (
                  <EuiLink
                    onClick={() => application.navigateToApp(WORKSPACE_COLLABORATORS_APP_ID)}
                  >
                    <FormattedMessage
                      id="workspace.form.details.panels.privacy.linkToCollaborators"
                      defaultMessage="Collaborators"
                    />
                  </EuiLink>
                ),
              }}
            />
          }
        >
          {isEditing ? (
            <WorkspacePrivacySettingSelect
              selectedPrivacyType={privacyType}
              onSelectedPrivacyTypeChange={setPrivacyType}
            />
          ) : (
            <EuiCompressedFormRow label={privacyType2TextMap[privacyType].title}>
              <EuiText size="xs" color="subdued">
                {privacyType2TextMap[privacyType].description}
              </EuiText>
            </EuiCompressedFormRow>
          )}
        </EuiDescribedFormGroup>
      )}
    </>
  );
};
