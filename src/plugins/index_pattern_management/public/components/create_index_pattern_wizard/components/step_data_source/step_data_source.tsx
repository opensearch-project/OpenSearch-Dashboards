/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiPageContent } from '@elastic/eui';
import React, { useState } from 'react';

import { IndexPatternCreationConfig } from '../../../../../../../plugins/index_pattern_management/public';
import { Header } from './components/header';

interface StepDataSourceProps {
  indexPatternCreationType: IndexPatternCreationConfig;
  goToNextStep: (dataSourcesJson: string) => void;
  // savedObjects: SavedObjectsStart; //todo: should this be passed in, or directly use in header
}

export const StepDataSource = (props: StepDataSourceProps) => {
  const { indexPatternCreationType, goToNextStep } = props;

  const [selectedDataSource, setSelectedDataSource] = useState('');

  // todo: consistent name
  const onSearchSelected = (id: string, selectedType: string, name: string) => {
    const selected = [{ id, type: selectedType, name }];
    const selectedDataSourceJson = JSON.stringify(selected);
    setSelectedDataSource(selectedDataSourceJson);
  };

  const renderContent = () => {
    const isNextStepDisabled = selectedDataSource === ''; // todo: more elegant

    return (
      <EuiPageContent>
        <Header
          // isInputInvalid={isInputInvalid}
          onSearchSelected={onSearchSelected}
          dataSourcesJson={selectedDataSource}
          goToNextStep={() => goToNextStep(selectedDataSource)}
          isNextStepDisabled={isNextStepDisabled}
          // savedObjects={savedObjects}
        />
      </EuiPageContent>
    );
  };

  return <>{renderContent()}</>;
};
