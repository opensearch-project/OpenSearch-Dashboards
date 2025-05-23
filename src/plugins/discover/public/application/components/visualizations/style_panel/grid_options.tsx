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
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { GridOptions as GridConfig, CategoryAxis, ValueAxis } from '../line/line_vis_config';

interface GridOptionsProps {
  grid: GridConfig;
  categoryAxes: CategoryAxis[];
  valueAxes: ValueAxis[];
  onGridChange: (grid: GridConfig) => void;
  onCategoryAxesChange: (categoryAxes: CategoryAxis[]) => void;
  onValueAxesChange: (valueAxes: ValueAxis[]) => void;
}

export const GridOptions: React.FC<GridOptionsProps> = ({
  grid,
  categoryAxes,
  valueAxes,
  onGridChange,
  onCategoryAxesChange,
  onValueAxesChange,
}) => {
  const updateGridOption = <K extends keyof GridConfig>(key: K, value: GridConfig[K]) => {
    onGridChange({
      ...grid,
      [key]: value,
    });
  };

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

  return (
    <EuiPanel paddingSize="s">
      <EuiTitle size="xs">
        <h3>
          {i18n.translate('discover.vis.gridOptions.title', {
            defaultMessage: 'Grid & Axes',
          })}
        </h3>
      </EuiTitle>

      <EuiSpacer size="m" />

      {/* Grid Options */}
      <EuiTitle size="xs">
        <h4>
          {i18n.translate('discover.vis.gridOptions.gridSettings', {
            defaultMessage: 'Grid Settings',
          })}
        </h4>
      </EuiTitle>

      <EuiSpacer size="s" />

      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow>
            <EuiSwitch
              label={i18n.translate('discover.vis.gridOptions.showCategoryLines', {
                defaultMessage: 'Show category lines',
              })}
              checked={grid.categoryLines}
              onChange={(e) => updateGridOption('categoryLines', e.target.checked)}
            />
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow>
            <EuiSwitch
              label={i18n.translate('discover.vis.gridOptions.showValueLines', {
                defaultMessage: 'Show value lines',
              })}
              checked={grid.valueLines}
              onChange={(e) => updateGridOption('valueLines', e.target.checked)}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

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
                <EuiSelect
                  value={axis.title?.text || ''}
                  onChange={(e) =>
                    updateCategoryAxis(index, {
                      title: { ...axis.title, text: e.target.value },
                    })
                  }
                  options={[
                    { value: '', text: 'None' },
                    { value: 'auto', text: 'Auto' },
                    { value: 'custom', text: 'Custom' },
                  ]}
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
                  label={i18n.translate('discover.vis.gridOptions.showAxis', {
                    defaultMessage: 'Show axis',
                  })}
                  checked={axis.show}
                  onChange={(e) => updateCategoryAxis(index, { show: e.target.checked })}
                />
              </EuiFormRow>
            </EuiFlexItem>
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
                    label={i18n.translate('discover.vis.gridOptions.labelRotation', {
                      defaultMessage: 'Label rotation',
                    })}
                  >
                    <EuiFieldNumber
                      value={axis.labels.rotate}
                      onChange={(e) =>
                        updateCategoryAxis(index, {
                          labels: {
                            ...axis.labels,
                            rotate: parseInt(e.target.value, 10) || 0,
                          },
                        })
                      }
                      min={-90}
                      max={90}
                      step={15}
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
                      value={axis.labels.truncate}
                      onChange={(e) =>
                        updateCategoryAxis(index, {
                          labels: {
                            ...axis.labels,
                            truncate: parseInt(e.target.value, 10) || 100,
                          },
                        })
                      }
                      min={10}
                      max={200}
                    />
                  </EuiFormRow>
                </EuiFlexItem>
              </EuiFlexGroup>
            </>
          )}
        </div>
      ))}

      <EuiSpacer size="m" />

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
          <EuiTitle size="xs">
            <h5>{axis.name || axis.id}</h5>
          </EuiTitle>

          <EuiSpacer size="s" />

          <EuiFlexGroup>
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
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate('discover.vis.gridOptions.scaleType', {
                  defaultMessage: 'Scale type',
                })}
              >
                <EuiSelect
                  value={axis.scale.type}
                  onChange={(e) =>
                    updateValueAxis(index, {
                      scale: {
                        ...axis.scale,
                        type: e.target.value as 'linear' | 'log',
                      },
                    })
                  }
                  options={[
                    { value: 'linear', text: 'Linear' },
                    { value: 'log', text: 'Log' },
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
                  label={i18n.translate('discover.vis.gridOptions.showAxis', {
                    defaultMessage: 'Show axis',
                  })}
                  checked={axis.show}
                  onChange={(e) => updateValueAxis(index, { show: e.target.checked })}
                />
              </EuiFormRow>
            </EuiFlexItem>
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
          </EuiFlexGroup>

          {index < valueAxes.length - 1 && <EuiSpacer size="m" />}
        </div>
      ))}
    </EuiPanel>
  );
};
