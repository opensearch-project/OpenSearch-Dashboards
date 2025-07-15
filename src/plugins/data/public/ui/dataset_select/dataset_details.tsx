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
  EuiIcon,
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
  const [isDefaultDataset, setIsDefaultDataset] = useState(isDefault);
  const {
    query: { queryString },
    dataViews,
  } = services.data;
  const datasetService = queryString.getDatasetService();

  const togglePopover = useCallback(() => setIsOpen(!isOpen), [isOpen]);
  const closePopover = useCallback(() => setIsOpen(false), []);

  const handleDefaultDatasetClicked = useCallback(async () => {
    if (!dataset) return;

    if (isDefaultDataset) {
      return;
    } else {
      await dataViews.setDefault(dataset.id as string, true);
      setIsDefaultDataset(true);
    }
  }, [dataset, isDefaultDataset, dataViews]);

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
    getTypeFromUri(dataset.dataSourceRef?.name) ||
    dataset.type ||
    DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;
  const datasetIcon = datasetService.getType(datasetType)?.meta.icon.type || 'database';

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
            <div
              onClick={handleDefaultDatasetClicked}
              data-test-subj="datasetDetailsDefaultButton"
              tabIndex={0}
              onKeyDown={() => {}}
            >
              <EuiBadge
                color={isDefault ? 'default' : 'hollow'}
                className="datasetDetails__defaultBadge"
              >
                {i18n.translate('data.datasetDetails.defaultLabel', {
                  defaultMessage: 'Default',
                })}
              </EuiBadge>
            </div>
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
                  defaultMessage: 'Data Definition',
                })}
              </EuiText>
            ),
            description: (
              <EuiFlexGroup gutterSize="xs" alignItems="center" wrap={false}>
                <EuiFlexItem grow={false}>
                  <EuiIcon type={datasetIcon} size="s" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs" color="subdued" className="datasetDetails__textTruncate">
                    {dataSourceName}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
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
