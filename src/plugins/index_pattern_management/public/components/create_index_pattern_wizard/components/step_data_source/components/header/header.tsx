/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import {
  EuiTitle,
  EuiSpacer,
  EuiText,
  EuiFlexItem,
  EuiButton,
  EuiFlexGroup,
  EuiSwitch,
  EuiSwitchEvent,
} from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import {
  DataSourceRef,
  IndexPatternManagmentContext,
} from 'src/plugins/index_pattern_management/public/types';
import { SavedObjectFinderUi } from '../../../../../../../../../plugins/saved_objects/public';
import { useOpenSearchDashboards } from '../../../../../../../../../plugins/opensearch_dashboards_react/public';
import { StepInfo } from '../../../../types';

interface HeaderProps {
  onSearchSelected: (id: string, type: string) => void;
  dataSourceRef: DataSourceRef;
  goToNextStep: (dataSourceRef: DataSourceRef) => void;
  isNextStepDisabled: boolean;
  stepInfo: StepInfo;
}

const DATA_SOURCE_PAGE_SIZE = 5;

export const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
  const { dataSourceRef, onSearchSelected, goToNextStep, isNextStepDisabled, stepInfo } = props;
  const { currentStepNumber, totalStepNumber } = stepInfo;

  const [skipped, setSkipped] = useState(false);

  const { savedObjects, uiSettings } = useOpenSearchDashboards<
    IndexPatternManagmentContext
  >().services;

  const onSkipped = (e: EuiSwitchEvent) => {
    setSkipped(e.target.checked);
  };

  return (
    <div>
      <EuiTitle size="s">
        <h2>
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.stepDataSourceHeader"
            defaultMessage="Step {currentStepNumber} of {totalStepNumber}: Configure data source"
            values={{ currentStepNumber, totalStepNumber }}
          />
        </h2>
      </EuiTitle>
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiSwitch
          label={
            <FormattedMessage
              id="indexPatternManagement.createIndexPattern.stepDataSource.skipLabel"
              defaultMessage="skip"
            />
          }
          checked={skipped}
          onChange={onSkipped}
        />
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiText>
        <FormattedMessage
          id="indexPatternManagement.createIndexPattern.stepDataSourceLabel"
          defaultMessage="Please pick the data source -- within which to configure index patterns."
        />
      </EuiText>
      {!skipped && (
        <EuiFlexItem grow={false}>
          <SavedObjectFinderUi
            key="searchSavedObjectFinder"
            onChoose={onSearchSelected}
            showFilter={false}
            noItemsMessage={i18n.translate(
              'indexPatternManagement.createIndexPattern.searchSelection.notFoundLabel',
              {
                defaultMessage: 'No data sources have been configured yet.',
              }
            )}
            savedObjectMetaData={[
              {
                type: 'data-source',
                getIconForSavedObject: () => 'apps', // todo: #2034
                name: i18n.translate(
                  'indexPatternManagement.createIndexPattern.searchSelection.savedObjectType.dataSource',
                  {
                    defaultMessage: 'Data Source',
                  }
                ),
              },
            ]}
            fixedPageSize={DATA_SOURCE_PAGE_SIZE}
            uiSettings={uiSettings}
            savedObjects={savedObjects}
          />
        </EuiFlexItem>
      )}
      <EuiSpacer size="m" />
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            iconSide="right"
            iconType="arrowRight"
            onClick={() => goToNextStep(dataSourceRef)}
            isDisabled={isNextStepDisabled && !skipped}
          >
            <FormattedMessage
              id="indexPatternManagement.createIndexPattern.step.nextStepButton"
              defaultMessage="Next step"
            />
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
