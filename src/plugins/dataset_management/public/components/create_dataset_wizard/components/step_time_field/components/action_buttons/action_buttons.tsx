/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiFlexGroup, EuiFlexItem, EuiSmallButton, EuiSmallButtonEmpty } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';

export const ActionButtons = ({
  goToPreviousStep,
  submittable,
  createDataset,
}: {
  goToPreviousStep: () => void;
  submittable: boolean;
  createDataset: () => void;
}) => (
  <EuiFlexGroup justifyContent="flexEnd">
    <EuiFlexItem grow={false}>
      <EuiSmallButtonEmpty iconType="arrowLeft" onClick={goToPreviousStep}>
        <FormattedMessage
          id="datasetManagement.createDataset.stepTime.backButton"
          defaultMessage="Back"
        />
      </EuiSmallButtonEmpty>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiSmallButton
        isDisabled={!submittable}
        data-test-subj="createDatasetButton"
        fill
        onClick={createDataset}
      >
        <FormattedMessage
          id="datasetManagement.createDataset.stepTime.createPatternButton"
          defaultMessage="Create index pattern"
        />
      </EuiSmallButton>
    </EuiFlexItem>
  </EuiFlexGroup>
);
