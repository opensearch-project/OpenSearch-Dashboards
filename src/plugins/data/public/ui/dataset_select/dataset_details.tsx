/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import {
  EuiSmallButtonEmpty,
  EuiPopover,
  EuiPopoverTitle,
  EuiTitle,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiDescriptionList,
  EuiBadge,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataView as Dataset } from '../../../common/data_views';
import { DEFAULT_DATA } from '../../../common/constants';
import { IDataPluginServices } from '../../types';

export interface DatasetDetailsProps {
  dataset?: Dataset;
  isDefault: boolean | false;
}

export const DatasetDetails: React.FC<DatasetDetailsProps> = ({ dataset, isDefault }) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const [isOpen, setIsOpen] = useState(false);
  const {
    dataViews,
    query: { queryString },
  } = services.data;
  const datasetService = queryString.getDatasetService();

  const togglePopover = useCallback(() => setIsOpen(!isOpen), [isOpen]);
  const closePopover = useCallback(() => setIsOpen(false), []);

  const handleDataDefinitionClicked = useCallback(async () => {
    if (!dataset || !dataset.dataSourceRef) {
      return;
    }

    services.application!.navigateToApp('dataSources', { path: `/${dataset.dataSourceRef.id}` });
  }, [dataset, services.application]);

  const getTypeFromUri = useCallback((uri?: string): string | undefined => {
    if (!uri) return undefined;

    if (uri.includes('://')) {
      const parts = uri.split('://');
      if (parts.length >= 2) {
        return parts[0].toUpperCase();
      }
    }

    return undefined;
  }, []);

  if (!dataset) {
    return null;
  }

  const datasetType =
    getTypeFromUri(dataset.dataSourceRef?.name) || dataViews.convertToDataset(dataset).type;
  const dataSourceName = dataset.dataSourceRef?.name || `default`;
  const datasetTitle = dataset.displayName || dataset.title;
  const datasetDescription = dataset.description || '';
  const timeFieldName =
    dataset.timeFieldName ||
    i18n.translate('data.datasetDetails.noTimeFilter', {
      defaultMessage: "I don't want to use a time filter",
    });

  return (
    <EuiPopover
      button={
        <EuiSmallButtonEmpty
          className="datasetDetails__button"
          data-test-subj="datasetDetailsButton"
          color="text"
          iconType="boxesHorizontal"
          onClick={togglePopover}
          aria-label={i18n.translate('data.datasetDetails.buttonAriaLabel', {
            defaultMessage: 'Dataset details',
          })}
        />
      }
      isOpen={isOpen}
      closePopover={closePopover}
      anchorPosition="downRight"
      panelPaddingSize="s"
      panelClassName="datasetDetails__panel"
    >
      <EuiPopoverTitle>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s">
          <EuiFlexItem>
            {
              <EuiTitle size="xxxs">
                <>{datasetTitle}</>
              </EuiTitle>
            }
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge
              color={isDefault ? 'default' : 'hollow'}
              className="datasetDetails__defaultBadge"
              data-test-subj="datasetDetailsDefault"
            >
              {i18n.translate('data.datasetDetails.defaultLabel', {
                defaultMessage: 'Default',
              })}
            </EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPopoverTitle>

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
                    <EuiText size="xs">
                      {i18n.translate('data.datasetDetails.descriptionTitle', {
                        defaultMessage: 'Description',
                      })}
                    </EuiText>
                  ),
                  description: (
                    <EuiText size="xs" color="subdued">
                      <p>{datasetDescription}</p>
                    </EuiText>
                  ),
                },
              ]
            : []),
          {
            title: (
              <EuiText size="xs">
                {i18n.translate('data.datasetDetails.dataDefinitionTitle', {
                  defaultMessage: 'Data definition',
                })}
              </EuiText>
            ),
            description: (
              <EuiBadge
                color="hollow"
                iconType={
                  (datasetType === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
                    ? 'logoOpenSearch'
                    : datasetService.getType(datasetType)?.meta.icon.type)!
                }
                onClick={handleDataDefinitionClicked}
                onClickAriaLabel={i18n.translate('data.datasetDetails.dataDefinitionAriaLabel', {
                  defaultMessage: 'View data definition',
                })}
                className="datasetDetails__dataDefinition"
                data-test-subj="datasetDetailsDataDefinition"
              >
                <EuiFlexGroup gutterSize="xs" alignItems="center" wrap={false}>
                  <EuiFlexItem grow={false}>
                    <EuiText size="xs" className="datasetDetails__textTruncate">
                      {dataSourceName}
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiBadge>
            ),
          },
          {
            title: (
              <EuiText size="xs">
                {i18n.translate('data.datasetDetails.timeFieldTitle', {
                  defaultMessage: 'Time field',
                })}
              </EuiText>
            ),
            description: (
              <EuiFlexGroup gutterSize="xs" alignItems="center" wrap={false}>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs" color="subdued" className="datasetDetails__textTruncate">
                    {timeFieldName}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            ),
          },
        ]}
      />

      {/* TODO: Add footer back when dataset management is ready */}
      {/* <EuiPopoverFooter paddingSize="s">
        <EuiFlexGroup
          justifyContent="spaceBetween"
          alignItems="center"
          responsive={false}
          className="datasetDetails__footer"
        >
          <EuiFlexItem grow={false} className="datasetDetails__footerItem">
            <EuiButton
              className="datasetDetails__viewButton"
              data-test-subj="datasetDetailsViewButton"
              size="s"
              isSelected={false}
              onClick={closePopover}
            >
              {i18n.translate('data.datasetDetails.viewDatasetButton', {
                defaultMessage: 'View dataset',
              })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPopoverFooter> */}
    </EuiPopover>
  );
};
