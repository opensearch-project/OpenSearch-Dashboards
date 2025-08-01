/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import {
  EuiTitle,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiDescriptionList,
  EuiBadge,
  EuiButtonEmpty,
  EuiHorizontalRule,
  EuiPanel,
  EuiSplitPanel,
  EuiIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DetailedDataset } from './dataset_select';
import { DEFAULT_DATA } from '../../../common/constants';
import { IDataPluginServices } from '../../types';

export interface DatasetDetailsProps {
  dataset?: DetailedDataset;
  isDefault: boolean | false;
}

export const DatasetDetails: React.FC<DatasetDetailsProps> = ({ dataset, isDefault }) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const {
    query: { queryString },
  } = services.data;
  const datasetService = queryString.getDatasetService();

  const handleDataDefinitionClicked = useCallback(async () => {
    if (!dataset || !dataset.dataSource) {
      return;
    }

    services.application!.navigateToApp('dataSources', { path: `/${dataset.dataSource.id}` });
  }, [dataset, services.application]);

  if (!dataset) {
    return null;
  }
  const dataSourceName = dataset.dataSource?.title || `default`;
  const datasetTitle = dataset.displayName || dataset.title;
  const datasetDescription = dataset.description || '';
  const timeFieldName =
    dataset.timeFieldName ||
    i18n.translate('data.datasetDetails.noTimeFilter', {
      defaultMessage: "I don't want to use a time filter",
    });

  return (
    <EuiPanel
      className="datasetDetails__panel"
      color="transparent"
      hasBorder={false}
      paddingSize="none"
    >
      <EuiSplitPanel.Outer
        className="datasetDetails__header"
        direction="row"
        color="transparent"
        hasBorder={false}
        responsive={false}
        grow={true}
      >
        <EuiSplitPanel.Inner paddingSize="none" grow={true}>
          <EuiTitle size="xxxs" className="datasetDetails__title eui-textTruncate">
            <>{datasetTitle}</>
          </EuiTitle>
        </EuiSplitPanel.Inner>
        {isDefault && (
          <EuiSplitPanel.Inner paddingSize="none">
            <EuiBadge
              className="datasetDetails__defaultBadge"
              data-test-subj="datasetDetailsDefault"
            >
              {i18n.translate('data.datasetDetails.defaultLabel', {
                defaultMessage: 'Default',
              })}
            </EuiBadge>
          </EuiSplitPanel.Inner>
        )}
      </EuiSplitPanel.Outer>

      <EuiHorizontalRule margin="s" />

      <EuiDescriptionList
        compressed
        className="datasetDetails__list"
        titleProps={{
          className: 'datasetDetails__listTitle',
        }}
        listItems={[
          ...(datasetDescription
            ? [
                {
                  title: (
                    <EuiText size="xs" color={'ghost'}>
                      {i18n.translate('data.datasetDetails.descriptionTitle', {
                        defaultMessage: 'Description',
                      })}
                    </EuiText>
                  ),
                  description: (
                    <EuiText size="xs" className="datasetDetails__description">
                      <p>{datasetDescription}</p>
                    </EuiText>
                  ),
                },
              ]
            : []),
          {
            title: (
              <EuiText size="xs" color={'ghost'}>
                {i18n.translate('data.datasetDetails.dataDefinitionTitle', {
                  defaultMessage: 'Data definition',
                })}
              </EuiText>
            ),
            description: (
              <EuiButtonEmpty
                className="datasetDetails__dataDefinition"
                data-test-subj="datasetDetailsDataDefinition"
                size="xs"
                color="text"
                onClick={handleDataDefinitionClicked}
                aria-label={i18n.translate('data.datasetDetails.dataDefinitionAriaLabel', {
                  defaultMessage: 'View data definition',
                })}
              >
                <EuiIcon
                  type={
                    dataset.type === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
                      ? 'logoOpenSearch'
                      : datasetService.getType(dataset.type)?.meta?.icon?.type || 'database'
                  }
                  size="s"
                  className="datasetDetails__icon"
                />
                <EuiText
                  size="xs"
                  className="datasetDetails__description datasetDetails__textTruncate"
                >
                  {dataSourceName}
                </EuiText>
              </EuiButtonEmpty>
            ),
          },
          {
            title: (
              <EuiText size="xs" color={'ghost'}>
                {i18n.translate('data.datasetDetails.timeFieldTitle', {
                  defaultMessage: 'Time field',
                })}
              </EuiText>
            ),
            description: (
              <EuiFlexGroup gutterSize="xs" alignItems="center" wrap={false}>
                <EuiFlexItem grow={false}>
                  <EuiText
                    size="xs"
                    className="datasetDetails__description datasetDetails__textTruncate"
                  >
                    {timeFieldName}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            ),
          },
        ]}
      />
    </EuiPanel>
  );
};
