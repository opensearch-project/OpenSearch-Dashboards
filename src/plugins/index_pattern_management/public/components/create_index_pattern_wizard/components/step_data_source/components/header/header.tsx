/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useState } from 'react';
import './header.scss';

import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiRadio,
  EuiSelectable,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { useEffectOnce } from 'react-use';
import {
  DataSourceRef,
  IndexPatternManagmentContext,
} from 'src/plugins/index_pattern_management/public/types';
import { useOpenSearchDashboards } from '../../../../../../../../../plugins/opensearch_dashboards_react/public';
import { getDataSources } from '../../../../../../components/utils';
import { DataSourceTableItem, StepInfo } from '../../../../types';
import { LoadingState } from '../../../loading_state';

interface HeaderProps {
  onDataSourceSelected: (id: string, type: string, title: string) => void;
  dataSourceRef: DataSourceRef;
  goToNextStep: (dataSourceRef: DataSourceRef) => void;
  isNextStepDisabled: boolean;
  stepInfo: StepInfo;
}

export const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
  const { dataSourceRef, onDataSourceSelected, goToNextStep, isNextStepDisabled, stepInfo } = props;
  const { currentStepNumber, totalStepNumber } = stepInfo;

  const [defaultChecked, setDefaultChecked] = useState(true);
  const [dataSourceChecked, setDataSourceChecked] = useState(false);
  const [dataSources, setDataSources] = useState<DataSourceTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    savedObjects,
    notifications: { toasts },
  } = useOpenSearchDashboards<IndexPatternManagmentContext>().services;

  useEffectOnce(() => {
    fetchDataSources();
  });

  const fetchDataSources = () => {
    setIsLoading(true);
    getDataSources(savedObjects.client)
      .then((fetchedDataSources: DataSourceTableItem[]) => {
        setIsLoading(false);
        if (fetchedDataSources?.length) {
          setDataSources(fetchedDataSources);
        }
      })
      .catch(() => {
        toasts.addWarning(
          i18n.translate(
            'indexPatternManagement.createIndexPattern.stepDataSource.fetchDataSourceError',
            {
              defaultMessage: 'Unable to find existing data sources',
            }
          )
        );
      });
  };

  const onSelectedDataSource = (options: DataSourceTableItem[]) => {
    const selectedDataSource = options.find(({ checked }) => checked);
    setDataSources(options);
    onDataSourceSelected(
      selectedDataSource!.id,
      selectedDataSource!.type,
      selectedDataSource!.title
    );
  };

  const onChangeDefaultChecked = (e) => {
    setDefaultChecked(e.target.checked);
    setDataSourceChecked(!e.target.checked);
  };

  const onChangeDataSourceChecked = (e) => {
    setDataSourceChecked(e.target.checked);
    setDefaultChecked(!e.target.checked);
  };

  return (
    <>
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
        <EuiText>
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.stepDataSourceLabel"
            defaultMessage="Please pick the data source -- within which to configure index patterns."
          />
        </EuiText>
        <EuiSpacer size="m" />
        <EuiRadio
          data-test-subj="createIndexPatternStepDataSourceUseDefaultRadio"
          id={'useDefault'}
          label={
            <FormattedMessage
              id="indexPatternManagement.createIndexPattern.stepDataSource.useDefaultLabel"
              defaultMessage="Use default"
            />
          }
          checked={defaultChecked}
          onChange={(e) => onChangeDefaultChecked(e)}
          compressed
        />
        <EuiText size="s" className="dataSourceRadioHelperText">
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.stepDataSource.useDefault.helperText"
            defaultMessage="Uses the default data source configured by the OpenSearch Dashboards administrator."
          />
        </EuiText>
        <EuiSpacer size="l" />
        <EuiRadio
          data-test-subj="createIndexPatternStepDataSourceUseDataSourceRadio"
          id={'useDataSource'}
          label={
            <FormattedMessage
              id="indexPatternManagement.createIndexPattern.stepDataSource.useDataSourceLabel"
              defaultMessage="Choose data source"
            />
          }
          checked={dataSourceChecked}
          onChange={(e) => onChangeDataSourceChecked(e)}
          compressed
        />
        <EuiText size="s" className="dataSourceRadioHelperText">
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.stepDataSource.useDataSource.helperText"
            defaultMessage="Connect to an existing external data source."
          />
        </EuiText>
        {dataSourceChecked && (
          <EuiFlexItem grow={false}>
            <EuiSpacer size="m" />
            <EuiSelectable
              aria-label={
                <FormattedMessage
                  id="indexPatternManagement.createIndexPattern.stepDataSource.searchLabel"
                  defaultMessage="Search data sources"
                />
              }
              searchable
              searchProps={{
                'data-test-subj': 'selectDataSources',
                placeholder: i18n.translate(
                  'indexPatternManagement.createIndexPattern.stepDataSource.searchPlaceHolder',
                  {
                    defaultMessage: 'Search data sources',
                  }
                ),
                isInvalid: !!dataSources,
              }}
              singleSelection={'always'}
              options={dataSources}
              onChange={(newOptions) => onSelectedDataSource(newOptions)}
            >
              {(list, search) => (
                <Fragment>
                  {search}
                  <EuiSpacer size="s" />
                  {list}
                </Fragment>
              )}
            </EuiSelectable>
          </EuiFlexItem>
        )}
        <EuiSpacer size="m" />
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButton
              data-test-subj="createIndexPatternStepDataSourceNextStepButton"
              fill
              iconSide="right"
              iconType="arrowRight"
              onClick={() => goToNextStep(dataSourceRef)}
              isDisabled={isNextStepDisabled && !defaultChecked}
            >
              <FormattedMessage
                id="indexPatternManagement.createIndexPattern.step.nextStepButton"
                defaultMessage="Next step"
              />
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      {isLoading ? <LoadingState /> : null}
    </>
  );
};
