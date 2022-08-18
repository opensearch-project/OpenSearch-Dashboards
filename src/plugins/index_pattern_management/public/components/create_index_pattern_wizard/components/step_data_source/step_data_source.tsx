/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiPageContent } from '@elastic/eui';
import React, { useState } from 'react';
import { DataSourceRef } from 'src/plugins/index_pattern_management/public/types';
import { StepInfo } from '../../types';

import { Header } from './components/header';

interface StepDataSourceProps {
  goToNextStep: (dataSourceRef: DataSourceRef) => void;
  stepInfo: StepInfo;
}

export const StepDataSource = (props: StepDataSourceProps) => {
  const { goToNextStep, stepInfo } = props;

  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceRef>();
  const [isNextStepDisabled, setIsNextStepDisabled] = useState(true);

  const onSearchSelected = (id: string, selectedType: string) => {
    const selected = { id, type: selectedType };

    setSelectedDataSource(selected);
    setIsNextStepDisabled(false);
  };

  const renderContent = () => {
    return (
      <EuiPageContent>
        <Header
          onSearchSelected={onSearchSelected}
          dataSourceRef={selectedDataSource!}
          goToNextStep={() => goToNextStep(selectedDataSource!)}
          isNextStepDisabled={isNextStepDisabled}
          stepInfo={stepInfo}
        />
      </EuiPageContent>
    );
  };

  return <>{renderContent()}</>;
};
