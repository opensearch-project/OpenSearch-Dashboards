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
  EuiSpacer,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSmallButton,
  EuiPanel,
  EuiSelect,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { Dataset } from '../../../common/datasets/datasets/dataset';
import { IDataPluginServices } from '../../types';

export interface DatasetDetailsProps {
  dataset?: Dataset;
}

export const DatasetDetails: React.FC<DatasetDetailsProps> = ({ dataset }) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const [isOpen, setIsOpen] = useState(false);
  const queryService = services.data.query;
  const datasetService = queryService.queryString.getDatasetService();

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

      <EuiFlexGroup gutterSize="xs" direction="column">
        {datasetDescription && (
          <EuiFlexItem>
            <EuiPanel paddingSize="s" hasShadow={false} hasBorder={true}>
              <EuiFlexGroup direction="column" gutterSize="xs">
                <EuiFlexItem>
                  <EuiText size="xs">
                    <strong>
                      {i18n.translate('data.datasetDetails.descriptionTitle', {
                        defaultMessage: 'Description',
                      })}
                    </strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText size="xs">
                    <p>{datasetDescription}</p>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        )}

        <EuiFlexItem>
          <EuiPanel paddingSize="s" hasShadow={false} hasBorder={true}>
            <EuiFlexGroup direction="column" gutterSize="xs">
              <EuiFlexItem>
                <EuiText size="xs">
                  <strong>
                    {i18n.translate('data.datasetDetails.dataDefinitionTitle', {
                      defaultMessage: 'Definition',
                    })}
                  </strong>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
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
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiPanel paddingSize="s" hasShadow={false} hasBorder={true}>
            <EuiFlexGroup direction="column" gutterSize="xs">
              <EuiFlexItem>
                <EuiText size="xs">
                  <strong>
                    {i18n.translate('data.datasetDetails.timeFieldTitle', {
                      defaultMessage: 'Time field',
                    })}
                  </strong>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSelect
                  options={buildTimeFieldOptions()}
                  value={timeFieldName}
                  onChange={() => {}}
                  disabled={true}
                  data-test-subj="datasetDetailsTimeFieldSelect"
                  compressed
                  className="datasetDetails__timeField"
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

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
