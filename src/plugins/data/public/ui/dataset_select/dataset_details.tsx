/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, FC } from 'react';
import {
  EuiText,
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
  className?: string;
}

export const DatasetDetailsHeader: FC<DatasetDetailsProps> = ({
  dataset,
  isDefault,
  className = '',
}) => {
  if (!dataset) {
    return null;
  }

  const datasetTitle = dataset.displayName || dataset.title;

  return (
    <EuiSplitPanel.Outer
      className={`datasetDetails__header ${className}`}
      hasBorder={false}
      hasShadow={false}
      color="transparent"
      direction="row"
    >
      <EuiSplitPanel.Inner paddingSize="none">
        <EuiText className="datasetDetails__headerTitle" size="s">
          <h5>{datasetTitle}</h5>
        </EuiText>
      </EuiSplitPanel.Inner>
      {isDefault && (
        <EuiSplitPanel.Inner paddingSize="none">
          <EuiBadge className="datasetDetails__defaultBadge" data-test-subj="datasetDetailsDefault">
            {i18n.translate('data.datasetDetails.defaultLabel', {
              defaultMessage: 'Default',
            })}
          </EuiBadge>
        </EuiSplitPanel.Inner>
      )}
    </EuiSplitPanel.Outer>
  );
};

export const DatasetDetailsBody: FC<DatasetDetailsProps> = ({ dataset, className = '' }) => {
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
  const datasetDescription = dataset.description || '';
  const timeFieldName =
    dataset.timeFieldName ||
    i18n.translate('data.datasetDetails.noTimeFilter', {
      defaultMessage: "I don't want to use a time filter",
    });

  return (
    <EuiDescriptionList
      compressed
      className="datasetDetails__itemList"
      titleProps={{
        className: 'datasetDetails__itemTitle',
      }}
      listItems={[
        ...(datasetDescription
          ? [
              {
                title: (
                  <EuiText size="s">
                    <small>
                      {i18n.translate('data.datasetDetails.descriptionTitle', {
                        defaultMessage: 'Description',
                      })}
                    </small>
                  </EuiText>
                ),
                description: (
                  <EuiText size="xs">
                    <small>{datasetDescription}</small>
                  </EuiText>
                ),
              },
            ]
          : []),
        {
          title: (
            <EuiText size="s">
              <small>
                {i18n.translate('data.datasetDetails.dataDefinitionTitle', {
                  defaultMessage: 'Data definition',
                })}
              </small>
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
                className="datasetDetails__dataDefinition__icon"
              />
              <EuiText size="xs">
                <small>{dataSourceName}</small>
              </EuiText>
            </EuiButtonEmpty>
          ),
        },
        {
          title: (
            <EuiText size="s">
              <small>
                {i18n.translate('data.datasetDetails.timeFieldTitle', {
                  defaultMessage: 'Time field',
                })}
              </small>
            </EuiText>
          ),
          description: (
            <EuiText size="xs">
              <small>{timeFieldName}</small>
            </EuiText>
          ),
        },
      ]}
    />
  );
};

export const DatasetDetails: FC<DatasetDetailsProps> = (props) => {
  if (!props.dataset) {
    return null;
  }

  return (
    <EuiPanel
      className={`datasetDetails__panel ${props.className ?? ''}`}
      color="transparent"
      hasBorder={false}
      paddingSize="none"
    >
      <DatasetDetailsHeader {...props} />
      <EuiHorizontalRule margin="none" />
      <DatasetDetailsBody {...props} />
    </EuiPanel>
  );
};
