/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiAccordion, EuiFieldNumber, EuiFormRow, EuiSpacer, EuiText } from '@elastic/eui';
import producer from 'immer';
import React, { ChangeEvent, useState } from 'react';
import { CreateAccelerationForm } from '../../../../../framework/types';
import { hasError, validatePrimaryShardCount, validateReplicaCount } from '../create/utils';
import { DefineIndexOptions } from './define_index_options';

interface IndexAdvancedSettingsProps {
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
}

export const IndexAdvancedSettings = ({
  accelerationFormData,
  setAccelerationFormData,
}: IndexAdvancedSettingsProps) => {
  const [primaryShards, setPrimaryShards] = useState(1);
  const [replicaCount, setReplicaCount] = useState(1);

  const onChangePrimaryShards = (e: ChangeEvent<HTMLInputElement>) => {
    const countPrimaryShards = parseInt(e.target.value, 10);
    setAccelerationFormData({
      ...accelerationFormData,
      primaryShardsCount: countPrimaryShards,
    });
    setPrimaryShards(countPrimaryShards);
  };

  const onChangeReplicaCount = (e: ChangeEvent<HTMLInputElement>) => {
    const parsedReplicaCount = parseInt(e.target.value, 10);
    setAccelerationFormData({
      ...accelerationFormData,
      replicaShardsCount: parsedReplicaCount,
    });
    setReplicaCount(parsedReplicaCount);
  };

  return (
    <EuiAccordion
      id="accordion1"
      buttonContent={
        <EuiText data-test-subj="advanced-settings-header">
          <h3>Advanced settings</h3>
        </EuiText>
      }
      paddingSize="l"
    >
      {accelerationFormData.accelerationIndexType === 'skipping' && (
        <DefineIndexOptions
          accelerationFormData={accelerationFormData}
          setAccelerationFormData={setAccelerationFormData}
        />
      )}
      <EuiFormRow
        label="Number of primary shards"
        helpText="Specify the number of primary shards for the index. The number of primary shards cannot be changed after the index is created."
        isInvalid={hasError(accelerationFormData.formErrors, 'primaryShardsError')}
        error={accelerationFormData.formErrors.primaryShardsError}
      >
        <EuiFieldNumber
          placeholder="Number of primary shards"
          value={primaryShards}
          onChange={onChangePrimaryShards}
          aria-label="Number of primary shards"
          min={1}
          max={100}
          onBlur={(e) => {
            setAccelerationFormData(
              producer((accData) => {
                accData.formErrors.primaryShardsError = validatePrimaryShardCount(
                  parseInt(e.target.value, 10)
                );
              })
            );
          }}
          isInvalid={hasError(accelerationFormData.formErrors, 'primaryShardsError')}
        />
      </EuiFormRow>
      <EuiSpacer size="l" />
      <EuiFormRow
        label="Number of replicas"
        helpText="Specify the number of replicas each primary shard should have."
        isInvalid={hasError(accelerationFormData.formErrors, 'replicaShardsError')}
        error={accelerationFormData.formErrors.replicaShardsError}
      >
        <EuiFieldNumber
          placeholder="Number of replicas"
          value={replicaCount}
          onChange={onChangeReplicaCount}
          aria-label="Number of replicas"
          min={0}
          max={100}
          onBlur={(e) => {
            setAccelerationFormData(
              producer((accData) => {
                accData.formErrors.replicaShardsError = validateReplicaCount(
                  parseInt(e.target.value, 10)
                );
              })
            );
          }}
          isInvalid={hasError(accelerationFormData.formErrors, 'replicaShardsError')}
        />
      </EuiFormRow>
    </EuiAccordion>
  );
};
