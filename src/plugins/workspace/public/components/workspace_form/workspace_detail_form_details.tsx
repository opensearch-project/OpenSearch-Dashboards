/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiSuperSelect,
  EuiColorPicker,
  EuiCompressedFormRow,
  EuiDescribedFormGroup,
  EuiCompressedTextArea,
  EuiCompressedFieldText,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import {
  detailsName,
  detailsColorLabel,
  detailsNameHelpText,
  detailsUseCaseLabel,
  detailsColorHelpText,
  detailsNamePlaceholder,
  detailsDescriptionPlaceholder,
  detailsDescriptionIntroduction,
} from './constants';
import { DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { useWorkspaceFormContext } from './workspace_form_context';
import { WorkspaceUseCase as WorkspaceUseCaseObject } from '../../types';

interface WorkspaceDetailFormDetailsProps {
  availableUseCases: Array<
    Pick<WorkspaceUseCaseObject, 'id' | 'title' | 'description' | 'systematic'>
  >;
}

export const WorkspaceDetailFormDetailsProps = ({
  availableUseCases,
}: WorkspaceDetailFormDetailsProps) => {
  const {
    formData,
    isEditing,
    formErrors,
    handleColorChange,
    handleUseCaseChange,
    handleNameInputChange,
    handleDescriptionChange,
  } = useWorkspaceFormContext();

  const [value, setValue] = useState(formData.useCase);

  useEffect(() => {
    setValue(formData.useCase);
  }, [formData.useCase]);

  const options = availableUseCases
    .filter((item) => !item.systematic)
    .concat(DEFAULT_NAV_GROUPS.all)
    .map((useCase) => {
      return {
        value: useCase.id,
        inputDisplay: useCase.title,
        'data-test-subj': useCase.id,
      };
    });

  return (
    <>
      <EuiDescribedFormGroup title={<h3>{detailsName}</h3>}>
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
      </EuiDescribedFormGroup>
      <EuiDescribedFormGroup
        title={
          <h3>
            Description - <i>optional</i>
          </h3>
        }
        description={detailsDescriptionIntroduction}
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
      </EuiDescribedFormGroup>
      <EuiDescribedFormGroup title={<h3>{detailsUseCaseLabel}</h3>}>
        <EuiCompressedFormRow
          label={detailsUseCaseLabel}
          isInvalid={!!formErrors.features}
          error={formErrors.features?.message}
        >
          <EuiSuperSelect
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
          <EuiColorPicker
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
