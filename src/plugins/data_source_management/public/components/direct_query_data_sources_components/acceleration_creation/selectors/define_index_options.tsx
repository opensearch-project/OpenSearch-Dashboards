/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIconTip,
  EuiLink,
  EuiMarkdownFormat,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiText,
} from '@elastic/eui';
import producer from 'immer';
import React, { ChangeEvent, useState } from 'react';
import { ACCELERATION_INDEX_NAME_INFO } from '../../../../../framework/constants';
import { CreateAccelerationForm } from '../../../../../framework/types';
import { hasError, validateIndexName } from '../create/utils';

interface DefineIndexOptionsProps {
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
}

export const DefineIndexOptions = ({
  accelerationFormData,
  setAccelerationFormData,
}: DefineIndexOptionsProps) => {
  const [modalComponent, setModalComponent] = useState(<></>);

  const modalValue = (
    <EuiModal maxWidth={850} onClose={() => setModalComponent(<></>)}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>Acceleration index naming</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiMarkdownFormat>{ACCELERATION_INDEX_NAME_INFO}</EuiMarkdownFormat>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButton onClick={() => setModalComponent(<></>)} fill>
          Close
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );

  const onChangeIndexName = (e: ChangeEvent<HTMLInputElement>) => {
    setAccelerationFormData({ ...accelerationFormData, accelerationIndexName: e.target.value });
  };

  const getPreprend = () => {
    const dataSource =
      accelerationFormData.dataSource !== ''
        ? accelerationFormData.dataSource
        : '{Datasource Name}';
    const database =
      accelerationFormData.database !== '' ? accelerationFormData.database : '{Database Name}';
    const dataTable =
      accelerationFormData.dataTable !== '' ? accelerationFormData.dataTable : '{Table Name}';
    const prependValue =
      accelerationFormData.accelerationIndexType === 'materialized'
        ? `flint_${dataSource}_${database}_`
        : `flint_${dataSource}_${database}_${dataTable}_`;
    return [
      prependValue,
      <EuiIconTip type="iInCircle" color="subdued" content={prependValue} position="top" />,
    ];
  };

  const getAppend = () => {
    const appendValue =
      accelerationFormData.accelerationIndexType === 'materialized' ? '' : '_index';
    return appendValue;
  };

  return (
    <>
      <EuiFormRow
        label="Index name"
        helpText='Must be in lowercase letters, numbers and underscore. Spaces, commas, and characters -, :, ", *, +, /, \, |, ?, #, >, or < are not allowed. Prefix and suffix are added to the name of generated OpenSearch index.'
        isInvalid={hasError(accelerationFormData.formErrors, 'indexNameError')}
        error={accelerationFormData.formErrors.indexNameError}
        labelAppend={
          <EuiText size="xs">
            <EuiLink onClick={() => setModalComponent(modalValue)}>Help</EuiLink>
          </EuiText>
        }
      >
        <EuiFieldText
          placeholder="Enter index name"
          value={accelerationFormData.accelerationIndexName}
          onChange={onChangeIndexName}
          aria-label="Enter Index Name"
          prepend={getPreprend()}
          append={getAppend()}
          disabled={accelerationFormData.accelerationIndexType === 'skipping'}
          isInvalid={hasError(accelerationFormData.formErrors, 'indexNameError')}
          onBlur={(e) => {
            setAccelerationFormData(
              producer((accData) => {
                accData.formErrors.indexNameError = validateIndexName(e.target.value);
              })
            );
          }}
        />
      </EuiFormRow>
      {modalComponent}
    </>
  );
};
