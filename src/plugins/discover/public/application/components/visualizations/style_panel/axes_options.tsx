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
  EuiSelect,
  EuiSwitch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldNumber,
  EuiFieldText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { GridOptions as GridConfig, CategoryAxis, ValueAxis } from '../line/line_vis_config';
import { DiscoverVisColumn } from '../types';

interface AxesOptionsProps {
  categoryAxes: CategoryAxis[];
  valueAxes: ValueAxis[];
  onCategoryAxesChange: (categoryAxes: CategoryAxis[]) => void;
  onValueAxesChange: (valueAxes: ValueAxis[]) => void;
  numericalColumns: DiscoverVisColumn[];
  categoricalColumns: DiscoverVisColumn[];
  dateColumns: DiscoverVisColumn[];
}

const getDefaultCategoryAxisTitle = (
  dateColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[]
) => {
  if (dateColumns?.length) {
    return dateColumns[0].name;
  }
  if (categoricalColumns?.length) {
    return categoricalColumns[0].name;
  }
  return 'Category';
};

const getDefaultValueAxisTitle = (numericalColumns?: DiscoverVisColumn[]) => {
  if (numericalColumns?.length) {
    return numericalColumns[0].name;
  }
  return `Metric`;
};

export const AxesOptions: React.FC<AxesOptionsProps> = ({
  categoryAxes,
  valueAxes,
  onCategoryAxesChange,
  onValueAxesChange,
  numericalColumns,
  categoricalColumns,
  dateColumns,
}) => {
  console.log('AxesOptions', categoryAxes, valueAxes);
  const updateCategoryAxis = (index: number, updates: Partial<CategoryAxis>) => {
    const updatedAxes = [...categoryAxes];
    updatedAxes[index] = {
      ...updatedAxes[index],
      ...updates,
    };
    onCategoryAxesChange(updatedAxes);
  };

  const updateValueAxis = (index: number, updates: Partial<ValueAxis>) => {
    const updatedAxes = [...valueAxes];
    updatedAxes[index] = {
      ...updatedAxes[index],
      ...updates,
    };
    onValueAxesChange(updatedAxes);
  };

  const getCategoryAxisDisplayTitle = (axis: CategoryAxis) => {
    if (axis.title?.text && axis.title.text.trim() !== '') {
      return axis.title.text;
    }
    return getDefaultCategoryAxisTitle(dateColumns, categoricalColumns);
  };

  const getValueAxisDisplayTitle = (axis: ValueAxis, index: number) => {
    console.log('getValueAxisDisplayTitle', axis, index);
    if (axis.title?.text && axis.title.text.trim() !== '') {
      return axis.title.text;
    }
    return getDefaultValueAxisTitle(numericalColumns, index);
  };

  return (
    <EuiPanel paddingSize="s">
      <EuiTitle size="xs">
        <h3>
          {i18n.translate('discover.vis.gridOptions.title', {
            defaultMessage: 'Axes',
          })}
        </h3>
      </EuiTitle>

      <EuiSpacer size="m" />

      {/* Category Axis Configuration */}
      <EuiTitle size="xs">
        <h4>
          {i18n.translate('discover.vis.gridOptions.categoryAxis', {
            defaultMessage: 'Category Axis (X-Axis)',
          })}
        </h4>
      </EuiTitle>

      <EuiSpacer size="s" />

      {categoryAxes.map((axis, index) => (
        <div key={axis.id}>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate('discover.vis.gridOptions.axisTitle', {
                  defaultMessage: 'Axis title',
                })}
              >
                <EuiFieldText
                  value={getCategoryAxisDisplayTitle(axis)}
                  onChange={(e) =>
                    updateCategoryAxis(index, {
                      title: { ...axis.title, text: e.target.value },
                    })
                  }
                  placeholder={getCategoryAxisDisplayTitle(axis)}
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate('discover.vis.gridOptions.axisPosition', {
                  defaultMessage: 'Position',
                })}
              >
                <EuiSelect
                  value={axis.position}
                  onChange={(e) =>
                    updateCategoryAxis(index, {
                      position: e.target.value as 'bottom' | 'top',
                    })
                  }
                  options={[
                    { value: 'bottom', text: 'Bottom' },
                    { value: 'top', text: 'Top' },
                  ]}
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="s" />

          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow>
                <EuiSwitch
                  label={i18n.translate('discover.vis.gridOptions.showAxisLinesAndLabels', {
                    defaultMessage: 'Show axis lines and labels',
                  })}
                  checked={axis.show}
                  onChange={(e) => updateCategoryAxis(index, { show: e.target.checked })}
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>

          {axis.show && (
            <>
              <EuiSpacer size="s" />
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFormRow>
                    <EuiSwitch
                      label={i18n.translate('discover.vis.gridOptions.showLabels', {
                        defaultMessage: 'Show labels',
                      })}
                      checked={axis.labels.show}
                      onChange={(e) =>
                        updateCategoryAxis(index, {
                          labels: { ...axis.labels, show: e.target.checked },
                        })
                      }
                    />
                  </EuiFormRow>
                </EuiFlexItem>
              </EuiFlexGroup>

              {axis.labels.show && (
                <>
                  <EuiSpacer size="s" />
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiFormRow
                        label={i18n.translate('discover.vis.gridOptions.labelAlignment', {
                          defaultMessage: 'Aligned',
                        })}
                      >
                        <EuiSelect
                          value={
                            axis.labels.rotate === 0
                              ? 'horizontal'
                              : axis.labels.rotate === -90
                              ? 'vertical'
                              : 'angled'
                          }
                          onChange={(e) => {
                            let rotationValue = 0;
                            if (e.target.value === 'vertical') rotationValue = -90;
                            else if (e.target.value === 'angled') rotationValue = -45;

                            updateCategoryAxis(index, {
                              labels: {
                                ...axis.labels,
                                rotate: rotationValue,
                              },
                            });
                          }}
                          options={[
                            { value: 'horizontal', text: 'Horizontal' },
                            { value: 'vertical', text: 'Vertical' },
                            { value: 'angled', text: 'Angled' },
                          ]}
                        />
                      </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiFormRow
                        label={i18n.translate('discover.vis.gridOptions.labelTruncate', {
                          defaultMessage: 'Truncate at',
                        })}
                      >
                        <EuiFieldNumber
                          value={axis.labels.truncate ?? 100}
                          onChange={(e) => {
                            const truncateValue = parseInt(e.target.value, 10);
                            updateCategoryAxis(index, {
                              labels: {
                                ...axis.labels,
                                truncate: isNaN(truncateValue) ? 100 : truncateValue,
                              },
                            });
                          }}
                          min={10}
                          max={200}
                        />
                      </EuiFormRow>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </>
              )}
            </>
          )}
        </div>
      ))}

      <EuiSpacer size="l" />

      {/* Value Axes Configuration */}
      <EuiTitle size="xs">
        <h4>
          {i18n.translate('discover.vis.gridOptions.valueAxes', {
            defaultMessage: 'Value Axes (Y-Axes)',
          })}
        </h4>
      </EuiTitle>

      <EuiSpacer size="s" />

      {valueAxes.map((axis, index) => (
        <div key={axis.id}>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate('discover.vis.gridOptions.axisTitle', {
                  defaultMessage: 'Axis title',
                })}
              >
                <EuiFieldText
                  value={getValueAxisDisplayTitle(axis, index)}
                  onChange={(e) =>
                    updateValueAxis(index, {
                      title: { ...axis.title, text: e.target.value },
                    })
                  }
                  placeholder={getDefaultValueAxisTitle(numericalColumns, index)}
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate('discover.vis.gridOptions.axisPosition', {
                  defaultMessage: 'Position',
                })}
              >
                <EuiSelect
                  value={axis.position}
                  onChange={(e) =>
                    updateValueAxis(index, {
                      position: e.target.value as 'left' | 'right',
                    })
                  }
                  options={[
                    { value: 'left', text: 'Left' },
                    { value: 'right', text: 'Right' },
                  ]}
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="s" />

          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow>
                <EuiSwitch
                  label={i18n.translate('discover.vis.gridOptions.showAxisLineAndLabels', {
                    defaultMessage: 'Show axis line and labels',
                  })}
                  checked={axis.show}
                  onChange={(e) => updateValueAxis(index, { show: e.target.checked })}
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>

          {axis.show && (
            <>
              <EuiSpacer size="s" />
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFormRow>
                    <EuiSwitch
                      label={i18n.translate('discover.vis.gridOptions.showLabels', {
                        defaultMessage: 'Show labels',
                      })}
                      checked={axis.labels.show}
                      onChange={(e) =>
                        updateValueAxis(index, {
                          labels: { ...axis.labels, show: e.target.checked },
                        })
                      }
                    />
                  </EuiFormRow>
                </EuiFlexItem>
                <EuiFlexItem>{/* Empty flex item for spacing */}</EuiFlexItem>
              </EuiFlexGroup>

              {axis.labels.show && (
                <>
                  <EuiSpacer size="s" />
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiFormRow
                        label={i18n.translate('discover.vis.gridOptions.labelAlignment', {
                          defaultMessage: 'Aligned',
                        })}
                      >
                        <EuiSelect
                          value={
                            axis.labels.rotate === 0
                              ? 'horizontal'
                              : axis.labels.rotate === -90
                              ? 'vertical'
                              : 'angled'
                          }
                          onChange={(e) => {
                            let rotationValue = 0;
                            if (e.target.value === 'vertical') rotationValue = -90;
                            else if (e.target.value === 'angled') rotationValue = -45;

                            updateValueAxis(index, {
                              labels: {
                                ...axis.labels,
                                rotate: rotationValue,
                              },
                            });
                          }}
                          options={[
                            { value: 'horizontal', text: 'Horizontal' },
                            { value: 'vertical', text: 'Vertical' },
                            { value: 'angled', text: 'Angled' },
                          ]}
                        />
                      </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiFormRow
                        label={i18n.translate('discover.vis.gridOptions.labelTruncate', {
                          defaultMessage: 'Truncate at',
                        })}
                      >
                        <EuiFieldNumber
                          value={axis.labels.truncate ?? 100}
                          onChange={(e) => {
                            const truncateValue = parseInt(e.target.value, 10);
                            updateValueAxis(index, {
                              labels: {
                                ...axis.labels,
                                truncate: isNaN(truncateValue) ? 100 : truncateValue,
                              },
                            });
                          }}
                          min={10}
                          max={200}
                        />
                      </EuiFormRow>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </>
              )}
            </>
          )}

          {index < valueAxes.length - 1 && <EuiSpacer size="m" />}
        </div>
      ))}
    </EuiPanel>
  );
};
