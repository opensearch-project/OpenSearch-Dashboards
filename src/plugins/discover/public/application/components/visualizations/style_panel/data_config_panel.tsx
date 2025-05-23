/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiFormRow,
  EuiFieldNumber,
  EuiSelect,
  EuiSwitch,
  EuiFieldText,
  EuiAccordion,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataConfig, EnhancedFieldConfig } from '../line/line_vis_config';
import { DiscoverVisColumn } from '../types';

interface DataConfigPanelProps {
  dataConfig: DataConfig;
  onDataConfigChange: (config: DataConfig) => void;
  numericalColumns?: DiscoverVisColumn[];
  categoricalColumns?: DiscoverVisColumn[];
  dateColumns?: DiscoverVisColumn[];
}

export const DataConfigPanel: React.FC<DataConfigPanelProps> = ({
  dataConfig,
  onDataConfigChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
}) => {
  const updateFieldConfig = (fieldName: string, config: Partial<EnhancedFieldConfig>) => {
    const updatedFieldConfigs = {
      ...dataConfig.fieldConfigs,
      [fieldName]: {
        ...dataConfig.fieldConfigs[fieldName],
        ...config,
      },
    };

    onDataConfigChange({
      ...dataConfig,
      fieldConfigs: updatedFieldConfigs,
    });
  };

  const updateGlobalConfig = (config: Partial<DataConfig>) => {
    onDataConfigChange({
      ...dataConfig,
      ...config,
    });
  };

  const getFieldConfig = (fieldName: string): EnhancedFieldConfig => {
    return dataConfig.fieldConfigs[fieldName] || {};
  };

  const renderFieldConfiguration = (column: DiscoverVisColumn, fieldType: string) => {
    const fieldConfig = getFieldConfig(column.column);

    return (
      <EuiAccordion
        key={column.column}
        id={`field-config-${column.column}`}
        buttonContent={
          <EuiTitle size="xs">
            <h4>
              {column.name} ({fieldType})
            </h4>
          </EuiTitle>
        }
        paddingSize="m"
      >
        <EuiSpacer size="s" />

        {/* Custom Label */}
        <EuiFormRow
          label={i18n.translate('discover.vis.dataConfig.customLabel', {
            defaultMessage: 'Custom label',
          })}
          helpText={i18n.translate('discover.vis.dataConfig.customLabelHelp', {
            defaultMessage: 'Override the default field display name',
          })}
        >
          <EuiFieldText
            value={fieldConfig.customLabel || ''}
            onChange={(e) =>
              updateFieldConfig(column.column, { customLabel: e.target.value || undefined })
            }
            placeholder={column.name}
          />
        </EuiFormRow>

        {/* Categorical Field Controls */}
        {fieldType === 'categorical' && (
          <>
            <EuiSpacer size="s" />
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate('discover.vis.dataConfig.sortBy', {
                    defaultMessage: 'Sort by',
                  })}
                >
                  <EuiSelect
                    value={fieldConfig.sortBy || 'count'}
                    onChange={(e) =>
                      updateFieldConfig(column.column, {
                        sortBy: e.target.value as 'count' | 'alphabetical' | 'metric',
                      })
                    }
                    options={[
                      {
                        value: 'count',
                        text: i18n.translate('discover.vis.dataConfig.sortByCount', {
                          defaultMessage: 'Count',
                        }),
                      },
                      {
                        value: 'alphabetical',
                        text: i18n.translate('discover.vis.dataConfig.sortByAlphabetical', {
                          defaultMessage: 'Alphabetical',
                        }),
                      },
                      {
                        value: 'metric',
                        text: i18n.translate('discover.vis.dataConfig.sortByMetric', {
                          defaultMessage: 'Metric value',
                        }),
                      },
                    ]}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate('discover.vis.dataConfig.sortOrder', {
                    defaultMessage: 'Sort order',
                  })}
                >
                  <EuiSelect
                    value={fieldConfig.sortOrder || 'desc'}
                    onChange={(e) =>
                      updateFieldConfig(column.column, {
                        sortOrder: e.target.value as 'asc' | 'desc',
                      })
                    }
                    options={[
                      {
                        value: 'desc',
                        text: i18n.translate('discover.vis.dataConfig.descending', {
                          defaultMessage: 'Descending',
                        }),
                      },
                      {
                        value: 'asc',
                        text: i18n.translate('discover.vis.dataConfig.ascending', {
                          defaultMessage: 'Ascending',
                        }),
                      },
                    ]}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="s" />
            <EuiFormRow
              label={i18n.translate('discover.vis.dataConfig.maxCategories', {
                defaultMessage: 'Maximum categories',
              })}
              helpText={i18n.translate('discover.vis.dataConfig.maxCategoriesHelp', {
                defaultMessage: 'Limit the number of categories shown',
              })}
            >
              <EuiFieldNumber
                value={fieldConfig.maxCategories || 10}
                onChange={(e) =>
                  updateFieldConfig(column.column, {
                    maxCategories: parseInt(e.target.value, 10) || 10,
                  })
                }
                min={1}
                max={100}
              />
            </EuiFormRow>

            <EuiSpacer size="s" />
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFormRow>
                  <EuiSwitch
                    label={i18n.translate('discover.vis.dataConfig.showOther', {
                      defaultMessage: 'Show "Other" bucket',
                    })}
                    checked={fieldConfig.showOther || false}
                    onChange={(e) =>
                      updateFieldConfig(column.column, { showOther: e.target.checked })
                    }
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow>
                  <EuiSwitch
                    label={i18n.translate('discover.vis.dataConfig.showMissing', {
                      defaultMessage: 'Show missing values',
                    })}
                    checked={fieldConfig.showMissing || false}
                    onChange={(e) =>
                      updateFieldConfig(column.column, { showMissing: e.target.checked })
                    }
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}

        {/* Date Field Controls */}
        {fieldType === 'date' && (
          <>
            <EuiSpacer size="s" />
            <EuiFormRow
              label={i18n.translate('discover.vis.dataConfig.timeInterval', {
                defaultMessage: 'Time interval',
              })}
              helpText={i18n.translate('discover.vis.dataConfig.timeIntervalHelp', {
                defaultMessage: 'Set the time bucketing interval',
              })}
            >
              <EuiSelect
                value={fieldConfig.interval || 'auto'}
                onChange={(e) => updateFieldConfig(column.column, { interval: e.target.value })}
                options={[
                  { value: 'auto', text: 'Auto' },
                  { value: '1m', text: '1 minute' },
                  { value: '5m', text: '5 minutes' },
                  { value: '15m', text: '15 minutes' },
                  { value: '30m', text: '30 minutes' },
                  { value: '1h', text: '1 hour' },
                  { value: '3h', text: '3 hours' },
                  { value: '6h', text: '6 hours' },
                  { value: '12h', text: '12 hours' },
                  { value: '1d', text: '1 day' },
                  { value: '1w', text: '1 week' },
                  { value: '1M', text: '1 month' },
                ]}
              />
            </EuiFormRow>
          </>
        )}

        {/* Metric Field Controls */}
        {fieldType === 'metric' && (
          <>
            <EuiSpacer size="s" />
            <EuiFormRow
              label={i18n.translate('discover.vis.dataConfig.precision', {
                defaultMessage: 'Decimal places',
              })}
              helpText={i18n.translate('discover.vis.dataConfig.precisionHelp', {
                defaultMessage: 'Number of decimal places to display',
              })}
            >
              <EuiFieldNumber
                value={fieldConfig.precision || 2}
                onChange={(e) =>
                  updateFieldConfig(column.column, {
                    precision: parseInt(e.target.value, 10) || 2,
                  })
                }
                min={0}
                max={10}
              />
            </EuiFormRow>
          </>
        )}
      </EuiAccordion>
    );
  };

  return (
    <EuiPanel paddingSize="s">
      <EuiTitle size="xs">
        <h3>
          {i18n.translate('discover.vis.dataConfig.title', {
            defaultMessage: 'Data Configuration',
          })}
        </h3>
      </EuiTitle>

      <EuiSpacer size="m" />

      {/* Global Data Controls */}
      <EuiAccordion
        id="global-data-config"
        buttonContent={
          <EuiTitle size="xs">
            <h4>
              {i18n.translate('discover.vis.dataConfig.globalSettings', {
                defaultMessage: 'Global Settings',
              })}
            </h4>
          </EuiTitle>
        }
        initialIsOpen={true}
        paddingSize="m"
      >
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('discover.vis.dataConfig.maxDataPoints', {
                defaultMessage: 'Maximum data points',
              })}
              helpText={i18n.translate('discover.vis.dataConfig.maxDataPointsHelp', {
                defaultMessage: 'Limit total number of data points',
              })}
            >
              <EuiFieldNumber
                value={dataConfig.maxDataPoints}
                onChange={(e) =>
                  updateGlobalConfig({
                    maxDataPoints: parseInt(e.target.value, 10) || 1000,
                  })
                }
                min={100}
                max={10000}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('discover.vis.dataConfig.missingValueHandling', {
                defaultMessage: 'Missing values',
              })}
              helpText={i18n.translate('discover.vis.dataConfig.missingValueHandlingHelp', {
                defaultMessage: 'How to handle missing or null values',
              })}
            >
              <EuiSelect
                value={dataConfig.missingValueHandling}
                onChange={(e) =>
                  updateGlobalConfig({
                    missingValueHandling: e.target.value as 'ignore' | 'zero' | 'interpolate',
                  })
                }
                options={[
                  {
                    value: 'ignore',
                    text: i18n.translate('discover.vis.dataConfig.ignore', {
                      defaultMessage: 'Ignore',
                    }),
                  },
                  {
                    value: 'zero',
                    text: i18n.translate('discover.vis.dataConfig.treatAsZero', {
                      defaultMessage: 'Treat as zero',
                    }),
                  },
                  {
                    value: 'interpolate',
                    text: i18n.translate('discover.vis.dataConfig.interpolate', {
                      defaultMessage: 'Interpolate',
                    }),
                  },
                ]}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiAccordion>

      <EuiSpacer size="m" />

      {/* Field-specific configurations */}
      {numericalColumns.map((column) => renderFieldConfiguration(column, 'metric'))}
      {categoricalColumns.map((column) => renderFieldConfiguration(column, 'categorical'))}
      {dateColumns.map((column) => renderFieldConfiguration(column, 'date'))}
    </EuiPanel>
  );
};
