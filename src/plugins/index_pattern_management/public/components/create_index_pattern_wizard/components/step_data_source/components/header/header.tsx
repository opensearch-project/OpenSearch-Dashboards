/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiTitle, EuiSpacer, EuiText, EuiFlexItem, EuiFormRow, EuiButton } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import {
  DataSourceRef,
  IndexPatternManagmentContext,
} from 'src/plugins/index_pattern_management/public/types';
import { SavedObjectFinderUi } from '../../../../../../../../../plugins/saved_objects/public';
import { useOpenSearchDashboards } from '../../../../../../../../../plugins/opensearch_dashboards_react/public';

interface HeaderProps {
  onSearchSelected: (id: string, type: string) => void;
  dataSourceRef: DataSourceRef;
  goToNextStep: (dataSourceRef: DataSourceRef) => void;
  isNextStepDisabled: boolean;
}

const DATA_SOURCE_PAGE_SIZE = 5;

export const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
  const { dataSourceRef, onSearchSelected, goToNextStep, isNextStepDisabled } = props;

  const { savedObjects, uiSettings } = useOpenSearchDashboards<
    IndexPatternManagmentContext
  >().services;

  return (
    <div>
      <EuiTitle size="s">
        <h2>
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.stepDataSourceHeader"
            defaultMessage="Step 0 of 2: Configure data source" // todo: make dynamic: Next PR
          />
        </h2>
      </EuiTitle>
      <EuiSpacer size="m" />
      <EuiText>
        <FormattedMessage
          id="indexPatternManagement.createIndexPattern.stepDataSourceLabel"
          defaultMessage="Please pick the data source -- within which to configure index patterns."
        />
      </EuiText>
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
        <EuiFormRow hasEmptyLabelSpace>
          <EuiButton
            fill
            iconSide="right"
            iconType="arrowRight"
            onClick={() => goToNextStep(dataSourceRef)}
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
