/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  EuiSmallButtonEmpty,
  EuiPopover,
  EuiPopoverTitle,
  EuiPopoverFooter,
  EuiText,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSmallButton,
  EuiSelect,
  EuiDescriptionList,
  EuiBadge,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataView as Dataset } from '../../../common/data_views';
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
    dataViews: datasetsService,
  } = services.data;
  const datasetService = queryString.getDatasetService();

  const togglePopover = useCallback(() => setIsOpen(!isOpen), [isOpen]);
  const closePopover = useCallback(() => setIsOpen(false), []);

  const toggleDefault = useCallback(async () => {
    if (!dataset) return;

    if (isDefault) {
      return;
    } else {
      await datasetsService.setDefault(dataset.id as string, true);
      setIsDefaultDataset(true);
    }
  }, [dataset, isDefault, datasetsService]);

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

  const buildTimeFieldOptions = useCallback(() => {
    if (!dataset || !dataset.fields) {
      return [];
    }

    const dateFields = dataset.fields.getAll().filter((field) => field.type === 'date');
    const noTimeFilter = i18n.translate('data.datasetDetails.noTimeFilter', {
      defaultMessage: "I don't want to use a time filter",
    });

    return [
      ...dateFields.map((field) => ({
        text: field.name,
        value: field.name,
      })),
      { text: '-----', value: '-----', disabled: true },
      { text: noTimeFilter, value: noTimeFilter },
    ];
  }, [dataset]);

  if (!dataset) {
    return null;
  }

  const datasetType = getTypeFromUri(dataset.dataSourceRef?.name) || dataset.type || '';
  const datasetIcon = datasetService.getType(datasetType)?.meta.icon.type || 'database';
  const datasetTitle = dataset.displayName || dataset.title;
  const datasetDescription = dataset.description || '';
  const dataSourceName = dataset.dataSourceRef?.name || '';
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
          <EuiFlexItem>{datasetTitle}</EuiFlexItem>
          <EuiFlexItem grow={false}>
            <div
              onClick={toggleDefault}
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
                    <EuiText size="xs">
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
                  defaultMessage: 'Definition',
                })}
              </EuiText>
            ),
            description: (
              <EuiFlexGroup gutterSize="xs" alignItems="center" wrap={false}>
                <EuiFlexItem grow={false}>
                  <EuiIcon type={datasetIcon} size="s" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs" className="datasetDetails__textTruncate">
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
              <EuiSelect
                options={buildTimeFieldOptions()}
                value={timeFieldName}
                onChange={() => {}}
                disabled={true}
                data-test-subj="datasetDetailsTimeFieldSelect"
                compressed
                className="datasetDetails__timeField"
              />
            ),
          },
        ]}
      />

      <EuiPopoverFooter paddingSize="s">
        <EuiFlexGroup justifyContent="center" alignItems="center" responsive={false}>
          <EuiFlexItem>
            <EuiSmallButton onClick={closePopover} data-test-subj="datasetDetailsViewButton">
              {i18n.translate('data.datasetDetails.viewDatasetButton', {
                defaultMessage: 'View dataset',
              })}
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPopoverFooter>
    </EuiPopover>
  );
};
