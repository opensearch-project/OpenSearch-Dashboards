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

  const onDataSourceSelected = (id: string, selectedType: string, title: string) => {
    const selected = { id, type: selectedType, title };

    setSelectedDataSource(selected);
    setIsNextStepDisabled(false);
  };

  const renderContent = () => {
    return (
      <EuiPageContent>
        <Header
          onDataSourceSelected={onDataSourceSelected}
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
