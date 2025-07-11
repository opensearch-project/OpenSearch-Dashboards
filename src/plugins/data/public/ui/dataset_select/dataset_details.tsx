/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
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
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataView as Dataset } from '../../../common/data_views';
import { IDataPluginServices } from '../../types';

export interface DatasetDetailsProps {
  dataset?: Dataset;
}

export const DatasetDetails: React.FC<DatasetDetailsProps> = ({ dataset }) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const [isOpen, setIsOpen] = useState(false);
  const {
    query: { queryString },
  } = services.data;
  const datasetService = queryString.getDatasetService();

  const togglePopover = useCallback(() => setIsOpen(!isOpen), [isOpen]);
  const closePopover = useCallback(() => setIsOpen(false), []);

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
      <EuiPopoverTitle>{datasetTitle}</EuiPopoverTitle>

      <EuiDescriptionList textStyle="reverse" compressed>
        {datasetDescription && (
          <>
            <EuiDescriptionListTitle>
              {i18n.translate('data.datasetDetails.descriptionTitle', {
                defaultMessage: 'Description',
              })}
            </EuiDescriptionListTitle>
            <EuiDescriptionListDescription>
              <EuiText size="xs">
                <p>{datasetDescription}</p>
              </EuiText>
            </EuiDescriptionListDescription>
          </>
        )}

        <EuiDescriptionListTitle>
          {i18n.translate('data.datasetDetails.dataDefinitionTitle', {
            defaultMessage: 'Definition',
          })}
        </EuiDescriptionListTitle>
        <EuiDescriptionListDescription>
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
        </EuiDescriptionListDescription>

        <EuiDescriptionListTitle>
          {i18n.translate('data.datasetDetails.timeFieldTitle', {
            defaultMessage: 'Time field',
          })}
        </EuiDescriptionListTitle>
        <EuiDescriptionListDescription>
          <EuiSelect
            options={buildTimeFieldOptions()}
            value={timeFieldName}
            onChange={() => {}}
            disabled={true}
            data-test-subj="datasetDetailsTimeFieldSelect"
            compressed
            className="datasetDetails__timeField"
          />
        </EuiDescriptionListDescription>
      </EuiDescriptionList>

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
