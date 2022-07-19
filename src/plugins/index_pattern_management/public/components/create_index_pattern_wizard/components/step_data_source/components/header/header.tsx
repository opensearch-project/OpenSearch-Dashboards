/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiTitle, EuiSpacer, EuiText, EuiFlexItem, EuiFormRow, EuiButton } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { IndexPatternManagmentContext } from 'src/plugins/index_pattern_management/public/types';
import { SavedObjectFinderUi } from '../../../../../../../../../plugins/saved_objects/public';
import { useOpenSearchDashboards } from '../../../../../../../../../plugins/opensearch_dashboards_react/public';

interface HeaderProps {
  onSearchSelected: (id: string, type: string, name: string) => void;
  dataSourcesJson: string;
  goToNextStep: (dataSourcesJson: string) => void;
  isNextStepDisabled: boolean;
  // savedObjects: SavedObjectsStart;
}

// todo: We can consider defult select default datasource
export const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
  const { dataSourcesJson, onSearchSelected, goToNextStep, isNextStepDisabled } = props;

  const { savedObjects, uiSettings } = useOpenSearchDashboards<
    IndexPatternManagmentContext
  >().services;

  return (
    <div>
      <EuiTitle size="s">
        <h2>
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.stepDataSource"
            defaultMessage="Step 0 of 2: Configure data source"
          />
        </h2>
      </EuiTitle>
      <EuiSpacer size="m" />
      <EuiText>
        <FormattedMessage
          id="indexPatternManagement.createIndexPattern.stepTimeLabel"
          defaultMessage="Select a data source -- inside which to configure index pattern."
        />
      </EuiText>
      <EuiFlexItem grow={false}>
        <SavedObjectFinderUi
          key="searchSavedObjectFinder"
          onChoose={onSearchSelected} // todo
          showFilter={false}
          noItemsMessage={i18n.translate(
            'dataSources.newDataSource.searchSelection.notFoundLabel',
            {
              defaultMessage: 'No data sources have been configured yet.',
            }
          )}
          savedObjectMetaData={[
            {
              type: 'data-source',
              getIconForSavedObject: () => 'data-source',
              name: i18n.translate(
                'dataSources.newDataSource.searchSelection.savedObjectType.credential',
                {
                  defaultMessage: 'Data Source',
                }
              ),
            },
          ]}
          fixedPageSize={5} // todo
          uiSettings={uiSettings} // todo
          savedObjects={savedObjects}
        />
        <EuiFormRow hasEmptyLabelSpace>
          <EuiButton
            fill
            iconSide="right"
            iconType="arrowRight"
            onClick={() => goToNextStep(dataSourcesJson)}
            isDisabled={isNextStepDisabled}
          >
            <FormattedMessage
              id="indexPatternManagement.createIndexPattern.step.nextStepButton"
              defaultMessage="Next step"
            />
          </EuiButton>
        </EuiFormRow>
      </EuiFlexItem>
    </div>
  );
};
