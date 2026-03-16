/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiDescriptionList,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiButtonIcon,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataView, getSchemaConfigs } from '../../../../data/public';
import { useDataSourceTitle } from '../hooks/use_data_source_title';
import './dataset_info_panel.scss';

interface DatasetInfoPanelProps {
  dataset: DataView;
  editConfiguration?: () => void;
}

export const DatasetInfoPanel: React.FC<DatasetInfoPanelProps> = ({
  dataset,
  editConfiguration,
}) => {
  const { dataSourceTitle } = useDataSourceTitle(
    dataset.savedObjectsClient,
    dataset.dataSourceRef?.id
  );

  // Get data source icon based on type
  const getDataSourceIcon = () => {
    // Default to database icon for OpenSearch and other data sources
    // TODO: Return different icons based on data source type (e.g., S3, Prometheus)
    return 'database';
  };

  // Format data scope (data source + title on separate lines)
  const formatDataScope = () => {
    const iconType = getDataSourceIcon();
    const dataSourceName = dataSourceTitle || 'N/A';

    return (
      <>
        {dataset.dataSourceRef?.id && (
          <div>
            <EuiIcon type={iconType} size="m" style={{ marginRight: '8px' }} />
            {dataSourceName}
          </div>
        )}
        <div>{dataset.title || 'N/A'}</div>
      </>
    );
  };

  // Format schema mappings
  const formatSchemaMappings = () => {
    if (!dataset.schemaMappings || Object.keys(dataset.schemaMappings).length === 0) {
      return 'N/A';
    }

    const schemaConfigs = getSchemaConfigs();
    const schemaGroups: Array<{
      schemaDisplayName: string;
      mappings: Array<{ attributeDisplayName: string; fieldName: string }>;
    }> = [];

    // Collect all mappings across all schemas
    let totalMappings = 0;
    Object.entries(dataset.schemaMappings).forEach(([schemaKey, attributes]) => {
      const schemaConfig = schemaConfigs[schemaKey];
      const schemaDisplayName = schemaConfig?.displayName || schemaKey;
      const mappings: Array<{ attributeDisplayName: string; fieldName: string }> = [];

      Object.entries(attributes).forEach(([attributeKey, fieldName]) => {
        const attributeDisplayName =
          schemaConfig?.attributes[attributeKey]?.displayName || attributeKey;
        mappings.push({ attributeDisplayName, fieldName });
      });

      if (mappings.length > 0) {
        schemaGroups.push({ schemaDisplayName, mappings });
        totalMappings += mappings.length;
      }
    });

    if (schemaGroups.length === 0) {
      return 'N/A';
    }

    // Limit to 4 mappings total across all schemas
    const maxMappings = 4;
    let displayedCount = 0;
    const remainingCount = totalMappings - maxMappings;

    // Return JSX with styled schema groups
    return (
      <div className="datasetInfoPanel">
        {schemaGroups.map((group, groupIndex) => {
          if (displayedCount >= maxMappings) {
            return null;
          }

          const mappingsToShow = group.mappings.slice(0, Math.max(0, maxMappings - displayedCount));
          displayedCount += mappingsToShow.length;

          return (
            <div key={groupIndex} className="datasetInfoPanel__schemaGroup">
              <div className="datasetInfoPanel__schemaLabel">{group.schemaDisplayName}</div>
              {mappingsToShow.map((mapping, mappingIndex) => (
                <div key={mappingIndex} className="datasetInfoPanel__mappingRow">
                  <span className="datasetInfoPanel__attributeTag">
                    {mapping.attributeDisplayName}
                  </span>
                  <span className="datasetInfoPanel__fieldName">{mapping.fieldName}</span>
                </div>
              ))}
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="datasetInfoPanel__moreText">
            {i18n.translate('datasetManagement.editDataset.datasetInfoPanel.moreText', {
              defaultMessage: '{count} more',
              values: { count: remainingCount },
            })}
          </div>
        )}
      </div>
    );
  };

  const schemaMappingTitle = (
    <div className="datasetInfoPanel__titleWithButton">
      <span>
        {i18n.translate('datasetManagement.editDataset.datasetInfoPanel.schemaMappingLabel', {
          defaultMessage: 'Schema mapping',
        })}
      </span>
      {editConfiguration && (
        <EuiToolTip
          content={i18n.translate(
            'datasetManagement.editDataset.datasetInfoPanel.editConfigTooltip',
            {
              defaultMessage: 'Edit configuration',
            }
          )}
        >
          <EuiButtonIcon
            size="xs"
            color="text"
            iconType="pencil"
            aria-label={i18n.translate(
              'datasetManagement.editDataset.datasetInfoPanel.editConfigAriaLabel',
              {
                defaultMessage: 'Edit dataset configuration',
              }
            )}
            onClick={editConfiguration}
            data-test-subj="editSchemaConfigurationButton"
          />
        </EuiToolTip>
      )}
    </div>
  );

  const listItems = [
    {
      title: i18n.translate('datasetManagement.editDataset.datasetInfoPanel.typeLabel', {
        defaultMessage: 'Type',
      }),
      description: dataset.signalType || 'N/A',
    },
    {
      title: i18n.translate('datasetManagement.editDataset.datasetInfoPanel.dataScopeLabel', {
        defaultMessage: 'Data scope',
      }),
      description: formatDataScope(),
    },
    {
      title: schemaMappingTitle,
      description: formatSchemaMappings(),
    },
  ];

  return (
    <EuiPanel>
      <EuiFlexGroup gutterSize="l">
        {listItems.map((item, index) => (
          <EuiFlexItem key={index}>
            <EuiDescriptionList
              listItems={[item]}
              compressed
              data-test-subj={`datasetInfoPanel-${item.title}`}
            />
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </EuiPanel>
  );
};
