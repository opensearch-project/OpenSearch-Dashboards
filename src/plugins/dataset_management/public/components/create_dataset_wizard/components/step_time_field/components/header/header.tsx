/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiTitle, EuiSpacer, EuiText } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { StepInfo } from '../../../../types';

interface HeaderProps {
  dataset: string;
  datasetName: string;
  stepInfo: StepInfo;
}

export const Header: React.FC<HeaderProps> = ({ dataset, datasetName, stepInfo }) => (
  <div>
    <EuiTitle size="s">
      <h2>
        <FormattedMessage
          id="datasetManagement.createDataset.stepTimeHeader"
          defaultMessage="Step {currentStepNumber} of {totalStepNumber}: Configure settings"
          values={{
            currentStepNumber: stepInfo.currentStepNumber,
            totalStepNumber: stepInfo.totalStepNumber,
          }}
        />
      </h2>
    </EuiTitle>
    <EuiSpacer size="m" />
    <EuiText>
      <FormattedMessage
        id="datasetManagement.createDataset.stepTimeLabel"
        defaultMessage="Specify settings for your {dataset} {datasetName}."
        values={{
          dataset: <strong>{dataset}</strong>,
          datasetName,
        }}
      />
    </EuiText>
  </div>
);
