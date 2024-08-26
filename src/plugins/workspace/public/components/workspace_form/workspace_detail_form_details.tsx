/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCompressedSuperSelect,
  EuiCompressedColorPicker,
  EuiCompressedFormRow,
  EuiDescribedFormGroup,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { useObservable } from 'react-use';
import {
  detailsName,
  detailsColorLabel,
  detailsUseCaseLabel,
  detailsColorHelpText,
  detailsDescriptionIntroduction,
  detailsUseCaseHelpText,
} from './constants';
import { CoreStart } from '../../../../../core/public';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { useWorkspaceFormContext } from './workspace_form_context';
import { WorkspaceUseCase as WorkspaceUseCaseObject } from '../../types';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceNameField } from './fields/workspace_name_field';
import { WorkspaceDescriptionField } from './fields/workspace_description_field';

interface WorkspaceDetailFormDetailsProps {
  availableUseCases: Array<
    Pick<WorkspaceUseCaseObject, 'id' | 'title' | 'description' | 'systematic'>
  >;
}

export const WorkspaceDetailFormDetails = ({
  availableUseCases,
}: WorkspaceDetailFormDetailsProps) => {
  const {
    setName,
    formData,
    isEditing,
    formErrors,
    setDescription,
    handleColorChange,
    handleUseCaseChange,
  } = useWorkspaceFormContext();
  const {
    services: { workspaces },
  } = useOpenSearchDashboards<CoreStart>();
  const [value, setValue] = useState(formData.useCase);
  const currentWorkspace = useObservable(workspaces.currentWorkspace$);
  const currentUseCase = getFirstUseCaseOfFeatureConfigs(currentWorkspace?.features ?? []);

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
      return currentUseCase === 'analytics' || id === 'all' || id === currentUseCase;
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
          error={formErrors.name?.message}
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
            color={formData.color}
            onChange={handleColorChange}
            readOnly={!isEditing}
            data-test-subj="workspaceForm-workspaceDetails-colorPicker"
          />
        </EuiCompressedFormRow>
      </EuiDescribedFormGroup>
    </>
  );
};
