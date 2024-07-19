/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useState } from 'react';

import {
  EuiSmallButton,
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
import semver from 'semver';
import { useOpenSearchDashboards } from '../../../../../../../../../plugins/opensearch_dashboards_react/public';
import { getDataSources } from '../../../../../../components/utils';
import { DataSourceTableItem, StepInfo } from '../../../../types';
import { LoadingState } from '../../../loading_state';
import * as pluginManifest from '../../../../../../../opensearch_dashboards.json';

interface HeaderProps {
  onDataSourceSelected: (id: string, type: string, title: string) => void;
  dataSourceRef: DataSourceRef;
  goToNextStep: (dataSourceRef: DataSourceRef) => void;
  isNextStepDisabled: boolean;
  stepInfo: StepInfo;
  hideLocalCluster: boolean;
}

export const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
  const {
    dataSourceRef,
    onDataSourceSelected,
    goToNextStep,
    isNextStepDisabled,
    stepInfo,
    hideLocalCluster,
  } = props;
  const { currentStepNumber, totalStepNumber } = stepInfo;

  const [defaultChecked, setDefaultChecked] = useState(!hideLocalCluster);
  const [dataSourceChecked, setDataSourceChecked] = useState(hideLocalCluster);
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
          // filter out data sources which does NOT have the required backend plugins installed
          if (pluginManifest.hasOwnProperty('requiredOSDataSourcePlugins')) {
            fetchedDataSources = fetchedDataSources.filter((dataSource) =>
              pluginManifest.requiredOSDataSourcePlugins.every((plugin) =>
                dataSource.installedplugins.includes(plugin)
              )
            );
          }

          // filter out data sources which is NOT in the support range of plugin
          if (pluginManifest.hasOwnProperty('supportedOSDataSourceVersions')) {
            fetchedDataSources = fetchedDataSources.filter((dataSource) =>
              semver.satisfies(
                dataSource.datasourceversion,
                pluginManifest.supportedOSDataSourceVersions
              )
            );
          }
          setDataSources(fetchedDataSources);
        }
      })
      .catch(() => {
        toasts.addDanger(
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
            defaultMessage="Pick a data source within which to configure index patterns."
          />
        </EuiText>
        {!hideLocalCluster && (
          <EuiFlexItem grow={false}>
            <EuiSpacer size="m" />
            <EuiRadio
              data-test-subj="createIndexPatternStepDataSourceUseDefaultRadio"
              id={'useDefault'}
              label={
                <FormattedMessage
                  id="indexPatternManagement.createIndexPattern.stepDataSource.useDefaultLabel"
                  defaultMessage="Use default data source"
                />
              }
              checked={defaultChecked}
              onChange={(e) => onChangeDefaultChecked(e)}
              compressed
            />
            <EuiSpacer size="m" />
            <EuiRadio
              data-test-subj="createIndexPatternStepDataSourceUseDataSourceRadio"
              id={'useDataSource'}
              label={
                <FormattedMessage
                  id="indexPatternManagement.createIndexPattern.stepDataSource.useDataSourceLabel"
                  defaultMessage="Use external data source connection"
                />
              }
              checked={dataSourceChecked}
              onChange={(e) => onChangeDataSourceChecked(e)}
              compressed
            />
          </EuiFlexItem>
        )}
        {dataSourceChecked && (
          <EuiFlexItem grow={false}>
            <EuiSpacer size="m" />
            <EuiSelectable
              data-test-subj="createIndexPatternStepDataSourceSelectDataSource"
              aria-label={i18n.translate(
                'indexPatternManagement.createIndexPattern.stepDataSource.searchlabel',
                {
                  defaultMessage: 'Search data sources',
                }
              )}
              searchable
              searchProps={{
                'data-test-subj': 'selectDataSources',
                placeholder: i18n.translate(
                  'indexPatternManagement.createIndexPattern.stepDataSource.searchPlaceHolder',
                  {
                    defaultMessage: 'Search data sources',
                  }
                ),
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
            <EuiSmallButton
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
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      {isLoading ? <LoadingState /> : null}
    </>
  );
};
